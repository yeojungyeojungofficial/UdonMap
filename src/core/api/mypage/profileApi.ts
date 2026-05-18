import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/src/core/userProfiles";

let cachedUserProfile: UserProfile | null = null;
let pendingUserProfileRequest: {
  accessToken: string;
  promise: Promise<UserProfile>;
  userId: string;
} | null = null;

type UserProfileResponse =
  | {
      profile: UserProfile;
    }
  | {
      error: string;
    };

async function requestUserProfile(
  session: Session,
  init?: RequestInit,
): Promise<UserProfile> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch("/api/me/profile", {
    ...init,
    headers,
  });
  const result = (await response.json().catch(() => null)) as
    | UserProfileResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "프로필 요청에 실패했습니다.",
    );
  }

  cachedUserProfile = result.profile;
  return result.profile;
}

export function getCachedCurrentUserProfile(userId: string) {
  return cachedUserProfile?.id === userId ? cachedUserProfile : null;
}

export function setCachedCurrentUserProfile(profile: UserProfile) {
  cachedUserProfile = profile;
  pendingUserProfileRequest = null;
}

export function clearCachedCurrentUserProfile() {
  cachedUserProfile = null;
  pendingUserProfileRequest = null;
}

export function fetchCurrentUserProfile(session: Session) {
  const cachedProfile = getCachedCurrentUserProfile(session.user.id);

  if (cachedProfile) {
    return Promise.resolve(cachedProfile);
  }

  if (
    pendingUserProfileRequest?.userId === session.user.id &&
    pendingUserProfileRequest.accessToken === session.access_token
  ) {
    return pendingUserProfileRequest.promise;
  }

  const request = requestUserProfile(session, {
    method: "GET",
  }).finally(() => {
    if (pendingUserProfileRequest?.promise === request) {
      pendingUserProfileRequest = null;
    }
  });

  pendingUserProfileRequest = {
    accessToken: session.access_token,
    promise: request,
    userId: session.user.id,
  };

  return request;
}

export function saveCurrentUserProfile(
  session: Session,
  displayName: string,
) {
  pendingUserProfileRequest = null;
  return requestUserProfile(session, {
    method: "PATCH",
    body: JSON.stringify({ displayName }),
  });
}

import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/src/shared/lib/userProfiles";

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

  return result.profile;
}

export function fetchCurrentUserProfile(session: Session) {
  return requestUserProfile(session, {
    method: "GET",
  });
}

export function saveCurrentUserProfile(
  session: Session,
  displayName: string,
) {
  return requestUserProfile(session, {
    method: "PATCH",
    body: JSON.stringify({ displayName }),
  });
}

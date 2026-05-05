import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/src/shared/lib/database.types";

export const USER_PROFILE_COLUMNS =
  "id,email,display_name,created_at,updated_at";
export const MAX_DISPLAY_NAME_LENGTH = 40;

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export type UserProfileUpdate = Pick<
  Database["public"]["Tables"]["profiles"]["Update"],
  "display_name"
>;

export type UserProfileValidationResult =
  | {
      ok: true;
      value: {
        displayName: string | null;
      };
    }
  | {
      ok: false;
      message: string;
    };

export function getDefaultDisplayName(email: string | null | undefined) {
  const localPart = email?.split("@")[0]?.trim();
  return localPart || null;
}

export function validateUserProfileUpdate(
  body: unknown,
): UserProfileValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const displayNameValue = (body as { displayName?: unknown }).displayName;
  const displayName =
    typeof displayNameValue === "string" ? displayNameValue.trim() : "";

  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      message: `닉네임은 ${MAX_DISPLAY_NAME_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  return {
    ok: true,
    value: {
      displayName: displayName || null,
    },
  };
}

async function selectUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(USER_PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase profiles 조회 실패: ${error.message}`);
  }

  return data;
}

async function createUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      display_name: getDefaultDisplayName(user.email),
    })
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      const existingProfile = await selectUserProfile(supabase, user.id);

      if (existingProfile) {
        return existingProfile;
      }
    }

    throw new Error(`Supabase profiles 생성 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("Supabase profiles 생성 결과가 비어있습니다.");
  }

  return data;
}

export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
) {
  const existingProfile = await selectUserProfile(supabase, user.id);
  const email = user.email ?? null;

  if (!existingProfile) {
    return createUserProfile(supabase, user);
  }

  if (existingProfile.email === email) {
    return existingProfile;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ email })
    .eq("id", user.id)
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Supabase profiles 이메일 동기화 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("Supabase profiles 이메일 동기화 결과가 비어있습니다.");
  }

  return data;
}

export async function updateUserProfile(
  supabase: SupabaseClient<Database>,
  user: User,
  update: UserProfileUpdate,
) {
  const existingProfile = await ensureUserProfile(supabase, user);
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...update,
      email: user.email ?? existingProfile.email,
    })
    .eq("id", user.id)
    .select(USER_PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Supabase profiles 수정 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("Supabase profiles 수정 결과가 비어있습니다.");
  }

  return data;
}

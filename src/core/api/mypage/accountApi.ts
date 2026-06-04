import type { Session } from "@supabase/supabase-js";

type DeleteAccountResponse =
  | {
      ok: true;
    }
  | {
      error: string;
    };

export async function deleteCurrentUserAccount(session: Session) {
  const response = await fetch("/api/me/account", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const result = (await response.json().catch(() => null)) as
    | DeleteAccountResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "회원탈퇴 요청에 실패했습니다.",
    );
  }

  return result;
}

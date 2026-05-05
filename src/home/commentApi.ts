import type { HospitalComment } from "@/src/home/types";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";

type CreateHospitalCommentResponse =
  | {
      comment: HospitalComment;
    }
  | {
      error: string;
    };

export async function createHospitalComment(
  hospitalId: string,
  content: string,
) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Supabase 세션 조회 실패: ${sessionError.message}`);
  }

  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const response = await fetch(`/api/hospitals/${hospitalId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const result = (await response.json().catch(() => null)) as
    | CreateHospitalCommentResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "댓글 저장에 실패했습니다.",
    );
  }

  return result.comment;
}

import type { ReactionSnapshot, ReactionType } from "@/src/home/types";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";

type ReactionResponse =
  | {
      reaction: ReactionSnapshot;
    }
  | {
      error: string;
    };

async function getAccessToken() {
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

  return session.access_token;
}

async function requestReaction(url: string, reaction: ReactionType) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reaction }),
  });
  const result = (await response.json().catch(() => null)) as
    | ReactionResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "반응 저장에 실패했습니다.",
    );
  }

  return result.reaction;
}

export function updateHospitalReaction(
  hospitalId: string,
  reaction: ReactionType,
) {
  return requestReaction(`/api/hospitals/${hospitalId}/reaction`, reaction);
}

export function updateHospitalCommentReaction(
  hospitalId: string,
  commentId: string,
  reaction: ReactionType,
) {
  return requestReaction(
    `/api/hospitals/${hospitalId}/comments/${commentId}/reaction`,
    reaction,
  );
}

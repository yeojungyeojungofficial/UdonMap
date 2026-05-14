import { loadAuthSession } from "@/src/core/authSession";
import { getSupabaseBrowserClient } from "@/src/core/supabase";
import { isMissingBookmarksTableError } from "@/src/features/hospitals/bookmarkErrors";
import type {
  HospitalComment,
  ReactionSnapshot,
  ReactionType,
} from "@/src/features/hospitals/types";

type HospitalCommentResponse =
  | {
      comment: HospitalComment;
    }
  | {
      commentId: string;
    }
  | {
      error: string;
    };

type ReactionResponse =
  | {
      reaction: ReactionSnapshot;
    }
  | {
      error: string;
    };

async function getAuthContext() {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);

  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  return {
    accessToken: session.access_token,
    session,
    supabase,
  };
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

export async function updateHospitalBookmark(
  hospitalId: string,
  shouldBookmark: boolean,
) {
  const { session, supabase } = await getAuthContext();

  if (shouldBookmark) {
    const { error } = await supabase.from("hospital_bookmarks").upsert(
      {
        hospital_id: hospitalId,
        user_id: session.user.id,
      },
      {
        onConflict: "hospital_id,user_id",
      },
    );

    if (error) {
      if (isMissingBookmarksTableError(error)) {
        throw new Error("찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.");
      }

      throw new Error(`Supabase hospital_bookmarks 저장 실패: ${error.message}`);
    }

    return true;
  }

  const { error } = await supabase
    .from("hospital_bookmarks")
    .delete()
    .eq("hospital_id", hospitalId)
    .eq("user_id", session.user.id);

  if (error) {
    if (isMissingBookmarksTableError(error)) {
      throw new Error("찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.");
    }

    throw new Error(`Supabase hospital_bookmarks 삭제 실패: ${error.message}`);
  }

  return false;
}

export async function createHospitalComment(
  hospitalId: string,
  content: string,
) {
  const { accessToken } = await getAuthContext();
  const response = await fetch(`/api/hospitals/${hospitalId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const result = await parseJson<HospitalCommentResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "댓글 저장에 실패했습니다.",
    );
  }

  if (!("comment" in result)) {
    throw new Error("댓글 저장 응답이 올바르지 않습니다.");
  }

  return result.comment;
}

export async function deleteHospitalComment(
  hospitalId: string,
  commentId: string,
) {
  const { accessToken } = await getAuthContext();
  const response = await fetch(`/api/hospitals/${hospitalId}/comments`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commentId }),
  });
  const result = await parseJson<HospitalCommentResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "댓글 삭제에 실패했습니다.",
    );
  }

  if (!("commentId" in result)) {
    throw new Error("댓글 삭제 응답이 올바르지 않습니다.");
  }

  return result.commentId;
}

async function requestReaction(url: string, reaction: ReactionType) {
  const { accessToken } = await getAuthContext();
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reaction }),
  });
  const result = await parseJson<ReactionResponse>(response);

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

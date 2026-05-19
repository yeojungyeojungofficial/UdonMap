import { getSupabaseBrowserClient } from "@/src/core/supabase";
import { loadAuthSession } from "@/src/core/authSession";
import type { Database } from "@/src/core/database.types";
import type { Hospital, ReactionType } from "@/src/features/hospitals/types";
import {
  toHospitalComment,
  type HospitalCommentRow,
} from "@/src/features/hospitals/comments";
import { toReactionMap } from "@/src/features/hospitals/hospitalRows";

type HospitalCommentReactionRow = Pick<
  Database["public"]["Tables"]["hospital_comment_reactions"]["Row"],
  "comment_id" | "reaction_type"
>;

type HospitalsResponse =
  | {
      hospitals: Hospital[];
    }
  | {
      error: string;
    };

type HospitalCommentsResponse =
  | {
      comments: HospitalCommentRow[];
    }
  | {
      error: string;
    };

export async function fetchHospitals() {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);
  const response = await fetch("/api/hospitals", {
    headers: session
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : undefined,
  });
  const result = (await response.json().catch(() => null)) as
    | HospitalsResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "병원 목록을 불러오지 못했습니다.",
    );
  }

  return result.hospitals;
}

export async function fetchHospitalComments(hospitalId: string) {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);
  const response = await fetch(
    `/api/hospitals/${encodeURIComponent(hospitalId)}/comments`,
    {
      headers: session
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : undefined,
    },
  );
  const result = (await response.json().catch(() => null)) as
    | HospitalCommentsResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "병원 댓글을 불러오지 못했습니다.",
    );
  }

  const comments = result.comments;
  const commentIds = comments.map((comment) => comment.id);
  let reactionsByCommentId = new Map<string, ReactionType>();

  if (session && commentIds.length > 0) {
    const { data: commentReactionData, error: commentReactionError } =
      await supabase
        .from("hospital_comment_reactions")
        .select("comment_id,reaction_type")
        .eq("user_id", session.user.id)
        .in("comment_id", commentIds);

    if (commentReactionError) {
      throw new Error(
        `Supabase hospital_comment_reactions 조회 실패: ${commentReactionError.message}`,
      );
    }

    reactionsByCommentId = toReactionMap(
      (commentReactionData ?? []) as HospitalCommentReactionRow[],
      "comment_id",
    );
  }

  return comments.map((comment) =>
    toHospitalComment(comment, reactionsByCommentId.get(comment.id) ?? null),
  );
}

import type { ReactionSnapshot, ReactionType } from "@/src/home/types";

export type ReactionRequest = {
  reaction: ReactionType;
};

export type ReactionValidationResult =
  | {
      ok: true;
      value: ReactionRequest;
    }
  | {
      ok: false;
      message: string;
    };

export type HospitalReactionRpcRow = {
  likes: number;
  dislikes: number;
  reaction_type: ReactionType | null;
};

export type HospitalCommentReactionRpcRow = {
  like_count: number;
  dislike_count: number;
  reaction_type: ReactionType | null;
};

export function isReactionType(value: unknown): value is ReactionType {
  return value === "like" || value === "dislike";
}

export function validateReactionRequest(
  body: unknown,
): ReactionValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const reaction = (body as Partial<ReactionRequest>).reaction;

  if (!isReactionType(reaction)) {
    return { ok: false, message: "좋아요 또는 싫어요 값이 필요합니다." };
  }

  return {
    ok: true,
    value: {
      reaction,
    },
  };
}

export function toReactionSnapshot(
  row: HospitalReactionRpcRow,
): ReactionSnapshot {
  return {
    likes: row.likes,
    dislikes: row.dislikes,
    reaction: row.reaction_type,
  };
}

export function toCommentReactionSnapshot(
  row: HospitalCommentReactionRpcRow,
): ReactionSnapshot {
  return {
    likes: row.like_count,
    dislikes: row.dislike_count,
    reaction: row.reaction_type,
  };
}

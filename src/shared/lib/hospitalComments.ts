import type { HospitalComment } from "@/src/home/types";
import type { Database } from "@/src/shared/lib/database.types";
import type { User } from "@supabase/supabase-js";
import {
  getDefaultDisplayName,
  type UserProfile,
} from "@/src/shared/lib/userProfiles";

export const HOSPITAL_COMMENT_COLUMNS =
  "id,hospital_id,user_id,author_name,body,like_count,status,created_at,updated_at";
export const MAX_HOSPITAL_COMMENT_LENGTH = 600;

export type HospitalCommentRow =
  Database["public"]["Tables"]["hospital_comments"]["Row"];

export type HospitalCommentInsert =
  Database["public"]["Tables"]["hospital_comments"]["Insert"];

export type CreateHospitalCommentRequest = {
  content: string;
};

export type HospitalCommentValidationResult =
  | {
      ok: true;
      value: {
        content: string;
      };
    }
  | {
      ok: false;
      message: string;
    };

export function validateCreateHospitalComment(
  body: unknown,
): HospitalCommentValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const contentValue = (body as Partial<CreateHospitalCommentRequest>).content;
  const content = typeof contentValue === "string" ? contentValue.trim() : "";

  if (!content) {
    return { ok: false, message: "댓글 내용을 입력해주세요." };
  }

  if (content.length > MAX_HOSPITAL_COMMENT_LENGTH) {
    return {
      ok: false,
      message: `댓글은 ${MAX_HOSPITAL_COMMENT_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  return {
    ok: true,
    value: {
      content,
    },
  };
}

export function getHospitalCommentAuthorName(
  profile: UserProfile,
  user: User,
) {
  return (
    profile.display_name?.trim() ||
    getDefaultDisplayName(profile.email) ||
    getDefaultDisplayName(user.email) ||
    "익명 사용자"
  );
}

export function toHospitalComment(row: HospitalCommentRow): HospitalComment {
  return {
    id: row.id,
    author: row.author_name,
    content: row.body,
    likes: row.like_count,
    createdAt: row.created_at,
  };
}

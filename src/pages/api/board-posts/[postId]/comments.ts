import type { NextApiRequest, NextApiResponse } from "next";
import {
  getBearerToken,
  getQueryValue,
} from "@/src/shared/lib/apiRequest";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";
import type { Database } from "@/src/shared/lib/database.types";
import {
  toBoardPostComment,
  validateCreateBoardComment,
  type BoardPostComment,
} from "@/src/features/reviews/boardPosts";
import {
  ensureUserProfile,
  getDefaultDisplayName,
} from "@/src/shared/lib/userProfiles";
import {
  getSuspensionBlockedMessage,
  getUserActiveSuspension,
} from "@/src/shared/lib/suspensions";

type BoardPostCommentRow =
  Database["public"]["Tables"]["board_post_comments"]["Row"];

type BoardPostCommentResponse =
  | {
      comment: BoardPostComment;
    }
  | {
      error: string;
    };

const BOARD_POST_COMMENT_COLUMNS =
  "id,post_id,user_id,author_name,body,like_count,dislike_count,status,deleted_at,deleted_by,deleted_reason,created_at,updated_at";

function getAuthorName(
  profile: Awaited<ReturnType<typeof ensureUserProfile>>,
  userEmail: string | null | undefined,
) {
  return (
    profile.display_name?.trim() ||
    getDefaultDisplayName(profile.email) ||
    getDefaultDisplayName(userEmail) ||
    "익명 사용자"
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BoardPostCommentResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "POST 요청만 지원합니다." });
    return;
  }

  const postId = getQueryValue(req, "postId");

  if (!postId) {
    res.status(400).json({ error: "게시글 ID가 필요합니다." });
    return;
  }

  const accessToken = getBearerToken(req);

  if (!accessToken) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  const validation = validateCreateBoardComment(req.body);

  if (!validation.ok) {
    res.status(400).json({ error: validation.message });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      res.status(401).json({
        error: userError
          ? `Supabase 사용자 확인 실패: ${userError.message}`
          : "로그인 사용자를 확인할 수 없습니다.",
      });
      return;
    }

    const { data: postData, error: postError } = await supabase
      .from("board_posts")
      .select("id")
      .eq("id", postId)
      .eq("status", "visible")
      .maybeSingle();

    if (postError) {
      res.status(500).json({
        error: `Supabase board_posts 조회 실패: ${postError.message}`,
      });
      return;
    }

    if (!postData) {
      res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
      return;
    }

    const suspensionData = await getUserActiveSuspension(supabase, user.id);

    if (suspensionData) {
      res.status(403).json({
        error: getSuspensionBlockedMessage(
          suspensionData,
          "댓글을 작성할 수 없습니다.",
        ),
      });
      return;
    }

    const profile = await ensureUserProfile(supabase, user);
    const { data, error } = await supabase
      .from("board_post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        author_name: getAuthorName(profile, user.email),
        body: validation.value.content,
      })
      .select(BOARD_POST_COMMENT_COLUMNS)
      .single();

    if (error || !data) {
      res.status(500).json({
        error: error?.message ?? "댓글 저장에 실패했습니다.",
      });
      return;
    }

    res.status(201).json({
      comment: toBoardPostComment(data as BoardPostCommentRow),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

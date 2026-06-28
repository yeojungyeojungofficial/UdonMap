import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAuthUserErrorMessage,
  getBearerToken,
  getQueryValue,
} from "@/src/core/apiRequest";
import {
  checkRateLimitForKey,
  getClientIp,
  sendRateLimitResponse,
} from "@/src/core/rateLimit";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import { isBoardPostCommentReportReason } from "@/src/features/reviews/reportReasons";

type BoardPostCommentReportResponse =
  | {
      reportId: string;
    }
  | {
      error: string;
    };

const BOARD_POST_COMMENT_REPORT_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BoardPostCommentReportResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "POST 요청만 지원합니다." });
    return;
  }

  const postId = getQueryValue(req, "postId");
  const commentId = getQueryValue(req, "commentId");

  if (!postId || !commentId) {
    res.status(400).json({ error: "게시글 ID와 댓글 ID가 필요합니다." });
    return;
  }

  const reason = req.body?.reason;
  if (!isBoardPostCommentReportReason(reason)) {
    res.status(400).json({ error: "신고 사유를 선택해주세요." });
    return;
  }

  const accessToken = getBearerToken(req);

  if (!accessToken) {
    res.status(401).json({ error: "로그인이 필요합니다." });
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
        error: getAuthUserErrorMessage(userError),
      });
      return;
    }

    const rateLimit = checkRateLimitForKey(
      `board-post-comment-reports:create:${user.id}:${getClientIp(req)}`,
      BOARD_POST_COMMENT_REPORT_RATE_LIMIT,
    );
    if (!rateLimit.ok) {
      sendRateLimitResponse(res, rateLimit);
      return;
    }

    const { data: postData, error: postError } = await supabase
      .from("board_posts")
      .select("id")
      .eq("id", postId)
      .eq("status", "visible")
      .not("user_id", "is", null)
      .maybeSingle();

    if (postError) {
      res.status(500).json({
        error: `Supabase board_posts 조회 실패: ${postError.message}`,
      });
      return;
    }

    if (!postData) {
      res.status(404).json({ error: "신고할 게시글을 찾을 수 없습니다." });
      return;
    }

    const { data: commentData, error: commentError } = await supabase
      .from("board_post_comments")
      .select("id,post_id,user_id")
      .eq("id", commentId)
      .eq("post_id", postId)
      .eq("status", "visible")
      .maybeSingle();

    if (commentError) {
      res.status(500).json({
        error: `Supabase board_post_comments 조회 실패: ${commentError.message}`,
      });
      return;
    }

    if (!commentData) {
      res.status(404).json({ error: "신고할 댓글을 찾을 수 없습니다." });
      return;
    }

    if (commentData.user_id === user.id) {
      res.status(400).json({ error: "본인 댓글은 신고할 수 없습니다." });
      return;
    }

    const { data, error } = await supabase
      .from("board_post_comment_reports")
      .upsert(
        {
          comment_id: commentId,
          post_id: postId,
          reporter_id: user.id,
          reason,
          status: "pending",
        },
        {
          onConflict: "comment_id,reporter_id",
        },
      )
      .select("id")
      .single();

    if (error || !data) {
      res.status(500).json({
        error: error?.message ?? "댓글 신고에 실패했습니다.",
      });
      return;
    }

    res.status(201).json({ reportId: data.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

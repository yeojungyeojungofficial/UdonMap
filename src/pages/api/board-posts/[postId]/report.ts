import type { NextApiRequest, NextApiResponse } from "next";
import { getBearerToken, getQueryValue } from "@/src/core/apiRequest";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import { isBoardPostReportReason } from "@/src/features/reviews/reportReasons";

type BoardPostReportResponse =
  | {
      reportId: string;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BoardPostReportResponse>,
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

  const reason = req.body?.reason;
  if (!isBoardPostReportReason(reason)) {
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
        error: userError
          ? `Supabase 사용자 확인 실패: ${userError.message}`
          : "로그인 사용자를 확인할 수 없습니다.",
      });
      return;
    }

    const { data: postData, error: postError } = await supabase
      .from("board_posts")
      .select("id,user_id")
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

    if (postData.user_id === user.id) {
      res.status(400).json({ error: "본인 게시글은 신고할 수 없습니다." });
      return;
    }

    const { data, error } = await supabase
      .from("board_post_reports")
      .upsert(
        {
          post_id: postId,
          reporter_id: user.id,
          reason,
          status: "pending",
        },
        {
          onConflict: "post_id,reporter_id",
        },
      )
      .select("id")
      .single();

    if (error || !data) {
      res.status(500).json({
        error: error?.message ?? "게시글 신고에 실패했습니다.",
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

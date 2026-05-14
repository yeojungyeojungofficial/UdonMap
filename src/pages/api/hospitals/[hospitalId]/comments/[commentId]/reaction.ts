import type { NextApiRequest, NextApiResponse } from "next";
import type { ReactionSnapshot } from "@/src/features/hospitals/types";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";
import {
  toCommentReactionSnapshot,
  validateReactionRequest,
} from "@/src/features/hospitals/reactions";
import {
  getBearerToken,
  getQueryValue,
} from "@/src/shared/lib/apiRequest";

type HospitalCommentReactionResponse =
  | {
      reaction: ReactionSnapshot;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HospitalCommentReactionResponse>,
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    res.status(405).json({ error: "PATCH 요청만 지원합니다." });
    return;
  }

  const hospitalId = getQueryValue(req, "hospitalId");
  const commentId = getQueryValue(req, "commentId");

  if (!hospitalId || !commentId) {
    res.status(400).json({ error: "병원 ID와 댓글 ID가 필요합니다." });
    return;
  }

  const validation = validateReactionRequest(req.body);

  if (!validation.ok) {
    res.status(400).json({ error: validation.message });
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
          ? ` 사용자 확인 실패: ${userError.message}`
          : "로그인 사용자를 확인할 수 없습니다.",
      });
      return;
    }

    const { data, error } = await supabase
      .rpc("set_hospital_comment_reaction", {
        p_hospital_id: hospitalId,
        p_comment_id: commentId,
        p_user_id: user.id,
        p_reaction_type: validation.value.reaction,
      })
      .single();

    if (error) {
      res.status(500).json({
        error: `hospital_comment_reactions 저장 실패: ${error.message}`,
      });
      return;
    }

    res.status(200).json({ reaction: toCommentReactionSnapshot(data) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

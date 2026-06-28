import type { NextApiRequest, NextApiResponse } from "next";
import type { ReactionSnapshot } from "@/src/features/hospitals/types";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import {
  toCommentReactionSnapshot,
  validateReactionRequest,
} from "@/src/features/hospitals/reactions";
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

type HospitalCommentReactionResponse =
  | {
      reaction: ReactionSnapshot;
    }
  | {
      error: string;
    };

const HOSPITAL_COMMENT_REACTION_RATE_LIMIT = {
  limit: 60,
  windowMs: 60 * 1000,
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
        error: getAuthUserErrorMessage(userError),
      });
      return;
    }

    const rateLimit = checkRateLimitForKey(
      `hospitals:comment-reaction:${user.id}:${getClientIp(req)}`,
      HOSPITAL_COMMENT_REACTION_RATE_LIMIT,
    );
    if (!rateLimit.ok) {
      sendRateLimitResponse(res, rateLimit);
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

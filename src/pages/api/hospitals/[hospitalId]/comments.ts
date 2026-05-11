import type { NextApiRequest, NextApiResponse } from "next";
import {
  getHospitalCommentAuthorName,
  HOSPITAL_COMMENT_COLUMNS,
  toHospitalComment,
  validateCreateHospitalComment,
  validateDeleteHospitalComment,
} from "@/src/shared/lib/hospitalComments";
import type { HospitalComment } from "@/src/home/types";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";
import { ensureUserProfile } from "@/src/shared/lib/userProfiles";
import { getBearerToken } from "@/src/shared/lib/apiRequest";
import {
  getSuspensionBlockedMessage,
  getUserActiveSuspension,
} from "@/src/shared/lib/suspensions";

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

function getHospitalId(req: NextApiRequest) {
  return Array.isArray(req.query.hospitalId)
    ? req.query.hospitalId[0]
    : req.query.hospitalId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HospitalCommentResponse>,
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE");
    res.status(405).json({ error: "POST, DELETE 요청만 지원합니다." });
    return;
  }

  const hospitalId = getHospitalId(req);

  if (!hospitalId) {
    res.status(400).json({ error: "병원 ID가 필요합니다." });
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

    if (req.method === "DELETE") {
      const validation = validateDeleteHospitalComment(req.body);

      if (!validation.ok) {
        res.status(400).json({ error: validation.message });
        return;
      }

      const { data, error } = await supabase
        .from("hospital_comments")
        .update({ status: "deleted" })
        .eq("id", validation.value.commentId)
        .eq("hospital_id", hospitalId)
        .eq("user_id", user.id)
        .eq("status", "visible")
        .select("id")
        .maybeSingle();

      if (error) {
        res.status(500).json({
          error: `Supabase hospital_comments delete 실패: ${error.message}`,
        });
        return;
      }

      if (!data) {
        res.status(404).json({ error: "삭제할 댓글을 찾을 수 없습니다." });
        return;
      }

      res.status(200).json({ commentId: data.id });
      return;
    }

    const validation = validateCreateHospitalComment(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.message });
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
      .from("hospital_comments")
      .insert({
        hospital_id: hospitalId,
        user_id: user.id,
        author_name: getHospitalCommentAuthorName(profile, user),
        body: validation.value.content,
      })
      .select(HOSPITAL_COMMENT_COLUMNS)
      .single();

    if (error) {
      res
        .status(500)
        .json({ error: `Supabase hospital_comments insert 실패: ${error.message}` });
      return;
    }

    res.status(201).json({ comment: toHospitalComment(data) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

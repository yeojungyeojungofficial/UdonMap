import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";
import { updateHospitalCommentAuthorNames } from "@/src/shared/lib/hospitalComments";
import {
  ensureUserProfile,
  updateUserProfile,
  validateUserProfileUpdate,
  type UserProfile,
} from "@/src/shared/lib/userProfiles";

type UserProfileResponse =
  | {
      profile: UserProfile;
    }
  | {
      error: string;
    };

function getBearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization;
  const header = Array.isArray(authorization)
    ? authorization[0]
    : authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserProfileResponse>,
) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", "GET, PATCH");
    res.status(405).json({ error: "GET, PATCH 요청만 지원합니다." });
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

    if (req.method === "GET") {
      const profile = await ensureUserProfile(supabase, user);
      res.status(200).json({ profile });
      return;
    }

    const validation = validateUserProfileUpdate(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.message });
      return;
    }

    const profile = await updateUserProfile(supabase, user, {
      display_name: validation.value.displayName,
    });
    await updateHospitalCommentAuthorNames(supabase, user, profile);

    res.status(200).json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

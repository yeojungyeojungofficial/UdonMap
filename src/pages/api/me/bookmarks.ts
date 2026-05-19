import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAuthUserErrorMessage,
  getBearerToken,
} from "@/src/core/apiRequest";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import { isMissingBookmarksTableError } from "@/src/features/hospitals/bookmarkErrors";
import type { BookmarkedHospital } from "@/src/features/mypage/types";

type BookmarkWithHospital = {
  created_at: string;
  hospital_id: string;
  hospitals: {
    emergency: boolean;
    exotic_animals: string[];
    id: string;
    name: string;
    region: string;
    specialty: boolean;
    street_address: string;
  } | null;
};

type BookmarksResponse =
  | {
      hospitals: BookmarkedHospital[];
    }
  | {
      error: string;
    };

function toBookmarkedHospital(row: BookmarkWithHospital) {
  const hospital = row.hospitals;

  if (!hospital) {
    return null;
  }

  return {
    id: hospital.id,
    name: hospital.name,
    region: hospital.region,
    address: hospital.street_address,
    animals:
      hospital.exotic_animals.length > 0
        ? hospital.exotic_animals
        : ["특수동물"],
    isSpecialty: hospital.specialty,
    isEmergency: hospital.emergency,
    bookmarkedAt: row.created_at,
  } satisfies BookmarkedHospital;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookmarksResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "GET 요청만 지원합니다." });
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

    const { data, error } = await supabase
      .from("hospital_bookmarks")
      .select(
        "hospital_id,created_at,hospitals!inner(id,name,region,street_address,exotic_animals,specialty,emergency)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingBookmarksTableError(error)) {
        res.status(500).json({
          error: "찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.",
        });
        return;
      }

      res.status(500).json({
        error: `Supabase hospital_bookmarks 조회 실패: ${error.message}`,
      });
      return;
    }

    res.status(200).json({
      hospitals: ((data ?? []) as unknown as BookmarkWithHospital[])
        .map(toBookmarkedHospital)
        .filter((hospital): hospital is BookmarkedHospital =>
          Boolean(hospital),
        ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

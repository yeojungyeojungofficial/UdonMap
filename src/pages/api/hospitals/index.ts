import type { NextApiRequest, NextApiResponse } from "next";
import { getBearerToken } from "@/src/core/apiRequest";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import {
  checkRateLimit,
  sendRateLimitResponse,
} from "@/src/core/rateLimit";
import { isMissingBookmarksTableError } from "@/src/features/hospitals/bookmarkErrors";
import {
  HOSPITAL_COLUMNS,
  toHospital,
  toReactionMap,
  type HospitalListRow,
} from "@/src/features/hospitals/hospitalRows";
import type { Hospital, ReactionType } from "@/src/features/hospitals/types";
import type { Database } from "@/src/core/database.types";

type HospitalReactionRow = Pick<
  Database["public"]["Tables"]["hospital_reactions"]["Row"],
  "hospital_id" | "reaction_type"
>;

type HospitalBookmarkRow = Pick<
  Database["public"]["Tables"]["hospital_bookmarks"]["Row"],
  "hospital_id"
>;

type HospitalsResponse =
  | {
      hospitals: Hospital[];
    }
  | {
      error: string;
    };

const HOSPITAL_LIST_RATE_LIMIT = {
  keyPrefix: "hospitals:list",
  limit: 90,
  windowMs: 60 * 1000,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HospitalsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "GET 요청만 지원합니다." });
    return;
  }

  const rateLimit = checkRateLimit(req, HOSPITAL_LIST_RATE_LIMIT);
  if (!rateLimit.ok) {
    sendRateLimitResponse(res, rateLimit);
    return;
  }

  res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("hospitals")
      .select(HOSPITAL_COLUMNS)
      .order("name", { ascending: true });

    if (error) {
      res.status(500).json({
        error: `Supabase hospitals 조회 실패: ${error.message}`,
      });
      return;
    }

    const hospitalRows = (data ?? []) as HospitalListRow[];
    const hospitalIds = hospitalRows.map((hospital) => hospital.id);
    let reactionsByHospitalId = new Map<string, ReactionType>();
    let bookmarkedHospitalIds = new Set<string>();
    const accessToken = getBearerToken(req);

    if (accessToken && hospitalIds.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken);

      if (user) {
        const [reactionResult, bookmarkResult] = await Promise.all([
          supabase
            .from("hospital_reactions")
            .select("hospital_id,reaction_type")
            .eq("user_id", user.id)
            .in("hospital_id", hospitalIds),
          supabase
            .from("hospital_bookmarks")
            .select("hospital_id")
            .eq("user_id", user.id)
            .in("hospital_id", hospitalIds),
        ]);

        if (reactionResult.error) {
          res.status(500).json({
            error: `Supabase hospital_reactions 조회 실패: ${reactionResult.error.message}`,
          });
          return;
        }

        if (
          bookmarkResult.error &&
          !isMissingBookmarksTableError(bookmarkResult.error)
        ) {
          res.status(500).json({
            error: `Supabase hospital_bookmarks 조회 실패: ${bookmarkResult.error.message}`,
          });
          return;
        }

        reactionsByHospitalId = toReactionMap(
          (reactionResult.data ?? []) as HospitalReactionRow[],
          "hospital_id",
        );

        bookmarkedHospitalIds = new Set(
          ((bookmarkResult.data ?? []) as HospitalBookmarkRow[]).map(
            (bookmark) => bookmark.hospital_id,
          ),
        );
      }
    }

    res.status(200).json({
      hospitals: hospitalRows.map((row) =>
        toHospital(
          row,
          [],
          reactionsByHospitalId.get(row.id) ?? null,
          bookmarkedHospitalIds.has(row.id),
          false,
        ),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

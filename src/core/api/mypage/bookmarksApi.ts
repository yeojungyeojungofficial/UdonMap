import type { Session } from "@supabase/supabase-js";
import type { BookmarkedHospital } from "@/src/features/mypage/types";

type BookmarksResponse =
  | {
      hospitals: BookmarkedHospital[];
    }
  | {
      error: string;
    };

export async function fetchBookmarkedHospitals(session: Session) {
  const response = await fetch("/api/me/bookmarks", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const result = (await response.json().catch(() => null)) as
    | BookmarksResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "찜한 병원을 불러오지 못했습니다.",
    );
  }

  return result.hospitals;
}

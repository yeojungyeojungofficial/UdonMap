import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import type { Database } from "@/src/shared/lib/database.types";
import { isMissingBookmarksTableError } from "@/src/shared/lib/bookmarkErrors";

type BookmarkRow = Pick<
  Database["public"]["Tables"]["hospital_bookmarks"]["Row"],
  "hospital_id" | "created_at"
>;

type HospitalRow = Pick<
  Database["public"]["Tables"]["hospitals"]["Row"],
  | "id"
  | "name"
  | "region"
  | "street_address"
  | "exotic_animals"
  | "specialty"
  | "emergency"
>;

export type BookmarkedHospital = {
  id: string;
  name: string;
  region: string;
  address: string;
  animals: string[];
  isSpecialty: boolean;
  isEmergency: boolean;
  bookmarkedAt: string;
};

export async function fetchBookmarkedHospitals(session: Session) {
  const supabase = getSupabaseBrowserClient();
  const { data: bookmarkData, error: bookmarkError } = await supabase
    .from("hospital_bookmarks")
    .select("hospital_id,created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (bookmarkError) {
    if (isMissingBookmarksTableError(bookmarkError)) {
      throw new Error("찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.");
    }

    throw new Error(
      `Supabase hospital_bookmarks 조회 실패: ${bookmarkError.message}`,
    );
  }

  const bookmarks = (bookmarkData ?? []) as BookmarkRow[];
  const hospitalIds = bookmarks.map((bookmark) => bookmark.hospital_id);

  if (hospitalIds.length === 0) {
    return [];
  }

  const { data: hospitalData, error: hospitalError } = await supabase
    .from("hospitals")
    .select("id,name,region,street_address,exotic_animals,specialty,emergency")
    .in("id", hospitalIds);

  if (hospitalError) {
    throw new Error(`Supabase hospitals 조회 실패: ${hospitalError.message}`);
  }

  const hospitalsById = new Map(
    ((hospitalData ?? []) as HospitalRow[]).map((hospital) => [
      hospital.id,
      hospital,
    ]),
  );

  return bookmarks.reduce<BookmarkedHospital[]>((items, bookmark) => {
    const hospital = hospitalsById.get(bookmark.hospital_id);

    if (!hospital) {
      return items;
    }

    items.push({
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
      bookmarkedAt: bookmark.created_at,
    });

    return items;
  }, []);
}

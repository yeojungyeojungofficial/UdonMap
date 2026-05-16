import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/src/core/supabase";
import { isMissingBookmarksTableError } from "@/src/features/hospitals/bookmarkErrors";
import type { BookmarkedHospital } from "@/src/features/mypage/types";

type BookmarkWithHospital = {
  hospital_id: string;
  created_at: string;
  hospitals: {
    id: string;
    name: string;
    region: string;
    street_address: string;
    exotic_animals: string[];
    specialty: boolean;
    emergency: boolean;
  } | null;
};

export async function fetchBookmarkedHospitals(session: Session) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("hospital_bookmarks")
    .select(
      "hospital_id,created_at,hospitals!inner(id,name,region,street_address,exotic_animals,specialty,emergency)",
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingBookmarksTableError(error)) {
      throw new Error("찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.");
    }
    throw new Error(`Supabase hospital_bookmarks 조회 실패: ${error.message}`);
  }

  return (data ?? []).reduce<BookmarkedHospital[]>((items, row) => {
    const bookmark = row as unknown as BookmarkWithHospital;
    const hospital = bookmark.hospitals;

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

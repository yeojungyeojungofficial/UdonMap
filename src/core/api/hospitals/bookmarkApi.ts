import { loadAuthSession } from "@/src/shared/lib/authSession";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import { isMissingBookmarksTableError } from "@/src/features/hospitals/bookmarkErrors";

export async function updateHospitalBookmark(
  hospitalId: string,
  shouldBookmark: boolean,
) {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);

  if (!session) {
    throw new Error("로그인 후 찜할 수 있습니다.");
  }

  if (shouldBookmark) {
    const { error } = await supabase.from("hospital_bookmarks").upsert(
      {
        hospital_id: hospitalId,
        user_id: session.user.id,
      },
      {
        onConflict: "hospital_id,user_id",
      },
    );

    if (error) {
      if (isMissingBookmarksTableError(error)) {
        throw new Error("찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.");
      }

      throw new Error(`Supabase hospital_bookmarks 저장 실패: ${error.message}`);
    }

    return true;
  }

  const { error } = await supabase
    .from("hospital_bookmarks")
    .delete()
    .eq("hospital_id", hospitalId)
    .eq("user_id", session.user.id);

  if (error) {
    if (isMissingBookmarksTableError(error)) {
      throw new Error("찜 기능 테이블이 아직 Supabase에 적용되지 않았습니다.");
    }

    throw new Error(`Supabase hospital_bookmarks 삭제 실패: ${error.message}`);
  }

  return false;
}

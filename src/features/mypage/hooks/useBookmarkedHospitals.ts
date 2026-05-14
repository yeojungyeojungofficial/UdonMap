import { useCallback, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchBookmarkedHospitals } from "@/src/core/api/mypage/bookmarksApi";
import type { BookmarkedHospital } from "@/src/features/mypage/types";

export function useBookmarkedHospitals() {
  const [bookmarkedHospitals, setBookmarkedHospitals] = useState<
    BookmarkedHospital[]
  >([]);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState("");
  const [isBookmarkSheetOpen, setIsBookmarkSheetOpen] = useState(false);

  const loadBookmarkedHospitals = useCallback(async (activeSession: Session) => {
    setIsBookmarkLoading(true);
    setBookmarkError("");

    try {
      const nextBookmarkedHospitals =
        await fetchBookmarkedHospitals(activeSession);
      setBookmarkedHospitals(nextBookmarkedHospitals);
    } catch (error) {
      setBookmarkedHospitals([]);
      setBookmarkError(
        error instanceof Error
          ? error.message
          : "찜한 병원 조회 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsBookmarkLoading(false);
    }
  }, []);

  const closeBookmarkSheet = useCallback(() => {
    setIsBookmarkSheetOpen(false);
  }, []);

  const openBookmarkSheet = useCallback(
    (activeSession: Session | null) => {
      if (!activeSession) {
        return;
      }

      setIsBookmarkSheetOpen(true);
      void loadBookmarkedHospitals(activeSession);
    },
    [loadBookmarkedHospitals],
  );

  const resetBookmarks = useCallback(() => {
    setIsBookmarkSheetOpen(false);
    setBookmarkedHospitals([]);
    setBookmarkError("");
    setIsBookmarkLoading(false);
  }, []);

  return {
    bookmarkedHospitals,
    bookmarkError,
    closeBookmarkSheet,
    isBookmarkLoading,
    isBookmarkSheetOpen,
    openBookmarkSheet,
    resetBookmarks,
  };
}

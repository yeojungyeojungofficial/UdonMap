import { useCallback, useRef, useState } from "react";
import type {
  ActivityTab,
  MyComment,
  MyPost,
  MyReport,
} from "@/src/features/mypage/types";
import { fetchMyActivity } from "@/src/core/api/mypage/activityApi";

export function useMyActivity() {
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<ActivityTab>("comments");
  const [myReports, setMyReports] = useState<MyReport[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const activityRequestIdRef = useRef(0);

  const loadMyActivity = useCallback(async (tab: ActivityTab) => {
    const requestId = activityRequestIdRef.current + 1;
    activityRequestIdRef.current = requestId;
    setIsActivityLoading(true);
    setActivityError("");

    try {
      const nextActivity = await fetchMyActivity(tab);
      if (activityRequestIdRef.current !== requestId) {
        return;
      }
      if (tab === "reports") {
        setMyReports(nextActivity.reports);
      }
      if (tab === "posts") {
        setMyPosts(nextActivity.posts);
      }
      if (tab === "comments") {
        setMyComments(nextActivity.comments);
      }
    } catch (error) {
      if (activityRequestIdRef.current !== requestId) {
        return;
      }
      if (tab === "reports") {
        setMyReports([]);
      }
      if (tab === "posts") {
        setMyPosts([]);
      }
      if (tab === "comments") {
        setMyComments([]);
      }
      setActivityError(
        error instanceof Error
          ? error.message
          : "내 활동 내역 조회 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      if (activityRequestIdRef.current === requestId) {
        setIsActivityLoading(false);
      }
    }
  }, []);

  const closeActivitySheet = useCallback(() => {
    setIsActivitySheetOpen(false);
  }, []);

  const openActivitySheet = useCallback(
    (nextTab: ActivityTab) => {
      setActivityTab(nextTab);
      setIsActivitySheetOpen(true);
      void loadMyActivity(nextTab);
    },
    [loadMyActivity],
  );

  const handleActivityTabChange = useCallback(
    (nextTab: ActivityTab) => {
      setActivityTab(nextTab);
      void loadMyActivity(nextTab);
    },
    [loadMyActivity],
  );

  const resetActivity = useCallback(() => {
    activityRequestIdRef.current += 1;
    setIsActivitySheetOpen(false);
    setIsActivityLoading(false);
    setMyReports([]);
    setMyPosts([]);
    setMyComments([]);
    setActivityError("");
  }, []);

  return {
    activityError,
    activityTab,
    closeActivitySheet,
    handleActivityTabChange,
    isActivityLoading,
    isActivitySheetOpen,
    myComments,
    myPosts,
    myReports,
    openActivitySheet,
    resetActivity,
  };
}

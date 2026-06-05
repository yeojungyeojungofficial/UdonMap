import { useCallback, useEffect, useState } from "react";
import { fetchBoardPosts } from "@/src/core/api/reviews/boardPostsApi";
import type { Region } from "@/src/features/hospitals/types";
import type {
  BoardPostSummary,
  BoardTab,
  TipCategory,
} from "@/src/features/reviews/boardPosts";

type UseReviewBoardPostsOptions = {
  initialTab?: BoardTab | null;
};

export function useReviewBoardPosts({
  initialTab = null,
}: UseReviewBoardPostsOptions = {}) {
  const [selectedTab, setSelectedTab] = useState<BoardTab | null>(null);
  const activeTab = selectedTab ?? initialTab ?? "병원후기 게시판";
  const [selectedRegion, setSelectedRegion] = useState<Region>("전체");
  const [selectedTipCategory, setSelectedTipCategory] =
    useState<TipCategory>("전체");
  const [posts, setPosts] = useState<BoardPostSummary[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postLoadError, setPostLoadError] = useState("");

  const applyTabSelection = useCallback((tab: BoardTab) => {
    setSelectedTab(tab);
    if (tab !== "병원후기 게시판") {
      setSelectedRegion("전체");
    }
    if (tab !== "꿀팁 게시판") {
      setSelectedTipCategory("전체");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const filterTag =
      activeTab === "병원후기 게시판"
        ? selectedRegion
        : activeTab === "꿀팁 게시판"
          ? selectedTipCategory
          : null;

    const loadPosts = async () => {
      setIsLoadingPosts(true);
      setPostLoadError("");

      try {
        const nextPosts = await fetchBoardPosts(activeTab, filterTag);
        if (!isMounted) return;
        setPosts(nextPosts);
      } catch (error) {
        if (!isMounted) return;
        setPosts([]);
        setPostLoadError(
          error instanceof Error
            ? error.message
            : "게시글 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    };

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedRegion, selectedTipCategory]);

  const handleSelectTab = useCallback(
    (tab: BoardTab) => {
      applyTabSelection(tab);
    },
    [applyTabSelection],
  );

  const handlePostCreated = useCallback((post: BoardPostSummary) => {
    setSelectedTab(post.board);
    if (post.board === "병원후기 게시판") {
      setSelectedRegion((post.filterTag as Region | null) ?? "전체");
    }
    if (post.board === "꿀팁 게시판") {
      setSelectedTipCategory((post.filterTag as TipCategory | null) ?? "전체");
    }
    setPosts((currentPosts) => [post, ...currentPosts]);
  }, []);

  return {
    activeTab,
    handlePostCreated,
    handleSelectTab,
    isLoadingPosts,
    postLoadError,
    posts,
    selectedRegion,
    selectedTipCategory,
    setSelectedRegion,
    setSelectedTipCategory,
  };
}

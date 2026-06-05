import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import ExpandableFilterChipGroup from "@/src/components/common/mob/ExpandableFilterChipGroup";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import TopNav from "@/src/components/common/TopNav";
import PostComposeSheet from "@/src/components/reviews/PostComposeSheet";
import CommonFooter from "@/src/components/common/CommonFooter";
import { REGION_FILTERS } from "@/src/constants/regions";
import type { Region } from "@/src/features/hospitals/types";
import {
  BOARD_TABS,
  TIP_CATEGORIES,
  getBoardQueryValue,
  getBoardTabFromQuery,
  type BoardTab,
} from "@/src/features/reviews/boardPosts";
import { useReviewBoardPosts } from "@/src/features/reviews/hooks/useReviewBoardPosts";
import styles from "./ReviewsPage.module.css";

const REVIEW_REGION_OPTIONS: readonly Region[] = REGION_FILTERS;

export default function MobileReviewsPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("병원후기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isTabOpen, setIsTabOpen] = useState(false);
  const initialTab = useMemo(
    () => getBoardTabFromQuery(router.query.board),
    [router.query.board],
  );
  const {
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
  } = useReviewBoardPosts({ initialTab });

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원후기");
  };

  const handleBoardTabChange = (tab: BoardTab) => {
    handleSelectTab(tab);
    void router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          board: getBoardQueryValue(tab),
        },
      },
      undefined,
      { shallow: true },
    );
  };

  const hasFilter =
    activeTab === "병원후기 게시판" || activeTab === "꿀팁 게시판";

  return (
    <>
      <Head>
        <title>병원후기 | 우동</title>
        <meta
          name="description"
          content="동물병원 후기, 자유글, 특수동물 진료 꿀팁을 확인합니다."
        />
      </Head>
      <div className={styles.page}>
        <TopNav
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          onOpenReport={() => {
            setActiveMenu("병원제보");
            setIsReportSheetOpen(true);
          }}
        />

        <main className={styles.content}>
          <section className={styles.boardSurface}>
            <div className={styles.tabBar} aria-label="게시판 선택">
              <button
                type="button"
                className={`${styles.tabButton} ${styles.tabButtonActive} ${styles.tabButtonDropdown}`}
                onClick={() => setIsTabOpen((v) => !v)}
                aria-expanded={isTabOpen}
              >
                {activeTab}
                <svg
                  className={`${styles.tabDropdownIcon} ${isTabOpen ? styles.tabDropdownIconOpen : ""}`}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 10l5 5 5-5z" fill="currentColor" />
                </svg>
              </button>
              {isTabOpen ? (
                <div className={styles.tabDropdownList}>
                  {BOARD_TABS.filter((tab) => tab !== activeTab).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={styles.tabDropdownItem}
                      onClick={() => {
                        handleBoardTabChange(tab);
                        setIsTabOpen(false);
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {hasFilter && activeTab === "병원후기 게시판" ? (
              <ExpandableFilterChipGroup
                key="review-region-filter"
                ariaLabel="지역 필터"
                hint="지역 필터링을 할 수 있습니다"
                options={REVIEW_REGION_OPTIONS}
                rowClassName={styles.filterRowBelowTabs}
                selectedOption={selectedRegion}
                onSelectOption={setSelectedRegion}
              />
            ) : null}

            {hasFilter && activeTab === "꿀팁 게시판" ? (
              <ExpandableFilterChipGroup
                key="tip-category-filter"
                ariaLabel="동물 카테고리 필터"
                hint="동물 카테고리 필터링을 할 수 있습니다"
                options={TIP_CATEGORIES}
                rowClassName={styles.filterRowBelowTabs}
                selectedOption={selectedTipCategory}
                onSelectOption={setSelectedTipCategory}
              />
            ) : null}

            {isLoadingPosts ? (
              <LoadingScreen message="게시글을 불러오는 중입니다." />
            ) : null}

            {postLoadError ? (
              <p className={styles.boardError}>{postLoadError}</p>
            ) : null}

            {!isLoadingPosts && !postLoadError && posts.length === 0 ? (
              <p className={styles.boardEmpty}>아직 아무 게시글이 없어요</p>
            ) : null}

            {!isLoadingPosts && !postLoadError && posts.length > 0 ? (
              <ul className={styles.postList}>
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={{
                        pathname: `/reviews/${post.id}`,
                        query: { board: getBoardQueryValue(post.board) },
                      }}
                      className={styles.postItem}
                    >
                      <span className={styles.postTitle}>{post.title}</span>
                      <span className={styles.postMeta}>
                        <span className={styles.postAuthor}>{post.author}</span>
                        <span className={styles.postLikes}>
                          조회수 {post.viewCount}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </main>

        <button
          type="button"
          className={styles.writeFab}
          aria-label={`${activeTab} 글쓰기`}
          onClick={() => setIsComposeOpen(true)}
        >
          <svg
            className={styles.writeFabIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 17.25V20h2.75L18.81 7.94l-2.75-2.75L4 17.25z"
              fill="currentColor"
            />
            <path
              d="M20.71 5.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              fill="currentColor"
            />
          </svg>
          <span className={styles.writeFabLabel}>글쓰기</span>
        </button>

        <PostComposeSheet
          isOpen={isComposeOpen}
          defaultBoard={activeTab}
          onClose={() => setIsComposeOpen(false)}
          onCreated={handlePostCreated}
        />

        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
        <CommonFooter />
      </div>
    </>
  );
}

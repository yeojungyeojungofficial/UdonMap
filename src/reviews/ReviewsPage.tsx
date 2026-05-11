import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import HospitalReportSheet from "@/src/shared/components/HospitalReportSheet";
import TopNav from "@/src/shared/components/TopNav";
import PostComposeSheet from "@/src/reviews/PostComposeSheet";
import { REGION_FILTERS } from "@/src/home/regions";
import type { Region } from "@/src/home/types";
import styles from "@/src/reviews/ReviewsPage.module.css";

const BOARD_TABS = [
  "병원후기 게시판",
  "자유게시판",
  "꿀팁 게시판",
] as const;

const REVIEW_REGION_OPTIONS: readonly Region[] = REGION_FILTERS;

type BoardTab = (typeof BOARD_TABS)[number];

type Post = {
  id: string;
  board: BoardTab;
  title: string;
  likes: number;
  region?: Region;
};

const POSTS: Post[] = [
  {
    id: "review-1",
    board: "병원후기 게시판",
    title: "서울에서 파충류 진료 가능한 병원 다녀온 후기",
    likes: 38,
    region: "서울",
  },
  {
    id: "review-2",
    board: "병원후기 게시판",
    title: "부산 조류 진료 병원 예약부터 진료까지 정리",
    likes: 24,
    region: "부산",
  },
  {
    id: "review-3",
    board: "병원후기 게시판",
    title: "경기권 햄스터 진료 가능한 병원 후기",
    likes: 19,
    region: "경기",
  },
  {
    id: "free-1",
    board: "자유게시판",
    title: "특수동물 이동장 추천받고 싶어요",
    likes: 17,
  },
  {
    id: "free-2",
    board: "자유게시판",
    title: "동네 병원 정보는 어디서 확인하시나요?",
    likes: 11,
  },
  {
    id: "tip-1",
    board: "꿀팁 게시판",
    title: "초진 전에 챙기면 좋은 진료 기록 목록",
    likes: 42,
  },
  {
    id: "tip-2",
    board: "꿀팁 게시판",
    title: "응급 상황에서 병원에 먼저 말해야 할 정보",
    likes: 31,
  },
];

export default function ReviewsPage() {
  const [activeMenu, setActiveMenu] = useState("병원후기");
  const [activeTab, setActiveTab] = useState<BoardTab>("병원후기 게시판");
  const [selectedRegion, setSelectedRegion] = useState<Region>("전체");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const visiblePosts = useMemo(
    () =>
      POSTS.filter((post) => {
        if (post.board !== activeTab) {
          return false;
        }

        if (activeTab !== "병원후기 게시판" || selectedRegion === "전체") {
          return true;
        }

        return post.region === selectedRegion;
      }),
    [activeTab, selectedRegion],
  );

  const handleSelectTab = (tab: BoardTab) => {
    setActiveTab(tab);
    if (tab !== "병원후기 게시판") {
      setSelectedRegion("전체");
    }
  };

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원후기");
  };

  const handleWritePost = () => {
    setIsComposeOpen(true);
  };

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
              {BOARD_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tabButton} ${
                    activeTab === tab ? styles.tabButtonActive : ""
                  }`}
                  onClick={() => handleSelectTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "병원후기 게시판" ? (
              <div className={styles.regionFilter} aria-label="지역 필터">
                {REVIEW_REGION_OPTIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={`${styles.regionButton} ${
                      selectedRegion === region ? styles.regionButtonActive : ""
                    }`}
                    onClick={() => setSelectedRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            ) : null}

            <ul className={styles.postList}>
              {visiblePosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/reviews/${post.id}`} className={styles.postItem}>
                    <span className={styles.postTitle}>{post.title}</span>
                    <span className={styles.postLikes}>좋아요 {post.likes}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <button
          type="button"
          className={styles.writeFab}
          aria-label={`${activeTab} 글쓰기`}
          onClick={handleWritePost}
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
        />

        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </div>
    </>
  );
}

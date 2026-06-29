import Head from "next/head";
import { useEffect } from "react";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import MyPageBackLink from "@/src/features/mypage/components/MyPageBackLink";
import { useRequireAuthSession } from "@/src/features/auth/hooks/useRequireAuthSession";
import { useMyActivity } from "@/src/features/mypage/hooks/useMyActivity";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";
import sheetStyles from "@/src/features/mypage/components/MyPage.module.css";

export default function PostsPage() {
  const { session, shouldRender } = useRequireAuthSession();
  const { myPosts, isActivityLoading, activityError, openActivitySheet } = useMyActivity();
  const shell = useMyPageShellStyles();

  useEffect(() => {
    if (session) {
      openActivitySheet("posts");
    }
  }, [openActivitySheet, session]);

  if (!shouldRender) return null;

  return (
    <>
      <Head><title>내 게시글 | 우동</title></Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <MyPageBackLink />
        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>내 게시글</h1>
          {!isActivityLoading && !activityError ? (
            <p className={shell.heroDesc}>{myPosts.length}개</p>
          ) : null}
        </section>

        <div className={shell.contentArea}>
          {isActivityLoading ? (
            <LoadingScreen
              message="내 게시글을 불러오는 중입니다."
              variant="inline"
            />
          ) : null}
          {activityError ? (
            <p className={sheetStyles.bookmarkError}>{activityError}</p>
          ) : null}
          {!isActivityLoading && !activityError && myPosts.length === 0 ? (
            <p className={sheetStyles.bookmarkState}>아직 작성한 게시글이 없습니다.</p>
          ) : null}
          {!isActivityLoading && !activityError && myPosts.length > 0 ? (
            <ul className={sheetStyles.activityList}>
              {myPosts.map((post) => (
                <li key={post.id} className={sheetStyles.activityItem}>
                  <div className={sheetStyles.activityMeta}>
                    <span>{formatProfileDate(post.createdAt)}</span>
                    <em>{post.board}</em>
                  </div>
                  <strong>{post.title}</strong>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}

import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { COMMENT_STATUS_LABELS } from "@/src/features/mypage/activityLabels";
import { useMyActivity } from "@/src/features/mypage/hooks/useMyActivity";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import { useAuthStore } from "@/src/store/authStore";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";
import sheetStyles from "@/src/components/mypage/MyPage.module.css";

export default function CommentsPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const { myComments, isActivityLoading, activityError, openActivitySheet } = useMyActivity();
  const shell = useMyPageShellStyles();

  useEffect(() => {
    if (!session) {
      void router.replace("/mypage");
      return;
    }
    openActivitySheet("comments");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  return (
    <>
      <Head><title>내 댓글 | 우동</title></Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>내 댓글</h1>
          {!isActivityLoading && !activityError ? (
            <p className={shell.heroDesc}>{myComments.length}개</p>
          ) : null}
        </section>

        <div className={shell.contentArea}>
          {isActivityLoading ? (
            <p className={sheetStyles.bookmarkState}>내 댓글을 불러오는 중입니다.</p>
          ) : null}
          {activityError ? (
            <p className={sheetStyles.bookmarkError}>{activityError}</p>
          ) : null}
          {!isActivityLoading && !activityError && myComments.length === 0 ? (
            <p className={sheetStyles.bookmarkState}>아직 작성한 댓글이 없습니다.</p>
          ) : null}
          {!isActivityLoading && !activityError && myComments.length > 0 ? (
            <ul className={sheetStyles.activityList}>
              {myComments.map((comment) => (
                <li key={comment.id} className={sheetStyles.activityItem}>
                  <div className={sheetStyles.activityMeta}>
                    <span>{formatProfileDate(comment.createdAt)}</span>
                    <em>{COMMENT_STATUS_LABELS[comment.status]}</em>
                  </div>
                  <strong>{comment.hospitalName}</strong>
                  {comment.hospitalAddress ? <p>{comment.hospitalAddress}</p> : null}
                  <p className={sheetStyles.activityBody}>{comment.content}</p>
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

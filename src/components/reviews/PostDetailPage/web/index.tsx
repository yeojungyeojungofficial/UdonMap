import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
import TopNav from "@/src/components/common/TopNav";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import {
  MAX_BOARD_COMMENT_LENGTH,
  type BoardPostComment,
} from "@/src/features/reviews/boardPosts";
import { useBoardPostDetail } from "@/src/features/reviews/hooks/useBoardPostDetail";
import styles from "./PostDetailPage.module.css";

function formatBoardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function Avatar({ name }: { name: string }) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {name.slice(0, 1) || "익"}
    </span>
  );
}

function CommentItem({ comment }: { comment: BoardPostComment }) {
  return (
    <div className={styles.commentItem}>
      <Avatar name={comment.author} />
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.author}</span>
          <span className={styles.commentDate}>
            {formatBoardDate(comment.createdAt)}
          </span>
        </div>
        <p className={styles.commentContent}>{comment.content}</p>
      </div>
    </div>
  );
}

export default function DesktopPostDetailPage() {
  const router = useRouter();
  const postId = useMemo(() => {
    const value = router.query.postId;
    return Array.isArray(value) ? value[0] : value;
  }, [router.query.postId]);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeMenu, setActiveMenu] = useState("병원후기");
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const {
    commentError,
    commentMessage,
    commentText,
    handleAddComment: submitComment,
    handleCommentTextChange,
    isCommentSubmitting,
    isLoadingPost,
    post,
    postLoadError,
  } = useBoardPostDetail({ isReady: router.isReady, postId });

  const handleAddComment = async () => {
    const isCreated = await submitComment();
    if (isCreated) commentInputRef.current?.focus();
  };

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원후기");
  };

  return (
    <>
      <Head>
        <title>{post ? `${post.title} | 우동` : "게시글 | 우동"}</title>
        <meta
          name="description"
          content={post ? post.title : "우동 게시글 상세 페이지입니다."}
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

        {!post ? (
          <main className={styles.notFound}>
            {isLoadingPost ? (
              <LoadingScreen message="게시글을 불러오는 중입니다." />
            ) : (
              <p>{postLoadError || "게시글을 찾을 수 없습니다."}</p>
            )}
            {!isLoadingPost ? (
              <Link href="/reviews" className={styles.backLink}>
                목록으로 돌아가기
              </Link>
            ) : null}
          </main>
        ) : (
          <main className={styles.content}>
            <div className={styles.topRow}>
              <Link href="/reviews" className={styles.backButton} aria-label="목록으로">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                    fill="currentColor"
                  />
                </svg>
                목록으로
              </Link>
              <div className={styles.topBadges}>
                <span className={styles.boardBadge}>{post.board}</span>
                {post.filterTag ? (
                  <span className={styles.regionBadge}>{post.filterTag}</span>
                ) : null}
              </div>
            </div>

            <header className={styles.postHeader}>
              <h1 className={styles.postTitle}>{post.title}</h1>
              <div className={styles.postMeta}>
                <Avatar name={post.author} />
                <span className={styles.postAuthor}>{post.author}</span>
                <span className={styles.postDate}>
                  {formatBoardDate(post.createdAt)}
                </span>
              </div>
            </header>

            <article
              className={styles.postContent}
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            <div className={styles.sectionDivider} />

            <section className={styles.commentSection}>
              <h2 className={styles.commentSectionTitle}>
                댓글{" "}
                <span className={styles.commentCount}>{post.commentCount}</span>
              </h2>

              <div className={styles.commentInputBox}>
                <textarea
                  ref={commentInputRef}
                  className={styles.commentInputTextarea}
                  placeholder="댓글을 입력해 주세요"
                  value={commentText}
                  rows={2}
                  maxLength={MAX_BOARD_COMMENT_LENGTH}
                  disabled={isCommentSubmitting}
                  onChange={(e) => handleCommentTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleAddComment();
                    }
                  }}
                />
                <div className={styles.commentInputActions}>
                  <span className={styles.commentCount}>
                    {commentText.trim().length}/{MAX_BOARD_COMMENT_LENGTH}
                  </span>
                  <button
                    type="button"
                    className={styles.commentSubmitButton}
                    disabled={!commentText.trim() || isCommentSubmitting}
                    onClick={() => void handleAddComment()}
                  >
                    {isCommentSubmitting ? "등록 중" : "등록"}
                  </button>
                </div>
                {commentMessage ? (
                  <p className={styles.commentFeedback}>{commentMessage}</p>
                ) : null}
                {commentError ? (
                  <p className={styles.commentError}>{commentError}</p>
                ) : null}
              </div>

              {post.comments.length === 0 ? (
                <p className={styles.emptyComments}>첫 번째 댓글을 남겨보세요.</p>
              ) : null}

              <div className={styles.commentList}>
                {post.comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            </section>
          </main>
        )}

        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
      </div>
    </>
  );
}

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
import TopNav from "@/src/components/common/TopNav";
import HospitalReportSheet from "@/src/components/common/HospitalReportSheet";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import PostComposeSheet from "@/src/components/reviews/PostComposeSheet";
import ReportReasonDialog from "@/src/components/reviews/ReportReasonDialog";
import {
  MAX_BOARD_COMMENT_LENGTH,
  getBoardQueryValue,
  getBoardTabFromQuery,
  type BoardPostComment,
} from "@/src/features/reviews/boardPosts";
import { useBoardPostDetail } from "@/src/features/reviews/hooks/useBoardPostDetail";
import type {
  BoardPostCommentReportReason,
  BoardPostReportReason,
} from "@/src/features/reviews/reportReasons";
import styles from "./PostDetailPage.module.css";

function formatBoardDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function CommentItem({
  comment,
  currentUserId,
  postAuthorId,
  deletingCommentId,
  reportingCommentId,
  onDelete,
  onReport,
}: {
  comment: BoardPostComment;
  currentUserId: string | null;
  postAuthorId: string | null;
  deletingCommentId: string | null;
  reportingCommentId: string | null;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
}) {
  const isMyComment = comment.authorId === currentUserId;
  const isPostAuthorComment = comment.authorId === postAuthorId;

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <div className={styles.commentMeta}>
            <span className={styles.commentAuthor}>{comment.author}</span>
            {isPostAuthorComment ? (
              <span className={styles.commentRole}>작성자</span>
            ) : null}
          </div>
          {isMyComment ? (
            <button
              type="button"
              className={styles.commentDeleteButton}
              disabled={deletingCommentId === comment.id}
              onClick={() => onDelete(comment.id)}
            >
              {deletingCommentId === comment.id ? "삭제 중" : "삭제"}
            </button>
          ) : (
            <button
              type="button"
              className={styles.commentReportButton}
              disabled={reportingCommentId === comment.id}
              onClick={() => onReport(comment.id)}
            >
              {reportingCommentId === comment.id ? "신고 중" : "신고"}
            </button>
          )}
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
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [reportDialogTarget, setReportDialogTarget] = useState<
    { type: "post" } | { type: "comment"; commentId: string } | null
  >(null);
  const {
    commentError,
    commentText,
    currentUserId,
    deletingCommentId,
    reportingCommentId,
    handleAddComment: submitComment,
    handleDeleteComment,
    handleDeletePost,
    handleCommentTextChange,
    handlePostUpdated,
    handleReportPost,
    handleReportComment,
    isCommentSubmitting,
    isLoadingPost,
    isPostActionSubmitting,
    post,
    postLoadError,
  } = useBoardPostDetail({ isReady: router.isReady, postId });
  const isMyPost = Boolean(
    post?.authorId && currentUserId && post.authorId === currentUserId,
  );
  const fallbackBoardTab = useMemo(
    () => getBoardTabFromQuery(router.query.board),
    [router.query.board],
  );
  const reviewListHref = useMemo(() => {
    const board = post?.board ?? fallbackBoardTab;

    return board
      ? {
          pathname: "/reviews",
          query: { board: getBoardQueryValue(board) },
        }
      : "/reviews";
  }, [fallbackBoardTab, post?.board]);

  const handleAddComment = async () => {
    const isCreated = await submitComment();
    if (isCreated) commentInputRef.current?.focus();
  };

  const closeReportSheet = () => {
    setIsReportSheetOpen(false);
    setActiveMenu("병원후기");
  };

  const handleDeletePostClick = async () => {
    setIsActionMenuOpen(false);
    if (!window.confirm("게시글을 삭제할까요?")) return;

    const isDeleted = await handleDeletePost();
    if (isDeleted) {
      await router.push(reviewListHref);
    }
  };

  const handleReportPostClick = () => {
    setIsActionMenuOpen(false);
    setReportDialogTarget({ type: "post" });
  };

  const isReportDialogSubmitting =
    reportDialogTarget?.type === "post"
      ? isPostActionSubmitting
      : reportDialogTarget?.type === "comment"
        ? reportingCommentId === reportDialogTarget.commentId
        : false;

  const closeReportReasonDialog = () => {
    if (!isReportDialogSubmitting) {
      setReportDialogTarget(null);
    }
  };

  const handleReportReasonSubmit = async (
    reason: BoardPostReportReason | BoardPostCommentReportReason,
  ) => {
    if (!reportDialogTarget) return;

    const isReported =
      reportDialogTarget.type === "post"
        ? await handleReportPost(reason as BoardPostReportReason)
        : await handleReportComment(
            reportDialogTarget.commentId,
            reason as BoardPostCommentReportReason,
          );

    if (isReported) {
      setReportDialogTarget(null);
    }
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
              <Link href={reviewListHref} className={styles.backLink}>
                목록으로 돌아가기
              </Link>
            ) : null}
          </main>
        ) : (
          <main className={styles.content}>
            <div className={styles.topRow}>
              <Link
                href={reviewListHref}
                className={styles.backButton}
                aria-label="목록으로"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                    fill="currentColor"
                  />
                </svg>
                목록으로
              </Link>
              <div className={styles.topActions}>
                <div className={styles.topBadges}>
                  <span className={styles.boardBadge}>{post.board}</span>
                  {post.filterTag ? (
                    <span className={styles.regionBadge}>{post.filterTag}</span>
                  ) : null}
                </div>
                <div className={styles.postActionMenuWrap}>
                  <button
                    type="button"
                    className={styles.postActionMenuButton}
                    aria-label="게시글 메뉴"
                    aria-expanded={isActionMenuOpen}
                    onClick={() => setIsActionMenuOpen((value) => !value)}
                  >
                    ...
                  </button>
                  {isActionMenuOpen ? (
                    <div className={styles.postActionMenu}>
                      {isMyPost ? (
                        <>
                          <button
                            type="button"
                            className={styles.postActionMenuItem}
                            onClick={() => {
                              setIsActionMenuOpen(false);
                              setIsEditSheetOpen(true);
                            }}
                          >
                            수정하기
                          </button>
                          <button
                            type="button"
                            className={`${styles.postActionMenuItem} ${styles.postActionMenuItemDanger}`}
                            disabled={isPostActionSubmitting}
                            onClick={() => void handleDeletePostClick()}
                          >
                            삭제하기
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={styles.postActionMenuItem}
                          disabled={isPostActionSubmitting}
                          onClick={handleReportPostClick}
                        >
                          신고하기
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <header className={styles.postHeader}>
              <h1 className={styles.postTitle}>{post.title}</h1>
              <div className={styles.postMeta}>
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
                {commentError ? (
                  <p className={styles.commentError}>{commentError}</p>
                ) : null}
              </div>

              {post.comments.length === 0 ? (
                <p className={styles.emptyComments}>첫 번째 댓글을 남겨보세요.</p>
              ) : null}

              <div className={styles.commentList}>
                {post.comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    postAuthorId={post.authorId}
                    deletingCommentId={deletingCommentId}
                    reportingCommentId={reportingCommentId}
                    onDelete={(commentId) => void handleDeleteComment(commentId)}
                    onReport={(commentId) =>
                      setReportDialogTarget({ type: "comment", commentId })
                    }
                  />
                ))}
              </div>
            </section>
          </main>
        )}

        <HospitalReportSheet
          isOpen={isReportSheetOpen}
          onClose={closeReportSheet}
        />
        <PostComposeSheet
          isOpen={isEditSheetOpen}
          editPost={post}
          onClose={() => setIsEditSheetOpen(false)}
          onUpdated={handlePostUpdated}
        />
        {reportDialogTarget ? (
          <ReportReasonDialog
            isOpen
            isSubmitting={isReportDialogSubmitting}
            targetType={reportDialogTarget.type}
            onClose={closeReportReasonDialog}
            onSubmit={(reason) => void handleReportReasonSubmit(reason)}
          />
        ) : null}
      </div>
    </>
  );
}

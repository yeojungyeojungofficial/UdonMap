"use client";

import type {
  Hospital,
  HospitalComment,
  ReactionSnapshot,
} from "@/src/features/hospitals/types";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import { useHospitalBottomSheetActions } from "@/src/features/hospitals/hooks/useHospitalBottomSheetActions";
import {
  getHoursRows,
  getOperationStatus,
  isClosedOperationStatus,
} from "@/src/features/hospitals/operationStatus";
import styles from "@/src/components/home/Home.module.css";

type HospitalBottomSheetProps = {
  hospital: Hospital | null;
  onClose: () => void;
  onCommentCreated?: (hospitalId: string, comment: HospitalComment) => void;
  onCommentDeleted?: (hospitalId: string, commentId: string) => void;
  onHospitalReactionChanged?: (
    hospitalId: string,
    reaction: ReactionSnapshot,
  ) => void;
  onBookmarkChanged?: (hospitalId: string, isBookmarked: boolean) => void;
  onCommentReactionChanged?: (
    hospitalId: string,
    commentId: string,
    reaction: ReactionSnapshot,
  ) => void;
  onOpenReport?: (hospital: Hospital) => void;
  isLoadingComments?: boolean;
  commentLoadError?: string;
};

type IconName =
  | "bookmark"
  | "close"
  | "comment"
  | "external"
  | "heart"
  | "phone"
  | "pin"
  | "report"
  | "share"
  | "star"
  | "thumbsDown"
  | "thumbsUp";

function getHourSegments(detail: string) {
  return detail
    .split(/\s*[|/]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function SheetIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: styles.sheetIcon,
    "aria-hidden": true,
    focusable: false,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "bookmark":
      return (
        <svg
          {...commonProps}
          className={`${styles.sheetIcon} ${styles.sheetIconBookmark}`}
        >
          <path d="M7 4.5h10v15l-5-3.4-5 3.4z" />
        </svg>
      );
    case "close":
      return (
        <svg {...commonProps}>
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      );
    case "comment":
      return (
        <svg {...commonProps}>
          <path d="M5 6.5h14v9H9l-4 3z" />
        </svg>
      );
    case "external":
      return (
        <svg {...commonProps}>
          <path d="M8 8h8v8H8z" />
          <path d="M13 5h6v6M18.5 5.5 12 12" />
        </svg>
      );
    case "heart":
      return (
        <svg {...commonProps}>
          <path d="M12 19s-7-4.3-7-9.3A3.7 3.7 0 0 1 11.6 7 3.7 3.7 0 0 1 19 9.7C19 14.7 12 19 12 19z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...commonProps}>
          <path d="M7.5 5.5 9.8 10l-2 1.6a11 11 0 0 0 4.6 4.6l1.6-2 4.5 2.3-1.2 2.7c-.3.6-1 .9-1.6.7C10 18.5 5.5 14 4.1 7.8c-.2-.7.1-1.4.7-1.7z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...commonProps}>
          <path d="M12 21s6-6.1 6-11a6 6 0 0 0-12 0c0 4.9 6 11 6 11z" />
          <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z" />
        </svg>
      );
    case "share":
      return (
        <svg {...commonProps}>
          <path d="M18 8a2.5 2.5 0 1 0-2.3-1.5L8.8 10a2.5 2.5 0 1 0 0 4l6.9 3.5A2.5 2.5 0 1 0 17 15.3L10 11.8 17 8.3c.3.4.6.7 1 .7z" />
        </svg>
      );
    case "star":
      return (
        <svg {...commonProps}>
          <path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />
        </svg>
      );
    case "thumbsUp":
      return (
        <svg {...commonProps}>
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      );
    case "thumbsDown":
      return (
        <svg {...commonProps}>
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.7a2 2 0 0 0-2 1.7l-1.4 9a2 2 0 0 0 2 2.3z" />
          <path d="M17 2h2.7A2.3 2.3 0 0 1 22 4v7a2.3 2.3 0 0 1-2.3 2H17" />
        </svg>
      );
    case "report":
      return (
        <svg {...commonProps}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
        </svg>
      );
  }
}

export default function HospitalBottomSheet({
  hospital,
  onClose,
  onCommentCreated,
  onCommentDeleted,
  onHospitalReactionChanged,
  onBookmarkChanged,
  onCommentReactionChanged,
  onOpenReport,
  isLoadingComments = false,
  commentLoadError = "",
}: HospitalBottomSheetProps) {
  const {
    bookmarkError,
    commentContent,
    commentError,
    commentReactionSubmittingId,
    currentUserId,
    deletingCommentId,
    handleBookmarkClick,
    handleCommentContentChange,
    handleCommentDelete,
    handleCommentReaction,
    handleCommentSubmit,
    handleReaction,
    handleReportClick,
    handleShare,
    hospitalReactionSubmitting,
    isAuthReady,
    isBookmarkSubmitting,
    isCommentSubmitting,
    isLoggedIn,
  } = useHospitalBottomSheetActions({
    hospital,
    onBookmarkChanged,
    onCommentCreated,
    onCommentDeleted,
    onCommentReactionChanged,
    onHospitalReactionChanged,
    onOpenReport,
  });

  if (!hospital) {
    return null;
  }

  const hoursRows = getHoursRows(hospital.hours);
  const operationStatus = getOperationStatus(hoursRows);
  const isOpen = operationStatus === "운영중";
  const isClosed = isClosedOperationStatus(operationStatus);
  const isSpecialtyHospital = hospital.isSpecialty || hospital.animals.length > 0;

  return (
    <div className={styles.sheetOverlay} role="presentation" onClick={onClose}>
      <section
        className={styles.bottomSheet}
        role="dialog"
        aria-modal="true"
        aria-label="병원 상세 정보"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHero}>
          <div className={styles.sheetHeroBadges}>
            <span className={styles.sheetRegion}>{hospital.region}</span>
            {isSpecialtyHospital ? (
              <span className={styles.sheetSpecialtyBadge}>특수동물 진료</span>
            ) : null}
            {hospital.isEmergency ? (
              <span className={styles.sheetEmergencyBadge}>응급 진료</span>
            ) : null}
          </div>
          <div className={styles.sheetHeroActions}>
            <button
              type="button"
              className={`${styles.sheetIconButton} ${
                hospital.isBookmarked ? styles.sheetIconButtonActive : ""
              }`}
              onClick={handleBookmarkClick}
              disabled={isBookmarkSubmitting || !isAuthReady}
              aria-label={hospital.isBookmarked ? "찜 해제" : "병원 찜하기"}
              aria-pressed={hospital.isBookmarked}
            >
              <SheetIcon name="bookmark" />
            </button>
            <button
              type="button"
              className={styles.sheetIconButton}
              onClick={handleShare}
              aria-label="병원 정보 공유"
            >
              <SheetIcon name="share" />
            </button>
            <button
              type="button"
              className={styles.sheetCloseButton}
              onClick={onClose}
              aria-label="상세 정보 닫기"
            >
              <SheetIcon name="close" />
            </button>
          </div>
        </div>

        <div className={styles.sheetContent}>
          <header className={styles.sheetHeader}>
            <h3 className={styles.sheetTitle}>{hospital.name}</h3>
            <p className={styles.sheetAddress}>
              <SheetIcon name="pin" />
              <span>{hospital.address}</span>
            </p>
          </header>

          <div className={styles.sheetMetrics}>
            <p className={styles.sheetMetric}>
              <SheetIcon name="heart" />
              좋아요 {hospital.likes}
            </p>
            <p className={styles.sheetMetric}>
              <SheetIcon name="comment" />
              후기 {hospital.reviewCount}
            </p>
          </div>

          <div className={styles.sheetTags}>
            {hospital.animals.map((animal) => (
              <span key={animal} className={styles.sheetTag}>
                {animal}
              </span>
            ))}
            {hospital.isEmergency ? (
              <span className={styles.sheetTagEmergency}>응급 진료</span>
            ) : null}
            {hospital.isSpecialty ? (
              <span className={styles.sheetTagHighlight}>특수동물 진료</span>
            ) : null}
          </div>

          {hospital.summary ? (
            <p className={styles.sheetSummary}>{hospital.summary}</p>
          ) : null}

          {bookmarkError ? (
            <p className={styles.commentError}>{bookmarkError}</p>
          ) : null}

          {hospital.phone || hospital.homepage || hospital.instagram ? (
            <div className={styles.sheetLinks}>
              {hospital.phone ? (
                <a
                  className={`${styles.sheetLink} ${styles.sheetPrimaryLink}`}
                  href={`tel:${hospital.phone}`}
                >
                  <SheetIcon name="phone" />
                  전화걸기
                </a>
              ) : null}
              {hospital.homepage ? (
                <a
                  className={styles.sheetLink}
                  href={hospital.homepage}
                  target="_blank"
                  rel="noreferrer"
                >
                  <SheetIcon name="external" />
                  홈페이지 바로가기
                </a>
              ) : null}
              {hospital.instagram ? (
                <a
                  className={styles.sheetLink}
                  href={hospital.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  인스타그램 바로가기
                </a>
              ) : null}
            </div>
          ) : null}

          <section className={styles.infoBlock}>
            <div className={styles.sheetSectionHeader}>
              <h4 className={styles.commentTitle}>운영시간</h4>
              <span
                className={`${styles.operationBadge} ${
                  isOpen ? styles.operationBadgeOpen : ""
                } ${isClosed ? styles.operationBadgeClosed : ""}`}
              >
                {operationStatus}
              </span>
            </div>
            {hoursRows.length > 0 ? (
              <div className={styles.infoList}>
                {hoursRows.map((row) => (
                  <div
                    key={`${row.day}-${row.detail}`}
                    className={`${styles.hoursRow} ${
                      row.isToday ? styles.hoursRowToday : ""
                    }`}
                  >
                    <span
                      className={`${styles.hoursDay} ${
                        row.day === "토" ? styles.hoursSaturday : ""
                      } ${row.day === "일" ? styles.hoursSunday : ""}`}
                    >
                      {row.day}
                    </span>
                    <span className={styles.hoursDetail}>
                      {getHourSegments(row.detail).map((segment, index) => (
                        <span
                          key={`${segment}-${index}`}
                          className={styles.hourSegment}
                        >
                          {segment}
                        </span>
                      ))}
                    </span>
                    {row.isToday ? (
                      <span className={styles.todayLabel}>오늘</span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.infoEmpty}>운영시간 정보가 아직 없습니다.</div>
            )}
          </section>

          <section className={styles.reactionSection}>
            <div className={styles.reactionButtons}>
              <button
                type="button"
                className={`${styles.reactionButton} ${
                  hospital.reaction === "like" ? styles.reactionButtonLikeActive : ""
                }`}
                onClick={() => void handleReaction("like")}
                disabled={Boolean(hospitalReactionSubmitting)}
                aria-pressed={hospital.reaction === "like"}
              >
                <SheetIcon name="thumbsUp" />
                좋아요 {hospital.likes}
              </button>
              <button
                type="button"
                className={`${styles.reactionButton} ${
                  hospital.reaction === "dislike"
                    ? styles.reactionButtonDislikeActive
                    : ""
                }`}
                onClick={() => void handleReaction("dislike")}
                disabled={Boolean(hospitalReactionSubmitting)}
                aria-pressed={hospital.reaction === "dislike"}
              >
                <SheetIcon name="thumbsDown" />
                싫어요 {hospital.dislikes}
              </button>
            </div>
            <button
              type="button"
              className={styles.reportButton}
              onClick={handleReportClick}
            >
              <SheetIcon name="report" />
              추가 제보하기
            </button>
          </section>

          <section className={styles.commentWrap}>
            <div className={styles.sheetSectionHeader}>
              <h4 className={styles.commentTitle}>이용자 댓글</h4>
              <span className={styles.commentCount}>
                {hospital.reviewCount}개
              </span>
            </div>
            <form
              className={styles.commentForm}
              onSubmit={handleCommentSubmit}
            >
              <textarea
                className={styles.commentTextarea}
                value={commentContent}
                onChange={handleCommentContentChange}
                placeholder={
                  isLoggedIn
                    ? "댓글을 입력하세요"
                    : "로그인 후 댓글을 남길 수 있습니다"
                }
                rows={3}
                maxLength={600}
                disabled={!isAuthReady || !isLoggedIn || isCommentSubmitting}
              />
              <div className={styles.commentSubmitRow}>
                <span className={styles.commentLength}>
                  {commentContent.trim().length}/600
                </span>
                <button
                  type="submit"
                  className={styles.commentSubmitButton}
                  disabled={
                    !isAuthReady ||
                    !isLoggedIn ||
                    isCommentSubmitting ||
                    !commentContent.trim()
                  }
                >
                  {isCommentSubmitting ? "등록 중" : "등록"}
                </button>
              </div>
              {commentError ? (
                <p className={styles.commentError}>{commentError}</p>
              ) : null}
            </form>
            {isLoadingComments ? (
              <LoadingScreen
                message="댓글을 불러오는 중입니다."
                variant="inline"
              />
            ) : null}
            {commentLoadError ? (
              <p className={styles.commentError}>{commentLoadError}</p>
            ) : null}
            {!isLoadingComments &&
            !commentLoadError &&
            hospital.comments.length > 0 ? (
              <ul className={styles.commentList}>
                {hospital.comments.map((comment) => (
                  <li key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <p className={styles.commentAuthor}>{comment.author}</p>
                      {comment.authorId === currentUserId ? (
                        <button
                          type="button"
                          className={styles.commentDeleteButton}
                          onClick={() => void handleCommentDelete(comment.id)}
                          disabled={deletingCommentId === comment.id}
                        >
                          {deletingCommentId === comment.id ? "삭제 중" : "삭제"}
                        </button>
                      ) : null}
                    </div>
                    <p className={styles.commentBody}>{comment.content}</p>
                    <div className={styles.commentReactionRow}>
                      <button
                        type="button"
                        className={`${styles.commentReactionButton} ${
                          comment.reaction === "like"
                            ? styles.commentReactionButtonLikeActive
                            : ""
                        }`}
                        onClick={() =>
                          void handleCommentReaction(comment.id, "like")
                        }
                        disabled={commentReactionSubmittingId === comment.id}
                        aria-pressed={comment.reaction === "like"}
                      >
                        <SheetIcon name="thumbsUp" />
                        좋아요 {comment.likes}
                      </button>
                      <button
                        type="button"
                        className={`${styles.commentReactionButton} ${
                          comment.reaction === "dislike"
                            ? styles.commentReactionButtonDislikeActive
                            : ""
                        }`}
                        onClick={() =>
                          void handleCommentReaction(comment.id, "dislike")
                        }
                        disabled={commentReactionSubmittingId === comment.id}
                        aria-pressed={comment.reaction === "dislike"}
                      >
                        <SheetIcon name="thumbsDown" />
                        싫어요 {comment.dislikes}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {!isLoadingComments &&
            !commentLoadError &&
            hospital.comments.length === 0 ? (
              <div className={styles.emptyComment}>
                <span className={styles.emptyCommentIcon}>
                  <SheetIcon name="comment" />
                </span>
                <strong>아직 등록된 댓글이 없습니다.</strong>
                <p>첫 번째 댓글을 남겨 다른 보호자들에게 도움을 주세요.</p>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}

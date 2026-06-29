"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { StaticImageData } from "next/image";
import bookmarkIcon from "@/src/assets/bookmark.png";
import closeIcon from "@/src/assets/close.png";
import commentIcon from "@/src/assets/comment.png";
import externalIcon from "@/src/assets/external.png";
import heartIcon from "@/src/assets/heart.png";
import phoneIcon from "@/src/assets/phone.png";
import pinIcon from "@/src/assets/pin.png";
import reportIcon from "@/src/assets/report.png";
import shareIcon from "@/src/assets/share.png";
import starIcon from "@/src/assets/star.png";
import thumbsDownIcon from "@/src/assets/thumbsDown.png";
import thumbsUpIcon from "@/src/assets/thumbsUp.png";
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
import styles from "@/src/features/home/components/Home.module.css";

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

type SheetSize = "half" | "full";

const SHEET_DRAG_ACTIVATION_PX = 6;
const SHEET_DRAG_THRESHOLD_PX = 24;
const SHEET_FULL_TOP_OFFSET_PX = 12;
const SHEET_HALF_HEIGHT_RATIO = 0.5;

type SheetState = {
  hospitalId: string | null;
  size: SheetSize;
};

type SheetDragStart = {
  height: number;
  viewportHeight: number;
  y: number;
};

type BottomSheetStyle = CSSProperties & {
  "--bottom-sheet-height"?: string;
};

type SheetIconStyle = CSSProperties & {
  "--sheet-icon-url"?: string;
};

const SHEET_ICON_ASSETS: Record<IconName, StaticImageData> = {
  bookmark: bookmarkIcon,
  close: closeIcon,
  comment: commentIcon,
  external: externalIcon,
  heart: heartIcon,
  phone: phoneIcon,
  pin: pinIcon,
  report: reportIcon,
  share: shareIcon,
  star: starIcon,
  thumbsDown: thumbsDownIcon,
  thumbsUp: thumbsUpIcon,
};

function clampSheetHeight(height: number, viewportHeight: number) {
  const minHeight = viewportHeight * SHEET_HALF_HEIGHT_RATIO;
  const maxHeight = viewportHeight - SHEET_FULL_TOP_OFFSET_PX;

  return Math.min(Math.max(height, minHeight), maxHeight);
}

function getSheetHeightForSize(size: SheetSize, viewportHeight: number) {
  if (size === "full") {
    return viewportHeight - SHEET_FULL_TOP_OFFSET_PX;
  }

  return viewportHeight * SHEET_HALF_HEIGHT_RATIO;
}

function getHourSegments(detail: string) {
  return detail
    .split(/\s*[|/]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function SheetIcon({ name }: { name: IconName }) {
  const icon = SHEET_ICON_ASSETS[name];
  const iconStyle: SheetIconStyle = {
    "--sheet-icon-url": `url(${icon.src})`,
  };

  return (
    <span
      className={`${styles.sheetIcon} ${
        name === "bookmark" ? styles.sheetIconBookmark : ""
      }`}
      style={iconStyle}
      aria-hidden="true"
    />
  );
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
  const [sheetState, setSheetState] = useState<SheetState>({
    hospitalId: null,
    size: "half",
  });
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetDragStartRef = useRef<SheetDragStart | null>(null);
  const didDragSheetRef = useRef(false);
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
  const sheetSize =
    sheetState.hospitalId === hospital.id ? sheetState.size : "half";
  const bottomSheetClassName = `${styles.bottomSheet} ${
    sheetSize === "full" ? styles.bottomSheetFull : ""
  } ${dragHeight !== null ? styles.bottomSheetDragging : ""}`;
  const bottomSheetStyle: BottomSheetStyle | undefined =
    dragHeight === null
      ? undefined
      : {
          "--bottom-sheet-height": `${Math.round(dragHeight)}px`,
        };

  const getNextDragHeight = (clientY: number) => {
    const dragStart = sheetDragStartRef.current;

    if (!dragStart) {
      return null;
    }

    return clampSheetHeight(
      dragStart.height - (clientY - dragStart.y),
      dragStart.viewportHeight,
    );
  };

  const releaseSheetPointerCapture = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resetSheetDrag = (event: PointerEvent<HTMLButtonElement>) => {
    sheetDragStartRef.current = null;
    setDragHeight(null);
    releaseSheetPointerCapture(event);
  };
  const setCurrentSheetSize = (
    nextSize: SheetSize | ((currentSize: SheetSize) => SheetSize),
  ) => {
    setSheetState({
      hospitalId: hospital.id,
      size: typeof nextSize === "function" ? nextSize(sheetSize) : nextSize,
    });
  };

  const handleClose = () => {
    setSheetState({
      hospitalId: hospital.id,
      size: "half",
    });
    onClose();
  };

  const handleSheetDragStart = (event: PointerEvent<HTMLButtonElement>) => {
    const viewportHeight =
      typeof window === "undefined" ? 0 : window.innerHeight;

    if (viewportHeight <= 0) {
      return;
    }

    sheetDragStartRef.current = {
      height: getSheetHeightForSize(sheetSize, viewportHeight),
      viewportHeight,
      y: event.clientY,
    };
    didDragSheetRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetDragMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragStart = sheetDragStartRef.current;

    if (!dragStart) {
      return;
    }

    const dragDistanceY = event.clientY - dragStart.y;

    if (Math.abs(dragDistanceY) >= SHEET_DRAG_ACTIVATION_PX) {
      didDragSheetRef.current = true;
    }

    const nextDragHeight = getNextDragHeight(event.clientY);

    if (nextDragHeight !== null) {
      setDragHeight(nextDragHeight);
    }
  };

  const handleSheetDragEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const dragStart = sheetDragStartRef.current;

    if (!dragStart) {
      return;
    }

    const dragDistanceY = event.clientY - dragStart.y;
    const nextDragHeight =
      getNextDragHeight(event.clientY) ?? dragStart.height;
    const minHeight = dragStart.viewportHeight * SHEET_HALF_HEIGHT_RATIO;
    const maxHeight = dragStart.viewportHeight - SHEET_FULL_TOP_OFFSET_PX;
    const midpoint = minHeight + (maxHeight - minHeight) / 2;

    if (dragDistanceY <= -SHEET_DRAG_THRESHOLD_PX || nextDragHeight >= midpoint) {
      setCurrentSheetSize("full");
    }

    if (dragDistanceY >= SHEET_DRAG_THRESHOLD_PX || nextDragHeight < midpoint) {
      setCurrentSheetSize("half");
    }

    resetSheetDrag(event);
  };

  const handleSheetHandleClick = () => {
    if (didDragSheetRef.current) {
      didDragSheetRef.current = false;
      return;
    }

    setCurrentSheetSize((currentSheetSize) =>
      currentSheetSize === "full" ? "half" : "full",
    );
  };

  return (
    <div className={styles.sheetOverlay} role="presentation" onClick={handleClose}>
      <section
        className={bottomSheetClassName}
        style={bottomSheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label="병원 상세 정보"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.sheetDragHandle}
          onClick={handleSheetHandleClick}
          onPointerDown={handleSheetDragStart}
          onPointerMove={handleSheetDragMove}
          onPointerUp={handleSheetDragEnd}
          onPointerCancel={resetSheetDrag}
          aria-label={
            sheetSize === "full"
              ? "상세창 50%로 줄이기"
              : "상세창 전체로 펼치기"
          }
          aria-expanded={sheetSize === "full"}
        >
          <span className={styles.sheetHandle} aria-hidden="true" />
        </button>
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
              onClick={handleClose}
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

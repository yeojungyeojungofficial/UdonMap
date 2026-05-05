"use client";

import { FormEvent, useEffect, useState } from "react";
import { createHospitalComment } from "@/src/home/commentApi";
import type { Hospital, HospitalComment } from "@/src/home/types";
import { supabase } from "@/src/shared/lib/supabase";
import styles from "@/src/home/Home.module.css";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

type HospitalBottomSheetProps = {
  hospital: Hospital | null;
  onClose: () => void;
  onCommentCreated?: (hospitalId: string, comment: HospitalComment) => void;
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

type HoursRow = {
  day: string;
  detail: string;
  isToday: boolean;
};

function getTodayLabel() {
  const day = new Date().getDay();
  return WEEKDAY_LABELS[day === 0 ? 6 : day - 1];
}

function splitHourEntry(entry: string, fallbackDay: string) {
  const normalizedEntry = entry.trim();
  const match = normalizedEntry.match(
    /^(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)\s*[:：]?\s*(.*)$/,
  );

  if (!match) {
    return {
      day: fallbackDay,
      detail: normalizedEntry,
    };
  }

  return {
    day: match[1].slice(0, 1),
    detail: match[2].trim() || normalizedEntry,
  };
}

function getHoursRows(hours?: string[]) {
  const todayLabel = getTodayLabel();
  const normalizedHours = (hours ?? []).filter((hour) => hour.trim().length > 0);

  return normalizedHours.map<HoursRow>((hour, index) => {
    const fallbackDay = WEEKDAY_LABELS[index] ?? "기타";
    const { day, detail } = splitHourEntry(hour, fallbackDay);

    return {
      day,
      detail,
      isToday: day === todayLabel,
    };
  });
}

function getOperationStatus(hoursRows: HoursRow[]) {
  const todayRow = hoursRows.find((row) => row.isToday);

  if (!todayRow) {
    return "운영정보";
  }

  return /휴무|쉬는|closed/i.test(todayRow.detail) ? "휴무" : "운영중";
}

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
        <svg {...commonProps}>
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
}: HospitalBottomSheetProps) {
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setIsLoggedIn(Boolean(nextSession));
        setIsAuthReady(true);
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setIsLoggedIn(Boolean(data.session));
      })
      .finally(() => {
        if (isMounted) {
          setIsAuthReady(true);
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!hospital) {
    return null;
  }

  const hoursRows = getHoursRows(hospital.hours);
  const operationStatus = getOperationStatus(hoursRows);
  const isClosed = operationStatus === "휴무";
  const isSpecialtyHospital = hospital.isSpecialty || hospital.animals.length > 0;

  const displayedLikes = hospital.likes + (reaction === "like" ? 1 : 0);

  const handleReaction = (type: "like" | "dislike") => {
    setReaction((prev) => (prev === type ? null : type));
  };

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const shareText = `${hospital.name}\n${hospital.address}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: hospital.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCommentMessage("");
    setCommentError("");

    if (!isLoggedIn) {
      setCommentError("로그인 후 댓글을 남길 수 있습니다.");
      return;
    }

    if (!commentContent.trim()) {
      setCommentError("댓글 내용을 입력해주세요.");
      return;
    }

    setIsCommentSubmitting(true);

    try {
      const comment = await createHospitalComment(hospital.id, commentContent);
      onCommentCreated?.(hospital.id, comment);
      setCommentContent("");
      setCommentMessage("댓글을 등록했습니다.");
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "댓글 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsCommentSubmitting(false);
    }
  };

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
              className={styles.sheetIconButton}
              aria-label="병원 북마크"
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
              <span className={styles.sheetTag}>응급 진료</span>
            ) : null}
            {hospital.isSpecialty ? (
              <span className={styles.sheetTagHighlight}>특수동물 진료</span>
            ) : null}
          </div>

          {hospital.summary ? (
            <p className={styles.sheetSummary}>{hospital.summary}</p>
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
                  isClosed ? styles.operationBadgeClosed : ""
                }`}
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
                  reaction === "like" ? styles.reactionButtonLikeActive : ""
                }`}
                onClick={() => handleReaction("like")}
              >
                <SheetIcon name="thumbsUp" />
                좋아요 {displayedLikes}
              </button>
              <button
                type="button"
                className={`${styles.reactionButton} ${
                  reaction === "dislike" ? styles.reactionButtonDislikeActive : ""
                }`}
                onClick={() => handleReaction("dislike")}
              >
                <SheetIcon name="thumbsDown" />
                싫어요
              </button>
            </div>
            <button type="button" className={styles.reportButton}>
              <SheetIcon name="report" />
              추가 제보하기
            </button>
          </section>

          <section className={styles.commentWrap}>
            <div className={styles.sheetSectionHeader}>
              <h4 className={styles.commentTitle}>이용자 댓글</h4>
              <span className={styles.commentCount}>
                {hospital.comments.length}개
              </span>
            </div>
            <form
              className={styles.commentForm}
              onSubmit={handleCommentSubmit}
            >
              <textarea
                className={styles.commentTextarea}
                value={commentContent}
                onChange={(event) => {
                  setCommentContent(event.currentTarget.value);
                  setCommentMessage("");
                  setCommentError("");
                }}
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
              {commentMessage ? (
                <p className={styles.commentMessage}>{commentMessage}</p>
              ) : null}
              {commentError ? (
                <p className={styles.commentError}>{commentError}</p>
              ) : null}
            </form>
            {hospital.comments.length > 0 ? (
              <ul className={styles.commentList}>
                {hospital.comments.map((comment) => (
                  <li key={comment.id} className={styles.commentItem}>
                    <p className={styles.commentAuthor}>{comment.author}</p>
                    <p className={styles.commentBody}>{comment.content}</p>
                    <p className={styles.commentLikes}>좋아요 {comment.likes}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyComment}>
                <span className={styles.emptyCommentIcon}>
                  <SheetIcon name="comment" />
                </span>
                <strong>아직 등록된 댓글이 없습니다.</strong>
                <p>첫 번째 댓글을 남겨 다른 보호자들에게 도움을 주세요.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

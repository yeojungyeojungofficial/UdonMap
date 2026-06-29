import { useState } from "react";
import {
  BOARD_POST_COMMENT_REPORT_REASONS,
  BOARD_POST_REPORT_REASONS,
  type BoardPostCommentReportReason,
  type BoardPostReportReason,
} from "@/src/features/reviews/reportReasons";
import styles from "./ReportReasonDialog.module.css";

type ReportTargetType = "post" | "comment";
type ReportReason = BoardPostReportReason | BoardPostCommentReportReason;

type ReportReasonDialogProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  targetType: ReportTargetType;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
};

const DIALOG_COPY = {
  post: {
    title: "게시글 신고하기",
    description:
      "우동의 안전한 커뮤니티 운영을 위해 신고 사유를 선택해주세요.\n신고 내용은 운영자가 확인한 뒤 필요한 조치를 진행합니다.",
    reasons: BOARD_POST_REPORT_REASONS,
  },
  comment: {
    title: "댓글 신고하기",
    description:
      "우동의 안전한 커뮤니티 운영을 위해 신고 사유를 선택해주세요.\n신고된 댓글은 운영자가 확인한 뒤 필요한 조치를 진행합니다.",
    reasons: BOARD_POST_COMMENT_REPORT_REASONS,
  },
} as const;

export default function ReportReasonDialog({
  isOpen,
  isSubmitting,
  targetType,
  onClose,
  onSubmit,
}: ReportReasonDialogProps) {
  const copy = DIALOG_COPY[targetType];
  const [selectedReason, setSelectedReason] = useState<ReportReason | "">("");

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <section
        aria-labelledby="report-reason-title"
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={styles.title} id="report-reason-title">
          {copy.title}
        </h2>
        <p className={styles.description}>{copy.description}</p>

        <fieldset className={styles.reasonList}>
          {copy.reasons.map((reason) => (
            <label className={styles.reasonOption} key={reason}>
              <input
                checked={selectedReason === reason}
                disabled={isSubmitting}
                name="reportReason"
                type="radio"
                value={reason}
                onChange={() => setSelectedReason(reason)}
              />
              <span>{reason}</span>
            </label>
          ))}
        </fieldset>

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            disabled={isSubmitting}
            type="button"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className={styles.submitButton}
            disabled={!selectedReason || isSubmitting}
            type="button"
            onClick={() => {
              if (selectedReason) {
                onSubmit(selectedReason);
              }
            }}
          >
            {isSubmitting ? "신고 중" : "신고하기"}
          </button>
        </div>
      </section>
    </div>
  );
}

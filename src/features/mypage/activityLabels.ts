export const REPORT_STATUS_LABELS = {
  pending: "접수",
  in_review: "검토중",
  approved: "승인",
  rejected: "반려",
} as const;

export const COMMENT_STATUS_LABELS = {
  visible: "공개",
  hidden: "숨김",
  deleted: "삭제됨",
} as const;

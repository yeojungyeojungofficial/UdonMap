export const BOARD_POST_REPORT_REASONS = [
  "부적절한 표현 또는 욕설",
  "허위 정보 또는 잘못된 병원 정보",
  "광고 또는 홍보성 글",
  "개인정보 노출",
  "동물 학대 또는 위험한 행위",
  "의료적으로 위험한 정보",
  "도배 또는 반복 게시",
  "기타",
] as const;

export const BOARD_POST_COMMENT_REPORT_REASONS = [
  "부적절한 표현 또는 욕설",
  "허위 정보 또는 잘못된 정보",
  "광고 또는 홍보성 댓글",
  "개인정보 노출",
  "동물 학대 또는 위험한 행위",
  "의료적으로 위험한 정보",
  "도배 또는 반복 댓글",
  "기타",
] as const;

export type BoardPostReportReason = (typeof BOARD_POST_REPORT_REASONS)[number];
export type BoardPostCommentReportReason =
  (typeof BOARD_POST_COMMENT_REPORT_REASONS)[number];

export function isBoardPostReportReason(
  value: unknown,
): value is BoardPostReportReason {
  return (
    typeof value === "string" &&
    BOARD_POST_REPORT_REASONS.includes(value as BoardPostReportReason)
  );
}

export function isBoardPostCommentReportReason(
  value: unknown,
): value is BoardPostCommentReportReason {
  return (
    typeof value === "string" &&
    BOARD_POST_COMMENT_REPORT_REASONS.includes(
      value as BoardPostCommentReportReason,
    )
  );
}

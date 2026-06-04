export const BOARD_TABS = [
  "병원후기 게시판",
  "자유게시판",
  "꿀팁 게시판",
] as const;

export const TIP_CATEGORIES = [
  "전체",
  "포유류",
  "설치류",
  "조류",
  "파충류",
  "양서류",
  "어류",
] as const;

export const MAX_BOARD_POST_TITLE_LENGTH = 100;
export const MAX_BOARD_POST_BODY_LENGTH = 5000;
export const MAX_BOARD_COMMENT_LENGTH = 600;
export const MIN_BOARD_POST_FONT_SIZE = 10;
export const MAX_BOARD_POST_FONT_SIZE = 50;

export type BoardTab = (typeof BOARD_TABS)[number];
export type TipCategory = (typeof TIP_CATEGORIES)[number];

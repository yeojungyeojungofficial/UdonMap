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

const BOARD_QUERY_BY_TAB: Record<BoardTab, string> = {
  "병원후기 게시판": "hospital",
  자유게시판: "free",
  "꿀팁 게시판": "tips",
};

const BOARD_TAB_BY_QUERY = Object.fromEntries(
  Object.entries(BOARD_QUERY_BY_TAB).map(([tab, queryValue]) => [
    queryValue,
    tab,
  ]),
) as Record<string, BoardTab>;

export function getBoardQueryValue(tab: BoardTab) {
  return BOARD_QUERY_BY_TAB[tab];
}

export function getBoardTabFromQuery(value: string | string[] | undefined) {
  const queryValue = Array.isArray(value) ? value[0] : value;
  if (!queryValue) {
    return null;
  }

  return BOARD_TAB_BY_QUERY[queryValue] ?? null;
}

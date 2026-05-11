import type { Database } from "@/src/shared/lib/database.types";

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

type BoardPostRow = Database["public"]["Tables"]["board_posts"]["Row"];
type BoardPostCommentRow =
  Database["public"]["Tables"]["board_post_comments"]["Row"];

export type BoardTab = (typeof BOARD_TABS)[number];
export type TipCategory = (typeof TIP_CATEGORIES)[number];

export type BoardPostSummary = {
  id: string;
  board: BoardTab;
  filterTag: string | null;
  title: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardPostComment = {
  id: string;
  authorId: string | null;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type BoardPostDetail = BoardPostSummary & {
  author: string;
  body: string;
  comments: BoardPostComment[];
};

export type CreateBoardPostValidationResult =
  | {
      ok: true;
      value: {
        board: BoardTab;
        filterTag: string | null;
        title: string;
        body: string;
      };
    }
  | {
      ok: false;
      message: string;
    };

export type CreateBoardCommentValidationResult =
  | {
      ok: true;
      value: {
        content: string;
      };
    }
  | {
      ok: false;
      message: string;
    };

const BLOCKED_HTML_CONTENT =
  /<\s*(script|style|iframe|object|embed|svg|math|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
]);
const VOID_TAGS = new Set(["br", "img"]);

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getAttributeValue(attributes: string, name: string) {
  const match = attributes.match(
    new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );

  return match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
}

function isSafeUrl(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  );
}

export function sanitizeBoardPostHtml(value: string) {
  return value
    .replace(BLOCKED_HTML_CONTENT, "")
    .replace(HTML_TAG, (tag, rawName: string, attributes: string) => {
      const name = rawName.toLowerCase();
      const isClosingTag = /^<\s*\//.test(tag);

      if (!ALLOWED_TAGS.has(name)) {
        return "";
      }

      if (isClosingTag) {
        return VOID_TAGS.has(name) ? "" : `</${name}>`;
      }

      if (name === "a") {
        const href = getAttributeValue(attributes, "href");
        if (!href || !isSafeUrl(href)) {
          return "<a>";
        }

        return `<a href="${escapeAttribute(
          href,
        )}" target="_blank" rel="noopener noreferrer">`;
      }

      if (name === "img") {
        const src = getAttributeValue(attributes, "src");
        const alt = getAttributeValue(attributes, "alt");
        if (!src || !isSafeUrl(src)) {
          return "";
        }

        return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(
          alt,
        )}" loading="lazy" />`;
      }

      if (name === "br") {
        return "<br />";
      }

      return `<${name}>`;
    });
}

export function isBoardTab(value: unknown): value is BoardTab {
  return BOARD_TABS.includes(value as BoardTab);
}

export function validateCreateBoardPost(
  body: unknown,
): CreateBoardPostValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const request = body as {
    board?: unknown;
    filterTag?: unknown;
    title?: unknown;
    body?: unknown;
  };
  const title = normalizeText(request.title);
  const rawBody = typeof request.body === "string" ? request.body : "";
  const plainBody = rawBody.replace(/<[^>]*>/g, "").trim();

  if (!isBoardTab(request.board)) {
    return { ok: false, message: "올바른 게시판을 선택해주세요." };
  }

  if (!title) {
    return { ok: false, message: "제목을 입력해주세요." };
  }

  if (title.length > MAX_BOARD_POST_TITLE_LENGTH) {
    return {
      ok: false,
      message: `제목은 ${MAX_BOARD_POST_TITLE_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  if (!plainBody) {
    return { ok: false, message: "내용을 입력해주세요." };
  }

  if (plainBody.length > MAX_BOARD_POST_BODY_LENGTH) {
    return {
      ok: false,
      message: `본문은 ${MAX_BOARD_POST_BODY_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  return {
    ok: true,
    value: {
      board: request.board,
      filterTag: normalizeText(request.filterTag) || null,
      title,
      body: sanitizeBoardPostHtml(rawBody),
    },
  };
}

export function validateCreateBoardComment(
  body: unknown,
): CreateBoardCommentValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const content = normalizeText((body as { content?: unknown }).content);

  if (!content) {
    return { ok: false, message: "댓글 내용을 입력해주세요." };
  }

  if (content.length > MAX_BOARD_COMMENT_LENGTH) {
    return {
      ok: false,
      message: `댓글은 ${MAX_BOARD_COMMENT_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  return {
    ok: true,
    value: {
      content,
    },
  };
}

export function toBoardPostSummary(row: BoardPostRow): BoardPostSummary {
  return {
    id: row.id,
    board: row.board,
    filterTag: row.filter_tag,
    title: row.title,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBoardPostComment(
  row: BoardPostCommentRow,
): BoardPostComment {
  return {
    id: row.id,
    authorId: row.user_id,
    author: row.author_name,
    content: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

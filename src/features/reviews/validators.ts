import {
  BOARD_TABS,
  MAX_BOARD_COMMENT_LENGTH,
  MAX_BOARD_POST_BODY_LENGTH,
  MAX_BOARD_POST_TITLE_LENGTH,
  TIP_CATEGORIES,
  type BoardTab,
} from "@/src/features/reviews/constants";
import { REGION_FILTERS } from "@/src/constants/regions";
import { sanitizeBoardPostHtml } from "@/src/features/reviews/sanitize";
import type {
  CreateBoardCommentValidationResult,
  CreateBoardPostValidationResult,
  DeleteBoardCommentValidationResult,
} from "@/src/features/reviews/types";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const filterTag = normalizeText(request.filterTag) || null;
  const rawBody = typeof request.body === "string" ? request.body : "";
  const plainBody = rawBody.replace(/<[^>]*>/g, "").replace(/\u200B/g, "").trim();

  if (!isBoardTab(request.board)) {
    return { ok: false, message: "올바른 게시판을 선택해주세요." };
  }

  if (request.board === "병원후기 게시판") {
    if (!filterTag) {
      return { ok: false, message: "지역 태그를 선택해주세요." };
    }

    if (filterTag === "전체" || !REGION_FILTERS.some((region) => region === filterTag)) {
      return { ok: false, message: "올바른 지역 태그를 선택해주세요." };
    }
  }

  if (request.board === "꿀팁 게시판") {
    if (!filterTag) {
      return { ok: false, message: "필터 태그를 선택해주세요." };
    }

    if (
      filterTag === "전체" ||
      !TIP_CATEGORIES.some((category) => category === filterTag)
    ) {
      return { ok: false, message: "올바른 필터 태그를 선택해주세요." };
    }
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
      filterTag: request.board === "자유게시판" ? null : filterTag,
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

export function validateDeleteBoardComment(
  body: unknown,
): DeleteBoardCommentValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const commentId = normalizeText((body as { commentId?: unknown }).commentId);

  if (!commentId) {
    return { ok: false, message: "댓글 ID가 필요합니다." };
  }

  return {
    ok: true,
    value: {
      commentId,
    },
  };
}

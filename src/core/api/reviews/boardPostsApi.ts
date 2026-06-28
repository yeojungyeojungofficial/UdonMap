import { loadAuthSession } from "@/src/core/authSession";
import { getSupabaseBrowserClient } from "@/src/core/supabase";
import type {
  BoardPostComment,
  BoardPostDetail,
  BoardPostSummary,
  BoardTab,
} from "@/src/features/reviews/boardPosts";
import type {
  BoardPostCommentReportReason,
  BoardPostReportReason,
} from "@/src/features/reviews/reportReasons";

type BoardPostListResponse =
  | {
      posts: BoardPostSummary[];
    }
  | {
      error: string;
    };

type BoardPostDetailResponse =
  | {
      post: BoardPostDetail;
    }
  | {
      postId: string;
    }
  | {
      error: string;
    };

type CreateBoardPostResponse =
  | {
      post: BoardPostSummary;
    }
  | {
      error: string;
    };

type UpdateBoardPostResponse =
  | {
      post: BoardPostDetail;
    }
  | {
      error: string;
    };

type CreateBoardCommentResponse =
  | {
      comment: BoardPostComment;
    }
  | {
      error: string;
    };

type DeleteBoardCommentResponse =
  | {
      commentId: string;
    }
  | {
      error: string;
    };

type ReportBoardPostResponse =
  | {
      reportId: string;
    }
  | {
      error: string;
    };

type ReportBoardPostCommentResponse =
  | {
      reportId: string;
    }
  | {
      error: string;
    };

const BOARD_POST_LIST_CACHE_TTL_MS = 15_000;

const boardPostListCache = new Map<
  string,
  {
    expiresAt: number;
    posts: BoardPostSummary[];
  }
>();
const pendingBoardPostListRequests = new Map<
  string,
  Promise<BoardPostSummary[]>
>();
const pendingBoardPostDetailRequests = new Map<
  string,
  Promise<BoardPostDetail>
>();

function getBoardPostListCacheKey(board: BoardTab, filterTag?: string | null) {
  return `${board}:${filterTag ?? ""}`;
}

function clearBoardPostListCache() {
  boardPostListCache.clear();
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);

  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  return session.access_token;
}

async function loadOptionalAuthSession() {
  try {
    return await loadAuthSession(getSupabaseBrowserClient());
  } catch {
    return null;
  }
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

export async function fetchBoardPosts(
  board: BoardTab,
  filterTag?: string | null,
) {
  const cacheKey = getBoardPostListCacheKey(board, filterTag);
  const cached = boardPostListCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.posts;
  }

  const pendingRequest = pendingBoardPostListRequests.get(cacheKey);

  if (pendingRequest) {
    return pendingRequest;
  }

  const params = new URLSearchParams({
    board,
  });

  if (filterTag && filterTag !== "전체") {
    params.set("filterTag", filterTag);
  }

  const request = (async () => {
    const response = await fetch(`/api/board-posts?${params.toString()}`);
    const result = await parseJson<BoardPostListResponse>(response);

    if (!response.ok || !result || "error" in result) {
      throw new Error(
        result && "error" in result
          ? result.error
          : "게시글 목록을 불러오지 못했습니다.",
      );
    }

    boardPostListCache.set(cacheKey, {
      expiresAt: Date.now() + BOARD_POST_LIST_CACHE_TTL_MS,
      posts: result.posts,
    });

    return result.posts;
  })().finally(() => {
    pendingBoardPostListRequests.delete(cacheKey);
  });

  pendingBoardPostListRequests.set(cacheKey, request);
  return request;
}

export async function fetchBoardPostDetail(postId: string) {
  const session = await loadOptionalAuthSession();
  const cacheKey = `${postId}:${session?.user.id ?? "anon"}`;
  const pendingRequest = pendingBoardPostDetailRequests.get(cacheKey);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    const response = await fetch(`/api/board-posts/${postId}`, {
      headers: session
        ? {
            Authorization: `Bearer ${session.access_token}`,
          }
        : undefined,
    });
    const result = await parseJson<BoardPostDetailResponse>(response);

    if (!response.ok || !result || "error" in result) {
      throw new Error(
        result && "error" in result
          ? result.error
          : "게시글을 불러오지 못했습니다.",
      );
    }

    if (!("post" in result)) {
      throw new Error("게시글 응답이 올바르지 않습니다.");
    }

    return result.post;
  })().finally(() => {
    pendingBoardPostDetailRequests.delete(cacheKey);
  });

  pendingBoardPostDetailRequests.set(cacheKey, request);
  return request;
}

export async function createBoardPost(input: {
  board: BoardTab;
  filterTag: string | null;
  title: string;
  body: string;
}) {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/board-posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  const result = await parseJson<CreateBoardPostResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "게시글 등록에 실패했습니다.",
    );
  }

  clearBoardPostListCache();
  return result.post;
}

export async function updateBoardPost(
  postId: string,
  input: {
    board: BoardTab;
    filterTag: string | null;
    title: string;
    body: string;
  },
) {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/board-posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  const result = await parseJson<UpdateBoardPostResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "게시글 수정에 실패했습니다.",
    );
  }

  if (!("post" in result)) {
    throw new Error("게시글 수정 응답이 올바르지 않습니다.");
  }

  clearBoardPostListCache();
  return result.post;
}

export async function deleteBoardPost(postId: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/board-posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const result = await parseJson<BoardPostDetailResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "게시글 삭제에 실패했습니다.",
    );
  }

  if (!("postId" in result)) {
    throw new Error("게시글 삭제 응답이 올바르지 않습니다.");
  }

  clearBoardPostListCache();
  return result.postId;
}

export async function reportBoardPost(
  postId: string,
  reason: BoardPostReportReason,
) {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/board-posts/${postId}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ reason }),
  });
  const result = await parseJson<ReportBoardPostResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "게시글 신고에 실패했습니다.",
    );
  }

  return result.reportId;
}

export async function reportBoardPostComment(
  postId: string,
  commentId: string,
  reason: BoardPostCommentReportReason,
) {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `/api/board-posts/${postId}/comments/${commentId}/report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    },
  );
  const result = await parseJson<ReportBoardPostCommentResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "댓글 신고에 실패했습니다.",
    );
  }

  return result.reportId;
}

export async function createBoardPostComment(postId: string, content: string) {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/board-posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ content }),
  });
  const result = await parseJson<CreateBoardCommentResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "댓글 저장에 실패했습니다.",
    );
  }

  clearBoardPostListCache();
  return result;
}

export async function deleteBoardPostComment(
  postId: string,
  commentId: string,
) {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/board-posts/${postId}/comments`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ commentId }),
  });
  const result = await parseJson<DeleteBoardCommentResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "댓글 삭제에 실패했습니다.",
    );
  }

  clearBoardPostListCache();
  return result.commentId;
}

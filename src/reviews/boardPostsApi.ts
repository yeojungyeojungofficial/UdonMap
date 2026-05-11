import { loadAuthSession } from "@/src/shared/lib/authSession";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import type {
  BoardPostComment,
  BoardPostDetail,
  BoardPostSummary,
  BoardTab,
} from "@/src/shared/lib/boardPosts";

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
      error: string;
    };

type CreateBoardPostResponse =
  | {
      post: BoardPostSummary;
    }
  | {
      error: string;
    };

type CreateBoardCommentResponse =
  | {
      comment: BoardPostComment;
      commentCount: number;
    }
  | {
      error: string;
    };

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);

  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  return session.access_token;
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

export async function fetchBoardPosts(
  board: BoardTab,
  filterTag?: string | null,
) {
  const params = new URLSearchParams({
    board,
  });

  if (filterTag && filterTag !== "전체") {
    params.set("filterTag", filterTag);
  }

  const response = await fetch(`/api/board-posts?${params.toString()}`);
  const result = await parseJson<BoardPostListResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "게시글 목록을 불러오지 못했습니다.",
    );
  }

  return result.posts;
}

export async function fetchBoardPostDetail(postId: string) {
  const response = await fetch(`/api/board-posts/${postId}`);
  const result = await parseJson<BoardPostDetailResponse>(response);

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "게시글을 불러오지 못했습니다.",
    );
  }

  return result.post;
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

  return result.post;
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

  return result;
}

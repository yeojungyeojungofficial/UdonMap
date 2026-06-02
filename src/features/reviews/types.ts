import type { Database } from "@/src/core/database.types";
import type { BoardTab } from "@/src/features/reviews/constants";

export type { BoardTab, TipCategory } from "@/src/features/reviews/constants";

export type BoardPostRow =
  Database["public"]["Tables"]["board_posts"]["Row"];
export type BoardPostCommentRow =
  Database["public"]["Tables"]["board_post_comments"]["Row"];

export type BoardPostSummary = {
  id: string;
  authorId: string | null;
  author: string;
  board: BoardTab;
  filterTag: string | null;
  title: string;
  commentCount: number;
  viewCount: number;
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

export type DeleteBoardCommentValidationResult =
  | {
      ok: true;
      value: {
        commentId: string;
      };
    }
  | {
      ok: false;
      message: string;
    };

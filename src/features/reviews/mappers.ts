import type {
  BoardPostComment,
  BoardPostCommentRow,
  BoardPostRow,
  BoardPostSummary,
} from "@/src/features/reviews/types";

export function toBoardPostSummary(row: BoardPostRow): BoardPostSummary {
  return {
    id: row.id,
    authorId: row.user_id,
    board: row.board,
    filterTag: row.filter_tag,
    title: row.title,
    commentCount: row.comment_count,
    viewCount: row.view_count,
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

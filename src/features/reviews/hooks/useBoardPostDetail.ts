import { useCallback, useEffect, useState } from "react";
import {
  createBoardPostComment,
  deleteBoardPost,
  deleteBoardPostComment,
  fetchBoardPostDetail,
  reportBoardPost,
  reportBoardPostComment,
} from "@/src/core/api/reviews/boardPostsApi";
import { useAuthSessionState } from "@/src/features/auth/hooks/useAuthSessionState";
import type { BoardPostDetail } from "@/src/features/reviews/boardPosts";

type UseBoardPostDetailOptions = {
  isReady: boolean;
  postId?: string;
};

export function useBoardPostDetail({
  isReady,
  postId,
}: UseBoardPostDetailOptions) {
  const [post, setPost] = useState<BoardPostDetail | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [postLoadError, setPostLoadError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(
    null,
  );
  const [commentError, setCommentError] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [postActionError, setPostActionError] = useState("");
  const [postActionMessage, setPostActionMessage] = useState("");
  const [isPostActionSubmitting, setIsPostActionSubmitting] = useState(false);
  const { currentUserId } = useAuthSessionState({
    onError: setCommentError,
  });

  useEffect(() => {
    if (!isReady || !postId) {
      return;
    }

    let isMounted = true;

    const loadPostDetail = async () => {
      setIsLoadingPost(true);
      setPostLoadError("");
      setPost(null);

      try {
        const nextPost = await fetchBoardPostDetail(postId);
        if (!isMounted) return;
        setPost(nextPost);
      } catch (error) {
        if (!isMounted) return;
        setPostLoadError(
          error instanceof Error
            ? error.message
            : "게시글을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingPost(false);
        }
      }
    };

    void loadPostDetail();

    return () => {
      isMounted = false;
    };
  }, [isReady, postId]);

  const clearCommentFeedback = useCallback(() => {
    setCommentError("");
    setCommentMessage("");
  }, []);

  const clearPostActionFeedback = useCallback(() => {
    setPostActionError("");
    setPostActionMessage("");
  }, []);

  const handleCommentTextChange = useCallback(
    (value: string) => {
      setCommentText(value);
      clearCommentFeedback();
    },
    [clearCommentFeedback],
  );

  const handleAddComment = useCallback(async () => {
    if (!post || isCommentSubmitting) return false;

    const content = commentText.trim();
    if (!content) return false;

    setIsCommentSubmitting(true);
    clearCommentFeedback();

    try {
      const result = await createBoardPostComment(post.id, content);
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              commentCount: currentPost.commentCount + 1,
              comments: [...currentPost.comments, result.comment],
            }
          : currentPost,
      );
      setCommentText("");
      setCommentMessage("댓글을 등록했습니다.");
      return true;
    } catch (error) {
      setCommentError(
        error instanceof Error
          ? error.message
          : "댓글 저장 중 알 수 없는 오류가 발생했습니다.",
      );
      return false;
    } finally {
      setIsCommentSubmitting(false);
    }
  }, [clearCommentFeedback, commentText, isCommentSubmitting, post]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!post || deletingCommentId) return;

      setDeletingCommentId(commentId);
      clearCommentFeedback();

      try {
        const deletedCommentId = await deleteBoardPostComment(post.id, commentId);
        setPost((currentPost) =>
          currentPost
            ? {
                ...currentPost,
                commentCount: Math.max(0, currentPost.commentCount - 1),
                comments: currentPost.comments.filter(
                  (comment) => comment.id !== deletedCommentId,
                ),
              }
            : currentPost,
        );
        setCommentMessage("댓글을 삭제했습니다.");
      } catch (error) {
        setCommentError(
          error instanceof Error
            ? error.message
            : "댓글 삭제 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setDeletingCommentId(null);
      }
    },
    [clearCommentFeedback, deletingCommentId, post],
  );

  const handleReportComment = useCallback(
    async (commentId: string) => {
      if (!post || reportingCommentId) return;

      setReportingCommentId(commentId);
      clearCommentFeedback();

      try {
        await reportBoardPostComment(post.id, commentId);
        setCommentMessage("댓글 신고가 접수되었습니다.");
      } catch (error) {
        setCommentError(
          error instanceof Error
            ? error.message
            : "댓글 신고 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setReportingCommentId(null);
      }
    },
    [clearCommentFeedback, post, reportingCommentId],
  );

  const handlePostUpdated = useCallback((updatedPost: BoardPostDetail) => {
    setPost((currentPost) =>
      currentPost
        ? {
            ...updatedPost,
            comments: currentPost.comments,
            commentCount: currentPost.commentCount,
          }
        : updatedPost,
    );
    setPostActionMessage("게시글을 수정했습니다.");
    setPostActionError("");
  }, []);

  const handleDeletePost = useCallback(async () => {
    if (!post || isPostActionSubmitting) return false;

    setIsPostActionSubmitting(true);
    clearPostActionFeedback();

    try {
      await deleteBoardPost(post.id);
      setPostActionMessage("게시글을 삭제했습니다.");
      return true;
    } catch (error) {
      setPostActionError(
        error instanceof Error
          ? error.message
          : "게시글 삭제 중 알 수 없는 오류가 발생했습니다.",
      );
      return false;
    } finally {
      setIsPostActionSubmitting(false);
    }
  }, [clearPostActionFeedback, isPostActionSubmitting, post]);

  const handleReportPost = useCallback(async () => {
    if (!post || isPostActionSubmitting) return;

    setIsPostActionSubmitting(true);
    clearPostActionFeedback();

    try {
      await reportBoardPost(post.id);
      setPostActionMessage("신고가 접수되었습니다.");
    } catch (error) {
      setPostActionError(
        error instanceof Error
          ? error.message
          : "게시글 신고 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsPostActionSubmitting(false);
    }
  }, [clearPostActionFeedback, isPostActionSubmitting, post]);

  return {
    commentError,
    commentMessage,
    commentText,
    currentUserId,
    deletingCommentId,
    handleAddComment,
    handleDeleteComment,
    handleCommentTextChange,
    handleDeletePost,
    handlePostUpdated,
    handleReportPost,
    handleReportComment,
    isCommentSubmitting,
    isLoadingPost,
    isPostActionSubmitting,
    post,
    postActionError,
    postActionMessage,
    postLoadError,
    reportingCommentId,
  };
}

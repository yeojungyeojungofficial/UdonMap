import { useCallback, useEffect, useState } from "react";
import {
  createBoardPostComment,
  fetchBoardPostDetail,
} from "@/src/core/api/reviews/boardPostsApi";
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
  const [commentError, setCommentError] = useState("");
  const [commentMessage, setCommentMessage] = useState("");

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

  return {
    commentError,
    commentMessage,
    commentText,
    handleAddComment,
    handleCommentTextChange,
    isCommentSubmitting,
    isLoadingPost,
    post,
    postLoadError,
  };
}

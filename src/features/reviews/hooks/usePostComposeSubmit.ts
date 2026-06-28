import { useCallback, useRef, useState } from "react";
import {
  createBoardPost,
  updateBoardPost,
} from "@/src/core/api/reviews/boardPostsApi";
import type {
  BoardPostDetail,
  BoardPostSummary,
  BoardTab,
} from "@/src/features/reviews/boardPosts";
import {
  MAX_POST_BODY,
  type ReviewTag,
  type TipTag,
} from "@/src/features/reviews/postComposeConfig";

type SubmitPostInput = {
  postId?: string;
  selectedBoard: BoardTab;
  selectedReviewTag: ReviewTag | null;
  selectedTipTag: TipTag | null;
  title: string;
};

type UsePostComposeSubmitOptions = {
  getHtml: () => string;
  getTextLength: () => number;
  onBodyLengthChange: (length: number) => void;
  onClose: () => void;
  onCreated?: (post: BoardPostSummary) => void;
  onSubmitted?: () => Promise<void> | void;
  onUpdated?: (post: BoardPostDetail) => void;
};

export function usePostComposeSubmit({
  getHtml,
  getTextLength,
  onBodyLengthChange,
  onClose,
  onCreated,
  onSubmitted,
  onUpdated,
}: UsePostComposeSubmitOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const hasSubmittedRef = useRef(false);

  const hasSubmitted = useCallback(() => hasSubmittedRef.current, []);

  const submitPost = useCallback(
    async ({
      postId,
      selectedBoard,
      selectedReviewTag,
      selectedTipTag,
      title,
    }: SubmitPostInput) => {
      if (isSubmitting) return;

      const body = getHtml();
      const nextBodyLength = getTextLength();
      const filterTag =
        selectedBoard === "병원후기 게시판"
          ? (selectedReviewTag ?? null)
          : selectedBoard === "꿀팁 게시판"
            ? (selectedTipTag ?? null)
            : null;

      onBodyLengthChange(nextBodyLength);

      if (selectedBoard === "병원후기 게시판" && !selectedReviewTag) {
        setSubmitError("지역 태그를 선택해주세요.");
        return;
      }

      if (selectedBoard === "꿀팁 게시판" && !selectedTipTag) {
        setSubmitError("필터 태그를 선택해주세요.");
        return;
      }

      if (nextBodyLength === 0) {
        setSubmitError("내용을 입력해주세요.");
        return;
      }

      if (nextBodyLength > MAX_POST_BODY) {
        setSubmitError(
          `본문은 ${MAX_POST_BODY.toLocaleString()}자 이하로 입력해주세요.`,
        );
        return;
      }

      setIsSubmitting(true);
      setSubmitError("");

      try {
        const input = {
          board: selectedBoard,
          filterTag,
          title: title.trim(),
          body,
        };
        const post = postId
          ? await updateBoardPost(postId, input)
          : await createBoardPost(input);

        hasSubmittedRef.current = true;
        if (postId) {
          onUpdated?.(post as BoardPostDetail);
        } else {
          onCreated?.(post as BoardPostSummary);
        }
        await onSubmitted?.();
        onClose();
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      getHtml,
      getTextLength,
      isSubmitting,
      onBodyLengthChange,
      onClose,
      onCreated,
      onSubmitted,
      onUpdated,
    ],
  );

  return {
    hasSubmitted,
    isSubmitting,
    setSubmitError,
    submitError,
    submitPost,
  };
}

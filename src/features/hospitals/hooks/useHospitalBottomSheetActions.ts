import {
  useCallback,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAppToast } from "@/src/components/common/AppToast";
import { useAuthSessionState } from "@/src/features/auth/hooks/useAuthSessionState";
import {
  createHospitalComment,
  deleteHospitalComment,
  updateHospitalBookmark,
  updateHospitalCommentReaction,
  updateHospitalReaction,
} from "@/src/core/api/hospitals/hospitalInteractionsApi";
import type {
  Hospital,
  HospitalComment,
  ReactionSnapshot,
  ReactionType,
} from "@/src/features/hospitals/types";

type UseHospitalBottomSheetActionsOptions = {
  hospital: Hospital | null;
  onBookmarkChanged?: (hospitalId: string, isBookmarked: boolean) => void;
  onCommentCreated?: (hospitalId: string, comment: HospitalComment) => void;
  onCommentDeleted?: (hospitalId: string, commentId: string) => void;
  onCommentReactionChanged?: (
    hospitalId: string,
    commentId: string,
    reaction: ReactionSnapshot,
  ) => void;
  onHospitalReactionChanged?: (
    hospitalId: string,
    reaction: ReactionSnapshot,
  ) => void;
};

export function useHospitalBottomSheetActions({
  hospital,
  onBookmarkChanged,
  onCommentCreated,
  onCommentDeleted,
  onCommentReactionChanged,
  onHospitalReactionChanged,
}: UseHospitalBottomSheetActionsOptions) {
  const [commentContent, setCommentContent] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [bookmarkError, setBookmarkError] = useState("");
  const [isBookmarkSubmitting, setIsBookmarkSubmitting] = useState(false);
  const [hospitalReactionSubmitting, setHospitalReactionSubmitting] =
    useState<ReactionType | null>(null);
  const [commentReactionSubmittingId, setCommentReactionSubmittingId] =
    useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const showToast = useAppToast();
  const handleAuthError = useCallback((message: string) => {
    setCommentError(message);
  }, []);
  const { currentUserId, isAuthReady, isLoggedIn } = useAuthSessionState({
    onError: handleAuthError,
  });

  const clearCommentFeedback = useCallback(() => {
    setCommentError("");
  }, []);

  const handleShare = useCallback(async () => {
    if (!hospital || typeof window === "undefined") {
      return;
    }

    const shareText = `${hospital.name}\n${hospital.address}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: hospital.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        return;
      }
    }

    await navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
  }, [hospital]);

  const handleBookmarkClick = useCallback(async () => {
    setBookmarkError("");
    clearCommentFeedback();

    if (!hospital) {
      return;
    }

    if (!isLoggedIn) {
      setBookmarkError("로그인 후 찜할 수 있습니다.");
      return;
    }

    const nextIsBookmarked = !hospital.isBookmarked;
    setIsBookmarkSubmitting(true);

    try {
      const savedIsBookmarked = await updateHospitalBookmark(
        hospital.id,
        nextIsBookmarked,
      );
      onBookmarkChanged?.(hospital.id, savedIsBookmarked);
    } catch (error) {
      setBookmarkError(
        error instanceof Error
          ? error.message
          : "찜 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsBookmarkSubmitting(false);
    }
  }, [clearCommentFeedback, hospital, isLoggedIn, onBookmarkChanged]);

  const handleCommentContentChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setCommentContent(event.currentTarget.value);
      clearCommentFeedback();
    },
    [clearCommentFeedback],
  );

  const handleCommentSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      clearCommentFeedback();

      if (!hospital) {
        return;
      }

      if (!isLoggedIn) {
        setCommentError("로그인 후 댓글을 남길 수 있습니다.");
        return;
      }

      if (!commentContent.trim()) {
        setCommentError("댓글 내용을 입력해주세요.");
        return;
      }

      setIsCommentSubmitting(true);

      try {
        const comment = await createHospitalComment(hospital.id, commentContent);
        onCommentCreated?.(hospital.id, comment);
        setCommentContent("");
        showToast({ message: "댓글을 등록했습니다.", tone: "success" });
      } catch (error) {
        setCommentError(
          error instanceof Error
            ? error.message
            : "댓글 저장 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsCommentSubmitting(false);
      }
    },
    [
      clearCommentFeedback,
      commentContent,
      hospital,
      isLoggedIn,
      onCommentCreated,
      showToast,
    ],
  );

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      clearCommentFeedback();

      if (!hospital) {
        return;
      }

      if (!isLoggedIn) {
        setCommentError("로그인 후 반응을 남길 수 있습니다.");
        return;
      }

      setHospitalReactionSubmitting(type);

      try {
        const reaction = await updateHospitalReaction(hospital.id, type);
        onHospitalReactionChanged?.(hospital.id, reaction);
      } catch (error) {
        setCommentError(
          error instanceof Error
            ? error.message
            : "반응 저장 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setHospitalReactionSubmitting(null);
      }
    },
    [clearCommentFeedback, hospital, isLoggedIn, onHospitalReactionChanged],
  );

  const handleCommentReaction = useCallback(
    async (commentId: string, type: ReactionType) => {
      clearCommentFeedback();

      if (!hospital) {
        return;
      }

      if (!isLoggedIn) {
        setCommentError("로그인 후 반응을 남길 수 있습니다.");
        return;
      }

      setCommentReactionSubmittingId(commentId);

      try {
        const reaction = await updateHospitalCommentReaction(
          hospital.id,
          commentId,
          type,
        );
        onCommentReactionChanged?.(hospital.id, commentId, reaction);
      } catch (error) {
        setCommentError(
          error instanceof Error
            ? error.message
            : "반응 저장 중 알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setCommentReactionSubmittingId(null);
      }
    },
    [clearCommentFeedback, hospital, isLoggedIn, onCommentReactionChanged],
  );

  const handleCommentDelete = useCallback(
    async (commentId: string) => {
      clearCommentFeedback();
      setDeletingCommentId(commentId);

      if (!hospital) {
        setDeletingCommentId(null);
        return;
      }

      try {
        const deletedCommentId = await deleteHospitalComment(
          hospital.id,
          commentId,
        );
        onCommentDeleted?.(hospital.id, deletedCommentId);
        showToast({ message: "댓글을 삭제했습니다.", tone: "success" });
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
    [clearCommentFeedback, hospital, onCommentDeleted, showToast],
  );

  return {
    bookmarkError,
    commentContent,
    commentError,
    commentReactionSubmittingId,
    currentUserId,
    deletingCommentId,
    handleBookmarkClick,
    handleCommentContentChange,
    handleCommentDelete,
    handleCommentReaction,
    handleCommentSubmit,
    handleReaction,
    handleShare,
    hospitalReactionSubmitting,
    isAuthReady,
    isBookmarkSubmitting,
    isCommentSubmitting,
    isLoggedIn,
  };
}

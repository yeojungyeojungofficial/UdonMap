import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  type BoardPostDetail,
  type BoardPostSummary,
  type BoardTab,
} from "@/src/features/reviews/boardPosts";
import {
  POST_COMPOSE_PHOTO_DELETED_EVENT,
  usePostComposeEditor,
} from "@/src/features/reviews/hooks/usePostComposeEditor";
import { usePostComposeSubmit } from "@/src/features/reviews/hooks/usePostComposeSubmit";
import { usePostImageUpload } from "@/src/features/reviews/hooks/usePostImageUpload";
import {
  MAX_POST_BODY,
  MAX_POST_PHOTOS,
  type ReviewTag,
  type TipTag,
} from "@/src/features/reviews/postComposeConfig";

type EditorClassNames = {
  imgWrapper: string;
  imgEl: string;
  imgDragHandle: string;
  imgResizeHandle: string;
  imgRemoveButton: string;
  imgDragging: string;
  inlineLink: string;
};

type UsePostComposeSheetControllerOptions = {
  defaultBoard?: BoardTab;
  editPost?: BoardPostDetail | null;
  editorClassNames: EditorClassNames;
  onClose: () => void;
  onCreated?: (post: BoardPostSummary) => void;
  onUpdated?: (post: BoardPostDetail) => void;
};

export function usePostComposeSheetController({
  defaultBoard = "자유게시판",
  editPost = null,
  editorClassNames,
  onClose,
  onCreated,
  onUpdated,
}: UsePostComposeSheetControllerOptions) {
  const initialBoard = editPost?.board ?? defaultBoard;
  const [selectedBoard, setSelectedBoard] = useState<BoardTab>(initialBoard);
  const [title, setTitle] = useState(editPost?.title ?? "");
  const [selectedReviewTag, setSelectedReviewTag] = useState<ReviewTag | null>(
    editPost?.board === "병원후기 게시판"
      ? ((editPost.filterTag as ReviewTag | null) ?? null)
      : null,
  );
  const [selectedTipTag, setSelectedTipTag] = useState<TipTag | null>(
    editPost?.board === "꿀팁 게시판"
      ? ((editPost.filterTag as TipTag | null) ?? null)
      : null,
  );
  const [bodyLength, setBodyLength] = useState(0);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState("16px");
  const [selectedFontWeight, setSelectedFontWeight] = useState("400");

  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const cleanupDeletedExistingImagesRef = useRef<(() => Promise<void>) | null>(
    null,
  );

  const {
    applyTextStyle,
    editorRef,
    buildResizableImage,
    countPhotos,
    getHtml,
    getTextLength,
    handleEditorDragOver,
    handleEditorDrop,
    handleEditorPaste,
    hydrateEditorImages,
    insertLink,
    insertNodeAtCursor,
    revokeEditorObjectUrls,
    saveSelection,
    updateBodyLength,
  } = usePostComposeEditor({
    classNames: editorClassNames,
    onBodyLengthChange: setBodyLength,
  });

  const { hasSubmitted, isSubmitting, setSubmitError, submitError, submitPost } =
    usePostComposeSubmit({
      getHtml,
      getTextLength,
      onBodyLengthChange: setBodyLength,
      onClose,
      onCreated,
      onSubmitted: () => cleanupDeletedExistingImagesRef.current?.(),
      onUpdated,
    });

  const {
    cleanupDeletedExistingImages,
    cleanupUploadedImages,
    handleFileChange,
    handleEditorPhotoDeleted,
    photoCount,
    photoLimitMsg,
    syncPhotoCount,
    uploadingCount,
  } = usePostImageUpload({
    buildResizableImage,
    countPhotos,
    insertNodeAtCursor,
    onErrorMessage: setSubmitError,
  });

  const handleClose = useCallback(() => {
    revokeEditorObjectUrls();
    if (!hasSubmitted()) void cleanupUploadedImages();
    onClose();
  }, [cleanupUploadedImages, hasSubmitted, onClose, revokeEditorObjectUrls]);

  const handleLinkInsert = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) return;
    insertLink(url);
    setLinkUrl("");
    setIsLinkInputOpen(false);
  }, [insertLink, linkUrl]);

  const handleLinkKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleLinkInsert();
      }
    },
    [handleLinkInsert],
  );

  const handleOpenLink = useCallback(() => {
    saveSelection();
    setIsLinkInputOpen((prev) => !prev);
    if (!isLinkInputOpen) {
      setTimeout(() => linkInputRef.current?.focus(), 40);
    }
  }, [isLinkInputOpen, saveSelection]);

  const handleFontSizeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextFontSize = event.target.value;
      setSelectedFontSize(nextFontSize);
      applyTextStyle({
        fontSize: nextFontSize,
        fontWeight: selectedFontWeight,
      });
    },
    [applyTextStyle, selectedFontWeight],
  );

  const handleFontWeightChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextFontWeight = event.target.value;
      setSelectedFontWeight(nextFontWeight);
      applyTextStyle({
        fontSize: selectedFontSize,
        fontWeight: nextFontWeight,
      });
    },
    [applyTextStyle, selectedFontSize],
  );

  const handleSubmit = useCallback(() => {
    void submitPost({
      postId: editPost?.id,
      selectedBoard,
      selectedReviewTag,
      selectedTipTag,
      title,
    });
  }, [
    editPost?.id,
    selectedBoard,
    selectedReviewTag,
    selectedTipTag,
    submitPost,
    title,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => titleRef.current?.focus(), 80);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    cleanupDeletedExistingImagesRef.current = cleanupDeletedExistingImages;
  }, [cleanupDeletedExistingImages]);

  useEffect(() => {
    if (!editPost || !editorRef.current) return;
    editorRef.current.innerHTML = editPost.body;
    hydrateEditorImages();
    updateBodyLength();
    syncPhotoCount();
  }, [
    editPost,
    editorRef,
    hydrateEditorImages,
    syncPhotoCount,
    updateBodyLength,
  ]);

  useEffect(() => {
    return revokeEditorObjectUrls;
  }, [revokeEditorObjectUrls]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handlePhotoDeleted = (event: Event) => {
      const storagePath =
        (event as CustomEvent<{ storagePath?: string }>).detail?.storagePath ??
        "";
      void handleEditorPhotoDeleted(storagePath);
    };

    editor.addEventListener(
      POST_COMPOSE_PHOTO_DELETED_EVENT,
      handlePhotoDeleted,
    );
    return () => {
      editor.removeEventListener(
        POST_COMPOSE_PHOTO_DELETED_EVENT,
        handlePhotoDeleted,
      );
    };
  }, [editorRef, handleEditorPhotoDeleted]);

  const atPhotoLimit = photoCount >= MAX_POST_PHOTOS;
  const isBodyTooLong = bodyLength > MAX_POST_BODY;
  const isFilterMissing =
    selectedBoard === "병원후기 게시판"
      ? !selectedReviewTag
      : selectedBoard === "꿀팁 게시판"
        ? !selectedTipTag
        : false;

  return {
    atPhotoLimit,
    bodyLength,
    editorRef,
    fileInputRef,
    handleClose,
    handleEditorDragOver,
    handleEditorDrop,
    handleEditorPaste,
    handleFileChange,
    handleFontSizeChange,
    handleFontWeightChange,
    handleLinkInsert,
    handleLinkKeyDown,
    handleOpenLink,
    handleSubmit,
    isBodyTooLong,
    isFilterMissing,
    isLinkInputOpen,
    isSubmitting,
    linkInputRef,
    linkUrl,
    photoCount,
    photoLimitMsg,
    saveSelection,
    selectedBoard,
    selectedFontSize,
    selectedFontWeight,
    selectedReviewTag,
    selectedTipTag,
    setIsLinkInputOpen,
    setLinkUrl,
    setSelectedBoard,
    setSelectedReviewTag,
    setSelectedTipTag,
    setTitle,
    submitError,
    title,
    titleRef,
    updateBodyLength,
    uploadingCount,
  };
}

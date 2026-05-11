import { useCallback, useEffect, useRef, useState } from "react";
import { loadAuthSession } from "@/src/shared/lib/authSession";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import { REGION_FILTERS } from "@/src/home/regions";
import type { Region } from "@/src/home/types";
import {
  BOARD_TABS,
  type BoardPostSummary,
  type BoardTab,
} from "@/src/shared/lib/boardPosts";
import { createBoardPost } from "@/src/reviews/boardPostsApi";
import styles from "@/src/reviews/PostComposeSheet.module.css";
type TipTag = "포유류" | "설치류" | "조류" | "파충류" | "양서류" | "어류";

const MAX_PHOTOS = 5;
const MAX_BODY = 5000;
const STORAGE_BUCKET = "posting_image";
const REVIEW_TAG_OPTIONS = REGION_FILTERS.filter(
  (region): region is Exclude<Region, "전체"> => region !== "전체",
);
const TIP_TAG_OPTIONS: readonly TipTag[] = [
  "포유류",
  "설치류",
  "조류",
  "파충류",
  "양서류",
  "어류",
];

type PostComposeSheetProps = {
  isOpen: boolean;
  defaultBoard?: BoardTab;
  onClose: () => void;
  onCreated?: (post: BoardPostSummary) => void;
};

type PostComposeSheetContentProps = Omit<PostComposeSheetProps, "isOpen">;

export default function PostComposeSheet({
  isOpen,
  defaultBoard,
  onClose,
  onCreated,
}: PostComposeSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <PostComposeSheetContent
      key={defaultBoard ?? "자유게시판"}
      defaultBoard={defaultBoard}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}

function PostComposeSheetContent({
  defaultBoard = "자유게시판",
  onClose,
  onCreated,
}: PostComposeSheetContentProps) {
  const [selectedBoard, setSelectedBoard] = useState<BoardTab>(defaultBoard);
  const [title, setTitle] = useState("");
  const [selectedReviewTag, setSelectedReviewTag] = useState<
    Exclude<Region, "전체"> | null
  >(null);
  const [selectedTipTag, setSelectedTipTag] = useState<TipTag | null>(null);
  const [bodyLength, setBodyLength] = useState(0);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [photoLimitMsg, setPhotoLimitMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const uploadedImagePathsRef = useRef<string[]>([]);
  const hasSubmittedRef = useRef(false);

  const revokeEditorObjectUrls = useCallback(() => {
    const imgs = editorRef.current?.querySelectorAll("[data-object-url]");
    imgs?.forEach((img) => {
      const url = img.getAttribute("data-object-url");
      if (url) URL.revokeObjectURL(url);
    });
  }, []);

  const cleanupUploadedImages = useCallback(async () => {
    const paths = uploadedImagePathsRef.current;
    if (paths.length === 0) {
      return;
    }

    uploadedImagePathsRef.current = [];

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    } catch {
      // best-effort cleanup; storage policies may reject deletion in local setups
    }
  }, []);

  const handleClose = useCallback(() => {
    revokeEditorObjectUrls();

    if (!hasSubmittedRef.current) {
      void cleanupUploadedImages();
    }

    onClose();
  }, [cleanupUploadedImages, onClose, revokeEditorObjectUrls]);

  const countPhotos = () =>
    editorRef.current?.querySelectorAll("[data-img-wrapper]").length ?? 0;

  const updateBodyLength = () => {
    const text = editorRef.current?.innerText ?? "";
    setBodyLength(Math.min(text.length, MAX_BODY));
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelectionOrEnd = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel) return;

    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    editor.focus();
  };

  const insertNodeAtCursor = (node: Node) => {
    const editor = editorRef.current;
    if (!editor) return;

    restoreSelectionOrEnd();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      editor.appendChild(node);
    } else {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(node);
      const cursor = document.createTextNode("\u200B");
      range.setStartAfter(node);
      range.insertNode(cursor);
      range.setStartAfter(cursor);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }

    editor.focus();
    updateBodyLength();
  };

  const buildResizableImage = (objectUrl: string, alt: string) => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("contenteditable", "false");
    wrapper.setAttribute("data-img-wrapper", "true");
    wrapper.className = styles.imgWrapper;

    const img = document.createElement("img");
    img.src = objectUrl;
    img.alt = alt;
    img.setAttribute("data-object-url", objectUrl);
    img.className = styles.imgEl;
    img.style.width = "240px";

    const handle = document.createElement("span");
    handle.setAttribute("aria-hidden", "true");
    handle.className = styles.imgResizeHandle;
    handle.innerHTML =
      '<svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true"><line x1="1" y1="7" x2="7" y2="1" stroke="white" stroke-width="1.5" stroke-linecap="round"/><line x1="4" y1="7" x2="7" y2="4" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>';

    const onResizeStart = (clientX: number) => {
      const startX = clientX;
      const startW = img.offsetWidth;

      const onMove = (e: MouseEvent | TouchEvent) => {
        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        const newW = Math.max(80, startW + (x - startX));
        img.style.width = `${newW}px`;
      };
      const onEnd = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchend", onEnd);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("touchmove", onMove, { passive: true });
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchend", onEnd);
    };

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onResizeStart(e.clientX);
    });
    handle.addEventListener("touchstart", (e) => {
      e.preventDefault();
      onResizeStart(e.touches[0].clientX);
    }, { passive: false });

    wrapper.appendChild(img);
    wrapper.appendChild(handle);
    return wrapper;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    e.target.value = "";
    setSubmitError("");

    const currentCount = countPhotos();
    const available = MAX_PHOTOS - currentCount;

    if (available <= 0) {
      setPhotoLimitMsg(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`);
      return;
    }

    const accepted = incoming.slice(0, available);
    const supabase = getSupabaseBrowserClient();
    const session = await loadAuthSession(supabase);

    if (!session) {
      setSubmitError("로그인 후 사진을 첨부할 수 있습니다.");
      return;
    }

    setPhotoLimitMsg(
      accepted.length < incoming.length
        ? `사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`
        : "",
    );
    setUploadingCount((n) => n + accepted.length);

    await Promise.all(
      accepted.map(async (file, i) => {
        const blobUrl = URL.createObjectURL(file);
        const altText = `첨부 사진 ${currentCount + i + 1}`;

        // 먼저 blob URL로 즉시 미리보기 삽입
        const node = buildResizableImage(blobUrl, altText);
        insertNodeAtCursor(node);
        setPhotoCount((n) => n + 1);

        try {
          const ext = file.name.split(".").pop() ?? "jpg";
          const path = `${session.user.id}/${Date.now()}-${i}.${ext}`;

          const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { upsert: false });

          if (error) {
            throw new Error(`이미지 업로드 실패: ${error.message}`);
          }

          uploadedImagePathsRef.current.push(path);
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

          // 에디터 내 해당 img 요소의 src를 영구 URL로 교체
          const imgEl = node.querySelector("img");
          if (imgEl) {
            imgEl.src = urlData.publicUrl;
            imgEl.removeAttribute("data-object-url");
          }
          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          node.remove();
          URL.revokeObjectURL(blobUrl);
          setPhotoCount((n) => Math.max(0, n - 1));
          setSubmitError(
            error instanceof Error
              ? error.message
              : "이미지 업로드 중 알 수 없는 오류가 발생했습니다.",
          );
        } finally {
          setUploadingCount((n) => Math.max(0, n - 1));
        }
      }),
    );
  };

  const handleLinkInsert = () => {
    const url = linkUrl.trim();
    if (!url) return;

    const a = document.createElement("a");
    a.href = url.startsWith("http") ? url : `https://${url}`;
    a.textContent = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = styles.inlineLink;

    insertNodeAtCursor(a);
    setLinkUrl("");
    setIsLinkInputOpen(false);
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLinkInsert();
    }
  };

  const handleOpenLink = () => {
    saveSelection();
    setIsLinkInputOpen((prev) => !prev);
    if (!isLinkInputOpen) {
      setTimeout(() => linkInputRef.current?.focus(), 40);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => titleRef.current?.focus(), 80);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    return () => {
      const imgs = editor?.querySelectorAll("[data-object-url]");
      imgs?.forEach((img) => {
        const url = img.getAttribute("data-object-url");
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const body = editorRef.current?.innerHTML ?? "";
    const filterTag =
      selectedBoard === "병원후기 게시판"
        ? (selectedReviewTag ?? null)
        : selectedBoard === "꿀팁 게시판"
          ? (selectedTipTag ?? null)
          : null;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const post = await createBoardPost({
        board: selectedBoard,
        filterTag,
        title: title.trim(),
        body,
      });
      hasSubmittedRef.current = true;
      onCreated?.(post);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const atPhotoLimit = photoCount >= MAX_PHOTOS;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="글쓰기">
      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <button type="button" className={styles.cancelButton} onClick={handleClose}>
            취소
          </button>
          <span className={styles.sheetTitle}>글쓰기</span>
          <button
            type="button"
            className={styles.submitButton}
            disabled={
              !title.trim() ||
              bodyLength === 0 ||
              isSubmitting ||
              uploadingCount > 0
            }
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? "등록 중" : "등록"}
          </button>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.boardSelectRow}>
            <select
              className={styles.boardSelect}
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value as BoardTab)}
              aria-label="게시판 선택"
            >
              {BOARD_TABS.map((tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              ))}
            </select>
            <svg className={styles.boardSelectChevron} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5z" fill="currentColor" />
            </svg>
          </div>

          <input
            ref={titleRef}
            className={styles.titleInput}
            type="text"
            placeholder="제목을 입력해 주세요"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {selectedBoard === "병원후기 게시판" ? (
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>태그</p>
              <div className={styles.filterTagList}>
                {REVIEW_TAG_OPTIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={`${styles.filterTagButton} ${
                      selectedReviewTag === region ? styles.filterTagButtonActive : ""
                    }`}
                    onClick={() => setSelectedReviewTag(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {selectedBoard === "꿀팁 게시판" ? (
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>필터 태그</p>
              <div className={styles.filterTagList}>
                {TIP_TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`${styles.filterTagButton} ${
                      selectedTipTag === tag ? styles.filterTagButtonActive : ""
                    }`}
                    onClick={() => setSelectedTipTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className={styles.divider} />

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={styles.bodyEditor}
            data-placeholder="내용을 입력해 주세요"
            onBlur={saveSelection}
            onKeyUp={updateBodyLength}
            onInput={updateBodyLength}
          />

          {isLinkInputOpen && (
            <div className={styles.linkInputRow}>
              <svg className={styles.linkIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                  fill="currentColor"
                />
              </svg>
              <input
                ref={linkInputRef}
                className={styles.linkInput}
                type="url"
                placeholder="https://"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={handleLinkKeyDown}
              />
              <button
                type="button"
                className={styles.linkInsertButton}
                onClick={handleLinkInsert}
                disabled={!linkUrl.trim()}
              >
                삽입
              </button>
              <button
                type="button"
                className={styles.linkClear}
                aria-label="링크 닫기"
                onClick={() => {
                  setLinkUrl("");
                  setIsLinkInputOpen(false);
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {submitError ? (
          <p className={styles.submitError}>{submitError}</p>
        ) : null}

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button
              type="button"
              className={styles.toolbarButton}
              aria-label={`사진 첨부 (${photoCount}/${MAX_PHOTOS})`}
              disabled={atPhotoLimit || isSubmitting}
              onClick={() => {
                saveSelection();
                fileInputRef.current?.click();
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
              </svg>
              {photoCount > 0 && (
                <span className={styles.photoBadge}>{photoCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`${styles.toolbarButton} ${isLinkInputOpen ? styles.toolbarButtonActive : ""}`}
              aria-label="링크 추가"
              onClick={handleOpenLink}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <div className={styles.toolbarRight}>
            {uploadingCount > 0 && (
              <span className={styles.uploadingMsg}>
                이미지 업로드 중 {uploadingCount}개…
              </span>
            )}
            {photoLimitMsg && !uploadingCount && (
              <span className={styles.photoLimitMsg}>{photoLimitMsg}</span>
            )}
            <span className={styles.charCount}>
              {bodyLength.toLocaleString()}/{MAX_BODY.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => void handleFileChange(e)}
      />
    </div>
  );
}

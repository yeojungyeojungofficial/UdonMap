import type { CSSProperties } from "react";
import chevronDownIcon from "@/src/assets/chevronDown.png";
import linkIcon from "@/src/assets/link.png";
import photoIcon from "@/src/assets/photo.png";
import FilterChipGroup from "@/src/components/common/FilterChipGroup";
import {
  BOARD_TABS,
  type BoardPostDetail,
  type BoardPostSummary,
  type BoardTab,
} from "@/src/features/reviews/boardPosts";
import {
  MAX_POST_BODY,
  MAX_POST_PHOTOS,
  POST_FONT_SIZE_OPTIONS,
  POST_FONT_WEIGHT_OPTIONS,
  REVIEW_TAG_OPTIONS,
  TIP_TAG_OPTIONS,
} from "@/src/features/reviews/postComposeConfig";
import { usePostComposeSheetController } from "../usePostComposeSheetController";
import styles from "./PostComposeSheet.module.css";

type PostComposeSheetContentProps = {
  defaultBoard?: BoardTab;
  editPost?: BoardPostDetail | null;
  onClose: () => void;
  onCreated?: (post: BoardPostSummary) => void;
  onUpdated?: (post: BoardPostDetail) => void;
};

type ComposeIconStyle = CSSProperties & {
  "--compose-icon-url"?: string;
};

const boardSelectIconStyle: ComposeIconStyle = {
  "--compose-icon-url": `url(${chevronDownIcon.src})`,
};

const linkIconStyle: ComposeIconStyle = {
  "--compose-icon-url": `url(${linkIcon.src})`,
};

const photoIconStyle: ComposeIconStyle = {
  "--compose-icon-url": `url(${photoIcon.src})`,
};

export default function DesktopPostComposeSheetContent({
  defaultBoard = "자유게시판",
  editPost = null,
  onClose,
  onCreated,
  onUpdated,
}: PostComposeSheetContentProps) {
  const {
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
  } = usePostComposeSheetController({
    defaultBoard,
    editPost,
    editorClassNames: {
      imgWrapper: styles.imgWrapper,
      imgEl: styles.imgEl,
      imgDragHandle: styles.imgDragHandle,
      imgResizeHandle: styles.imgResizeHandle,
      imgRemoveButton: styles.imgRemoveButton,
      imgDragging: styles.imgDragging,
      inlineLink: styles.inlineLink,
    },
    onClose,
    onCreated,
    onUpdated,
  });

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="글쓰기">
      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <button type="button" className={styles.cancelButton} onClick={handleClose}>
            취소
          </button>
          <span className={styles.sheetTitle}>{editPost ? "글수정" : "글쓰기"}</span>
          <button
            type="button"
            className={styles.submitButton}
            disabled={
              !title.trim() ||
              bodyLength === 0 ||
              isFilterMissing ||
              isBodyTooLong ||
              isSubmitting ||
              uploadingCount > 0
            }
            onClick={handleSubmit}
          >
            {isSubmitting ? (editPost ? "수정 중" : "등록 중") : editPost ? "수정" : "등록"}
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
                <option key={tab} value={tab}>{tab}</option>
              ))}
            </select>
            <span
              className={styles.boardSelectChevron}
              style={boardSelectIconStyle}
              aria-hidden="true"
            />
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
              <FilterChipGroup
                ariaLabel="지역 태그 선택"
                className={styles.filterTagList}
                options={REVIEW_TAG_OPTIONS}
                selectedOption={selectedReviewTag}
                onSelectOption={setSelectedReviewTag}
              />
            </div>
          ) : null}

          {selectedBoard === "꿀팁 게시판" ? (
            <div className={styles.filterSection}>
              <p className={styles.filterLabel}>필터 태그</p>
              <FilterChipGroup
                ariaLabel="꿀팁 태그 선택"
                className={styles.filterTagList}
                options={TIP_TAG_OPTIONS}
                selectedOption={selectedTipTag}
                onSelectOption={setSelectedTipTag}
              />
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
            onDragOver={handleEditorDragOver}
            onDrop={handleEditorDrop}
            onPaste={handleEditorPaste}
            onKeyUp={updateBodyLength}
            onInput={updateBodyLength}
          />

          {isLinkInputOpen && (
            <div className={styles.linkInputRow}>
              <span
                className={styles.linkIcon}
                style={linkIconStyle}
                aria-hidden="true"
              />
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
                onClick={() => { setLinkUrl(""); setIsLinkInputOpen(false); }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {submitError ? <p className={styles.submitError}>{submitError}</p> : null}

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button
              type="button"
              className={styles.toolbarButton}
              aria-label={`사진 첨부 (${photoCount}/${MAX_POST_PHOTOS})`}
              disabled={atPhotoLimit || isSubmitting}
              onClick={() => { saveSelection(); fileInputRef.current?.click(); }}
            >
              <span
                className={styles.toolbarIcon}
                style={photoIconStyle}
                aria-hidden="true"
              />
              {photoCount > 0 && <span className={styles.photoBadge}>{photoCount}</span>}
            </button>
            <button
              type="button"
              className={`${styles.toolbarButton} ${isLinkInputOpen ? styles.toolbarButtonActive : ""}`}
              aria-label="링크 추가"
              onClick={handleOpenLink}
            >
              <span
                className={styles.toolbarIcon}
                style={linkIconStyle}
                aria-hidden="true"
              />
            </button>
            <span className={styles.toolbarDivider} aria-hidden="true" />
            <div className={styles.formatGroup}>
              <select
                className={styles.formatSelect}
                aria-label="글씨 크기"
                value={selectedFontSize}
                onChange={handleFontSizeChange}
                onFocus={saveSelection}
                onMouseDown={saveSelection}
                onTouchStart={saveSelection}
              >
                {POST_FONT_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className={styles.formatSelect}
                aria-label="글씨 굵기"
                value={selectedFontWeight}
                onChange={handleFontWeightChange}
                onFocus={saveSelection}
                onMouseDown={saveSelection}
                onTouchStart={saveSelection}
              >
                {POST_FONT_WEIGHT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            {uploadingCount > 0 && (
              <span className={styles.uploadingMsg}>이미지 업로드 중 {uploadingCount}개…</span>
            )}
            {photoLimitMsg && !uploadingCount && (
              <span className={styles.photoLimitMsg}>{photoLimitMsg}</span>
            )}
            <span className={`${styles.charCount} ${isBodyTooLong ? styles.charCountOverLimit : ""}`}>
              {bodyLength.toLocaleString()}/{MAX_POST_BODY.toLocaleString()}
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

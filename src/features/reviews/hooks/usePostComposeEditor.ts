import {
  useCallback,
  useRef,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import resizeHandleIcon from "@/src/assets/resizeHandle.png";
import { sanitizeBoardPostHtml } from "@/src/features/reviews/sanitize";

export const POST_COMPOSE_PHOTO_DELETED_EVENT =
  "post-compose-photo-deleted";

const ZERO_WIDTH_SPACE = "\u200B";
const EDITOR_CONTROL_SELECTOR = "[data-editor-control]";
const IMAGE_WRAPPER_SELECTOR = "[data-img-wrapper]";

type EditorClassNames = {
  imgWrapper: string;
  imgEl: string;
  imgDragHandle: string;
  imgResizeHandle: string;
  imgRemoveButton: string;
  imgDragging: string;
  inlineLink: string;
};

type UsePostComposeEditorOptions = {
  classNames: EditorClassNames;
  onBodyLengthChange: (length: number) => void;
};

type TextStyleOptions = {
  fontSize?: string;
  fontWeight?: string;
};

type CaretPositionDocument = Document & {
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
  caretPositionFromPoint?: (
    x: number,
    y: number,
  ) => { offsetNode: Node; offset: number } | null;
};

function stripEditorOnlyText(value: string) {
  return value.split(ZERO_WIDTH_SPACE).join("");
}

function getRangeFromPoint(x: number, y: number) {
  const caretDocument = document as CaretPositionDocument;

  if (caretDocument.caretRangeFromPoint) {
    return caretDocument.caretRangeFromPoint(x, y);
  }

  if (caretDocument.caretPositionFromPoint) {
    const position = caretDocument.caretPositionFromPoint(x, y);
    if (!position) return null;

    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    return range;
  }

  return null;
}

function createPlainTextFragment(value: string) {
  const fragment = document.createDocumentFragment();
  const lines = value.split(/\r\n|\r|\n/);

  lines.forEach((line, index) => {
    if (index > 0) {
      fragment.appendChild(document.createElement("br"));
    }
    if (line) {
      fragment.appendChild(document.createTextNode(line));
    }
  });

  return fragment;
}

export function usePostComposeEditor({
  classNames,
  onBodyLengthChange,
}: UsePostComposeEditorOptions) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const draggedWrapperRef = useRef<HTMLElement | null>(null);
  const enhancedWrappersRef = useRef<WeakSet<HTMLElement>>(new WeakSet());

  const getTextLength = useCallback(
    () => stripEditorOnlyText(editorRef.current?.innerText ?? "").length,
    [],
  );

  const getHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return "";

    const clone = editor.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(EDITOR_CONTROL_SELECTOR).forEach((node) => {
      node.remove();
    });
    clone.querySelectorAll("[contenteditable]").forEach((node) => {
      node.removeAttribute("contenteditable");
    });
    clone.querySelectorAll("[draggable]").forEach((node) => {
      node.removeAttribute("draggable");
    });
    clone.querySelectorAll("[data-object-url]").forEach((node) => {
      node.removeAttribute("data-object-url");
    });
    clone.querySelectorAll(IMAGE_WRAPPER_SELECTOR).forEach((node) => {
      node.removeAttribute("data-storage-path");
      node.removeAttribute("data-img-wrapper");
    });

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode as Text);
      currentNode = walker.nextNode();
    }
    textNodes.forEach((node) => {
      node.nodeValue = stripEditorOnlyText(node.nodeValue ?? "");
    });

    return clone.innerHTML;
  }, []);

  const countPhotos = useCallback(
    () => editorRef.current?.querySelectorAll(IMAGE_WRAPPER_SELECTOR).length ?? 0,
    [],
  );

  const updateBodyLength = useCallback(() => {
    onBodyLengthChange(getTextLength());
  }, [getTextLength, onBodyLengthChange]);

  const revokeEditorObjectUrls = useCallback(() => {
    const imgs = editorRef.current?.querySelectorAll("[data-object-url]");
    imgs?.forEach((img) => {
      const url = img.getAttribute("data-object-url");
      if (url) URL.revokeObjectURL(url);
    });
  }, []);

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  const restoreSelectionOrEnd = useCallback(() => {
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
  }, []);

  const insertNodeAtCursor = useCallback(
    (node: Node) => {
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
    },
    [restoreSelectionOrEnd, updateBodyLength],
  );

  const insertFragmentAtCursor = useCallback(
    (fragment: DocumentFragment) => {
      const editor = editorRef.current;
      if (!editor) return;

      restoreSelectionOrEnd();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        editor.appendChild(fragment);
      } else {
        const insertedNodes = Array.from(fragment.childNodes);
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(fragment);

        const nextRange = document.createRange();
        const lastNode = insertedNodes.at(-1);
        if (lastNode) {
          nextRange.setStartAfter(lastNode);
        } else {
          nextRange.selectNodeContents(editor);
          nextRange.collapse(false);
        }
        nextRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
      }

      editor.focus();
      updateBodyLength();
    },
    [restoreSelectionOrEnd, updateBodyLength],
  );

  const handleEditorPaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();

      const html = event.clipboardData.getData("text/html");
      if (html) {
        const template = document.createElement("template");
        template.innerHTML = sanitizeBoardPostHtml(html);
        insertFragmentAtCursor(template.content);
        return;
      }

      const text = event.clipboardData.getData("text/plain");
      if (text) {
        insertFragmentAtCursor(createPlainTextFragment(text));
      }
    },
    [insertFragmentAtCursor],
  );

  const moveImageToPoint = useCallback(
    (wrapper: HTMLElement, target: Element | null, clientX: number, clientY: number) => {
      const editor = editorRef.current;
      if (!editor || !editor.contains(wrapper)) return;

      const targetWrapper = target?.closest(
        IMAGE_WRAPPER_SELECTOR,
      ) as HTMLElement | null;

      if (targetWrapper === wrapper) {
        return;
      }

      if (targetWrapper && editor.contains(targetWrapper) && targetWrapper !== wrapper) {
        const rect = targetWrapper.getBoundingClientRect();
        const pointerInsideTargetRow =
          clientY >= rect.top && clientY <= rect.bottom;
        const shouldInsertAfter = pointerInsideTargetRow
          ? clientX > rect.left + rect.width / 2
          : clientY > rect.top + rect.height / 2;

        if (shouldInsertAfter) {
          targetWrapper.after(wrapper);
        } else {
          targetWrapper.before(wrapper);
        }
        return;
      }

      const range = getRangeFromPoint(clientX, clientY);
      if (
        range &&
        editor.contains(range.commonAncestorContainer) &&
        !wrapper.contains(range.commonAncestorContainer)
      ) {
        range.insertNode(wrapper);
      } else if (!targetWrapper && target && editor.contains(target)) {
        editor.appendChild(wrapper);
      }
    },
    [],
  );

  const handleEditorDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!draggedWrapperRef.current) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleEditorDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const wrapper = draggedWrapperRef.current;
      if (!wrapper) return;

      event.preventDefault();
      moveImageToPoint(
        wrapper,
        event.target as Element | null,
        event.clientX,
        event.clientY,
      );
      wrapper.classList.remove(classNames.imgDragging);
      draggedWrapperRef.current = null;
      updateBodyLength();
    },
    [classNames.imgDragging, moveImageToPoint, updateBodyLength],
  );

  const startPointerDrag = useCallback(
    (event: PointerEvent, wrapper: HTMLElement) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const startX = event.clientX;
      const startY = event.clientY;
      let isDragging = false;

      const onMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (!isDragging && Math.hypot(deltaX, deltaY) < 8) {
          return;
        }

        isDragging = true;
        wrapper.classList.add(classNames.imgDragging);
        moveEvent.preventDefault();

        moveImageToPoint(
          wrapper,
          document.elementFromPoint(moveEvent.clientX, moveEvent.clientY),
          moveEvent.clientX,
          moveEvent.clientY,
        );
      };

      const onEnd = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onEnd);
        document.removeEventListener("pointercancel", onEnd);
        wrapper.classList.remove(classNames.imgDragging);
        if (isDragging) updateBodyLength();
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onEnd);
      document.addEventListener("pointercancel", onEnd);
      event.preventDefault();
    },
    [classNames.imgDragging, moveImageToPoint, updateBodyLength],
  );

  const enhanceImageWrapper = useCallback(
    (wrapper: HTMLElement, img: HTMLImageElement) => {
      wrapper.setAttribute("contenteditable", "false");
      wrapper.setAttribute("data-img-wrapper", "true");
      wrapper.setAttribute("draggable", "true");
      wrapper.className = classNames.imgWrapper;

      const storagePath =
        wrapper.getAttribute("data-storage-path") ??
        img.getAttribute("data-storage-path") ??
        "";
      if (storagePath) {
        wrapper.setAttribute("data-storage-path", storagePath);
        img.setAttribute("data-storage-path", storagePath);
      }

      img.className = classNames.imgEl;
      img.draggable = false;
      if (!img.style.width) {
        img.style.width = "240px";
      }

      wrapper.querySelectorAll(EDITOR_CONTROL_SELECTOR).forEach((node) => {
        node.remove();
      });

      const dragHandle = document.createElement("span");
      dragHandle.setAttribute("aria-hidden", "true");
      dragHandle.setAttribute("data-editor-control", "drag");
      dragHandle.className = classNames.imgDragHandle;
      dragHandle.addEventListener("pointerdown", (event) => {
        startPointerDrag(event, wrapper);
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", "사진 삭제");
      removeButton.setAttribute("data-editor-control", "remove");
      removeButton.className = classNames.imgRemoveButton;
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const objectUrl = img.getAttribute("data-object-url");
        const storagePath =
          wrapper.getAttribute("data-storage-path") ??
          img.getAttribute("data-storage-path") ??
          "";
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        wrapper.remove();
        editorRef.current?.dispatchEvent(
          new CustomEvent(POST_COMPOSE_PHOTO_DELETED_EVENT, {
            detail: { storagePath },
          }),
        );
        updateBodyLength();
      });

      const handle = document.createElement("span");
      handle.setAttribute("aria-hidden", "true");
      handle.setAttribute("data-editor-control", "resize");
      handle.className = classNames.imgResizeHandle;
      handle.style.setProperty(
        "--resize-handle-icon-url",
        `url(${resizeHandleIcon.src})`,
      );

      const onResizeStart = (clientX: number) => {
        const startX = clientX;
        const startW = img.offsetWidth;
        const editorWidth = editorRef.current?.clientWidth ?? 320;
        const maxWidth = Math.max(120, editorWidth - 32);

        const onMove = (e: MouseEvent | TouchEvent) => {
          const x = "touches" in e ? e.touches[0].clientX : e.clientX;
          const newW = Math.min(maxWidth, Math.max(80, startW + (x - startX)));
          img.style.width = `${Math.round(newW)}px`;
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
      handle.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          onResizeStart(e.touches[0].clientX);
        },
        { passive: false },
      );

      wrapper.appendChild(img);
      wrapper.appendChild(dragHandle);
      wrapper.appendChild(removeButton);
      wrapper.appendChild(handle);

      if (!enhancedWrappersRef.current.has(wrapper)) {
        wrapper.addEventListener("dragstart", (event) => {
          draggedWrapperRef.current = wrapper;
          wrapper.classList.add(classNames.imgDragging);
          event.dataTransfer?.setData("text/plain", "");
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
        wrapper.addEventListener("dragend", () => {
          wrapper.classList.remove(classNames.imgDragging);
          draggedWrapperRef.current = null;
        });
        enhancedWrappersRef.current.add(wrapper);
      }

      return wrapper;
    },
    [
      classNames.imgDragHandle,
      classNames.imgDragging,
      classNames.imgEl,
      classNames.imgRemoveButton,
      classNames.imgResizeHandle,
      classNames.imgWrapper,
      startPointerDrag,
      updateBodyLength,
    ],
  );

  const buildResizableImage = useCallback(
    (objectUrl: string, alt: string) => {
      const wrapper = document.createElement("span");

      const img = document.createElement("img");
      img.src = objectUrl;
      img.alt = alt;
      img.setAttribute("data-object-url", objectUrl);

      return enhanceImageWrapper(wrapper, img);
    },
    [enhanceImageWrapper],
  );

  const hydrateEditorImages = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const images = Array.from(editor.querySelectorAll("img"));
    images.forEach((image) => {
      const img = image as HTMLImageElement;
      const existingWrapper = img.closest(IMAGE_WRAPPER_SELECTOR) as HTMLElement | null;

      if (existingWrapper) {
        enhanceImageWrapper(existingWrapper, img);
        return;
      }

      const parent = img.parentElement;
      const reusableParent =
        parent?.tagName.toLowerCase() === "span" &&
        !parent.getAttribute("style") &&
        Array.from(parent.childNodes).every(
          (node) => node === img || !stripEditorOnlyText(node.textContent ?? "").trim(),
        );

      if (reusableParent && parent) {
        Array.from(parent.childNodes).forEach((node) => {
          if (node !== img) node.remove();
        });
        enhanceImageWrapper(parent, img);
        return;
      }

      const wrapper = document.createElement("span");
      img.replaceWith(wrapper);
      enhanceImageWrapper(wrapper, img);
    });
  }, [enhanceImageWrapper]);

  const insertLink = useCallback(
    (url: string) => {
      const normalizedUrl = url.trim();
      if (!normalizedUrl) return;

      const a = document.createElement("a");
      a.href = normalizedUrl.startsWith("http")
        ? normalizedUrl
        : `https://${normalizedUrl}`;
      a.textContent = normalizedUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = classNames.inlineLink;

      insertNodeAtCursor(a);
    },
    [classNames.inlineLink, insertNodeAtCursor],
  );

  const applyTextStyle = useCallback(
    ({ fontSize, fontWeight }: TextStyleOptions) => {
      if (!fontSize && !fontWeight) return;

      const editor = editorRef.current;
      if (!editor) return;

      restoreSelectionOrEnd();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) return;

      const span = document.createElement("span");
      if (fontSize) span.style.fontSize = fontSize;
      if (fontWeight) span.style.fontWeight = fontWeight;

      if (range.collapsed) {
        const marker = document.createTextNode(ZERO_WIDTH_SPACE);
        span.appendChild(marker);
        range.insertNode(span);

        const nextRange = document.createRange();
        nextRange.setStart(marker, marker.nodeValue?.length ?? 0);
        nextRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
      } else {
        span.appendChild(range.extractContents());
        range.insertNode(span);

        const nextRange = document.createRange();
        nextRange.selectNodeContents(span);
        nextRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(nextRange);
        savedRangeRef.current = nextRange.cloneRange();
      }

      editor.focus();
      updateBodyLength();
    },
    [restoreSelectionOrEnd, updateBodyLength],
  );

  return {
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
  };
}

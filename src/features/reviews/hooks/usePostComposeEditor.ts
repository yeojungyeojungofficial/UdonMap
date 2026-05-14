import { useCallback, useRef } from "react";

type EditorClassNames = {
  imgWrapper: string;
  imgEl: string;
  imgResizeHandle: string;
  inlineLink: string;
};

type UsePostComposeEditorOptions = {
  classNames: EditorClassNames;
  onBodyLengthChange: (length: number) => void;
};

export function usePostComposeEditor({
  classNames,
  onBodyLengthChange,
}: UsePostComposeEditorOptions) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const getTextLength = useCallback(
    () => editorRef.current?.innerText.length ?? 0,
    [],
  );

  const getHtml = useCallback(() => editorRef.current?.innerHTML ?? "", []);

  const countPhotos = useCallback(
    () => editorRef.current?.querySelectorAll("[data-img-wrapper]").length ?? 0,
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

  const buildResizableImage = useCallback(
    (objectUrl: string, alt: string) => {
      const wrapper = document.createElement("span");
      wrapper.setAttribute("contenteditable", "false");
      wrapper.setAttribute("data-img-wrapper", "true");
      wrapper.className = classNames.imgWrapper;

      const img = document.createElement("img");
      img.src = objectUrl;
      img.alt = alt;
      img.setAttribute("data-object-url", objectUrl);
      img.className = classNames.imgEl;
      img.style.width = "240px";

      const handle = document.createElement("span");
      handle.setAttribute("aria-hidden", "true");
      handle.className = classNames.imgResizeHandle;
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
      handle.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          onResizeStart(e.touches[0].clientX);
        },
        { passive: false },
      );

      wrapper.appendChild(img);
      wrapper.appendChild(handle);
      return wrapper;
    },
    [classNames],
  );

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

  return {
    editorRef,
    buildResizableImage,
    countPhotos,
    getHtml,
    getTextLength,
    insertLink,
    insertNodeAtCursor,
    revokeEditorObjectUrls,
    saveSelection,
    updateBodyLength,
  };
}

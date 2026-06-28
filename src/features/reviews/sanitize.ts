import {
  MAX_BOARD_POST_FONT_SIZE,
  MIN_BOARD_POST_FONT_SIZE,
} from "@/src/features/reviews/constants";

const BLOCKED_HTML_CONTENT =
  /<\s*(script|style|iframe|object|embed|svg|math|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAG = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;
const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "div",
  "em",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "u",
  "ul",
]);
const VOID_TAGS = new Set(["br", "img"]);
const ALLOWED_FONT_WEIGHTS = new Set(["400", "600", "800"]);

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getAttributeValue(attributes: string, name: string) {
  const match = attributes.match(
    new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );

  return match?.[2] ?? match?.[3] ?? match?.[4] ?? "";
}

function isSafeUrl(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  );
}

function isSafeImageUrl(value: string) {
  return value.trim().toLowerCase().startsWith("https://");
}

function isSafeStoragePath(value: string) {
  return /^[0-9a-f-]{20,}\/[0-9]+-[0-9]+\.webp$/i.test(value.trim());
}

function isStoragePathInImageUrl(src: string, storagePath: string) {
  const normalizedPath = storagePath.trim();
  const encodedPath = normalizedPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return src.includes(`/${normalizedPath}`) || src.includes(`/${encodedPath}`);
}

function getStyleValue(style: string, property: string) {
  const declarations = style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean);

  for (const declaration of declarations) {
    const separatorIndex = declaration.indexOf(":");
    if (separatorIndex === -1) continue;

    const name = declaration.slice(0, separatorIndex).trim().toLowerCase();
    const value = declaration.slice(separatorIndex + 1).trim().toLowerCase();
    if (name === property) return value;
  }

  return "";
}

function isAllowedFontSize(fontSize: string) {
  const match = fontSize.match(/^(\d+)px$/);
  if (!match) return false;

  const size = Number(match[1]);
  return (
    Number.isInteger(size) &&
    size >= MIN_BOARD_POST_FONT_SIZE &&
    size <= MAX_BOARD_POST_FONT_SIZE
  );
}

function sanitizeSpanStyle(attributes: string) {
  const style = getAttributeValue(attributes, "style");
  if (!style) return "";

  const safeStyles: string[] = [];
  const fontSize = getStyleValue(style, "font-size");
  const fontWeight = getStyleValue(style, "font-weight");

  if (isAllowedFontSize(fontSize)) {
    safeStyles.push(`font-size: ${fontSize}`);
  }

  if (ALLOWED_FONT_WEIGHTS.has(fontWeight)) {
    safeStyles.push(`font-weight: ${fontWeight}`);
  }

  return safeStyles.length
    ? ` style="${escapeAttribute(`${safeStyles.join("; ")};`)}"`
    : "";
}

function sanitizeImageStyle(attributes: string) {
  const style = getAttributeValue(attributes, "style");
  if (!style) return "";

  const width = getStyleValue(style, "width");
  const widthMatch = width.match(/^(\d+(?:\.\d+)?)px$/);
  if (!widthMatch) return "";

  const widthValue = Number(widthMatch[1]);
  if (!Number.isFinite(widthValue)) return "";

  const safeWidth = Math.min(720, Math.max(80, Math.round(widthValue)));
  return ` style="width: ${safeWidth}px;"`;
}

export function sanitizeBoardPostHtml(value: string) {
  return value
    .replace(BLOCKED_HTML_CONTENT, "")
    .replace(HTML_TAG, (tag, rawName: string, attributes: string) => {
      const name = rawName.toLowerCase();
      const isClosingTag = /^<\s*\//.test(tag);

      if (!ALLOWED_TAGS.has(name)) {
        return "";
      }

      if (isClosingTag) {
        return VOID_TAGS.has(name) ? "" : `</${name}>`;
      }

      if (name === "a") {
        const href = getAttributeValue(attributes, "href");
        if (!href || !isSafeUrl(href)) {
          return "<a>";
        }

        return `<a href="${escapeAttribute(
          href,
        )}" target="_blank" rel="noopener noreferrer">`;
      }

      if (name === "img") {
        const src = getAttributeValue(attributes, "src");
        const alt = getAttributeValue(attributes, "alt");
        const storagePath = getAttributeValue(attributes, "data-storage-path");
        if (!src || !isSafeImageUrl(src)) {
          return "";
        }

        return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(
          alt,
        )}"${
          storagePath &&
          isSafeStoragePath(storagePath) &&
          isStoragePathInImageUrl(src, storagePath)
            ? ` data-storage-path="${escapeAttribute(storagePath)}"`
            : ""
        }${sanitizeImageStyle(attributes)} loading="lazy" />`;
      }

      if (name === "br") {
        return "<br />";
      }

      if (name === "span") {
        return `<span${sanitizeSpanStyle(attributes)}>`;
      }

      return `<${name}>`;
    });
}

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
        if (!src || !isSafeUrl(src)) {
          return "";
        }

        return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(
          alt,
        )}" loading="lazy" />`;
      }

      if (name === "br") {
        return "<br />";
      }

      return `<${name}>`;
    });
}

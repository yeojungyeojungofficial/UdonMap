import responsiveValues from "@/src/constants/responsive-values.json";

export const MOBILE_BREAKPOINT = responsiveValues.MOBILE_BREAKPOINT;
export const FOOTER_BREAKPOINT = responsiveValues.FOOTER_BREAKPOINT;
export const WEB_BASE = responsiveValues.WEB_BASE;
export const MOBILE_BASE = responsiveValues.MOBILE_BASE;

export function convertToVwWeb(px: number) {
  return `${(px / WEB_BASE) * 100}vw`;
}

export function cappedVwWeb(px: number, lockViewport = WEB_BASE) {
  return `min(${(px / lockViewport) * 100}vw, ${px}px)`;
}

export function convertToVwMob(px: number) {
  return `${(px / MOBILE_BASE) * 100}vw`;
}

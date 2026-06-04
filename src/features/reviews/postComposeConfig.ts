import { REGION_FILTERS } from "@/src/constants/regions";
import type { Region } from "@/src/features/hospitals/types";
import {
  MAX_BOARD_POST_FONT_SIZE,
  MAX_BOARD_POST_BODY_LENGTH,
  MIN_BOARD_POST_FONT_SIZE,
  TIP_CATEGORIES,
  type TipCategory,
} from "@/src/features/reviews/constants";

export type ReviewTag = Exclude<Region, "전체">;
export type TipTag = Exclude<TipCategory, "전체">;

export const MAX_POST_PHOTOS = 5;
export const MAX_POST_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_BODY = MAX_BOARD_POST_BODY_LENGTH;
export const POST_IMAGE_STORAGE_BUCKET = "posting_image";
export const MIN_POST_FONT_SIZE = MIN_BOARD_POST_FONT_SIZE;
export const MAX_POST_FONT_SIZE = MAX_BOARD_POST_FONT_SIZE;
export const POST_FONT_SIZE_OPTIONS = Array.from(
  { length: MAX_POST_FONT_SIZE - MIN_POST_FONT_SIZE + 1 },
  (_, index) => {
    const size = MIN_POST_FONT_SIZE + index;
    return { label: String(size), value: `${size}px` };
  },
);
export const POST_FONT_WEIGHT_OPTIONS = [
  { label: "보통", value: "400" },
  { label: "중간", value: "600" },
  { label: "굵게", value: "800" },
] as const;

export const REVIEW_TAG_OPTIONS = REGION_FILTERS.filter(
  (region): region is ReviewTag => region !== "전체",
);

export const TIP_TAG_OPTIONS = TIP_CATEGORIES.filter(
  (category): category is TipTag => category !== "전체",
);

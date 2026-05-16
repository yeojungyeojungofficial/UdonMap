import { REGION_FILTERS } from "@/src/constants/regions";
import type { Region } from "@/src/features/hospitals/types";
import {
  MAX_BOARD_POST_BODY_LENGTH,
  TIP_CATEGORIES,
  type TipCategory,
} from "@/src/features/reviews/boardPosts";

export type ReviewTag = Exclude<Region, "전체">;
export type TipTag = Exclude<TipCategory, "전체">;

export const MAX_POST_PHOTOS = 5;
export const MAX_POST_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_BODY = MAX_BOARD_POST_BODY_LENGTH;
export const POST_IMAGE_STORAGE_BUCKET = "posting_image";

export const REVIEW_TAG_OPTIONS = REGION_FILTERS.filter(
  (region): region is ReviewTag => region !== "전체",
);

export const TIP_TAG_OPTIONS = TIP_CATEGORIES.filter(
  (category): category is TipTag => category !== "전체",
);

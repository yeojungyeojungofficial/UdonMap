import type { Region } from "@/src/home/types";

export const REGIONS = {
  수도권: ["서울", "경기", "인천"],
  강원권: ["강원"],
  충청권: ["대전", "세종", "충북", "충남"],
  호남권: ["광주", "전북", "전남"],
  영남권: ["부산", "대구", "울산", "경북", "경남"],
  제주권: ["제주"],
} as const;

export const REGION_FILTERS: readonly Region[] = [
  "전체",
  ...Object.values(REGIONS).flat(),
];

export const OTHER_REGION_FILTER: Region = "기타";

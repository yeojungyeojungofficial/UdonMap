import type { Region } from "@/src/features/hospitals/types";

export type RegionClusterGroup = {
  id: string;
  label: string;
  regions: readonly Region[];
};

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

export const ALL_REGION_CLUSTER_GROUPS = [
  {
    id: "capital",
    label: "서울경기",
    regions: REGIONS.수도권,
  },
  {
    id: "chungcheong",
    label: "충북충남",
    regions: REGIONS.충청권,
  },
  {
    id: "honam",
    label: "광주전북전남",
    regions: REGIONS.호남권,
  },
  {
    id: "gangwon",
    label: "강원",
    regions: REGIONS.강원권,
  },
  {
    id: "yeongnam",
    label: "경북대구경남",
    regions: REGIONS.영남권,
  },
  {
    id: "jeju",
    label: "제주",
    regions: REGIONS.제주권,
  },
] as const satisfies readonly RegionClusterGroup[];

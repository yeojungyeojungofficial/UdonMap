import type { Hospital, Region } from "@/src/home/types";

export const KOREA_REGION_FILTERS: readonly Region[] = [
  "전체",
  "서울특별시",
  "경기도",
  "경상도",
  "광역시",
];

export const OTHER_REGION_FILTER: Region = "기타 지역";

const SEOUL_KEYWORDS = ["서울특별시", "서울시", "서울"] as const;
const GYEONGGI_KEYWORDS = ["경기도", "경기"] as const;
const GYEONGSANG_KEYWORDS = [
  "경상북도",
  "경상남도",
  "경북",
  "경남",
  "경상",
] as const;
const METROPOLITAN_KEYWORDS = [
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "광주"
] as const;

function hasKeyword(source: string, keywords: readonly string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

export function getHospitalRegionFilter(
  hospital: Pick<Hospital, "region" | "address">,
): Region {
  const source = `${hospital.region} ${hospital.address}`.replace(/\s+/g, "");

  if (hasKeyword(source, SEOUL_KEYWORDS)) {
    return "서울특별시";
  }

  if (hasKeyword(source, GYEONGGI_KEYWORDS)) {
    return "경기도";
  }

  if (hasKeyword(source, GYEONGSANG_KEYWORDS)) {
    return "경상도";
  }

  if (hasKeyword(source, METROPOLITAN_KEYWORDS)) {
    return "광역시";
  }

  return OTHER_REGION_FILTER;
}

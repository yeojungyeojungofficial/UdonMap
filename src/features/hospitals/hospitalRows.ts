import type { Database } from "@/src/core/database.types";
import type {
  Hospital,
  HospitalComment,
  ReactionType,
} from "@/src/features/hospitals/types";

type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];

export type HospitalListRow = Pick<
  HospitalRow,
  | "id"
  | "name"
  | "phone"
  | "street_address"
  | "region"
  | "region_filter"
  | "latitude"
  | "longitude"
  | "homepage"
  | "instagram"
  | "specialty"
  | "emergency"
  | "hours"
  | "exotic_animals"
  | "likes"
  | "dislikes"
  | "review_count"
>;

export const HOSPITAL_COLUMNS =
  "id,name,phone,street_address,region,region_filter,latitude,longitude,homepage,instagram,specialty,emergency,hours,exotic_animals,likes,dislikes,review_count";

const KOREA_MAP_BOUNDS = {
  minLat: 33,
  maxLat: 39,
  minLng: 124.5,
  maxLng: 132,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFallbackMapPosition(latitude: number, longitude: number) {
  const x =
    ((longitude - KOREA_MAP_BOUNDS.minLng) /
      (KOREA_MAP_BOUNDS.maxLng - KOREA_MAP_BOUNDS.minLng)) *
    100;
  const y =
    ((KOREA_MAP_BOUNDS.maxLat - latitude) /
      (KOREA_MAP_BOUNDS.maxLat - KOREA_MAP_BOUNDS.minLat)) *
    100;

  return {
    x: clamp(x, 4, 96),
    y: clamp(y, 4, 96),
  };
}

function getSummary(row: HospitalListRow) {
  const traits = [
    row.specialty ? "특수동물 진료" : null,
    row.emergency ? "응급 진료 가능" : null,
  ].filter(Boolean);

  return traits.length > 0 ? traits.join(" · ") : "";
}

export function toReactionMap<IdKey extends string>(
  rows: Array<Record<IdKey, string> & { reaction_type: ReactionType }>,
  idKey: IdKey,
) {
  return rows.reduce((reactionById, row) => {
    reactionById.set(row[idKey], row.reaction_type);
    return reactionById;
  }, new Map<string, ReactionType>());
}

export function toHospital(
  row: HospitalListRow,
  comments: HospitalComment[] = [],
  reaction: ReactionType | null = null,
  isBookmarked = false,
  commentsLoaded = false,
): Hospital {
  const animals =
    row.exotic_animals.length > 0 ? row.exotic_animals : ["특수동물"];

  return {
    id: row.id,
    name: row.name,
    region: row.region,
    regionFilter: row.region_filter,
    address: row.street_address,
    summary: getSummary(row),
    likes: row.likes,
    dislikes: row.dislikes,
    reaction,
    reviewCount: row.review_count,
    animals,
    comments,
    commentsLoaded,
    mapPosition: getFallbackMapPosition(row.latitude, row.longitude),
    mapCoordinate: {
      lat: row.latitude,
      lng: row.longitude,
    },
    phone: row.phone ?? undefined,
    homepage: row.homepage ?? undefined,
    instagram: row.instagram ?? undefined,
    hours: row.hours,
    isEmergency: row.emergency,
    isSpecialty: row.specialty,
    isBookmarked,
  };
}

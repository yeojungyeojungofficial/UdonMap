import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import type { Database } from "@/src/shared/lib/database.types";
import type { Hospital, HospitalComment } from "@/src/home/types";
import {
  HOSPITAL_COMMENT_COLUMNS,
  toHospitalComment,
  type HospitalCommentRow,
} from "@/src/shared/lib/hospitalComments";

type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type HospitalListRow = Pick<
  HospitalRow,
  | "id"
  | "name"
  | "phone"
  | "street_address"
  | "region"
  | "latitude"
  | "longitude"
  | "homepage"
  | "instagram"
  | "specialty"
  | "emergency"
  | "hours"
  | "exotic_animals"
  | "likes"
  | "review_count"
>;

const KOREA_MAP_BOUNDS = {
  minLat: 33,
  maxLat: 39,
  minLng: 124.5,
  maxLng: 132,
};

const HOSPITAL_COLUMNS =
  "id,name,phone,street_address,region,latitude,longitude,homepage,instagram,specialty,emergency,hours,exotic_animals,likes,review_count";

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

  return traits.length > 0 ? traits.join(" · ") : "병원 상세 정보를 확인해보세요.";
}

function groupCommentsByHospitalId(rows: HospitalCommentRow[]) {
  return rows.reduce((commentsByHospitalId, row) => {
    const comments = commentsByHospitalId.get(row.hospital_id) ?? [];
    comments.push(toHospitalComment(row));
    commentsByHospitalId.set(row.hospital_id, comments);
    return commentsByHospitalId;
  }, new Map<string, HospitalComment[]>());
}

function toHospital(
  row: HospitalListRow,
  comments: HospitalComment[] = [],
): Hospital {
  const animals =
    row.exotic_animals.length > 0 ? row.exotic_animals : ["특수동물"];

  return {
    id: row.id,
    name: row.name,
    region: row.region,
    address: row.street_address,
    summary: getSummary(row),
    likes: row.likes,
    reviewCount: row.review_count,
    animals,
    comments,
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
  };
}

export async function fetchHospitals() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select(HOSPITAL_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Supabase hospitals 조회 실패: ${error.message}`);
  }

  const hospitals = data ?? [];
  const hospitalIds = hospitals.map((hospital) => hospital.id);

  if (hospitalIds.length === 0) {
    return [];
  }

  const { data: commentsData, error: commentsError } = await supabase
    .from("hospital_comments")
    .select(HOSPITAL_COMMENT_COLUMNS)
    .in("hospital_id", hospitalIds)
    .eq("status", "visible")
    .order("created_at", { ascending: false });

  if (commentsError) {
    throw new Error(`Supabase hospital_comments 조회 실패: ${commentsError.message}`);
  }

  const commentsByHospitalId = groupCommentsByHospitalId(commentsData ?? []);

  return hospitals.map((row) =>
    toHospital(row, commentsByHospitalId.get(row.id) ?? []),
  );
}

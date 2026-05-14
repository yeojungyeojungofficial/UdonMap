import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import { loadAuthSession } from "@/src/shared/lib/authSession";
import type { Database } from "@/src/shared/lib/database.types";
import type {
  Hospital,
  HospitalComment,
  ReactionType,
} from "@/src/features/hospitals/types";
import {
  HOSPITAL_COMMENT_COLUMNS,
  toHospitalComment,
  type HospitalCommentRow,
} from "@/src/features/hospitals/comments";
import { isMissingBookmarksTableError } from "@/src/features/hospitals/bookmarkErrors";

type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type HospitalListRow = Pick<
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

const KOREA_MAP_BOUNDS = {
  minLat: 33,
  maxLat: 39,
  minLng: 124.5,
  maxLng: 132,
};

const HOSPITAL_COLUMNS =
  "id,name,phone,street_address,region,region_filter,latitude,longitude,homepage,instagram,specialty,emergency,hours,exotic_animals,likes,dislikes,review_count";

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

type HospitalReactionRow = Pick<
  Database["public"]["Tables"]["hospital_reactions"]["Row"],
  "hospital_id" | "reaction_type"
>;

type HospitalCommentReactionRow = Pick<
  Database["public"]["Tables"]["hospital_comment_reactions"]["Row"],
  "comment_id" | "reaction_type"
>;

type HospitalBookmarkRow = Pick<
  Database["public"]["Tables"]["hospital_bookmarks"]["Row"],
  "hospital_id"
>;

function toReactionMap<IdKey extends string>(
  rows: Array<Record<IdKey, string> & { reaction_type: ReactionType }>,
  idKey: IdKey,
) {
  return rows.reduce((reactionById, row) => {
    reactionById.set(row[idKey], row.reaction_type);
    return reactionById;
  }, new Map<string, ReactionType>());
}

function toHospital(
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

  const session = await loadAuthSession(supabase);

  let reactionsByHospitalId = new Map<string, ReactionType>();
  let bookmarkedHospitalIds = new Set<string>();

  if (session) {
    const { data: hospitalReactionData, error: hospitalReactionError } =
      await supabase
        .from("hospital_reactions")
        .select("hospital_id,reaction_type")
        .eq("user_id", session.user.id)
        .in("hospital_id", hospitalIds);

    if (hospitalReactionError) {
      throw new Error(
        `Supabase hospital_reactions 조회 실패: ${hospitalReactionError.message}`,
      );
    }

    reactionsByHospitalId = toReactionMap(
      (hospitalReactionData ?? []) as HospitalReactionRow[],
      "hospital_id",
    );

    const { data: bookmarkData, error: bookmarkError } = await supabase
      .from("hospital_bookmarks")
      .select("hospital_id")
      .eq("user_id", session.user.id)
      .in("hospital_id", hospitalIds);

    if (bookmarkError && !isMissingBookmarksTableError(bookmarkError)) {
      throw new Error(
        `Supabase hospital_bookmarks 조회 실패: ${bookmarkError.message}`,
      );
    }

    bookmarkedHospitalIds = new Set(
      ((bookmarkData ?? []) as HospitalBookmarkRow[]).map(
        (bookmark) => bookmark.hospital_id,
      ),
    );
  }

  return hospitals.map((row) =>
    toHospital(
      row,
      [],
      reactionsByHospitalId.get(row.id) ?? null,
      bookmarkedHospitalIds.has(row.id),
      false,
    ),
  );
}

export async function fetchHospitalComments(hospitalId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data: commentsData, error: commentsError } = await supabase
    .from("hospital_comments")
    .select(HOSPITAL_COMMENT_COLUMNS)
    .eq("hospital_id", hospitalId)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(100);

  if (commentsError) {
    throw new Error(`Supabase hospital_comments 조회 실패: ${commentsError.message}`);
  }

  const comments = (commentsData ?? []) as HospitalCommentRow[];
  const commentIds = comments.map((comment) => comment.id);
  const session = await loadAuthSession(supabase);
  let reactionsByCommentId = new Map<string, ReactionType>();

  if (session && commentIds.length > 0) {
    const { data: commentReactionData, error: commentReactionError } =
      await supabase
        .from("hospital_comment_reactions")
        .select("comment_id,reaction_type")
        .eq("user_id", session.user.id)
        .in("comment_id", commentIds);

    if (commentReactionError) {
      throw new Error(
        `Supabase hospital_comment_reactions 조회 실패: ${commentReactionError.message}`,
      );
    }

    reactionsByCommentId = toReactionMap(
      (commentReactionData ?? []) as HospitalCommentReactionRow[],
      "comment_id",
    );
  }

  return comments.map((comment) =>
    toHospitalComment(comment, reactionsByCommentId.get(comment.id) ?? null),
  );
}

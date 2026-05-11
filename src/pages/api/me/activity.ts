import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";
import type { Database } from "@/src/shared/lib/database.types";

type ReportRow = Pick<
  Database["public"]["Tables"]["hospital_reports"]["Row"],
  | "id"
  | "hospital_name"
  | "street_address"
  | "animal_categories"
  | "animal_species"
  | "details"
  | "status"
  | "created_at"
  | "updated_at"
>;

type CommentRow = Pick<
  Database["public"]["Tables"]["hospital_comments"]["Row"],
  | "id"
  | "hospital_id"
  | "body"
  | "status"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

type PostRow = Pick<
  Database["public"]["Tables"]["board_posts"]["Row"],
  "id" | "board" | "filter_tag" | "title" | "created_at" | "updated_at"
>;

type HospitalRow = Pick<
  Database["public"]["Tables"]["hospitals"]["Row"],
  "id" | "name" | "region" | "street_address"
>;

type MyActivityResponse =
  | {
      reports: Array<{
        id: string;
        hospitalName: string;
        address: string;
        animalCategories: string[];
        animalSpecies: string | null;
        details: string | null;
        status: ReportRow["status"];
        createdAt: string;
        updatedAt: string;
      }>;
      posts: Array<{
        id: string;
        board: string;
        filterTag: string | null;
        title: string;
        createdAt: string;
        updatedAt: string;
      }>;
      comments: Array<{
        id: string;
        hospitalId: string;
        hospitalName: string;
        hospitalRegion: string;
        hospitalAddress: string;
        content: string;
        status: CommentRow["status"];
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
      }>;
    }
  | {
      error: string;
    };

function getBearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization;
  const header = Array.isArray(authorization)
    ? authorization[0]
    : authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MyActivityResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "GET 요청만 지원합니다." });
    return;
  }

  const accessToken = getBearerToken(req);

  if (!accessToken) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      res.status(401).json({
        error: userError
          ? `Supabase 사용자 확인 실패: ${userError.message}`
          : "로그인 사용자를 확인할 수 없습니다.",
      });
      return;
    }

    const { data: reportData, error: reportError } = await supabase
      .from("hospital_reports")
      .select(
        "id,hospital_name,street_address,animal_categories,animal_species,details,status,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (reportError) {
      res.status(500).json({
        error: `Supabase hospital_reports 조회 실패: ${reportError.message}`,
      });
      return;
    }

    const { data: postData, error: postError } = await supabase
      .from("board_posts")
      .select("id,board,filter_tag,title,created_at,updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (postError) {
      res.status(500).json({
        error: `Supabase board_posts 조회 실패: ${postError.message}`,
      });
      return;
    }

    const { data: commentData, error: commentError } = await supabase
      .from("hospital_comments")
      .select("id,hospital_id,body,status,created_at,updated_at,deleted_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (commentError) {
      res.status(500).json({
        error: `Supabase hospital_comments 조회 실패: ${commentError.message}`,
      });
      return;
    }

    const comments = (commentData ?? []) as CommentRow[];
    const hospitalIds = Array.from(
      new Set(comments.map((comment) => comment.hospital_id)),
    );
    let hospitalsById = new Map<string, HospitalRow>();

    if (hospitalIds.length > 0) {
      const { data: hospitalData, error: hospitalError } = await supabase
        .from("hospitals")
        .select("id,name,region,street_address")
        .in("id", hospitalIds);

      if (hospitalError) {
        res.status(500).json({
          error: `Supabase hospitals 조회 실패: ${hospitalError.message}`,
        });
        return;
      }

      hospitalsById = new Map(
        ((hospitalData ?? []) as HospitalRow[]).map((hospital) => [
          hospital.id,
          hospital,
        ]),
      );
    }

    res.status(200).json({
      reports: ((reportData ?? []) as ReportRow[]).map((report) => ({
        id: report.id,
        hospitalName: report.hospital_name,
        address: report.street_address,
        animalCategories: report.animal_categories,
        animalSpecies: report.animal_species,
        details: report.details,
        status: report.status,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      })),
      posts: ((postData ?? []) as PostRow[]).map((post) => ({
        id: post.id,
        board: post.board,
        filterTag: post.filter_tag,
        title: post.title,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      })),
      comments: comments.map((comment) => {
        const hospital = hospitalsById.get(comment.hospital_id);

        return {
          id: comment.id,
          hospitalId: comment.hospital_id,
          hospitalName: hospital?.name ?? "삭제된 병원",
          hospitalRegion: hospital?.region ?? "",
          hospitalAddress: hospital?.street_address ?? "",
          content: comment.body,
          status: comment.status,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          deletedAt: comment.deleted_at,
        };
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

import { loadAuthSession } from "@/src/shared/lib/authSession";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import type { HospitalReportStatus } from "@/src/shared/lib/hospitalReports";

export type MyReport = {
  id: string;
  hospitalName: string;
  address: string;
  animalCategories: string[];
  animalSpecies: string | null;
  details: string | null;
  status: HospitalReportStatus;
  createdAt: string;
  updatedAt: string;
};

export type MyComment = {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalRegion: string;
  hospitalAddress: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MyPost = {
  id: string;
  board: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type MyActivityResponse =
  | {
      reports: MyReport[];
      posts: MyPost[];
      comments: MyComment[];
    }
  | {
      error: string;
    };

export async function fetchMyActivity() {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);

  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const response = await fetch("/api/me/activity", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const result = (await response.json().catch(() => null)) as
    | MyActivityResponse
    | null;

  if (!response.ok || !result || "error" in result) {
    throw new Error(
      result && "error" in result
        ? result.error
        : "내 활동 내역을 불러오지 못했습니다.",
    );
  }

  return {
    reports: result.reports,
    posts: result.posts ?? [],
    comments: result.comments,
  };
}

import { loadAuthSession } from "@/src/shared/lib/authSession";
import { getSupabaseBrowserClient } from "@/src/shared/lib/supabase";
import type {
  ActivityTab,
  MyComment,
  MyPost,
  MyReport,
} from "@/src/features/mypage/types";

type MyActivityResponse =
  | {
      reports?: MyReport[];
      posts?: MyPost[];
      comments?: MyComment[];
    }
  | {
      error: string;
    };

export async function fetchMyActivity(tab?: ActivityTab) {
  const supabase = getSupabaseBrowserClient();
  const session = await loadAuthSession(supabase);

  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const url = tab ? `/api/me/activity?tab=${tab}` : "/api/me/activity";
  const response = await fetch(url, {
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
    reports: result.reports ?? [],
    posts: result.posts ?? [],
    comments: result.comments ?? [],
  };
}

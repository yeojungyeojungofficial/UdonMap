import type { NextApiRequest, NextApiResponse } from "next";
import { getQueryValue } from "@/src/core/apiRequest";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import type { Database } from "@/src/core/database.types";
import {
  sanitizeBoardPostHtml,
  toBoardPostComment,
  toBoardPostSummary,
  type BoardPostDetail,
} from "@/src/features/reviews/boardPosts";
import { getDefaultDisplayName } from "@/src/core/userProfiles";

type BoardPostRow = Database["public"]["Tables"]["board_posts"]["Row"];
type BoardPostCommentRow =
  Database["public"]["Tables"]["board_post_comments"]["Row"];
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email" | "display_name"
>;

type BoardPostDetailResponse =
  | {
      post: BoardPostDetail;
    }
  | {
      error: string;
    };

const BOARD_POST_DETAIL_COLUMNS =
  "id,user_id,board,filter_tag,title,body,comment_count,status,created_at,updated_at";
const BOARD_POST_COMMENT_COLUMNS =
  "id,post_id,user_id,author_name,body,like_count,dislike_count,status,deleted_at,deleted_by,deleted_reason,created_at,updated_at";

function getProfileAuthorName(profile: ProfileRow | null, fallback: string) {
  return (
    profile?.display_name?.trim() ||
    getDefaultDisplayName(profile?.email) ||
    fallback
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BoardPostDetailResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "GET 요청만 지원합니다." });
    return;
  }

  const postId = getQueryValue(req, "postId");

  if (!postId) {
    res.status(400).json({ error: "게시글 ID가 필요합니다." });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: postData, error: postError } = await supabase
      .from("board_posts")
      .select(BOARD_POST_DETAIL_COLUMNS)
      .eq("id", postId)
      .eq("status", "visible")
      .maybeSingle();

    if (postError) {
      res.status(500).json({
        error: `Supabase board_posts 조회 실패: ${postError.message}`,
      });
      return;
    }

    if (!postData) {
      res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
      return;
    }

    const post = postData as BoardPostRow;
    const { data: commentData, error: commentError } = await supabase
      .from("board_post_comments")
      .select(BOARD_POST_COMMENT_COLUMNS)
      .eq("post_id", post.id)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .limit(100);

    if (commentError) {
      res.status(500).json({
        error: `Supabase board_post_comments 조회 실패: ${commentError.message}`,
      });
      return;
    }

    let author = "익명 사용자";

    if (post.user_id) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email,display_name")
        .eq("id", post.user_id)
        .maybeSingle();

      if (profileError) {
        res.status(500).json({
          error: `Supabase profiles 조회 실패: ${profileError.message}`,
        });
        return;
      }

      author = getProfileAuthorName(profileData as ProfileRow | null, author);
    }

    res.status(200).json({
      post: {
        ...toBoardPostSummary(post),
        author,
        body: sanitizeBoardPostHtml(post.body),
        comments: ((commentData ?? []) as BoardPostCommentRow[]).map(
          toBoardPostComment,
        ),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

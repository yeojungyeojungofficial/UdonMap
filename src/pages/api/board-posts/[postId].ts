import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAuthUserErrorMessage,
  getBearerToken,
  getQueryValue,
} from "@/src/core/apiRequest";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import type { Database } from "@/src/core/database.types";
import {
  sanitizeBoardPostHtml,
  toBoardPostComment,
  toBoardPostSummary,
  validateCreateBoardPost,
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
      postId: string;
    }
  | {
      error: string;
    };

const BOARD_POST_DETAIL_COLUMNS =
  "id,user_id,board,filter_tag,title,body,comment_count,view_count,status,created_at,updated_at";
const BOARD_POST_COMMENT_COLUMNS =
  "id,post_id,user_id,author_name,body,like_count,dislike_count,status,deleted_at,deleted_by,deleted_reason,created_at,updated_at";

function getProfileAuthorName(profile: ProfileRow | null, fallback: string) {
  return (
    profile?.display_name?.trim() ||
    getDefaultDisplayName(profile?.email) ||
    fallback
  );
}

async function getAuthenticatedUser(req: NextApiRequest) {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    return {
      error: "로그인이 필요합니다.",
      status: 401,
      userId: null,
    };
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return {
      error: getAuthUserErrorMessage(error),
      status: 401,
      userId: null,
    };
  }

  return {
    error: "",
    status: 200,
    userId: user.id,
  };
}

function toBoardPostDetail(
  post: BoardPostRow,
  author: string,
  comments: BoardPostCommentRow[] = [],
): BoardPostDetail {
  return {
    ...toBoardPostSummary(post),
    author,
    body: sanitizeBoardPostHtml(post.body),
    comments: comments.map(toBoardPostComment),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BoardPostDetailResponse>,
) {
  if (req.method !== "GET" && req.method !== "PATCH" && req.method !== "DELETE") {
    res.setHeader("Allow", "GET, PATCH, DELETE");
    res.status(405).json({ error: "GET, PATCH, DELETE 요청만 지원합니다." });
    return;
  }

  const postId = getQueryValue(req, "postId");

  if (!postId) {
    res.status(400).json({ error: "게시글 ID가 필요합니다." });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();

    if (req.method === "DELETE") {
      const auth = await getAuthenticatedUser(req);

      if (!auth.userId) {
        res.status(auth.status).json({ error: auth.error });
        return;
      }

      const { data, error } = await supabase
        .from("board_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", auth.userId)
        .select("id")
        .maybeSingle();

      if (error) {
        res.status(500).json({
          error: `Supabase board_posts delete 실패: ${error.message}`,
        });
        return;
      }

      if (!data) {
        res.status(404).json({ error: "삭제할 게시글을 찾을 수 없습니다." });
        return;
      }

      res.status(200).json({ postId: data.id });
      return;
    }

    if (req.method === "PATCH") {
      const auth = await getAuthenticatedUser(req);

      if (!auth.userId) {
        res.status(auth.status).json({ error: auth.error });
        return;
      }

      const validation = validateCreateBoardPost(req.body);

      if (!validation.ok) {
        res.status(400).json({ error: validation.message });
        return;
      }

      const { data, error } = await supabase
        .from("board_posts")
        .update({
          board: validation.value.board,
          filter_tag: validation.value.filterTag,
          title: validation.value.title,
          body: validation.value.body,
        })
        .eq("id", postId)
        .eq("user_id", auth.userId)
        .eq("status", "visible")
        .select(BOARD_POST_DETAIL_COLUMNS)
        .maybeSingle();

      if (error) {
        res.status(500).json({
          error: `Supabase board_posts update 실패: ${error.message}`,
        });
        return;
      }

      if (!data) {
        res.status(404).json({ error: "수정할 게시글을 찾을 수 없습니다." });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email,display_name")
        .eq("id", auth.userId)
        .maybeSingle();

      if (profileError) {
        res.status(500).json({
          error: `Supabase profiles 조회 실패: ${profileError.message}`,
        });
        return;
      }

      res.status(200).json({
        post: toBoardPostDetail(
          data as BoardPostRow,
          getProfileAuthorName(profileData as ProfileRow | null, "익명 사용자"),
        ),
      });
      return;
    }

    // GET 요청: 선택적으로 userId를 추출해 24시간 중복 조회 방지에 활용
    let viewerUserId: string | null = null;
    const accessToken = getBearerToken(req);
    if (accessToken) {
      const { data: authData } = await supabase.auth.getUser(accessToken);
      viewerUserId = authData?.user?.id ?? null;
    }

    const { data: postData, error: postError } = await supabase
      .rpc("increment_board_post_view_count", {
        p_post_id: postId,
        p_user_id: viewerUserId,
      })
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

    const commentQuery = supabase
      .from("board_post_comments")
      .select(BOARD_POST_COMMENT_COLUMNS)
      .eq("post_id", post.id)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .limit(100);
    const profileQuery = post.user_id
      ? supabase
          .from("profiles")
          .select("email,display_name")
          .eq("id", post.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [
      { data: commentData, error: commentError },
      { data: profileData, error: profileError },
    ] = await Promise.all([commentQuery, profileQuery]);

    if (commentError) {
      res.status(500).json({
        error: `Supabase board_post_comments 조회 실패: ${commentError.message}`,
      });
      return;
    }

    if (profileError) {
      res.status(500).json({
        error: `Supabase profiles 조회 실패: ${profileError.message}`,
      });
      return;
    }

    const author = getProfileAuthorName(
      profileData as ProfileRow | null,
      "익명 사용자",
    );

    res.status(200).json({
      post: toBoardPostDetail(
        post,
        author,
        (commentData ?? []) as BoardPostCommentRow[],
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

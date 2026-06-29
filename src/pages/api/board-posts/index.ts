import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import type { Database } from "@/src/core/database.types";
import {
  getAuthUserErrorMessage,
  getBearerToken,
} from "@/src/core/apiRequest";
import {
  checkRateLimitForKey,
  getClientIp,
  sendRateLimitResponse,
} from "@/src/core/rateLimit";
import {
  isBoardTab,
  toBoardPostSummary,
  validateCreateBoardPost,
  type BoardPostSummary,
} from "@/src/features/reviews/boardPosts";
import {
  ensureUserProfile,
  getUserProfileAuthorName,
  type UserProfileAuthorFields,
} from "@/src/core/userProfiles";
import {
  getSuspensionBlockedMessage,
  getUserActiveSuspension,
} from "@/src/core/suspensions";

type BoardPostRow = Database["public"]["Tables"]["board_posts"]["Row"];
type ProfileAuthorRow = UserProfileAuthorFields & { id: string };

const BOARD_POST_SUMMARY_COLUMNS =
  "id,user_id,board,filter_tag,title,comment_count,view_count,status,created_at,updated_at";
const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 50;
const BOARD_POST_CREATE_RATE_LIMIT = {
  limit: 8,
  windowMs: 60 * 1000,
};

type BoardPostListResponse =
  | {
      posts: BoardPostSummary[];
    }
  | { error: string };

type CreatePostResponse =
  | {
      post: BoardPostSummary;
    }
  | { error: string };

type PostResponse = BoardPostListResponse | CreatePostResponse;

function getPageSize(req: NextApiRequest) {
  const rawPageSize = Array.isArray(req.query.pageSize)
    ? req.query.pageSize[0]
    : req.query.pageSize;
  const pageSize = Number(rawPageSize ?? DEFAULT_PAGE_SIZE);

  if (!Number.isFinite(pageSize)) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.max(Math.trunc(pageSize), 1), MAX_PAGE_SIZE);
}

function getBoardPostUserIds(posts: BoardPostRow[]) {
  return Array.from(
    new Set(
      posts
        .map((post) => post.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );
}

async function handleGet(req: NextApiRequest, res: NextApiResponse<PostResponse>) {
  const rawBoard = Array.isArray(req.query.board)
    ? req.query.board[0]
    : req.query.board;
  const filterTag = Array.isArray(req.query.filterTag)
    ? req.query.filterTag[0]
    : req.query.filterTag;

  if (rawBoard && !isBoardTab(rawBoard)) {
    res.status(400).json({ error: "올바른 게시판을 선택해주세요." });
    return;
  }
  const board = rawBoard && isBoardTab(rawBoard) ? rawBoard : null;

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("board_posts")
      .select(BOARD_POST_SUMMARY_COLUMNS)
      .eq("status", "visible")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(getPageSize(req));

    if (board) {
      query = query.eq("board", board);
    }

    if (filterTag && filterTag !== "전체") {
      query = query.eq("filter_tag", filterTag);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({
        error: `Supabase board_posts 조회 실패: ${error.message}`,
      });
      return;
    }

    const posts = (data ?? []) as BoardPostRow[];
    const userIds = getBoardPostUserIds(posts);
    const authorByUserId = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,email,display_name")
        .in("id", userIds);

      if (profileError) {
        res.status(500).json({
          error: `Supabase profiles 조회 실패: ${profileError.message}`,
        });
        return;
      }

      ((profileData ?? []) as ProfileAuthorRow[]).forEach((profile) => {
        authorByUserId.set(
          profile.id,
          getUserProfileAuthorName(profile, "익명 사용자"),
        );
      });
    }

    res.setHeader(
      "Cache-Control",
      "private, max-age=15, stale-while-revalidate=30",
    );
    res.status(200).json({
      posts: posts.map((post) =>
        toBoardPostSummary(
          post,
          post.user_id
            ? (authorByUserId.get(post.user_id) ?? "익명 사용자")
            : "익명 사용자",
        ),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse>,
) {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  const validation = validateCreateBoardPost(req.body);

  if (!validation.ok) {
    res.status(400).json({ error: validation.message });
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
        error: getAuthUserErrorMessage(userError),
      });
      return;
    }

    const rateLimit = checkRateLimitForKey(
      `board-posts:create:${user.id}:${getClientIp(req)}`,
      BOARD_POST_CREATE_RATE_LIMIT,
    );
    if (!rateLimit.ok) {
      sendRateLimitResponse(res, rateLimit);
      return;
    }

    const suspensionData = await getUserActiveSuspension(supabase, user.id);

    if (suspensionData) {
      res.status(403).json({
        error: getSuspensionBlockedMessage(
          suspensionData,
          "게시글을 작성할 수 없습니다.",
        ),
      });
      return;
    }

    const profile = await ensureUserProfile(supabase, user);

    const { data, error } = await supabase
      .from("board_posts")
      .insert({
        user_id: user.id,
        board: validation.value.board,
        filter_tag: validation.value.filterTag,
        title: validation.value.title,
        body: validation.value.body,
      })
      .select(BOARD_POST_SUMMARY_COLUMNS)
      .single();

    if (error || !data) {
      res.status(500).json({
        error: error?.message ?? "게시글 저장에 실패했습니다.",
      });
      return;
    }

    res.status(201).json({
      post: toBoardPostSummary(
        data as BoardPostRow,
        getUserProfileAuthorName(profile, "익명 사용자"),
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse>,
) {
  if (req.method === "GET") {
    await handleGet(req, res);
    return;
  }

  if (req.method === "POST") {
    await handlePost(req, res);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "GET, POST 요청만 지원합니다." });
}

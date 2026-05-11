import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";
import type { Database } from "@/src/shared/lib/database.types";

type BoardPostRow = Database["public"]["Tables"]["board_posts"]["Row"];

type CreatePostBody = {
  board: BoardPostRow["board"];
  filterTag?: string | null;
  title: string;
  body: string;
};

type PostResponse =
  | {
      id: string;
      board: BoardPostRow["board"];
      filterTag: string | null;
      title: string;
      createdAt: string;
    }
  | { error: string };

function getBearerToken(req: NextApiRequest) {
  const authorization = req.headers.authorization;
  const header = Array.isArray(authorization)
    ? authorization[0]
    : authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "POST 요청만 지원합니다." });
    return;
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  const { board, filterTag, title, body } = req.body as CreatePostBody;

  if (!board || !title?.trim()) {
    res.status(400).json({ error: "게시판과 제목은 필수입니다." });
    return;
  }

  const validBoards: BoardPostRow["board"][] = [
    "병원후기 게시판",
    "자유게시판",
    "꿀팁 게시판",
  ];
  if (!validBoards.includes(board)) {
    res.status(400).json({ error: "올바른 게시판을 선택해주세요." });
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
          ? `사용자 확인 실패: ${userError.message}`
          : "로그인 사용자를 확인할 수 없습니다.",
      });
      return;
    }

    const { data, error } = await supabase
      .from("board_posts")
      .insert({
        user_id: user.id,
        board,
        filter_tag: filterTag ?? null,
        title: title.trim(),
        body: body ?? "",
      })
      .select("id,board,filter_tag,title,created_at")
      .single();

    if (error || !data) {
      res.status(500).json({
        error: error?.message ?? "게시글 저장에 실패했습니다.",
      });
      return;
    }

    res.status(201).json({
      id: data.id,
      board: data.board,
      filterTag: data.filter_tag,
      title: data.title,
      createdAt: data.created_at,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAuthUserErrorMessage,
  getBearerToken,
} from "@/src/core/apiRequest";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";

const USER_STORAGE_BUCKETS = [
  "posting_image",
  "hospital_report_attachments",
] as const;
const STORAGE_LIST_LIMIT = 100;
const STORAGE_REMOVE_CHUNK_SIZE = 100;

type DeleteAccountResponse =
  | {
      ok: true;
    }
  | {
      error: string;
    };

type SupabaseServerClient = ReturnType<typeof getSupabaseServerClient>;

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function listUserStoragePaths({
  bucket,
  supabase,
  userId,
}: {
  bucket: (typeof USER_STORAGE_BUCKETS)[number];
  supabase: SupabaseServerClient;
  userId: string;
}) {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(userId, {
      limit: STORAGE_LIST_LIMIT,
      offset,
    });

    if (error) {
      throw new Error(`${bucket} Storage 목록 조회 실패: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    paths.push(...data.map((file) => `${userId}/${file.name}`));

    if (data.length < STORAGE_LIST_LIMIT) {
      break;
    }

    offset += STORAGE_LIST_LIMIT;
  }

  return paths;
}

async function removeUserStorageFiles(
  supabase: SupabaseServerClient,
  userId: string,
) {
  for (const bucket of USER_STORAGE_BUCKETS) {
    const paths = await listUserStoragePaths({ bucket, supabase, userId });

    for (const chunk of chunkArray(paths, STORAGE_REMOVE_CHUNK_SIZE)) {
      const { error } = await supabase.storage.from(bucket).remove(chunk);

      if (error) {
        throw new Error(`${bucket} Storage 삭제 실패: ${error.message}`);
      }
    }
  }
}

async function anonymizeUserLinkedContent(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { error: reportError } = await supabase
    .from("hospital_reports")
    .update({
      contact_info: null,
      marketing_consent: false,
      reporter_email: null,
      user_id: null,
    })
    .eq("user_id", userId);

  if (reportError) {
    throw new Error(`Supabase hospital_reports 익명화 실패: ${reportError.message}`);
  }

  const { error: boardCommentError } = await supabase
    .from("board_post_comments")
    .update({
      author_name: "탈퇴한 사용자",
    })
    .eq("user_id", userId);

  if (boardCommentError) {
    throw new Error(
      `Supabase board_post_comments 익명화 실패: ${boardCommentError.message}`,
    );
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteAccountResponse>,
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    res.status(405).json({ error: "DELETE 요청만 지원합니다." });
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
        error: getAuthUserErrorMessage(userError),
      });
      return;
    }

    await removeUserStorageFiles(supabase, user.id);
    await anonymizeUserLinkedContent(supabase, user.id);

    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      user.id,
    );

    if (deleteUserError) {
      res.status(500).json({
        error: `Supabase 회원탈퇴 실패: ${deleteUserError.message}`,
      });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

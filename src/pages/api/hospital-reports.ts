import type { NextApiRequest, NextApiResponse } from "next";
import {
  validateCreateHospitalReport,
  type CreateHospitalReportRequest,
  type HospitalReportAttachment,
} from "@/src/features/hospitals/reports";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import {
  getAuthUserErrorMessage,
  getBearerToken,
} from "@/src/core/apiRequest";
import {
  checkRateLimit,
  sendRateLimitResponse,
} from "@/src/core/rateLimit";

const HOSPITAL_REPORT_ATTACHMENT_BUCKET = "hospital_report_attachments";
const MAX_ATTACHMENT_COUNT = 3;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const WEBP_MIME_TYPE = "image/webp";
const HOSPITAL_REPORT_CREATE_RATE_LIMIT = {
  keyPrefix: "hospital-reports:create",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

type CreateHospitalReportResponse =
  | {
      id: string;
      status: "pending";
    }
  | {
      error: string;
    };

class BadRequestError extends Error {
  statusCode = 400;
}

async function removeUploadedAttachments(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  attachments: HospitalReportAttachment[],
) {
  const paths = attachments
    .map((attachment) => attachment.path)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage
      .from(HOSPITAL_REPORT_ATTACHMENT_BUCKET)
      .remove(paths)
      .catch(() => undefined);
  }
}

function normalizeAttachmentMetadata(
  value: unknown,
  userId: string,
): HospitalReportAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  if (value.length > MAX_ATTACHMENT_COUNT) {
    throw new BadRequestError(
      `사진은 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부됩니다.`,
    );
  }

  return value.map((item) => {
    if (!item || typeof item !== "object") {
      throw new BadRequestError("제보 사진 정보가 올바르지 않습니다.");
    }

    const attachment = item as Partial<HospitalReportAttachment>;
    const name = typeof attachment.name === "string" ? attachment.name : "";
    const path = typeof attachment.path === "string" ? attachment.path : "";
    const type = typeof attachment.type === "string" ? attachment.type : "";
    const size =
      typeof attachment.size === "number" && Number.isFinite(attachment.size)
        ? attachment.size
        : 0;
    const lastModified =
      typeof attachment.lastModified === "number" &&
      Number.isFinite(attachment.lastModified)
        ? attachment.lastModified
        : 0;

    if (!name || !path) {
      throw new BadRequestError("제보 사진 정보가 올바르지 않습니다.");
    }

    if (type !== WEBP_MIME_TYPE) {
      throw new BadRequestError("제보 사진은 WebP 형식만 업로드할 수 있습니다.");
    }

    if (size <= 0 || size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new BadRequestError("사진은 5MB 이하로 첨부해주세요.");
    }

    if (
      !path.startsWith(`${userId}/`) ||
      path.includes("..") ||
      path.split("/").length !== 2
    ) {
      throw new BadRequestError("제보 사진 저장 경로가 올바르지 않습니다.");
    }

    return {
      lastModified,
      name,
      path,
      size,
      type,
    };
  });
}

async function verifyUploadedAttachments({
  attachments,
  supabase,
  userId,
}: {
  attachments: HospitalReportAttachment[];
  supabase: ReturnType<typeof getSupabaseServerClient>;
  userId: string;
}) {
  for (const attachment of attachments) {
    const pathParts = attachment.path?.split("/") ?? [];
    const fileName = pathParts[1];

    if (!fileName) {
      throw new BadRequestError("제보 사진 저장 경로가 올바르지 않습니다.");
    }

    const { data, error } = await supabase.storage
      .from(HOSPITAL_REPORT_ATTACHMENT_BUCKET)
      .list(userId, {
        limit: 1,
        search: fileName,
      });

    if (error) {
      throw new Error(`제보 사진 확인 실패: ${error.message}`);
    }

    if (!data?.some((file) => file.name === fileName)) {
      throw new BadRequestError("업로드된 제보 사진을 찾을 수 없습니다.");
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateHospitalReportResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "POST 요청만 지원합니다." });
    return;
  }

  const rateLimit = checkRateLimit(req, HOSPITAL_REPORT_CREATE_RATE_LIMIT);
  if (!rateLimit.ok) {
    sendRateLimitResponse(res, rateLimit);
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const accessToken = getBearerToken(req);
    let authUser: { email?: string | null; id: string } | null = null;

    if (accessToken) {
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

      authUser = user;
    }

    const requestBody =
      req.body && typeof req.body === "object"
        ? (req.body as Partial<CreateHospitalReportRequest>)
        : {};

    if (
      !authUser &&
      Array.isArray(requestBody.attachments) &&
      requestBody.attachments.length > 0
    ) {
      res.status(400).json({
        error:
          "사진 첨부는 로그인 후 사용할 수 있습니다. 사진 없이 제보하거나 로그인해주세요.",
      });
      return;
    }

    const uploadedAttachments = normalizeAttachmentMetadata(
      requestBody.attachments,
      authUser?.id ?? "",
    );

    if (authUser) {
      await verifyUploadedAttachments({
        attachments: uploadedAttachments,
        supabase,
        userId: authUser.id,
      });
    }

    const validation = validateCreateHospitalReport({
      ...requestBody,
      attachments: uploadedAttachments,
    });

    if (!validation.ok) {
      await removeUploadedAttachments(supabase, uploadedAttachments);
      res.status(400).json({ error: validation.message });
      return;
    }

    const { data, error } = await supabase
      .from("hospital_reports")
      .insert({
        ...validation.value,
        reporter_email: authUser?.email ?? null,
        user_id: authUser?.id ?? null,
      })
      .select("id,status")
      .single();

    if (error) {
      await removeUploadedAttachments(supabase, uploadedAttachments);
      res
        .status(500)
        .json({ error: `Supabase hospital_reports insert 실패: ${error.message}` });
      return;
    }

    res.status(201).json({ id: data.id, status: "pending" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res
      .status(error instanceof BadRequestError ? error.statusCode : 500)
      .json({ error: message });
  }
}

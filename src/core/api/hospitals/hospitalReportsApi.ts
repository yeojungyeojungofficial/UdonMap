import { loadAuthSession } from "@/src/core/authSession";
import { getSupabaseBrowserClient } from "@/src/core/supabase";
import type { HospitalReportAttachment } from "@/src/features/hospitals/reports";

export type CreateHospitalReportInput = {
  animalCategories: string[];
  animalSpecies: string;
  attachments: File[];
  contactInfo: string;
  details: string;
  hospitalName: string;
  marketingConsent: boolean;
  streetAddress: string;
};

type CreateHospitalReportResponse =
  | {
      error?: string;
    }
  | null;

const HOSPITAL_REPORT_ATTACHMENT_BUCKET = "hospital_report_attachments";
const MAX_ATTACHMENT_COUNT = 3;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const WEBP_MIME_TYPE = "image/webp";

function getSafeFileName(fileName: string) {
  const normalizedName = fileName.replace(/\.[^.]+$/, "") || "attachment";
  return `${normalizedName.replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
}

function createAttachmentPath(userId: string, file: File, index: number) {
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return [
    userId,
    `${Date.now()}-${index}-${uniqueId}-${getSafeFileName(file.name)}`,
  ].join("/");
}

async function removeUploadedAttachments(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  await supabase.storage
    .from(HOSPITAL_REPORT_ATTACHMENT_BUCKET)
    .remove(paths)
    .catch(() => undefined);
}

async function uploadHospitalReportAttachments({
  files,
  userId,
}: {
  files: File[];
  userId: string;
}) {
  if (files.length > MAX_ATTACHMENT_COUNT) {
    throw new Error(`사진은 최대 ${MAX_ATTACHMENT_COUNT}개까지 첨부됩니다.`);
  }

  const supabase = getSupabaseBrowserClient();
  const uploadedAttachments: HospitalReportAttachment[] = [];

  try {
    for (const [index, file] of files.entries()) {
      if (file.type !== WEBP_MIME_TYPE) {
        throw new Error("제보 사진은 WebP 형식만 업로드할 수 있습니다.");
      }

      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new Error("사진은 5MB 이하로 첨부해주세요.");
      }

      const path = createAttachmentPath(userId, file, index);
      const { error } = await supabase.storage
        .from(HOSPITAL_REPORT_ATTACHMENT_BUCKET)
        .upload(path, file, {
          contentType: WEBP_MIME_TYPE,
          upsert: false,
        });

      if (error) {
        throw new Error(`제보 사진 업로드 실패: ${error.message}`);
      }

      uploadedAttachments.push({
        lastModified: file.lastModified,
        name: getSafeFileName(file.name),
        path,
        size: file.size,
        type: WEBP_MIME_TYPE,
      });
    }

    return uploadedAttachments;
  } catch (error) {
    await removeUploadedAttachments(
      uploadedAttachments
        .map((attachment) => attachment.path)
        .filter((path): path is string => Boolean(path)),
    );
    throw error;
  }
}

async function loadOptionalAuthSession() {
  try {
    return await loadAuthSession(getSupabaseBrowserClient());
  } catch {
    return null;
  }
}

export async function createHospitalReport(input: CreateHospitalReportInput) {
  const session = await loadOptionalAuthSession();

  if (!session && input.attachments.length > 0) {
    throw new Error(
      "사진 첨부는 로그인 후 사용할 수 있습니다. 사진 없이 제보하거나 로그인해주세요.",
    );
  }

  const uploadedAttachments = session
    ? await uploadHospitalReportAttachments({
        files: input.attachments,
        userId: session.user.id,
      })
    : [];

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/hospital-reports", {
      method: "POST",
      headers,
      body: JSON.stringify({
        animalCategories: input.animalCategories,
        animalSpecies: input.animalSpecies,
        attachments: uploadedAttachments,
        contactInfo: input.contactInfo,
        details: input.details,
        hospitalName: input.hospitalName,
        marketingConsent: input.marketingConsent,
        streetAddress: input.streetAddress,
      }),
    });
    const result = (await response.json().catch(() => null)) as
      | CreateHospitalReportResponse
      | null;

    if (!response.ok) {
      throw new Error(result?.error ?? "제보 저장에 실패했습니다.");
    }
  } catch (error) {
    await removeUploadedAttachments(
      uploadedAttachments
        .map((attachment) => attachment.path)
        .filter((path): path is string => Boolean(path)),
    );
    throw error;
  }
}

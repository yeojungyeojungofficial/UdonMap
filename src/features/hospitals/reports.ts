import type { Database, Json } from "@/src/shared/lib/database.types";

export const HOSPITAL_REPORT_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
] as const;

export type HospitalReportStatus = (typeof HOSPITAL_REPORT_STATUSES)[number];

export type HospitalReportInsert =
  Database["public"]["Tables"]["hospital_reports"]["Insert"];

export type HospitalReportRow =
  Database["public"]["Tables"]["hospital_reports"]["Row"];

export type HospitalReportAttachment = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type CreateHospitalReportRequest = {
  hospitalName: string;
  streetAddress: string;
  animalCategories: string[];
  animalSpecies?: string;
  details?: string;
  attachments?: HospitalReportAttachment[];
};

export type HospitalReportValidationResult =
  | {
      ok: true;
      value: HospitalReportInsert;
    }
  | {
      ok: false;
      message: string;
    };

const MAX_TEXT_LENGTH = 2000;
const MAX_ATTACHMENT_COUNT = 3;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);
}

function normalizeAttachments(value: unknown): HospitalReportAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, MAX_ATTACHMENT_COUNT)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const attachment = item as Record<string, unknown>;
      const name = normalizeText(attachment.name);
      const type = normalizeText(attachment.type);
      const size =
        typeof attachment.size === "number" && Number.isFinite(attachment.size)
          ? attachment.size
          : 0;
      const lastModified =
        typeof attachment.lastModified === "number" &&
        Number.isFinite(attachment.lastModified)
          ? attachment.lastModified
          : 0;

      if (!name) {
        return null;
      }

      return {
        name,
        size,
        type,
        lastModified,
      };
    })
    .filter((item): item is HospitalReportAttachment => Boolean(item));
}

export function isHospitalReportStatus(
  status: unknown,
): status is HospitalReportStatus {
  return (
    typeof status === "string" &&
    HOSPITAL_REPORT_STATUSES.includes(status as HospitalReportStatus)
  );
}

export function validateCreateHospitalReport(
  body: unknown,
): HospitalReportValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "요청 본문이 올바르지 않습니다." };
  }

  const request = body as Partial<CreateHospitalReportRequest>;
  const hospitalName = normalizeText(request.hospitalName);
  const streetAddress = normalizeText(request.streetAddress);
  const animalCategories = normalizeStringList(request.animalCategories);
  const animalSpecies = normalizeText(request.animalSpecies);
  const details = normalizeText(request.details);
  const attachments = normalizeAttachments(request.attachments);

  if (!hospitalName) {
    return { ok: false, message: "병원명을 입력해주세요." };
  }

  if (!streetAddress) {
    return { ok: false, message: "병원주소를 입력해주세요." };
  }

  if (hospitalName.length > 120) {
    return { ok: false, message: "병원명은 120자 이하로 입력해주세요." };
  }

  if (streetAddress.length > 240) {
    return { ok: false, message: "병원주소는 240자 이하로 입력해주세요." };
  }

  if (details.length > MAX_TEXT_LENGTH) {
    return {
      ok: false,
      message: `더 많은 정보기록은 ${MAX_TEXT_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  return {
    ok: true,
    value: {
      hospital_name: hospitalName,
      street_address: streetAddress,
      animal_categories: animalCategories,
      animal_species: animalSpecies || null,
      details: details || null,
      attachment_metadata: attachments as unknown as Json,
      status: "pending",
    },
  };
}

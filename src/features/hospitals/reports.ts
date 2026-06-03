import type { Database, Json } from "@/src/core/database.types";

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
  lastModified: number;
  name: string;
  path?: string;
  publicUrl?: string;
  size: number;
  type: string;
};

export type CreateHospitalReportRequest = {
  hospitalName: string;
  streetAddress: string;
  animalCategories: string[];
  animalSpecies?: string;
  contactInfo?: string;
  details?: string;
  marketingConsent?: boolean;
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
const MAX_CONTACT_INFO_LENGTH = 120;
const MAX_ATTACHMENT_COUNT = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s().-]{7,30}$/;

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

function isValidContactInfo(value: string) {
  if (!value) {
    return true;
  }

  const digitCount = value.replace(/\D/g, "").length;
  return (
    EMAIL_PATTERN.test(value) ||
    (digitCount >= 7 && PHONE_PATTERN.test(value))
  );
}

function normalizeAttachments(value: unknown): HospitalReportAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, MAX_ATTACHMENT_COUNT)
    .map<HospitalReportAttachment | null>((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const attachment = item as Record<string, unknown>;
      const name = normalizeText(attachment.name);
      const path = normalizeText(attachment.path);
      const publicUrl = normalizeText(attachment.publicUrl);
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
        lastModified,
        name,
        ...(path ? { path } : {}),
        ...(publicUrl ? { publicUrl } : {}),
        size,
        type,
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
  const contactInfo = normalizeText(request.contactInfo);
  const details = normalizeText(request.details);
  const marketingConsent = request.marketingConsent === true;
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

  if (contactInfo.length > MAX_CONTACT_INFO_LENGTH) {
    return {
      ok: false,
      message: `연락처는 ${MAX_CONTACT_INFO_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  if (!isValidContactInfo(contactInfo)) {
    return {
      ok: false,
      message: "연락처는 전화번호 또는 이메일 형식으로 입력해주세요.",
    };
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
      contact_info: contactInfo || null,
      details: details || null,
      marketing_consent: marketingConsent,
      attachment_metadata: attachments as unknown as Json,
      status: "pending",
    },
  };
}

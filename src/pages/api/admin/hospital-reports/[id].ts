import type { NextApiRequest, NextApiResponse } from "next";
import {
  isHospitalReportStatus,
  type HospitalReportRow,
} from "@/src/shared/lib/hospitalReports";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";

type AdminHospitalReportResponse =
  | {
      report: HospitalReportRow;
    }
  | {
      error: string;
    };

function isAdminRequest(req: NextApiRequest) {
  const adminSecret = process.env.ADMIN_API_SECRET;

  if (!adminSecret) {
    return false;
  }

  return req.headers["x-admin-secret"] === adminSecret;
}

function getReportId(req: NextApiRequest) {
  return Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminHospitalReportResponse>,
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    res.status(405).json({ error: "PATCH 요청만 지원합니다." });
    return;
  }

  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "어드민 권한이 필요합니다." });
    return;
  }

  const reportId = getReportId(req);

  if (!reportId) {
    res.status(400).json({ error: "제보 ID가 필요합니다." });
    return;
  }

  const status = req.body?.status;

  if (!isHospitalReportStatus(status)) {
    res.status(400).json({ error: "지원하지 않는 제보 상태입니다." });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("hospital_reports")
      .update({
        status,
        admin_notes: normalizeOptionalText(req.body?.adminNotes),
        reviewed_at: status === "pending" ? null : new Date().toISOString(),
      })
      .eq("id", reportId)
      .select("*")
      .single();

    if (error) {
      res
        .status(500)
        .json({ error: `Supabase hospital_reports 수정 실패: ${error.message}` });
      return;
    }

    res.status(200).json({ report: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

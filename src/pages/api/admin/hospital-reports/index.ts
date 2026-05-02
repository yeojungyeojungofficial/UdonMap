import type { NextApiRequest, NextApiResponse } from "next";
import { isHospitalReportStatus } from "@/src/shared/lib/hospitalReports";
import type { HospitalReportRow } from "@/src/shared/lib/hospitalReports";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";

type AdminHospitalReportsResponse =
  | {
      reports: HospitalReportRow[];
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminHospitalReportsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "GET 요청만 지원합니다." });
    return;
  }

  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "어드민 권한이 필요합니다." });
    return;
  }

  const status = Array.isArray(req.query.status)
    ? req.query.status[0]
    : req.query.status;

  if (status && !isHospitalReportStatus(status)) {
    res.status(400).json({ error: "지원하지 않는 제보 상태입니다." });
    return;
  }

  const statusFilter = isHospitalReportStatus(status) ? status : null;

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("hospital_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      res
        .status(500)
        .json({ error: `Supabase hospital_reports 조회 실패: ${error.message}` });
      return;
    }

    res.status(200).json({ reports: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

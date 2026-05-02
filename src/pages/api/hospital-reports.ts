import type { NextApiRequest, NextApiResponse } from "next";
import { validateCreateHospitalReport } from "@/src/shared/lib/hospitalReports";
import { getSupabaseServerClient } from "@/src/shared/lib/supabaseServer";

type CreateHospitalReportResponse =
  | {
      id: string;
      status: "pending";
    }
  | {
      error: string;
    };

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500kb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateHospitalReportResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "POST 요청만 지원합니다." });
    return;
  }

  const validation = validateCreateHospitalReport(req.body);

  if (!validation.ok) {
    res.status(400).json({ error: validation.message });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("hospital_reports")
      .insert(validation.value)
      .select("id,status")
      .single();

    if (error) {
      res
        .status(500)
        .json({ error: `Supabase hospital_reports insert 실패: ${error.message}` });
      return;
    }

    res.status(201).json({ id: data.id, status: "pending" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

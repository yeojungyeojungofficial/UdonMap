import { loadAuthSession } from "@/src/core/authSession";
import { supabase } from "@/src/core/supabase";

export type CreateHospitalReportInput = {
  animalCategories: string[];
  animalSpecies: string;
  attachments: Array<{
    lastModified: number;
    name: string;
    size: number;
    type: string;
  }>;
  details: string;
  hospitalName: string;
  streetAddress: string;
};

type CreateHospitalReportResponse =
  | {
      error?: string;
    }
  | null;

export async function createHospitalReport(input: CreateHospitalReportInput) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (supabase) {
    const session = await loadAuthSession(supabase);

    if (session) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  const response = await fetch("/api/hospital-reports", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  const result = (await response.json().catch(() => null)) as
    | CreateHospitalReportResponse
    | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "제보 저장에 실패했습니다.");
  }
}

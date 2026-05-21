import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseServerClient } from "@/src/core/supabaseServer";
import type { Database } from "@/src/core/database.types";

export type MapPopupRow = Pick<
  Database["public"]["Tables"]["map_popups"]["Row"],
  | "id"
  | "title"
  | "body"
  | "popup_type"
  | "placement"
  | "link_url"
  | "link_label"
  | "image_url"
  | "priority"
  | "dismiss_key"
>;

type MapPopupsResponse = { popups: MapPopupRow[] } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MapPopupsResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "GET 요청만 지원합니다." });
    return;
  }

  try {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("map_popups")
      .select(
        "id,title,body,popup_type,placement,link_url,link_label,image_url,priority,dismiss_key",
      )
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("priority", { ascending: false });

    if (error) {
      res.status(500).json({ error: `팝업 조회 실패: ${error.message}` });
      return;
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ popups: (data ?? []) as MapPopupRow[] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류입니다.";
    res.status(500).json({ error: message });
  }
}

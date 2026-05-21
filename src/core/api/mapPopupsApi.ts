import type { MapPopupRow } from "@/src/pages/api/map-popups";

export async function fetchMapPopups(): Promise<MapPopupRow[]> {
  const response = await fetch("/api/map-popups");
  if (!response.ok) {
    throw new Error(`팝업 조회 실패: ${response.status}`);
  }
  const result = (await response.json()) as
    | { popups: MapPopupRow[] }
    | { error: string };
  if ("error" in result) {
    throw new Error(result.error);
  }
  return result.popups;
}

import { useEffect, useState } from "react";
import { fetchMapPopups } from "@/src/core/api/mapPopupsApi";
import type { MapPopupRow } from "@/src/pages/api/map-popups";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isDismissedToday(dismissKey: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(dismissKey) === getTodayString();
  } catch {
    return false;
  }
}

function dismissForToday(dismissKey: string): void {
  try {
    localStorage.setItem(dismissKey, getTodayString());
  } catch {
    // localStorage 접근 불가한 환경 대응
  }
}

type UseMapPopupsResult = {
  popup: MapPopupRow | null;
  isDismissForToday: boolean;
  setIsDismissForToday: (value: boolean) => void;
  onClose: () => void;
};

export function useMapPopups(): UseMapPopupsResult {
  const [popup, setPopup] = useState<MapPopupRow | null>(null);
  const [isDismissForToday, setIsDismissForToday] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchMapPopups()
      .then((popups) => {
        if (cancelled) return;
        const visible = popups.find((p) => !isDismissedToday(p.dismiss_key));
        setPopup(visible ?? null);
      })
      .catch(() => {
        // 팝업 조회 실패 시 조용히 무시
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onClose = () => {
    if (!popup) return;
    if (isDismissForToday) {
      dismissForToday(popup.dismiss_key);
    }
    setPopup(null);
  };

  return { popup, isDismissForToday, setIsDismissForToday, onClose };
}

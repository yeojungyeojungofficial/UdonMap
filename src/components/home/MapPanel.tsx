import { useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_HOSPITAL_MAP_LEVEL } from "@/src/constants/map";
import type { Hospital } from "@/src/features/hospitals/types";
import styles from "@/src/components/home/Home.module.css";

type KakaoLatLng = object;

type KakaoLatLngBounds = {
  extend: (latLng: KakaoLatLng) => void;
};

type KakaoMap = {
  getLevel: () => number;
  relayout: () => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
  setCenter: (latLng: KakaoLatLng) => void;
  setLevel: (
    level: number,
    options?: { anchor?: KakaoLatLng; animate?: boolean },
  ) => void;
};

type KakaoCustomOverlay = {
  setMap: (map: KakaoMap | null) => void;
};

type KakaoMaps = {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  CustomOverlay: new (options: {
    content: HTMLElement;
    position: KakaoLatLng;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
  event: {
    addListener: (target: KakaoMap, type: string, handler: () => void) => void;
    removeListener: (
      target: KakaoMap,
      type: string,
      handler: () => void,
    ) => void;
  };
};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMaps;
    };
  }
}

type MapPanelProps = {
  hospitals: Hospital[];
  mapLevel: number;
  selectedHospitalId: string | null;
  onMapLevelChange: (mapLevel: number) => void;
  onSelectHospital: (hospital: Hospital) => void;
};

const SEOUL_CENTER = {
  lat: 37.5665,
  lng: 126.978,
};

const CLUSTER_MIN_LEVEL = 10;
const CLUSTER_BASE_GRID_DEGREES = 0.8;

type OverlayEntry = {
  button: HTMLButtonElement;
  onClick: () => void;
  overlay: KakaoCustomOverlay;
};

type HospitalOverlayGroup = {
  id: string;
  hospitals: Hospital[];
  center: {
    lat: number;
    lng: number;
  };
};

function getHospitalCenter(hospitals: Hospital[]) {
  const total = hospitals.reduce(
    (accumulator, hospital) => {
      return {
        lat: accumulator.lat + hospital.mapCoordinate.lat,
        lng: accumulator.lng + hospital.mapCoordinate.lng,
      };
    },
    { lat: 0, lng: 0 },
  );

  return {
    lat: total.lat / hospitals.length,
    lng: total.lng / hospitals.length,
  };
}

function getClusterGridSize(mapLevel: number) {
  return (
    CLUSTER_BASE_GRID_DEGREES *
    2 ** Math.max(0, mapLevel - CLUSTER_MIN_LEVEL)
  );
}

function groupHospitalsByMapLevel(
  hospitals: Hospital[],
  mapLevel: number,
): HospitalOverlayGroup[] {
  if (mapLevel < CLUSTER_MIN_LEVEL) {
    return hospitals.map((hospital) => ({
      id: hospital.id,
      hospitals: [hospital],
      center: hospital.mapCoordinate,
    }));
  }

  const gridSize = getClusterGridSize(mapLevel);
  const groups = new Map<string, Hospital[]>();

  hospitals.forEach((hospital) => {
    const latKey = Math.round(
      (hospital.mapCoordinate.lat - SEOUL_CENTER.lat) / gridSize,
    );
    const lngKey = Math.round(
      (hospital.mapCoordinate.lng - SEOUL_CENTER.lng) / gridSize,
    );
    const key = `${latKey}:${lngKey}`;
    groups.set(key, [...(groups.get(key) ?? []), hospital]);
  });

  return Array.from(groups.entries()).map(([id, groupHospitals]) => ({
    id,
    hospitals: groupHospitals,
    center: getHospitalCenter(groupHospitals),
  }));
}

export default function MapPanel({
  hospitals,
  mapLevel,
  selectedHospitalId,
  onMapLevelChange,
  onSelectHospital,
}: MapPanelProps) {
  const kakaoMapJsKey =
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY ??
    process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;
  const scriptSrc = useMemo(() => {
    if (!kakaoMapJsKey) {
      return null;
    }

    const appKey = encodeURIComponent(kakaoMapJsKey);
    return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
  }, [kakaoMapJsKey]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<OverlayEntry[]>([]);
  const shouldSkipInitialBoundsRef = useRef(true);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasSdkLoadError, setHasSdkLoadError] = useState(false);

  useEffect(() => {
    if (!scriptSrc) return;

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setIsSdkReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => {
      window.kakao?.maps.load(() => setIsSdkReady(true));
    };
    script.onerror = () => setHasSdkLoadError(true);
    document.head.appendChild(script);
  }, [scriptSrc]);

  useEffect(() => {
    if (!scriptSrc || !isSdkReady || !mapContainerRef.current || !window.kakao) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(
          SEOUL_CENTER.lat,
          SEOUL_CENTER.lng,
        ),
        level: INITIAL_HOSPITAL_MAP_LEVEL,
      });
      onMapLevelChange(mapRef.current.getLevel());
      setIsMapReady(true);
    }

    mapRef.current.relayout();
  }, [hospitals, isSdkReady, onMapLevelChange, scriptSrc]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao) {
      return;
    }

    const map = mapRef.current;
    const kakaoMaps = window.kakao.maps;
    const handleZoomChanged = () => {
      onMapLevelChange(map.getLevel());
    };

    kakaoMaps.event.addListener(map, "zoom_changed", handleZoomChanged);
    onMapLevelChange(map.getLevel());

    return () => {
      kakaoMaps.event.removeListener(map, "zoom_changed", handleZoomChanged);
    };
  }, [isMapReady, onMapLevelChange]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao) {
      return;
    }

    const map = mapRef.current;
    const kakaoMaps = window.kakao.maps;
    map.relayout();

    if (hospitals.length === 0) {
      return;
    }

    if (shouldSkipInitialBoundsRef.current) {
      shouldSkipInitialBoundsRef.current = false;
      return;
    }

    if (hospitals.length === 1) {
      const [hospital] = hospitals;
      map.setCenter(
        new kakaoMaps.LatLng(
          hospital.mapCoordinate.lat,
          hospital.mapCoordinate.lng,
        ),
      );
      map.setLevel(5);
      return;
    }

    const bounds = new kakaoMaps.LatLngBounds();
    hospitals.forEach((hospital) => {
      bounds.extend(
        new kakaoMaps.LatLng(
          hospital.mapCoordinate.lat,
          hospital.mapCoordinate.lng,
        ),
      );
    });
    map.setBounds(bounds);
  }, [hospitals, isMapReady]);

  useEffect(() => {
    const clearOverlays = () => {
      overlaysRef.current.forEach(({ button, onClick, overlay }) => {
        button.removeEventListener("click", onClick);
        overlay.setMap(null);
      });
      overlaysRef.current = [];
    };

    if (!isMapReady || !mapRef.current || !window.kakao) {
      return clearOverlays;
    }

    const map = mapRef.current;
    const kakaoMaps = window.kakao.maps;
    clearOverlays();

    groupHospitalsByMapLevel(hospitals, mapLevel).forEach((group) => {
      const position = new kakaoMaps.LatLng(group.center.lat, group.center.lng);

      if (group.hospitals.length > 1) {
        const button = document.createElement("button");
        const onClick = () => {
          map.setCenter(position);
          map.setLevel(Math.max(map.getLevel() - 2, 3), {
            anchor: position,
            animate: true,
          });
        };

        button.type = "button";
        button.className = styles.kakaoCluster;
        button.textContent = String(group.hospitals.length);
        button.setAttribute("aria-label", `${group.hospitals.length}개 병원 묶음`);
        button.addEventListener("click", onClick);

        const overlay = new kakaoMaps.CustomOverlay({
          content: button,
          position,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 3,
        });

        overlay.setMap(map);
        overlaysRef.current.push({ button, onClick, overlay });
        return;
      }

      const [hospital] = group.hospitals;
      const isActive = hospital.id === selectedHospitalId;
      const button = document.createElement("button");
      const dot = document.createElement("span");
      const label = document.createElement("span");
      const onClick = () => onSelectHospital(hospital);

      button.type = "button";
      button.className = `${styles.kakaoMarker} ${
        isActive ? styles.markerActive : ""
      }`;
      button.setAttribute("aria-label", `${hospital.name} 마커`);
      dot.className = styles.markerDot;
      label.className = styles.markerLabel;
      label.textContent = hospital.name;

      button.append(dot, label);
      button.addEventListener("click", onClick);

      const overlay = new kakaoMaps.CustomOverlay({
        content: button,
        position,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: isActive ? 2 : 1,
      });

      overlay.setMap(map);
      overlaysRef.current.push({ button, onClick, overlay });
    });

    return clearOverlays;
  }, [hospitals, isMapReady, mapLevel, onSelectHospital, selectedHospitalId]);

  const fallbackMarkers = hospitals.map((hospital) => {
    const isActive = hospital.id === selectedHospitalId;
    return (
      <button
        key={hospital.id}
        type="button"
        className={`${styles.marker} ${isActive ? styles.markerActive : ""}`}
        style={{
          left: `${hospital.mapPosition.x}%`,
          top: `${hospital.mapPosition.y}%`,
        }}
        onClick={() => onSelectHospital(hospital)}
        aria-label={`${hospital.name} 마커`}
      >
        <span className={styles.markerDot} />
        <span className={styles.markerLabel}>{hospital.name}</span>
      </button>
    );
  });

  return (
    <section className={styles.mapPanel} aria-label="병원 지도">
      {scriptSrc && !hasSdkLoadError ? (
        <>
          <div ref={mapContainerRef} className={styles.kakaoMap} />
          {!isMapReady ? fallbackMarkers : null}
        </>
      ) : (
        fallbackMarkers
      )}
    </section>
  );
}

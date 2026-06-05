import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_REGION_MARKER_MAX_LEVEL,
  HOSPITAL_FOCUS_BOUNDS_MIN_LEVEL,
  HOSPITAL_FOCUS_BOUNDS_PADDING,
  HOSPITAL_FOCUS_BOUNDS_ZOOM_IN,
  HOSPITAL_FOCUS_SINGLE_LEVEL,
  INITIAL_HOSPITAL_MAP_LEVEL,
} from "@/src/constants/map";
import { getAllRegionOverlayGroups } from "@/src/features/hospitals/mapViewScope";
import type { Hospital, Region } from "@/src/features/hospitals/types";
import styles from "@/src/components/home/Home.module.css";

type KakaoLatLng = object;

type KakaoLatLngBounds = {
  extend: (latLng: KakaoLatLng) => void;
};

type KakaoMap = {
  getLevel: () => number;
  relayout: () => void;
  setBounds: (
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ) => void;
  setCenter: (latLng: KakaoLatLng) => void;
  setLevel: (
    level: number,
    options?: { anchor?: KakaoLatLng; animate?: boolean },
  ) => void;
};

type KakaoCustomOverlay = {
  setMap: (map: KakaoMap | null) => void;
};

type KakaoRegionCodeResult = {
  region_1depth_name?: string;
  region_type?: string;
};

type KakaoGeocoder = {
  coord2RegionCode: (
    lng: number,
    lat: number,
    callback: (result: KakaoRegionCodeResult[], status: string) => void,
  ) => void;
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
  services?: {
    Geocoder: new () => KakaoGeocoder;
    Status: {
      OK: string;
    };
  };
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
  initialFocusRegion?: Region | null;
  isHospitalGroupFocused?: boolean;
  isSearchActive?: boolean;
  mapLevel: number;
  selectedHospitalId: string | null;
  selectedRegion: Region;
  onCurrentLocationResolved?: (location: CurrentLocation & {
    regionFilter?: Region | null;
  }) => void;
  onMapLevelChange: (mapLevel: number) => void;
  onSelectHospitalGroup: (groupId: string, hospitals: Hospital[]) => void;
  onSelectHospital: (hospital: Hospital) => void;
};

const SEOUL_CENTER = {
  lat: 37.5665,
  lng: 126.978,
};
const MIN_KAKAO_MAP_LEVEL = 1;
const MAX_KAKAO_MAP_LEVEL = 14;
const CURRENT_LOCATION_FOCUS_LEVEL = 3;

type CurrentLocation = {
  accuracy: number | null;
  lat: number;
  lng: number;
};

type LocationStatus = "idle" | "locating" | "visible" | "error";

const KAKAO_REGION_NAME_MAP: Record<string, Region> = {
  강원도: "강원",
  강원특별자치도: "강원",
  경기도: "경기",
  경상남도: "경남",
  경상북도: "경북",
  광주광역시: "광주",
  대구광역시: "대구",
  대전광역시: "대전",
  부산광역시: "부산",
  서울특별시: "서울",
  세종특별자치시: "세종",
  울산광역시: "울산",
  인천광역시: "인천",
  전라남도: "전남",
  전라북도: "전북",
  전북특별자치도: "전북",
  제주특별자치도: "제주",
  충청남도: "충남",
  충청북도: "충북",
};

type OverlayEntry = {
  button: HTMLButtonElement;
  onClick: () => void;
  overlay: KakaoCustomOverlay;
};

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "위치 권한이 필요합니다.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return "현재 위치를 찾을 수 없습니다.";
  }

  if (error.code === error.TIMEOUT) {
    return "위치 확인 시간이 초과되었습니다.";
  }

  return "위치 확인에 실패했습니다.";
}

function formatAccuracy(accuracy: number | null) {
  if (!accuracy) {
    return "위치 표시됨";
  }

  if (accuracy >= 1000) {
    return `오차 약 ${(accuracy / 1000).toFixed(1)}km`;
  }

  return `오차 약 ${Math.round(accuracy)}m`;
}

function normalizeKakaoRegionName(regionName?: string) {
  if (!regionName) {
    return null;
  }

  return KAKAO_REGION_NAME_MAP[regionName] ?? regionName;
}

function resolveRegionFilterFromCoordinate(location: CurrentLocation) {
  if (!window.kakao?.maps.services) {
    return Promise.resolve<Region | null>(null);
  }

  const services = window.kakao.maps.services;
  const geocoder = new services.Geocoder();

  return new Promise<Region | null>((resolve) => {
    geocoder.coord2RegionCode(location.lng, location.lat, (result, status) => {
      if (status !== services.Status.OK) {
        resolve(null);
        return;
      }

      const administrativeRegion =
        result.find((region) => region.region_type === "H") ?? result[0];
      resolve(normalizeKakaoRegionName(administrativeRegion?.region_1depth_name));
    });
  });
}

export default function MapPanel({
  hospitals,
  initialFocusRegion,
  isHospitalGroupFocused = false,
  isSearchActive = false,
  mapLevel,
  selectedHospitalId,
  selectedRegion,
  onCurrentLocationResolved,
  onMapLevelChange,
  onSelectHospitalGroup,
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
    return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
  }, [kakaoMapJsKey]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const hasAppliedInitialFocusRegionRef = useRef(false);
  const currentLocationOverlayRef = useRef<KakaoCustomOverlay | null>(null);
  const overlaysRef = useRef<OverlayEntry[]>([]);
  const shouldFitBoundsWithCurrentLocationRef = useRef(false);
  const currentLocationForBoundsRef = useRef<CurrentLocation | null>(null);
  const currentLocationRegionRef = useRef<string | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasSdkLoadError, setHasSdkLoadError] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("idle");
  const isAllRegions = selectedRegion === "전체";
  const selectedHospital = useMemo(
    () =>
      hospitals.find((hospital) => hospital.id === selectedHospitalId) ?? null,
    [hospitals, selectedHospitalId],
  );
  const allRegionOverlayGroups = useMemo(
    () => (isAllRegions ? getAllRegionOverlayGroups(hospitals) : []),
    [hospitals, isAllRegions],
  );
  const shouldShowRegionClusters =
    isAllRegions &&
    !isSearchActive &&
    !selectedHospital &&
    !isHospitalGroupFocused &&
    mapLevel > ALL_REGION_MARKER_MAX_LEVEL;
  const regionOverlayGroups = useMemo(
    () => (shouldShowRegionClusters ? allRegionOverlayGroups : []),
    [allRegionOverlayGroups, shouldShowRegionClusters],
  );

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
  }, [isSdkReady, onMapLevelChange, scriptSrc]);

  const setMapLevelSafely = (nextLevel: number) => {
    if (!mapRef.current) {
      return;
    }

    const normalizedLevel = Math.min(
      Math.max(nextLevel, MIN_KAKAO_MAP_LEVEL),
      MAX_KAKAO_MAP_LEVEL,
    );

    mapRef.current.setLevel(normalizedLevel, { animate: true });
    onMapLevelChange(normalizedLevel);
  };

  const handleZoomIn = () => {
    if (!mapRef.current) {
      return;
    }

    setMapLevelSafely(mapRef.current.getLevel() - 1);
  };

  const handleZoomOut = () => {
    if (!mapRef.current) {
      return;
    }

    setMapLevelSafely(mapRef.current.getLevel() + 1);
  };

  const handleCurrentLocationClick = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("브라우저에서 위치 기능을 지원하지 않습니다.");
      return;
    }

    setLocationStatus("locating");
    setLocationMessage("위치를 확인하고 있습니다.");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
          lat: coords.latitude,
          lng: coords.longitude,
        };

        setCurrentLocation(nextLocation);
        setLocationStatus("visible");
        setLocationMessage(formatAccuracy(nextLocation.accuracy));
        shouldFitBoundsWithCurrentLocationRef.current = true;
        currentLocationForBoundsRef.current = nextLocation;

        if (mapRef.current && window.kakao) {
          const position = new window.kakao.maps.LatLng(
            nextLocation.lat,
            nextLocation.lng,
          );
          mapRef.current.setCenter(position);
          mapRef.current.setLevel(
            Math.min(mapRef.current.getLevel(), CURRENT_LOCATION_FOCUS_LEVEL),
            { anchor: position, animate: true },
          );
        }

        void resolveRegionFilterFromCoordinate(nextLocation).then(
          (regionFilter) => {
            currentLocationRegionRef.current = regionFilter;
            onCurrentLocationResolved?.({
              ...nextLocation,
              regionFilter,
            });
            if (regionFilter) {
              setLocationMessage(`${regionFilter} 주변 병원을 표시합니다.`);
            }
          },
        );
      },
      (error) => {
        setLocationStatus("error");
        setLocationMessage(getGeolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      },
    );
  };

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
    if (!currentLocation || selectedRegion === "전체") {
      return;
    }

    const locationRegion = currentLocationRegionRef.current;
    if (locationRegion !== null && selectedRegion !== locationRegion) {
      setCurrentLocation(null);
      setLocationStatus("idle");
      setLocationMessage("");
      currentLocationRegionRef.current = null;
    }
  }, [selectedRegion, currentLocation]);

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

    const locationForBounds = shouldFitBoundsWithCurrentLocationRef.current
      ? currentLocationForBoundsRef.current
      : null;
    const shouldIncludeCurrentLocation = Boolean(locationForBounds);
    const initialFocusHospitals =
      initialFocusRegion && !hasAppliedInitialFocusRegionRef.current
        ? hospitals.filter(
            (hospital) => hospital.regionFilter === initialFocusRegion,
          )
        : [];
    const boundsHospitals =
      initialFocusHospitals.length > 0 && !shouldIncludeCurrentLocation
        ? initialFocusHospitals
        : hospitals;
    const shouldApplyInitialFocus =
      boundsHospitals === initialFocusHospitals &&
      initialFocusHospitals.length > 0;

    if (boundsHospitals.length === 1 && !shouldIncludeCurrentLocation) {
      const [hospital] = boundsHospitals;
      if (shouldApplyInitialFocus) {
        hasAppliedInitialFocusRegionRef.current = true;
      }
      map.setCenter(
        new kakaoMaps.LatLng(
          hospital.mapCoordinate.lat,
          hospital.mapCoordinate.lng,
        ),
      );
      map.setLevel(isAllRegions ? HOSPITAL_FOCUS_SINGLE_LEVEL : 5);
      return;
    }

    const bounds = new kakaoMaps.LatLngBounds();
    boundsHospitals.forEach((hospital) => {
      bounds.extend(
        new kakaoMaps.LatLng(
          hospital.mapCoordinate.lat,
          hospital.mapCoordinate.lng,
        ),
      );
    });

    if (locationForBounds) {
      bounds.extend(
        new kakaoMaps.LatLng(locationForBounds.lat, locationForBounds.lng),
      );
      shouldFitBoundsWithCurrentLocationRef.current = false;
      currentLocationForBoundsRef.current = null;
    }

    if (shouldApplyInitialFocus) {
      hasAppliedInitialFocusRegionRef.current = true;
      const padding = HOSPITAL_FOCUS_BOUNDS_PADDING;
      map.setBounds(bounds, padding, padding, padding, padding);
      return;
    }

    if (isAllRegions) {
      const padding = HOSPITAL_FOCUS_BOUNDS_PADDING;
      map.setBounds(bounds, padding, padding, padding, padding);
      if (!isSearchActive) {
        map.setLevel(
          Math.max(
            map.getLevel() - HOSPITAL_FOCUS_BOUNDS_ZOOM_IN,
            HOSPITAL_FOCUS_BOUNDS_MIN_LEVEL,
          ),
        );
      }
      return;
    }

    const padding = HOSPITAL_FOCUS_BOUNDS_PADDING;
    map.setBounds(bounds, padding, padding, padding, padding);
  }, [hospitals, initialFocusRegion, isAllRegions, isMapReady, isSearchActive]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !window.kakao || !selectedHospital) {
      return;
    }

    const map = mapRef.current;
    const position = new window.kakao.maps.LatLng(
      selectedHospital.mapCoordinate.lat,
      selectedHospital.mapCoordinate.lng,
    );

    map.setCenter(position);

    if (map.getLevel() > HOSPITAL_FOCUS_SINGLE_LEVEL) {
      map.setLevel(HOSPITAL_FOCUS_SINGLE_LEVEL, {
        anchor: position,
        animate: true,
      });
      onMapLevelChange(HOSPITAL_FOCUS_SINGLE_LEVEL);
    }
  }, [isMapReady, onMapLevelChange, selectedHospital]);

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

    if (shouldShowRegionClusters) {
      regionOverlayGroups.forEach((group) => {
        const position = new kakaoMaps.LatLng(
          group.center.lat,
          group.center.lng,
        );
        const button = document.createElement("button");
        const onClick = () => {
          onSelectHospitalGroup(group.id, group.hospitals);

          if (group.hospitals.length === 1) {
            map.setCenter(position);
            map.setLevel(HOSPITAL_FOCUS_SINGLE_LEVEL, {
              anchor: position,
              animate: true,
            });
            return;
          }

          const bounds = new kakaoMaps.LatLngBounds();
          group.hospitals.forEach((hospital) => {
            bounds.extend(
              new kakaoMaps.LatLng(
                hospital.mapCoordinate.lat,
                hospital.mapCoordinate.lng,
              ),
            );
          });

          const padding = HOSPITAL_FOCUS_BOUNDS_PADDING;
          map.setBounds(bounds, padding, padding, padding, padding);
        };

        button.type = "button";
        button.className = styles.kakaoCluster;
        button.textContent = String(group.hospitals.length);
        button.title = group.label;
        button.setAttribute(
          "aria-label",
          `${group.label} ${group.hospitals.length}개 병원 묶음`,
        );
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
      });

      return clearOverlays;
    }

    hospitals.forEach((hospital) => {
      const isActive = hospital.id === selectedHospitalId;
      const position = new kakaoMaps.LatLng(
        hospital.mapCoordinate.lat,
        hospital.mapCoordinate.lng,
      );
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
  }, [
    hospitals,
    isAllRegions,
    isHospitalGroupFocused,
    isMapReady,
    onSelectHospitalGroup,
    onSelectHospital,
    regionOverlayGroups,
    selectedHospitalId,
    shouldShowRegionClusters,
  ]);

  useEffect(() => {
    currentLocationOverlayRef.current?.setMap(null);
    currentLocationOverlayRef.current = null;

    if (!isMapReady || !mapRef.current || !window.kakao || !currentLocation) {
      return;
    }

    const map = mapRef.current;
    const kakaoMaps = window.kakao.maps;
    const marker = document.createElement("div");
    const pulse = document.createElement("span");
    const dot = document.createElement("span");
    const label = document.createElement("span");

    marker.className = styles.currentLocationMarker;
    pulse.className = styles.currentLocationPulse;
    dot.className = styles.currentLocationDot;
    label.className = styles.currentLocationLabel;
    label.textContent = "내 위치";
    marker.append(pulse, dot, label);

    const overlay = new kakaoMaps.CustomOverlay({
      content: marker,
      position: new kakaoMaps.LatLng(currentLocation.lat, currentLocation.lng),
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 4,
    });

    overlay.setMap(map);
    currentLocationOverlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      if (currentLocationOverlayRef.current === overlay) {
        currentLocationOverlayRef.current = null;
      }
    };
  }, [currentLocation, isMapReady]);

  const fallbackMarkers = shouldShowRegionClusters
    ? regionOverlayGroups.map((group) => (
        <button
          key={group.id}
          type="button"
          className={`${styles.regionCluster} ${styles.fallbackRegionCluster}`}
          style={{
            left: `${group.mapPosition.x}%`,
            top: `${group.mapPosition.y}%`,
          }}
          onClick={() => onSelectHospitalGroup(group.id, group.hospitals)}
          aria-label={`${group.label} ${group.hospitals.length}개 병원 묶음`}
          title={group.label}
        >
          {group.hospitals.length}
        </button>
      ))
    : hospitals.map((hospital) => {
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
      <div className={styles.mapControlDock} aria-label="지도 컨트롤">
        <button
          type="button"
          className={`${styles.mapControlButton} ${styles.locationControlButton} ${
            locationStatus === "visible" ? styles.mapControlButtonActive : ""
          }`}
          onClick={handleCurrentLocationClick}
          disabled={!isMapReady || locationStatus === "locating"}
          aria-label="내 위치 지도에 표시"
        >
          <svg
            className={styles.mapControlIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <circle cx="12" cy="12" r="5.5" />
            <circle cx="12" cy="12" r="1.8" />
          </svg>
          <span>{locationStatus === "locating" ? "확인중" : "내위치"}</span>
        </button>
        <div className={styles.zoomControlGroup}>
          <button
            type="button"
            className={styles.zoomControlButton}
            onClick={handleZoomIn}
            disabled={!isMapReady || mapLevel <= MIN_KAKAO_MAP_LEVEL}
            aria-label="지도 확대"
          >
            <svg
              className={styles.zoomControlIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.zoomControlButton}
            onClick={handleZoomOut}
            disabled={!isMapReady || mapLevel >= MAX_KAKAO_MAP_LEVEL}
            aria-label="지도 축소"
          >
            <svg
              className={styles.zoomControlIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
        {locationStatus !== "idle" ? (
          <p
            className={`${styles.locationStatus} ${
              locationStatus === "error" ? styles.locationStatusError : ""
            }`}
          >
            {locationMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

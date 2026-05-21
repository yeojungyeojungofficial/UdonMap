import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchHospitalComments,
  fetchHospitals,
} from "@/src/core/api/hospitals/hospitalsApi";
import { OTHER_REGION_FILTER, REGION_FILTERS } from "@/src/constants/regions";
import type {
  Hospital,
  HospitalComment,
  ReactionSnapshot,
  Region,
} from "@/src/features/hospitals/types";
import { useHospitalMapStore } from "@/src/store/hospitalMapStore";

type CurrentLocationRegionInput = {
  lat: number;
  lng: number;
  regionFilter?: string | null;
};

const EARTH_RADIUS_KM = 6371;
const INITIAL_MAP_FOCUS_REGION: Region = "서울";

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getDistanceKm(
  source: Pick<CurrentLocationRegionInput, "lat" | "lng">,
  target: Pick<CurrentLocationRegionInput, "lat" | "lng">,
) {
  const dLat = toRadians(target.lat - source.lat);
  const dLng = toRadians(target.lng - source.lng);
  const sourceLat = toRadians(source.lat);
  const targetLat = toRadians(target.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(sourceLat) * Math.cos(targetLat) * Math.sin(dLng / 2) ** 2;

  return (
    2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function getNearestHospitalRegion(
  location: CurrentLocationRegionInput,
  hospitals: Hospital[],
  regionOptions: readonly Region[],
) {
  const regionOptionSet = new Set(regionOptions);
  let nearestRegion: Region | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  hospitals.forEach((hospital) => {
    if (!regionOptionSet.has(hospital.regionFilter)) {
      return;
    }

    const distance = getDistanceKm(location, hospital.mapCoordinate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestRegion = hospital.regionFilter;
    }
  });

  return nearestRegion;
}

export function useHospitalDirectory() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [hasHospitalLoadError, setHasHospitalLoadError] = useState(false);
  const mapLevel = useHospitalMapStore((state) => state.mapLevel);
  const query = useHospitalMapStore((state) => state.query);
  const regionSelectionVersion = useHospitalMapStore(
    (state) => state.regionSelectionVersion,
  );
  const selectedRegion = useHospitalMapStore((state) => state.selectedRegion);
  const selectedHospitalId = useHospitalMapStore(
    (state) => state.selectedHospitalId,
  );
  const clearSelectedHospital = useHospitalMapStore(
    (state) => state.clearSelectedHospital,
  );
  const selectHospital = useHospitalMapStore((state) => state.selectHospital);
  const setQuery = useHospitalMapStore((state) => state.setQuery);
  const setMapLevel = useHospitalMapStore((state) => state.setMapLevel);
  const setSelectedRegion = useHospitalMapStore(
    (state) => state.setSelectedRegion,
  );
  const [loadingCommentsHospitalId, setLoadingCommentsHospitalId] = useState<
    string | null
  >(null);
  const [commentLoadError, setCommentLoadError] = useState<{
    hospitalId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHospitals = async () => {
      try {
        const nextHospitals = await fetchHospitals();
        if (!isMounted) return;
        setHospitals(nextHospitals);
        setHasHospitalLoadError(false);
      } catch {
        if (!isMounted) return;
        setHospitals([]);
        setHasHospitalLoadError(true);
      } finally {
        if (isMounted) {
          setIsLoadingHospitals(false);
        }
      }
    };

    void loadHospitals();

    return () => {
      isMounted = false;
    };
  }, []);

  const regionOptions = useMemo<Region[]>(() => {
    const hasOtherRegions = hospitals.some(
      (hospital) => hospital.regionFilter === OTHER_REGION_FILTER,
    );

    return hasOtherRegions
      ? [...REGION_FILTERS, OTHER_REGION_FILTER]
      : [...REGION_FILTERS];
  }, [hospitals]);

  const effectiveSelectedRegion =
    selectedRegion === "전체" || regionOptions.includes(selectedRegion)
      ? selectedRegion
      : "전체";

  const filteredHospitals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      if (
        effectiveSelectedRegion !== "전체" &&
        hospital.regionFilter !== effectiveSelectedRegion
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        hospital.name,
        hospital.address,
        hospital.summary,
        ...hospital.animals,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [effectiveSelectedRegion, hospitals, query]);

  const initialMapFocusRegion =
    regionSelectionVersion === 0 && effectiveSelectedRegion === "전체"
      ? INITIAL_MAP_FOCUS_REGION
      : null;
  const shouldUseAllRegionsMap =
    filteredHospitals.length === 0 && hospitals.length > 0;
  const mapHospitals = shouldUseAllRegionsMap ? hospitals : filteredHospitals;
  const mapSelectedRegion = shouldUseAllRegionsMap
    ? "전체"
    : effectiveSelectedRegion;

  const selectedHospital = useMemo(
    () =>
      filteredHospitals.find((hospital) => hospital.id === selectedHospitalId) ??
      null,
    [filteredHospitals, selectedHospitalId],
  );

  useEffect(() => {
    if (!selectedHospital || selectedHospital.commentsLoaded) {
      return;
    }

    let isMounted = true;
    const hospitalId = selectedHospital.id;

    const loadHospitalComments = async () => {
      setLoadingCommentsHospitalId(hospitalId);
      setCommentLoadError(null);

      try {
        const comments = await fetchHospitalComments(hospitalId);
        if (!isMounted) return;
        setHospitals((currentHospitals) =>
          currentHospitals.map((hospital) =>
            hospital.id === hospitalId
              ? {
                  ...hospital,
                  comments,
                  commentsLoaded: true,
                }
              : hospital,
          ),
        );
      } catch (error) {
        if (!isMounted) return;
        setCommentLoadError({
          hospitalId,
          message:
            error instanceof Error
              ? error.message
              : "댓글을 불러오는 중 알 수 없는 오류가 발생했습니다.",
        });
      } finally {
        if (isMounted) {
          setLoadingCommentsHospitalId(null);
        }
      }
    };

    void loadHospitalComments();

    return () => {
      isMounted = false;
    };
  }, [selectedHospital]);

  const handleSelectHospital = useCallback(
    (hospital: Hospital) => {
      selectHospital(hospital);
    },
    [selectHospital],
  );

  const handleCloseHospital = useCallback(() => {
    clearSelectedHospital();
  }, [clearSelectedHospital]);

  const handleCurrentLocationResolved = useCallback(
    (location: CurrentLocationRegionInput) => {
      const normalizedRegion = location.regionFilter?.trim() ?? "";
      const hasHospitalsInResolvedRegion = hospitals.some(
        (hospital) => hospital.regionFilter === normalizedRegion,
      );
      const nextRegion =
        normalizedRegion &&
        regionOptions.includes(normalizedRegion) &&
        hasHospitalsInResolvedRegion
          ? normalizedRegion
          : getNearestHospitalRegion(location, hospitals, regionOptions);

      if (!nextRegion) {
        return;
      }

      setQuery("");
      setSelectedRegion(nextRegion);
      clearSelectedHospital();
    },
    [clearSelectedHospital, hospitals, regionOptions, setQuery, setSelectedRegion],
  );

  const handleCommentCreated = useCallback(
    (hospitalId: string, comment: HospitalComment) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                comments: [comment, ...hospital.comments],
                reviewCount: hospital.reviewCount + 1,
                commentsLoaded: true,
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleCommentDeleted = useCallback(
    (hospitalId: string, commentId: string) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                comments: hospital.comments.filter(
                  (comment) => comment.id !== commentId,
                ),
                reviewCount: Math.max(0, hospital.reviewCount - 1),
                commentsLoaded: true,
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleHospitalReactionChanged = useCallback(
    (hospitalId: string, reaction: ReactionSnapshot) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                likes: reaction.likes,
                dislikes: reaction.dislikes,
                reaction: reaction.reaction,
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleCommentReactionChanged = useCallback(
    (hospitalId: string, commentId: string, reaction: ReactionSnapshot) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                comments: hospital.comments.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        likes: reaction.likes,
                        dislikes: reaction.dislikes,
                        reaction: reaction.reaction,
                      }
                    : comment,
                ),
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const handleBookmarkChanged = useCallback(
    (hospitalId: string, isBookmarked: boolean) => {
      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === hospitalId
            ? {
                ...hospital,
                isBookmarked,
              }
            : hospital,
        ),
      );
    },
    [],
  );

  const selectedHospitalCommentLoadError =
    commentLoadError && commentLoadError.hospitalId === selectedHospital?.id
      ? commentLoadError.message
      : "";

  return {
    effectiveSelectedRegion,
    filteredHospitals,
    handleBookmarkChanged,
    handleCloseHospital,
    handleCommentCreated,
    handleCommentDeleted,
    handleCommentReactionChanged,
    handleCurrentLocationResolved,
    handleHospitalReactionChanged,
    handleSelectHospital,
    hasHospitalLoadError,
    isLoadingHospitals,
    loadingCommentsHospitalId,
    initialMapFocusRegion,
    mapLevel,
    mapHospitals,
    mapSelectedRegion,
    query,
    regionOptions,
    selectedHospital,
    selectedHospitalCommentLoadError,
    selectedHospitalId,
    setMapLevel,
    setQuery,
    setSelectedRegion,
  };
}

import { ALL_REGION_CLUSTER_GROUPS } from "@/src/constants/regions";
import type { Hospital } from "@/src/features/hospitals/types";

export type HospitalViewScope =
  | { mode: "default" }
  | { mode: "cluster"; groupId: string; hospitalIds: string[] }
  | { mode: "hospital"; hospitalId: string };

export type HospitalOverlayGroup = {
  id: string;
  hospitals: Hospital[];
  center: {
    lat: number;
    lng: number;
  };
};

export type RegionOverlayGroup = HospitalOverlayGroup & {
  label: string;
  mapPosition: {
    x: number;
    y: number;
  };
};

export const DEFAULT_HOSPITAL_VIEW_SCOPE: HospitalViewScope = {
  mode: "default",
};

export function getHospitalsForScope(
  hospitals: Hospital[],
  scope: HospitalViewScope,
) {
  if (scope.mode === "cluster") {
    const hospitalIds = new Set(scope.hospitalIds);
    return hospitals.filter((hospital) => hospitalIds.has(hospital.id));
  }

  if (scope.mode === "hospital") {
    return hospitals.filter((hospital) => hospital.id === scope.hospitalId);
  }

  return hospitals;
}

function getHospitalCenter(hospitals: Hospital[]) {
  const total = hospitals.reduce(
    (accumulator, hospital) => ({
      lat: accumulator.lat + hospital.mapCoordinate.lat,
      lng: accumulator.lng + hospital.mapCoordinate.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: total.lat / hospitals.length,
    lng: total.lng / hospitals.length,
  };
}

function getHospitalMapPositionCenter(hospitals: Hospital[]) {
  const total = hospitals.reduce(
    (accumulator, hospital) => ({
      x: accumulator.x + hospital.mapPosition.x,
      y: accumulator.y + hospital.mapPosition.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / hospitals.length,
    y: total.y / hospitals.length,
  };
}

export function getAllRegionOverlayGroups(hospitals: Hospital[]) {
  const groupedRegionFilters = new Set<string>(
    ALL_REGION_CLUSTER_GROUPS.flatMap((group) => group.regions),
  );

  const regionGroups: RegionOverlayGroup[] = ALL_REGION_CLUSTER_GROUPS.flatMap(
    (group) => {
      const regionFilters = new Set<string>(group.regions);
      const groupHospitals = hospitals.filter((hospital) =>
        regionFilters.has(hospital.regionFilter),
      );

      if (groupHospitals.length === 0) {
        return [];
      }

      return [
        {
          id: group.id,
          label: group.label,
          hospitals: groupHospitals,
          center: getHospitalCenter(groupHospitals),
          mapPosition: getHospitalMapPositionCenter(groupHospitals),
        },
      ];
    },
  );

  const ungroupedHospitals = hospitals.filter(
    (hospital) => !groupedRegionFilters.has(hospital.regionFilter),
  );

  if (ungroupedHospitals.length === 0) {
    return regionGroups;
  }

  return [
    ...regionGroups,
    {
      id: "other",
      label: "기타",
      hospitals: ungroupedHospitals,
      center: getHospitalCenter(ungroupedHospitals),
      mapPosition: getHospitalMapPositionCenter(ungroupedHospitals),
    },
  ];
}

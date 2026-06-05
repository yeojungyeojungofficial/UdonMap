import { create } from "zustand";
import { INITIAL_HOSPITAL_MAP_LEVEL } from "@/src/constants/map";
import {
  DEFAULT_HOSPITAL_VIEW_SCOPE,
  type HospitalViewScope,
} from "@/src/features/hospitals/mapViewScope";
import type { Hospital, Region } from "@/src/features/hospitals/types";

type HospitalMapStore = {
  mapLevel: number;
  mapResetVersion: number;
  query: string;
  regionSelectionVersion: number;
  searchInput: string;
  selectedHospitalId: string | null;
  selectedRegion: Region;
  viewScope: HospitalViewScope;
  clearSelectedHospital: () => void;
  focusHospitalGroup: (groupId: string, hospitals: Hospital[]) => void;
  resetHome: () => void;
  resetSearch: () => void;
  selectHospital: (hospital: Hospital) => void;
  setMapLevel: (mapLevel: number) => void;
  setQuery: (query: string) => void;
  setSearchInput: (searchInput: string) => void;
  setSelectedRegion: (selectedRegion: Region) => void;
};

export const useHospitalMapStore = create<HospitalMapStore>((set) => ({
  mapLevel: INITIAL_HOSPITAL_MAP_LEVEL,
  mapResetVersion: 0,
  query: "",
  regionSelectionVersion: 0,
  searchInput: "",
  selectedHospitalId: null,
  selectedRegion: "전체",
  viewScope: DEFAULT_HOSPITAL_VIEW_SCOPE,
  clearSelectedHospital: () => set({ selectedHospitalId: null }),
  focusHospitalGroup: (groupId, hospitals) =>
    set({
      selectedHospitalId: null,
      viewScope: {
        mode: "cluster",
        groupId,
        hospitalIds: hospitals.map((hospital) => hospital.id),
      },
    }),
  resetHome: () =>
    set((state) => ({
      mapResetVersion: state.mapResetVersion + 1,
      query: "",
      regionSelectionVersion: 0,
      searchInput: "",
      selectedHospitalId: null,
      selectedRegion: "전체",
      viewScope: DEFAULT_HOSPITAL_VIEW_SCOPE,
    })),
  resetSearch: () =>
    set({
      query: "",
      searchInput: "",
      selectedHospitalId: null,
      viewScope: DEFAULT_HOSPITAL_VIEW_SCOPE,
    }),
  selectHospital: (hospital) =>
    set({
      selectedHospitalId: hospital.id,
      viewScope: { mode: "hospital", hospitalId: hospital.id },
    }),
  setMapLevel: (mapLevel) => set({ mapLevel }),
  setQuery: (query) =>
    set({
      query,
      searchInput: query,
      selectedHospitalId: null,
      viewScope: DEFAULT_HOSPITAL_VIEW_SCOPE,
    }),
  setSearchInput: (searchInput) => set({ searchInput }),
  setSelectedRegion: (selectedRegion) =>
    set((state) =>
      state.selectedRegion === selectedRegion
        ? state
        : {
            selectedRegion,
            regionSelectionVersion: state.regionSelectionVersion + 1,
            selectedHospitalId: null,
            viewScope: DEFAULT_HOSPITAL_VIEW_SCOPE,
          },
    ),
}));

import { create } from "zustand";
import { INITIAL_HOSPITAL_MAP_LEVEL } from "@/src/constants/map";
import type { Hospital, Region } from "@/src/features/hospitals/types";

type HospitalMapStore = {
  mapLevel: number;
  query: string;
  regionSelectionVersion: number;
  selectedHospitalId: string | null;
  selectedRegion: Region;
  clearSelectedHospital: () => void;
  selectHospital: (hospital: Hospital) => void;
  setMapLevel: (mapLevel: number) => void;
  setQuery: (query: string) => void;
  setSelectedRegion: (selectedRegion: Region) => void;
};

export const useHospitalMapStore = create<HospitalMapStore>((set) => ({
  mapLevel: INITIAL_HOSPITAL_MAP_LEVEL,
  query: "",
  regionSelectionVersion: 0,
  selectedHospitalId: null,
  selectedRegion: "전체",
  clearSelectedHospital: () => set({ selectedHospitalId: null }),
  selectHospital: (hospital) => set({ selectedHospitalId: hospital.id }),
  setMapLevel: (mapLevel) => set({ mapLevel }),
  setQuery: (query) => set({ query }),
  setSelectedRegion: (selectedRegion) =>
    set((state) =>
      state.selectedRegion === selectedRegion
        ? state
        : {
            selectedRegion,
            regionSelectionVersion: state.regionSelectionVersion + 1,
          },
    ),
}));

import type { HospitalReportStatus } from "@/src/features/hospitals/reports";

export type AuthMode = "login" | "signup";
export type ActivityTab = "reports" | "posts" | "comments";

export type BookmarkedHospital = {
  id: string;
  name: string;
  region: string;
  address: string;
  animals: string[];
  isSpecialty: boolean;
  isEmergency: boolean;
  bookmarkedAt: string;
};

export type MyReport = {
  id: string;
  hospitalName: string;
  address: string;
  animalCategories: string[];
  animalSpecies: string | null;
  details: string | null;
  status: HospitalReportStatus;
  createdAt: string;
  updatedAt: string;
};

export type MyComment = {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalRegion: string;
  hospitalAddress: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type MyPost = {
  id: string;
  board: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

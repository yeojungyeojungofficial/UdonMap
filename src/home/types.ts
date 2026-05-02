export type Region = string;

export type HospitalComment = {
  id: string;
  author: string;
  content: string;
  likes: number;
};

export type Hospital = {
  id: string;
  name: string;
  region: string;
  address: string;
  summary: string;
  likes: number;
  reviewCount: number;
  animals: string[];
  comments: HospitalComment[];
  mapPosition: {
    x: number;
    y: number;
  };
  mapCoordinate: {
    lat: number;
    lng: number;
  };
  phone?: string;
  homepage?: string;
  instagram?: string;
  hours?: string[];
  isEmergency?: boolean;
  isSpecialty?: boolean;
};

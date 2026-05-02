export type Region = "전체" | "서울" | "경기" | "인천" | "부산";

export type HospitalComment = {
  id: string;
  author: string;
  content: string;
  likes: number;
};

export type Hospital = {
  id: string;
  name: string;
  region: Exclude<Region, "전체">;
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
};

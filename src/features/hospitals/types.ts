export type Region = string;

export type ReactionType = "like" | "dislike";

export type ReactionSnapshot = {
  likes: number;
  dislikes: number;
  reaction: ReactionType | null;
};

export type HospitalComment = {
  id: string;
  authorId: string;
  author: string;
  content: string;
  likes: number;
  dislikes: number;
  reaction: ReactionType | null;
  createdAt: string;
};

export type Hospital = {
  id: string;
  name: string;
  region: string;
  regionFilter: string;
  address: string;
  summary: string;
  likes: number;
  dislikes: number;
  reaction: ReactionType | null;
  reviewCount: number;
  animals: string[];
  comments: HospitalComment[];
  commentsLoaded: boolean;
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
  isBookmarked: boolean;
};

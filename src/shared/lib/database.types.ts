export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string;
          input_url: string | null;
          name: string;
          phone: string | null;
          street_address: string;
          region: string;
          latitude: number;
          longitude: number;
          homepage: string | null;
          instagram: string | null;
          specialty: boolean;
          emergency: boolean;
          hours: string[];
          veterinarian_specs: string[];
          veterinarian_schedule: Json | null;
          exotic_animals: string[];
          source_urls: string[];
          kakao: Json | null;
          likes: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          input_url?: string | null;
          name: string;
          phone?: string | null;
          street_address: string;
          region: string;
          latitude: number;
          longitude: number;
          homepage?: string | null;
          instagram?: string | null;
          specialty?: boolean;
          emergency?: boolean;
          hours?: string[];
          veterinarian_specs?: string[];
          veterinarian_schedule?: Json | null;
          exotic_animals?: string[];
          source_urls?: string[];
          kakao?: Json | null;
          likes?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          input_url?: string | null;
          name?: string;
          phone?: string | null;
          street_address?: string;
          region?: string;
          latitude?: number;
          longitude?: number;
          homepage?: string | null;
          instagram?: string | null;
          specialty?: boolean;
          emergency?: boolean;
          hours?: string[];
          veterinarian_specs?: string[];
          veterinarian_schedule?: Json | null;
          exotic_animals?: string[];
          source_urls?: string[];
          kakao?: Json | null;
          likes?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

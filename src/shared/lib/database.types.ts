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
        Relationships: [];
      };
      hospital_reports: {
        Row: {
          id: string;
          hospital_id: string | null;
          hospital_name: string;
          street_address: string;
          animal_categories: string[];
          animal_species: string | null;
          details: string | null;
          attachment_metadata: Json;
          status: "pending" | "in_review" | "approved" | "rejected";
          admin_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id?: string | null;
          hospital_name: string;
          street_address: string;
          animal_categories?: string[];
          animal_species?: string | null;
          details?: string | null;
          attachment_metadata?: Json;
          status?: "pending" | "in_review" | "approved" | "rejected";
          admin_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string | null;
          hospital_name?: string;
          street_address?: string;
          animal_categories?: string[];
          animal_species?: string | null;
          details?: string | null;
          attachment_metadata?: Json;
          status?: "pending" | "in_review" | "approved" | "rejected";
          admin_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospital_reports_hospital_id_fkey";
            columns: ["hospital_id"];
            isOneToOne: false;
            referencedRelation: "hospitals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

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
          dislikes: number;
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
          dislikes?: number;
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
          dislikes?: number;
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
      hospital_comments: {
        Row: {
          id: string;
          hospital_id: string;
          user_id: string;
          author_name: string;
          body: string;
          like_count: number;
          dislike_count: number;
          status: "visible" | "hidden" | "deleted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          user_id: string;
          author_name: string;
          body: string;
          like_count?: number;
          dislike_count?: number;
          status?: "visible" | "hidden" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          user_id?: string;
          author_name?: string;
          body?: string;
          like_count?: number;
          dislike_count?: number;
          status?: "visible" | "hidden" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospital_comments_hospital_id_fkey";
            columns: ["hospital_id"];
            isOneToOne: false;
            referencedRelation: "hospitals";
            referencedColumns: ["id"];
          },
        ];
      };
      hospital_reactions: {
        Row: {
          hospital_id: string;
          user_id: string;
          reaction_type: "like" | "dislike";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          hospital_id: string;
          user_id: string;
          reaction_type: "like" | "dislike";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          hospital_id?: string;
          user_id?: string;
          reaction_type?: "like" | "dislike";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospital_reactions_hospital_id_fkey";
            columns: ["hospital_id"];
            isOneToOne: false;
            referencedRelation: "hospitals";
            referencedColumns: ["id"];
          },
        ];
      };
      hospital_comment_reactions: {
        Row: {
          comment_id: string;
          user_id: string;
          reaction_type: "like" | "dislike";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          reaction_type: "like" | "dislike";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          reaction_type?: "like" | "dislike";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospital_comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "hospital_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_hospital_reaction: {
        Args: {
          p_hospital_id: string;
          p_user_id: string;
          p_reaction_type: "like" | "dislike";
        };
        Returns: {
          likes: number;
          dislikes: number;
          reaction_type: "like" | "dislike" | null;
        }[];
      };
      set_hospital_comment_reaction: {
        Args: {
          p_hospital_id: string;
          p_comment_id: string;
          p_user_id: string;
          p_reaction_type: "like" | "dislike";
        };
        Returns: {
          like_count: number;
          dislike_count: number;
          reaction_type: "like" | "dislike" | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

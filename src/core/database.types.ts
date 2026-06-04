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
      map_popups: {
        Row: {
          id: string;
          title: string;
          body: string;
          popup_type: "notice" | "update" | "maintenance";
          placement: "home" | "map" | "all";
          link_url: string | null;
          link_label: string | null;
          image_url: string | null;
          priority: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          dismiss_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          popup_type?: "notice" | "update" | "maintenance";
          placement?: "home" | "map" | "all";
          link_url?: string | null;
          link_label?: string | null;
          image_url?: string | null;
          priority?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          dismiss_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          popup_type?: "notice" | "update" | "maintenance";
          placement?: "home" | "map" | "all";
          link_url?: string | null;
          link_label?: string | null;
          image_url?: string | null;
          priority?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          dismiss_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hospitals: {
        Row: {
          id: string;
          input_url: string | null;
          name: string;
          phone: string | null;
          street_address: string;
          region: string;
          region_filter: string;
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
          region_filter?: string;
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
          region_filter?: string;
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
          user_id: string | null;
          hospital_id: string | null;
          hospital_name: string;
          street_address: string;
          animal_categories: string[];
          animal_species: string | null;
          contact_info: string | null;
          details: string | null;
          attachment_metadata: Json;
          marketing_consent: boolean;
          reporter_email: string | null;
          status: "pending" | "in_review" | "approved" | "rejected";
          admin_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          hospital_id?: string | null;
          hospital_name: string;
          street_address: string;
          animal_categories?: string[];
          animal_species?: string | null;
          contact_info?: string | null;
          details?: string | null;
          attachment_metadata?: Json;
          marketing_consent?: boolean;
          reporter_email?: string | null;
          status?: "pending" | "in_review" | "approved" | "rejected";
          admin_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          hospital_id?: string | null;
          hospital_name?: string;
          street_address?: string;
          animal_categories?: string[];
          animal_species?: string | null;
          contact_info?: string | null;
          details?: string | null;
          attachment_metadata?: Json;
          marketing_consent?: boolean;
          reporter_email?: string | null;
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
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_reason: string | null;
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
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_reason?: string | null;
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
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_reason?: string | null;
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
      hospital_bookmarks: {
        Row: {
          hospital_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          hospital_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          hospital_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hospital_bookmarks_hospital_id_fkey";
            columns: ["hospital_id"];
            isOneToOne: false;
            referencedRelation: "hospitals";
            referencedColumns: ["id"];
          },
        ];
      };
      comment_moderation_actions: {
        Row: {
          id: string;
          comment_id: string;
          target_user_id: string;
          admin_id: string | null;
          action: "delete" | "restore";
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          target_user_id: string;
          admin_id?: string | null;
          action: "delete" | "restore";
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          target_user_id?: string;
          admin_id?: string | null;
          action?: "delete" | "restore";
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_moderation_actions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "hospital_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      user_suspensions: {
        Row: {
          id: string;
          user_id: string;
          duration: "3d" | "7d" | "permanent";
          reason: string | null;
          starts_at: string;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration: "3d" | "7d" | "permanent";
          reason?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration?: "3d" | "7d" | "permanent";
          reason?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoke_reason?: string | null;
        };
        Relationships: [];
      };
      board_post_comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string | null;
          author_name: string;
          body: string;
          like_count: number;
          dislike_count: number;
          status: "visible" | "hidden" | "deleted";
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string | null;
          author_name: string;
          body: string;
          like_count?: number;
          dislike_count?: number;
          status?: "visible" | "hidden" | "deleted";
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string | null;
          author_name?: string;
          body?: string;
          like_count?: number;
          dislike_count?: number;
          status?: "visible" | "hidden" | "deleted";
          deleted_at?: string | null;
          deleted_by?: string | null;
          deleted_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_posts: {
        Row: {
          id: string;
          user_id: string | null;
          board: "병원후기 게시판" | "자유게시판" | "꿀팁 게시판";
          filter_tag: string | null;
          title: string;
          body: string;
          comment_count: number;
          view_count: number;
          status: "visible" | "hidden" | "deleted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          board: "병원후기 게시판" | "자유게시판" | "꿀팁 게시판";
          filter_tag?: string | null;
          title: string;
          body?: string;
          comment_count?: number;
          view_count?: number;
          status?: "visible" | "hidden" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          board?: "병원후기 게시판" | "자유게시판" | "꿀팁 게시판";
          filter_tag?: string | null;
          title?: string;
          body?: string;
          comment_count?: number;
          view_count?: number;
          status?: "visible" | "hidden" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_post_reports: {
        Row: {
          id: string;
          post_id: string;
          reporter_id: string | null;
          reason: string | null;
          status: "pending" | "reviewed" | "dismissed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          reporter_id?: string | null;
          reason?: string | null;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          reporter_id?: string | null;
          reason?: string | null;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_post_comment_reports: {
        Row: {
          id: string;
          comment_id: string;
          post_id: string;
          reporter_id: string | null;
          reason: string | null;
          status: "pending" | "reviewed" | "dismissed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          post_id: string;
          reporter_id?: string | null;
          reason?: string | null;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          post_id?: string;
          reporter_id?: string | null;
          reason?: string | null;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          privacy_policy_agreed: boolean;
          privacy_policy_agreed_at: string | null;
          privacy_policy_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          privacy_policy_agreed?: boolean;
          privacy_policy_agreed_at?: string | null;
          privacy_policy_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          privacy_policy_agreed?: boolean;
          privacy_policy_agreed_at?: string | null;
          privacy_policy_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_delete_board_post_comment: {
        Args: {
          p_comment_id: string;
          p_admin_id?: string | null;
          p_reason?: string | null;
        };
        Returns: {
          comment_id: string;
          user_id: string;
          status: "visible" | "hidden" | "deleted";
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_reason: string | null;
        }[];
      };
      admin_list_board_posts: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_board?: string | null;
          p_status?: "visible" | "hidden" | "deleted" | null;
          p_search?: string | null;
        };
        Returns: {
          post_id: string;
          board: string;
          filter_tag: string | null;
          title: string;
          body: string;
          comment_count: number;
          user_id: string | null;
          user_email: string | null;
          user_display_name: string | null;
          status: "visible" | "hidden" | "deleted";
          created_at: string;
          updated_at: string;
          total_count: number;
        }[];
      };
      admin_list_board_post_comments: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_post_id?: string | null;
          p_status?: "visible" | "hidden" | "deleted" | null;
          p_search?: string | null;
        };
        Returns: {
          comment_id: string;
          post_id: string;
          post_title: string;
          post_board: string;
          user_id: string | null;
          user_email: string | null;
          user_display_name: string | null;
          author_name: string;
          body: string;
          like_count: number;
          dislike_count: number;
          status: "visible" | "hidden" | "deleted";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_reason: string | null;
          total_count: number;
        }[];
      };
      admin_list_board_reports: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_status?: "pending" | "reviewed" | "dismissed" | null;
          p_search?: string | null;
        };
        Returns: {
          report_id: string;
          report_type: "post" | "comment";
          target_id: string;
          post_id: string;
          comment_id: string | null;
          target_user_id: string | null;
          target_user_email: string | null;
          target_user_display_name: string | null;
          reporter_id: string | null;
          reporter_email: string | null;
          reporter_display_name: string | null;
          reason: string | null;
          report_status: "pending" | "reviewed" | "dismissed";
          target_status: "visible" | "hidden" | "deleted";
          board: string;
          filter_tag: string | null;
          post_title: string;
          content: string;
          created_at: string;
          updated_at: string;
          total_count: number;
        }[];
      };
      admin_restore_board_post_comment: {
        Args: {
          p_comment_id: string;
          p_admin_id?: string | null;
          p_reason?: string | null;
        };
        Returns: {
          comment_id: string;
          user_id: string;
          status: "visible" | "hidden" | "deleted";
        }[];
      };
      admin_update_board_post_status: {
        Args: {
          p_post_id: string;
          p_status: "visible" | "hidden" | "deleted";
          p_admin_id?: string | null;
        };
        Returns: {
          post_id: string;
          user_id: string | null;
          status: "visible" | "hidden" | "deleted";
          updated_at: string;
        }[];
      };
      admin_update_board_report_status: {
        Args: {
          p_report_id: string;
          p_report_type: "post" | "comment";
          p_status: "pending" | "reviewed" | "dismissed";
        };
        Returns: {
          report_id: string;
          report_type: "post" | "comment";
          status: "pending" | "reviewed" | "dismissed";
          updated_at: string;
        }[];
      };
      admin_delete_hospital_comment: {
        Args: {
          p_comment_id: string;
          p_admin_id?: string | null;
          p_reason?: string | null;
        };
        Returns: {
          comment_id: string;
          user_id: string;
          status: "visible" | "hidden" | "deleted";
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_reason: string | null;
        }[];
      };
      admin_list_hospital_comments: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_user_id?: string | null;
          p_hospital_id?: string | null;
          p_status?: "visible" | "hidden" | "deleted" | null;
          p_search?: string | null;
        };
        Returns: {
          comment_id: string;
          hospital_id: string;
          hospital_name: string;
          user_id: string;
          user_email: string | null;
          user_display_name: string | null;
          author_name: string;
          body: string;
          like_count: number;
          dislike_count: number;
          status: "visible" | "hidden" | "deleted";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          deleted_reason: string | null;
          total_count: number;
        }[];
      };
      admin_list_user_suspensions: {
        Args: {
          p_page?: number;
          p_page_size?: number;
          p_user_id?: string | null;
          p_include_inactive?: boolean;
          p_search?: string | null;
        };
        Returns: {
          suspension_id: string;
          user_id: string;
          user_email: string | null;
          user_display_name: string | null;
          duration: "3d" | "7d" | "permanent";
          reason: string | null;
          starts_at: string;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
          revoked_at: string | null;
          revoked_by: string | null;
          revoke_reason: string | null;
          is_active: boolean;
          total_count: number;
        }[];
      };
      admin_restore_hospital_comment: {
        Args: {
          p_comment_id: string;
          p_admin_id?: string | null;
          p_reason?: string | null;
        };
        Returns: {
          comment_id: string;
          user_id: string;
          status: "visible" | "hidden" | "deleted";
        }[];
      };
      admin_revoke_user_suspension: {
        Args: {
          p_suspension_id: string;
          p_admin_id?: string | null;
          p_reason?: string | null;
        };
        Returns: {
          suspension_id: string;
          user_id: string;
          revoked_at: string;
          revoked_by: string | null;
          revoke_reason: string | null;
        }[];
      };
      admin_suspend_user: {
        Args: {
          p_user_id: string;
          p_duration: "3d" | "7d" | "permanent";
          p_admin_id?: string | null;
          p_reason?: string | null;
        };
        Returns: {
          suspension_id: string;
          user_id: string;
          duration: "3d" | "7d" | "permanent";
          starts_at: string;
          ends_at: string | null;
          reason: string | null;
        }[];
      };
      get_user_active_suspension: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          suspension_id: string;
          user_id: string;
          duration: "3d" | "7d" | "permanent";
          reason: string | null;
          starts_at: string;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
        }[];
      };
      increment_board_post_view_count: {
        Args: {
          p_post_id: string;
          p_user_id?: string | null;
        };
        Returns: {
          id: string;
          user_id: string | null;
          board: "병원후기 게시판" | "자유게시판" | "꿀팁 게시판";
          filter_tag: string | null;
          title: string;
          body: string;
          comment_count: number;
          view_count: number;
          status: "visible" | "hidden" | "deleted";
          created_at: string;
          updated_at: string;
        }[];
      };
      is_user_currently_suspended: {
        Args: {
          p_user_id: string;
        };
        Returns: boolean;
      };
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

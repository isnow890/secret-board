export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null;
          file_size: number;
          file_type: string;
          filename: string;
          id: string;
          is_image: boolean | null;
          original_name: string;
          post_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string | null;
          file_size: number;
          file_type: string;
          filename: string;
          id?: string;
          is_image?: boolean | null;
          original_name: string;
          post_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string | null;
          file_size?: number;
          file_type?: string;
          filename?: string;
          id?: string;
          is_image?: boolean | null;
          original_name?: string;
          post_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          content: string;
          created_at: string | null;
          deleted_at: string | null;
          depth: number | null;
          id: string;
          is_author: boolean | null;
          is_deleted: boolean | null;
          like_count: number | null;
          nickname: string;
          parent_id: string | null;
          password_hash: string;
          post_id: string;
          reply_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          deleted_at?: string | null;
          depth?: number | null;
          id?: string;
          is_author?: boolean | null;
          is_deleted?: boolean | null;
          like_count?: number | null;
          nickname?: string;
          parent_id?: string | null;
          password_hash: string;
          post_id: string;
          reply_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          depth?: number | null;
          id?: string;
          is_author?: boolean | null;
          is_deleted?: boolean | null;
          like_count?: number | null;
          nickname?: string;
          parent_id?: string | null;
          password_hash?: string;
          post_id?: string;
          reply_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          ai_summary: string | null;
          attached_files: Json | null;
          attachment_count: number | null;
          comment_count: number | null;
          content: string;
          created_at: string | null;
          deleted_at: string | null;
          has_attachments: boolean | null;
          id: string;
          is_deleted: boolean | null;
          last_comment_at: string | null;
          like_count: number | null;
          nickname: string;
          password_hash: string;
          plain_text: string | null;
          preview: string | null;
          summary_generated_at: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          ai_summary?: string | null;
          attached_files?: Json | null;
          attachment_count?: number | null;
          comment_count?: number | null;
          content: string;
          created_at?: string | null;
          deleted_at?: string | null;
          has_attachments?: boolean | null;
          id?: string;
          is_deleted?: boolean | null;
          last_comment_at?: string | null;
          like_count?: number | null;
          nickname?: string;
          password_hash: string;
          plain_text?: string | null;
          preview?: string | null;
          summary_generated_at?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          ai_summary?: string | null;
          attached_files?: Json | null;
          attachment_count?: number | null;
          comment_count?: number | null;
          content?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          has_attachments?: boolean | null;
          id?: string;
          is_deleted?: boolean | null;
          last_comment_at?: string | null;
          like_count?: number | null;
          nickname?: string;
          password_hash?: string;
          plain_text?: string | null;
          preview?: string | null;
          summary_generated_at?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

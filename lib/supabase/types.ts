export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          display_name: string | null;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          created_at: string;
          diff: Json | null;
          entity_id: string | null;
          entity_type: string;
          id: number;
          ip_address: unknown;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type: string;
          id?: number;
          ip_address?: unknown;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: number;
          ip_address?: unknown;
          user_id?: string | null;
        };
        Relationships: [];
      };
      catalog_requests: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          ip_address: unknown;
          locale: string;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          ip_address?: unknown;
          locale: string;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          ip_address?: unknown;
          locale?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          active: boolean;
          created_at: string;
          display_name: Json | null;
          display_order: number;
          id: string;
          key: string;
          logo_path: string;
          sector_id: string | null;
          sector_key: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          display_name?: Json | null;
          display_order?: number;
          id?: string;
          key: string;
          logo_path: string;
          sector_id?: string | null;
          sector_key: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          display_name?: Json | null;
          display_order?: number;
          id?: string;
          key?: string;
          logo_path?: string;
          sector_id?: string | null;
          sector_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_recipients: {
        Row: {
          active: boolean;
          created_at: string;
          email: string;
          id: string;
          rfq_types: Database["public"]["Enums"]["rfq_type"][];
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          email: string;
          id?: string;
          rfq_types: Database["public"]["Enums"]["rfq_type"][];
        };
        Update: {
          active?: boolean;
          created_at?: string;
          email?: string;
          id?: string;
          rfq_types?: Database["public"]["Enums"]["rfq_type"][];
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: boolean;
          code: string | null;
          created_at: string;
          description: Json | null;
          display_order: number;
          id: string;
          images: Json | null;
          name: Json;
          sector_id: string | null;
          slug: string;
          specs: Json | null;
          updated_at: string;
          variants: Json | null;
        };
        Insert: {
          active?: boolean;
          code?: string | null;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          id?: string;
          images?: Json | null;
          name: Json;
          sector_id?: string | null;
          slug: string;
          specs?: Json | null;
          updated_at?: string;
          variants?: Json | null;
        };
        Update: {
          active?: boolean;
          code?: string | null;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          id?: string;
          images?: Json | null;
          name?: Json;
          sector_id?: string | null;
          slug?: string;
          specs?: Json | null;
          updated_at?: string;
          variants?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      sectors: {
        Row: {
          active: boolean;
          created_at: string;
          description: Json | null;
          display_order: number;
          hero_color: string | null;
          hero_image: Json | null;
          id: string;
          long_description: Json | null;
          meta_description: Json | null;
          meta_title: Json | null;
          name: Json;
          slug: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          hero_color?: string | null;
          hero_image?: Json | null;
          id?: string;
          long_description?: Json | null;
          meta_description?: Json | null;
          meta_title?: Json | null;
          name: Json;
          slug: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          hero_color?: string | null;
          hero_image?: Json | null;
          id?: string;
          long_description?: Json | null;
          meta_description?: Json | null;
          meta_title?: Json | null;
          name?: Json;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean } | { Args: { uid: string }; Returns: boolean };
      is_admin_role:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean };
      swap_client_display_order: {
        Args: { a_id: string; b_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      admin_role: "admin" | "sales" | "viewer";
      rfq_status: "new" | "reviewing" | "quoted" | "won" | "lost" | "archived";
      rfq_type: "custom" | "standart";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
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
    : never = never,
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
    : never = never,
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ["admin", "sales", "viewer"],
      rfq_status: ["new", "reviewing", "quoted", "won", "lost", "archived"],
      rfq_type: ["custom", "standart"],
    },
  },
} as const;

// lib/supabase/types.ts
// Hand-written to match supabase/migrations/*. When the remote Supabase project
// is linked, run `supabase gen types typescript --linked > lib/supabase/types.ts`
// to replace with the canonical generated version.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      sectors: {
        Row: {
          id: string;
          slug: string;
          name: Json;
          description: Json | null;
          hero_color: string | null;
          display_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: Json;
          description?: Json | null;
          hero_color?: string | null;
          display_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: Json;
          description?: Json | null;
          hero_color?: string | null;
          display_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          key: string;
          logo_path: string;
          sector_key: string;
          display_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          logo_path: string;
          sector_key: string;
          display_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          logo_path?: string;
          sector_key?: string;
          display_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: Json;
          description: Json | null;
          sector_id: string | null;
          images: Json | null;
          specs: Json | null;
          variants: Json | null;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: Json;
          description?: Json | null;
          sector_id?: string | null;
          images?: Json | null;
          specs?: Json | null;
          variants?: Json | null;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: Json;
          description?: Json | null;
          sector_id?: string | null;
          images?: Json | null;
          specs?: Json | null;
          variants?: Json | null;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rfqs: {
        Row: {
          id: string;
          type: Database["public"]["Enums"]["rfq_type"];
          status: Database["public"]["Enums"]["rfq_status"];
          locale: string;
          contact: Json;
          payload: Json;
          attachments: Json;
          internal_notes: string | null;
          assigned_to: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: Database["public"]["Enums"]["rfq_type"];
          status?: Database["public"]["Enums"]["rfq_status"];
          locale: string;
          contact: Json;
          payload: Json;
          attachments?: Json;
          internal_notes?: string | null;
          assigned_to?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database["public"]["Enums"]["rfq_type"];
          status?: Database["public"]["Enums"]["rfq_status"];
          locale?: string;
          contact?: Json;
          payload?: Json;
          attachments?: Json;
          internal_notes?: string | null;
          assigned_to?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          role: Database["public"]["Enums"]["admin_role"];
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: Database["public"]["Enums"]["admin_role"];
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_recipients: {
        Row: {
          id: string;
          email: string;
          rfq_types: Database["public"]["Enums"]["rfq_type"][];
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          rfq_types: Database["public"]["Enums"]["rfq_type"][];
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          rfq_types?: Database["public"]["Enums"]["rfq_type"][];
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          diff: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          diff?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          diff?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: { uid: string }; Returns: boolean };
      is_admin_role: { Args: { uid: string }; Returns: boolean };
    };
    Enums: {
      rfq_type: "custom" | "standart";
      rfq_status: "new" | "reviewing" | "quoted" | "won" | "lost" | "archived";
      admin_role: "admin" | "sales" | "viewer";
    };
    CompositeTypes: Record<string, never>;
  };
};

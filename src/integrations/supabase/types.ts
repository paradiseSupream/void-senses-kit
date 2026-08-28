export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      ad_events: {
        Row: {
          ad_click_id: string | null
          ad_platform: string | null
          click_id: string | null
          country: string | null
          created_at: string
          device: string | null
          duration_ms: number | null
          event_type: string
          format: string | null
          id: number
          ip_hash: string | null
          is_vip: boolean
          metric_value: number | null
          path: string | null
          referrer: string | null
          revenue_cents: number
          session_id: string
          slot: string
          suspect: boolean
          tool_slug: string | null
          ua_hash: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          variant: string
          zone: string | null
        }
        Insert: {
          ad_click_id?: string | null
          ad_platform?: string | null
          click_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          duration_ms?: number | null
          event_type: string
          format?: string | null
          id?: number
          ip_hash?: string | null
          is_vip?: boolean
          metric_value?: number | null
          path?: string | null
          referrer?: string | null
          revenue_cents?: number
          session_id: string
          slot: string
          suspect?: boolean
          tool_slug?: string | null
          ua_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string
          zone?: string | null
        }
        Update: {
          ad_click_id?: string | null
          ad_platform?: string | null
          click_id?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          duration_ms?: number | null
          event_type?: string
          format?: string | null
          id?: number
          ip_hash?: string | null
          is_vip?: boolean
          metric_value?: number | null
          path?: string | null
          referrer?: string | null
          revenue_cents?: number
          session_id?: string
          slot?: string
          suspect?: boolean
          tool_slug?: string | null
          ua_hash?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          variant?: string
          zone?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          active: boolean
          code: string
          commission_pct: number
          contact: string | null
          created_at: string
          id: string
          name: string
          payout_notes: string | null
        }
        Insert: {
          active?: boolean
          code: string
          commission_pct?: number
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          payout_notes?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          commission_pct?: number
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          payout_notes?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      email_leads: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          session_id: string | null
          source: string
          tool_slug: string | null
          utm_source: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          session_id?: string | null
          source?: string
          tool_slug?: string | null
          utm_source?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          session_id?: string | null
          source?: string
          tool_slug?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      norm_samples: {
        Row: {
          created_at: string
          dim: string
          id: string
          tool: string
          value: number
        }
        Insert: {
          created_at?: string
          dim: string
          id?: string
          tool: string
          value: number
        }
        Update: {
          created_at?: string
          dim?: string
          id?: string
          tool?: string
          value?: number
        }
        Relationships: []
      }
      roast_requests: {
        Row: {
          id: string
          ip_hash: string
          last_request: string
          request_count: number
        }
        Insert: {
          id?: string
          ip_hash: string
          last_request?: string
          request_count?: number
        }
        Update: {
          id?: string
          ip_hash?: string
          last_request?: string
          request_count?: number
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          channel: string
          created_at: string
          detail: string | null
          event: string
          event_id: string | null
          id: number
          ok: boolean
          source: string
          status: number | null
        }
        Insert: {
          channel: string
          created_at?: string
          detail?: string | null
          event: string
          event_id?: string | null
          id?: number
          ok?: boolean
          source?: string
          status?: number | null
        }
        Update: {
          channel?: string
          created_at?: string
          detail?: string | null
          event?: string
          event_id?: string | null
          id?: number
          ok?: boolean
          source?: string
          status?: number | null
        }
        Relationships: []
      }
      vault_assets: {
        Row: {
          category: string
          created_at: string
          description: string
          download_count: number
          drive_link: string
          id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          download_count?: number
          drive_link: string
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          download_count?: number
          drive_link?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      vip_members: {
        Row: {
          active: boolean
          amount_cents: number
          created_at: string
          email: string
          expires_at: string | null
          id: string
          license_key: string
          payment_ref: string | null
          plan: string
          provider: string
          source: string
          wallet: string | null
        }
        Insert: {
          active?: boolean
          amount_cents?: number
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          license_key?: string
          payment_ref?: string | null
          plan?: string
          provider?: string
          source?: string
          wallet?: string | null
        }
        Update: {
          active?: boolean
          amount_cents?: number
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          license_key?: string
          payment_ref?: string | null
          plan?: string
          provider?: string
          source?: string
          wallet?: string | null
        }
        Relationships: []
      }
      vip_orders: {
        Row: {
          amount_cents: number
          checkout_id: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          order_id: string
          paid_at: string | null
          payment_id: string | null
          plan: string
          provider: string
          session_id: string | null
          status: string
          utm_source: string | null
          whop_plan_id: string | null
        }
        Insert: {
          amount_cents?: number
          checkout_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payment_id?: string | null
          plan?: string
          provider?: string
          session_id?: string | null
          status?: string
          utm_source?: string | null
          whop_plan_id?: string | null
        }
        Update: {
          amount_cents?: number
          checkout_id?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_id?: string | null
          plan?: string
          provider?: string
          session_id?: string | null
          status?: string
          utm_source?: string | null
          whop_plan_id?: string | null
        }
        Relationships: []
      }
      vip_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          created_at: string
          id: string
          payload: Json
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      norm_stats: {
        Args: { _tool: string }
        Returns: {
          dim: string
          mean: number
          n: number
          sd: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

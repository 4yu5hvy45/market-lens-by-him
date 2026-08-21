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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      calls: {
        Row: {
          call_number: number
          catalysts: Json
          change_pct: number
          chart_image: string | null
          checkout_headline: string
          checkout_subtext: string
          closed_at: string | null
          confidence: number
          coverage: string
          created_at: string
          current_price: number | null
          direction: Database["public"]["Enums"]["call_direction"]
          entry: number | null
          exchange: string
          exit_price: number | null
          id: string
          price_inr: number
          published_at: string | null
          research: Json
          realised_pnl_pct_override: number | null
          sector: string
          segment: string
          series: Json
          state: Database["public"]["Enums"]["call_state"]
          stock_name: string | null
          stop_loss: number | null
          summary: string
          target: number | null
          term: string
          ticker: string | null
          timeframe: string | null
          updated_at: string
          view_text: string | null
        }
        Insert: {
          call_number: number
          catalysts?: Json
          change_pct?: number
          chart_image?: string | null
          checkout_headline?: string
          checkout_subtext?: string
          closed_at?: string | null
          confidence?: number
          coverage?: string
          created_at?: string
          current_price: number | null
          direction?: Database["public"]["Enums"]["call_direction"]
          entry: number | null
          exchange?: string
          exit_price?: number | null
          id?: string
          price_inr?: number
          published_at?: string | null
          research?: Json
          realised_pnl_pct_override?: number | null
          sector?: string
          segment?: string
          series?: Json
          state?: Database["public"]["Enums"]["call_state"]
          stock_name: string | null
          stop_loss: number | null
          summary?: string
          target: number | null
          term?: string
          ticker: string | null
          timeframe?: string
          updated_at?: string
          view_text?: string
        }
        Update: {
          call_number?: number
          catalysts?: Json
          change_pct?: number
          chart_image?: string | null
          checkout_headline?: string
          checkout_subtext?: string
          closed_at?: string | null
          confidence?: number
          coverage?: string
          created_at?: string
          current_price?: number
          direction?: Database["public"]["Enums"]["call_direction"]
          entry?: number
          exchange?: string
          exit_price?: number | null
          id?: string
          price_inr?: number
          published_at?: string | null
          research?: Json
          realised_pnl_pct_override?: number | null
          sector?: string
          segment?: string
          series?: Json
          state?: Database["public"]["Enums"]["call_state"]
          stock_name?: string
          stop_loss?: number
          summary?: string
          target?: number
          term?: string
          ticker?: string
          timeframe?: string
          updated_at?: string
          view_text?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          access_token: string
          amount: number
          call_id: string
          created_at: string
          currency: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          paid_at: string | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["purchase_status"]
          updated_at: string
        }
        Insert: {
          access_token?: string
          amount: number
          call_id: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          paid_at?: string | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string
        }
        Update: {
          access_token?: string
          amount?: number
          call_id?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          paid_at?: string | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls_public"
            referencedColumns: ["id"]
          },
        ]
      }
      research_posts: {
        Row: {
          body: string
          category: string
          chart_caption: string
          chart_image: string | null
          created_at: string
          featured: boolean
          id: string
          published_at: string | null
          slug: string
          state: string
          summary: string
          tags: Json
          title: string
          updated_at: string
          week_label: string
        }
        Insert: {
          body?: string
          category?: string
          chart_caption?: string
          chart_image?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          published_at?: string | null
          slug: string
          state?: string
          summary?: string
          tags?: Json
          title: string
          updated_at?: string
          week_label?: string
        }
        Update: {
          body?: string
          category?: string
          chart_caption?: string
          chart_image?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          published_at?: string | null
          slug?: string
          state?: string
          summary?: string
          tags?: Json
          title?: string
          updated_at?: string
          week_label?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          note: string
          sort_order: number
          symbol: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          note?: string
          sort_order?: number
          symbol: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          note?: string
          sort_order?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      calls_public: {
        Row: {
          call_number: number | null
          catalysts: Json | null
          change_pct: number | null
          chart_image: string | null
          checkout_headline: string | null
          checkout_subtext: string | null
          closed_at: string | null
          confidence: number | null
          coverage: string | null
          current_price: number | null
          direction: Database["public"]["Enums"]["call_direction"] | null
          entry: number | null
          exchange: string | null
          exit_price: number | null
          realised_pnl_pct_override: number | null
          id: string | null
          potential_pct: number | null
          price_inr: number | null
          published_at: string | null
          research: Json | null
          risk_pct: number | null
          sector: string | null
          segment: string | null
          series: Json | null
          state: Database["public"]["Enums"]["call_state"] | null
          stock_name: string | null
          stop_loss: number | null
          summary: string | null
          target: number | null
          term: string | null
          ticker: string | null
          timeframe: string | null
          view_text: string | null
        }
        Insert: {
          call_number?: number | null
          catalysts?: never
          change_pct?: never
          chart_image?: never
          checkout_headline?: never
          checkout_subtext?: never
          closed_at?: string | null
          confidence?: number | null
          coverage?: string | null
          current_price?: never
          direction?: Database["public"]["Enums"]["call_direction"] | null
          entry?: never
          exchange?: never
          exit_price?: never
          id?: string | null
          potential_pct?: never
          price_inr?: number | null
          published_at?: string | null
          research?: never
          risk_pct?: never
          sector?: string | null
          segment?: string | null
          series?: Json | null
          state?: Database["public"]["Enums"]["call_state"] | null
          stock_name?: never
          stop_loss?: never
          summary?: never
          target?: never
          term?: string | null
          ticker?: never
          timeframe?: string | null
          view_text?: never
        }
        Update: {
          call_number?: number | null
          catalysts?: never
          change_pct?: never
          chart_image?: never
          checkout_headline?: never
          checkout_subtext?: never
          closed_at?: string | null
          confidence?: number | null
          coverage?: string | null
          current_price?: never
          direction?: Database["public"]["Enums"]["call_direction"] | null
          entry?: never
          exchange?: never
          exit_price?: never
          id?: string | null
          potential_pct?: never
          price_inr?: number | null
          published_at?: string | null
          research?: never
          risk_pct?: never
          sector?: string | null
          segment?: string | null
          series?: Json | null
          state?: Database["public"]["Enums"]["call_state"] | null
          stock_name?: never
          stop_loss?: never
          summary?: never
          target?: never
          term?: string | null
          ticker?: never
          timeframe?: string | null
          view_text?: never
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
      call_direction: "long" | "short"
      call_state: "draft" | "live" | "closed" | "archived"
      purchase_status: "created" | "paid" | "failed" | "refunded"
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
    Enums: {
      app_role: ["admin"],
      call_direction: ["long", "short"],
      call_state: ["draft", "live", "closed", "archived"],
      purchase_status: ["created", "paid", "failed", "refunded"],
    },
  },
} as const

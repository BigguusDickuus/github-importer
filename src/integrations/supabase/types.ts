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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      credit_balances: {
        Row: {
          balance: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          currency: string
          id: string
          name: string
          price_cents: number
          slug: string
          stripe_price_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits: number
          currency?: string
          id?: string
          name: string
          price_cents: number
          slug: string
          stripe_price_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          name?: string
          price_cents?: number
          slug?: string
          stripe_price_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount_cents: number | null
          created_at: string
          credits_change: number
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["credit_tx_status"]
          stripe_session_id: string | null
          tx_type: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          credits_change: number
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["credit_tx_status"]
          stripe_session_id?: string | null
          tx_type: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          credits_change?: number
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["credit_tx_status"]
          stripe_session_id?: string | null
          tx_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birthday: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          keep_context: boolean
          phone: string | null
          usage_limit_credits: number | null
          usage_limit_period: string | null
        }
        Insert: {
          birthday?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          keep_context?: boolean
          phone?: string | null
          usage_limit_credits?: number | null
          usage_limit_period?: string | null
        }
        Update: {
          birthday?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          keep_context?: boolean
          phone?: string | null
          usage_limit_credits?: number | null
          usage_limit_period?: string | null
        }
        Relationships: []
      }
      readings: {
        Row: {
          completed_at: string | null
          completion_tokens: number | null
          created_at: string | null
          id: string
          model: string | null
          oracle_types: Database["public"]["Enums"]["oracle_type"][]
          oracles: Json
          prompt_tokens: number | null
          question: string
          response: string | null
          status: Database["public"]["Enums"]["reading_status"] | null
          total_credits_cost: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          oracle_types: Database["public"]["Enums"]["oracle_type"][]
          oracles: Json
          prompt_tokens?: number | null
          question: string
          response?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          total_credits_cost: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_tokens?: number | null
          created_at?: string | null
          id?: string
          model?: string | null
          oracle_types?: Database["public"]["Enums"]["oracle_type"][]
          oracles?: Json
          prompt_tokens?: number | null
          question?: string
          response?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          total_credits_cost?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_credits_for_oracles: {
        Args: { _oracle_types: Database["public"]["Enums"]["oracle_type"][] }
        Returns: {
          current_balance: number
          has_enough: boolean
          required: number
        }[]
      }
      check_usage_limit: { Args: { p_cost: number }; Returns: boolean }
      create_reading: {
        Args: {
          _oracle_types: Database["public"]["Enums"]["oracle_type"][]
          _oracles: Json
          _question: string
        }
        Returns: string
      }
      get_current_balance: {
        Args: never
        Returns: {
          balance: number
        }[]
      }
      get_recent_readings: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          oracle_types: Database["public"]["Enums"]["oracle_type"][]
          oracles: Json
          question: string
          response: string
        }[]
      }
      grant_signup_bonus:
        | { Args: never; Returns: undefined }
        | { Args: { p_user_id?: string }; Returns: undefined }
    }
    Enums: {
      credit_transaction_type:
        | "signup_bonus"
        | "purchase"
        | "reading"
        | "manual_adjustment"
      credit_tx_status: "completed" | "pending" | "failed" | "canceled"
      oracle_type: "tarot" | "lenormand" | "cartomancy"
      reading_status: "pending" | "completed" | "error"
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
      credit_transaction_type: [
        "signup_bonus",
        "purchase",
        "reading",
        "manual_adjustment",
      ],
      credit_tx_status: ["completed", "pending", "failed", "canceled"],
      oracle_type: ["tarot", "lenormand", "cartomancy"],
      reading_status: ["pending", "completed", "error"],
    },
  },
} as const

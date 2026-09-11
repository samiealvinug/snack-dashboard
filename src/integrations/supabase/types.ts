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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adjustments: {
        Row: {
          after: number
          before: number
          created_at: string
          date: string
          id: string
          owner_id: string
          product_id: string
          product_name: string
          reason: string
          staff_name: string
        }
        Insert: {
          after?: number
          before?: number
          created_at?: string
          date?: string
          id: string
          owner_id: string
          product_id?: string
          product_name?: string
          reason?: string
          staff_name?: string
        }
        Update: {
          after?: number
          before?: number
          created_at?: string
          date?: string
          id?: string
          owner_id?: string
          product_id?: string
          product_name?: string
          reason?: string
          staff_name?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          date: string
          id: string
          items: Json
          notes: string
          owner_id: string
          reference: string
          staff_name: string
          supplier: string
          total: number
        }
        Insert: {
          created_at?: string
          date?: string
          id: string
          items?: Json
          notes?: string
          owner_id: string
          reference?: string
          staff_name?: string
          supplier?: string
          total?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          items?: Json
          notes?: string
          owner_id?: string
          reference?: string
          staff_name?: string
          supplier?: string
          total?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          note: string
          owner_id: string
          payment: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id: string
          note?: string
          owner_id: string
          payment?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
          owner_id?: string
          payment?: string
        }
        Relationships: []
      }
      pairing_requests: {
        Row: {
          approved_at: string | null
          code: string
          created_at: string
          device_label: string
          expires_at: string
          owner_id: string | null
          staff_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          code: string
          created_at?: string
          device_label?: string
          expires_at?: string
          owner_id?: string | null
          staff_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          code?: string
          created_at?: string
          device_label?: string
          expires_at?: string
          owner_id?: string | null
          staff_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string
          category: string
          cost: number
          created_at: string
          id: string
          image: string | null
          min_stock: number
          name: string
          owner_id: string
          price: number
          sku: string
          stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string
          category?: string
          cost?: number
          created_at?: string
          id: string
          image?: string | null
          min_stock?: number
          name: string
          owner_id: string
          price?: number
          sku?: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          image?: string | null
          min_stock?: number
          name?: string
          owner_id?: string
          price?: number
          sku?: string
          stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          cash_given: number | null
          change: number | null
          cogs: number
          created_at: string
          date: string
          discount: number
          id: string
          items: Json
          owner_id: string
          payment: string
          receipt_no: string
          staff_id: string
          staff_name: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          cash_given?: number | null
          change?: number | null
          cogs?: number
          created_at?: string
          date?: string
          discount?: number
          id: string
          items?: Json
          owner_id: string
          payment?: string
          receipt_no?: string
          staff_id?: string
          staff_name?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          cash_given?: number | null
          change?: number | null
          cogs?: number
          created_at?: string
          date?: string
          discount?: number
          id?: string
          items?: Json
          owner_id?: string
          payment?: string
          receipt_no?: string
          staff_id?: string
          staff_name?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: []
      }
      shop_members: {
        Row: {
          created_at: string
          owner_id: string
          staff_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          owner_id: string
          staff_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          owner_id?: string
          staff_id?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          active_staff_id: string
          owner_id: string
          tax_rate: number
          updated_at: string
        }
        Insert: {
          active_staff_id?: string
          owner_id: string
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          active_staff_id?: string
          owner_id?: string
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          owner_id: string
          pin: string
          role: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id: string
          name: string
          owner_id: string
          pin?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          pin?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_invites: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          owner_id: string
          staff_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          owner_id: string
          staff_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          owner_id?: string
          staff_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string
          contact: string
          created_at: string
          email: string
          id: string
          name: string
          owner_id: string
          phone: string
        }
        Insert: {
          address?: string
          contact?: string
          created_at?: string
          email?: string
          id: string
          name: string
          owner_id: string
          phone?: string
        }
        Update: {
          address?: string
          contact?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_pairing_request: {
        Args: { p_code: string; p_staff_id: string }
        Returns: {
          staff_id: string
          user_id: string
        }[]
      }
      check_staff_invite: {
        Args: { p_code: string }
        Returns: {
          reason: string
          valid: boolean
        }[]
      }
      is_shop_member: { Args: { _owner: string }; Returns: boolean }
      join_shop: {
        Args: { code: string }
        Returns: {
          name: string
          owner_id: string
          role: string
          staff_id: string
        }[]
      }
      normalize_code: { Args: { p: string }; Returns: string }
      peek_pairing_request: {
        Args: { p_code: string }
        Returns: {
          code: string
          created_at: string
          device_label: string
          expires_at: string
          status: string
        }[]
      }
      redeem_staff_invite: {
        Args: { p_code: string }
        Returns: {
          name: string
          owner_id: string
          role: string
          staff_id: string
        }[]
      }
      reject_pairing_request: { Args: { p_code: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

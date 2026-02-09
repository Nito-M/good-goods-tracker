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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          sale_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          sale_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          sale_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          color: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          recurrence: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          recurrence?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          recurrence?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          colors: string[] | null
          cost: number
          created_at: string
          deleted_at: string | null
          description: string | null
          dimensions_height: number
          dimensions_length: number
          dimensions_unit: string
          dimensions_width: number
          id: string
          image_url: string | null
          min_stock: number
          name: string
          price: number
          quantity: number
          quantity_unit: string
          sku: string
          updated_at: string
          user_id: string | null
          weight: number
          weight_unit: string
        }
        Insert: {
          category: string
          colors?: string[] | null
          cost?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dimensions_height?: number
          dimensions_length?: number
          dimensions_unit?: string
          dimensions_width?: number
          id?: string
          image_url?: string | null
          min_stock?: number
          name: string
          price?: number
          quantity?: number
          quantity_unit?: string
          sku: string
          updated_at?: string
          user_id?: string | null
          weight?: number
          weight_unit?: string
        }
        Update: {
          category?: string
          colors?: string[] | null
          cost?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          dimensions_height?: number
          dimensions_length?: number
          dimensions_unit?: string
          dimensions_width?: number
          id?: string
          image_url?: string | null
          min_stock?: number
          name?: string
          price?: number
          quantity?: number
          quantity_unit?: string
          sku?: string
          updated_at?: string
          user_id?: string | null
          weight?: number
          weight_unit?: string
        }
        Relationships: []
      }
      item_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_vendor_prices: {
        Row: {
          created_at: string
          id: string
          item_id: string
          link: string | null
          price: number
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          link?: string | null
          price?: number
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          link?: string | null
          price?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_vendor_prices_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_vendor_prices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      po_item_allocations: {
        Row: {
          created_at: string
          id: string
          purchase_order_id: string
          quantity_allocated: number
          sale_item_id: string
          sku: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_order_id: string
          quantity_allocated?: number
          sale_item_id: string
          sku: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          purchase_order_id?: string
          quantity_allocated?: number
          sale_item_id?: string
          sku?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_item_allocations_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_item_allocations_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_theme: string | null
          birth_year: number | null
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_number: string | null
          business_phone: string | null
          color_theme: string | null
          created_at: string
          display_name: string | null
          id: string
          invoice_layout: Json | null
          invoice_next_number: number | null
          invoice_prefix: string | null
          invoice_thank_you_note: string | null
          is_active: boolean
          logo_url: string | null
          quote_layout: Json | null
          quote_thank_you_note: string | null
          quote_validity_days: number | null
          requester_name: string | null
          requester_names: string[] | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          background_theme?: string | null
          birth_year?: number | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_number?: string | null
          business_phone?: string | null
          color_theme?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          invoice_layout?: Json | null
          invoice_next_number?: number | null
          invoice_prefix?: string | null
          invoice_thank_you_note?: string | null
          is_active?: boolean
          logo_url?: string | null
          quote_layout?: Json | null
          quote_thank_you_note?: string | null
          quote_validity_days?: number | null
          requester_name?: string | null
          requester_names?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          background_theme?: string | null
          birth_year?: number | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_number?: string | null
          business_phone?: string | null
          color_theme?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          invoice_layout?: Json | null
          invoice_next_number?: number | null
          invoice_prefix?: string | null
          invoice_thank_you_note?: string | null
          is_active?: boolean
          logo_url?: string | null
          quote_layout?: Json | null
          quote_thank_you_note?: string | null
          quote_validity_days?: number | null
          requester_name?: string | null
          requester_names?: string[] | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          image_url: string | null
          item_name: string
          items: Json | null
          notes: string | null
          ordered_at: string
          paid_at: string | null
          pdf_url: string | null
          po_number: string | null
          quantity: number
          received_at: string | null
          request_id: string | null
          sku: string
          status: string
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          image_url?: string | null
          item_name: string
          items?: Json | null
          notes?: string | null
          ordered_at?: string
          paid_at?: string | null
          pdf_url?: string | null
          po_number?: string | null
          quantity?: number
          received_at?: string | null
          request_id?: string | null
          sku: string
          status?: string
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          image_url?: string | null
          item_name?: string
          items?: Json | null
          notes?: string | null
          ordered_at?: string
          paid_at?: string | null
          pdf_url?: string | null
          po_number?: string | null
          quantity?: number
          received_at?: string | null
          request_id?: string | null
          sku?: string
          status?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          quantity_unit: string
          quote_id: string
          sku: string
          total_price: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          quantity_unit?: string
          quote_id: string
          sku: string
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          quantity_unit?: string
          quote_id?: string
          sku?: string
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          attachment_url: string | null
          converted_to_invoice_id: string | null
          converted_to_po_id: string | null
          created_at: string
          discount_amount: number
          discount_rate: number
          id: string
          notes: string | null
          payment_terms: string | null
          quote_number: string
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string
          valid_until: string | null
          vendor_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          converted_to_invoice_id?: string | null
          converted_to_po_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          id?: string
          notes?: string | null
          payment_terms?: string | null
          quote_number: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
          vendor_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          converted_to_invoice_id?: string | null
          converted_to_po_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          id?: string
          notes?: string | null
          payment_terms?: string | null
          quote_number?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_to_po_id_fkey"
            columns: ["converted_to_po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string
          gst_rate: number | null
          id: string
          image_url: string | null
          inventory_item_id: string | null
          item_name: string
          link: string | null
          need_by_date: string | null
          notes: string | null
          price: number | null
          quantity: number
          quantity_unit: string
          request_number: string | null
          requester_name: string | null
          sku: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gst_rate?: number | null
          id?: string
          image_url?: string | null
          inventory_item_id?: string | null
          item_name: string
          link?: string | null
          need_by_date?: string | null
          notes?: string | null
          price?: number | null
          quantity?: number
          quantity_unit?: string
          request_number?: string | null
          requester_name?: string | null
          sku?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gst_rate?: number | null
          id?: string
          image_url?: string | null
          inventory_item_id?: string | null
          item_name?: string
          link?: string | null
          need_by_date?: string | null
          notes?: string | null
          price?: number | null
          quantity?: number
          quantity_unit?: string
          request_number?: string | null
          requester_name?: string | null
          sku?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          quantity: number
          sale_id: string
          sku: string
          total_price: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          quantity?: number
          sale_id: string
          sku: string
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          quantity?: number
          sale_id?: string
          sku?: string
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          discount_amount: number
          discount_rate: number
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          payment_terms: string | null
          picked_up_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          payment_terms?: string | null
          picked_up_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_terms?: string | null
          picked_up_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vendors: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          link: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          link?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          link?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

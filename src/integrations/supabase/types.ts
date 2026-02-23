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
      assemblies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          selling_price: number
          status: string
          status_notes: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          selling_price?: number
          status?: string
          status_notes?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          selling_price?: number
          status?: string
          status_notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assembly_items: {
        Row: {
          assembly_id: string
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          sku: string
        }
        Insert: {
          assembly_id: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          sku?: string
        }
        Update: {
          assembly_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_items_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_cards: {
        Row: {
          balance: number
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_card_id: string | null
          created_at: string
          description: string | null
          id: string
          sale_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_card_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sale_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_card_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sale_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_card_id_fkey"
            columns: ["bank_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
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
      companies: {
        Row: {
          address: string | null
          business_number: string | null
          created_at: string
          email: string | null
          id: string
          invoice_layout: Json | null
          invoice_next_number: number
          invoice_prefix: string
          invoice_thank_you_note: string
          is_default: boolean
          logo_url: string | null
          name: string
          phone: string | null
          po_next_number: number
          po_prefix: string
          po_thank_you_note: string
          quote_layout: Json | null
          quote_thank_you_note: string
          quote_validity_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoice_layout?: Json | null
          invoice_next_number?: number
          invoice_prefix?: string
          invoice_thank_you_note?: string
          is_default?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          po_next_number?: number
          po_prefix?: string
          po_thank_you_note?: string
          quote_layout?: Json | null
          quote_thank_you_note?: string
          quote_validity_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invoice_layout?: Json | null
          invoice_next_number?: number
          invoice_prefix?: string
          invoice_thank_you_note?: string
          is_default?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          po_next_number?: number
          po_prefix?: string
          po_thank_you_note?: string
          quote_layout?: Json | null
          quote_thank_you_note?: string
          quote_validity_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
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
          dxf_url: string | null
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
          warehouse_id: string | null
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
          dxf_url?: string | null
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
          warehouse_id?: string | null
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
          dxf_url?: string | null
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
          warehouse_id?: string | null
          weight?: number
          weight_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
      item_location_quantities: {
        Row: {
          created_at: string
          id: string
          item_id: string
          quantity: number
          updated_at: string
          user_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_location_quantities_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_location_quantities_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      item_tags: {
        Row: {
          created_at: string
          id: string
          item_id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
          vendor_sku: string | null
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
          vendor_sku?: string | null
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
          vendor_sku?: string | null
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
      job_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          job_id: string
          notes: string | null
          quantity: number
          reserved: boolean
          sku: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          job_id: string
          notes?: string | null
          quantity?: number
          reserved?: boolean
          sku?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          job_id?: string
          notes?: string | null
          quantity?: number
          reserved?: boolean
          sku?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sidebar_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          job_id: string | null
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          job_id?: string | null
          label: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          job_id?: string | null
          label?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_sidebar_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          display_order: number
          due_date: string | null
          id: string
          job_number: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          job_number?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          job_number?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      org_requesters: {
        Row: {
          created_at: string
          id: string
          linked_user_id: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_user_id?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_user_id?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_requesters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          requester_names: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requester_names?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requester_names?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          created_at: string
          description: string | null
          dxf_label_1: string
          dxf_label_2: string
          dxf_url_1: string | null
          dxf_url_2: string | null
          id: string
          image_url: string | null
          name: string
          sku: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dxf_label_1?: string
          dxf_label_2?: string
          dxf_url_1?: string | null
          dxf_url_2?: string | null
          id?: string
          image_url?: string | null
          name: string
          sku?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dxf_label_1?: string
          dxf_label_2?: string
          dxf_url_1?: string | null
          dxf_url_2?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sku?: string
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
      po_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string
          id: string
          purchase_order_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string
          id?: string
          purchase_order_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string
          id?: string
          purchase_order_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_attachments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
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
      po_job_links: {
        Row: {
          created_at: string
          id: string
          job_id: string
          purchase_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          purchase_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_job_links_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          background_image_url: string | null
          background_theme: string | null
          birth_year: number | null
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_number: string | null
          business_phone: string | null
          color_theme: string | null
          created_at: string
          custom_bg_light: boolean
          custom_text_color: string | null
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
          background_image_url?: string | null
          background_theme?: string | null
          birth_year?: number | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_number?: string | null
          business_phone?: string | null
          color_theme?: string | null
          created_at?: string
          custom_bg_light?: boolean
          custom_text_color?: string | null
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
          background_image_url?: string | null
          background_theme?: string | null
          birth_year?: number | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_number?: string | null
          business_phone?: string | null
          color_theme?: string | null
          created_at?: string
          custom_bg_light?: boolean
          custom_text_color?: string | null
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
          bank_card_id: string | null
          company_id: string | null
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
          bank_card_id?: string | null
          company_id?: string | null
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
          bank_card_id?: string | null
          company_id?: string | null
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
            foreignKeyName: "purchase_orders_bank_card_id_fkey"
            columns: ["bank_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
          converted_to_invoice_id: string | null
          converted_to_job_id: string | null
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
          company_id?: string | null
          converted_to_invoice_id?: string | null
          converted_to_job_id?: string | null
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
          company_id?: string | null
          converted_to_invoice_id?: string | null
          converted_to_job_id?: string | null
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
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_to_job_id_fkey"
            columns: ["converted_to_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
          bank_card_id: string | null
          created_at: string
          extra_cost: number
          extra_cost_label: string
          gst_rate: number | null
          id: string
          image_url: string | null
          inventory_item_id: string | null
          item_name: string
          link: string | null
          need_by_date: string | null
          notes: string | null
          pdf_url: string | null
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
          bank_card_id?: string | null
          created_at?: string
          extra_cost?: number
          extra_cost_label?: string
          gst_rate?: number | null
          id?: string
          image_url?: string | null
          inventory_item_id?: string | null
          item_name: string
          link?: string | null
          need_by_date?: string | null
          notes?: string | null
          pdf_url?: string | null
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
          bank_card_id?: string | null
          created_at?: string
          extra_cost?: number
          extra_cost_label?: string
          gst_rate?: number | null
          id?: string
          image_url?: string | null
          inventory_item_id?: string | null
          item_name?: string
          link?: string | null
          need_by_date?: string | null
          notes?: string | null
          pdf_url?: string | null
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
            foreignKeyName: "requests_bank_card_id_fkey"
            columns: ["bank_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      so_item_job_links: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          quote_id: string
          quote_item_id: string
          status: string
          unit_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          quote_id: string
          quote_item_id: string
          status?: string
          unit_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          quote_id?: string
          quote_item_id?: string
          status?: string
          unit_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_item_job_links_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_item_job_links_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_item_job_links_quote_item_id_fkey"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          tag_category_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tag_category_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tag_category_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tag_category_id_fkey"
            columns: ["tag_category_id"]
            isOneToOne: false
            referencedRelation: "tag_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_page_permissions: {
        Row: {
          created_at: string
          id: string
          page_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_key?: string
          user_id?: string
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
      warehouses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
      is_org_admin_or_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      users_share_org: {
        Args: { _user_id_a: string; _user_id_b: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      org_role: "owner" | "admin" | "member"
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
      org_role: ["owner", "admin", "member"],
    },
  },
} as const

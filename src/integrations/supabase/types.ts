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
      app_welcome_settings: {
        Row: {
          background_image_url: string | null
          background_image_url_mobile: string | null
          background_video_url: string | null
          background_video_url_mobile: string | null
          bg_animate_with_greeting: boolean
          bg_dim_pct: number
          font_size_rem: number
          greeting_color: string
          greeting_instant: boolean
          greeting_text: string
          id: number
          letter_stagger_ms: number
          position_x_pct: number
          position_y_pct: number
          start_delay_ms: number
          text_align: string
          updated_at: string
          updated_by: string | null
          video_loop: boolean
          video_muted: boolean
        }
        Insert: {
          background_image_url?: string | null
          background_image_url_mobile?: string | null
          background_video_url?: string | null
          background_video_url_mobile?: string | null
          bg_animate_with_greeting?: boolean
          bg_dim_pct?: number
          font_size_rem?: number
          greeting_color?: string
          greeting_instant?: boolean
          greeting_text?: string
          id?: number
          letter_stagger_ms?: number
          position_x_pct?: number
          position_y_pct?: number
          start_delay_ms?: number
          text_align?: string
          updated_at?: string
          updated_by?: string | null
          video_loop?: boolean
          video_muted?: boolean
        }
        Update: {
          background_image_url?: string | null
          background_image_url_mobile?: string | null
          background_video_url?: string | null
          background_video_url_mobile?: string | null
          bg_animate_with_greeting?: boolean
          bg_dim_pct?: number
          font_size_rem?: number
          greeting_color?: string
          greeting_instant?: boolean
          greeting_text?: string
          id?: number
          letter_stagger_ms?: number
          position_x_pct?: number
          position_y_pct?: number
          start_delay_ms?: number
          text_align?: string
          updated_at?: string
          updated_by?: string | null
          video_loop?: boolean
          video_muted?: boolean
        }
        Relationships: []
      }
      assemblies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          model: string | null
          name: string
          selling_price: number
          selling_price_updated_at: string | null
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
          model?: string | null
          name: string
          selling_price?: number
          selling_price_updated_at?: string | null
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
          model?: string | null
          name?: string
          selling_price?: number
          selling_price_updated_at?: string | null
          status?: string
          status_notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assembly_categories: {
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
      assembly_components: {
        Row: {
          assembly_id: string | null
          category: string
          compatible_trailer_type_ids: string[] | null
          created_at: string
          id: string
          image_url: string | null
          model_code: string | null
          name: string
          parent_component_id: string | null
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assembly_id?: string | null
          category: string
          compatible_trailer_type_ids?: string[] | null
          created_at?: string
          id?: string
          image_url?: string | null
          model_code?: string | null
          name: string
          parent_component_id?: string | null
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assembly_id?: string | null
          category?: string
          compatible_trailer_type_ids?: string[] | null
          created_at?: string
          id?: string
          image_url?: string | null
          model_code?: string | null
          name?: string
          parent_component_id?: string | null
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_components_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_components_parent_component_id_fkey"
            columns: ["parent_component_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_items: {
        Row: {
          assembly_id: string
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string
          nested_assembly_id: string | null
          notes: string | null
          part_id: string | null
          parts_assembly_id: string | null
          quantity: number
          sku: string
          unit_cost: number
        }
        Insert: {
          assembly_id: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name: string
          nested_assembly_id?: string | null
          notes?: string | null
          part_id?: string | null
          parts_assembly_id?: string | null
          quantity?: number
          sku?: string
          unit_cost?: number
        }
        Update: {
          assembly_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          nested_assembly_id?: string | null
          notes?: string | null
          part_id?: string | null
          parts_assembly_id?: string | null
          quantity?: number
          sku?: string
          unit_cost?: number
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
          {
            foreignKeyName: "assembly_items_nested_assembly_id_fkey"
            columns: ["nested_assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_items_parts_assembly_id_fkey"
            columns: ["parts_assembly_id"]
            isOneToOne: false
            referencedRelation: "parts_assemblies"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_models: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assembly_price_history: {
        Row: {
          assembly_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_price: number
          old_price: number | null
          user_id: string
        }
        Insert: {
          assembly_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_price: number
          old_price?: number | null
          user_id: string
        }
        Update: {
          assembly_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_price?: number
          old_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_price_history_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_available_parts: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          image_url: string | null
          link: string | null
          name: string
          notes: string | null
          price: number | null
          sku: string | null
          updated_at: string
          user_id: string
          vendor: string | null
          vendor_location: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          name: string
          notes?: string | null
          price?: number | null
          sku?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
          vendor_location?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          name?: string
          notes?: string | null
          price?: number | null
          sku?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
          vendor_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_available_parts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_documents: {
        Row: {
          asset_id: string
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_images: {
        Row: {
          asset_id: string
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_images_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          cost: number | null
          created_at: string
          description: string
          id: string
          parts_used: string | null
          service_date: string
          technician: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          parts_used?: string | null
          service_date?: string
          technician?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          parts_used?: string | null
          service_date?: string
          technician?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_notes: {
        Row: {
          asset_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_notes_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_parts: {
        Row: {
          asset_id: string
          created_at: string
          deducted_from_inventory: boolean
          id: string
          install_date: string | null
          installed_by: string | null
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          remove_date: string | null
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          deducted_from_inventory?: boolean
          id?: string
          install_date?: string | null
          installed_by?: string | null
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          remove_date?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          deducted_from_inventory?: boolean
          id?: string
          install_date?: string | null
          installed_by?: string | null
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          remove_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_parts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_parts_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          assigned_employee: string | null
          assigned_shop: string | null
          brand: string | null
          created_at: string
          current_location: string | null
          engine_hours: number | null
          external_link: string | null
          id: string
          image_url: string | null
          last_service_date: string | null
          model: string | null
          motor_type: string | null
          name: string
          odometer: number | null
          serial_number: string | null
          service_interval_days: number | null
          status: string
          updated_at: string
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          asset_type?: string
          assigned_employee?: string | null
          assigned_shop?: string | null
          brand?: string | null
          created_at?: string
          current_location?: string | null
          engine_hours?: number | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          last_service_date?: string | null
          model?: string | null
          motor_type?: string | null
          name: string
          odometer?: number | null
          serial_number?: string | null
          service_interval_days?: number | null
          status?: string
          updated_at?: string
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          asset_type?: string
          assigned_employee?: string | null
          assigned_shop?: string | null
          brand?: string | null
          created_at?: string
          current_location?: string | null
          engine_hours?: number | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          last_service_date?: string | null
          model?: string | null
          motor_type?: string | null
          name?: string
          odometer?: number | null
          serial_number?: string | null
          service_interval_days?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      bank_cards: {
        Row: {
          balance: number
          category: string | null
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          category?: string | null
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          category?: string | null
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
      board_cell_files: {
        Row: {
          caption: string | null
          column_id: string
          created_at: string
          display_order: number
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          row_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          column_id: string
          created_at?: string
          display_order?: number
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          row_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          caption?: string | null
          column_id?: string
          created_at?: string
          display_order?: number
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          row_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_cell_files_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cell_files_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      board_cells: {
        Row: {
          bg_color: string | null
          column_id: string
          id: string
          row_id: string
          text_align: string | null
          updated_at: string
          value: string
        }
        Insert: {
          bg_color?: string | null
          column_id: string
          id?: string
          row_id: string
          text_align?: string | null
          updated_at?: string
          value?: string
        }
        Update: {
          bg_color?: string | null
          column_id?: string
          id?: string
          row_id?: string
          text_align?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_cells_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cells_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      board_column_permissions: {
        Row: {
          board_id: string
          column_id: string
          created_at: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          board_id: string
          column_id: string
          created_at?: string
          id?: string
          permission?: string
          user_id: string
        }
        Update: {
          board_id?: string
          column_id?: string
          created_at?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_column_permissions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_column_permissions_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          board_id: string
          created_at: string
          header_bg_color: string | null
          id: string
          name: string
          notes: string
          options: Json
          per_row_options: boolean
          position: number
          text_align: string
          type: string
          width: number
        }
        Insert: {
          board_id: string
          created_at?: string
          header_bg_color?: string | null
          id?: string
          name?: string
          notes?: string
          options?: Json
          per_row_options?: boolean
          position?: number
          text_align?: string
          type?: string
          width?: number
        }
        Update: {
          board_id?: string
          created_at?: string
          header_bg_color?: string | null
          id?: string
          name?: string
          notes?: string
          options?: Json
          per_row_options?: boolean
          position?: number
          text_align?: string
          type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_member_access: {
        Row: {
          board_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_member_access_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_merges: {
        Row: {
          board_id: string
          created_at: string
          end_column_id: string
          end_row_id: string
          id: string
          start_column_id: string
          start_row_id: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          end_column_id: string
          end_row_id: string
          id?: string
          start_column_id: string
          start_row_id: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          end_column_id?: string
          end_row_id?: string
          id?: string
          start_column_id?: string
          start_row_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_merges_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_merges_end_column_id_fkey"
            columns: ["end_column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_merges_end_row_id_fkey"
            columns: ["end_row_id"]
            isOneToOne: false
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_merges_start_column_id_fkey"
            columns: ["start_column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_merges_start_row_id_fkey"
            columns: ["start_row_id"]
            isOneToOne: false
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      board_row_activity: {
        Row: {
          action: string
          column_id: string | null
          column_name: string | null
          column_type: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          row_id: string
          user_id: string
        }
        Insert: {
          action: string
          column_id?: string | null
          column_name?: string | null
          column_type?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          row_id: string
          user_id: string
        }
        Update: {
          action?: string
          column_id?: string | null
          column_name?: string | null
          column_type?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          row_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_row_activity_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_row_activity_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      board_row_note_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          image_path: string | null
          image_url: string | null
          position: number
          row_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          position?: number
          row_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          position?: number
          row_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_row_note_entries_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      board_row_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          row_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          row_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          row_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_row_notes_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: true
            referencedRelation: "board_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      board_rows: {
        Row: {
          board_id: string
          created_at: string
          frozen: boolean
          id: string
          position: number
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          frozen?: boolean
          id?: string
          position?: number
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          frozen?: boolean
          id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_rows_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          company_id: string | null
          created_at: string
          group_by_column_id: string | null
          header_frozen: boolean
          id: string
          name: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          group_by_column_id?: string | null
          header_frozen?: boolean
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          group_by_column_id?: string | null
          header_frozen?: boolean
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          quote_hide_prices: boolean
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
          quote_hide_prices?: boolean
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
          quote_hide_prices?: boolean
          quote_layout?: Json | null
          quote_thank_you_note?: string
          quote_validity_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_files: {
        Row: {
          created_at: string
          customer_id: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      how_to_instructions: {
        Row: {
          author_name: string
          created_at: string
          id: string
          link: string | null
          notes: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instruction_card_files: {
        Row: {
          card_id: string
          created_at: string
          display_order: number
          file_name: string
          file_type: string
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          display_order?: number
          file_name: string
          file_type?: string
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          display_order?: number
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_card_files_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "instruction_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_card_notes: {
        Row: {
          card_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_card_notes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "instruction_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_cards: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          display_order: number
          id: string
          instruction_id: string
          link: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          display_order?: number
          id?: string
          instruction_id: string
          link?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          display_order?: number
          id?: string
          instruction_id?: string
          link?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_cards_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "how_to_instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_files: {
        Row: {
          created_at: string
          display_order: number
          file_name: string
          file_type: string
          file_url: string
          id: string
          instruction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          file_name: string
          file_type?: string
          file_url: string
          id?: string
          instruction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          instruction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_files_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "how_to_instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          box_amount: number
          bundle_amount: number
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
          internal_part_number: string | null
          min_stock: number
          name: string
          organization_id: string | null
          pallet_amount: number
          piece_length: number
          price: number
          quantity: number
          quantity_unit: string
          show_in_storefront: boolean
          sku: string
          storefront_page: string | null
          subcategory: string | null
          updated_at: string
          user_id: string | null
          warehouse_id: string | null
          weight: number
          weight_unit: string
        }
        Insert: {
          box_amount?: number
          bundle_amount?: number
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
          internal_part_number?: string | null
          min_stock?: number
          name: string
          organization_id?: string | null
          pallet_amount?: number
          piece_length?: number
          price?: number
          quantity?: number
          quantity_unit?: string
          show_in_storefront?: boolean
          sku: string
          storefront_page?: string | null
          subcategory?: string | null
          updated_at?: string
          user_id?: string | null
          warehouse_id?: string | null
          weight?: number
          weight_unit?: string
        }
        Update: {
          box_amount?: number
          bundle_amount?: number
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
          internal_part_number?: string | null
          min_stock?: number
          name?: string
          organization_id?: string | null
          pallet_amount?: number
          piece_length?: number
          price?: number
          quantity?: number
          quantity_unit?: string
          show_in_storefront?: boolean
          sku?: string
          storefront_page?: string | null
          subcategory?: string | null
          updated_at?: string
          user_id?: string | null
          warehouse_id?: string | null
          weight?: number
          weight_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      item_consumptions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_id: string
          quantity: number
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_id: string
          quantity?: number
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string
          quantity?: number
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_consumptions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_consumptions_warehouse_id_fkey"
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
          lead_time_days: number | null
          link: string | null
          notes: string | null
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
          lead_time_days?: number | null
          link?: string | null
          notes?: string | null
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
          lead_time_days?: number | null
          link?: string | null
          notes?: string | null
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
      job_instruction_files: {
        Row: {
          created_at: string
          display_order: number
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          instruction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          instruction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          instruction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_instruction_files_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "job_instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_instruction_parts: {
        Row: {
          created_at: string
          display_order: number
          id: string
          instruction_id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          sku: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          instruction_id: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          sku?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          instruction_id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          sku?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_instruction_parts_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "job_instructions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_instruction_parts_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      job_instructions: {
        Row: {
          content: string | null
          created_at: string
          display_order: number
          id: string
          job_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          display_order?: number
          id?: string
          job_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          display_order?: number
          id?: string
          job_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_instructions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_items: {
        Row: {
          consumed: boolean
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
          consumed?: boolean
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
          consumed?: boolean
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
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          display_order: number
          due_date: string | null
          id: string
          invoice_number: string | null
          job_number: string | null
          nvis_link: string | null
          quote_number: string | null
          sales_order_number: string | null
          status: string
          stock_number: string | null
          title: string
          updated_at: string
          user_id: string
          vin: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          job_number?: string | null
          nvis_link?: string | null
          quote_number?: string | null
          sales_order_number?: string | null
          status?: string
          stock_number?: string | null
          title: string
          updated_at?: string
          user_id: string
          vin?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          display_order?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          job_number?: string | null
          nvis_link?: string | null
          quote_number?: string | null
          sales_order_number?: string | null
          status?: string
          stock_number?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vin?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      model_number_slots: {
        Row: {
          conditional_rules: Json
          created_at: string
          fixed_text: string | null
          id: string
          override_codes: Json
          position: number
          secondary_fixed_text: string | null
          secondary_override_codes: Json
          secondary_slot_kind: string | null
          separator_after: boolean
          slot_kind: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditional_rules?: Json
          created_at?: string
          fixed_text?: string | null
          id?: string
          override_codes?: Json
          position: number
          secondary_fixed_text?: string | null
          secondary_override_codes?: Json
          secondary_slot_kind?: string | null
          separator_after?: boolean
          slot_kind?: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conditional_rules?: Json
          created_at?: string
          fixed_text?: string | null
          id?: string
          override_codes?: Json
          position?: number
          secondary_fixed_text?: string | null
          secondary_override_codes?: Json
          secondary_slot_kind?: string | null
          separator_after?: boolean
          slot_kind?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_number_slots_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "model_number_template"
            referencedColumns: ["id"]
          },
        ]
      }
      model_number_template: {
        Row: {
          created_at: string
          id: string
          separator: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          separator?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          separator?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      note_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          note_id: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          note_id: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          note_id?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tag_assignments: {
        Row: {
          created_at: string
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tag_assignments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "note_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          archived: boolean
          color: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_pinned: boolean
          is_private: boolean
          is_template: boolean
          reminder_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          is_private?: boolean
          is_template?: boolean
          reminder_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          is_private?: boolean
          is_template?: boolean
          reminder_at?: string | null
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
      organization_page_permissions: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          page_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          page_key: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          page_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_page_permissions_organization_id_fkey"
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
          max_users: number
          name: string
          requester_names: string[] | null
          slug: string | null
          storefront_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_users?: number
          name: string
          requester_names?: string[] | null
          slug?: string | null
          storefront_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_users?: number
          name?: string
          requester_names?: string[] | null
          slug?: string | null
          storefront_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      part_folders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "part_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      part_inventory_items: {
        Row: {
          created_at: string
          id: string
          inventory_item_id: string | null
          item_name: string | null
          notes: string | null
          part_id: string
          quantity: number
          unit_cost: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string | null
          notes?: string | null
          part_id: string
          quantity?: number
          unit_cost?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          item_name?: string | null
          notes?: string | null
          part_id?: string
          quantity?: number
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_inventory_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_inventory_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      part_manufacturing_steps: {
        Row: {
          angle: string | null
          created_at: string
          hole_diameter: string | null
          id: string
          length: string | null
          machine: string
          notes: string | null
          operation_type: string
          part_id: string
          position_offset: string | null
          price: number
          quantity: number | null
          step_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          angle?: string | null
          created_at?: string
          hole_diameter?: string | null
          id?: string
          length?: string | null
          machine?: string
          notes?: string | null
          operation_type?: string
          part_id: string
          position_offset?: string | null
          price?: number
          quantity?: number | null
          step_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          angle?: string | null
          created_at?: string
          hole_diameter?: string | null
          id?: string
          length?: string | null
          machine?: string
          notes?: string | null
          operation_type?: string
          part_id?: string
          position_offset?: string | null
          price?: number
          quantity?: number | null
          step_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_manufacturing_steps_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      part_step_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          step_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          step_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          step_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_step_images_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "part_manufacturing_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          created_at: string
          description: string | null
          dxf_label_1: string
          dxf_label_2: string
          dxf_url_1: string | null
          dxf_url_2: string | null
          folder_id: string | null
          hourly_rate: number
          hours: number
          id: string
          image_url: string | null
          name: string
          painting_hourly_rate: number
          painting_hours: number
          price: number
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
          folder_id?: string | null
          hourly_rate?: number
          hours?: number
          id?: string
          image_url?: string | null
          name?: string
          painting_hourly_rate?: number
          painting_hours?: number
          price?: number
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
          folder_id?: string | null
          hourly_rate?: number
          hours?: number
          id?: string
          image_url?: string | null
          name?: string
          painting_hourly_rate?: number
          painting_hours?: number
          price?: number
          sku?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "part_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_assemblies: {
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
      parts_assemblies_v2: {
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
      parts_assembly_items: {
        Row: {
          assembly_id: string
          created_at: string
          id: string
          inventory_item_id: string | null
          notes: string | null
          part_id: string | null
          part_name: string
          part_sku: string
          parts_assembly_v2_id: string | null
          quantity: number
        }
        Insert: {
          assembly_id: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          part_id?: string | null
          part_name: string
          part_sku?: string
          parts_assembly_v2_id?: string | null
          quantity?: number
        }
        Update: {
          assembly_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          part_id?: string | null
          part_name?: string
          part_sku?: string
          parts_assembly_v2_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_assembly_items_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "parts_assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assembly_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assembly_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assembly_items_parts_assembly_v2_id_fkey"
            columns: ["parts_assembly_v2_id"]
            isOneToOne: false
            referencedRelation: "parts_assemblies_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_assembly_v2_items: {
        Row: {
          assembly_id: string
          created_at: string
          id: string
          inventory_item_id: string | null
          notes: string | null
          part_id: string | null
          part_name: string
          part_sku: string
          parts_assembly_id: string | null
          quantity: number
        }
        Insert: {
          assembly_id: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          part_id?: string | null
          part_name: string
          part_sku?: string
          parts_assembly_id?: string | null
          quantity?: number
        }
        Update: {
          assembly_id?: string
          created_at?: string
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          part_id?: string | null
          part_name?: string
          part_sku?: string
          parts_assembly_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_assembly_v2_items_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "parts_assemblies_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assembly_v2_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assembly_v2_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_assembly_v2_items_parts_assembly_id_fkey"
            columns: ["parts_assembly_id"]
            isOneToOne: false
            referencedRelation: "parts_assemblies"
            referencedColumns: ["id"]
          },
        ]
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
      prebuilt_assemblies: {
        Row: {
          back_end_id: string | null
          created_at: string
          deck_type_id: string | null
          front_end_id: string | null
          front_end_tier2_id: string | null
          id: string
          linked_assembly_id: string | null
          notes: string | null
          total_price: number
          trailer_length_id: string | null
          trailer_subtype_id: string | null
          trailer_type_id: string
          under_carriage_axle_count: number | null
          under_carriage_id: string | null
          under_carriage_tier2_id: string | null
          under_carriage_tier3_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back_end_id?: string | null
          created_at?: string
          deck_type_id?: string | null
          front_end_id?: string | null
          front_end_tier2_id?: string | null
          id?: string
          linked_assembly_id?: string | null
          notes?: string | null
          total_price?: number
          trailer_length_id?: string | null
          trailer_subtype_id?: string | null
          trailer_type_id: string
          under_carriage_axle_count?: number | null
          under_carriage_id?: string | null
          under_carriage_tier2_id?: string | null
          under_carriage_tier3_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back_end_id?: string | null
          created_at?: string
          deck_type_id?: string | null
          front_end_id?: string | null
          front_end_tier2_id?: string | null
          id?: string
          linked_assembly_id?: string | null
          notes?: string | null
          total_price?: number
          trailer_length_id?: string | null
          trailer_subtype_id?: string | null
          trailer_type_id?: string
          under_carriage_axle_count?: number | null
          under_carriage_id?: string | null
          under_carriage_tier2_id?: string | null
          under_carriage_tier3_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prebuilt_assemblies_back_end_id_fkey"
            columns: ["back_end_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_deck_type_id_fkey"
            columns: ["deck_type_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_front_end_id_fkey"
            columns: ["front_end_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_front_end_tier2_id_fkey"
            columns: ["front_end_tier2_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_linked_assembly_id_fkey"
            columns: ["linked_assembly_id"]
            isOneToOne: false
            referencedRelation: "assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_trailer_length_id_fkey"
            columns: ["trailer_length_id"]
            isOneToOne: false
            referencedRelation: "trailer_lengths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_trailer_subtype_id_fkey"
            columns: ["trailer_subtype_id"]
            isOneToOne: false
            referencedRelation: "trailer_subtypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_trailer_type_id_fkey"
            columns: ["trailer_type_id"]
            isOneToOne: false
            referencedRelation: "trailer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_under_carriage_id_fkey"
            columns: ["under_carriage_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_under_carriage_tier2_id_fkey"
            columns: ["under_carriage_tier2_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prebuilt_assemblies_under_carriage_tier3_id_fkey"
            columns: ["under_carriage_tier3_id"]
            isOneToOne: false
            referencedRelation: "assembly_components"
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
          border_color: string | null
          business_address: string | null
          business_email: string | null
          business_name: string | null
          business_number: string | null
          business_phone: string | null
          card_opacity: number
          color_theme: string | null
          created_at: string
          custom_bg_light: boolean
          custom_text_color: string | null
          display_name: string | null
          id: string
          inventory_column_order: string[]
          inventory_markup_percent: number | null
          inventory_price_display: string
          inventory_show_images: boolean
          inventory_show_price: boolean
          inventory_show_quantity: boolean
          inventory_show_sku: boolean
          inventory_show_tags: boolean
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
          border_color?: string | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_number?: string | null
          business_phone?: string | null
          card_opacity?: number
          color_theme?: string | null
          created_at?: string
          custom_bg_light?: boolean
          custom_text_color?: string | null
          display_name?: string | null
          id?: string
          inventory_column_order?: string[]
          inventory_markup_percent?: number | null
          inventory_price_display?: string
          inventory_show_images?: boolean
          inventory_show_price?: boolean
          inventory_show_quantity?: boolean
          inventory_show_sku?: boolean
          inventory_show_tags?: boolean
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
          border_color?: string | null
          business_address?: string | null
          business_email?: string | null
          business_name?: string | null
          business_number?: string | null
          business_phone?: string | null
          card_opacity?: number
          color_theme?: string | null
          created_at?: string
          custom_bg_light?: boolean
          custom_text_color?: string | null
          display_name?: string | null
          id?: string
          inventory_column_order?: string[]
          inventory_markup_percent?: number | null
          inventory_price_display?: string
          inventory_show_images?: boolean
          inventory_show_price?: boolean
          inventory_show_quantity?: boolean
          inventory_show_sku?: boolean
          inventory_show_tags?: boolean
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
          contact_person_name: string | null
          created_at: string
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          image_url: string | null
          internal_notes: string | null
          item_name: string
          items: Json | null
          notes: string | null
          ordered_at: string
          paid_at: string | null
          partially_received_at: string | null
          pdf_url: string | null
          po_number: string | null
          pst_percent: number
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
          contact_person_name?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          item_name: string
          items?: Json | null
          notes?: string | null
          ordered_at?: string
          paid_at?: string | null
          partially_received_at?: string | null
          pdf_url?: string | null
          po_number?: string | null
          pst_percent?: number
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
          contact_person_name?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          item_name?: string
          items?: Json | null
          notes?: string | null
          ordered_at?: string
          paid_at?: string | null
          partially_received_at?: string | null
          pdf_url?: string | null
          po_number?: string | null
          pst_percent?: number
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
      quote_invoice_links: {
        Row: {
          created_at: string
          id: string
          percentage: number
          quote_id: string
          sale_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          percentage: number
          quote_id: string
          sale_id: string
        }
        Update: {
          created_at?: string
          id?: string
          percentage?: number
          quote_id?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_invoice_links_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_invoice_links_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          discount_rate: number
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          quantity_unit: string
          quote_id: string
          sku: string
          sort_order: number
          total_price: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_rate?: number
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          quantity_unit?: string
          quote_id: string
          sku: string
          sort_order?: number
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount_rate?: number
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          quantity_unit?: string
          quote_id?: string
          sku?: string
          sort_order?: number
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
          contact_person_name: string | null
          converted_to_invoice_id: string | null
          converted_to_job_id: string | null
          converted_to_po_id: string | null
          created_at: string
          discount_amount: number
          discount_rate: number
          hide_prices: boolean
          id: string
          invoiced_percentage: number
          notes: string | null
          payment_contact_company: string | null
          payment_contact_email: string | null
          payment_contact_name: string | null
          payment_terms: string | null
          quote_number: string
          sales_order_number: string | null
          show_payment_terms: boolean
          show_sku: boolean
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
          contact_person_name?: string | null
          converted_to_invoice_id?: string | null
          converted_to_job_id?: string | null
          converted_to_po_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          hide_prices?: boolean
          id?: string
          invoiced_percentage?: number
          notes?: string | null
          payment_contact_company?: string | null
          payment_contact_email?: string | null
          payment_contact_name?: string | null
          payment_terms?: string | null
          quote_number: string
          sales_order_number?: string | null
          show_payment_terms?: boolean
          show_sku?: boolean
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
          contact_person_name?: string | null
          converted_to_invoice_id?: string | null
          converted_to_job_id?: string | null
          converted_to_po_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          hide_prices?: boolean
          id?: string
          invoiced_percentage?: number
          notes?: string | null
          payment_contact_company?: string | null
          payment_contact_email?: string | null
          payment_contact_name?: string | null
          payment_terms?: string | null
          quote_number?: string
          sales_order_number?: string | null
          show_payment_terms?: boolean
          show_sku?: boolean
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
      request_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_images_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_sub_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_selected: boolean
          link: string | null
          notes: string | null
          quantity: number
          request_id: string
          sku: string | null
          unit_price: number
          user_id: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_selected?: boolean
          link?: string | null
          notes?: string | null
          quantity?: number
          request_id: string
          sku?: string | null
          unit_price?: number
          user_id: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_selected?: boolean
          link?: string | null
          notes?: string | null
          quantity?: number
          request_id?: string
          sku?: string | null
          unit_price?: number
          user_id?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_sub_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
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
          title: string | null
          updated_at: string
          user_id: string
          vendor_name: string | null
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
          title?: string | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
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
          title?: string | null
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
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
      sale_adjustments: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          sale_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          sale_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          sale_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_adjustments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          discount_amount: number
          discount_rate: number
          id: string
          inventory_item_id: string | null
          item_name: string
          notes: string | null
          quantity: number
          sale_id: string
          sku: string
          sort_order: number
          total_price: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          id?: string
          inventory_item_id?: string | null
          item_name: string
          notes?: string | null
          quantity?: number
          sale_id: string
          sku: string
          sort_order?: number
          total_price?: number
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          notes?: string | null
          quantity?: number
          sale_id?: string
          sku?: string
          sort_order?: number
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
          contact_person_name: string | null
          created_at: string
          discount_amount: number
          discount_rate: number
          due_date: string | null
          id: string
          internal_notes: string | null
          invoice_number: string
          linked_quote_id: string | null
          linked_sales_order_id: string | null
          notes: string | null
          paid_at: string | null
          payment_terms: string | null
          picked_up_at: string | null
          sent_at: string | null
          show_sku: boolean
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
          contact_person_name?: string | null
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number: string
          linked_quote_id?: string | null
          linked_sales_order_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          picked_up_at?: string | null
          sent_at?: string | null
          show_sku?: boolean
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
          contact_person_name?: string | null
          created_at?: string
          discount_amount?: number
          discount_rate?: number
          due_date?: string | null
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          linked_quote_id?: string | null
          linked_sales_order_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_terms?: string | null
          picked_up_at?: string | null
          sent_at?: string | null
          show_sku?: boolean
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
            foreignKeyName: "sales_linked_quote_id_fkey"
            columns: ["linked_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_linked_sales_order_id_fkey"
            columns: ["linked_sales_order_id"]
            isOneToOne: false
            referencedRelation: "quotes"
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
      signup_requests_log: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      so_item_attachments: {
        Row: {
          child_quote_item_id: string
          child_unit_index: number
          created_at: string
          id: string
          parent_quote_item_id: string
          parent_unit_index: number
          quote_id: string
          updated_at: string
        }
        Insert: {
          child_quote_item_id: string
          child_unit_index?: number
          created_at?: string
          id?: string
          parent_quote_item_id: string
          parent_unit_index?: number
          quote_id: string
          updated_at?: string
        }
        Update: {
          child_quote_item_id?: string
          child_unit_index?: number
          created_at?: string
          id?: string
          parent_quote_item_id?: string
          parent_unit_index?: number
          quote_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_item_attachments_child_quote_item_id_fkey"
            columns: ["child_quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_item_attachments_parent_quote_item_id_fkey"
            columns: ["parent_quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_item_attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
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
      storefront_categories: {
        Row: {
          category_name: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_settings: {
        Row: {
          accent_color: string | null
          announcement_text: string | null
          background_blur: number | null
          background_color: string | null
          background_image_url: string | null
          background_overlay_opacity: number | null
          button_color: string | null
          cart_message: string | null
          contact_button_text: string | null
          contact_button_url: string | null
          created_at: string
          enable_categories: boolean | null
          enable_search: boolean | null
          grid_columns: number | null
          header_banner_url: string | null
          header_bg_color: string | null
          header_nav_color: string | null
          header_text_color: string | null
          id: string
          link_button_text: string | null
          link_button_url: string | null
          logo_url: string | null
          organization_id: string | null
          primary_color: string | null
          product_card_bg_color: string | null
          product_card_spacing: string | null
          product_image_shape: string | null
          secondary_color: string | null
          show_featured_section: boolean | null
          show_prices: boolean | null
          store_name: string
          tagline: string | null
          text_color: string | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          accent_color?: string | null
          announcement_text?: string | null
          background_blur?: number | null
          background_color?: string | null
          background_image_url?: string | null
          background_overlay_opacity?: number | null
          button_color?: string | null
          cart_message?: string | null
          contact_button_text?: string | null
          contact_button_url?: string | null
          created_at?: string
          enable_categories?: boolean | null
          enable_search?: boolean | null
          grid_columns?: number | null
          header_banner_url?: string | null
          header_bg_color?: string | null
          header_nav_color?: string | null
          header_text_color?: string | null
          id?: string
          link_button_text?: string | null
          link_button_url?: string | null
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          product_card_bg_color?: string | null
          product_card_spacing?: string | null
          product_image_shape?: string | null
          secondary_color?: string | null
          show_featured_section?: boolean | null
          show_prices?: boolean | null
          store_name?: string
          tagline?: string | null
          text_color?: string | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          accent_color?: string | null
          announcement_text?: string | null
          background_blur?: number | null
          background_color?: string | null
          background_image_url?: string | null
          background_overlay_opacity?: number | null
          button_color?: string | null
          cart_message?: string | null
          contact_button_text?: string | null
          contact_button_url?: string | null
          created_at?: string
          enable_categories?: boolean | null
          enable_search?: boolean | null
          grid_columns?: number | null
          header_banner_url?: string | null
          header_bg_color?: string | null
          header_nav_color?: string | null
          header_text_color?: string | null
          id?: string
          link_button_text?: string | null
          link_button_url?: string | null
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          product_card_bg_color?: string | null
          product_card_spacing?: string | null
          product_image_shape?: string | null
          secondary_color?: string | null
          show_featured_section?: boolean | null
          show_prices?: boolean | null
          store_name?: string
          tagline?: string | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storefront_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      tax_documents: {
        Row: {
          bank_card_id: string | null
          created_at: string
          extracted_date: string | null
          extracted_gst: number | null
          extracted_total: number | null
          extracted_vendor: string | null
          extraction_status: string | null
          file_name: string | null
          file_type: string
          file_url: string
          id: string
          notes: string | null
          user_id: string
          year: number
        }
        Insert: {
          bank_card_id?: string | null
          created_at?: string
          extracted_date?: string | null
          extracted_gst?: number | null
          extracted_total?: number | null
          extracted_vendor?: string | null
          extraction_status?: string | null
          file_name?: string | null
          file_type?: string
          file_url: string
          id?: string
          notes?: string | null
          user_id: string
          year?: number
        }
        Update: {
          bank_card_id?: string | null
          created_at?: string
          extracted_date?: string | null
          extracted_gst?: number | null
          extracted_total?: number | null
          extracted_vendor?: string | null
          extraction_status?: string | null
          file_name?: string | null
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_documents_bank_card_id_fkey"
            columns: ["bank_card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          amount_unit: string
          created_at: string
          display_order: number
          due_date: string | null
          id: string
          is_done: boolean
          kg_amount: number | null
          notes: string | null
          priority_group: string | null
          priority_number: number | null
          purchase_order_id: string | null
          request_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_unit?: string
          created_at?: string
          display_order?: number
          due_date?: string | null
          id?: string
          is_done?: boolean
          kg_amount?: number | null
          notes?: string | null
          priority_group?: string | null
          priority_number?: number | null
          purchase_order_id?: string | null
          request_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_unit?: string
          created_at?: string
          display_order?: number
          due_date?: string | null
          id?: string
          is_done?: boolean
          kg_amount?: number | null
          notes?: string | null
          priority_group?: string | null
          priority_number?: number | null
          purchase_order_id?: string | null
          request_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trailer_lengths: {
        Row: {
          allowed_axle_counts: number[]
          compatible_trailer_subtype_ids: string[]
          compatible_trailer_type_ids: string[]
          created_at: string
          id: string
          label: string
          model_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_axle_counts?: number[]
          compatible_trailer_subtype_ids?: string[]
          compatible_trailer_type_ids?: string[]
          created_at?: string
          id?: string
          label: string
          model_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_axle_counts?: number[]
          compatible_trailer_subtype_ids?: string[]
          compatible_trailer_type_ids?: string[]
          created_at?: string
          id?: string
          label?: string
          model_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trailer_subtypes: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          model_code: string | null
          name: string
          trailer_type_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          model_code?: string | null
          name: string
          trailer_type_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          model_code?: string | null
          name?: string
          trailer_type_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trailer_subtypes_trailer_type_id_fkey"
            columns: ["trailer_type_id"]
            isOneToOne: false
            referencedRelation: "trailer_types"
            referencedColumns: ["id"]
          },
        ]
      }
      trailer_types: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          model_code: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          model_code?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          model_code?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_plan_locations: {
        Row: {
          address: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          notes: string | null
          trip_plan_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          notes?: string | null
          trip_plan_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          notes?: string | null
          trip_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_plan_locations_trip_plan_id_fkey"
            columns: ["trip_plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_plan_pos: {
        Row: {
          created_at: string
          id: string
          location_index: number | null
          purchase_order_id: string
          trip_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_index?: number | null
          purchase_order_id: string
          trip_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_index?: number | null
          purchase_order_id?: string
          trip_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_plan_pos_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_plan_pos_trip_plan_id_fkey"
            columns: ["trip_plan_id"]
            isOneToOne: false
            referencedRelation: "trip_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_plans: {
        Row: {
          color: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feature_permissions: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      vendor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          job_position: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          job_position?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          job_position?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_files_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_links: {
        Row: {
          created_at: string
          id: string
          label: string | null
          updated_at: string
          url: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          updated_at?: string
          url: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          updated_at?: string
          url?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_links_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          category: string | null
          color: string | null
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
          category?: string | null
          color?: string | null
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
          category?: string | null
          color?: string | null
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
      worker_access_grants: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          user_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_access_grants_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          user_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_files_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_vendors: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          updated_at: string
          user_id: string
          vendor_email: string | null
          vendor_link: string | null
          vendor_name: string | null
          vendor_notes: string | null
          vendor_password: string | null
          vendor_username: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
          user_id: string
          vendor_email?: string | null
          vendor_link?: string | null
          vendor_name?: string | null
          vendor_notes?: string | null
          vendor_password?: string | null
          vendor_username?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          vendor_email?: string | null
          vendor_link?: string | null
          vendor_name?: string | null
          vendor_notes?: string | null
          vendor_password?: string | null
          vendor_username?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_vendors_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          hourly_rate: number | null
          id: string
          job_title: string | null
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
          vendor_email: string | null
          vendor_link: string | null
          vendor_name: string | null
          vendor_notes: string | null
          vendor_password: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          job_title?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          vendor_email?: string | null
          vendor_link?: string | null
          vendor_name?: string | null
          vendor_notes?: string | null
          vendor_password?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          hourly_rate?: number | null
          id?: string
          job_title?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          vendor_email?: string | null
          vendor_link?: string | null
          vendor_name?: string | null
          vendor_notes?: string | null
          vendor_password?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_column_permission: {
        Args: { _column_id: string; _user_id: string }
        Returns: string
      }
      has_board_access: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_worker_access: {
        Args: { _user_id: string; _worker_id: string }
        Returns: boolean
      }
      is_board_manager: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_admin_of_user: {
        Args: { _admin_id: string; _target_user_id: string }
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
      is_worker_org_admin: {
        Args: { _user_id: string; _worker_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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

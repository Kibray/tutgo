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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_name: string | null
          client_phone: string | null
          client_user_id: string | null
          created_at: string
          end_time: string
          id: string
          location_id: string
          service_id: string | null
          staff_id: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          location_id: string
          service_id?: string | null
          staff_id?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          location_id?: string
          service_id?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          item_id: string | null
          item_name: string | null
          order_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string | null
          order_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string | null
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "cafe_order_ratings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafe_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_orders: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string | null
          discount: number | null
          final_amount: number | null
          id: string
          items: Json
          location_id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          served_at: string | null
          status: string
          table_id: string | null
          table_number: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string | null
          discount?: number | null
          final_amount?: number | null
          id?: string
          items?: Json
          location_id: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          served_at?: string | null
          status?: string
          table_id?: string | null
          table_number?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string | null
          discount?: number | null
          final_amount?: number | null
          id?: string
          items?: Json
          location_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          served_at?: string | null
          status?: string
          table_id?: string | null
          table_number?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "cafe_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_tables: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          is_active: boolean | null
          location_id: string
          qr_code: string | null
          status: string | null
          table_number: number
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_id: string
          qr_code?: string | null
          status?: string | null
          table_number: number
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_id?: string
          qr_code?: string | null
          status?: string | null
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "cafe_tables_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          subcategories: Json | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          subcategories?: Json | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          subcategories?: Json | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_trips: {
        Row: {
          amenities: string[] | null
          available_seats: number | null
          car_color: string | null
          car_model: string | null
          created_at: string | null
          departure_datetime: string | null
          driver_id: string
          from_city: string
          id: string
          price: number | null
          status: string | null
          to_city: string
        }
        Insert: {
          amenities?: string[] | null
          available_seats?: number | null
          car_color?: string | null
          car_model?: string | null
          created_at?: string | null
          departure_datetime?: string | null
          driver_id: string
          from_city: string
          id?: string
          price?: number | null
          status?: string | null
          to_city: string
        }
        Update: {
          amenities?: string[] | null
          available_seats?: number | null
          car_color?: string | null
          car_model?: string | null
          created_at?: string | null
          departure_datetime?: string | null
          driver_id?: string
          from_city?: string
          id?: string
          price?: number | null
          status?: string | null
          to_city?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          location_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          location_id: string
          min_stock: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          min_stock?: number
          name: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          min_stock?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_operations: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          note: string | null
          operation_type: string
          performed_by: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          note?: string | null
          operation_type?: string
          performed_by?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          note?: string | null
          operation_type?: string
          performed_by?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_operations_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          amenities: Json | null
          branded_icon_url: string | null
          business_type: string
          category_id: string | null
          city: string | null
          created_at: string
          currency: string | null
          description: string | null
          gallery: string[] | null
          id: string
          is_promoted: boolean | null
          lat: number | null
          lng: number | null
          metadata: Json | null
          name: string
          owner_id: string
          phone: string | null
          price_from: number | null
          queue_enabled: boolean
          rating: number | null
          review_count: number | null
          slug: string | null
          sub_category: string | null
          telegram: string | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          branded_icon_url?: string | null
          business_type?: string
          category_id?: string | null
          city?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          gallery?: string[] | null
          id?: string
          is_promoted?: boolean | null
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name: string
          owner_id: string
          phone?: string | null
          price_from?: number | null
          queue_enabled?: boolean
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          sub_category?: string | null
          telegram?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          branded_icon_url?: string | null
          business_type?: string
          category_id?: string | null
          city?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          gallery?: string[] | null
          id?: string
          is_promoted?: boolean | null
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string
          phone?: string | null
          price_from?: number | null
          queue_enabled?: boolean
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          sub_category?: string | null
          telegram?: string | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          location_id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          location_id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          location_id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_combos: {
        Row: {
          available_from: string | null
          available_until: string | null
          combo_price: number
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean | null
          items: Json
          location_id: string
          name: string
          original_price: number
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          combo_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          location_id: string
          name: string
          original_price?: number
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          combo_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          location_id?: string
          name?: string
          original_price?: number
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_combos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: Json | null
          available_from: string | null
          available_until: string | null
          calories: number | null
          category_id: string | null
          chef_note: string | null
          cook_time_minutes: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          ingredients: Json | null
          is_available: boolean | null
          is_spicy: boolean | null
          is_vegetarian: boolean | null
          location_id: string
          name: string
          origin_country: string | null
          photo_url: string | null
          preparation_steps: Json | null
          price: number
          recipe_visible: boolean | null
          sort_order: number | null
          story: string | null
          updated_at: string
          weight: string | null
        }
        Insert: {
          allergens?: Json | null
          available_from?: string | null
          available_until?: string | null
          calories?: number | null
          category_id?: string | null
          chef_note?: string | null
          cook_time_minutes?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          ingredients?: Json | null
          is_available?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          location_id: string
          name: string
          origin_country?: string | null
          photo_url?: string | null
          preparation_steps?: Json | null
          price?: number
          recipe_visible?: boolean | null
          sort_order?: number | null
          story?: string | null
          updated_at?: string
          weight?: string | null
        }
        Update: {
          allergens?: Json | null
          available_from?: string | null
          available_until?: string | null
          calories?: number | null
          category_id?: string | null
          chef_note?: string | null
          cook_time_minutes?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          ingredients?: Json | null
          is_available?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          location_id?: string
          name?: string
          origin_country?: string | null
          photo_url?: string | null
          preparation_steps?: Json | null
          price?: number
          recipe_visible?: boolean | null
          sort_order?: number | null
          story?: string | null
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_modifiers: {
        Row: {
          created_at: string
          id: string
          item_id: string
          name: string
          options: Json
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          name: string
          options?: Json
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          name?: string
          options?: Json
        }
        Relationships: [
          {
            foreignKeyName: "menu_modifiers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          address: string
          category: string
          company_name: string
          created_at: string
          description: string | null
          id: string
          instagram: string | null
          phone: string
          status: string
          user_id: string
        }
        Insert: {
          address: string
          category: string
          company_name: string
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          phone: string
          status?: string
          user_id: string
        }
        Update: {
          address?: string
          category?: string
          company_name?: string
          created_at?: string
          description?: string | null
          id?: string
          instagram?: string | null
          phone?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dark_mode: boolean
          display_name: string | null
          id: string
          language: string
          notifications_enabled: boolean
          notify_cancelled: boolean
          notify_confirmed: boolean
          notify_deals: boolean
          notify_reminder: boolean
          partner_terms_accepted: boolean
          partner_terms_accepted_at: string | null
          phone: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          telegram_chat_id: number | null
          telegram_username: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean
          display_name?: string | null
          id?: string
          language?: string
          notifications_enabled?: boolean
          notify_cancelled?: boolean
          notify_confirmed?: boolean
          notify_deals?: boolean
          notify_reminder?: boolean
          partner_terms_accepted?: boolean
          partner_terms_accepted_at?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          telegram_chat_id?: number | null
          telegram_username?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dark_mode?: boolean
          display_name?: string | null
          id?: string
          language?: string
          notifications_enabled?: boolean
          notify_cancelled?: boolean
          notify_confirmed?: boolean
          notify_deals?: boolean
          notify_reminder?: boolean
          partner_terms_accepted?: boolean
          partner_terms_accepted_at?: string | null
          phone?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          telegram_chat_id?: number | null
          telegram_username?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue_tickets: {
        Row: {
          called_at: string | null
          client_name: string | null
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          location_id: string
          queue_date: string
          status: string
          ticket_number: number
          user_id: string | null
        }
        Insert: {
          called_at?: string | null
          client_name?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          location_id: string
          queue_date?: string
          status?: string
          ticket_number: number
          user_id?: string | null
        }
        Update: {
          called_at?: string | null
          client_name?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          location_id?: string
          queue_date?: string
          status?: string
          ticket_number?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_tickets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          clicked_at: string
          converted: boolean
          converted_user_id: string | null
          id: string
          ip_address: string | null
          location_slug: string | null
          referral_code: string
          referral_type: string
        }
        Insert: {
          clicked_at?: string
          converted?: boolean
          converted_user_id?: string | null
          id?: string
          ip_address?: string | null
          location_slug?: string | null
          referral_code: string
          referral_type?: string
        }
        Update: {
          clicked_at?: string
          converted?: boolean
          converted_user_id?: string | null
          id?: string
          ip_address?: string | null
          location_slug?: string | null
          referral_code?: string
          referral_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          id: string
          location_id: string
          rating: number
          staff_id: string | null
          user_id: string
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          location_id: string
          rating: number
          staff_id?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          location_id?: string
          rating?: number
          staff_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number
          id: string
          location_id: string
          max_seats: number | null
          metadata: Json | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location_id: string
          max_seats?: number | null
          metadata?: Json | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location_id?: string
          max_seats?: number | null
          metadata?: Json | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          full_name: string
          id: string
          location_id: string
          phone: string | null
          photo_url: string | null
          specialties: string[] | null
          updated_at: string
          working_days: number[] | null
          working_hours: Json | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          location_id: string
          phone?: string | null
          photo_url?: string | null
          specialties?: string[] | null
          updated_at?: string
          working_days?: number[] | null
          working_hours?: Json | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          location_id?: string
          phone?: string | null
          photo_url?: string | null
          specialties?: string[] | null
          updated_at?: string
          working_days?: number[] | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string | null
          guests: number | null
          id: string
          nights: number | null
          room_id: string | null
          status: string | null
          stay_id: string
          total_price: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string | null
          guests?: number | null
          id?: string
          nights?: number | null
          room_id?: string | null
          status?: string | null
          stay_id: string
          total_price?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string | null
          guests?: number | null
          id?: string
          nights?: number | null
          room_id?: string | null
          status?: string | null
          stay_id?: string
          total_price?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "stay_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_bookings_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_rooms: {
        Row: {
          amenities: string[] | null
          area_sqm: number | null
          bed_type: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          max_guests: number | null
          name: string
          photos: string[] | null
          price_per_night: number | null
          stay_id: string
        }
        Insert: {
          amenities?: string[] | null
          area_sqm?: number | null
          bed_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          max_guests?: number | null
          name: string
          photos?: string[] | null
          price_per_night?: number | null
          stay_id: string
        }
        Update: {
          amenities?: string[] | null
          area_sqm?: number | null
          bed_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          max_guests?: number | null
          name?: string
          photos?: string[] | null
          price_per_night?: number | null
          stay_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_rooms_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
        ]
      }
      stays: {
        Row: {
          address: string | null
          amenities: string[] | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          location_id: string | null
          max_guests: number | null
          min_nights: number | null
          name: string
          photos: string[] | null
          price_per_night: number | null
          rating: number | null
          reviews_count: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          max_guests?: number | null
          min_nights?: number | null
          name: string
          photos?: string[] | null
          price_per_night?: number | null
          rating?: number | null
          reviews_count?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          location_id?: string | null
          max_guests?: number | null
          min_nights?: number | null
          name?: string
          photos?: string[] | null
          price_per_night?: number | null
          rating?: number | null
          reviews_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stays_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      table_reservations: {
        Row: {
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          currency: string
          date: string
          guests_count: number
          id: string
          location_id: string
          notes: string | null
          pre_order: Json | null
          status: string
          time: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          currency?: string
          date: string
          guests_count?: number
          id?: string
          location_id: string
          notes?: string | null
          pre_order?: Json | null
          status?: string
          time: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          currency?: string
          date?: string
          guests_count?: number
          id?: string
          location_id?: string
          notes?: string | null
          pre_order?: Json | null
          status?: string
          time?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_reservations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_auth_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          telegram_chat_id: number
          telegram_first_name: string | null
          telegram_username: string | null
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          telegram_chat_id: number
          telegram_first_name?: string | null
          telegram_username?: string | null
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          telegram_chat_id?: number
          telegram_first_name?: string | null
          telegram_username?: string | null
          used?: boolean
        }
        Relationships: []
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          adults: number | null
          children: number | null
          created_at: string | null
          id: string
          selected_date: string
          status: string | null
          total_price: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adults?: number | null
          children?: number | null
          created_at?: string | null
          id?: string
          selected_date: string
          status?: string | null
          total_price?: number | null
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adults?: number | null
          children?: number | null
          created_at?: string | null
          id?: string
          selected_date?: string
          status?: string | null
          total_price?: number | null
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          available_dates: string[] | null
          category: string | null
          created_at: string | null
          departure_city: string | null
          description: string | null
          destinations: string[] | null
          duration_days: number | null
          excludes: string[] | null
          highlights: Json | null
          id: string
          includes: string[] | null
          is_active: boolean | null
          location_id: string | null
          max_people: number | null
          min_people: number | null
          photos: string[] | null
          price_child: number | null
          price_per_person: number | null
          program: Json | null
          rating: number | null
          reviews_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          available_dates?: string[] | null
          category?: string | null
          created_at?: string | null
          departure_city?: string | null
          description?: string | null
          destinations?: string[] | null
          duration_days?: number | null
          excludes?: string[] | null
          highlights?: Json | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          location_id?: string | null
          max_people?: number | null
          min_people?: number | null
          photos?: string[] | null
          price_child?: number | null
          price_per_person?: number | null
          program?: Json | null
          rating?: number | null
          reviews_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          available_dates?: string[] | null
          category?: string | null
          created_at?: string | null
          departure_city?: string | null
          description?: string | null
          destinations?: string[] | null
          duration_days?: number | null
          excludes?: string[] | null
          highlights?: Json | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          location_id?: string | null
          max_people?: number | null
          min_people?: number | null
          photos?: string[] | null
          price_child?: number | null
          price_per_person?: number | null
          program?: Json | null
          rating?: number | null
          reviews_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_bookings: {
        Row: {
          created_at: string | null
          id: string
          passenger_name: string | null
          passenger_phone: string | null
          route_id: string
          seats: number | null
          status: string | null
          total_price: number | null
          travel_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          passenger_name?: string | null
          passenger_phone?: string | null
          route_id: string
          seats?: number | null
          status?: string | null
          total_price?: number | null
          travel_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          passenger_name?: string | null
          passenger_phone?: string | null
          route_id?: string
          seats?: number | null
          status?: string | null
          total_price?: number | null
          travel_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_bookings_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          amenities: string[] | null
          arrival_time: string | null
          available_seats: number | null
          created_at: string | null
          departure_time: string | null
          duration_minutes: number | null
          from_city: string
          id: string
          is_active: boolean | null
          location_id: string | null
          price_per_seat: number | null
          to_city: string
          total_seats: number | null
          transport_name: string | null
          transport_type: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          arrival_time?: string | null
          available_seats?: number | null
          created_at?: string | null
          departure_time?: string | null
          duration_minutes?: number | null
          from_city: string
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          price_per_seat?: number | null
          to_city: string
          total_seats?: number | null
          transport_name?: string | null
          transport_type?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          arrival_time?: string | null
          available_seats?: number | null
          created_at?: string | null
          departure_time?: string | null
          duration_minutes?: number | null
          from_city?: string
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          price_per_seat?: number | null
          to_city?: string
          total_seats?: number | null
          transport_name?: string | null
          transport_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          feature: string | null
          id: string
          telegram_username: string | null
        }
        Insert: {
          created_at?: string | null
          feature?: string | null
          id?: string
          telegram_username?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: string | null
          id?: string
          telegram_username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      become_partner: { Args: never; Returns: undefined }
      generate_slug: { Args: { name: string }; Returns: string }
      get_queue_stats: {
        Args: { p_date?: string; p_location_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "partner"
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
      app_role: ["admin", "moderator", "user", "partner"],
    },
  },
} as const

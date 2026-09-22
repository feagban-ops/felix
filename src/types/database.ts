export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bottles: {
        Row: {
          base_xp: number | null
          brand: string
          created_at: string
          format: string | null
          id: string
          image_url: string | null
          name: string
          rarity_tier: Database["public"]["Enums"]["rarity_tier"]
          status: Database["public"]["Enums"]["price_status"] | null
          submitted_by: string | null
          suggested_by_ai: boolean
        }
        Insert: {
          base_xp?: number | null
          brand: string
          created_at?: string
          format?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity_tier?: Database["public"]["Enums"]["rarity_tier"]
          status?: Database["public"]["Enums"]["price_status"] | null
          submitted_by?: string | null
          suggested_by_ai?: boolean
        }
        Update: {
          base_xp?: number | null
          brand?: string
          created_at?: string
          format?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity_tier?: Database["public"]["Enums"]["rarity_tier"]
          status?: Database["public"]["Enums"]["price_status"] | null
          submitted_by?: string | null
          suggested_by_ai?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bottles_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          bottle_id: string
          first_obtained_at: string
          id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          bottle_id: string
          first_obtained_at?: string
          id?: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          bottle_id?: string
          first_obtained_at?: string
          id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_bottle_id_fkey"
            columns: ["bottle_id"]
            isOneToOne: false
            referencedRelation: "bottles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: Database["public"]["Enums"]["friendship_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: Database["public"]["Enums"]["friendship_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_bottles: {
        Row: {
          bottle_id: string
          id: string
          outing_id: string
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          bottle_id: string
          id?: string
          outing_id: string
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          bottle_id?: string
          id?: string
          outing_id?: string
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outing_bottles_bottle_id_fkey"
            columns: ["bottle_id"]
            isOneToOne: false
            referencedRelation: "bottles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_bottles_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_biggest_outing"
            referencedColumns: ["outing_id"]
          },
          {
            foreignKeyName: "outing_bottles_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outings"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_participants: {
        Row: {
          joined_at: string
          outing_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          outing_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          outing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outing_participants_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_biggest_outing"
            referencedColumns: ["outing_id"]
          },
          {
            foreignKeyName: "outing_participants_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outings: {
        Row: {
          closed_at: string | null
          created_at: string
          currency: string | null
          id: string
          is_private: boolean | null
          owner_id: string
          photo_url: string | null
          total_price: number | null
          venue_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_private?: boolean | null
          owner_id: string
          photo_url?: string | null
          total_price?: number | null
          venue_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_private?: boolean | null
          owner_id?: string
          photo_url?: string | null
          total_price?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          avatar_url: string | null
          created_at: string
          id: string
          is_admin: boolean | null
          is_private: boolean | null
          level: number | null
          username: string | null
          xp: number | null
        }
        Insert: {
          age_verified?: boolean | null
          avatar_url?: string | null
          created_at?: string
          id: string
          is_admin?: boolean | null
          is_private?: boolean | null
          level?: number | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          age_verified?: boolean | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean | null
          is_private?: boolean | null
          level?: number | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          bottle_id: string
          created_at: string
          currency: string | null
          id: string
          outing_id: string | null
          price_paid: number
          purchased_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          bottle_id: string
          created_at?: string
          currency?: string | null
          id?: string
          outing_id?: string | null
          price_paid: number
          purchased_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          bottle_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          outing_id?: string | null
          price_paid?: number
          purchased_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_bottle_id_fkey"
            columns: ["bottle_id"]
            isOneToOne: false
            referencedRelation: "bottles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_biggest_outing"
            referencedColumns: ["outing_id"]
          },
          {
            foreignKeyName: "purchases_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_bottle_prices: {
        Row: {
          bottle_id: string
          currency: string | null
          id: string
          price: number
          status: Database["public"]["Enums"]["price_status"] | null
          submitted_by: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          bottle_id: string
          currency?: string | null
          id?: string
          price: number
          status?: Database["public"]["Enums"]["price_status"] | null
          submitted_by?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          bottle_id?: string
          currency?: string | null
          id?: string
          price?: number
          status?: Database["public"]["Enums"]["price_status"] | null
          submitted_by?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_bottle_prices_bottle_id_fkey"
            columns: ["bottle_id"]
            isOneToOne: false
            referencedRelation: "bottles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bottle_prices_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bottle_prices_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          city: string
          country: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          region: Database["public"]["Enums"]["region_zone"]
          verified: boolean | null
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          region?: Database["public"]["Enums"]["region_zone"]
          verified?: boolean | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          region?: Database["public"]["Enums"]["region_zone"]
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_biggest_outing: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          outing_id: string | null
          region: Database["public"]["Enums"]["region_zone"] | null
          total_price: number | null
          user_id: string | null
          username: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outings_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_rarity_score: {
        Row: {
          epic_count: number | null
          legendary_count: number | null
          rare_count: number | null
          rarity_score: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_spending_monthly: {
        Row: {
          city: string | null
          country: string | null
          month: string | null
          region: Database["public"]["Enums"]["region_zone"] | null
          total_spent: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outings_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_spending_yearly: {
        Row: {
          city: string | null
          country: string | null
          region: Database["public"]["Enums"]["region_zone"] | null
          total_spent: number | null
          user_id: string | null
          username: string | null
          year: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outings_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_level: { Args: { xp: number }; Returns: number }
      can_view_outing: { Args: { p_outing_id: string }; Returns: boolean }
      close_outing_atomically: {
        Args: { p_outing_id: string; p_user_id: string }
        Returns: Json
      }
      count_recent_bottle_submissions: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_purchase_atomically: {
        Args: {
          p_bottle_id: string
          p_outing_id?: string
          p_user_id: string
          p_venue_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      friendship_status: "pending" | "accepted"
      price_status: "pending" | "approved" | "rejected"
      rarity_tier: "commune" | "rare" | "epique" | "legendaire"
      region_zone: "france" | "europe" | "asie" | "ameriques" | "autre"
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
    Enums: {
      friendship_status: ["pending", "accepted"],
      price_status: ["pending", "approved", "rejected"],
      rarity_tier: ["commune", "rare", "epique", "legendaire"],
      region_zone: ["france", "europe", "asie", "ameriques", "autre"],
    },
  },
} as const

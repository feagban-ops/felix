export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RegionZone = 'france' | 'europe' | 'asie' | 'ameriques' | 'autre'
export type RarityTier = 'commune' | 'rare' | 'epique' | 'legendaire'
export type PriceStatus = 'pending' | 'approved' | 'rejected'
export type FriendshipStatus = 'pending' | 'accepted'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          xp: number
          level: number
          age_verified: boolean
          is_private: boolean
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          age_verified?: boolean
          is_private?: boolean
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          age_verified?: boolean
          is_private?: boolean
          is_admin?: boolean
          created_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          city: string
          country: string
          region: RegionZone
          created_by: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city: string
          country: string
          region?: RegionZone
          created_by?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          country?: string
          region?: RegionZone
          created_by?: string | null
          verified?: boolean
          created_at?: string
        }
      }
      bottles: {
        Row: {
          id: string
          brand: string
          name: string
          format: string | null
          rarity_tier: RarityTier
          base_xp: number
          image_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          submitted_by: string | null
          suggested_by_ai: boolean
          created_at: string
        }
        Insert: {
          id?: string
          brand: string
          name: string
          format?: string | null
          rarity_tier?: RarityTier
          base_xp?: number
          image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_by?: string | null
          suggested_by_ai?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          brand?: string
          name?: string
          format?: string | null
          rarity_tier?: RarityTier
          base_xp?: number
          image_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_by?: string | null
          suggested_by_ai?: boolean
          created_at?: string
        }
      }
      venue_bottle_prices: {
        Row: {
          id: string
          venue_id: string
          bottle_id: string
          price: number
          currency: string
          status: PriceStatus
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          bottle_id: string
          price: number
          currency?: string
          status?: PriceStatus
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          bottle_id?: string
          price?: number
          currency?: string
          status?: PriceStatus
          submitted_by?: string | null
          updated_at?: string
        }
      }
      outings: {
        Row: {
          id: string
          owner_id: string
          venue_id: string
          photo_url: string | null
          total_price: number
          currency: string
          is_private: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          venue_id: string
          photo_url?: string | null
          total_price?: number
          currency?: string
          is_private?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          venue_id?: string
          photo_url?: string | null
          total_price?: number
          currency?: string
          is_private?: boolean
          created_at?: string
        }
      }
      outing_bottles: {
        Row: {
          id: string
          outing_id: string
          bottle_id: string
          quantity: number
          unit_price: number | null
        }
        Insert: {
          id?: string
          outing_id: string
          bottle_id: string
          quantity?: number
          unit_price?: number | null
        }
        Update: {
          id?: string
          outing_id?: string
          bottle_id?: string
          quantity?: number
          unit_price?: number | null
        }
      }
      outing_participants: {
        Row: {
          outing_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          outing_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          outing_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: FriendshipStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: FriendshipStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: FriendshipStatus
          created_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          bottle_id: string
          quantity: number
          first_obtained_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bottle_id: string
          quantity?: number
          first_obtained_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bottle_id?: string
          quantity?: number
          first_obtained_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          bottle_id: string
          venue_id: string
          outing_id: string | null
          price_paid: number
          currency: string
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bottle_id: string
          venue_id: string
          outing_id?: string | null
          price_paid: number
          currency?: string
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bottle_id?: string
          venue_id?: string
          outing_id?: string | null
          price_paid?: number
          currency?: string
          purchased_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: string | null
          plan: string | null
          current_period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string | null
          plan?: string | null
          current_period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: string | null
          plan?: string | null
          current_period_end?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      leaderboard_spending_monthly: {
        Row: {
          user_id: string
          username: string | null
          total_spent: number
          month: string
          region: RegionZone
          country: string
          city: string
        }
      }
      leaderboard_spending_yearly: {
        Row: {
          user_id: string
          username: string | null
          total_spent: number
          year: string
          region: RegionZone
          country: string
          city: string
        }
      }
      leaderboard_biggest_outing: {
        Row: {
          outing_id: string
          user_id: string
          username: string | null
          total_price: number
          currency: string
          venue_name: string
          region: RegionZone
          country: string
          city: string
          created_at: string
        }
      }
      leaderboard_rarity_score: {
        Row: {
          user_id: string
          username: string | null
          rare_count: number
          epic_count: number
          legendary_count: number
          rarity_score: number
        }
      }
    }
    Functions: {
      calculate_level: {
        Args: {
          xp: number
        }
        Returns: number
      }
    }
    Enums: {
      region_zone: RegionZone
      rarity_tier: RarityTier
      price_status: PriceStatus
      friendship_status: FriendshipStatus
    }
  }
}

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export const createServerClient = () => {
  const cookieStore = cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware
            // s'occupe de rafraîchir la session
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options)
          } catch {
            // Idem
          }
        },
      },
    }
  )
}

export const createServiceClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

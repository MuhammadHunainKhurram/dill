// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Read-only Supabase client for Server Components (page/layout/etc).
 * Do not call auth.setSession() here. Cookie writes are disabled.
 */
export function createServerSupabaseReadOnly() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op in Server Components
        },
        remove() {
          // no-op in Server Components
        },
      },
    }
  );
}


export function createServerSupabaseForRoute() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

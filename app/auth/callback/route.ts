import { NextResponse } from "next/server";
import { createServerSupabaseReadOnly } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = createServerSupabaseReadOnly();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", request.url));
}

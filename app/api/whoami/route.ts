// app/api/whoami/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Auth removed - return mock user data
  return NextResponse.json({ 
    ok: true, 
    user: { id: "anonymous", email: "anonymous@example.com" }, 
    error: null 
  });
}

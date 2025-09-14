import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    user: { id: "anonymous", email: "anonymous@example.com" }, 
    error: null 
  });
}

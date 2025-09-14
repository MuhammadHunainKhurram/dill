import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const at = cookies().get("g_at")?.value || "";
  return NextResponse.json({ ok: true, authed: !!at });
}

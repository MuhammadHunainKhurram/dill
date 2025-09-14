import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/education";
  const authUrl = getAuthUrl(next);
  return NextResponse.json({ ok: true, url: authUrl });
}

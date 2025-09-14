import { NextResponse } from "next/server";
import { setTokensFromCode } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "/education";
  if (!code) return NextResponse.redirect(new URL(state, url));
  try {
    await setTokensFromCode(code);
    return NextResponse.redirect(new URL(state + "?google=1", url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(state + "?google_error=" + encodeURIComponent(e.message || "auth_failed"), url));
  }
}

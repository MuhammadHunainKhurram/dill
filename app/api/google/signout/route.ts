import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const jar = cookies();
  ["g_at", "g_rt", "g_exp"].forEach((n) =>
    jar.set(n, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 })
  );
  return NextResponse.json({ ok: true });
}

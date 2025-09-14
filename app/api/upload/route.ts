import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ ok: false, error: "only PDF accepted" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomUUID();
    const safeName = file.name.replace(/\s+/g, "_");
    const relPath = `${id}_${safeName}`;

    await ensureDir(UPLOAD_DIR);
    await fs.writeFile(path.join(UPLOAD_DIR, relPath), buf);

    return NextResponse.json({
      ok: true,
      path: relPath,
      name: file.name,
      size: buf.length,
      content_type: file.type,
    });
  } catch (err: any) {
    console.error("UPLOAD_ERROR", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

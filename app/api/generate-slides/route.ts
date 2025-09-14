import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateSlidesFromPDF } from "@/lib/pdf-slides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();

    const form = await req.formData();

    // (optional) accept tokens from client and set session
    const access_token = (form.get("access_token") as string) || "";
    const refresh_token = (form.get("refresh_token") as string) || "";
    if (access_token) {
      const { error: setErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (setErr) {
        return NextResponse.json({ ok: false, error: setErr.message }, { status: 401 });
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const file = form.get("file") as File | null;
    const numSlides = parseInt((form.get("numSlides") as string) || "5");
    
    if (!file) return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ ok: false, error: "only PDF accepted" }, { status: 400 });
    }

    // Read bytes from uploaded File
    const ab = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(ab);

    // Generate slides using Anthropic
    const slideResult = await generateSlidesFromPDF(pdfBuffer, numSlides, file.name);
    
    if (!slideResult.success) {
      return NextResponse.json({ ok: false, error: slideResult.error }, { status: 500 });
    }

    // Build output for storage
    const now = Date.now();
    const safeName = file.name.replace(/\s+/g, "_").replace(/\.pdf$/i, "");
    const storagePath = `${user.id}/${now}_${safeName}_slides.json`;

    const slideData = {
      original_name: file.name,
      num_slides: numSlides,
      generated_at: new Date().toISOString(),
      slides: slideResult.slides,
    };

    const blob = new Blob([JSON.stringify(slideData, null, 2)], { type: "application/json" });

    // Upload to storage
    const up = await supabase.storage.from("parsed").upload(storagePath, blob, {
      contentType: "application/json",
      upsert: false,
    });
    if (up.error) throw up.error;

    // Insert DB row
    const ins = await supabase
      .from("parsed_documents")
      .insert({
        user_id: user.id,
        original_name: `${file.name} (${numSlides} slides)`,
        path: storagePath,
        content_type: "application/json",
        page_count: numSlides,
        char_count: slideResult.slides?.length || 0,
      })
      .select("id")
      .single();
    if (ins.error) throw ins.error;

    return NextResponse.json({ 
      ok: true, 
      id: ins.data.id, 
      path: storagePath, 
      slides: slideResult.slides,
      numSlides 
    });
  } catch (err: any) {
    console.error("SLIDE_GENERATION_ERROR", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown server error" }, { status: 500 });
  }
}

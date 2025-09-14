import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    node: process.version,
    platform: process.platform,
    totalMem: os.totalmem(),
    uptimeSec: Math.round(process.uptime()),
  });
}

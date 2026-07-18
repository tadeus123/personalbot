import { NextResponse } from "next/server";
import { getBotManifest } from "@/lib/bot/engine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const manifest = await getBotManifest(id);

  if (!manifest) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json(manifest);
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: bot } = await supabase
    .from("bots")
    .select("id, name, slug, owner_profiles(display_name, timezone, work_hours)")
    .eq("id", id)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  return NextResponse.json({ bot });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = request.headers.get("X-Bot-Api-Key");
  const supabase = createAdminClient();

  const { data: bot } = await supabase
    .from("bots")
    .select("id, api_key")
    .eq("id", id)
    .single();

  if (!bot || bot.api_key !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipient_bot_id, topic } = body;

  if (!recipient_bot_id || !topic) {
    return NextResponse.json(
      { error: "recipient_bot_id and topic required" },
      { status: 400 }
    );
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      initiator_bot_id: id,
      recipient_bot_id,
      topic,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation });
}

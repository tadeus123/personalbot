import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processInstruction } from "@/lib/bot/engine";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  const { data: instruction, error } = await supabase
    .from("instructions")
    .insert({ bot_id: bot.id, content: content.trim(), status: "pending" })
    .select()
    .single();

  if (error || !instruction) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create instruction" },
      { status: 500 }
    );
  }

  try {
    const result = await processInstruction(instruction.id);
    return NextResponse.json({ instruction_id: instruction.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    return NextResponse.json(
      { instruction_id: instruction.id, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!bot) {
    return NextResponse.json({ instructions: [] });
  }

  const { data: instructions } = await supabase
    .from("instructions")
    .select("*")
    .eq("bot_id", bot.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ instructions: instructions ?? [] });
}

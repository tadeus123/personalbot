import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runNegotiation } from "@/lib/bot/engine";

export async function POST(request: Request) {
  const body = await request.json();
  const { initiator_bot_id, recipient_bot_id, topic } = body;

  if (!initiator_bot_id || !recipient_bot_id || !topic) {
    return NextResponse.json(
      { error: "initiator_bot_id, recipient_bot_id, and topic required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      initiator_bot_id,
      recipient_bot_id,
      topic,
      status: "active",
    })
    .select()
    .single();

  if (error || !conversation) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create conversation" },
      { status: 500 }
    );
  }

  const result = await runNegotiation(conversation.id, topic);

  return NextResponse.json({
    conversation_id: conversation.id,
    result,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("id");

  if (!conversationId) {
    return NextResponse.json(
      { error: "id query parameter required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ conversation, messages: messages ?? [] });
}

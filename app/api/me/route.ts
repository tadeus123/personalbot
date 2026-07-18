import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .select("*, owner_profiles(*), domains(*)")
    .eq("user_id", user.id)
    .single();

  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  const { data: instructions } = await supabase
    .from("instructions")
    .select("*")
    .eq("bot_id", bot.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `initiator_bot_id.eq.${bot.id},recipient_bot_id.eq.${bot.id}`
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    bot,
    profile: bot.owner_profiles,
    domains: bot.domains,
    instructions: instructions ?? [],
    conversations: conversations ?? [],
  });
}

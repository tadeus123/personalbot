import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeDomain } from "@/lib/bot/utils";

export async function POST(request: Request) {
  const body = await request.json();
  const { bot_id, domain } = body;

  if (!bot_id || !domain) {
    return NextResponse.json(
      { error: "bot_id and domain required" },
      { status: 400 }
    );
  }

  const normalized = normalizeDomain(domain);
  const supabase = createAdminClient();

  const { data: botDomain } = await supabase
    .from("domains")
    .select("domain")
    .eq("bot_id", bot_id)
    .eq("domain", normalized)
    .single();

  if (!botDomain) {
    return NextResponse.json({ error: "Domain not registered" }, { status: 403 });
  }

  await supabase
    .from("domains")
    .update({ verified_at: new Date().toISOString() })
    .eq("bot_id", bot_id)
    .eq("domain", normalized);

  return NextResponse.json({ ok: true, domain: normalized });
}

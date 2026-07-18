import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Bot, BotContext, Conversation, OwnerProfile } from "@/lib/types";
import {
  MAX_NEGOTIATION_ROUNDS,
  buildBotPersona,
  extractTargetFromInstruction,
  normalizeDomain,
  type NegotiationResult,
} from "./utils";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

async function loadBotContext(botId: string): Promise<BotContext | null> {
  const supabase = createAdminClient();

  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .single();

  if (!bot) return null;

  const { data: profile } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("bot_id", botId)
    .single();

  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .eq("bot_id", botId);

  return {
    bot: bot as Bot,
    profile: profile as OwnerProfile,
    domains: domains ?? [],
  };
}

async function findTargetBot(
  type: "name" | "domain",
  value: string
): Promise<BotContext | null> {
  const supabase = createAdminClient();

  if (type === "domain") {
    const domain = normalizeDomain(value);
    const { data: domainRow } = await supabase
      .from("domains")
      .select("bot_id")
      .eq("domain", domain)
      .single();

    if (!domainRow) return null;
    return loadBotContext(domainRow.bot_id);
  }

  const { data: profiles } = await supabase
    .from("owner_profiles")
    .select("*, bots(*)")
    .ilike("display_name", `%${value}%`)
    .limit(1);

  if (!profiles?.[0]) return null;
  const row = profiles[0] as OwnerProfile & { bots: Bot };
  return loadBotContext(row.bot_id);
}

async function generateBotMessage(
  ctx: BotContext,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  topic: string,
  isInitiator: boolean
): Promise<string> {
  const openai = getOpenAI();

  const systemPrompt = `${buildBotPersona(ctx)}

You are in a bot-to-bot negotiation. Topic: ${topic}
Role: ${isInitiator ? "You initiated this conversation. Propose a concrete meeting time first, then negotiate." : "You are responding to a meeting request. Evaluate proposals against your owner's availability and counter-propose if needed."}

Respond with ONLY your message to the other bot. No meta commentary. Be direct. Include specific dates/times when relevant.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return (
    response.choices[0]?.message?.content?.trim() ??
    "I need to check with my owner's schedule and get back to you."
  );
}

async function evaluateAgreement(
  messages: { content: string; sender: string }[],
  topic: string
): Promise<NegotiationResult> {
  const openai = getOpenAI();

  const transcript = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Analyze this bot-to-bot negotiation about: ${topic}

Return JSON only:
{
  "agreed": boolean,
  "summary": "brief summary of outcome",
  "proposed_time": "ISO datetime or human readable time if agreed, else null",
  "reason": "why failed if not agreed"
}`,
      },
      { role: "user", content: transcript },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as NegotiationResult;
  } catch {
    return { agreed: false, summary: "Could not parse negotiation result" };
  }
}

export async function runNegotiation(
  conversationId: string,
  topic: string
): Promise<NegotiationResult> {
  const supabase = createAdminClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const conv = conversation as Conversation;
  const initiatorCtx = await loadBotContext(conv.initiator_bot_id);
  const recipientCtx = await loadBotContext(conv.recipient_bot_id);

  if (!initiatorCtx || !recipientCtx) {
    throw new Error("Could not load bot contexts");
  }

  const transcript: { botId: string; content: string; sender: string }[] = [];

  let currentTurn: "initiator" | "recipient" = "initiator";

  for (let round = 0; round < MAX_NEGOTIATION_ROUNDS; round++) {
    const ctx = currentTurn === "initiator" ? initiatorCtx : recipientCtx;
    const isInitiator = currentTurn === "initiator";

    const history = transcript.map((entry) => ({
      role: (entry.botId === ctx.bot.id ? "assistant" : "user") as
        | "user"
        | "assistant",
      content: entry.content,
    }));

    const message = await generateBotMessage(
      ctx,
      history,
      topic,
      isInitiator && round === 0
    );

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_bot_id: ctx.bot.id,
      content: message,
    });

    transcript.push({
      botId: ctx.bot.id,
      content: message,
      sender: ctx.profile.display_name,
    });

    // Check for agreement every 2 rounds
    if (round >= 1 && round % 2 === 1) {
      const evalResult = await evaluateAgreement(
        transcript.map((t) => ({ sender: t.sender, content: t.content })),
        topic
      );
      if (evalResult.agreed) {
        await supabase
          .from("conversations")
          .update({ status: "completed", result: evalResult })
          .eq("id", conversationId);
        return evalResult;
      }
    }

    currentTurn = currentTurn === "initiator" ? "recipient" : "initiator";
  }

  const finalResult = await evaluateAgreement(
    transcript.map((t) => ({ sender: t.sender, content: t.content })),
    topic
  );
  await supabase
    .from("conversations")
    .update({
      status: finalResult.agreed ? "completed" : "failed",
      result: finalResult,
    })
    .eq("id", conversationId);

  return finalResult;
}

export async function processInstruction(
  instructionId: string
): Promise<Record<string, unknown>> {
  const supabase = createAdminClient();

  const { data: instruction } = await supabase
    .from("instructions")
    .select("*")
    .eq("id", instructionId)
    .single();

  if (!instruction) throw new Error("Instruction not found");

  await supabase
    .from("instructions")
    .update({ status: "processing" })
    .eq("id", instructionId);

  try {
    const initiatorCtx = await loadBotContext(instruction.bot_id);
    if (!initiatorCtx) throw new Error("Bot not found");

    const target = extractTargetFromInstruction(instruction.content);
    if (!target) {
      const result = {
        success: false,
        message:
          "Could not identify who to contact. Try: 'Schedule a meeting with Constantine' or mention a domain like constantine.com",
      };
      await supabase
        .from("instructions")
        .update({ status: "failed", result })
        .eq("id", instructionId);
      return result;
    }

    const recipientCtx = await findTargetBot(target.type, target.value);
    if (!recipientCtx) {
      const result = {
        success: false,
        message: `Could not find a personal bot for "${target.value}". They need to register and add their domain first.`,
      };
      await supabase
        .from("instructions")
        .update({ status: "failed", result })
        .eq("id", instructionId);
      return result;
    }

    if (recipientCtx.bot.id === initiatorCtx.bot.id) {
      const result = {
        success: false,
        message: "You cannot negotiate with your own bot.",
      };
      await supabase
        .from("instructions")
        .update({ status: "failed", result })
        .eq("id", instructionId);
      return result;
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        initiator_bot_id: initiatorCtx.bot.id,
        recipient_bot_id: recipientCtx.bot.id,
        topic: instruction.content,
        status: "active",
      })
      .select()
      .single();

    if (error || !conversation) {
      throw new Error(error?.message ?? "Failed to create conversation");
    }

    const negotiationResult = await runNegotiation(
      conversation.id,
      instruction.content
    );

    const result = {
      success: negotiationResult.agreed,
      message: negotiationResult.summary,
      conversation_id: conversation.id,
      target: recipientCtx.profile.display_name,
      proposed_time: negotiationResult.proposed_time,
      negotiation: negotiationResult,
    };

    await supabase
      .from("instructions")
      .update({ status: "completed", result })
      .eq("id", instructionId);

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("instructions")
      .update({ status: "failed", result: { success: false, message } })
      .eq("id", instructionId);
    throw err;
  }
}

export async function getBotByDomain(domain: string) {
  const supabase = createAdminClient();
  const normalized = normalizeDomain(domain);

  const { data: domainRow } = await supabase
    .from("domains")
    .select("*, bots(*, owner_profiles(*))")
    .eq("domain", normalized)
    .single();

  return domainRow;
}

export async function getBotManifest(botId: string) {
  const supabase = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: bot } = await supabase
    .from("bots")
    .select("*, owner_profiles(*), domains(*)")
    .eq("id", botId)
    .single();

  if (!bot) return null;

  const profile = bot.owner_profiles as OwnerProfile;
  const domains = bot.domains as { domain: string }[];

  return {
    id: bot.id,
    name: bot.name,
    slug: bot.slug,
    owner_name: profile?.display_name ?? bot.name,
    endpoint: `${baseUrl}/api/bots/${bot.id}`,
    domain: domains[0]?.domain ?? null,
    discovery: `${baseUrl}/api/discover?domain=${domains[0]?.domain ?? ""}`,
    version: "1.0",
  };
}

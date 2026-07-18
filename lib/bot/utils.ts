import type { BotContext, OwnerProfile } from "@/lib/types";

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

export function buildOwnerContext(profile: OwnerProfile): string {
  return [
    `Owner: ${profile.display_name}`,
    profile.bio && `Bio: ${profile.bio}`,
    profile.location && `Location: ${profile.location}`,
    `Timezone: ${profile.timezone}`,
    `Work hours: ${profile.work_hours}`,
    profile.availability_notes &&
      `Availability notes: ${profile.availability_notes}`,
    profile.important_info &&
      `Important info: ${profile.important_info}`,
    profile.google_connected
      ? "Google Calendar/Gmail: connected (use profile data for now)"
      : "Google Calendar/Gmail: not connected — use profile availability only",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildBotPersona(ctx: BotContext): string {
  return `You are the personal bot for ${ctx.profile.display_name}. You act on their behalf in negotiations with other personal bots. You know:

${buildOwnerContext(ctx.profile)}

Your bot name is "${ctx.bot.name}". Be concise, professional, and represent your owner's interests. When negotiating meetings, propose specific times in the owner's timezone and work within their availability.`;
}

export function extractTargetFromInstruction(
  instruction: string
): { type: "name" | "domain"; value: string } | null {
  const domainMatch = instruction.match(
    /\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+)\b/i
  );
  if (domainMatch) {
    return { type: "domain", value: normalizeDomain(domainMatch[1]) };
  }

  const nameMatch = instruction.match(
    /(?:with|to|contact|meet(?:ing)?\s+with)\s+([A-Z][a-zA-Z]+)/i
  );
  if (nameMatch) {
    return { type: "name", value: nameMatch[1] };
  }

  return null;
}

export const MAX_NEGOTIATION_ROUNDS = 8;

export type NegotiationResult = {
  agreed: boolean;
  summary: string;
  proposed_time?: string;
  reason?: string;
};

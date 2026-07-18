import { NextResponse } from "next/server";
import { getBotByDomain } from "@/lib/bot/engine";
import { normalizeDomain } from "@/lib/bot/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "domain query parameter required" },
      { status: 400 }
    );
  }

  const normalized = normalizeDomain(domain);
  const result = await getBotByDomain(normalized);

  if (!result) {
    return NextResponse.json(
      { found: false, domain: normalized },
      { status: 404 }
    );
  }

  const bot = result.bots as {
    id: string;
    name: string;
    slug: string;
    owner_profiles: { display_name: string };
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json({
    found: true,
    domain: normalized,
    bot: {
      id: bot.id,
      name: bot.name,
      slug: bot.slug,
      owner_name: bot.owner_profiles?.display_name,
      endpoint: `${baseUrl}/api/bots/${bot.id}`,
      manifest: `${baseUrl}/api/bots/${bot.id}/manifest`,
    },
  });
}

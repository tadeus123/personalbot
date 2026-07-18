import Link from "next/link";
import Script from "next/script";

export default async function DemoSitePage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string; app?: string }>;
}) {
  const params = await searchParams;
  const botId = params.bot;
  const appUrl = params.app ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="min-h-screen bg-white p-10 text-zinc-900">
      {botId && (
        <Script
          src={`${appUrl}/embed.js`}
          data-bot-id={botId}
          data-app-url={appUrl}
          strategy="afterInteractive"
        />
      )}
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">Demo Website</h1>
        <p className="mt-4 text-zinc-600">
          This simulates someone&apos;s personal website with a bot embedded.
          Humans see a normal page — bots see the discovery meta tags.
        </p>
        {botId ? (
          <p className="mt-4 text-emerald-600">
            Bot {botId.slice(0, 8)}... is embedded on this page.
          </p>
        ) : (
          <p className="mt-4 text-amber-600">
            No bot embedded. Add ?bot=YOUR_BOT_ID to the URL.
          </p>
        )}
        <Link href="/dashboard" className="mt-6 inline-block text-indigo-600">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

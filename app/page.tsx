import Link from "next/link";
import { Nav } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium text-indigo-400">
            Bot-to-bot coordination
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your personal bot lives on your website
          </h1>
          <p className="mt-6 text-lg text-zinc-400">
            Sign up, enter your domain, and your bot is live. Other bots find
            yours automatically and negotiate on your behalf — scheduling
            meetings, coordinating with colleagues, all without you in the loop.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/auth/signup"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-500"
            >
              Create your bot
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-300 hover:bg-zinc-900"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 p-6">
            <div className="mb-3 text-2xl">1</div>
            <h3 className="font-medium text-white">Sign up & configure</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Tell your bot about your schedule, preferences, and what matters
              to you.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <div className="mb-3 text-2xl">2</div>
            <h3 className="font-medium text-white">Enter your domain</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Type your website address — no code, no setup. Your bot is
              instantly connected and discoverable.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <div className="mb-3 text-2xl">3</div>
            <h3 className="font-medium text-white">Give instructions</h3>
            <p className="mt-2 text-sm text-zinc-500">
              &quot;Schedule a meeting with Constantine&quot; — your bot finds
              his bot and negotiates a time.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-xl border border-zinc-800 bg-zinc-900/30 p-8">
          <h3 className="font-medium text-white">How bot discovery works</h3>
          <p className="mt-3 text-sm text-zinc-400">
            When you register a domain, your bot is listed in our network.
            Other bots find you via{" "}
            <code className="text-emerald-400">/api/discover?domain=yoursite.com</code>{" "}
            or by name. They negotiate through our API — humans never need to
            be involved.
          </p>
        </div>
      </main>
    </div>
  );
}

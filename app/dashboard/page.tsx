import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardNav,
  Card,
  Input,
  Textarea,
  Button,
  StatusBadge,
} from "@/components/ui";
import { InstructForm } from "@/components/instruct-form";
import { updateProfile, addDomain, removeDomain } from "./actions";
import type { Bot, Domain, OwnerProfile, Instruction, Conversation } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!bot) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("bot_id", bot.id)
    .single();

  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .eq("bot_id", bot.id);

  const { data: instructions } = await supabase
    .from("instructions")
    .select("*")
    .eq("bot_id", bot.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(`initiator_bot_id.eq.${bot.id},recipient_bot_id.eq.${bot.id}`)
    .order("created_at", { ascending: false })
    .limit(5);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const typedBot = bot as Bot;
  const typedProfile = profile as OwnerProfile;
  const typedDomains = (domains ?? []) as Domain[];
  const typedInstructions = (instructions ?? []) as Instruction[];
  const typedConversations = (conversations ?? []) as Conversation[];
  const primaryDomain = typedDomains[0]?.domain;

  return (
    <div className="min-h-screen">
      <DashboardNav email={user.email ?? ""} />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold text-white">{typedBot.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {primaryDomain ? (
              <>
                Live on{" "}
                <span className="text-emerald-400">{primaryDomain}</span>
              </>
            ) : (
              "Add your website domain to go live"
            )}
          </p>
        </div>

        <Card title="Connect your website">
          <p className="mb-4 text-sm text-zinc-400">
            Enter your domain — no code required. Other bots can immediately
            find and talk to yours at that address.
          </p>
          <form action={addDomain} className="flex gap-2">
            <input
              name="domain"
              placeholder="yoursite.com"
              required
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
            <Button type="submit">Connect</Button>
          </form>

          {typedDomains.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {typedDomains.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-white">
                      {d.domain}
                    </span>
                    <span className="ml-2 text-xs text-emerald-400">
                      connected
                    </span>
                    <p className="mt-1 text-xs text-zinc-500">
                      Discovery: {appUrl}/api/discover?domain={d.domain}
                    </p>
                  </div>
                  <form action={removeDomain}>
                    <input type="hidden" name="domainId" value={d.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              Example: enter <code className="text-zinc-400">janedoe.com</code>{" "}
              and your bot is reachable by other bots at that domain.
            </p>
          )}
        </Card>

        <InstructForm />

        <div className="grid gap-8 lg:grid-cols-2">
          <Card title="About you (your bot's knowledge)">
            <form action={updateProfile} className="space-y-4">
              <Input
                label="Your name"
                name="display_name"
                defaultValue={typedProfile?.display_name}
              />
              <Input
                label="Bot name"
                name="bot_name"
                defaultValue={typedBot.name}
              />
              <Textarea
                label="Bio"
                name="bio"
                defaultValue={typedProfile?.bio}
                placeholder="What you do, your role..."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Timezone"
                  name="timezone"
                  defaultValue={typedProfile?.timezone ?? "UTC"}
                  placeholder="Europe/Berlin"
                />
                <Input
                  label="Location"
                  name="location"
                  defaultValue={typedProfile?.location}
                  placeholder="Berlin, Germany"
                />
              </div>
              <Input
                label="Work hours"
                name="work_hours"
                defaultValue={typedProfile?.work_hours}
                placeholder="Mon-Fri 9:00-17:00"
              />
              <Textarea
                label="Availability notes"
                name="availability_notes"
                defaultValue={typedProfile?.availability_notes}
                placeholder="No meetings before 10am, prefer afternoons..."
              />
              <Textarea
                label="Important info"
                name="important_info"
                defaultValue={typedProfile?.important_info}
                placeholder="Key projects, priorities, things your bot should know..."
              />
              <Button type="submit">Save profile</Button>
            </form>
          </Card>

          <Card title="Google Calendar & Gmail">
            <p className="text-sm text-zinc-400">
              Connect Google so your bot knows your real calendar and email
              availability. Coming soon — for now, fill in your availability
              manually above.
            </p>
            <Button type="button" variant="secondary" className="mt-4 opacity-50">
              Connect Google (soon)
            </Button>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card title="Recent instructions">
            {typedInstructions.length === 0 ? (
              <p className="text-sm text-zinc-500">No instructions yet</p>
            ) : (
              <ul className="space-y-3">
                {typedInstructions.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-lg border border-zinc-800 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-zinc-300">{i.content}</p>
                      <StatusBadge status={i.status} />
                    </div>
                    {i.result && (
                      <p className="mt-2 text-xs text-zinc-500">
                        {String((i.result as Record<string, unknown>).message ?? "")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Bot conversations">
            {typedConversations.length === 0 ? (
              <p className="text-sm text-zinc-500">No conversations yet</p>
            ) : (
              <ul className="space-y-3">
                {typedConversations.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-zinc-800 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-zinc-300">{c.topic}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.result && (
                      <p className="mt-2 text-xs text-emerald-400">
                        {String((c.result as Record<string, unknown>).summary ?? "")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

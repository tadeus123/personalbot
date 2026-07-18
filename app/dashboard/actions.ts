"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeDomain } from "@/lib/bot/utils";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!bot) throw new Error("Bot not found");

  const { error } = await supabase
    .from("owner_profiles")
    .update({
      display_name: (formData.get("display_name") as string) ?? "",
      bio: (formData.get("bio") as string) ?? "",
      timezone: (formData.get("timezone") as string) ?? "UTC",
      work_hours: (formData.get("work_hours") as string) ?? "",
      location: (formData.get("location") as string) ?? "",
      availability_notes: (formData.get("availability_notes") as string) ?? "",
      important_info: (formData.get("important_info") as string) ?? "",
    })
    .eq("bot_id", bot.id);

  if (error) throw new Error(error.message);

  const botName = formData.get("bot_name") as string;
  if (botName) {
    await supabase.from("bots").update({ name: botName }).eq("id", bot.id);
  }

  revalidatePath("/dashboard");
}

export async function addDomain(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!bot) throw new Error("Bot not found");

  const domain = normalizeDomain(formData.get("domain") as string);
  if (!domain) throw new Error("Domain is required");

  const { error } = await supabase.from("domains").insert({
    bot_id: bot.id,
    domain,
    verified_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function removeDomain(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const domainId = formData.get("domainId") as string;
  if (!domainId) throw new Error("Domain ID required");

  const { data: bot } = await supabase
    .from("bots")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!bot) throw new Error("Bot not found");

  const { error } = await supabase
    .from("domains")
    .delete()
    .eq("id", domainId)
    .eq("bot_id", bot.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

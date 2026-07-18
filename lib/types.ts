export type Bot = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  api_key: string;
  created_at: string;
  updated_at: string;
};

export type Domain = {
  id: string;
  bot_id: string;
  domain: string;
  verified_at: string | null;
  created_at: string;
};

export type OwnerProfile = {
  id: string;
  bot_id: string;
  display_name: string;
  bio: string;
  timezone: string;
  work_hours: string;
  location: string;
  preferences: Record<string, unknown>;
  availability_notes: string;
  important_info: string;
  google_connected: boolean;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  initiator_bot_id: string;
  recipient_bot_id: string;
  topic: string;
  status: "active" | "completed" | "failed";
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_bot_id: string;
  content: string;
  created_at: string;
};

export type Instruction = {
  id: string;
  bot_id: string;
  content: string;
  status: "pending" | "processing" | "completed" | "failed";
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type BotManifest = {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  endpoint: string;
  domain: string | null;
};

export type BotContext = {
  bot: Bot;
  profile: OwnerProfile;
  domains: Domain[];
};

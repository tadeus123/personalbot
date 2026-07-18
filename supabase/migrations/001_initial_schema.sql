-- PersonalBot initial schema

create extension if not exists "pgcrypto";

-- Bots (one per user)
create table public.bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Personal Bot',
  slug text not null unique,
  api_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Domains where the bot is embedded
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  domain text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(domain)
);

-- Owner profile / knowledge about the bot's owner
create table public.owner_profiles (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade unique,
  display_name text not null default '',
  bio text not null default '',
  timezone text not null default 'UTC',
  work_hours text not null default 'Mon-Fri 9:00-17:00',
  location text not null default '',
  preferences jsonb not null default '{}'::jsonb,
  availability_notes text not null default '',
  important_info text not null default '',
  google_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bot-to-bot conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  initiator_bot_id uuid not null references public.bots(id) on delete cascade,
  recipient_bot_id uuid not null references public.bots(id) on delete cascade,
  topic text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages within conversations
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_bot_id uuid not null references public.bots(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Owner instructions to their bot
create table public.instructions (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_domains_domain on public.domains(domain);
create index idx_bots_slug on public.bots(slug);
create index idx_conversations_bots on public.conversations(initiator_bot_id, recipient_bot_id);
create index idx_messages_conversation on public.messages(conversation_id, created_at);
create index idx_instructions_bot on public.instructions(bot_id, created_at desc);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bots_updated_at before update on public.bots
  for each row execute function public.set_updated_at();
create trigger owner_profiles_updated_at before update on public.owner_profiles
  for each row execute function public.set_updated_at();
create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();
create trigger instructions_updated_at before update on public.instructions
  for each row execute function public.set_updated_at();

-- RLS
alter table public.bots enable row level security;
alter table public.domains enable row level security;
alter table public.owner_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.instructions enable row level security;

-- Bots: users manage their own (discovery goes through API with service role)
create policy "Users can view own bot" on public.bots for select using (auth.uid() = user_id);
create policy "Users can insert own bot" on public.bots for insert with check (auth.uid() = user_id);
create policy "Users can update own bot" on public.bots for update using (auth.uid() = user_id);

-- Domains
create policy "Users can view own domains" on public.domains for select using (
  bot_id in (select id from public.bots where user_id = auth.uid())
);
create policy "Users can insert own domains" on public.domains for insert with check (
  bot_id in (select id from public.bots where user_id = auth.uid())
);
create policy "Users can delete own domains" on public.domains for delete using (
  bot_id in (select id from public.bots where user_id = auth.uid())
);

-- Owner profiles: owner manages; other bots read via service role API only
create policy "Users can view own profile" on public.owner_profiles for select using (
  bot_id in (select id from public.bots where user_id = auth.uid())
);
create policy "Users can insert own profile" on public.owner_profiles for insert with check (
  bot_id in (select id from public.bots where user_id = auth.uid())
);
create policy "Users can update own profile" on public.owner_profiles for update using (
  bot_id in (select id from public.bots where user_id = auth.uid())
);

-- Conversations: participants can read
create policy "Bot owners can view conversations" on public.conversations for select using (
  initiator_bot_id in (select id from public.bots where user_id = auth.uid())
  or recipient_bot_id in (select id from public.bots where user_id = auth.uid())
);

-- Messages: participants can read
create policy "Bot owners can view messages" on public.messages for select using (
  conversation_id in (
    select c.id from public.conversations c
    join public.bots b on b.id = c.initiator_bot_id or b.id = c.recipient_bot_id
    where b.user_id = auth.uid()
  )
);

-- Instructions: owner only
create policy "Users manage own instructions" on public.instructions for all using (
  bot_id in (select id from public.bots where user_id = auth.uid())
);

-- Auto-create bot on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_slug text;
  new_api_key text;
  new_bot_id uuid;
begin
  new_slug := 'bot-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  new_api_key := 'pb_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.bots (user_id, name, slug, api_key)
  values (new.id, 'My Personal Bot', new_slug, new_api_key)
  returning id into new_bot_id;

  insert into public.owner_profiles (bot_id, display_name)
  values (new_bot_id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

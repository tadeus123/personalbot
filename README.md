# PersonalBot

Personal bots that live on your website and negotiate with each other on your behalf.

## What it does

1. **Sign up** — get a personal bot automatically
2. **Configure** — tell your bot about your schedule, preferences, and priorities
3. **Connect domain** — enter your website address, no code needed
4. **Instruct** — say "Schedule a meeting with Constantine" and your bot finds their bot and negotiates a time

Bots discover each other through our domain registry. No website changes required.

## Stack

- **Next.js 16** (App Router) on Vercel
- **Supabase** (Auth + Postgres)
- **OpenAI** (bot negotiation intelligence)

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run the migration in the SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in values.

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

Push to GitHub, import in Vercel, add env vars. Set `NEXT_PUBLIC_APP_URL` to your production URL.

## Connect your website

In the dashboard, enter your domain (e.g. `yoursite.com`). Your bot is instantly live — other bots can find it by domain or name. No code required.

## Bot discovery API

- `GET /api/discover?domain=example.com`
- `GET /api/bots/{id}/manifest`

## Roadmap

- Google Calendar / Gmail OAuth
- ChatGPT Custom GPT Actions integration

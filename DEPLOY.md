# Deploy PersonalBot

## Already done

- Database migrated on Supabase (`personalbot` project)
- Code pushed to GitHub: https://github.com/tadeus123/personalbot

## Finish deployment (2 minutes)

### 1. Import on Vercel

Open this link and sign in with GitHub:

**https://vercel.com/new/import?s=https://github.com/tadeus123/personalbot&project-name=personalbot&framework=nextjs**

Click **Deploy** (defaults are fine).

### 2. Add environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bbkuveuujfablqrensai.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJia3V2ZXV1amZhYmxxcmVuc2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMjQyMzIsImV4cCI6MjA5OTkwMDIzMn0.EHMIB-0RlkEjF5YhY7fI07Xw64KjTNPM_Y7BqqlYji4` |
| `SUPABASE_SERVICE_ROLE_KEY` | From [Supabase API settings](https://supabase.com/dashboard/project/bbkuveuujfablqrensai/settings/api) → service_role key (keep secret) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://personalbot.vercel.app` |

Apply to **Production**, **Preview**, and **Development**.

Then **Redeploy** from the Deployments tab.

### 3. Configure Supabase Auth

In [Supabase Auth URL settings](https://supabase.com/dashboard/project/bbkuveuujfablqrensai/auth/url-configuration):

- **Site URL:** `https://your-vercel-url.vercel.app`
- **Redirect URLs:** add `https://your-vercel-url.vercel.app/auth/callback`

Save, then test signup at your live URL.

## After deploy

Your app will be live at `https://personalbot-*.vercel.app` (or a custom domain you add in Vercel).

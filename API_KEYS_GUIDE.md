# API Keys Guide: Hotel Complaint Analyzer

You need **3 values** in total: two from Supabase and one from Google Gemini (AI). Both services have free tiers and need no credit card.

## Checklist
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `GEMINI_API_KEY`

---

## 1. Supabase (database)
**Env vars:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` · **Free tier:** 2 projects, 500 MB database

1. Sign in at https://supabase.com/dashboard and open your project (or click **New project**).
2. Go to **SQL Editor** > **New query**, paste the contents of `supabase/schema.sql` and click **Run**.
3. Go to **Project Settings** > **API**.
4. Copy **Project URL** -> this is `SUPABASE_URL`.
5. Copy the **anon public** key -> this is `SUPABASE_ANON_KEY`.
6. Do **not** use the `service_role` key anywhere in this tool.

**Where to paste:** the "Connect your Supabase" panel in the app (testing), and Vercel > Project > Settings > Environment Variables (live).

---

## 2. Google Gemini (AI analysis)
**Env var:** `GEMINI_API_KEY` · **Free tier:** free with rate limits (enough for a demo and a small hotel)

1. Go to https://aistudio.google.com and sign in with a Google account.
2. Click **Get API key** > **Create API key**.
3. Copy the key.
4. Treat it like a password. Never commit it to GitHub or share it.

**Where to paste:**
- Testing: the **Settings** panel in the app (saved in your browser only; do not do this on a shared computer).
- Live: Vercel > Project > Settings > Environment Variables > add `GEMINI_API_KEY`, then redeploy.

**Note:** On the free tier, Google may use submitted content to improve its products. Avoid entering guest names or other personal details in complaints if that matters to you, or move to a paid tier before real use.

---

## Adding env vars in Vercel
1. Vercel dashboard > your project > **Settings** > **Environment Variables**.
2. Add each name and value above for **Production** (and Preview if you like).
3. Click **Redeploy** so the new values take effect.

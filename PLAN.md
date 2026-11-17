# Hotel Complaint Analyzer: Build Plan

## 1. Overview
- **Problem:** Hotel visitor complaints are entered by hand and nobody can easily see how many there are, what they are about, or which ones keep coming back.
- **Users:** Front-desk and guest-relations staff (enter complaints), the hotel manager (reads the dashboard and recommendations).
- **Goal:** One simple web tool where staff log complaints and AI automatically counts, categorizes, finds repeats, explains likely causes and recommends fixes.

## 2. Features (pain point -> screen)
| Pain point | Feature | Screen |
|---|---|---|
| Manual entry is slow and inconsistent | Complaint entry form (guest, room, area, channel, description, severity) | Home |
| No idea how many complaints | Total count, this week vs last week, open vs resolved | Dashboard |
| Complaints are not grouped | AI auto-categorizes each complaint on save (Cleanliness, Noise, Staff, Billing, Facilities, Food, Booking, Other) | Home + Dashboard |
| Same issues keep happening | Repeated-complaints table (same category + area, 3 or more in 30 days) | Dashboard |
| Nobody knows why | "Analyze" button: AI explains likely root causes from the data | Dashboard |
| No action list | AI recommendations + the feedback summary, saved with date | Dashboard |

## 3. Folder structure (static HTML, no build step)
```
/index.html            -> redirect page with two buttons: "Home" -> /home/ and "Dashboard" -> /dashboard/
/home/index.html       -> complaint form, recent complaints list, status updates
/dashboard/index.html  -> stat cards, charts, repeated complaints, AI analysis
/shared/app.js         -> config loader, Supabase client, helpers
/shared/styles.css     -> shared styles
/api/config.js         -> Vercel function: reports which env vars exist (public values only)
/api/analyze.js        -> Vercel function: calls the AI (key stays on the server)
/supabase/schema.sql   -> tables + RLS policies + seed rows
/vercel.json
```

## 4. Supabase

### Tables
- **complaints**: one row per complaint (guest, room, area, channel, description, severity, status, AI category, AI summary).
- **analyses**: one row per saved AI analysis (period, totals, causes, recommendations).

### `supabase/schema.sql`
```sql
create extension if not exists "pgcrypto";

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  guest_name text,
  room_number text,
  area text not null default 'Room',  -- Room, Lobby, Restaurant, Pool, Parking, Reception, Other
  channel text not null default 'Front desk', -- Front desk, Phone, Email, Online review
  description text not null,
  severity text not null default 'Medium' check (severity in ('Low','Medium','High')),
  status text not null default 'Open' check (status in ('Open','In progress','Resolved')),
  category text,       -- filled by AI
  ai_summary text,     -- one-line summary, filled by AI
  resolution_note text
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  period_start date,
  period_end date,
  total_complaints int,
  root_causes jsonb,       -- [{ "issue": "...", "likely_cause": "...", "evidence": "..." }]
  recommendations jsonb,   -- [{ "action": "...", "priority": "High|Medium|Low", "owner": "..." }]
  feedback_summary text
);

create index if not exists complaints_created_idx on complaints (created_at desc);
create index if not exists complaints_cat_area_idx on complaints (category, area);

-- Row Level Security (DEMO policies: open to anyone with the anon key.
-- Replace with authenticated-user policies before real use.)
alter table complaints enable row level security;
alter table analyses enable row level security;

create policy "demo read complaints"   on complaints for select using (true);
create policy "demo insert complaints" on complaints for insert with check (true);
create policy "demo update complaints" on complaints for update using (true);
create policy "demo read analyses"     on analyses   for select using (true);
create policy "demo insert analyses"   on analyses   for insert with check (true);

-- Seed rows so the dashboard is not empty
insert into complaints (created_at, guest_name, room_number, area, channel, description, severity, status, category, ai_summary) values
 (now() - interval '2 days',  'Guest A', '305', 'Room',       'Front desk',   'Air conditioner is too noisy and does not cool the room.', 'High',   'Open',        'Facilities',  'Noisy, weak air conditioner'),
 (now() - interval '3 days',  'Guest B', '307', 'Room',       'Phone',        'Air conditioning not working at night.',                   'High',   'In progress', 'Facilities',  'Air conditioner not working'),
 (now() - interval '5 days',  'Guest C', '312', 'Room',       'Front desk',   'Bathroom was not cleaned and towels were missing.',        'Medium', 'Resolved',    'Cleanliness', 'Bathroom not cleaned, missing towels'),
 (now() - interval '6 days',  'Guest D', '208', 'Room',       'Online review','Room smelled of smoke and the carpet was dirty.',          'Medium', 'Open',        'Cleanliness', 'Smoke smell, dirty carpet'),
 (now() - interval '8 days',  'Guest E', null,  'Reception',  'Front desk',   'Waited 25 minutes to check in, staff seemed unaware.',     'Medium', 'Resolved',    'Staff',       'Long check-in wait'),
 (now() - interval '10 days', 'Guest F', null,  'Reception',  'Phone',        'Receptionist was rude when I asked for a late checkout.',  'High',   'Resolved',    'Staff',       'Rude reception staff'),
 (now() - interval '12 days', 'Guest G', '410', 'Room',       'Front desk',   'Loud party next door after midnight.',                     'Medium', 'Resolved',    'Noise',       'Late-night noise'),
 (now() - interval '15 days', 'Guest H', null,  'Restaurant', 'Email',        'Breakfast ran out of food by 9:30.',                       'Low',    'Resolved',    'Food',        'Breakfast ran out'),
 (now() - interval '18 days', 'Guest I', '305', 'Room',       'Front desk',   'Wi-Fi keeps disconnecting.',                               'Low',    'Open',        'Facilities',  'Unstable Wi-Fi'),
 (now() - interval '22 days', 'Guest J', null,  'Reception',  'Online review','Charged twice for the minibar I did not use.',             'High',   'Resolved',    'Billing',     'Double minibar charge');
```

## 5. Connect Supabase (first-run screen)
- On load, look for `SUPABASE_URL` and `SUPABASE_ANON_KEY` via `/api/config`, then `localStorage`.
- If not found, show a **"Connect your Supabase"** panel with:
  - Project URL and anon key fields
  - **Test connection** button (queries `complaints` and shows success or a clear error)
  - Link to supabase.com/dashboard to open your project
  - **Copy schema.sql** button (paste into Supabase > SQL Editor > Run)
- If a Supabase connector is available in this session, I can create the tables through it instead.

## 6. API keys
| Service | Why | Free? | Env var |
|---|---|---|---|
| Supabase (URL + anon key) | Database | Free tier, no card | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Google Gemini (AI Studio) | AI categorization, root-cause analysis, recommendations | Free tier, no card | `GEMINI_API_KEY` |

Only one AI key is needed. If you would rather use Claude, I can switch the one function `/api/analyze.js` to the Anthropic API (`ANTHROPIC_API_KEY`, paid credits required).

**Behaviour in the HTML**
1. Call `/api/config` first. If `GEMINI_API_KEY` exists on Vercel, use it and do not ask.
2. If missing, a **Settings** panel lets you paste the key. It is stored in `localStorage` and sent to `/api/analyze` in a request header for that call only. Note shown in the UI: *demo only; never paste a secret key on a shared computer; move it to Vercel env vars for real use.*
3. The Supabase URL and anon key are public values and safe in the browser. The AI key never goes into any committed file.
4. A **Required keys** checklist on the Settings panel shows each key as Found / Missing.

**AI calls (`/api/analyze`)**
- `mode: "categorize"` runs when a complaint is saved. It returns `category` and `ai_summary`. If AI is unavailable, the complaint is still saved and categorized later.
- `mode: "analyze"` runs from the Dashboard button. It sends the last 30 days of complaints and returns root causes, repeated issues, feedback summary and recommendations, which are saved to `analyses`.

## 7. API key guide
See `API_KEYS_GUIDE.md`.

## 8. Build steps
1. Create folder structure, `vercel.json` and shared styles.
2. `shared/app.js`: config loader, Supabase client, key checklist, helpers.
3. Landing page (`/index.html`) with Home and Dashboard buttons.
4. Home: entry form, recent complaints list, status update, Connect-Supabase and Settings panels.
5. `/api/config.js` and `/api/analyze.js`.
6. Dashboard: stat cards (total, this week vs last week, open, high severity), chart by category, chart by week, repeated-complaints table, latest AI analysis with **Run analysis** button.
7. Empty and error states (not connected, missing key, no data).
8. Run locally and walk through the testing checklist.

## 9. Testing checklist
- [ ] `/` shows two buttons; Home goes to `/home/`, Dashboard goes to `/dashboard/`.
- [ ] With no keys, the Connect Supabase panel appears; **Test connection** succeeds after pasting valid values.
- [ ] Dashboard shows the 10 seed complaints, correct totals and a category chart.
- [ ] Submit a new complaint on Home; it appears in the list and is auto-categorized.
- [ ] Submit two more "air conditioner" complaints in the same area; it shows up under Repeated complaints.
- [ ] Change a complaint status to Resolved; open count drops on the Dashboard.
- [ ] Click **Run analysis**; causes, feedback and recommendations appear and persist after refresh.
- [ ] Remove the AI key; friendly "AI key missing" message, and the rest of the app still works.

## 10. Deploy to Vercel (last step)
1. Push the folder to GitHub (or run `npx vercel` in the folder).
2. In Vercel, import the project (framework preset: Other, no build command).
3. Add env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`.
4. Deploy and open the live URL.
5. Run the testing checklist on production.
6. Before real guest data goes in: replace the demo RLS policies with login-based ones.

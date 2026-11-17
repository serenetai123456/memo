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

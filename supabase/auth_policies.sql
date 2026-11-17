-- Run AFTER schema.sql. Replaces the open demo rules with "signed-in users only".
drop policy if exists "demo read complaints"   on complaints;
drop policy if exists "demo insert complaints" on complaints;
drop policy if exists "demo update complaints" on complaints;
drop policy if exists "demo read analyses"     on analyses;
drop policy if exists "demo insert analyses"   on analyses;

create policy "staff read complaints"   on complaints for select to authenticated using (true);
create policy "staff insert complaints" on complaints for insert to authenticated with check (true);
create policy "staff update complaints" on complaints for update to authenticated using (true);
create policy "staff read analyses"     on analyses   for select to authenticated using (true);
create policy "staff insert analyses"   on analyses   for insert to authenticated with check (true);

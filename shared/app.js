const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } };
const SETTINGS = `<dialog id="settings"><h2>Settings</h2>
<div id="checklist" class="note"></div>
<h3>Connect your Supabase</h3>
<label for="sbUrl">Project URL</label><input id="sbUrl" placeholder="https://xxxx.supabase.co">
<label for="sbKey">Anon public key</label><input id="sbKey" placeholder="eyJ...">
<div class="row"><button class="btn alt" id="sbTest">Test connection</button><button class="btn alt" id="sbCopy">Copy schema.sql</button><a href="https://supabase.com/dashboard" target="_blank" rel="noopener">Open Supabase</a></div>
<h3 style="margin-top:1rem">AI key (Gemini)</h3>
<label for="gKey">Gemini API key</label><input id="gKey" type="password" placeholder="Paste to use AI">
<p class="mut">Demo only: keys are saved in this browser. Never paste a secret key on a shared computer. For real use, set them as Vercel environment variables.</p>
<div id="setMsg"></div>
<div class="row"><button class="btn" id="setSave">Save</button><button class="btn alt" id="setClear">Clear saved keys</button><button class="btn alt" id="setClose">Close</button></div></dialog>`;
const App = {
  cfg: {}, db: null,
  async init(active) {
    document.body.insertAdjacentHTML('afterbegin', `<header><b>Guest Complaint Desk</b>${active === 'login' ? '' : `<a href="/home/" class="${active === 'home' ? 'on' : ''}">Home</a><a href="/dashboard/" class="${active === 'dashboard' ? 'on' : ''}">Dashboard</a>`}<button id="openSet">Settings</button>${active === 'login' ? '' : '<button id="out">Sign out</button>'}</header>`);
    document.body.insertAdjacentHTML('beforeend', SETTINGS);
    try { const r = await fetch('/api/config'); this.cfg = r.ok ? await r.json() : {}; } catch (e) { this.cfg = {}; }
    const url = this.cfg.SUPABASE_URL || ls('sb_url'), key = this.cfg.SUPABASE_ANON_KEY || ls('sb_key');
    this.keys = { 'Supabase URL': !!url, 'Supabase anon key': !!key, 'Gemini API key': !!(this.cfg.hasGemini || ls('gemini_key')) };
    if (url && key) this.db = supabase.createClient(url, key);
    $('#checklist').innerHTML = '<b>Required keys</b><br>' + Object.entries(this.keys).map(([k, v]) => `${v ? '✔ Found' : '✘ Missing'}: ${k}`).join('<br>');
    $('#openSet').onclick = () => $('#settings').showModal();
    $('#setClose').onclick = () => $('#settings').close();
    $('#setSave').onclick = () => { if ($('#sbUrl').value) ls('sb_url', $('#sbUrl').value.trim()); if ($('#sbKey').value) ls('sb_key', $('#sbKey').value.trim()); if ($('#gKey').value) ls('gemini_key', $('#gKey').value.trim()); location.reload(); };
    $('#setClear').onclick = () => { ['sb_url', 'sb_key', 'gemini_key'].forEach(k => ls(k, null)); location.reload(); };
    $('#sbCopy').onclick = async () => { try { await navigator.clipboard.writeText(await (await fetch('/supabase/schema.sql')).text()); this.msg('#setMsg', 'schema.sql copied. Paste it in Supabase > SQL Editor > Run.', 'ok'); } catch (e) { this.msg('#setMsg', 'Could not copy. Open /supabase/schema.sql and copy it by hand.', 'err'); } };
    $('#sbTest').onclick = async () => {
      try { const c = supabase.createClient($('#sbUrl').value.trim() || url, $('#sbKey').value.trim() || key); const { error } = await c.from('complaints').select('id', { head: true, count: 'exact' }); if (error) throw error; this.msg('#setMsg', 'Connected. The complaints table is ready.', 'ok'); }
      catch (e) { this.msg('#setMsg', 'Connection failed: ' + (e.message || 'check the URL and key, and that schema.sql was run.'), 'err'); }
    };
    if (!this.db) { $('main').insertAdjacentHTML('afterbegin', '<div class="note err">Not connected yet. Open Settings and connect your Supabase project.</div>'); $('#settings').showModal(); return false; }
    const { data: { session } } = await this.db.auth.getSession();
    if (active === 'login') { if (session) location.href = '/home/'; return true; }
    if (!session) { location.href = '/login/'; return false; }
    $('#out').onclick = async () => { await this.db.auth.signOut(); location.href = '/login/'; };
    return true;
  },
  msg(sel, text, cls = '') { $(sel).innerHTML = `<div class="note ${cls}">${esc(text)}</div>`; },
  async ai(mode, data) {
    const r = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json', 'x-gemini-key': ls('gemini_key') || '' }, body: JSON.stringify({ mode, ...data }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'AI request failed');
    return j;
  },
  fmt: d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
};

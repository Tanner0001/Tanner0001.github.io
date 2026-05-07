// DG CAD Dispatch — uses sbClient from ../admin/auth.js
const sb = sbClient;

// ── State ─────────────────────────────────────────────────────────────────
let calls        = [];
let roster       = [];
let selectedId   = null;
let callFilter   = 'all';
let rosterFilter = 'all';
let histOffset   = 0;
const HIST_PAGE  = 100;
let histAll      = [];
let histLoaded   = false;
let expandedUnit = null; // player_id of the open status picker

// ── DOM refs ──────────────────────────────────────────────────────────────
const callList          = document.getElementById('call-list');
const callEmpty         = document.getElementById('call-empty');
const callCount         = document.getElementById('call-count');
const detailPlaceholder = document.getElementById('detail-placeholder');
const callDetailEl      = document.getElementById('call-detail');
const rosterList        = document.getElementById('roster-list');
const connIndicator     = document.getElementById('conn-indicator');
const connLabel         = document.getElementById('conn-label');
const clockEl           = document.getElementById('clock');

const dIncident  = document.getElementById('d-incident');
const dType      = document.getElementById('d-type');
const dStatePill = document.getElementById('d-state-pill');
const dLocation  = document.getElementById('d-location');
const dPostal    = document.getElementById('d-postal');
const dCaller    = document.getElementById('d-caller');
const dTime      = document.getElementById('d-time');
const dMessage   = document.getElementById('d-message');
const dNotes     = document.getElementById('d-notes');
const dUnits     = document.getElementById('d-units');
const notesInput = document.getElementById('notes-input');

// ── Clock ─────────────────────────────────────────────────────────────────
function tickClock() {
    clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}
setInterval(tickClock, 1000);
tickClock();

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function statePillClass(state) {
    return { Outstanding: 'pill-outstanding', Assigned: 'pill-assigned', 'On Scene': 'pill-onscene', Resolved: 'pill-resolved' }[state] || 'pill-resolved';
}

function applyStatePillStyle(el, state) {
    el.className = 'call-state-pill text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex-shrink-0 ' + statePillClass(state);
    el.textContent = state.toUpperCase();
}

function fmtTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtAge(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)   return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
}

function statusClass(status) {
    const s = (status || '').toLowerCase();
    if (s === 'clear')    return 'status-clear';
    if (s === 'enroute')  return 'status-enroute';
    if (s === 'on scene') return 'status-onscene';
    if (s === 'busy')     return 'status-busy';
    return 'status-unavailable';
}

// ── GTA V world → map percentage ──────────────────────────────────────────
// Calibrated for standard GTA V satellite map (portrait, ocean-bordered)
// X: -3750 to +4250 (~8000 units E-W), Y: -4200 to +7800 (~12000 N-S, inverted)
function worldToMap(wx, wy) {
    const x = (wx + 3750) / 8000;
    const y = 1.0 - (wy + 4200) / 12000;
    return {
        left: Math.max(0, Math.min(100, x * 100)).toFixed(3) + '%',
        top:  Math.max(0, Math.min(100, y * 100)).toFixed(3) + '%'
    };
}

// ── Center tab switching ──────────────────────────────────────────────────
document.querySelectorAll('.center-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.center-tab').forEach(b => {
            b.classList.remove('text-orange-500', 'border-orange-500');
            b.classList.add('text-slate-500', 'border-transparent');
        });
        btn.classList.add('text-orange-500', 'border-orange-500');
        btn.classList.remove('text-slate-500', 'border-transparent');

        const target = btn.dataset.ctab;
        document.querySelectorAll('.ctab-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById('ctab-' + target).classList.remove('hidden');

        if (target === 'history') loadHistory();
        if (target === 'map')     renderMap();
        lucide.createIcons();
    });
});

// ── Render call list ──────────────────────────────────────────────────────
function filteredCalls() {
    return calls.filter(c => callFilter === 'all' || c.state === callFilter);
}

function renderCallList() {
    const visible = filteredCalls();
    callCount.textContent = visible.length + ' call' + (visible.length !== 1 ? 's' : '');
    [...callList.querySelectorAll('.call-card')].forEach(el => el.remove());

    if (visible.length === 0) { callEmpty.style.display = ''; return; }
    callEmpty.style.display = 'none';

    [...visible].sort((a, b) => b.incident_number - a.incident_number).forEach(call => {
        const card = document.createElement('div');
        card.className = 'call-card bg-slate-950/60 border border-white/5 rounded-2xl p-3 cursor-pointer transition-all hover:border-white/10 hover:bg-slate-800/40'
                       + (call.incident_number === selectedId ? ' !border-orange-500/40 !bg-slate-800/40' : '');
        card.dataset.id    = call.incident_number;
        card.dataset.state = call.state;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-1.5">
                <span class="text-[11px] font-bold text-white">${esc(call.type)}</span>
                <span class="text-[10px] font-mono text-slate-600">#${call.incident_number}</span>
            </div>
            <div class="text-[11px] text-slate-500 truncate mb-2">${esc((call.postal ? call.postal + ' ' : '') + (call.address || ''))}</div>
            <div class="flex justify-between items-center">
                <span class="call-state-pill text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statePillClass(call.state)}">${call.state.toUpperCase()}</span>
                <span class="text-[9px] text-slate-600 font-mono">${fmtAge(call.created_at)}</span>
            </div>`;

        card.addEventListener('click', () => {
            const incTab = document.querySelector('.center-tab[data-ctab="incident"]');
            if (!incTab.classList.contains('text-orange-500')) incTab.click();
            selectCall(call.incident_number);
        });
        callList.appendChild(card);
    });
}

// ── Select & render detail ────────────────────────────────────────────────
function selectCall(incidentNumber) {
    selectedId = incidentNumber;
    const call = calls.find(c => c.incident_number === incidentNumber);
    if (!call) return;

    document.querySelectorAll('.call-card').forEach(el => {
        const sel = parseInt(el.dataset.id) === incidentNumber;
        el.classList.toggle('!border-orange-500/40', sel);
        el.classList.toggle('!bg-slate-800/40', sel);
    });

    detailPlaceholder.style.display = 'none';
    callDetailEl.style.display = '';

    dIncident.textContent = 'INCIDENT #' + call.incident_number;
    dType.textContent     = call.type;
    applyStatePillStyle(dStatePill, call.state);
    dLocation.textContent = call.address || '—';
    dPostal.textContent   = call.postal   || '—';
    dCaller.textContent   = (call.player_name || 'Unknown') + (call.player_id ? ' (ID ' + call.player_id + ')' : '');
    dTime.textContent     = fmtTime(call.created_at);
    dMessage.textContent  = call.message  || '—';
    dNotes.textContent    = call.notes    || 'No notes.';
    notesInput.value      = call.notes    || '';

    document.querySelectorAll('.state-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.state === call.state);
    });
    renderUnits(call.attached_units);
}

function renderUnits(units) {
    dUnits.innerHTML = '';
    const arr = Array.isArray(units) ? units : [];
    if (arr.length === 0) {
        dUnits.innerHTML = '<span class="text-[11px] text-slate-600">None assigned</span>';
        return;
    }
    arr.forEach(u => {
        const pill = document.createElement('span');
        pill.className = 'bg-slate-900 border border-white/5 rounded-lg px-3 py-1 text-[11px] font-bold text-slate-400 font-mono';
        pill.textContent = u;
        dUnits.appendChild(pill);
    });
}

function refreshDetailIfSelected(n) {
    if (n === selectedId) selectCall(n);
}

// ── Roster render (with inline status change) ─────────────────────────────
const STATUS_OPTIONS = ['CLEAR', 'ENROUTE', 'ON SCENE', 'BUSY', 'UNAVAILABLE'];

function renderRoster() {
    rosterList.innerHTML = '';
    const filtered = roster.filter(u => {
        if (rosterFilter === 'leo')  return u.job === 'Law Enforcement';
        if (rosterFilter === 'fire') return u.job === 'Fire/EMS' || u.job === 'Coroner';
        return true;
    });

    if (filtered.length === 0) {
        rosterList.innerHTML = `<div class="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
            <i data-lucide="users" class="w-7 h-7 opacity-30"></i>
            <span class="text-[10px] font-bold uppercase tracking-widest">No units on duty</span></div>`;
        lucide.createIcons();
        return;
    }

    filtered.forEach(u => {
        const card = document.createElement('div');
        const isExpanded = expandedUnit === u.player_id;
        card.className = 'roster-card bg-slate-950/60 border border-white/5 rounded-2xl px-3 py-2.5 flex flex-col gap-2' + (isExpanded ? ' expanded' : '');
        card.dataset.playerId = u.player_id;

        const curStatus = (u.status || 'CLEAR').toUpperCase();

        card.innerHTML = `
            <div class="grid gap-x-2 items-center" style="grid-template-columns: auto 1fr auto">
                <span class="font-mono text-[11px] font-bold text-orange-500 min-w-[44px]">${esc(u.callsign || '??')}</span>
                <span class="text-[11px] text-slate-300 truncate">${esc(u.nick || u.name || 'Unknown')}</span>
                <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${statusClass(curStatus)}">${esc(curStatus)}</span>
            </div>
            <div class="status-picker gap-1 flex-wrap">
                ${STATUS_OPTIONS.map(s => `
                    <button class="spick-btn${s === curStatus ? ' active-status' : ''}" data-pid="${u.player_id}" data-status="${s}">${s}</button>
                `).join('')}
            </div>`;

        card.addEventListener('click', e => {
            if (e.target.classList.contains('spick-btn')) return; // handled below
            expandedUnit = isExpanded ? null : u.player_id;
            renderRoster();
        });

        card.querySelectorAll('.spick-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const pid    = parseInt(btn.dataset.pid);
                const status = btn.dataset.status;
                const { error } = await sb.from('dispatch_roster')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('player_id', pid);
                if (error) { toast('info', 'Error', error.message); return; }
                // Optimistically update local state
                const u2 = roster.find(r => r.player_id === pid);
                if (u2) u2.status = status;
                renderRoster();
                renderMap();
            });
        });

        rosterList.appendChild(card);
    });
}

// ── Map rendering ─────────────────────────────────────────────────────────
function renderMap() {
    const overlay  = document.getElementById('map-overlay');
    const countEl  = document.getElementById('map-unit-count');
    if (!overlay) return;

    overlay.innerHTML = '';

    const onDuty = roster.filter(u => u.x || u.y); // only place units that have coords

    // Unit markers
    onDuty.forEach(u => {
        if (!u.x && !u.y) return;
        const pos = worldToMap(u.x, u.y);
        const el  = document.createElement('div');
        el.className = 'map-unit';
        el.style.left = pos.left;
        el.style.top  = pos.top;
        const jobColor = (u.job === 'Law Enforcement') ? '#f97316'
                       : (u.job === 'Fire/EMS')        ? '#ef4444'
                       : '#a855f7';
        el.innerHTML = `
            <div class="map-unit-dot" style="background:${jobColor}; box-shadow: 0 0 6px ${jobColor}99;"></div>
            <div class="map-unit-label">${esc(u.callsign || '??')} — ${esc(u.nick || 'Unknown')}</div>`;
        overlay.appendChild(el);
    });

    // Active call markers (only Outstanding/Assigned/On Scene with coords)
    const activeCalls = calls.filter(c => c.state !== 'Resolved' && (c.x || c.y));
    activeCalls.forEach(c => {
        const pos  = worldToMap(c.x, c.y);
        const el   = document.createElement('div');
        el.className = 'map-call';
        el.style.left = pos.left;
        el.style.top  = pos.top;
        const dotCls = c.type === '911 Emergency' ? 'c-911'
                     : c.type === '311 Non-Emergency' ? 'c-311'
                     : 'c-other';
        el.innerHTML = `
            <div class="map-call-dot ${dotCls}"></div>
            <div class="map-call-label">#${c.incident_number} ${esc(c.type)} — ${esc(c.postal || c.address || '')}</div>`;
        el.addEventListener('click', () => {
            document.querySelector('.center-tab[data-ctab="incident"]').click();
            selectCall(c.incident_number);
        });
        overlay.appendChild(el);
    });

    if (countEl) countEl.textContent = onDuty.length + ' unit' + (onDuty.length !== 1 ? 's' : '');
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(type, typeLabel, message) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    const border = type === '911' ? 'border-l-red-500' : type === '311' ? 'border-l-amber-500' : 'border-l-orange-500';
    el.className = `toast bg-slate-900 border border-white/10 border-l-2 ${border} rounded-2xl p-4 min-w-[220px] max-w-xs shadow-xl`;
    el.innerHTML = `<div class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">${esc(typeLabel)}</div>
                    <div class="text-slate-300 text-xs">${esc(message)}</div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 6000);
}

// ── Load active calls ─────────────────────────────────────────────────────
async function loadCalls() {
    const { data, error } = await sb
        .from('dispatch_calls')
        .select('*')
        .order('incident_number', { ascending: false })
        .limit(200);

    if (error) { console.error('[CAD] loadCalls:', error.message); setConnState('error', 'DB error'); return; }
    calls = data || [];
    renderCallList();
}

async function loadRoster() {
    const { data, error } = await sb.from('dispatch_roster').select('*').order('callsign');
    if (!error && data) { roster = data; renderRoster(); renderMap(); }
}

// ── History tab ───────────────────────────────────────────────────────────
async function loadHistory(forceReload) {
    if (histLoaded && !forceReload) return;
    histLoaded = true;

    const tbody = document.getElementById('hist-body');
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-16 text-center text-slate-600 italic">Loading…</td></tr>';

    const { data, error } = await sb
        .from('dispatch_calls')
        .select('*')
        .order('incident_number', { ascending: false })
        .limit(500);

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-red-500 text-xs">${esc(error.message)}</td></tr>`;
        return;
    }
    histAll = data || [];
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody   = document.getElementById('hist-body');
    const countEl = document.getElementById('hist-count');
    const moreBtn = document.getElementById('hist-more-btn');

    const search      = (document.getElementById('hist-search').value || '').toLowerCase();
    const stateFilter = document.getElementById('hist-filter-state').value;

    const filtered = histAll.filter(c => {
        if (stateFilter && c.state !== stateFilter) return false;
        if (search) {
            const haystack = [c.type, c.address, c.postal, c.player_name, c.message].join(' ').toLowerCase();
            return haystack.includes(search);
        }
        return true;
    });

    const page = filtered.slice(0, histOffset + HIST_PAGE);
    tbody.innerHTML = '';

    if (page.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-16 text-center text-slate-600 italic">No records found.</td></tr>';
        countEl.textContent = '0 records';
        moreBtn.classList.add('hidden');
        return;
    }

    page.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hist-row border-b border-white/[0.03] cursor-pointer transition-colors';
        tr.innerHTML = `
            <td class="px-4 py-2.5 font-mono text-[10px] text-slate-500">#${c.incident_number}</td>
            <td class="px-4 py-2.5 text-[11px] text-white font-medium max-w-[140px] truncate">${esc(c.type)}</td>
            <td class="px-4 py-2.5 text-[11px] text-slate-400 max-w-[120px] truncate">${esc((c.postal ? c.postal + ' ' : '') + (c.address || ''))}</td>
            <td class="px-4 py-2.5 text-[11px] text-slate-400">${esc(c.player_name || '—')}</td>
            <td class="px-4 py-2.5"><span class="call-state-pill text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statePillClass(c.state)}">${esc(c.state)}</span></td>
            <td class="px-4 py-2.5 text-[10px] text-slate-600 font-mono whitespace-nowrap">${fmtDateTime(c.created_at)}</td>`;

        tr.addEventListener('click', () => {
            const existing = calls.find(x => x.incident_number === c.incident_number);
            if (!existing) calls.push(c);
            document.querySelector('.center-tab[data-ctab="incident"]').click();
            selectCall(c.incident_number);
            document.querySelectorAll('.hist-row').forEach(r => r.classList.remove('selected-hist'));
            tr.classList.add('selected-hist');
        });
        tbody.appendChild(tr);
    });

    countEl.textContent = filtered.length + ' record' + (filtered.length !== 1 ? 's' : '');
    filtered.length > histOffset + HIST_PAGE ? moreBtn.classList.remove('hidden') : moreBtn.classList.add('hidden');
}

document.getElementById('hist-search').addEventListener('input', () => { histOffset = 0; renderHistoryTable(); });
document.getElementById('hist-filter-state').addEventListener('change', () => { histOffset = 0; renderHistoryTable(); });
document.getElementById('hist-load-btn').addEventListener('click', () => { histLoaded = false; histOffset = 0; loadHistory(true); });
document.getElementById('hist-more-btn').addEventListener('click', () => { histOffset += HIST_PAGE; renderHistoryTable(); });

// ── Character / player search ─────────────────────────────────────────────
async function runSearch() {
    const raw     = document.getElementById('srch-input').value.trim();
    const results = document.getElementById('srch-results');

    if (!raw) {
        results.innerHTML = `<div class="flex flex-col items-center justify-center h-full gap-4 text-slate-700">
            <i data-lucide="search" class="w-10 h-10 opacity-20"></i>
            <span class="text-[11px] font-black uppercase tracking-[0.15em]">Enter a name to search</span></div>`;
        lucide.createIcons();
        return;
    }

    results.innerHTML = `<div class="flex items-center gap-3 text-slate-600 py-8">
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
        <span class="text-xs">Searching…</span></div>`;
    lucide.createIcons();

    const q = raw.toLowerCase();

    // Online roster match
    const rosterMatches = roster.filter(u =>
        (u.nick || '').toLowerCase().includes(q) ||
        (u.callsign || '').toLowerCase().includes(q)
    );

    // Character records — use separate .ilike filters chained with .or()
    const orFilter = `full_name.ilike.%${raw}%,first_name.ilike.%${raw}%,last_name.ilike.%${raw}%`;
    const { data: charData, error: charErr } = await sb
        .from('character_records')
        .select('*')
        .or(orFilter)
        .limit(50);

    results.innerHTML = '';

    // Online units section
    if (rosterMatches.length > 0) {
        const section = document.createElement('div');
        section.className = 'mb-6';
        section.innerHTML = `<div class="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-3">Online Units (${rosterMatches.length})</div>`;
        rosterMatches.forEach(u => {
            const card = document.createElement('div');
            card.className = 'bg-slate-900 border border-white/5 rounded-2xl p-4 mb-2 grid gap-x-3 items-center';
            card.style.gridTemplateColumns = 'auto 1fr auto';
            card.innerHTML = `
                <span class="font-mono text-sm font-black text-orange-500 min-w-[52px]">${esc(u.callsign || '??')}</span>
                <div>
                    <div class="text-sm font-bold text-white">${esc(u.nick || 'Unknown')}</div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold">${esc(u.job || '')}</div>
                </div>
                <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${statusClass(u.status)}">${esc((u.status || 'CLEAR').toUpperCase())}</span>`;
            section.appendChild(card);
        });
        results.appendChild(section);
    }

    // Character records section
    if (charErr) {
        const note = document.createElement('div');
        note.className = 'bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4';
        note.innerHTML = `<div class="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Character Records Error</div>
            <div class="text-xs text-slate-400">${esc(charErr.message)}</div>
            <div class="text-[9px] text-slate-600 mt-2">Make sure the <code>character_records</code> table exists in Supabase and RLS allows anon reads.</div>`;
        results.appendChild(note);
    } else if (charData && charData.length > 0) {
        const section = document.createElement('div');
        section.className = 'mb-6';
        section.innerHTML = `<div class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Character Records (${charData.length})</div>`;
        charData.forEach(c => {
            const isOnline = roster.some(u => u.nick === c.full_name);
            const card = document.createElement('div');
            card.className = 'bg-slate-900 border border-white/5 rounded-2xl p-4 mb-2';
            card.innerHTML = `
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <div class="text-sm font-black text-white">${esc(c.full_name)}</div>
                        <div class="text-[10px] text-slate-600 font-mono mt-0.5">ID ${c.char_id} · DOB ${esc(c.dob || '—')}</div>
                    </div>
                    ${isOnline
                        ? '<span class="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Online</span>'
                        : '<span class="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-slate-800 text-slate-600 border border-white/5">Offline</span>'}
                </div>`;
            section.appendChild(card);
        });
        results.appendChild(section);
    } else if (!charErr) {
        const note = document.createElement('div');
        note.className = 'text-[10px] text-slate-600 italic mb-4';
        note.textContent = 'No character records found. Records are added automatically when players log in and select a character.';
        results.appendChild(note);
    }

    // No results at all
    if (rosterMatches.length === 0 && (!charData || charData.length === 0) && !charErr) {
        results.innerHTML = `<div class="flex flex-col items-center justify-center h-full gap-4 text-slate-700 py-16">
            <i data-lucide="search-x" class="w-10 h-10 opacity-20"></i>
            <span class="text-[11px] font-black uppercase tracking-[0.15em]">No results for "${esc(raw)}"</span></div>`;
    }

    lucide.createIcons();
}

document.getElementById('srch-btn').addEventListener('click', runSearch);
document.getElementById('srch-input').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });

// ── Real-time subscription ────────────────────────────────────────────────
function subscribeRealtime() {
    sb.channel('dispatch')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_calls' }, handleCallChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_roster' }, () => {
            loadRoster(); // refreshes roster + map
        })
        .subscribe(status => {
            if (status === 'SUBSCRIBED') setConnState('live', 'Live');
            else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnState('error', 'Disconnected');
        });
}

function handleCallChange({ eventType, new: row, old }) {
    if (eventType === 'INSERT') {
        calls.unshift(row);
        if (histLoaded) { histAll.unshift(row); renderHistoryTable(); }
        renderCallList();
        renderMap();
        toast(
            row.type === '911 Emergency' ? '911' : row.type === '311 Non-Emergency' ? '311' : 'info',
            row.type,
            (row.postal ? row.postal + ' ' : '') + (row.address || '') + ' — ' + row.message
        );
        setTimeout(() => {
            const card = callList.querySelector(`.call-card[data-id="${row.incident_number}"]`);
            if (card) card.classList.add('new-flash');
        }, 50);

    } else if (eventType === 'UPDATE') {
        const idx = calls.findIndex(c => c.incident_number === row.incident_number);
        if (idx !== -1) calls[idx] = row; else calls.unshift(row);
        const hidx = histAll.findIndex(c => c.incident_number === row.incident_number);
        if (hidx !== -1) histAll[hidx] = row;
        renderCallList();
        renderMap();
        if (histLoaded) renderHistoryTable();
        refreshDetailIfSelected(row.incident_number);

    } else if (eventType === 'DELETE') {
        calls = calls.filter(c => c.incident_number !== old.incident_number);
        histAll = histAll.filter(c => c.incident_number !== old.incident_number);
        if (selectedId === old.incident_number) {
            selectedId = null;
            callDetailEl.style.display = 'none';
            detailPlaceholder.style.display = '';
        }
        renderCallList();
        renderMap();
        if (histLoaded) renderHistoryTable();
    }
}

// ── Connection state ──────────────────────────────────────────────────────
function setConnState(state, label) {
    const dot = connIndicator.querySelector('.conn-dot');
    connLabel.textContent = label;
    dot.className   = 'conn-dot w-2 h-2 rounded-full transition-all ';
    connLabel.className = 'conn-label text-[10px] font-bold uppercase tracking-widest ';
    if (state === 'live') {
        dot.className   += 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]';
        connLabel.className += 'text-emerald-500';
    } else if (state === 'error') {
        dot.className   += 'bg-red-500';
        connLabel.className += 'text-red-500';
    } else {
        dot.className   += 'bg-slate-600';
        connLabel.className += 'text-slate-500';
    }
}

// ── Filter tabs ───────────────────────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => {
            b.classList.remove('bg-orange-600', 'text-white');
            b.classList.add('text-slate-400');
        });
        btn.classList.add('bg-orange-600', 'text-white');
        btn.classList.remove('text-slate-400');
        callFilter = btn.dataset.filter;
        renderCallList();
    });
});

document.querySelectorAll('.roster-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.roster-filter').forEach(b => {
            b.classList.remove('bg-orange-600', 'text-white');
            b.classList.add('text-slate-400', 'border', 'border-white/5');
        });
        btn.classList.add('bg-orange-600', 'text-white');
        btn.classList.remove('text-slate-400', 'border', 'border-white/5');
        rosterFilter = btn.dataset.rfilter;
        renderRoster();
    });
});

document.querySelectorAll('.state-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (!selectedId) return;
        const { error } = await sb
            .from('dispatch_calls')
            .update({ state: btn.dataset.state, updated_at: new Date().toISOString() })
            .eq('incident_number', selectedId);
        if (error) toast('info', 'Error', error.message);
    });
});

document.getElementById('notes-save-btn').addEventListener('click', async () => {
    if (!selectedId) return;
    const { error } = await sb
        .from('dispatch_calls')
        .update({ notes: notesInput.value.trim(), updated_at: new Date().toISOString() })
        .eq('incident_number', selectedId);
    if (error) toast('info', 'Error', error.message);
});

// ── Init ──────────────────────────────────────────────────────────────────
(async function init() {
    setConnState('', 'Connecting…');
    await loadCalls();
    await loadRoster();
    subscribeRealtime();
    // Re-render ages every minute; re-render map every 30s (roster syncs every 30s server-side)
    setInterval(() => renderCallList(), 60000);
    setInterval(() => { if (document.getElementById('ctab-map') && !document.getElementById('ctab-map').classList.contains('hidden')) renderMap(); }, 30000);
})();

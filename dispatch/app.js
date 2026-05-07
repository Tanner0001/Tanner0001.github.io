// DG CAD Dispatch — uses sbClient from ../admin/auth.js
const sb = sbClient;

// ── State ─────────────────────────────────────────────────────────────────
let calls        = [];
let roster       = [];
let selectedId   = null;
let callFilter   = 'all';
let rosterFilter = 'all';

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
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function statePillClass(state) {
    const map = {
        'Outstanding': 'pill-outstanding',
        'Assigned':    'pill-assigned',
        'On Scene':    'pill-onscene',
        'Resolved':    'pill-resolved',
    };
    return map[state] || 'pill-resolved';
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

// ── Render call list ──────────────────────────────────────────────────────
function filteredCalls() {
    return calls.filter(c => callFilter === 'all' || c.state === callFilter);
}

function renderCallList() {
    const visible = filteredCalls();
    callCount.textContent = visible.length + ' call' + (visible.length !== 1 ? 's' : '');

    [...callList.querySelectorAll('.call-card')].forEach(el => el.remove());

    if (visible.length === 0) {
        callEmpty.style.display = '';
        return;
    }
    callEmpty.style.display = 'none';

    const sorted = [...visible].sort((a, b) => b.incident_number - a.incident_number);
    sorted.forEach(call => {
        const card = document.createElement('div');
        card.className = 'call-card bg-slate-950/60 border border-white/5 rounded-2xl p-3 cursor-pointer transition-all hover:border-white/10 hover:bg-slate-800/40' + (call.incident_number === selectedId ? ' !border-orange-500/40 !bg-slate-800/40' : '');
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
            </div>
        `;

        card.addEventListener('click', () => selectCall(call.incident_number));
        callList.appendChild(card);
    });
}

// ── Select & render detail ────────────────────────────────────────────────
function selectCall(incidentNumber) {
    selectedId = incidentNumber;
    const call = calls.find(c => c.incident_number === incidentNumber);
    if (!call) return;

    document.querySelectorAll('.call-card').forEach(el => {
        const isSelected = parseInt(el.dataset.id) === incidentNumber;
        el.classList.toggle('!border-orange-500/40', isSelected);
        el.classList.toggle('!bg-slate-800/40', isSelected);
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
        dUnits.innerHTML = '<span class="unit-empty text-[11px] text-slate-600">None assigned</span>';
        return;
    }
    arr.forEach(u => {
        const pill = document.createElement('span');
        pill.className = 'bg-slate-900 border border-white/5 rounded-lg px-3 py-1 text-[11px] font-bold text-slate-400 font-mono';
        pill.textContent = u;
        dUnits.appendChild(pill);
    });
}

function refreshDetailIfSelected(incidentNumber) {
    if (incidentNumber === selectedId) selectCall(incidentNumber);
}

// ── Roster render ─────────────────────────────────────────────────────────
function renderRoster() {
    rosterList.innerHTML = '';
    const filtered = roster.filter(u => {
        if (rosterFilter === 'leo')  return u.job === 'Law Enforcement';
        if (rosterFilter === 'fire') return u.job === 'Fire/EMS' || u.job === 'Coroner';
        return true;
    });

    if (filtered.length === 0) {
        rosterList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
                <i data-lucide="users" class="w-7 h-7 opacity-30"></i>
                <span class="text-[10px] font-bold uppercase tracking-widest">No units on duty</span>
            </div>`;
        lucide.createIcons();
        return;
    }

    filtered.forEach(u => {
        const card = document.createElement('div');
        card.className = 'bg-slate-950/60 border border-white/5 rounded-2xl px-3 py-2.5 grid gap-x-2 items-center';
        card.style.gridTemplateColumns = 'auto 1fr auto';
        card.innerHTML = `
            <span class="font-mono text-[11px] font-bold text-orange-500 min-w-[44px]">${esc(u.callsign || '??')}</span>
            <span class="text-[11px] text-slate-300 truncate">${esc(u.nick || u.name || 'Unknown')}</span>
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${statusClass(u.status)}">${esc((u.status || 'CLEAR').toUpperCase())}</span>
        `;
        rosterList.appendChild(card);
    });
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(type, typeLabel, message) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');

    const borderColor = type === '911' ? 'border-l-red-500' : type === '311' ? 'border-l-amber-500' : 'border-l-orange-500';
    el.className = `toast bg-slate-900 border border-white/10 border-l-2 ${borderColor} rounded-2xl p-4 text-sm min-w-[220px] max-w-xs shadow-xl`;
    el.innerHTML = `
        <div class="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">${esc(typeLabel)}</div>
        <div class="text-slate-300 text-xs">${esc(message)}</div>
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 6000);
}

// ── Load data ─────────────────────────────────────────────────────────────
async function loadCalls() {
    const { data, error } = await sb
        .from('dispatch_calls')
        .select('*')
        .order('incident_number', { ascending: false })
        .limit(200);

    if (error) {
        console.error('[Dispatch] Failed to load calls:', error.message);
        setConnState('error', 'DB error');
        return;
    }
    calls = data || [];
    renderCallList();
}

async function loadRoster() {
    const { data, error } = await sb
        .from('dispatch_roster')
        .select('*')
        .order('callsign');
    if (!error && data) {
        roster = data;
        renderRoster();
    }
}

// ── Real-time ─────────────────────────────────────────────────────────────
function subscribeRealtime() {
    sb.channel('dispatch')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_calls' }, handleCallChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_roster' }, () => loadRoster())
        .subscribe(status => {
            if (status === 'SUBSCRIBED') {
                setConnState('live', 'Live');
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                setConnState('error', 'Disconnected');
            }
        });
}

function handleCallChange({ eventType, new: row, old }) {
    if (eventType === 'INSERT') {
        calls.unshift(row);
        renderCallList();
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
        if (idx !== -1) calls[idx] = row;
        else calls.unshift(row);
        renderCallList();
        refreshDetailIfSelected(row.incident_number);

    } else if (eventType === 'DELETE') {
        calls = calls.filter(c => c.incident_number !== old.incident_number);
        if (selectedId === old.incident_number) {
            selectedId = null;
            callDetailEl.style.display = 'none';
            detailPlaceholder.style.display = '';
        }
        renderCallList();
    }
}

// ── Connection state ──────────────────────────────────────────────────────
function setConnState(state, label) {
    const dot = connIndicator.querySelector('.conn-dot');
    connLabel.textContent = label;

    dot.className = 'conn-dot w-2 h-2 rounded-full transition-all ';
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
        if (error) toast('info', 'Error', 'Failed to update state: ' + error.message);
    });
});

document.getElementById('notes-save-btn').addEventListener('click', async () => {
    if (!selectedId) return;
    const { error } = await sb
        .from('dispatch_calls')
        .update({ notes: notesInput.value.trim(), updated_at: new Date().toISOString() })
        .eq('incident_number', selectedId);
    if (error) toast('info', 'Error', 'Failed to save notes: ' + error.message);
});

// ── Init ──────────────────────────────────────────────────────────────────
(async function init() {
    setConnState('', 'Connecting…');
    await loadCalls();
    await loadRoster();
    subscribeRealtime();
    setInterval(() => renderCallList(), 60000);
})();

// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://mqdumsqnsezmlcyxvkwq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZHVtc3Fuc2V6bWxjeXh2a3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTQzMTUsImV4cCI6MjA4NzUzMDMxNX0.qs24B8CQ193Uqot6HB5guHtJWJgycx654AR-08JXyi4';

let sbClient = null;
try {
    if (typeof supabase !== 'undefined') {
        sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Supabase library not loaded!");
    }
} catch (e) {
    console.error("Supabase Init Error:", e);
}

// PATH DETECTION
const isSubfolder = window.location.pathname.includes('/leo/') || 
                    window.location.pathname.includes('/fd/') || 
                    window.location.pathname.includes('/civ/');
const basePath = isSubfolder ? '../' : '';

// PORTAL NAVIGATION
function enterPortal(type) {
    window.location.href = type + '/';
}

function showHub() {
    window.location.href = basePath || './';
}

// UNIVERSAL TAB SWITCHING
function switchTab(targetId, event, contentClass, tabClass, activeStyleClasses = 'active') {
    const contents = document.getElementsByClassName(contentClass);
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
        contents[i].classList.remove("active");
    }

    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }

    const tabs = document.getElementsByClassName(tabClass);
    const styleList = activeStyleClasses.split(' ');
    
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active", ...styleList);
        if (tabClass.includes('sub-tab')) {
            tabs[i].classList.add("text-slate-500");
        }
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active", ...styleList);
        event.currentTarget.classList.remove("text-slate-500");
    }
    
    const sidebar = document.querySelector('#manual aside') || document.querySelector('#fd-manual aside') || document.querySelector('#civ-jobs aside');
    if (sidebar && !sidebar.classList.contains('hidden') && window.innerWidth < 1024) {
        toggleManualSidebar();
    }

    lucide.createIcons();
}

// Legacy wrappers
function openTab(id, e) { switchTab(id, e, 'tab-content', 'tab'); }
function openFDTab(id, e) { switchTab(id, e, 'fd-tab-content', 'fd-tab'); }
function openCivTab(id, e) { switchTab(id, e, 'civ-tab-content', 'civ-tab'); }
function openSubTab(id, e) { switchTab(id, e, 'sub-tab-content', 'sub-tab', 'bg-sky-600 text-white'); }
function openPenalSubTab(id, e) { switchTab(id, e, 'penal-sub-content', 'sub-tab-penal', 'bg-sky-600 text-white'); }
function openUniformSubTab(id, e) { switchTab(id, e, 'uniform-sub-content', 'sub-tab-uniform', 'bg-sky-600 text-white'); }
function openCivSubTab(id, e) { switchTab(id, e, 'civ-sub-content', 'civ-sub-tab', 'bg-emerald-600 text-white'); }
function openCivVehicleSubTab(id, e) { switchTab(id, e, 'civ-vehicle-sub-content', 'sub-tab-civ-v', 'bg-emerald-600 text-white'); }
function openFDVehicleSubTab(id, e) { switchTab(id, e, 'fd-vehicle-sub-content', 'sub-tab-fd-v', 'bg-red-600 text-white'); }

// UTILITIES
function toggleAccordion(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    if (!content) return;
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.setAttribute('data-lucide', 'chevron-up');
    } else {
        content.classList.add('hidden');
        if (icon) icon.setAttribute('data-lucide', 'chevron-down');
    }
    lucide.createIcons();
}

function toggleManualSidebar() {
    const sidebar = document.querySelector('#manual aside') || document.querySelector('#fd-manual aside') || document.querySelector('#civ-jobs aside');
    if (!sidebar) return;
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'inset-0', 'z-50', 'w-full', 'h-full', 'bg-slate-900');
        if (!document.getElementById('close-sidebar')) {
            const closeBtn = document.createElement('button');
            closeBtn.id = 'close-sidebar';
            closeBtn.className = 'absolute top-6 right-6 p-2 bg-slate-800 rounded-full text-white';
            closeBtn.innerHTML = '<i data-lucide="x"></i>';
            closeBtn.onclick = toggleManualSidebar;
            sidebar.appendChild(closeBtn);
            lucide.createIcons();
        }
    } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'inset-0', 'z-50', 'w-full', 'h-full', 'bg-slate-900');
        const closeBtn = document.getElementById('close-sidebar');
        if (closeBtn) closeBtn.remove();
    }
}

// DATA ENGINE
let penalData = null;
let vehicleData = null;
let civVehicleData = null;
let fdVehicleData = null;

async function loadAllData() {
    if (!sbClient) return;
    try {
        console.log('[Database] Syncing all resources...');
        const [penalRes, leoVehRes, civVehRes, fdVehRes] = await Promise.all([
            sbClient.from('penal_code').select('*'),
            sbClient.from('leo_vehicles').select('*'),
            sbClient.from('civ_vehicles').select('*'),
            sbClient.from('fd_vehicles').select('*')
        ]);

        // Error Logging
        if (penalRes.error) console.error('[Database] Penal Code Error:', penalRes.error.message);
        if (leoVehRes.error) console.error('[Database] LEO Vehicle Error:', leoVehRes.error.message);

        // Transformation with Casing Support
        if (penalRes.data) {
            console.log('[Database] Penal Code returned', penalRes.data.length, 'rows');
            penalData = {};
            penalRes.data.forEach(row => {
                // Support both 'section_title' and 'Section Title' or fallback to 'General'
                const title = row.section_title || row['Section Title'] || 'General';
                if (!penalData[title]) penalData[title] = [];
                
                penalData[title].push({ 
                    id: row.id || row.ID, 
                    name: row.name || row.Name, 
                    description: row.description || row.Description, 
                    class: row.class || row.Class 
                });
            });
        }

        if (leoVehRes.data) {
            vehicleData = {};
            leoVehRes.data.forEach(row => {
                const dept = row.department || row.Department || 'unmarked';
                if (!vehicleData[dept]) vehicleData[dept] = [];
                vehicleData[dept].push({ 
                    role: row.role || row.Role, 
                    model: row.model || row.Model, 
                    code: row.code || row.Code 
                });
            });
        }

        if (civVehRes.data) {
            civVehicleData = {};
            civVehRes.data.forEach(row => {
                const cat = row.category || row.Category || 'other';
                if (!civVehicleData[cat]) civVehicleData[cat] = [];
                civVehicleData[cat].push({ 
                    role: row.role || row.Role, 
                    model: row.model || row.Model, 
                    code: row.code || row.Code 
                });
            });
        }

        if (fdVehRes.data) {
            fdVehicleData = { 'fire': [], 'ems': [] };
            fdVehRes.data.forEach(row => {
                const role = (row.role || row.Role || '').toLowerCase();
                const type = (role.includes('ambulance') || role.includes('medical')) ? 'ems' : 'fire';
                fdVehicleData[type].push({ 
                    role: row.role || row.Role, 
                    model: row.model || row.Model, 
                    code: row.code || row.Code 
                });
            });
        }

        renderPenalCode();
        renderVehicles();
        renderCivVehicles();
        renderFDVehicles();
        fetchNotices(); 
        fetchServerStatus(); 
        checkMaintenance(); // NEW: Maintenance check
        lucide.createIcons();
        logVisit();
    } catch (err) {
        console.error("Critical Data Sync Error:", err);
    }
}

async function checkMaintenance() {
    if (!sbClient) return;
    try {
        const { data } = await sbClient.from('site_settings').select('*').eq('key', 'maintenance_mode').single();
        // Don't trigger if already on admin page (so we don't lock ourselves out)
        const isAdmin = window.location.pathname.includes('/admin/');
        
        // Check session to allow staff bypass
        const { data: { session } } = await sbClient.auth.getSession();
        
        if (data && data.value === true && !isAdmin && !session) {
            document.body.innerHTML = `
                <div class="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-12 text-center overflow-hidden">
                    <div class="absolute inset-0 bg-[url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697bd61687b9b5c7048b921e/b29c79989_image.png')] bg-cover bg-center opacity-10 grayscale"></div>
                    <div class="relative z-10">
                        <div class="bg-red-600/20 p-6 rounded-3xl border border-red-600/30 inline-block mb-8">
                            <i data-lucide="shield-alert" class="w-12 h-12 text-red-500 animate-pulse"></i>
                        </div>
                        <h1 class="text-5xl font-black italic uppercase text-white mb-4 tracking-tighter">System Maintenance</h1>
                        <p class="text-slate-500 text-sm max-w-md uppercase font-bold tracking-widest leading-relaxed">The Dynamic Gaming hub is currently undergoing infrastructure updates. We'll be back online shortly.</p>
                        
                        <a href="/admin/" class="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
                            <i data-lucide="lock" class="w-3 h-3"></i>
                            Staff Login
                        </a>

                        <div class="mt-12 pt-12 border-t border-white/5">
                            <p class="text-[9px] text-slate-700 uppercase font-black tracking-[0.4em]">Community Resource Hub // 2026</p>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons();
        }
    } catch (e) {}
}

async function fetchServerStatus() {
    if (!sbClient) return;
    try {
        const { data, error } = await sbClient.from('server_status').select('*').eq('id', 1).single();
        if (data) {
            const statusBox = document.getElementById('hub-status-box');
            const statusDot = document.getElementById('hub-status-dot');
            const statusIcon = document.getElementById('hub-status-icon');
            const liveIndicator = document.getElementById('server-live-indicator');
            const playerCount = document.getElementById('server-player-count');
            const statusLabel = document.getElementById('hub-status-label');

            // Check if server has checked in within the last 3 minutes
            const lastSeen = new Date(data.last_seen);
            const isTimeout = (new Date() - lastSeen) > 180000;
            const isOnline = data.is_online && !isTimeout;

            if (isOnline) {
                if (liveIndicator) liveIndicator.classList.remove('hidden');
                if (playerCount) playerCount.textContent = `${data.players}/${data.max_players}`;
                
                if (statusBox) statusBox.className = "bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-center gap-6 backdrop-blur-xl";
                if (statusDot) statusDot.className = "bg-emerald-500 p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]";
                if (statusIcon) statusIcon.setAttribute('data-lucide', 'check-circle');
                if (statusLabel) {
                    statusLabel.textContent = "Server Online";
                    statusLabel.className = "block text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-1";
                }
            } else {
                if (liveIndicator) liveIndicator.classList.add('hidden');
                if (statusBox) statusBox.className = "bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex items-center gap-6 backdrop-blur-xl";
                if (statusDot) statusDot.className = "bg-red-500 p-4 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]";
                if (statusIcon) statusIcon.setAttribute('data-lucide', 'alert-octagon');
                if (statusLabel) {
                    statusLabel.textContent = "Server Status Update";
                    statusLabel.className = "block text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1";
                }
            }
            
            // Always fetch notices to ensure the posted message is displayed
            fetchNotices();
            lucide.createIcons();
        }
    } catch (e) {
        console.error("Status Fetch Error:", e);
    }
}

async function fetchNotices() {
    if (!sbClient) return;
    try {
        const { data } = await sbClient.from('site_notices').select('*');
        if (data) {
            data.forEach(n => {
                const el = document.getElementById(`dynamic-${n.id.replace(/_/g, '-')}`);
                if (el) el.textContent = n.content;
            });
        }
    } catch (e) {
        console.error("Notice Fetch Error:", e);
    }
}

async function logVisit() {
    if (!sbClient) return;
    try {
        await sbClient.rpc('increment_hits');
    } catch (e) {
        // Function might not exist yet
    }
}

function renderPenalCode(filter = '') {
    if (!penalData) return;
    const searchTerm = filter.toLowerCase();
    const tabContainer = document.getElementById('penal-tabs');
    const dataContainer = document.getElementById('penal-data-container');
    if (!tabContainer || !dataContainer) return;
    
    const keys = Object.keys(penalData);
    if (keys.length === 0) {
        dataContainer.innerHTML = '<p class="text-slate-500 text-center py-20 italic">No penal code entries found in database.</p>';
        return;
    }

    if (tabContainer.innerHTML.trim() === "") {
        tabContainer.innerHTML = keys.map((key, index) => {
            const safeId = key.replace(/[^a-z0-9]/gi, '-').toLowerCase();
            return `
                <button class="sub-tab-penal ${index === 0 ? 'active bg-sky-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap" 
                        onclick="openPenalSubTab('p-${safeId}', event)">
                    ${key}
                </button>
            `;
        }).join('');
    }

    dataContainer.innerHTML = keys.map((key, index) => {
        const safeId = key.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const filteredLaws = penalData[key].filter(law => 
            (law.name || '').toLowerCase().includes(searchTerm) || 
            (law.id || '').toString().toLowerCase().includes(searchTerm) ||
            (law.description || '').toLowerCase().includes(searchTerm)
        );

        let html = `<div id="p-${safeId}" class="penal-sub-content ${index === 0 ? 'active' : 'hidden'} space-y-6">`;
        if (filteredLaws.length > 0) {
            html += `
                <div class="rounded-2xl overflow-hidden glassmorphism border border-slate-700 mb-6">
                    <div class="bg-slate-800/50 p-4 border-b border-slate-700 text-sky-300 font-bold uppercase tracking-widest text-[10px]">${key}</div>
                    <div class="p-6 divide-y divide-slate-800 space-y-4">
                        ${filteredLaws.map(law => `
                            <div class="flex justify-between items-start pt-4 first:pt-0 gap-4">
                                <div class="text-left">
                                    <h4 class="font-bold text-white text-sm">${law.id}. ${law.name}</h4>
                                    <p class="text-xs text-slate-500 mt-1">${law.description}</p>
                                </div>
                                <span class="${getClassStyle(law.class)} px-3 py-1 rounded-full text-[10px] font-bold border shrink-0 uppercase">${law.class || 'N/A'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } else {
            html += `<p class="text-slate-500 text-sm italic text-center py-10">No matching laws found in this section.</p>`;
        }
        html += `</div>`;
        return html;
    }).join('');
    lucide.createIcons();
}

function getClassStyle(cls) {
    if (!cls) return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    const c = cls.toUpperCase();
    switch(c) {
        case 'FELONY': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'CAPITAL': return 'bg-red-600 text-white border-red-600';
        case 'MISDEMEANOR': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'INFRACTION': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'DEFINITION': return 'bg-slate-700/50 text-slate-300 border-slate-600';
        case 'PROCEDURE': return 'bg-orange-500/10 text-sky-400 border-orange-500/20';
        default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
}

function renderVehicles() {
    if (!vehicleData) return;
    const tabContainer = document.getElementById('vehicle-tabs');
    const dataContainer = document.getElementById('vehicle-data-container');
    if (!tabContainer || !dataContainer) return;

    const keys = Object.keys(vehicleData);
    if (keys.length === 0) return;

    tabContainer.innerHTML = keys.map((key, index) => `
        <button class="sub-tab ${index === 0 ? 'active bg-sky-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest" 
                onclick="openSubTab('v-${key}', event)">
            ${key.toUpperCase()}
        </button>
    `).join('');
    dataContainer.innerHTML = keys.map((key, index) => `
        <div id="v-${key}" class="sub-tab-content ${index === 0 ? 'active' : 'hidden'} space-y-8">
            <div class="rounded-3xl overflow-hidden shadow-2xl glassmorphism border border-slate-700">
                <div class="responsive-table-container">
                    <table class="w-full text-left m-0">
                        <thead class="bg-slate-900/50 text-sky-300 text-[10px] uppercase font-bold tracking-[0.2em]">
                            <tr><th class="px-8 py-4">Role</th><th class="px-8 py-4">Vehicle Model</th><th class="px-8 py-4 text-right">Spawn Code</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800 text-sm">
                            ${vehicleData[key].map(v => `
                                <tr class="hover:bg-slate-800/30 transition-colors">
                                    <td class="px-8 py-4 text-slate-500 font-bold">${v.role}</td>
                                    <td class="px-8 py-4 text-white">${v.model}</td>
                                    <td class="px-8 py-4 text-right font-mono text-sky-400">${v.code}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCivVehicles() {
    if (!civVehicleData) return;
    const tabContainer = document.getElementById('civ-vehicle-tabs');
    const dataContainer = document.getElementById('civ-vehicle-data-container');
    if (!tabContainer || !dataContainer) return;
    const keys = Object.keys(civVehicleData);
    if (keys.length === 0) return;

    tabContainer.innerHTML = keys.map((key, index) => `
        <button class="sub-tab-civ-v ${index === 0 ? 'active bg-emerald-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" 
                onclick="openCivVehicleSubTab('cv-${key}', event)">
            ${key.toUpperCase()}
        </button>
    `).join('');

    dataContainer.innerHTML = keys.map((key, index) => `
        <div id="cv-${key}" class="civ-vehicle-sub-content ${index === 0 ? 'active' : 'hidden'} space-y-8">
            <div class="rounded-3xl overflow-hidden shadow-2xl glassmorphism border border-slate-700">
                <div class="responsive-table-container">
                    <table class="w-full text-left m-0">
                        <thead class="bg-slate-900/50 text-emerald-400 text-[10px] uppercase font-bold tracking-[0.2em]">
                            <tr><th class="px-8 py-4">Role</th><th class="px-8 py-4">Vehicle Model</th><th class="px-8 py-4 text-right">Spawn Code</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800 text-sm">
                            ${civVehicleData[key].map(v => `
                                <tr class="hover:bg-slate-800/30 transition-colors text-left">
                                    <td class="px-8 py-4 text-slate-500 font-bold text-left">${v.role}</td>
                                    <td class="px-8 py-4 text-white text-left">${v.model}</td>
                                    <td class="px-8 py-4 text-right font-mono text-emerald-400">${v.code}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `).join('');
}

function renderFDVehicles() {
    if (!fdVehicleData) return;
    const tabContainer = document.getElementById('fd-vehicle-tabs');
    const dataContainer = document.getElementById('fd-vehicle-data-container');
    if (!tabContainer || !dataContainer) return;
    const keys = Object.keys(fdVehicleData).filter(k => fdVehicleData[k].length > 0);
    if (keys.length === 0) return;

    tabContainer.innerHTML = keys.map((key, index) => `
        <button class="sub-tab-fd-v ${index === 0 ? 'active bg-red-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" 
                onclick="openFDVehicleSubTab('fv-${key}', event)">
            ${key.toUpperCase()}
        </button>
    `).join('');

    dataContainer.innerHTML = keys.map((key, index) => `
        <div id="fv-${key}" class="fd-vehicle-sub-content ${index === 0 ? 'active' : 'hidden'} space-y-8">
            <div class="rounded-3xl overflow-hidden shadow-2xl glassmorphism border border-slate-700">
                <div class="responsive-table-container">
                    <table class="w-full text-left m-0">
                        <thead class="bg-slate-900/50 text-red-400 text-[10px] uppercase font-bold tracking-[0.2em]">
                            <tr><th class="px-8 py-4">Role</th><th class="px-8 py-4">Vehicle Model</th><th class="px-8 py-4 text-right">Spawn Code</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800 text-sm">
                            ${fdVehicleData[key].map(v => `
                                <tr class="hover:bg-slate-800/30 transition-colors text-left">
                                    <td class="px-8 py-4 text-slate-500 font-bold text-left">${v.role}</td>
                                    <td class="px-8 py-4 text-white text-left">${v.model}</td>
                                    <td class="px-8 py-4 text-right font-mono text-red-400">${v.code}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `).join('');
}

// GALLERY LIGHTBOX
const galleryImages = [
    { type: 'video', src: 'clips/flipped.mp4', caption: 'Flipped' },
    { type: 'video', src: 'clips/run.mp4', caption: 'Run' },
    { type: 'video', src: 'clips/ScreenRecording_06-08-2025_23-48-22_1.mov', caption: 'Field Action' },
    { type: 'video', src: 'clips/subtleforeshadowing.mov', caption: 'Subtle Foreshadowing' },
    { type: 'image', src: 'images/17282257253000282112_20250511004744_1.png', caption: '' },
    { type: 'image', src: 'images/17282257253000282112_20250330005032_1.png', caption: '' },
    { type: 'image', src: 'images/17282257253000282112_20250505162250_1.png', caption: '' },
    { type: 'image', src: 'images/17282257253000282112_20250511010749_1.png', caption: '' },
    { type: 'image', src: 'images/im33age.png', caption: '' },
    { type: 'image', src: 'images/ima2ge.png', caption: '' },
    { type: 'image', src: 'images/imag1e.png', caption: '' },
    { type: 'image', src: 'images/imag222e.png', caption: '' },
    { type: 'image', src: 'images/image.png', caption: '' }
];
let currentImageIndex = 0;

function openLightbox(index) {
    currentImageIndex = index;
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;
    
    const img = document.getElementById('lightbox-img');
    const video = document.getElementById('lightbox-video');
    const item = galleryImages[index];

    if (item.type === 'video') {
        img.classList.add('hidden');
        video.classList.remove('hidden');
        video.src = basePath + item.src;
        video.play();
    } else {
        video.classList.add('hidden');
        video.pause();
        img.classList.remove('hidden');
        img.src = basePath + item.src;
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    const video = document.getElementById('lightbox-video');
    if (video) {
        video.pause();
        video.src = "";
    }
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function changeImage(step) {
    currentImageIndex += step;
    if (currentImageIndex >= galleryImages.length) currentImageIndex = 0;
    if (currentImageIndex < 0) currentImageIndex = galleryImages.length - 1;
    
    const img = document.getElementById('lightbox-img');
    const video = document.getElementById('lightbox-video');
    const item = galleryImages[currentImageIndex];

    img.style.opacity = '0';
    video.style.opacity = '0';

    setTimeout(() => {
        if (item.type === 'video') {
            img.classList.add('hidden');
            video.classList.remove('hidden');
            video.src = basePath + item.src;
            video.play();
            video.style.opacity = '1';
        } else {
            video.classList.add('hidden');
            video.pause();
            video.src = "";
            img.classList.remove('hidden');
            img.src = basePath + item.src;
            img.style.opacity = '1';
        }
    }, 150);
}

// LISTENERS
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') changeImage(1);
    if (e.key === 'ArrowLeft') changeImage(-1);
});

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadAllData();
    const penalSearch = document.getElementById('penalSearch');
    if (penalSearch) penalSearch.addEventListener('input', (e) => renderPenalCode(e.target.value));
});

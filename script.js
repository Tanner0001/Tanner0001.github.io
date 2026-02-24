// SUPABASE CONFIGURATION
// Replace these with your actual credentials from admin/auth.js
const SUPABASE_URL = 'https://mqdumsqnsezmlcyxvkwq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kVsPiJutYuMj8XniLjDGVw_LnULXf6e';
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// PATH DETECTION
const isSubfolder = window.location.pathname.includes('/leo/') || 
                    window.location.pathname.includes('/fd/') || 
                    window.location.pathname.includes('/civ/');
const basePath = isSubfolder ? '../' : '';

// ... (existing navigation functions) ...

// DATA ENGINE
let penalData = null;
let vehicleData = null;
let civVehicleData = null;
let fdVehicleData = null;

async function loadAllData() {
    try {
        log('Fetching data from Supabase...');
        
        // Fetch all tables in parallel
        const [penalRes, leoVehRes, civVehRes, fdVehRes] = await Promise.all([
            sbClient.from('penal_code').select('*'),
            sbClient.from('leo_vehicles').select('*'),
            sbClient.from('civ_vehicles').select('*'),
            sbClient.from('fd_vehicles').select('*')
        ]);

        // Transform Penal Code back to grouped format
        if (penalRes.data) {
            penalData = {};
            penalRes.data.forEach(row => {
                const sectionKey = row.section_title.toLowerCase().includes('motor') ? 'vehicle' : 
                                 row.section_title.toLowerCase().includes('wildlife') ? 'wildlife' :
                                 row.section_title.toLowerCase().includes('policy') ? 'policy' : 'criminal';
                
                if (!penalData[sectionKey]) penalData[sectionKey] = [];
                let section = penalData[sectionKey].find(s => s.title === row.section_title);
                if (!section) {
                    section = { title: row.section_title, laws: [] };
                    penalData[sectionKey].push(section);
                }
                section.laws.push({ id: row.id, name: row.name, description: row.description, class: row.class });
            });
        }

        // Transform LEO Vehicles
        if (leoVehRes.data) {
            vehicleData = {};
            leoVehRes.data.forEach(row => {
                if (!vehicleData[row.department]) vehicleData[row.department] = [];
                vehicleData[row.department].push({ role: row.role, model: row.model, code: row.code });
            });
        }

        // Transform Civ Vehicles
        if (civVehRes.data) {
            civVehicleData = {};
            civVehRes.data.forEach(row => {
                if (!civVehicleData[row.category]) civVehicleData[row.category] = [];
                civVehicleData[row.category].push({ role: row.role, model: row.model, code: row.code });
            });
        }

        // Transform FD Vehicles
        if (fdVehRes.data) {
            fdVehicleData = { 'fire': [], 'ems': [] };
            fdVehRes.data.forEach(row => {
                // Heuristic to split FD/EMS
                const type = row.role.toLowerCase().includes('ambulance') || row.role.toLowerCase().includes('medical') ? 'ems' : 'fire';
                fdVehicleData[type].push({ role: row.role, model: row.model, code: row.code });
            });
        }

        renderPenalCode();
        renderVehicles();
        renderCivVehicles();
        renderFDVehicles();
        
        lucide.createIcons();
    } catch (err) {
        console.error("Data Load Error:", err);
    }
}

function log(msg) { console.log(`[Database] ${msg}`); }


function renderCivVehicles() {
    if (!civVehicleData) return;
    const tabContainer = document.getElementById('civ-vehicle-tabs');
    const dataContainer = document.getElementById('civ-vehicle-data-container');
    if (!tabContainer || !dataContainer) return;
    
    tabContainer.innerHTML = Object.keys(civVehicleData).map((key, index) => `
        <button class="sub-tab-civ-v ${index === 0 ? 'active bg-emerald-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" 
                onclick="openCivVehicleSubTab('cv-${key}', event)">
            ${key.toUpperCase()}
        </button>
    `).join('');

    dataContainer.innerHTML = Object.keys(civVehicleData).map((key, index) => `
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
    
    tabContainer.innerHTML = Object.keys(fdVehicleData).map((key, index) => `
        <button class="sub-tab-fd-v ${index === 0 ? 'active bg-red-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" 
                onclick="openFDVehicleSubTab('fv-${key}', event)">
            ${key.toUpperCase()}
        </button>
    `).join('');

    dataContainer.innerHTML = Object.keys(fdVehicleData).map((key, index) => `
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

function renderPenalCode(filter = '') {
    if (!penalData) return;
    const searchTerm = filter.toLowerCase();
    const tabContainer = document.getElementById('penal-tabs');
    const dataContainer = document.getElementById('penal-data-container');
    if (!tabContainer || !dataContainer) return;
    
    if (tabContainer.innerHTML.trim() === "") {
        tabContainer.innerHTML = Object.keys(penalData).map((key, index) => `
            <button class="sub-tab-penal ${index === 0 ? 'active bg-sky-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all" 
                    onclick="openPenalSubTab('p-${key}', event)">
                ${getDisplayName(key)}
            </button>
        `).join('');
    }

    dataContainer.innerHTML = Object.keys(penalData).map((key, index) => {
        let html = `<div id="p-${key}" class="penal-sub-content ${index === 0 ? 'active' : 'hidden'} space-y-6">`;
        let foundMatch = false;
        penalData[key].forEach(section => {
            const filteredLaws = section.laws.filter(law => 
                law.name.toLowerCase().includes(searchTerm) || 
                law.id.toLowerCase().includes(searchTerm) ||
                law.description.toLowerCase().includes(searchTerm)
            );
            if (filteredLaws.length > 0) {
                foundMatch = true;
                html += `
                    <div class="rounded-2xl overflow-hidden glassmorphism border border-slate-700 mb-6">
                        <div class="bg-slate-800/50 p-4 border-b border-slate-700 text-sky-300 font-bold uppercase tracking-widest text-[10px]">${section.title}</div>
                        <div class="p-6 divide-y divide-slate-800 space-y-4">
                            ${filteredLaws.map(law => `
                                <div class="flex justify-between items-start pt-4 first:pt-0">
                                    <div>
                                        <h4 class="font-bold text-white text-sm">${law.id}. ${law.name}</h4>
                                        <p class="text-xs text-slate-500">${law.description}</p>
                                    </div>
                                    <span class="${getClassStyle(law.class)} px-3 py-1 rounded-full text-[10px] font-bold border">${law.class}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        if (!foundMatch) html += `<p class="text-slate-500 text-sm italic">No matching records found.</p>`;
        html += `</div>`;
        return html;
    }).join('');
    lucide.createIcons();
}

function getDisplayName(key) {
    const names = { 'policy': 'Legal Policy', 'criminal': 'Criminal Code', 'vehicle': 'Vehicle Code', 'wildlife': 'Fish & Game' };
    return names[key] || key.toUpperCase();
}

function getClassStyle(cls) {
    switch(cls) {
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

    tabContainer.innerHTML = Object.keys(vehicleData).map((key, index) => `
        <button class="sub-tab ${index === 0 ? 'active bg-sky-600 text-white' : 'text-slate-500'} px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest" 
                onclick="openSubTab('v-${key}', event)">
            ${key.toUpperCase()}
        </button>
    `).join('');
    dataContainer.innerHTML = Object.keys(vehicleData).map((key, index) => `
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

// GALLERY LIGHTBOX
const galleryImages = [
    { src: 'images/17282257253000282112_20250511004744_1.png', caption: '' },
    { src: 'images/17282257253000282112_20250330005032_1.png', caption: '' },
    { src: 'images/17282257253000282112_20250505162250_1.png', caption: '' },
    { src: 'images/17282257253000282112_20250511010749_1.png', caption: '' },
    { src: 'images/im33age.png', caption: '' },
    { src: 'images/ima2ge.png', caption: '' },
    { src: 'images/imag1e.png', caption: '' },
    { src: 'images/imag222e.png', caption: '' },
    { src: 'images/image.png', caption: '' },
    { src: 'images/imagepdcentral.png', caption: '' },
    { src: 'images/imagesdk9.png', caption: '' },
    { src: 'images/imasdadsge.png', caption: '' },
    { src: 'images/imfdage.png', caption: '' }
];
let currentImageIndex = 0;

function openLightbox(index) {
    currentImageIndex = index;
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;
    document.getElementById('lightbox-img').src = basePath + galleryImages[index].src;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function changeImage(step) {
    currentImageIndex += step;
    if (currentImageIndex >= galleryImages.length) currentImageIndex = 0;
    if (currentImageIndex < 0) currentImageIndex = galleryImages.length - 1;
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = basePath + galleryImages[currentImageIndex].src;
        img.style.opacity = '1';
    }, 150);
}

// LISTENERS
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') changeImage(1);
    if (e.key === 'ArrowLeft') changeImage(-1);
});

document.addEventListener('DOMContentLoaded', () => {
    // Render initial static icons
    lucide.createIcons();
    
    loadAllData();
    
    const penalSearch = document.getElementById('penalSearch');
    if (penalSearch) penalSearch.addEventListener('input', (e) => renderPenalCode(e.target.value));
});
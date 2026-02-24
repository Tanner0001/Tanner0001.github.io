// PATH DETECTION
const isSubfolder = window.location.pathname.includes('/leo/') || 
                    window.location.pathname.includes('/fd/') || 
                    window.location.pathname.includes('/civ/');
const basePath = isSubfolder ? '../' : '';

// PORTAL NAVIGATION
function enterPortal(type) {
    // If we're on the main hub, we can just navigate to the subfolder
    window.location.href = type + '/';
}

function showHub() {
    window.location.href = basePath || './';
}

// MAIN TAB SWITCHING (LEO)
function openTab(tabName) {
    var i;
    var x = document.getElementsByClassName("tab-content");
    for (i = 0; i < x.length; i++) {
        x[i].classList.add("hidden");
        x[i].classList.remove("active");
    }
    const target = document.getElementById(tabName);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }

    var tabs = document.getElementsByClassName("tab");
    for (i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }
    
    const sidebar = document.querySelector('#manual aside');
    if (sidebar && !sidebar.classList.contains('hidden')) {
        toggleManualSidebar();
    }
    lucide.createIcons();
}

// SUB-TAB FUNCTIONALITY (VEHICLES, PENAL, UNIFORM)
function openSubTab(subTabName, event) {
    const contents = document.getElementsByClassName("sub-tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
        contents[i].classList.remove("active");
    }
    const buttons = document.getElementsByClassName("sub-tab");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active", "bg-sky-600", "text-white");
        buttons[i].classList.add("text-slate-500");
    }
    const target = document.getElementById(subTabName);
    if (target) {
        target.classList.remove("hidden", "active");
        target.classList.add("active");
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active", "bg-sky-600", "text-white");
    }
    lucide.createIcons();
}

function openPenalSubTab(subTabName, event) {
    const contents = document.getElementsByClassName("penal-sub-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("sub-tab-penal");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active", "bg-sky-600", "text-white");
        buttons[i].classList.add("text-slate-500");
    }
    const target = document.getElementById(subTabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) event.currentTarget.classList.add("active", "bg-sky-600", "text-white");
}

function openUniformSubTab(subTabName, event) {
    const contents = document.getElementsByClassName("uniform-sub-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("sub-tab-uniform");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active", "bg-sky-600", "text-white");
        buttons[i].classList.add("text-slate-500");
    }
    const target = document.getElementById(subTabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) event.currentTarget.classList.add("active", "bg-sky-600", "text-white");
}

// FD PORTAL TABS
function openFDTab(tabName, event) {
    const contents = document.getElementsByClassName("fd-tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("fd-tab");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
    const target = document.getElementById(tabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) event.currentTarget.classList.add("active");
    lucide.createIcons();
}

// CIV PORTAL TABS
function openCivTab(tabName, event) {
    const contents = document.getElementsByClassName("civ-tab-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("civ-tab");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }
    const target = document.getElementById(tabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) event.currentTarget.classList.add("active");
    lucide.createIcons();
}

function openCivSubTab(subTabName, event) {
    const contents = document.getElementsByClassName("civ-sub-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("civ-sub-tab");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active", "bg-emerald-600", "text-white");
        buttons[i].classList.add("text-slate-400", "hover:bg-slate-800");
    }
    const target = document.getElementById(subTabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active", "bg-emerald-600", "text-white");
        event.currentTarget.classList.remove("text-slate-400", "hover:bg-slate-800");
    }
    lucide.createIcons();
}

function openCivVehicleSubTab(subTabName, event) {
    const contents = document.getElementsByClassName("civ-vehicle-sub-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("sub-tab-civ-v");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active", "bg-emerald-600", "text-white");
        buttons[i].classList.add("text-slate-500");
    }
    const target = document.getElementById(subTabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) event.currentTarget.classList.add("active", "bg-emerald-600", "text-white");
}

function openFDVehicleSubTab(subTabName, event) {
    const contents = document.getElementsByClassName("fd-vehicle-sub-content");
    for (let i = 0; i < contents.length; i++) {
        contents[i].classList.add("hidden");
    }
    const buttons = document.getElementsByClassName("sub-tab-fd-v");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active", "bg-red-600", "text-white");
        buttons[i].classList.add("text-slate-500");
    }
    const target = document.getElementById(subTabName);
    if (target) target.classList.remove("hidden");
    if (event && event.currentTarget) event.currentTarget.classList.add("active", "bg-red-600", "text-white");
}

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
    try {
        const cacheBuster = `?v=${Date.now()}`;
        const [penalRes, vehicleRes, civVehRes, fdVehRes] = await Promise.all([
            fetch(basePath + 'penal_code.json' + cacheBuster),
            fetch(basePath + 'vehicles.json' + cacheBuster),
            fetch(basePath + 'civ_vehicles.json' + cacheBuster),
            fetch(basePath + 'fd_vehicles.json' + cacheBuster)
        ]);
        penalData = await penalRes.json();
        vehicleData = await vehicleRes.json();
        civVehicleData = await civVehRes.json();
        fdVehicleData = await fdVehRes.json();

        renderPenalCode();
        renderVehicles();
        renderCivVehicles();
        renderFDVehicles();
        
        // Final icon check after all dynamic content is injected
        lucide.createIcons();
    } catch (err) {
        console.error("Data Load Error:", err);
    }
}

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
const status = document.getElementById('status');

function log(msg) {
    status.innerHTML += `<div>> ${msg}</div>`;
    status.scrollTop = status.scrollHeight;
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function getLEOData() {
    const res = await fetch('../vehicles.json');
    const data = await res.json();
    const flattened = [];
    Object.keys(data).forEach(dept => {
        data[dept].forEach(v => {
            flattened.push({
                department: dept,
                role: v.role,
                model: v.model,
                code: v.code
            });
        });
    });
    return flattened;
}

async function getCivData() {
    const res = await fetch('../civ_vehicles.json');
    const data = await res.json();
    const flattened = [];
    Object.keys(data).forEach(cat => {
        data[cat].forEach(v => {
            flattened.push({
                category: cat,
                role: v.role,
                model: v.model,
                code: v.code
            });
        });
    });
    return flattened;
}

async function getFDData() {
    const res = await fetch('../fd_vehicles.json');
    const data = await res.json();
    const flattened = [];
    Object.keys(data).forEach(type => {
        data[type].forEach(v => {
            flattened.push({
                role: v.role,
                model: v.model,
                code: v.code
            });
        });
    });
    return flattened;
}

async function getPenalData() {
    const res = await fetch('../penal_code.json');
    const data = await res.json();
    const flattened = [];
    Object.keys(data).forEach(type => {
        data[type].forEach(section => {
            section.laws.forEach(law => {
                flattened.push({
                    id: law.id,
                    name: law.name,
                    description: law.description,
                    class: law.class,
                    section_title: section.title
                });
            });
        });
    });
    return flattened;
}

// Download Functions
async function downloadLEOCSV() {
    log('Generating LEO Vehicles CSV...');
    const data = await getLEOData();
    downloadFile('leo_vehicles.csv', convertToCSV(data));
    log('Downloaded: leo_vehicles.csv');
}

async function downloadCivCSV() {
    log('Generating Civilian Vehicles CSV...');
    const data = await getCivData();
    downloadFile('civ_vehicles.csv', convertToCSV(data));
    log('Downloaded: civ_vehicles.csv');
}

async function downloadFDCSV() {
    log('Generating FD Vehicles CSV...');
    const data = await getFDData();
    downloadFile('fd_vehicles.csv', convertToCSV(data));
    log('Downloaded: fd_vehicles.csv');
}

async function downloadPenalCSV() {
    log('Generating Penal Code CSV...');
    const data = await getPenalData();
    downloadFile('penal_code.csv', convertToCSV(data));
    log('Downloaded: penal_code.csv');
}

// Direct Migration Functions
async function migrateLEO() {
    log('Preparing LEO migration...');
    const flattened = await getLEOData();
    log(`Uploading ${flattened.length} rows...`);
    const { error } = await supabase.from('leo_vehicles').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: LEO Vehicles migrated.');
}

async function migrateCiv() {
    log('Preparing Civ migration...');
    const flattened = await getCivData();
    log(`Uploading ${flattened.length} rows...`);
    const { error } = await supabase.from('civ_vehicles').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: Civilian Vehicles migrated.');
}

async function migrateFD() {
    log('Preparing FD migration...');
    const flattened = await getFDData();
    log(`Uploading ${flattened.length} rows...`);
    const { error } = await supabase.from('fd_vehicles').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: FD Vehicles migrated.');
}

async function migratePenal() {
    log('Preparing Penal migration...');
    const flattened = await getPenalData();
    log(`Uploading ${flattened.length} rows...`);
    const { error } = await supabase.from('penal_code').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: Penal Code migrated.');
}
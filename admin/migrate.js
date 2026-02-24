const status = document.getElementById('status');

function log(msg) {
    status.innerHTML += `<div>> ${msg}</div>`;
    status.scrollTop = status.scrollHeight;
    console.log(msg);
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
    try {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        log(`Download Error: ${err.message}`);
    }
}

async function getLEOData() {
    const res = await fetch('../vehicles.json');
    const data = await res.json();
    const flattened = [];
    Object.keys(data).forEach(dept => {
        data[dept].forEach(v => {
            flattened.push({ department: dept, role: v.role, model: v.model, code: v.code });
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
            flattened.push({ category: cat, role: v.role, model: v.model, code: v.code });
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
            flattened.push({ role: v.role, model: v.model, code: v.code });
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
                flattened.push({ id: law.id, name: law.name, description: law.description, class: law.class, section_title: section.title });
            });
        });
    });
    return flattened;
}

async function downloadLEOCSV() {
    try {
        log('Generating LEO CSV...');
        const data = await getLEOData();
        downloadFile('leo_vehicles.csv', convertToCSV(data));
        log('Check your downloads folder.');
    } catch (err) { log(`Error: ${err.message}`); }
}

async function downloadCivCSV() {
    try {
        log('Generating Civ CSV...');
        const data = await getCivData();
        downloadFile('civ_vehicles.csv', convertToCSV(data));
        log('Check your downloads folder.');
    } catch (err) { log(`Error: ${err.message}`); }
}

async function downloadFDCSV() {
    try {
        log('Generating FD CSV...');
        const data = await getFDData();
        downloadFile('fd_vehicles.csv', convertToCSV(data));
        log('Check your downloads folder.');
    } catch (err) { log(`Error: ${err.message}`); }
}

async function downloadPenalCSV() {
    try {
        log('Generating Penal CSV...');
        const data = await getPenalData();
        downloadFile('penal_code.csv', convertToCSV(data));
        log('Check your downloads folder.');
    } catch (err) { log(`Error: ${err.message}`); }
}

async function migrateLEO() {
    try {
        log('Starting LEO Upload...');
        const data = await getLEOData();
        const { error } = await sbClient.from('leo_vehicles').insert(data);
        if (error) throw error;
        log('SUCCESS: LEO Vehicles migrated.');
    } catch (err) { log(`ERROR: ${err.message}`); }
}

async function migrateCiv() {
    try {
        log('Starting Civ Upload...');
        const data = await getCivData();
        const { error } = await sbClient.from('civ_vehicles').insert(data);
        if (error) throw error;
        log('SUCCESS: Civ Vehicles migrated.');
    } catch (err) { log(`ERROR: ${err.message}`); }
}

async function migrateFD() {
    try {
        log('Starting FD Upload...');
        const data = await getFDData();
        const { error } = await sbClient.from('fd_vehicles').insert(data);
        if (error) throw error;
        log('SUCCESS: FD Vehicles migrated.');
    } catch (err) { log(`ERROR: ${err.message}`); }
}

async function migratePenal() {
    try {
        log('Starting Penal Upload...');
        const data = await getPenalData();
        const { error } = await sbClient.from('penal_code').insert(data);
        if (error) throw error;
        log('SUCCESS: Penal Code migrated.');
    } catch (err) { log(`ERROR: ${err.message}`); }
}

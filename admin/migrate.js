const status = document.getElementById('status');

function log(msg) {
    status.innerHTML += `<div>> ${msg}</div>`;
    status.scrollTop = status.scrollHeight;
}

async function migrateLEO() {
    log('Fetching vehicles.json...');
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

    log(`Prepared ${flattened.length} rows. Uploading...`);
    const { error } = await supabase.from('leo_vehicles').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: LEO Vehicles migrated.');
}

async function migrateCiv() {
    log('Fetching civ_vehicles.json...');
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

    log(`Prepared ${flattened.length} rows. Uploading...`);
    const { error } = await supabase.from('civ_vehicles').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: Civilian Vehicles migrated.');
}

async function migrateFD() {
    log('Fetching fd_vehicles.json...');
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

    log(`Prepared ${flattened.length} rows. Uploading...`);
    const { error } = await supabase.from('fd_vehicles').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: FD Vehicles migrated.');
}

async function migratePenal() {
    log('Fetching penal_code.json...');
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

    log(`Prepared ${flattened.length} rows. Uploading...`);
    const { error } = await supabase.from('penal_code').insert(flattened);
    if (error) log(`ERROR: ${error.message}`);
    else log('SUCCESS: Penal Code migrated.');
}

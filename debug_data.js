const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to read .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    try {
        const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value?.trim().replace(/"/g, '');
            if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value?.trim().replace(/"/g, '');
        });
    } catch (e) {
        console.error("Could not read .env.local");
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    let output = "";
    const log = (msg) => { output += msg + "\n"; console.log(msg); };

    log("--- DEBUGGING SERVICES (Columns) ---");
    const { data: services, error: sError } = await supabase.from('services').select('id, name, columns_config');
    if (sError) log(JSON.stringify(sError));
    else {
        services.forEach(s => {
            log(`Service: ${s.name}`);
            if (Array.isArray(s.columns_config)) {
                s.columns_config.forEach(c => {
                    log(` - Col: ${c.label} | Type: ${c.type} | ID: ${c.id}`);
                });
            } else {
                log(" - No valid columns config");
            }
            log("------------------------------------------------");
        });
    }

    log("\n--- DEBUGGING ITEMS (Data Keys) ---");
    const { data: items, error: iError } = await supabase.from('items').select('id, service_id, data').limit(10);
    if (iError) log(JSON.stringify(iError));
    else {
        items.forEach(i => {
            log(`Item (Service: ${i.service_id})`);
            log("Data Keys: " + JSON.stringify(Object.keys(i.data || {})));
            log("Data Values: " + JSON.stringify(i.data));
            log("------------------------------------------------");
        });
    }

    fs.writeFileSync('debug_output.txt', output);
    console.log("Output written to debug_output.txt");
}

debug();

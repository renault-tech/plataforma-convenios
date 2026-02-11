const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl, supabaseKey;

try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

        if (urlMatch) supabaseUrl = urlMatch[1].trim();
        if (keyMatch) supabaseKey = keyMatch[1].trim();
    }
} catch (e) {
    console.log('Error reading .env.local:', e);
}

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    console.log('Checking service_columns schema...');

    // Try to select the 'options' column
    const { data, error } = await supabase
        .from('service_columns')
        .select('options')
        .limit(1);

    if (error) {
        console.log('Error verifying column:', error.message);
        if (error.message.includes('dt does not exist') || error.message.includes('column "options" does not exist')) {
            console.log('MIGRATION_MISSING: The options column is missing.');
        } else {
            console.log('OTHER_ERROR:', error);
        }
    } else {
        console.log('SUCCESS: Column options exists.');
    }
}

checkColumn();

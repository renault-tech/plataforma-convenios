import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser (robust)
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            const env: any = {};
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    if (key && !key.startsWith('#')) {
                        env[key] = value;
                    }
                }
            });
            return env;
        } else {
            console.warn('⚠️ .env.local not found at:', envPath);
        }
    } catch (e) {
        console.error("Error reading .env.local", e);
    }
    return {};
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer Service Role Key for Admin operations (writing to changelog might be restricted)
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase credentials in .env.local (NEED SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);


const args = process.argv.slice(2);
// Usage: ts-node scripts/add_changelog.ts "Title" "Description" "category"
const title = args[0];
const description = args[1];
const category = args[2] || 'feature'; // feature, bugfix, improvement

if (!title || !description) {
    console.error('Usage: npx tsx scripts/add_changelog.ts "Title" "Description" [category]');
    process.exit(1);
}

async function addEntry() {
    console.log(`Adding Changelog Entry: [${category}] ${title}`);

    const { error } = await supabase
        .from('changelog')
        .insert({
            title,
            description,
            category,
            created_at: new Date().toISOString()
        });

    if (error) {
        console.error('Failed to add entry:', error);
        process.exit(1);
    }

    console.log('✅ Changelog entry added successfully!');
}

addEntry();

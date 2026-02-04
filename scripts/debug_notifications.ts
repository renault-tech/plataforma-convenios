
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parser
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
        }
    } catch (e) {
        console.error("Error reading .env.local", e);
    }
    return {};
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- DEBUGGING NOTIFICATIONS ---");
    console.log(`URL: ${supabaseUrl}`);

    // 1. Check Notification Rules
    const { data: rules, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (rulesError) {
        console.error("Error fetching rules:", rulesError);
        return;
    }

    console.log(`Found ${rules?.length} recent rules.`);
    if (rules && rules.length > 0) {
        const rule = rules[0];
        console.log("Latest Rule:", JSON.stringify(rule, null, 2));

        // 2. Check Target Item for the latest rule
        if (rule.target_type === 'row' || rule.service_id) {
            let query = supabase.from('items').select('*').limit(1);

            if (rule.target_type === 'row') {
                console.log(`Checking ITEM ID: ${rule.target_id}`);
                query = query.eq('id', rule.target_id);
            } else if (rule.service_id) {
                console.log(`Checking Service ID: ${rule.service_id}`);
                query = query.eq('service_id', rule.service_id);
            }

            const { data: items, error: itemsError } = await query;
            if (itemsError) console.error("Error fetching items:", itemsError);
            else if (items && items.length > 0) {
                const item = items[0];
                console.log("Found Item Example:", {
                    id: item.id,
                    service_id: item.service_id,
                    data_keys: Object.keys(item.data || {})
                });

                // Test Column Match
                const config = rule.trigger_config as any;
                // rule.target_id might be the column id if target_type is column
                const colId = config?.column_id || (rule.target_type === 'column' ? rule.target_id : 'vencimento');
                const val = item.data?.[colId] || item[colId];
                console.log(`Checking Column '${colId}': Value =`, val);
            } else {
                console.log("No items found matching rule.");
            }
        }
    }

    // 3. Check Recent Notifications
    const { data: notifs, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (notifsError) console.error("Error fetching notifications:", notifsError);
    else {
        console.log(`\nFound ${notifs?.length} recent notifications in DB:`);
        notifs?.forEach(n => {
            console.log(`- [${n.type}] ${n.title} | Msg: ${n.message.substring(0, 30)}... | Read: ${n.read_at}`);
        });
    }
}

debug();

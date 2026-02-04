import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

export async function GET(request: Request) {
    const supabase = await createClient();

    try {
        // 1. Fetch active DATE rules with Service info if needed
        const { data: rules, error } = await supabase
            .from('notification_rules')
            .select('*, services:service_id(name)')
            .eq('active', true)
            .eq('trigger_type', 'date');

        if (error) throw error;

        console.log(`[Check API] Found ${rules?.length || 0} active DATE rules.`);

        const notificationsToSend: any[] = [];

        // 2. Process each rule
        for (const rule of rules) {
            const config = rule.trigger_config as { offset: number, column_id?: string };
            const offset = Number(config.offset || 0);
            const serviceName = rule.services?.name || "Geral";

            // Determine target items
            let itemsToCheck: any[] = [];

            if (rule.target_type === 'row') {
                // Check specific item in 'items' table
                // Join 'service' to get name if not in rule (though rule has service_id likely)
                const { data: item } = await supabase
                    .from('items') // CORRECT TABLE
                    .select('*, services:service_id(name)')
                    .eq('id', rule.target_id)
                    .single();

                if (item) itemsToCheck.push(item);
            } else {
                // Check ALL items for the column in the specific service
                if (rule.service_id) {
                    const { data: items } = await supabase
                        .from('items')
                        .select('*, services:service_id(name)')
                        .eq('service_id', rule.service_id);
                    if (items) itemsToCheck = items;
                } else {
                    // Global column rule? Rare but possible.
                    const { data: items } = await supabase.from('items').select('*, services:service_id(name)');
                    if (items) itemsToCheck = items;
                }
            }

            // 3. Check Condition
            // Force Brazil Time logic (UTC-3) for "Today" to align with user expectation
            const now = new Date();
            const brazilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
            const today = startOfDay(brazilNow);

            for (const item of itemsToCheck) {
                // Configured column ID (e.g. 'vencimento') or default
                // Item data is in 'data' column (JSONB) usually? 
                // Wait, in Planilha Concept, 'items' table has 'data' jsonb column.
                // OR columns are first-class?
                // Based on ItemsTable.tsx, `row.original[colId]` is used.
                // If it's `items` table, it likely has `data` column.
                // Let's assume `item.data[colId]` OR `item[colId]` if promoted.
                // Safe access: `item.data?.[colId] || item[colId]`

                // Prioritize column_id from config (v2 rules), fallback to target_id (v1 column rules) or 'vencimento' (v1 row rules)
                const colId = config.column_id || (rule.target_type === 'column' ? rule.target_id : 'vencimento');
                const dateVal = item.data?.[colId] || item[colId];

                if (dateVal) {
                    // Robust Date Parsing (ISO or DD/MM/YYYY)
                    let itemDate;
                    if (dateVal.includes('/')) {
                        const [d, m, y] = dateVal.split('/');
                        itemDate = startOfDay(new Date(`${y}-${m}-${d}`));
                    } else {
                        itemDate = startOfDay(parseISO(dateVal));
                    }
                    if (isNaN(itemDate.getTime())) continue; // Skip invalid dates
                    const diff = differenceInDays(itemDate, today);

                    // Logic: Difference matches the *absolute* offset.
                    // e.g. Offset -7 (7 days before). Diff should be 7.
                    if (diff === Math.abs(offset)) {

                        const originName = item.services?.name || serviceName;
                        const itemName = item.data?.nome || item.data?.objeto || item.id.substring(0, 8); // Try to get a readable name

                        notificationsToSend.push({
                            user_id: rule.user_id,
                            type: 'alert',
                            title: `Alerta: ${originName}`, // Origin Identification
                            message: `O item "${itemName}" vence em ${diff} dias.`,
                            link: `/servicos/${item.services?.slug || rule.service_id}?highlight=${item.id}`,
                            read: false
                        });
                    }
                }
            }
        }

        // 4. Send Notifications (Batch Insert)
        if (notificationsToSend.length > 0) {
            const { error: insError } = await supabase.from('notifications').insert(notificationsToSend);
            if (insError) throw insError;
        }

        return NextResponse.json({ success: true, count: notificationsToSend.length });

    } catch (error: any) {
        console.error("Check failed", error);
        return NextResponse.json({ error: "Check failed", details: error.message }, { status: 500 });
    }
}

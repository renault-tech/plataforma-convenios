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

        // Pre-fetch primary columns for all services involved
        const serviceIds = [...new Set(rules.map(r => r.service_id).filter(Boolean))];
        let primaryColumnsMap: Record<string, string> = {};

        if (serviceIds.length > 0) {
            const { data: primaryCols } = await supabase
                .from('service_columns')
                .select('service_id, name')
                .in('service_id', serviceIds)
                .order('order', { ascending: true }); // Assume first column is identifier

            if (primaryCols) {
                // Keep only the first column found for each service
                primaryCols.forEach(col => {
                    if (!primaryColumnsMap[col.service_id]) {
                        primaryColumnsMap[col.service_id] = col.name;
                    }
                });
            }
        }

        // 2. Process each rule
        for (const rule of rules) {
            const config = rule.trigger_config as { offset: number, column_id?: string };
            const offset = Number(config.offset || 0);
            const serviceName = rule.services?.name || "Geral";
            const serviceId = rule.service_id;

            // Determine target items
            let itemsToCheck: any[] = [];

            if (rule.target_type === 'row') {
                // Check specific item in 'items' table
                const { data: item } = await supabase
                    .from('items')
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
                    const { data: items } = await supabase.from('items').select('*, services:service_id(name)');
                    if (items) itemsToCheck = items;
                }
            }

            // 3. Check Condition
            const now = new Date();
            const brazilNow = new Date(now.getTime() - (3 * 60 * 60 * 1000));
            const today = startOfDay(brazilNow);

            for (const item of itemsToCheck) {
                const colId = config.column_id || (rule.target_type === 'column' ? rule.target_id : 'vencimento');
                const dateVal = item.data?.[colId] || item[colId];

                if (dateVal) {
                    let itemDate;
                    if (dateVal.includes('/')) {
                        const [d, m, y] = dateVal.split('/');
                        itemDate = startOfDay(new Date(`${y}-${m}-${d}`));
                    } else {
                        itemDate = startOfDay(parseISO(dateVal));
                    }
                    if (isNaN(itemDate.getTime())) continue;

                    const diff = differenceInDays(itemDate, today);

                    if (diff === Math.abs(offset)) {
                        const originName = item.services?.name || serviceName;

                        // Try to find the primary column value for this service
                        const primaryCol = serviceId ? primaryColumnsMap[serviceId] : null;
                        const identifier = (primaryCol && item.data?.[primaryCol])
                            || item.data?.nome
                            || item.data?.objeto
                            || (Object.values(item.data || {})[0] as string) // Fallback to first value
                            || item.id.substring(0, 8);

                        // Ensure we use a clean string
                        const cleanIdentifier = String(identifier).substring(0, 50);

                        notificationsToSend.push({
                            user_id: rule.user_id,
                            type: 'alert',
                            title: `Alerta: ${originName}`,
                            message: `O item "${cleanIdentifier}" - Status: ${colId} vence em ${diff} dias.`,
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

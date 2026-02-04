'use server'

import { createClient } from "@/lib/supabase/server"

export async function getDashboardData(serviceId: string) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        // Fetch ALL items for the service to calculate dashboard metrics
        // We do not limit here because we need accurate totals
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Server Fetch Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Unexpected Dashboard Error:', error)
        return { success: false, error: error.message }
    }
}

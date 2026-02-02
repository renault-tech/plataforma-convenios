'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function markServiceAsViewed(serviceId: string) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const { error } = await supabase
            .from('user_service_views')
            .upsert(
                {
                    user_id: user.id,
                    service_id: serviceId,
                    last_viewed_at: new Date().toISOString()
                },
                { onConflict: 'user_id, service_id' }
            )

        if (error) {
            console.error("Error marking service as viewed:", error)
            return { success: false, error: error.message }
        }

        // We don't necessarily need to revalidate path if we use client state, 
        // but revalidating ensures next fetch has correct data.
        return { success: true }
    } catch (error: any) {
        console.error("Error in markServiceAsViewed:", error)
        return { success: false, error: error.message }
    }
}

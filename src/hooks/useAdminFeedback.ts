"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAdmin } from "@/hooks/useAdmin"

export function useAdminFeedback() {
    const { isAdmin } = useAdmin()
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        if (!isAdmin) return

        const fetchCount = async () => {
            const { count } = await supabase
                .from("feedback")
                .select("*", { count: "exact", head: true })
                .eq("status", "new")

            setUnreadCount(count || 0)
        }

        fetchCount()

        const channel = supabase
            .channel('feedback-admin-count')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'feedback' },
                () => fetchCount()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isAdmin])

    return { unreadCount, hasUnread: unreadCount > 0 }
}

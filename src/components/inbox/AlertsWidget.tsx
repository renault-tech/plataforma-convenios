"use client"

import { useEffect, useState } from "react"
import { Bell, BellRing } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsInboxDialog } from "@/components/notifications/NotificationsInboxDialog"
import { cn } from "@/lib/utils"

export function AlertsWidget() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchUnread()
        // Subscribe to realtime? Maybe later. For now fetch on mount.
        const interval = setInterval(fetchUnread, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchUnread = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)

        setUnreadCount(count || 0)
    }

    return (
        <>
            <div
                onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(true)
                }}
                className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-full min-h-[160px]"
            >
                <div className={cn(
                    "p-3 rounded-full mb-3 transition-colors",
                    unreadCount > 0 ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                )}>
                    {unreadCount > 0 ? <BellRing className="h-8 w-8" /> : <Bell className="h-8 w-8" />}
                </div>

                <div className="text-center">
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">
                        {unreadCount}
                    </h3>
                    <p className={cn("text-sm font-medium", unreadCount > 0 ? "text-red-500" : "text-slate-500")}>
                        {unreadCount === 1 ? 'Alerta Pendente' : 'Alertas Pendentes'}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <span className="absolute top-4 right-4 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>

            <NotificationsInboxDialog open={isOpen} onOpenChange={(o) => {
                setIsOpen(o)
                if (!o) fetchUnread() // Refresh on close
            }} />
        </>
    )
}

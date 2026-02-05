"use client"

import { useEffect, useState } from "react"
import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { NotificationManagerDialog } from "./NotificationManagerDialog"
import { cn } from "@/lib/utils"

export function ServiceAlertsButton({ serviceId }: { serviceId: string }) {
    const [hasRules, setHasRules] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setIsMounted(true)
        const checkRulesAndAlerts = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get service slug for link matching
            const { data: service } = await supabase
                .from('services')
                .select('slug')
                .eq('id', serviceId)
                .single()

            // Check if there are configured rules
            const { count: rulesCount } = await supabase
                .from('notification_rules')
                .select('*', { count: 'exact', head: true })
                .eq('service_id', serviceId)

            setHasRules((rulesCount || 0) > 0)

            // Check for unread notifications for this service using API route
            if (service?.slug) {
                try {
                    const response = await fetch('/api/notifications/inbox')
                    if (response.ok) {
                        const data = await response.json()
                        const serviceNotifs = (data.notifications || []).filter((n: any) =>
                            !n.read && n.link && n.link.includes(`/servicos/${service.slug}`)
                        )
                        setUnreadCount(serviceNotifs.length)
                    }
                } catch (error) {
                    console.error('Error fetching notifications:', error)
                    setUnreadCount(0)
                }
            }

            setIsLoading(false)
        }
        checkRulesAndAlerts()

        // Poll for updates every 30 seconds
        const interval = setInterval(checkRulesAndAlerts, 30000)
        return () => clearInterval(interval)
    }, [serviceId])

    if (!isMounted) return null

    return (
        <NotificationManagerDialog serviceId={serviceId}>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 gap-2 ml-2 transition-colors relative",
                    unreadCount > 0
                        ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                        : hasRules
                            ? "text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
                title="Gerenciar Alertas desta Planilha"
            >
                {unreadCount > 0 ? <BellRing className="h-4 w-4 animate-pulse" /> : hasRules ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span>Meus Alertas</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </NotificationManagerDialog>
    )
}

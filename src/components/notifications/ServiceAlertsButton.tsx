"use client"

import { useEffect, useState } from "react"
import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { NotificationManagerDialog } from "./NotificationManagerDialog"
import { cn } from "@/lib/utils"

export function ServiceAlertsButton({ serviceId }: { serviceId: string }) {
    const [hasRules, setHasRules] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setIsMounted(true)
        const checkRules = async () => {
            const { count } = await supabase
                .from('notification_rules')
                .select('*', { count: 'exact', head: true })
                .eq('service_id', serviceId)

            setHasRules((count || 0) > 0)
            setIsLoading(false)
        }
        checkRules()
    }, [serviceId])

    if (!isMounted) return null

    return (
        <NotificationManagerDialog serviceId={serviceId}>
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    "h-8 gap-2 ml-2 transition-colors",
                    hasRules ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
                title="Gerenciar Alertas desta Planilha"
            >
                {hasRules ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                <span>Meus Alertas</span>
            </Button>
        </NotificationManagerDialog>
    )
}

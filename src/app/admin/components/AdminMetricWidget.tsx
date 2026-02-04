"use client"

import { CardContent } from "@/components/ui/card"
import { useAdminDashboard, WidgetType } from "@/hooks/useAdminDashboard"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function AdminMetricWidget({ type }: { type: WidgetType }) {
    const [value, setValue] = useState<string | number>("--")
    const [subtext, setSubtext] = useState("")
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            if (type === 'stats_users') {
                const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
                setValue(count || 0)
                setSubtext("Usuários totais")
            } else if (type === 'stats_services') {
                const { count } = await supabase.from('services').select('*', { count: 'exact', head: true })
                setValue(count || 0)
                setSubtext("Serviços registrados")
            }
        }
        fetchData()
    }, [type, supabase])

    return (
        <CardContent className="pt-4">
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
        </CardContent>
    )
}

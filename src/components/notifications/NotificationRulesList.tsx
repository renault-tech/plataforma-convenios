"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, Activity, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface NotificationRule {
    id: string
    target_type: 'column' | 'row'
    target_id: string
    trigger_type: 'date' | 'status'
    trigger_config: any
    active: boolean
    created_at: string
    service_id?: string
    services?: { name: string; slug?: string } | null
}

export function NotificationRulesList({ serviceId }: { serviceId?: string }) {
    const [rules, setRules] = useState<NotificationRule[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchRules()
    }, [serviceId])

    const fetchRules = async () => {
        setIsLoading(true)
        // Select 'slug' from services if available, assuming schema has it. 
        // If not, we use ID. Usually 'services' table has 'id' and 'name'.
        // I'll select * from services to be safe or just minimal.
        let query = supabase
            .from('notification_rules')
            .select('*, services(name, slug)') // Fetch slug for linking
            .order('created_at', { ascending: false })

        if (serviceId) {
            query = query.eq('service_id', serviceId)
        }

        const { data, error } = await query

        if (data) setRules(data as any)
        setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
        // Optimistic update
        setRules(prev => prev.filter(r => r.id !== id))

        const { error } = await supabase
            .from('notification_rules')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error("Erro ao excluir alerta")
            fetchRules() // Rollback
        } else {
            toast.success("Alerta removido")
        }
    }

    const getRuleDescription = (rule: NotificationRule) => {
        if (rule.trigger_type === 'status') {
            const status = rule.trigger_config?.to || "Qualquer status"
            return rule.target_type === 'column'
                ? `Ao mudar qualquer item para "${status}"`
                : `Ao mudar este item para "${status}"`
        } else {
            const offset = rule.trigger_config?.offset
            const when = offset === 0 ? "No dia" : `${Math.abs(offset)} dias antes`
            return rule.target_type === 'column'
                ? `Avisar ${when} do vencimento (Todos)`
                : `Avisar ${when} do vencimento (Item)`
        }
    }

    const getLink = (rule: NotificationRule) => {
        const slug = rule.services?.slug || rule.service_id
        if (!slug) return null

        if (rule.target_type === 'row') {
            return `/servicos/${slug}?highlight=${rule.target_id}`
        }
        return `/servicos/${slug}`
    }

    if (isLoading) {
        return <div className="text-center text-slate-500 py-8">Carregando...</div>
    }

    if (rules.length === 0) {
        return (
            <div className="text-center text-slate-500 py-8 border-2 border-dashed rounded-lg">
                Você ainda não tem alertas configurados.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start gap-3 overflow-hidden">
                        <div className={`p-2 rounded-full flex-shrink-0 ${rule.trigger_type === 'date' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {rule.trigger_type === 'date' ? <Calendar className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-900 truncate pr-2">
                                {getRuleDescription(rule)}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1 items-center">
                                {rule.services?.name && !serviceId && (
                                    <Badge variant="outline" className="text-[10px] h-5 bg-slate-100 hover:bg-slate-200 cursor-default">
                                        {rule.services.name}
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-[10px] h-5">
                                    {rule.target_type === 'column' ? 'Geral' : 'Item Específico'}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                    {format(new Date(rule.created_at), 'dd/MM/yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Navigation Link - Only show if we have context to link to */}
                        {rule.service_id && (
                            <Link href={getLink(rule) || '#'}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    title="Ir para o item"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(rule.id)}
                            title="Excluir regra"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

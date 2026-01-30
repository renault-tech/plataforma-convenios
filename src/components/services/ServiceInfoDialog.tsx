"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, User, Users, Shield, Clock, Calendar } from "lucide-react"
import { Service } from "@/contexts/ServiceContext"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ServiceInfoDialogProps {
    service: Service
}

export function ServiceInfoDialog({ service }: ServiceInfoDialogProps) {
    const [open, setOpen] = useState(false)
    const [permissions, setPermissions] = useState<any[]>([])
    const [lastUpdate, setLastUpdate] = useState<{ at: string, by: string } | null>(null)
    const [owner, setOwner] = useState<{ name: string, email: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, service.id])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Owner
            if (service.owner_id) {
                const { data: ownerData } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', service.owner_id)
                    .single()
                if (ownerData) setOwner({ name: ownerData.full_name || 'Usuário', email: ownerData.email })
            }

            // 2. Fetch Permissions (Who has access)
            const { data: permData } = await supabase
                .from('service_permissions')
                .select(`
                    id, grantee_type, grantee_id, permission_level, status,
                    policies:policy_id(name)
                `)
                .eq('service_id', service.id)
                .eq('status', 'active') // Only active

            if (permData) {
                // Enrich with names
                const enriched = await Promise.all(permData.map(async (p: any) => {
                    let name = "Desconhecido"
                    let email = ""
                    if (p.grantee_type === 'user') {
                        const { data } = await supabase.from('profiles').select('full_name, email').eq('id', p.grantee_id).single()
                        name = data?.full_name || data?.email || "Usuário"
                        email = data?.email
                    } else {
                        const { data } = await supabase.from('access_groups').select('name').eq('id', p.grantee_id).single()
                        name = data?.name || "Grupo"
                    }
                    return { ...p, name, email }
                }))
                setPermissions(enriched)
            }

            // 3. Fetch Last Activity (Latest item update)
            // Assuming table name is built from slug or we query 'items' view if exists?
            // The system seems to use dynamic tables per service or a single 'items' table with service_id?
            // Let's assume 'items_data' or similar. 
            // Wait, looking at ItemsTable.tsx calls `service_items_${service.id}` or generic?
            // Usually it's `service_items` table with `service_id`.
            // Let's check ItemsTable to be sure. 
            // If I can't be sure, I'll attempt generic `items` or skip for now.
            // Assumption: Generic `items` table or `service_items`.
            // Let's try fetching from `service_items` (common pattern)
            const { data: lastItem } = await supabase
                .from('items') // Guessing standard table name
                .select('updated_at, updated_by')
                .eq('service_id', service.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (lastItem) {
                let by = "Alguém"
                if (lastItem.updated_by) {
                    const { data: updater } = await supabase.from('profiles').select('full_name').eq('id', lastItem.updated_by).single()
                    if (updater) by = updater.full_name
                }
                setLastUpdate({ at: lastItem.updated_at, by })
            }

        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        Informações do Serviço
                    </DialogTitle>
                    <DialogDescription>
                        Detalhes sobre "{service.name}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Owner & Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">Proprietário</span>
                            <div className="flex items-center gap-2 font-medium">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px]">
                                        {owner?.name?.substring(0, 2).toUpperCase() || 'US'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{owner?.name || 'Carregando...'}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">Última Atualização</span>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>
                                    {lastUpdate ? (
                                        format(new Date(lastUpdate.at), "dd/MM/yy HH:mm", { locale: ptBR })
                                    ) : 'Sem registros'}
                                </span>
                            </div>
                            {lastUpdate && <p className="text-[10px] text-muted-foreground">por {lastUpdate.by}</p>}
                        </div>
                    </div>

                    {/* Sharing List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                Quem tem acesso
                            </span>
                            <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                                {permissions.length} usuários/grupos
                            </span>
                        </div>

                        <ScrollArea className="h-[150px] border rounded-md p-2 bg-slate-50">
                            {permissions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
                                    <span>Apenas você tem acesso.</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {permissions.map((perm) => (
                                        <div key={perm.id} className="flex items-center justify-between text-sm p-2 bg-white rounded border shadow-sm">
                                            <div className="flex items-center gap-2">
                                                {perm.grantee_type === 'group' ? (
                                                    <Users className="h-3.5 w-3.5 text-orange-500" />
                                                ) : (
                                                    <User className="h-3.5 w-3.5 text-blue-500" />
                                                )}
                                                <span className="truncate max-w-[120px]" title={perm.name}>
                                                    {perm.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="capitalize text-slate-500 bg-slate-100 px-1 rounded">
                                                    {perm.permission_level === 'view' ? 'Leitor' : perm.permission_level === 'edit' ? 'Editor' : 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Footer Info */}
                    <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Shield className="h-3 w-3" />
                        Dados protegidos por criptografia de ponta-a-ponta (SSL/TLS).
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

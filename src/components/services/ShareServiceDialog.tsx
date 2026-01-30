"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, UserPlus, Users, Trash2, Shield, Lock, Plus } from "lucide-react"
import { Service } from "@/contexts/ServiceContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface ShareServiceDialogProps {
    service: Service
}

type Permission = {
    id: string
    grantee_type: 'user' | 'group'
    grantee_id: string
    permission_level: 'view' | 'edit' | 'admin'
    policy_id: string | null
    grantee_details?: any
    policy_details?: any
    origin_group_id?: string
}

export function ShareServiceDialog({ service }: ShareServiceDialogProps) {
    const [open, setOpen] = useState(false)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [accessGroups, setAccessGroups] = useState<any[]>([])
    const [accessPolicies, setAccessPolicies] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Form State
    const [selectedType, setSelectedType] = useState<'user' | 'group'>('group')
    const [selectedGranteeId, setSelectedGranteeId] = useState("")
    const [selectedPolicyId, setSelectedPolicyId] = useState<string>("none")
    const [selectedLevel, setSelectedLevel] = useState<'view' | 'edit' | 'admin'>('view')

    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, service.id])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setCurrentUser(data)
        }

        const [permData, groupsData, policiesData, usersData] = await Promise.all([
            supabase.from('service_permissions')
                .select(`
                    id, grantee_type, grantee_id, permission_level, policy_id, origin_group_id,
                    policies:policy_id(name)
                `)
                .eq('service_id', service.id),

            supabase.from('access_groups').select('id, name'),

            supabase.from('access_policies')
                .select('id, name')
                .or(`service_id.is.null,service_id.eq.${service.id}`),

            supabase.from('profiles').select('id, full_name, email').limit(50)
        ])

        if (permData.data) {
            const perms = permData.data as any[]
            const enhancedPerms = perms.map(p => {
                let details = null;
                // If it came from a group, look up user details but maybe indicate group logic?
                // Actually if origin_group_id is set, it's a User permission but linked to group.
                if (p.grantee_type === 'group') {
                    details = groupsData.data?.find(g => g.id === p.grantee_id)
                } else {
                    details = usersData.data?.find(u => u.id === p.grantee_id)
                }
                return {
                    ...p,
                    grantee_details: details,
                    policy_details: p.policies
                }
            })
            setPermissions(enhancedPerms)
        }

        if (groupsData.data) setAccessGroups(groupsData.data)
        if (policiesData.data) setAccessPolicies(policiesData.data)
        if (usersData.data) setUsers(usersData.data)

        setLoading(false)
    }

    const handleShare = async () => {
        if (!selectedGranteeId) {
            toast.error("Selecione um grupo ou usuário")
            return
        }

        const senderName = currentUser?.full_name || currentUser?.email || "Alguém"

        if (selectedType === 'user') {
            // Direct User Share
            const { data: permData, error: permError } = await supabase
                .from('service_permissions')
                .insert({
                    service_id: service.id,
                    grantee_type: selectedType,
                    grantee_id: selectedGranteeId,
                    permission_level: selectedLevel,
                    policy_id: selectedPolicyId === "none" ? null : selectedPolicyId,
                    status: 'pending'
                })
                .select()
                .single()

            if (permError) {
                console.error(permError)
                toast.error("Erro ao criar convite: " + permError.message)
                return
            }

            await supabase.from('notifications').insert({
                user_id: selectedGranteeId,
                title: 'Convite de Acesso',
                message: `${senderName} convidou você para acessar "${service.name}".`,
                type: 'service_share',
                metadata: {
                    service_id: service.id,
                    service_slug: service.slug,
                    permission_id: permData.id,
                    grantee_type: selectedType,
                    grantee_id: selectedGranteeId,
                    sender_id: currentUser?.id,
                    sender_name: senderName
                }
            })
            toast.success("Convite enviado!")
            setSelectedGranteeId("")
            fetchData()

        } else {
            // Group Share: Mass Invite Logic (Snapshot)
            const policyId = selectedPolicyId === "none" ? null : selectedPolicyId

            // 1. Fetch Group Members
            const { data: members, error: membersError } = await supabase
                .from('access_group_members')
                .select('user_id')
                .eq('group_id', selectedGranteeId)

            if (membersError || !members) {
                console.error("Error fetching group members", membersError)
                toast.error("Erro ao buscar membros do grupo.")
                return
            }

            if (members.length === 0) {
                toast.warning("O grupo está vazio. Ninguém foi convidado.")
                return
            }

            // 2. Iterate and Invite Each Member
            let sucessCount = 0
            for (const member of members) {
                // Create Permission (Pending, Linked to Group)
                // Use upsert to avoid duplicate error if already invited
                const { data: permData, error: permError } = await supabase
                    .from('service_permissions')
                    .insert({
                        service_id: service.id,
                        grantee_type: 'user', // Individual User Permission
                        grantee_id: member.user_id,
                        permission_level: selectedLevel,
                        policy_id: policyId,
                        status: 'pending', // Pending acceptance
                        origin_group_id: selectedGranteeId // Link to source group
                    })
                    .select()
                    .single()

                if (!permError) {
                    // Notification
                    await supabase.from('notifications').insert({
                        user_id: member.user_id,
                        title: 'Convite de Acesso (Grupo)',
                        message: `${senderName} convidou você (via Grupo) para acessar "${service.name}".`,
                        type: 'service_share',
                        metadata: {
                            service_id: service.id,
                            service_slug: service.slug,
                            permission_id: permData.id,
                            grantee_type: 'user',
                            grantee_id: member.user_id,
                            sender_id: currentUser?.id,
                            sender_name: senderName,
                            origin_group_id: selectedGranteeId
                        }
                    })
                    sucessCount++
                } else {
                    console.error("Failed to invite member:", member.user_id, permError)
                    // If duplicate key error, we can ignore (already invited)
                }
            }

            if (sucessCount > 0) {
                toast.success(`${sucessCount} convites enviados para o grupo!`)
                setSelectedGranteeId("")
                fetchData()
            } else {
                toast.warning("Nenhum convite enviado (membros já podem ter acesso).")
            }
        }
    }

    const removePermission = async (id: string) => {
        if (!confirm("Remover este acesso?")) return

        const { error } = await supabase.from('service_permissions').delete().eq('id', id)
        if (error) {
            toast.error("Erro ao remover")
        } else {
            setPermissions(prev => prev.filter(p => p.id !== id))
            toast.success("Acesso removido")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Compartilhar "{service.name}"</DialogTitle>
                    <DialogDescription>
                        Gerencie quem pode visualizar ou editar este serviço.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Share Form */}
                    <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                        <Label>Adicionar novo acesso</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
                                <Select value={selectedType} onValueChange={(v: any) => { setSelectedType(v); setSelectedGranteeId("") }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="group">Grupo</SelectItem>
                                        <SelectItem value="user">Usuário</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    {selectedType === 'group' ? 'Selecionar Grupo' : 'Selecionar Usuário'}
                                </Label>
                                <div className="flex gap-2">
                                    <Select value={selectedGranteeId} onValueChange={setSelectedGranteeId}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedType === 'group' ? (
                                                accessGroups.map(g => (
                                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                ))
                                            ) : (
                                                users.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {selectedType === 'group' && (
                                        <Button variant="outline" size="icon" title="Criar Novo Grupo" asChild>
                                            <a href="/configuracoes?tab=grupos&action=new">
                                                <Plus className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Permissão</Label>
                                <Select value={selectedLevel} onValueChange={(v: any) => setSelectedLevel(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view">Visualizar</SelectItem>
                                        <SelectItem value="edit">Editar (Completo)</SelectItem>
                                        <SelectItem value="admin">Administrar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 mb-1" title="Restringe quais linhas o usuário pode ver (ex: Apenas SP)">
                                    <Label className="text-xs text-muted-foreground block">Filtro de Dados (Opcional)</Label>
                                    <Shield className="h-3 w-3 text-slate-400" />
                                </div>
                                <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sem restrição (Acesso total)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Acesso Total (Ver tudo)</SelectItem>
                                        {accessPolicies.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleShare}>Conceder Acesso</Button>
                    </div>

                    {/* Permissions List */}
                    <div>
                        <Label className="mb-2 block">Acessos Ativos</Label>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {permissions.map(perm => (
                                <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                                            {perm.grantee_type === 'group' || perm.origin_group_id ? <Users className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">
                                                {perm.grantee_details?.name || perm.grantee_details?.full_name || 'Desconhecido'}
                                                {perm.origin_group_id && <span className="text-[10px] text-muted-foreground ml-2">(Via Grupo)</span>}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] h-4">
                                                    {perm.permission_level === 'view' ? 'Ver' : perm.permission_level === 'edit' ? 'Editar' : 'Admin'}
                                                </Badge>
                                                {perm.policy_id ? (
                                                    <span className="flex items-center text-orange-600">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        {perm.policy_details?.name || 'Restrito'}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 flex items-center">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Acesso Total
                                                    </span>
                                                )}
                                                {perm.id && !perm.grantee_details && <span className="text-red-400">Pendente</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removePermission(perm.id)}>
                                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                                    </Button>
                                </div>
                            ))}
                            {permissions.length === 0 && !loading && (
                                <p className="text-sm text-center text-muted-foreground py-4">Nenhum acesso compartilhado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

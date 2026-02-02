"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash2, UserPlus, Users, X, Check, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

import { useGroup, AccessGroup } from "@/contexts/GroupContext"

type Profile = {
    id: string
    full_name: string | null
    email: string | null
}

type GroupMember = {
    user_id: string
    group_id: string
    status: 'pending' | 'accepted' | 'rejected'
    profiles: Profile
}

type PendingInvite = {
    group_id: string
    status: string
    created_at: string
    access_groups: AccessGroup
}

export function GroupsManager({ autoOpenCreate = false }: { autoOpenCreate?: boolean }) {
    const { groups, isLoading: isGroupsLoading, createGroup: createGroupContext, updateGroup: updateGroupContext, deleteGroup: deleteGroupContext } = useGroup()
    // const [isLoading, setIsLoading] = useState(true) // Use context loading for groups
    const [selectedGroup, setSelectedGroup] = useState<AccessGroup | null>(null)
    const supabase = createClient()
    const [currentUser, setCurrentUser] = useState<string | null>(null)

    // Create Group State
    const [newGroupName, setNewGroupName] = useState("")
    const [isCreating, setIsCreating] = useState(autoOpenCreate)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user?.id || null)
        }
        getUser()
    }, [])

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return
        const newGroup = await createGroupContext(newGroupName.trim())
        if (newGroup) {
            setNewGroupName("")
            setIsCreating(false)
            setSelectedGroup(newGroup)
        }
    }

    const handleUpdateGroup = async (id: string, updates: Partial<AccessGroup>) => {
        await updateGroupContext(id, updates)
        // Context updates list, we update selected local if needed
        if (selectedGroup?.id === id) {
            setSelectedGroup({ ...selectedGroup, ...updates })
        }
    }

    const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])

    useEffect(() => {
        if (currentUser) {
            fetchPendingInvites()
        }
    }, [currentUser])

    const fetchPendingInvites = async () => {
        const { data, error } = await supabase
            .from('access_group_members')
            .select(`
                group_id,
                status,
                created_at,
                access_groups (*)
            `)
            .eq('user_id', currentUser)
            .eq('status', 'pending')

        if (data) {
            setPendingInvites(data as any)
        }
    }

    const handleAcceptInvite = async (groupId: string) => {
        const { error } = await supabase
            .from('access_group_members')
            .update({ status: 'active' })
            .match({ group_id: groupId, user_id: currentUser })

        if (!error) {
            toast.success("Convite aceito!")
            setPendingInvites(prev => prev.filter(i => i.group_id !== groupId))
            // Refresh groups context to show the new group
            window.location.reload() // Simple way to ensure Context + RLS updates or use valid refresh method from context if available
        } else {
            toast.error("Erro ao aceitar convite.")
        }
    }

    const handleDeclineInvite = async (groupId: string) => {
        const { error } = await supabase
            .from('access_group_members')
            .delete()
            .match({ group_id: groupId, user_id: currentUser })

        if (!error) {
            toast.success("Convite recusado.")
            setPendingInvites(prev => prev.filter(i => i.group_id !== groupId))
        } else {
            toast.error("Erro ao recusar convite.")
        }
    }

    const handleDeleteGroup = (id: string) => {
        setGroupToDelete(id)
    }

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return
        await deleteGroupContext(groupToDelete)
        if (selectedGroup?.id === groupToDelete) setSelectedGroup(null)
        setGroupToDelete(null)
        toast.success("Grupo excluído.")
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Col: Group List */}
            <div className="col-span-1 md:col-span-4 space-y-6">

                {/* Groups Section */}
                <div className="space-y-4">
                    {/* Pending Invites Section */}
                    {pendingInvites.length > 0 && (
                        <div className="space-y-2 mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <h3 className="font-semibold text-sm text-blue-800 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Convites Pendentes
                            </h3>
                            <div className="space-y-2">
                                {pendingInvites.map(invite => (
                                    <div key={invite.group_id} className="bg-white p-3 rounded-md border shadow-sm flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span className="font-medium text-sm">{invite.access_groups.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleAcceptInvite(invite.group_id)}>
                                                Aceitar
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => handleDeclineInvite(invite.group_id)}>
                                                Recusar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">Seus Grupos</h3>
                        <Dialog open={isCreating} onOpenChange={setIsCreating}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" /> Novo</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Grupo</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Grupo</Label>
                                        <Input
                                            value={newGroupName}
                                            onChange={e => setNewGroupName(e.target.value)}
                                            placeholder="Ex: Secretaria de Saúde"
                                        />
                                        <p className="text-xs text-muted-foreground">O grupo será criado com a cor padrão (Preto). Você poderá alterá-la depois.</p>
                                    </div>
                                    <Button onClick={handleCreateGroup} className="w-full bg-slate-900 hover:bg-slate-800 text-white">Criar</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-2">
                        {groups.map(group => (
                            <div
                                key={group.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between group/item ${selectedGroup?.id === group.id ? 'bg-primary/5 border-primary' : 'hover:bg-slate-50'}`}
                                onClick={() => setSelectedGroup(group)}
                                style={selectedGroup?.id === group.id ? { borderLeft: `3px solid ${group.color || '#0f172a'}` } : {}}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: group.color || '#0f172a' }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{group.name}</span>
                                        {/* Show role */}
                                        {group.owner_id === currentUser && (
                                            <span className="text-[10px] text-muted-foreground">Dono</span>
                                        )}
                                    </div>
                                </div>
                                {group.owner_id === currentUser && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-red-500"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteGroup(group.id)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {groups.length === 0 && !isGroupsLoading && (
                            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                                Nenhum grupo.
                            </div>
                        )}
                        {isGroupsLoading && (
                            <div className="text-center py-4 text-xs text-muted-foreground">
                                Carregando...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Col: Group Members */}
            <div className="col-span-1 md:col-span-8">
                {selectedGroup ? (
                    <GroupMembersEditor
                        group={selectedGroup}
                        onUpdate={(updates) => handleUpdateGroup(selectedGroup.id, updates)}
                        currentUser={currentUser}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center border rounded-lg bg-slate-50/50 text-muted-foreground min-h-[300px] gap-2">
                        <Users className="h-8 w-8 opacity-20" />
                        <p>Selecione um grupo para gerenciar</p>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!groupToDelete}
                onOpenChange={(open) => !open && setGroupToDelete(null)}
                onConfirm={confirmDeleteGroup}
                title="Excluir Grupo?"
                description="Isso removerá o acesso de todos os membros associados a este grupo. Esta ação não pode ser desfeita."
                variant="destructive"
            />
        </div>
    )
}

function GroupMembersEditor({ group, onUpdate, currentUser }: { group: AccessGroup, onUpdate: (updates: Partial<AccessGroup>) => void, currentUser: string | null }) {
    const [members, setMembers] = useState<GroupMember[]>([])
    const [allUsers, setAllUsers] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const supabase = createClient()
    const isOwner = group.owner_id === currentUser

    // Color picker local state
    const [localColor, setLocalColor] = useState(group.color || "#0f172a")

    useEffect(() => {
        setLocalColor(group.color || "#0f172a")
        fetchData()
    }, [group.id])

    // Handle color change with debounce/blur logic could be better, but simple change handler for now
    const handleColorChange = (newColor: string) => {
        setLocalColor(newColor)
    }

    // Effect to save color after delay
    useEffect(() => {
        if (localColor !== (group.color || "#0f172a")) {
            const timer = setTimeout(() => {
                onUpdate({ color: localColor })
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [localColor])

    const fetchData = async () => {
        setIsLoading(true)
        // Fetch members with status
        const { data: memberData, error } = await supabase
            .from("access_group_members")
            .select("user_id, group_id, status, profiles:user_id(id, full_name, email)")
            .eq("group_id", group.id)

        if (error) {
            console.error("Error fetching members", error)
        }

        // Fetch all users (for adding) - In real app, search via API if too many users
        const { data: usersData } = await supabase
            .from("profiles")
            .select("id, full_name, email")

        if (memberData) {
            setMembers(memberData as any)
        }
        if (usersData) {
            setAllUsers(usersData)
        }
        setIsLoading(false)
    }

    const addMember = async (userId: string) => {
        try {
            console.log(`Adding member: Group=${group.id}, User=${userId}`)

            // Use upsert to handle potential existing rows/recursion issues gracefully
            const { data, error } = await supabase.from("access_group_members").upsert({
                group_id: group.id,
                user_id: userId,
                status: 'active'
            }).select()

            if (error) {
                console.error("Supabase Error Object:", error)
                throw error
            }

            console.log("Member added successfully:", data)

            // Notification (Info)
            const { error: notifyError } = await supabase.from("notifications").insert({
                user_id: userId,
                title: "Novo Grupo",
                message: `Você foi adicionado ao grupo "${group.name}".`,
                type: "info",
                metadata: { group_id: group.id }
            })

            if (notifyError) console.warn("Notification error (non-blocking):", notifyError)

            toast.success("Membro adicionado com sucesso!")

            // Refresh local list
            fetchData()
        } catch (e: any) {
            console.error("Failed to add member", e)
            // Enhanced logging
            if (e?.code) console.error("Error Code:", e.code)
            if (e?.message) console.error("Error Message:", e.message)
            console.error("Full Error:", JSON.stringify(e, null, 2))

            toast.error(`Erro ao adicionar membro: ${e.message || 'Erro desconhecido'}`)
        }
    }

    const removeMember = async (userId: string) => {
        const { error } = await supabase
            .from("access_group_members")
            .delete()
            .match({ group_id: group.id, user_id: userId })

        if (error) {
            toast.error("Erro ao remover membro")
        } else {
            setMembers(members.filter(m => m.user_id !== userId))
            toast.success("Membro removido")
        }
    }

    const availableUsers = allUsers
        .filter(u => !members.find(m => m.user_id === u.id))
        .filter(u =>
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
        )

    return (
        <Card>
            <CardHeader>
                <CardContent className="p-0 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full border shadow-sm cursor-pointer"
                                style={{ backgroundColor: localColor }}
                            >
                                {isOwner && (
                                    <Input
                                        type="color"
                                        className="absolute -top-2 -left-2 h-16 w-16 cursor-pointer opacity-0"
                                        value={localColor}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{group.name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">{isOwner ? `Cor definida: ${localColor}` : 'Visualizando grupo'}</p>
                                    {isOwner && (
                                        <Badge variant="outline" className="text-[10px] h-5 border-blue-200 text-blue-700 bg-blue-50">Dono</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                        {members.length} membros
                    </div>
                </CardContent>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Member Section - Only Owner or Admin can add? RLS says 'owners can manage'. */}
                {isOwner && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                        <Label>Convidar Membro</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Buscar usuário por nome ou email..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        {searchQuery && (
                            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-md bg-white p-2">
                                {availableUsers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-2">Nenhum usuário encontrado.</p>
                                ) : (
                                    availableUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer" onClick={() => addMember(user.id)}>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{user.full_name || 'Sem nome'}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                            <Button size="sm" variant="ghost"><UserPlus className="h-4 w-4" /></Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Member List */}
                <div>
                    <Label className="mb-3 block">Membros do Grupo</Label>
                    <div className="space-y-2">
                        {members.map(member => (
                            <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {member.profiles.full_name?.substring(0, 2).toUpperCase() || 'UN'}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{member.profiles.full_name || 'Sem nome'}</span>
                                            {member.status === 'pending' && (
                                                <Badge variant="secondary" className="text-[10px] h-4 bg-amber-100 text-amber-700 hover:bg-amber-100">Pendente</Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{member.profiles.email}</span>
                                    </div>
                                </div>
                                {isOwner && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMember(member.user_id)}
                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                        title="Remover"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {members.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">Este grupo não possui membros.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

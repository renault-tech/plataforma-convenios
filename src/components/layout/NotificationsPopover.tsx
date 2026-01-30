"use client"

import { Bell, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useService } from "@/contexts/ServiceContext"

type Notification = {
    id: string
    title: string
    message: string
    created_at: string
    read_at: string | null
    type: string
    metadata: any
    action_link?: string
}

export function NotificationsPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const { refreshServices } = useService()

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read_at).length)
        }
    }

    useEffect(() => {
        fetchNotifications()

        const channel = supabase
            .channel('notifications-popover')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const markAsRead = async (id: string) => {
        await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const markAllRead = async () => {
        await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null)
        setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
        setUnreadCount(0)
    }

    const deleteNotification = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        try {
            await supabase.from("notifications").delete().eq("id", id)
            setNotifications(prev => prev.filter(n => n.id !== id))
            setUnreadCount(prev => prev - (notifications.find(n => n.id === id && !n.read_at) ? 1 : 0))
            toast.success("Notificação removida.")
        } catch (error) {
            console.error("Failed to delete notification", error)
            toast.error("Erro ao remover notificação.")
        }
    }

    const handleAccept = async (notification: Notification) => {
        console.log("handleAccept started", notification)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                console.error("handleAccept: No user found")
                return
            }

            // Get user name for feedback
            const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
            const acceptorName = profile?.full_name || profile?.email || "Usuário"

            if (notification.type === 'service_share') {
                console.log("Processing service_share", notification.metadata)
                if (notification.metadata?.permission_id) {
                    // NEW FLOW: Permission exists, update to active
                    console.log("Updating permission", notification.metadata.permission_id)
                    const { error } = await supabase
                        .from('service_permissions')
                        .update({ status: 'active' })
                        .eq('id', notification.metadata.permission_id)

                    if (error) {
                        console.error("Error updating permission", error)
                        throw error
                    }
                } else {
                    // LEGACY: Fallback insert
                    console.log("Legacy insert permission")
                    const { error } = await supabase
                        .from('service_permissions')
                        .insert({
                            service_id: notification.metadata.service_id,
                            grantee_type: notification.metadata.grantee_type || 'user',
                            grantee_id: notification.metadata.grantee_id || user.id,
                            permission_level: notification.metadata.permission_level || 'view',
                            policy_id: notification.metadata.policy_id,
                            status: 'active'
                        })
                    if (error) {
                        console.error("Error inserting permission", error)
                        throw error
                    }
                }

                // Notify Sender
                if (notification.metadata.sender_id) {
                    await supabase.from('notifications').insert({
                        user_id: notification.metadata.sender_id,
                        title: 'Convite Aceito',
                        message: `${acceptorName} aceitou o convite para acessar "${notification.metadata.service_slug || 'o serviço'}"`,
                        type: 'info'
                    })
                }
                toast.success("Acesso aceito!")

            } else if (notification.type === 'group_invite' && notification.metadata?.group_id) {
                // ... Existing Group Logic
                console.log("Processing group_invite", notification.metadata.group_id)
                const { error } = await supabase
                    .from('access_group_members')
                    .insert({
                        group_id: notification.metadata.group_id,
                        user_id: user.id,
                        status: 'active'
                    })

                if (error) {
                    if (error.code === '42501') {
                        console.warn("RLS Error on group accept (Legacy Invite?):", error)
                        toast.info("Este convite é antigo. Solicite ao dono para lhe adicionar novamente.")
                        // Allow to proceed to delete/mark as read
                    } else {
                        console.error("Error accepting group invite", error)
                        throw error
                    }
                } else {
                    toast.success("Convite de grupo aceito!")
                }
            }

            // Success Actions
            await refreshServices()
            await markAsRead(notification.id)

        } catch (error: any) {
            console.error("handleAccept caught error:", error)
            console.error("Error details:", JSON.stringify(error, null, 2))
            toast.error(`Falha ao aceitar: ${error.message || 'Erro desconhecido'}`)
        }
    }

    const handleDecline = async (notification: Notification) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user && notification.metadata?.sender_id) {
                const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
                const declinerName = profile?.full_name || profile?.email || "Usuário"

                await supabase.from('notifications').insert({
                    user_id: notification.metadata.sender_id,
                    title: 'Convite Recusado',
                    message: `${declinerName} recusou o convite para acessar "${notification.metadata.service_slug || 'o serviço'}"`,
                    type: 'info' // Just info, no action needed
                })
            }

            // REFRESH SERVICES JUST IN CASE (Or if we want to remove pending optimistic state if existed)
            await refreshServices()

            toast.success("Convite recusado.")
            await markAsRead(notification.id)
        } catch (e) {
            console.error(e)
            toast.error("Erro ao recusar.")
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" suppressHydrationWarning>
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border border-white animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent id="notifications-popover-content" className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto px-2 text-xs text-blue-600 hover:text-blue-700" onClick={markAllRead}>
                            Marcar lidas
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs">Nenhuma notificação.</p>
                        </div>
                    ) : (
                        <div className="divide-y relative">
                            {notifications.map((n) => (
                                <div key={n.id} className={cn("p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors group relative", !n.read_at && "bg-blue-50/50")}>

                                    {/* Delete Button (Visible on Hover) */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                        onClick={(e) => deleteNotification(n.id, e)}
                                        title="Excluir notificação"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>

                                    <div className="flex gap-3 pr-6"> {/* proper padding for delete button */}
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{n.title}</p>
                                            <p className="text-xs text-slate-500">{n.message}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                        {!n.read_at && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => markAsRead(n.id)} title="Marcar como lida">
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {(n.type === 'service_share' || n.type === 'group_invite') && !n.read_at && (
                                        <div className="flex gap-2 mt-1">
                                            <Button size="sm" className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAccept(n)}>
                                                <Check className="h-3 w-3 mr-1" />
                                                Aceitar
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleDecline(n)}>
                                                <X className="h-3 w-3 mr-1" />
                                                Recusar
                                            </Button>
                                        </div>
                                    )}

                                    {/* Fallback Link for old invites */}
                                    {n.type === 'group_invite' && n.metadata?.group_name && n.read_at && (
                                        <div className="pt-2">
                                            <Button size="sm" variant="outline" className="h-7 text-xs w-full" asChild>
                                                <a href="/configuracoes?tab=grupos">Ver Convite</a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

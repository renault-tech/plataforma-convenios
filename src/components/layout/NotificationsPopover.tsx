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

    const handleAccept = async (notification: Notification) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            if (notification.type === 'service_share' && notification.metadata?.service_id) {
                // Insert Permission
                const { error } = await supabase
                    .from('service_permissions')
                    .insert({
                        service_id: notification.metadata.service_id,
                        grantee_type: notification.metadata.grantee_type || 'user',
                        grantee_id: notification.metadata.grantee_id || user.id,
                        permission_level: notification.metadata.permission_level || 'view',
                        policy_id: notification.metadata.policy_id
                    })

                if (error) throw error
                toast.success("Acesso aceito!")
            } else if (notification.type === 'group_invite' && notification.metadata?.group_id) {
                // Insert Group Member
                const { error } = await supabase
                    .from('access_group_members')
                    .insert({
                        group_id: notification.metadata.group_id,
                        user_id: user.id
                    })

                if (error) throw error
                toast.success("Convite de grupo aceito!")
            }

            await markAsRead(notification.id)

        } catch (error) {
            console.error(error)
            toast.error("Erro ao aceitar.")
        }
    }

    const handleDecline = async (notification: Notification) => {
        try {
            // Nothing to delete since we didn't create it yet
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
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 border border-white animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
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
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <div key={n.id} className={cn("p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors", !n.read_at && "bg-blue-50/50")}>
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{n.title}</p>
                                            <p className="text-xs text-slate-500">{n.message}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                        {!n.read_at && (
                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => markAsRead(n.id)}>
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

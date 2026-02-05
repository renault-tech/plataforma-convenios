"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2, ExternalLink, Inbox, ListChecks } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationRulesList } from "./NotificationRulesList"

interface Notification {
    id: string
    title: string
    message: string
    link?: string
    read: boolean
    created_at: string
}

export function NotificationsInboxDialog({ children, open, onOpenChange, filterType, customTitle }: { children?: React.ReactNode, open?: boolean, onOpenChange?: (o: boolean) => void, filterType?: string, customTitle?: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [internalOpen, setInternalOpen] = useState(false)
    const displayOpen = open !== undefined ? open : internalOpen

    const supabase = createClient()

    const handleOpenChange = (val: boolean) => {
        setInternalOpen(val)
        onOpenChange?.(val)
    }

    useEffect(() => {
        if (displayOpen) {
            fetchNotifications()
        }
    }, [displayOpen, filterType])

    const fetchNotifications = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        if (filterType) {
            query = query.eq('type', filterType)
        }

        const { data } = await query

        if (data) setNotifications(data)
        setIsLoading(false)
    }

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        await supabase.from('notifications').update({ read: true }).eq('id', id)
    }

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
            toast.success("Todas marcadas como lidas")
        }
    }

    const deleteNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
        await supabase.from('notifications').delete().eq('id', id)
    }

    return (
        <Dialog open={displayOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <Tabs defaultValue="inbox" className="flex flex-col h-full">
                    <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <DialogTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-blue-600" />
                                {customTitle || "Central de Alertas"}
                            </DialogTitle>
                            <TabsList className="h-8">
                                <TabsTrigger value="inbox" className="text-xs px-3 gap-2">
                                    <Inbox className="h-3 w-3" /> Caixa de Entrada
                                    {notifications.filter(n => !n.read).length > 0 && (
                                        <span className="ml-1 bg-red-100 text-red-600 px-1.5 rounded-full text-[10px] font-bold">
                                            {notifications.filter(n => !n.read).length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="rules" className="text-xs px-3 gap-2">
                                    <ListChecks className="h-3 w-3" /> Monitorando
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>

                    <TabsContent value="inbox" className="flex-1 overflow-hidden flex flex-col p-0 mt-0 data-[state=active]:flex">
                        {/* Inbox Toolbar */}
                        {notifications.length > 0 && (
                            <div className="px-6 py-2 border-b bg-slate-50/30 flex justify-end">
                                <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 h-6">
                                    <Check className="h-3 w-3 mr-1" /> Marcar todas como lidas
                                </Button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {isLoading ? (
                                <div className="text-center py-8 text-slate-500">Carregando...</div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-16 text-slate-500 flex flex-col items-center">
                                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="font-medium text-slate-900">Tudo limpo por aqui!</p>
                                    <p className="text-sm text-slate-500 mt-1">Nenhuma notificação pendente.</p>
                                </div>
                            ) : (
                                notifications.map(item => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "relative group flex gap-4 p-4 rounded-xl border transition-all",
                                            item.read ? "bg-white border-slate-100" : "bg-blue-50/40 border-blue-100 shadow-sm"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0",
                                            item.read ? "bg-slate-200" : "bg-blue-500 animate-pulse"
                                        )} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={cn("font-semibold text-sm truncate pr-2", item.read ? "text-slate-700" : "text-blue-900")}>
                                                    {item.title}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                                                    {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                                {item.message}
                                            </p>

                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-slate-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {item.link && (
                                                    <Link
                                                        href={item.link}
                                                        onClick={() => {
                                                            markAsRead(item.id)
                                                            handleOpenChange(false) // Close dialog to see highlighted row
                                                        }}
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full sm:w-auto bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                                                            Visualizar <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {!item.read && (
                                                    <Button variant="ghost" size="sm" onClick={() => markAsRead(item.id)} className="h-7 text-xs text-slate-500 hover:text-green-600">
                                                        Marcar lida
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => deleteNotification(item.id)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 ml-auto rounded-full hover:bg-red-50">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="rules" className="flex-1 overflow-hidden flex flex-col p-0 mt-0 data-[state=active]:flex">
                        <div className="px-6 py-3 border-b bg-slate-50/30 text-xs text-slate-500">
                            Aqui estão todos os alertas que você configurou nas planilhas.
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <NotificationRulesList />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}


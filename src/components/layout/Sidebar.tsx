"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, Database, Users, User, Share2, Plus, ChevronDown, ChevronRight, Inbox, Loader2, Upload } from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useService } from "@/contexts/ServiceContext"
import { useGroup } from "@/contexts/GroupContext"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

export function Sidebar() {
    const pathname = usePathname()
    const { services, myServices, sharedServices, isLoading: servicesLoading } = useService()
    const { groups, isLoading: groupsLoading } = useGroup()

    // Collapsible states
    const [isOpenServices, setIsOpenServices] = useState(true)
    const [isOpenShared, setIsOpenShared] = useState(true)
    const [isOpenGroups, setIsOpenGroups] = useState(true)

    // Notification State
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('user_id', user.id)
                .is('read_at', null)

            if (!error && count !== null) {
                setUnreadCount(count)
            }
        }

        fetchNotifications()

        const channel = supabase
            .channel('sidebar-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => fetchNotifications()
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' },
                () => fetchNotifications()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])


    const sortedMyServices = myServices || []
    const sortedSharedServices = sharedServices || []
    const isLoading = servicesLoading || groupsLoading

    return (
        <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
            {/* Logo/Header */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <Database className="mr-2 h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold text-white">GovManager</span>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-auto py-4">
                <nav className="space-y-1 px-2">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start pl-2 text-sm",
                                pathname === "/" ? "bg-slate-800 text-white" : "hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Início
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start pl-2 text-sm",
                                pathname === "/dashboard" ? "bg-slate-800 text-white" : "hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>

                    {/* Inbox Link with Badge */}
                    <div className="relative">
                        <Link href="/notificacoes">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "w-full justify-start pl-2 text-sm",
                                    pathname === "/notificacoes" ? "bg-slate-800 text-white" : "hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <Inbox className="mr-2 h-4 w-4" />
                                Notificações
                            </Button>
                        </Link>
                        {unreadCount > 0 && (
                            <span className="absolute right-2 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>

                    <Link href="/configuracoes">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start pl-2 text-sm",
                                pathname.startsWith("/configuracoes") ? "bg-slate-800 text-white" : "hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </Button>
                    </Link>
                </nav>

                <div className="mt-4 px-4 py-2">
                    <div className="h-[1px] bg-slate-800" />
                </div>

                {/* Services Section (MY APPS) */}
                <Collapsible open={isOpenServices} onOpenChange={setIsOpenServices} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase" suppressHydrationWarning>
                                {isOpenServices ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                Meus Aplicativos
                            </Button>
                        </CollapsibleTrigger>
                        <Link href="/configuracoes?tab=new">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <CollapsibleContent id="sidebar-my-services" className="space-y-1">
                        {isLoading ? (
                            <div className="px-6 py-2">
                                <Skeleton className="h-4 w-3/4 bg-slate-800" />
                            </div>
                        ) : sortedMyServices.length === 0 ? (
                            <div className="px-2 py-2 text-xs text-slate-600 italic">
                                Nenhum aplicativo criado.
                            </div>
                        ) : (
                            sortedMyServices.map(service => {
                                const isActive = pathname === `/servicos/${service.slug}`
                                const shareMeta = service.share_meta || { count: 0, types: [] }
                                const hasGroup = shareMeta.types.includes('group')
                                const hasUser = shareMeta.types.includes('user')

                                return (
                                    <Link key={service.id} href={`/servicos/${service.slug}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start pl-6 text-sm font-normal relative group/btn",
                                                isActive
                                                    ? "bg-slate-800 text-white"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                            )}
                                            style={isActive ? { borderLeft: `3px solid ${service.primary_color || '#3b82f6'}` } : {}}
                                        >
                                            <div className="relative mr-2">
                                                {shareMeta.count > 0 ? (
                                                    hasGroup ? (
                                                        <Users className="h-3.5 w-3.5 text-orange-400" />
                                                    ) : (
                                                        <User className="h-3.5 w-3.5 text-green-400" />
                                                    )
                                                ) : (
                                                    <Database className="h-3.5 w-3.5 opacity-70" />
                                                )}
                                            </div>
                                            {service.name}
                                        </Button>
                                    </Link>
                                )
                            })
                        )}
                    </CollapsibleContent>
                </Collapsible>

                {/* Shared Section */}
                {(sharedServices.length > 0 || isLoading) && (
                    <Collapsible open={isOpenShared} onOpenChange={setIsOpenShared} className="space-y-1">
                        <div className="flex items-center justify-between px-2 py-1">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase" suppressHydrationWarning>
                                    {isOpenShared ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                    Compartilhados Comigo
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent id="sidebar-shared-services" className="space-y-1">
                            {isLoading ? (
                                <div className="px-6 py-2">
                                    <Skeleton className="h-4 w-3/4 bg-slate-800" />
                                </div>
                            ) : sharedServices.length === 0 ? (
                                <div className="px-2 py-2 text-xs text-slate-600 italic">
                                    Nada compartilhado.
                                </div>
                            ) : (
                                sortedSharedServices.map((shared, i) => {
                                    const isActive = pathname === `/servicos/${shared.slug}`
                                    const isGroup = shared.shared_via?.type === 'group'

                                    return (
                                        <Link key={shared.id} href={`/servicos/${shared.slug}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "w-full justify-start pl-6 text-sm text-slate-400 hover:text-white hover:bg-slate-800",
                                                    isActive && "bg-slate-800 text-white"
                                                )}
                                            >
                                                {isGroup ? (
                                                    <Users className="mr-2 h-3.5 w-3.5 text-orange-400" /> // Grupo
                                                ) : (
                                                    <User className="mr-2 h-3.5 w-3.5 text-green-400" /> // Bonequinho Individual
                                                )}
                                                {shared.name}
                                            </Button>
                                        </Link>
                                    )
                                })
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Groups Section */}


            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4">
                <div className="text-xs text-slate-500">
                    © 2024 GovManager
                </div>
            </div>
        </div>
    )
}

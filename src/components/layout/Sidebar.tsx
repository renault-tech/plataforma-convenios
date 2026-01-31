"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, Database, Users, User, Share2, Plus, ChevronDown, ChevronRight, Inbox, Loader2, Upload, MessageSquare, ArrowLeft } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { GlobalChatList } from "@/components/chat/GlobalChatList"
import { ConversationBalloon } from "@/components/chat/ConversationBalloon"
import { NewChatDialog } from "@/components/chat/NewChatDialog"
import { useChat } from "@/contexts/ChatContext"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useService } from "@/contexts/ServiceContext"
// This tool call is a placeholder to pause and check for components.
// Actually I will check for components/ui/switch and label first.
import { useGroup } from "@/contexts/GroupContext"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"

export function Sidebar() {
    const pathname = usePathname()
    const { services, myServices, sharedServices, isLoading: servicesLoading, activeService } = useService()
    const { groups, isLoading: groupsLoading } = useGroup()
    const { activeConversation, closeChat } = useChat()

    // Collapsible states
    const [isOpenServices, setIsOpenServices] = useState(true)
    const [isOpenShared, setIsOpenShared] = useState(true)
    const [isOpenConversations, setIsOpenConversations] = useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false)

    // Notification State
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()
    const sidebarRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
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
        <div ref={sidebarRef} className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 relative">
            {/* Logo/Header */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6 justify-between">
                <div className="flex items-center">
                    <Database className="mr-2 h-6 w-6 text-blue-500" />
                    <span className="text-lg font-bold text-white">GovManager</span>
                </div>
            </div>

            {/* Content */}
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
                            <FileText
                                className="mr-2 h-4 w-4"
                                style={activeService ? {
                                    color: activeService.primary_color,
                                    fill: activeService.primary_color,
                                    opacity: 1
                                } : {}}
                            />
                            Dashboard
                        </Button>
                    </Link>

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

                {/* MY SERVICES */}
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
                                const isActive = activeService?.id === service.id
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
                                            style={isActive ? {
                                                borderLeft: `8px solid ${service.primary_color || '#3b82f6'}`,
                                                backgroundColor: `${service.primary_color || '#3b82f6'}15` // approx 8-10% opacity
                                            } : {}}
                                        >
                                            <div className="relative mr-2">
                                                {shareMeta.count > 0 ? (
                                                    hasGroup ? (
                                                        <Users className="h-3.5 w-3.5 text-orange-400" />
                                                    ) : (
                                                        <User className="h-3.5 w-3.5 text-green-400" />
                                                    )
                                                ) : (
                                                    <Database
                                                        className="h-3.5 w-3.5"
                                                        style={isActive ? {
                                                            fill: service.primary_color || '#3b82f6',
                                                            stroke: service.primary_color || '#3b82f6'
                                                        } : { opacity: 0.7 }}
                                                    />
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

                {/* SHARED SERVICES */}
                {(sortedSharedServices.length > 0) && (
                    <Collapsible open={isOpenShared} onOpenChange={setIsOpenShared} className="space-y-1 mt-4">
                        <div className="flex items-center justify-between px-2 py-1">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase" suppressHydrationWarning>
                                    {isOpenShared ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                    Compartilhados
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent id="sidebar-shared-services" className="space-y-1">
                            {sortedSharedServices.map((shared, i) => {
                                const isActive = activeService?.id === shared.id
                                const isGroup = shared.shared_via?.type === 'group'

                                return (
                                    <Link key={shared.id} href={`/servicos/${shared.slug}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start pl-6 text-sm text-slate-400 hover:text-white hover:bg-slate-800",
                                            )}
                                            style={isActive ? {
                                                borderLeft: `8px solid ${shared.primary_color || '#3b82f6'}`,
                                                backgroundColor: `${shared.primary_color || '#3b82f6'}15`,
                                                color: 'white'
                                            } : {}}
                                        >
                                            {isGroup ? (
                                                <Users className="mr-2 h-3.5 w-3.5 text-orange-400" />
                                            ) : (
                                                <User className="mr-2 h-3.5 w-3.5 text-green-400" />
                                            )}
                                            {shared.name}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* GLOBAL CHAT (NEW SECTION) */}
                <div className="mt-4 px-4 py-2">
                    <div className="h-[1px] bg-slate-800" />
                </div>

                <Collapsible open={isOpenConversations} onOpenChange={setIsOpenConversations} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase" suppressHydrationWarning>
                                {isOpenConversations ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                Conversas
                            </Button>
                        </CollapsibleTrigger>

                        <NewChatDialog>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full" suppressHydrationWarning>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </NewChatDialog>
                    </div>
                    <CollapsibleContent className="space-y-1" suppressHydrationWarning>
                        <GlobalChatList onSelect={() => { }} />
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                    © 2026 GovManager
                </div>
            </div>

            {/* Global Chat Balloon */}
            <ConversationBalloon
                isOpen={!!activeConversation && activeConversation.type === 'global'}
                onClose={() => closeChat()}
                anchorRef={sidebarRef}
            />
        </div>
    )
}

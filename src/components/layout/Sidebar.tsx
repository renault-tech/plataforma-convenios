"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, Database, Users, User, Share2, Plus, ChevronDown, ChevronRight, Inbox, Loader2, Upload, MessageSquare, ArrowLeft, Menu } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
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
import { useGroup } from "@/contexts/GroupContext"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { useStore } from "@/lib/store"
import { getContrastColor } from "@/lib/color-utils"

export function Sidebar() {
    const pathname = usePathname()
    // Destructure lastViews from Context
    const { services, myServices, sharedServices, isLoading: servicesLoading, activeService, lastViews } = useService()
    const { groups, isLoading: groupsLoading } = useGroup()
    const { activeConversation, closeChat, conversations } = useChat()
    const { isSidebarCollapsed, toggleSidebar } = useStore()

    // Collapsible states
    const [isOpenServices, setIsOpenServices] = useState(true)
    const [isOpenShared, setIsOpenShared] = useState(true)
    const [isOpenConversations, setIsOpenConversations] = useState(true)
    const [isChatOpen, setIsChatOpen] = useState(false)

    // Notifications logic removed (handled by Navbar)
    const sidebarRef = useRef<HTMLDivElement>(null)

    const sortedMyServices = useMemo(() => myServices || [], [myServices])
    const sortedSharedServices = useMemo(() => sharedServices || [], [sharedServices])
    const isLoading = servicesLoading || groupsLoading

    return (
        <div ref={sidebarRef} className={cn(
            "flex h-screen flex-col border-r border-slate-800 bg-slate-900 text-slate-300 relative transition-all duration-300",
            isSidebarCollapsed ? "w-16 overflow-hidden" : "w-64"
        )}>
            {/* Logo/Header */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6 justify-between flex-shrink-0">
                <div className="flex items-center overflow-hidden">
                    <Database className={cn("h-6 w-6 text-blue-500 flex-shrink-0", isSidebarCollapsed ? "mr-0" : "mr-2")} />
                    {!isSidebarCollapsed && <span className="text-lg font-bold text-white whitespace-nowrap">GovManager</span>}
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 hover:bg-slate-800 rounded transition-colors flex-shrink-0"
                    title={isSidebarCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
                >
                    <Menu className="h-5 w-5 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className={cn(
                "flex-1 py-4",
                isSidebarCollapsed ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
            )}>
                <nav
                    id="sidebar-nav"
                    className="space-y-1 px-2"
                    data-tour-group="home"
                    data-tour-title="Navegação Principal"
                    data-tour-desc="Aqui você acessa o Dashboard, suas Planilhas e Configurações."
                    data-tour-order="1"
                    data-tour-side="right"
                >
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full text-sm transition-all",
                                isSidebarCollapsed ? "justify-center px-0 h-10 w-10 rounded-lg mx-auto" : "justify-start pl-2",
                                pathname === "/" ? "text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                            style={pathname === "/" ? (
                                isSidebarCollapsed ? {} : {
                                    backgroundColor: 'rgb(30 41 59)', // slate-800
                                }
                            ) : {}}
                            title={isSidebarCollapsed ? "Início" : ""}
                        >
                            <LayoutDashboard className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                            {!isSidebarCollapsed && "Início"}
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full text-sm transition-all",
                                isSidebarCollapsed ? "justify-center px-0 h-10 w-10 rounded-lg mx-auto" : "justify-start pl-2",
                                (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
                                    ? (isSidebarCollapsed ? "text-white" : "bg-slate-800 text-white")
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                            style={activeService ? (
                                isSidebarCollapsed ? {
                                    backgroundColor: activeService.primary_color || '#3b82f6',
                                    color: getContrastColor(activeService.primary_color || '#3b82f6'),
                                } : {
                                    borderRight: `12px solid ${activeService.primary_color || '#3b82f6'}`,
                                }
                            ) : {}}
                            title={isSidebarCollapsed ? "Dashboard" : ""}
                        >
                            <FileText className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                            {!isSidebarCollapsed && "Dashboard"}
                        </Button>
                    </Link>

                    <Link href="/configuracoes">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full text-sm transition-all",
                                isSidebarCollapsed ? "justify-center px-0 h-10 w-10 rounded-lg mx-auto" : "justify-start pl-2",
                                pathname.startsWith("/configuracoes") ? "text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                            style={pathname.startsWith("/configuracoes") ? (
                                isSidebarCollapsed ? {
                                    backgroundColor: activeService?.primary_color || '#3b82f6',
                                    color: getContrastColor(activeService?.primary_color || '#3b82f6'),
                                } : {
                                    backgroundColor: 'rgb(30 41 59)', // slate-800
                                }
                            ) : {}}
                            title={isSidebarCollapsed ? "Configurações" : ""}
                        >
                            <Settings className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                            {!isSidebarCollapsed && "Configurações"}
                        </Button>
                    </Link>
                </nav>

                {/* Separator */}
                <div className={cn("mt-4 py-2", isSidebarCollapsed ? "px-2" : "px-4")}>
                    <div className="h-[1px] bg-slate-800" />
                </div>

                {/* MY SERVICES */}
                {!isSidebarCollapsed ? (
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
                        <CollapsibleContent
                            id="sidebar-my-services"
                            className="space-y-1"
                            data-tour-group="home"
                            data-tour-title="Seus Aplicativos"
                            data-tour-desc="Seus aplicativos aparecem aqui. <br/><br/><b>Legenda de Ícones:</b><br/>🏁 <b>Database:</b> Aplicativo padrão.<br/>🎨 <b>Tarja Colorida:</b> Identifica visualmente o app."
                            data-tour-order="2"
                            data-tour-side="right"
                        >
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
                                                        ? "bg-slate-800 text-white hover:text-white"
                                                        : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                                )}
                                                style={isActive ? {
                                                    borderLeft: `12px solid ${service.primary_color || '#3b82f6'}`,
                                                    backgroundColor: `${service.primary_color || '#3b82f6'}15`
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
                                                            style={{ opacity: 0.7 }}
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
                ) : (
                    // Collapsed view - show only icons
                    <div className="space-y-1 px-2">
                        {sortedMyServices.map(service => {
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
                                            "w-10 h-10 justify-center px-0 text-sm rounded-lg mx-auto transition-all",
                                            isActive
                                                ? ""
                                                : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                        )}
                                        style={isActive ? {
                                            backgroundColor: service.primary_color || '#3b82f6',
                                            color: getContrastColor(service.primary_color || '#3b82f6'),
                                        } : {}}
                                        title={service.name}
                                    >
                                        {shareMeta.count > 0 ? (
                                            hasGroup ? (
                                                <Users className="h-4 w-4" />
                                            ) : (
                                                <User className="h-4 w-4" />
                                            )
                                        ) : (
                                            <Database className="h-4 w-4" />
                                        )}
                                    </Button>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* SHARED SERVICES */}
                {(sortedSharedServices.length > 0) && !isSidebarCollapsed && (
                    <Collapsible
                        id="sidebar-shared-services"
                        open={isOpenShared}
                        onOpenChange={setIsOpenShared}
                        className="space-y-1 mt-4"
                        data-tour-group="home"
                        data-tour-title="Compartilhados com Você"
                        data-tour-desc="Aqui ficam os apps de outros usuários. <br/><br/><b>Legenda de Ícones:</b><br/>👤 <b>1 Boneco (Verde):</b> Compartilhado diretamente com você.<br/>👥 <b>2 Bonecos (Laranja):</b> Compartilhado via Grupo de Acesso."
                        data-tour-order="3"
                        data-tour-side="right"
                    >
                        <div className="flex items-center justify-between px-2 py-1">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase" suppressHydrationWarning>
                                    {isOpenShared ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                    Compartilhados
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent id="sidebar-shared-services" className="space-y-1">
                            {sortedSharedServices.map((shared: any, i: number) => {
                                const isActive = activeService?.id === shared.id
                                const isGroup = shared.shared_via?.type === 'group'

                                // 1. Chat Unread Logic (Red Dot)
                                const serviceChat = conversations.find(c => c.type === 'service' && c.context_id === shared.id)
                                const hasUnreadChat = (serviceChat?.unread_count || 0) > 0

                                // 2. Update Logic (Unified Red Dot)
                                const lastViewedAt = lastViews[shared.id]
                                // If never viewed or updated after last view -> Has update (ONLY if lastViewedAt exists to avoid false positives on load)
                                const hasUpdate = !!lastViewedAt && ((shared as any).updated_at && new Date((shared as any).updated_at).getTime() > new Date(lastViewedAt).getTime())

                                const showRedDot = hasUnreadChat || hasUpdate

                                return (
                                    <Link key={shared.id} href={`/servicos/${shared.slug}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start pl-6 text-sm text-slate-400 hover:text-white hover:bg-slate-800 relative",
                                            )}
                                            style={isActive ? {
                                                borderLeft: `12px solid ${shared.primary_color || '#3b82f6'}`,
                                                backgroundColor: `${shared.primary_color || '#3b82f6'}15`,
                                                color: 'white'
                                            } : {}}
                                        >
                                            <div className="relative mr-2 flex items-center">
                                                {isGroup ? (
                                                    <Users className="h-3.5 w-3.5 text-orange-400" />
                                                ) : (
                                                    <User className="h-3.5 w-3.5 text-green-400" />
                                                )}
                                            </div>
                                            {shared.name}
                                            {showRedDot && (
                                                <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-in zoom-in" />
                                            )}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* SHARED SERVICES - Collapsed View */}
                {(sortedSharedServices.length > 0) && isSidebarCollapsed && (
                    <>
                        {/* Separator */}
                        <div className="mt-4 px-2 py-2">
                            <div className="h-[1px] bg-slate-800" />
                        </div>
                        <div className="space-y-1 px-2">
                            {sortedSharedServices.map((shared: any) => {
                                const isActive = activeService?.id === shared.id
                                const isGroup = shared.shared_via?.type === 'group'

                                return (
                                    <Link key={shared.id} href={`/servicos/${shared.slug}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-10 h-10 justify-center px-0 text-sm rounded-lg mx-auto transition-all",
                                                isActive
                                                    ? ""
                                                    : "text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                            )}
                                            style={isActive ? {
                                                backgroundColor: shared.primary_color || '#3b82f6',
                                                color: getContrastColor(shared.primary_color || '#3b82f6'),
                                            } : {}}
                                            title={shared.name}
                                        >
                                            {isGroup ? (
                                                <Users className="h-4 w-4" />
                                            ) : (
                                                <User className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </Link>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* GLOBAL CHAT (COLLAPSED) */}
                {isSidebarCollapsed && (
                    <div className="mt-2 space-y-1">
                        <div className="px-3 py-2">
                            <div className="h-[1px] bg-slate-800" />
                        </div>
                        <GlobalChatList collapsed={true} />
                    </div>
                )}

                {/* GLOBAL CHAT (NEW SECTION) */}
                {!isSidebarCollapsed && (
                    <>
                        <div className="mt-4 px-4 py-2">
                            <div className="h-[1px] bg-slate-800" />
                        </div>

                        <Collapsible
                            id="sidebar-chat"
                            open={isOpenConversations}
                            onOpenChange={setIsOpenConversations}
                            className="space-y-1"
                            data-tour-group="home"
                            data-tour-title="Chat Global"
                            data-tour-desc="Converse com sua equipe e tire dúvidas em tempo real."
                            data-tour-order="4"
                            data-tour-side="right"
                        >
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
                    </>
                )}
            </div>

            {/* Footer */}
            {
                !isSidebarCollapsed && (
                    <div className="border-t border-slate-800 p-4 flex justify-between items-center">
                        <div className="text-xs text-slate-500">
                            © 2026 GovManager
                        </div>
                    </div>
                )
            }

            {/* Global Chat Balloon */}
            <ConversationBalloon
                isOpen={!!activeConversation && activeConversation.type === 'global'}
                onClose={() => closeChat()}
                anchorRef={sidebarRef}
            />
        </div >
    )
}

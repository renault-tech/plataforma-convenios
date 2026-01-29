"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, Database, Users, Share2, Plus, ChevronDown, ChevronRight, Inbox, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useService } from "@/contexts/ServiceContext"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

export function Sidebar() {
    const pathname = usePathname()
    const { myServices, sharedServices, isLoading, userId } = useService()
    const [groups, setGroups] = useState<any[]>([])
    const [isMounted, setIsMounted] = useState(false)

    // State for collapsibles - default open
    const [isOpenServices, setIsOpenServices] = useState(true)
    const [isOpenGroups, setIsOpenGroups] = useState(true)
    const [isOpenShared, setIsOpenShared] = useState(true)

    // Sort alphabetically
    const sortedMyServices = [...myServices].sort((a, b) => a.name.localeCompare(b.name))
    const sortedSharedServices = [...sharedServices].sort((a, b) => a.name.localeCompare(b.name))

    useEffect(() => {
        setIsMounted(true)
        const fetchGroups = async () => {
            // Only fetch if we have a user, to avoid unnecessary calls? RLS handles it though.
            const supabase = createClient()
            const { data } = await supabase.from("access_groups").select("id, name").order("name")
            if (data) setGroups(data)
        }
        fetchGroups()
    }, [])

    // Prevent hydration mismatch by not rendering dynamic navigation until mounted
    // OR we can render a static skeleton structure until mounted
    if (!isMounted) {
        return (
            <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-50">
                <div className="flex h-14 items-center border-b border-slate-800 px-6">
                    <FileText className="mr-2 h-6 w-6 text-blue-400" />
                    <span className="font-bold">GovManager</span>
                </div>
                <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                    <Skeleton className="h-8 w-full bg-slate-800" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-50">
            {/* Header */}
            <div className="flex h-14 items-center border-b border-slate-800 px-6">
                <FileText className="mr-2 h-6 w-6 text-blue-400" />
                <span className="font-bold">GovManager</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">

                {/* Main Nav */}
                <nav className="space-y-1">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start",
                                pathname === "/"
                                    ? "bg-slate-800 text-blue-400"
                                    : "text-slate-400 hover:text-slate-50 hover:bg-slate-800"
                            )}
                        >
                            <Inbox className="mr-2 h-4 w-4" />
                            Início
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start",
                                pathname === "/dashboard"
                                    ? "bg-slate-800 text-blue-400"
                                    : "text-slate-400 hover:text-slate-50 hover:bg-slate-800"
                            )}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/configuracoes">
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start",
                                pathname === "/configuracoes"
                                    ? "bg-slate-800 text-blue-400"
                                    : "text-slate-400 hover:text-slate-50 hover:bg-slate-800"
                            )}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                        </Button>
                    </Link>
                </nav>

                <div className="h-px bg-slate-800 mx-1" />

                {/* Services Section (MY APPS) */}
                <Collapsible open={isOpenServices} onOpenChange={setIsOpenServices} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase">
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
                    <CollapsibleContent className="space-y-1">
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
                                return (
                                    <Link key={service.id} href={`/servicos/${service.slug}`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start pl-6 text-sm font-normal",
                                                isActive
                                                    ? "bg-slate-800 text-white"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                            )}
                                            style={isActive ? { borderLeft: `3px solid ${service.primary_color || '#3b82f6'}` } : {}}
                                        >
                                            <Database className="mr-2 h-3.5 w-3.5 opacity-70" />
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
                                <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase">
                                    {isOpenShared ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                    Compartilhados
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="space-y-1">
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
                                                <Share2 className="mr-2 h-3.5 w-3.5" />
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
                <Collapsible open={isOpenGroups} onOpenChange={setIsOpenGroups} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-full justify-start p-0 text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-transparent uppercase">
                                {isOpenGroups ? <ChevronDown className="mr-2 h-3 w-3" /> : <ChevronRight className="mr-2 h-3 w-3" />}
                                Grupos
                            </Button>
                        </CollapsibleTrigger>
                        <Link href="/configuracoes?tab=grupos&action=new">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <CollapsibleContent className="space-y-1">
                        {groups.length === 0 ? (
                            <div className="px-2 py-2 text-xs text-slate-600 italic">
                                Sem grupos.
                            </div>
                        ) : (
                            groups.map((group, i) => (
                                <Button key={i} variant="ghost" size="sm" className="w-full justify-start pl-6 text-sm text-slate-400 hover:text-white hover:bg-slate-800">
                                    <Users className="mr-2 h-3.5 w-3.5" />
                                    {group.name}
                                </Button>
                            ))
                        )}
                    </CollapsibleContent>
                </Collapsible>

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

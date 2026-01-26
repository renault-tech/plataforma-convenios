"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, Database } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
    const pathname = usePathname()

    const links = [
        {
            href: "/",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/convenios",
            label: "Convênios",
            icon: Database,
        },
        {
            href: "/configuracoes",
            label: "Configurações",
            icon: Settings,
        },
    ]

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-50">
            <div className="flex h-14 items-center border-b border-slate-800 px-6">
                <FileText className="mr-2 h-6 w-6 text-blue-400" />
                <span className="font-bold">GovManager</span>
            </div>
            <div className="flex-1 py-4">
                <nav className="space-y-1 px-2">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        isActive
                                            ? "bg-slate-800 text-blue-400 hover:bg-slate-800 hover:text-blue-400"
                                            : "hover:bg-slate-800 hover:text-slate-50"
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="border-t border-slate-800 p-4">
                <div className="text-xs text-slate-400">
                    v1.0.0 Public Beta
                </div>
            </div>
        </div>
    )
}

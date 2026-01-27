"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, Database } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useService } from "@/contexts/ServiceContext"

export function Sidebar() {
    const pathname = usePathname()
    const { services, activeService: globalActiveService } = useService()

    // Sort services alphabetically just to be sure, though DB query handles it
    const sortedServices = [...services].sort((a, b) => a.name.localeCompare(b.name))

    const links = [
        {
            href: "/",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        ...sortedServices.map(service => ({
            href: `/servicos/${service.slug}`,
            label: service.name,
            icon: Database, // Default icon, could be dynamic later if icon string is mapped to Lucide icons
        })),
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

                        // Determine active color
                        let activeStyle = {}
                        let activeClass = ""

                        const activeService = services.find(s => s.name === link.label)

                        // Case 1: Active Service Link
                        if (isActive && activeService?.primary_color) {
                            activeStyle = {
                                backgroundColor: activeService.primary_color,
                                color: '#ffffff', // Force white text on colored background
                                borderColor: activeService.primary_color
                            }
                            activeClass = "hover:brightness-110" // Lighten slightly on hover
                        }
                        // Case 2: Dashboard Link (Home) - Default style + Dot indicator if service active
                        else if (link.href === "/") {
                            if (isActive) {
                                activeClass = "bg-slate-800 text-blue-400 hover:bg-slate-800 hover:text-blue-400"
                            } else {
                                activeClass = "hover:bg-slate-800 hover:text-slate-50"
                            }
                        }
                        // Case 3: Default Active State (for other future links)
                        else if (isActive) {
                            activeClass = "bg-slate-800 text-blue-400 hover:bg-slate-800 hover:text-blue-400"
                        }
                        // Case 4: Inactive State
                        else {
                            activeClass = "hover:bg-slate-800 hover:text-slate-50"
                        }

                        // Check if we need the dot for Dashboard
                        const showDot = link.href === "/" && globalActiveService?.primary_color

                        return (
                            <Link key={link.href} href={link.href}>
                                <Button
                                    variant="ghost" // Always ghost, we handle bg manually
                                    style={activeStyle}
                                    className={cn(
                                        "w-full justify-start transition-all duration-200 relative",
                                        activeClass
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                    {showDot && (
                                        <span
                                            className="ml-auto h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: globalActiveService?.primary_color }}
                                        />
                                    )}
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


"use client"

import { useAdmin } from "@/hooks/useAdmin"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Users, ArrowLeft, LayoutDashboard, MessageSquarePlus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAdmin, isLoading } = useAdmin()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.push("/")
        }
    }, [isAdmin, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                    <p className="text-sm font-medium text-slate-500">Verificando permissões...</p>
                </div>
            </div>
        )
    }

    if (!isAdmin) return null

    const menuItems = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/users", label: "Usuários", icon: Users },
        { href: "/admin/feedback", label: "Feedback", icon: MessageSquarePlus },
    ]

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Admin Header */}
            <header className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 text-blue-900">
                    <Shield className="h-6 w-6" />
                    <span className="font-bold text-lg tracking-tight">Painel Administrativo</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/" className="gap-2 text-slate-600">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Plataforma
                    </Link>
                </Button>
            </header>

            <div className="container mx-auto max-w-6xl py-8 px-4 flex flex-col md:flex-row gap-8">
                {/* Admin Sidebar / Nav */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="flex flex-col gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    )
}

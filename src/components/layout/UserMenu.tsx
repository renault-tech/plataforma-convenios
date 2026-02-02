"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/hooks/useAdmin"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings as SettingsIcon, Shield } from "lucide-react"

export function UserMenu() {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()
    const { isAdmin } = useAdmin()

    useEffect(() => {
        let isMounted = true;
        async function loadUser() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()

                // If error or no user, Stop loading but DONT return early
                // We need to set loading=false so the component renders the "Guest" state
                if (error || !user) {
                    if (isMounted) setLoading(false)
                    return
                }

                if (isMounted) setUser(user)

                // Fetch profile only if we have a user
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (isMounted && profile) setProfile(profile)

            } catch (err) {
                // Ignore errors
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        loadUser()
        return () => { isMounted = false }
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    if (loading) {
        return (
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
        )
    }

    // Initials logic
    const displayName = user ? (profile?.full_name || user.email) : "Visitante"
    const initials = displayName
        ? displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : "V"

    // Additional Profile Info
    const deptInfo = profile?.secretaria ? `${profile.secretaria} • ${profile.setor || ''}` : ''

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full focus:ring-0">
                    <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarImage src={user?.user_metadata?.avatar_url} alt={displayName} />
                        <AvatarFallback className={user ? "bg-blue-100 text-blue-700 font-medium" : "bg-slate-100 text-slate-500"}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                            {user ? user.email : "Não autenticado"}
                        </p>
                        {deptInfo && (
                            <p className="text-[10px] text-blue-600 font-medium truncate pt-1">
                                {deptInfo}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user ? (
                    <>
                        <DropdownMenuItem onClick={() => router.push("/configuracoes")}>
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                        </DropdownMenuItem>
                        {isAdmin && (
                            <DropdownMenuItem onClick={() => router.push("/admin")}>
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Administração</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem onClick={() => router.push("/login")} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Fazer Login</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

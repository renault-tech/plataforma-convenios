"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export type AdminProfile = {
    id: string
    role: 'admin' | 'user'
    is_super_admin: boolean
}

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setIsAdmin(false)
                    setIsSuperAdmin(false)
                    setIsLoading(false)
                    return
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role, is_super_admin')
                    .eq('id', user.id)
                    .single()

                if (error || !profile) {
                    setIsAdmin(false)
                    setIsSuperAdmin(false)
                } else {
                    const hasAdminRole = profile.role === 'admin'
                    const isSuper = profile.is_super_admin === true

                    setIsAdmin(hasAdminRole || isSuper)
                    setIsSuperAdmin(isSuper)
                }
            } catch (error) {
                console.error("Error checking admin status:", error)
                setIsAdmin(false)
                setIsSuperAdmin(false)
            } finally {
                setIsLoading(false)
            }
        }

        checkAdmin()
    }, [])

    return { isAdmin, isSuperAdmin, isLoading }
}

"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { markServiceAsViewed } from "@/app/actions/service-views"

export type Service = {
    id: string
    name: string
    slug: string
    primary_color: string
    icon: string
    columns_config: any
    owner_id: string | null
    updated_at?: string
    share_count?: number
    share_meta?: {
        count: number
        types: ('user' | 'group')[]
    }
    shared_via?: {
        type: 'user' | 'group'
        origin_group_id?: string
    }
    table_blocks?: {
        id: string
        title: string
        order: number
        columns: any
    }[]
}

type ServiceContextType = {
    services: Service[]
    myServices: Service[]
    sharedServices: Service[]
    activeService: Service | null
    setActiveService: (service: Service) => void
    isLoading: boolean
    refreshServices: () => Promise<void>
    createService: (service: Partial<Service>) => Promise<Service | null>
    updateService: (id: string, updates: Partial<Service>) => Promise<void>
    deleteService: (id: string) => Promise<void>
    userId: string | null
    lastViews: Record<string, string>
    markServiceViewed: (serviceId: string) => void
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined)

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>([])
    const [activeService, setActiveService] = useState<Service | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [lastViews, setLastViews] = useState<Record<string, string>>({})
    const [supabase] = useState(() => createClient())

    // Derived state
    const myServices = services.filter(s => s.owner_id === userId || !s.owner_id)
    const sharedServices = services.filter(s => s.owner_id && s.owner_id !== userId)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)
        }
        init()
    }, [])

    const activeServiceRef = React.useRef(activeService)

    useEffect(() => {
        activeServiceRef.current = activeService
    }, [activeService])

    const fetchServices = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Parallel Fetching
            const [viewsResult, myServicesResult, sharedServicesResult] = await Promise.all([
                // 0. Fetch Last Views
                supabase
                    .from('user_service_views')
                    .select('service_id, last_viewed_at')
                    .eq('user_id', user.id),

                // 1. Fetch My Services
                supabase
                    .from("services")
                    .select("*, service_permissions(grantee_type, origin_group_id, grantee_id), table_blocks(*)")
                    .eq("owner_id", user.id)
                    .order("name"),

                // 2. Fetch Shared Services
                supabase
                    .from("services")
                    .select("*, service_permissions!inner(id, grantee_type, origin_group_id, status), table_blocks(*)")
                    .eq("service_permissions.status", "active")
                    .neq("owner_id", user.id)
            ])

            // Process Views
            const { data: viewsData } = viewsResult
            const viewsMap: Record<string, string> = {}
            if (viewsData) {
                viewsData.forEach((v: any) => {
                    viewsMap[v.service_id] = v.last_viewed_at
                })
            }
            setLastViews(viewsMap)

            // Process My Services
            const { data: myData, error: myError } = myServicesResult
            if (myError) console.error("Error fetching my services", JSON.stringify(myError, null, 2))

            const processedMyData = (myData || []).map((s: any) => {
                const perms = s.service_permissions || []
                const validPerms = perms.filter((p: any) => p.grantee_id !== user.id)

                const count = validPerms.length
                const types: ('user' | 'group')[] = []
                const hasGroup = validPerms.some((p: any) => p.grantee_type === 'group' || !!p.origin_group_id)
                const hasUser = validPerms.some((p: any) => p.grantee_type === 'user' && !p.origin_group_id)

                if (hasGroup) types.push('group')
                if (hasUser) types.push('user')

                return {
                    ...s,
                    share_meta: { count, types }
                }
            })

            // Process Shared Services
            const { data: sharedData, error: sharedError } = sharedServicesResult
            if (sharedError) console.error("Error fetching shared services", JSON.stringify(sharedError, null, 2))

            const safeSharedData = (sharedData || []).map((s: any) => {
                const { service_permissions, ...service } = s
                const perms = service_permissions || []
                const groupShare = perms.find((p: any) => p.grantee_type === 'group' || !!p.origin_group_id)

                return {
                    ...service,
                    shared_via: {
                        type: groupShare ? 'group' : 'user',
                        origin_group_id: groupShare?.origin_group_id
                    }
                }
            })

            // Merge
            const allServicesMap = new Map()
            processedMyData.forEach((s: any) => allServicesMap.set(s.id, s))
            safeSharedData.forEach((s) => allServicesMap.set(s.id, s))

            const mergedServices = Array.from(allServicesMap.values()).sort((a, b) => a.name.localeCompare(b.name))

            setServices(mergedServices)

            // Active Service Logic
            const currentActive = activeServiceRef.current
            if (!currentActive && mergedServices.length > 0) {
                const defaultService = mergedServices.find((s) => s.slug === "convenios") || mergedServices[0]
                setActiveService(defaultService)
            } else if (currentActive) {
                const updatedActive = mergedServices.find(s => s.id === currentActive.id)
                if (updatedActive) {
                    if (JSON.stringify(updatedActive) !== JSON.stringify(currentActive)) {
                        setActiveService(updatedActive)
                    }
                } else if (mergedServices.length > 0) {
                    setActiveService(mergedServices[0])
                } else {
                    setActiveService(null)
                }
            }

        } catch (err) {
            console.error("Failed to fetch services", err)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchServices()
    }, [fetchServices])

    // Subscription
    useEffect(() => {
        if (!userId) return

        const channel = supabase
            .channel('service_views_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_service_views', filter: `user_id=eq.${userId}` },
                (payload: any) => {
                    if (payload.new && payload.new.service_id) {
                        setLastViews(prev => ({
                            ...prev,
                            [payload.new.service_id]: payload.new.last_viewed_at
                        }))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase])

    const createService = async (service: Partial<Service>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user")

            const { data, error } = await supabase
                .from("services")
                .insert({ ...service, owner_id: user.id })
                .select()
                .single()

            if (error) throw error

            setServices(prev => [...prev, data])
            toast.success("Serviço criado com sucesso!")
            return data
        } catch (error: any) {
            console.error("Error creating service:", error)
            toast.error("Erro ao criar serviço: " + error.message)
            return null
        }
    }

    const updateService = async (id: string, updates: Partial<Service>) => {
        try {
            const { error } = await supabase
                .from("services")
                .update(updates)
                .eq("id", id)

            if (error) throw error

            setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
            if (activeService?.id === id) {
                setActiveService(prev => prev ? { ...prev, ...updates } : null)
            }
            toast.success("Serviço atualizado!")
        } catch (error: any) {
            console.error("Error updating service:", error)
            toast.error("Erro ao atualizar serviço.")
            throw error
        }
    }

    const deleteService = async (id: string) => {
        try {
            const { error } = await supabase
                .from("services")
                .delete()
                .eq("id", id)

            if (error) throw error

            setServices(prev => prev.filter(s => s.id !== id))
            if (activeService?.id === id) {
                const remaining = services.filter(s => s.id !== id)
                setActiveService(remaining[0] || null)
            }
            toast.success("Serviço excluído.")
        } catch (error: any) {
            console.error("Error deleting service:", error)
            toast.error("Erro ao excluir serviço.")
        }
    }

    const markServiceViewed = useCallback(async (serviceId: string) => {
        // 1. Optimistic Update (Instant)
        const now = new Date().toISOString()
        setLastViews(prev => ({
            ...prev,
            [serviceId]: now
        }))

        // 2. Background Server Action
        try {
            await markServiceAsViewed(serviceId)
        } catch (error) {
            console.error("Failed to mark service as viewed on server", error)
            // Optional: Revert on error? Usually not critical for "last view"
        }
    }, [])

    useEffect(() => {
        if (activeService) {
            const root = document.documentElement
            root.style.setProperty("--primary", activeService.primary_color)
            root.style.setProperty("--ring", activeService.primary_color)
            root.style.setProperty("--sidebar-primary", activeService.primary_color)
            root.style.setProperty("--service-color", activeService.primary_color)
        }
    }, [activeService])

    return (
        <ServiceContext.Provider value={{
            services,
            myServices,
            sharedServices,
            activeService,
            setActiveService,
            isLoading,
            refreshServices: fetchServices,
            createService,
            updateService,
            deleteService,
            userId,
            lastViews,
            markServiceViewed
        }}>
            {children}
        </ServiceContext.Provider>
    )
}

export function useService() {
    const context = useContext(ServiceContext)
    if (context === undefined) {
        throw new Error("useService must be used within a ServiceProvider")
    }
    return context
}

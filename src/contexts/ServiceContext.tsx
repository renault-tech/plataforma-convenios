"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export type Service = {
    id: string
    name: string
    slug: string
    primary_color: string
    icon: string
    columns_config: any
    owner_id: string | null
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
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined)

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>([])
    const [activeService, setActiveService] = useState<Service | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()

    // Derived state
    const myServices = services.filter(s => s.owner_id === userId || !s.owner_id) // Treat null owner as "Mine" or "Legacy" for now
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

            // 1. Fetch My Services
            const { data: myData, error: myError } = await supabase
                .from("services")
                .select("*")
                .eq("owner_id", user.id)
                .order("name")

            if (myError) console.error("Error fetching my services", myError)

            // 2. Fetch Shared Services (via permissions)
            // We use !inner to enforce that a permission must exist (effectively "Active" since we only create on accept)
            const { data: sharedData, error: sharedError } = await supabase
                .from("services")
                .select("*, service_permissions!inner(id)")

            if (sharedError) console.error("Error fetching shared services", sharedError)

            const safeMyData = myData || []
            const safeSharedData = (sharedData || []).map((s: any) => {
                const { service_permissions, ...service } = s
                return service
            })

            // Merge and dedup
            const allServicesMap = new Map()
            safeMyData.forEach((s) => allServicesMap.set(s.id, s))
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
                    // Update if changed
                    if (JSON.stringify(updatedActive) !== JSON.stringify(currentActive)) {
                        setActiveService(updatedActive)
                    }
                } else if (mergedServices.length > 0) {
                    // Active service no longer available (access revoked?), switch to first
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
    }, [fetchServices]) // Re-run when fetchServices changes (it depends on activeService/supabase)

    // Also re-fetch when userId is set (Auth State loaded) to ensure RLS is applied correctly if context allows
    // Actually RLS is server-side, client just sends token. Token is attached auto.

    const createService = async (service: Partial<Service>) => {
        try {
            const { data, error } = await supabase
                .from("services")
                .insert({ ...service, owner_id: userId }) // Ensure owner is set
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

    // Update CSS variables when activeService changes
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
            userId
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

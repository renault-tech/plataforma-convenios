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
}

type ServiceContextType = {
    services: Service[]
    activeService: Service | null
    setActiveService: (service: Service) => void
    isLoading: boolean
    refreshServices: () => Promise<void>
    createService: (service: Partial<Service>) => Promise<Service | null>
    updateService: (id: string, updates: Partial<Service>) => Promise<void>
    deleteService: (id: string) => Promise<void>
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined)

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>([])
    const [activeService, setActiveService] = useState<Service | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    const fetchServices = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("services")
                .select("*")
                .order("name", { ascending: true })

            if (error) {
                console.error("Error fetching services:", error)
                toast.error("Erro ao carregar serviços.")
                return
            }

            if (data) {
                setServices(data)
                // If no active service is selected, or if the active service was deleted, select the first one
                if (!activeService && data.length > 0) {
                    // Default to 'Convênios' if exists, else first
                    const defaultService = data.find((s) => s.slug === "convenios") || data[0]
                    setActiveService(defaultService)
                } else if (activeService) {
                    // Update the active service object with fresh data
                    const updatedActive = data.find(s => s.id === activeService.id)
                    if (updatedActive) {
                        setActiveService(updatedActive)
                    } else if (data.length > 0) {
                        // Active service was deleted
                        setActiveService(data[0])
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch services", err)
        } finally {
            setIsLoading(false)
        }
    }, [activeService, supabase])

    useEffect(() => {
        fetchServices()
    }, [])

    const createService = async (service: Partial<Service>) => {
        try {
            const { data, error } = await supabase
                .from("services")
                .insert(service)
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

            // Optimistic update or refetch
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
            activeService,
            setActiveService,
            isLoading,
            refreshServices: fetchServices,
            createService,
            updateService,
            deleteService
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

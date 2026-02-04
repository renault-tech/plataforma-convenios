"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useService } from "@/contexts/ServiceContext"
import { parseISO, isAfter, isBefore, addDays, format } from "date-fns"
import { getStatusCategory } from "@/lib/constants/status"

// User settings
type UserSettings = {
    alert_days_short: number // e.g. 30
    alert_days_long: number  // e.g. 90
}

type WidgetConfig = {
    id: string
    widget_type: 'preset' | 'custom'
    widget_key: string
    config: any
    position: number
    is_active: boolean
}

// Dynamic Status Group
type StatusGroup = {
    status: string
    count: number
    color: string
    items: any[]
}

type GlobalMetrics = {
    alertsDeadlines: number
    totalValues: number
    activeStatus: number
    recentUpdates: number
    detailedAlerts: any[]
    detailedValues: any[]
    detailedActive: any[]
    detailedUpdates: any[]
    detailedPending: any[] // New: Pending Items Consolidated
    // New: Dynamic Status Groups
    statusGroups: StatusGroup[]
    // Advanced metrics for charts
    statusDistribution: { status: string; count: number; color: string }[]
    completionRate: { name: string; value: number; percentage: number }[]
    timeline: { date: string; count: number }[]
    quickStats: {
        totalItems: number
        totalServices: number
        avgPerService: number
        growthRate: number
    }
}

type InboxContextType = {
    widgets: WidgetConfig[]
    metrics: GlobalMetrics
    isLoading: boolean
    userSettings: UserSettings
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>
    refreshMetrics: () => Promise<void>
    addWidget: (widget: Partial<WidgetConfig>) => Promise<void>
    updateWidget: (id: string, updates: Partial<WidgetConfig>) => Promise<void>
    deleteWidget: (id: string) => Promise<void>
    reorderWidgets: (widgetIds: string[]) => Promise<void>
    notifications: any[]
    acceptNotification: (id: string) => Promise<void>
    declineNotification: (id: string) => Promise<void>
}

const InboxContext = createContext<InboxContextType | undefined>(undefined)

const DEFAULT_SETTINGS: UserSettings = {
    alert_days_short: 30,
    alert_days_long: 90
}

export function InboxProvider({ children }: { children: React.ReactNode }) {
    const { services } = useService()
    const [widgets, setWidgets] = useState<WidgetConfig[]>([])
    const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
    const [notifications, setNotifications] = useState<any[]>([])

    const [metrics, setMetrics] = useState<GlobalMetrics>({
        alertsDeadlines: 0,
        totalValues: 0,
        activeStatus: 0,
        recentUpdates: 0,
        detailedAlerts: [],
        detailedValues: [],
        detailedActive: [],
        detailedUpdates: [],
        detailedPending: [],
        statusGroups: [],
        statusDistribution: [],
        completionRate: [],
        timeline: [],
        quickStats: {
            totalItems: 0,
            totalServices: 0,
            avgPerService: 0,
            growthRate: 0
        }
    })
    const [isLoading, setIsLoading] = useState(true)
    const [supabase] = useState(() => createClient())

    // Fetch user settings
    const fetchSettings = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', user.id)
            .single()

        if (data?.settings) {
            setUserSettings({
                ...DEFAULT_SETTINGS,
                ...data.settings
            })
        }
    }, [supabase])

    // Update settings
    const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
        const updated = { ...userSettings, ...newSettings }
        setUserSettings(updated)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.rpc('upsert_user_setting', {
            key_name: 'dashboard_alerts', // we store under a key inside JSONB
            value_data: updated
        })

        // Refresh metrics with new settings immediately
        refreshMetrics()
    }, [supabase, userSettings]) // Will add refreshMetrics to dep array later via ref or effect

    // Fetch widgets
    const fetchWidgets = useCallback(async () => {
        // Mock implementation or real one if table exists
        // keeping state simple for now as we focus on metrics
    }, [supabase])

    // Notifications Logic
    const fetchNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from("notifications").select("*").eq('user_id', user.id).order("created_at", { ascending: false }).limit(20)
        if (data) setNotifications(data)
    }, [supabase])

    const acceptNotification = async (id: string) => { /* logic */ }
    const declineNotification = async (id: string) => { /* logic */ }

    // Calculate metrics
    const refreshMetrics = useCallback(async () => {
        if (services.length === 0) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const serviceIds = services.map(s => s.id)
            const { data: allItems, error } = await supabase
                .from('items')
                .select('*, service:services(name, slug, primary_color, columns_config)')
                .in('service_id', serviceIds)
                .order('created_at', { ascending: false })

            if (error) throw error

            const today = new Date()
            const alertShortDate = addDays(today, userSettings.alert_days_short)
            const alertLongDate = addDays(today, userSettings.alert_days_long)
            const oneWeekAgo = addDays(today, -7)

            let alertsCount = 0
            let totalValue = 0
            let activeCount = 0
            let recentCount = 0

            const detailedAlerts: any[] = []
            const detailedValues: any[] = []
            const detailedActive: any[] = []
            const detailedUpdates: any[] = []
            const detailedPending: any[] = []

            // Dynamic Status Map
            const statusGroupsMap: Record<string, { count: number, items: any[], color: string }> = {}

            allItems?.forEach(item => {
                const service = item.service
                const itemData = item.data || {}
                const cols = service?.columns_config || []

                // Helper to create item object
                const makeItemObj = (extra: any = {}) => ({
                    id: item.id,
                    service_id: item.service_id,
                    service_name: service?.name,
                    service_slug: service?.slug,
                    service_color: service?.primary_color,
                    title: itemData[cols.find((c: any) => c.type === 'text')?.id] || 'Item sem título',
                    created_at: item.created_at,
                    ...extra
                })

                // Find Columns
                const dateCol = cols.find((c: any) => c.type === 'date' && /vencimento|prazo|limite/i.test(c.label))?.id
                const currencyCol = cols.find((c: any) => c.type === 'currency')?.id
                const statusCol = cols.find((c: any) => c.type === 'status' || /status|situação|situacao|estado/i.test(c.label))?.id

                // 1. Alerts (Using User Settings)
                if (dateCol && itemData[dateCol]) {
                    try {
                        const itemDate = parseISO(itemData[dateCol])
                        // Check if within short or long alert window
                        if (isAfter(itemDate, today) && isBefore(itemDate, alertLongDate)) {
                            alertsCount++
                            detailedAlerts.push(makeItemObj({
                                date: itemData[dateCol],
                                isShortTerm: isBefore(itemDate, alertShortDate)
                            }))
                        }
                    } catch { }
                }

                // 2. Values
                if (currencyCol && itemData[currencyCol]) {
                    const value = Number(itemData[currencyCol]) || 0
                    totalValue += value
                    if (value > 0) detailedValues.push(makeItemObj({ value }))
                }

                // ... inside refreshMetrics ...

                // 3. Status Groups & Active Status
                if (statusCol && itemData[statusCol]) {
                    const status = String(itemData[statusCol]).trim()
                    if (status) {
                        const category = getStatusCategory(status)

                        // Count "Active" generic metric
                        if (category === 'active') {
                            activeCount++
                            detailedActive.push(makeItemObj({ status }))
                        }

                        // Aggregate for Dynamic Widgets
                        if (!statusGroupsMap[status]) {
                            // Find color from options if available
                            const statusOption = cols.find((c: any) => c.id === statusCol)?.options?.find((o: any) => o.value === status)
                            statusGroupsMap[status] = {
                                count: 0,
                                items: [],
                                color: statusOption?.color || '#cbd5e1'
                            }
                        }
                        statusGroupsMap[status].count++
                        statusGroupsMap[status].items.push(makeItemObj({ status }))
                    }
                }

                // 4. Recent Updates
                if (item.created_at && isAfter(parseISO(item.created_at), oneWeekAgo)) {
                    recentCount++
                    detailedUpdates.push(makeItemObj())
                }

                // 5. Consolidated Pending (New Logic)
                if (statusCol && itemData[statusCol]) {
                    const status = String(itemData[statusCol]).trim()
                    if (getStatusCategory(status) === 'pending') {
                        detailedPending.push(makeItemObj({ status: itemData[statusCol] }))
                    }
                }
            })

            // Transform Status Map to Array
            const statusGroups = Object.entries(statusGroupsMap).map(([status, data]) => ({
                status,
                count: data.count,
                color: data.color,
                items: data.items
            })).sort((a, b) => b.count - a.count)

            // Chart Data (simpler logic for brevity)
            const statusDistribution = statusGroups.map(g => ({ status: g.status, count: g.count, color: g.color })).slice(0, 10)

            // Timeline
            const timelineMap: Record<string, number> = {}
            allItems?.forEach(i => {
                if (i.created_at) {
                    const d = format(parseISO(i.created_at), 'yyyy-MM-dd')
                    timelineMap[d] = (timelineMap[d] || 0) + 1
                }
            })
            const timeline = Object.entries(timelineMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))

            setMetrics({
                alertsDeadlines: alertsCount,
                totalValues: totalValue,
                activeStatus: activeCount,
                recentUpdates: recentCount,
                detailedAlerts,
                detailedValues,
                detailedActive,
                detailedUpdates,
                detailedPending,
                statusGroups, // New!
                statusDistribution,
                completionRate: [], // Placeholder for now
                timeline,
                quickStats: {
                    totalItems: allItems?.length || 0,
                    totalServices: services.length,
                    avgPerService: (allItems?.length || 0) / services.length || 0,
                    growthRate: 0
                }
            })

        } catch (error) {
            console.error("Metrics error:", error)
        } finally {
            setIsLoading(false)
        }
    }, [services, supabase, userSettings])

    useEffect(() => {
        fetchSettings()
        refreshMetrics()
    }, [fetchSettings]) // refreshMetrics in deps causes loop if not careful, better called explicitly

    // Realtime
    useEffect(() => {
        const channel = supabase.channel('inbox_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => refreshMetrics())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [supabase])

    const value = {
        widgets,
        metrics,
        isLoading,
        userSettings,
        updateSettings,
        refreshMetrics,
        addWidget: async () => { }, // placeholder
        updateWidget: async () => { },
        deleteWidget: async () => { },
        reorderWidgets: async () => { },
        resizeWidget: async () => { },
        notifications,
        acceptNotification,
        declineNotification
    }

    return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>
}

export function useInbox() {
    const context = useContext(InboxContext)
    if (context === undefined) throw new Error('useInbox must be used within an InboxProvider')
    return context
}

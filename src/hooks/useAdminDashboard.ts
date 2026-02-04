import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WidgetType = 'stats_users' | 'stats_services' | 'activity_feed' | 'recent_users' | 'chart_growth' | 'chart_distribution' | 'alerts_widget'

export interface DashboardWidget {
    id: string
    type: WidgetType
    x: number // Grid position (optional if just using sortable list)
    y: number
    w: number // Grid width (col-span)
    h: number // Grid height (row-span)
}

interface AdminDashboardState {
    activeWidgets: DashboardWidget[]
    availableWidgets: WidgetType[]
    addWidget: (type: WidgetType) => void
    removeWidget: (id: string) => void
    updateWidgets: (widgets: DashboardWidget[]) => void
    resetToDefault: () => void
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
    { id: 'w1', type: 'stats_users', x: 0, y: 0, w: 2, h: 1 },
    { id: 'w2', type: 'stats_services', x: 2, y: 0, w: 2, h: 1 },
    { id: 'w4', type: 'activity_feed', x: 4, y: 0, w: 4, h: 4 }, // Right column tall, wider
    { id: 'w5', type: 'recent_users', x: 0, y: 1, w: 4, h: 2 },
    { id: 'w5', type: 'recent_users', x: 0, y: 1, w: 4, h: 2 },
]

const ALL_WIDGETS: WidgetType[] = [
    'stats_users', 'stats_services',
    'activity_feed', 'recent_users', 'chart_growth', 'chart_distribution', 'alerts_widget'
]

export const useAdminDashboard = create<AdminDashboardState>()(
    persist(
        (set) => ({
            activeWidgets: DEFAULT_WIDGETS,
            availableWidgets: ALL_WIDGETS,

            addWidget: (type) => set((state) => {
                const newId = `w_${Date.now()}`
                // Default new widget size/pos
                const newWidget: DashboardWidget = {
                    id: newId,
                    type,
                    x: 0,
                    y: Infinity, // Append to end
                    w: 4,
                    h: 1
                }
                return { activeWidgets: [...state.activeWidgets, newWidget] }
            }),

            removeWidget: (id) => set((state) => ({
                activeWidgets: state.activeWidgets.filter(w => w.id !== id)
            })),

            updateWidgets: (widgets) => set({ activeWidgets: widgets }),

            resetToDefault: () => set({ activeWidgets: DEFAULT_WIDGETS })
        }),
        {
            name: 'admin-dashboard-layout',
        }
    )
)

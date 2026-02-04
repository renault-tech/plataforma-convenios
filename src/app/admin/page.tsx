"use client"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AdminMetricWidget } from "./components/AdminMetricWidget";
import { RecentUsersWidget } from "./components/RecentUsersWidget";
import { ActivityFeedWidget } from "./components/ActivityFeedWidget";
import { GrowthChartWidget } from "./components/charts/GrowthChartWidget";
import { DistributionChartWidget } from "./components/charts/DistributionChartWidget";
import { DashboardCard } from "./components/DashboardCard";
import { AddWidgetDialog } from "./components/AddWidgetDialog";
import { AlertsWidget } from "@/components/inbox/AlertsWidget";
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
    const { isAdmin, isLoading } = useAdmin()
    const router = useRouter()
    const { activeWidgets, updateWidgets } = useAdminDashboard()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            router.replace('/dashboard')
        }
    }, [isLoading, isAdmin, router])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = activeWidgets.findIndex((w) => w.id === active.id);
            const newIndex = activeWidgets.findIndex((w) => w.id === over.id);

            updateWidgets(arrayMove(activeWidgets, oldIndex, newIndex));
        }
    }

    if (!mounted || isLoading || !isAdmin) {
        return <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div
                    data-tour-group="admin"
                    data-tour-title="Painel Administrativo"
                    data-tour-desc="Aqui você tem uma visão geral de todo o sistema. Arraste os cards para organizar como preferir!"
                    data-tour-order="1"
                >
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h2>
                    <p className="text-slate-500">Bem-vindo ao painel de administração da plataforma.</p>
                </div>

            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={activeWidgets.map(w => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-8 gap-4 auto-rows-min">
                        {activeWidgets.map((widget) => (
                            <DashboardCard key={widget.id} widget={widget}>
                                {widget.type.startsWith('stats') && <AdminMetricWidget type={widget.type} />}
                                {widget.type === 'recent_users' && <RecentUsersWidget />}
                                {widget.type === 'activity_feed' && <ActivityFeedWidget />}
                                {widget.type === 'chart_growth' && <GrowthChartWidget />}
                                {widget.type === 'chart_distribution' && <DistributionChartWidget />}
                                {widget.type === 'alerts_widget' && <AlertsWidget />}
                            </DashboardCard>
                        ))}

                        {/* Add Button as last item, spanning 2 cols or filling gap */}
                        <div
                            className="col-span-2 row-span-1"
                            data-tour-group="admin"
                            data-tour-title="Personalize"
                            data-tour-desc="Adicione novos gráficos e widgets para monitorar o que é importante para você."
                            data-tour-order="2"
                        >
                            <AddWidgetDialog />
                        </div>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    )
}

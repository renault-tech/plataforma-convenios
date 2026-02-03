"use client"

import { useService } from "@/contexts/ServiceContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getContrastColor } from "@/lib/color-utils"
import { PlusCircle } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Link from "next/link"

export function ServiceQuickButtons() {
    const { myServices, activeService, setActiveService } = useService()

    if (myServices.length === 0) return null

    return (
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex items-center gap-3 px-1">
                {myServices.map((service) => {
                    const isActive = activeService?.id === service.id
                    const bgColor = service.primary_color || '#3b82f6'
                    const textColor = isActive ? getContrastColor(bgColor) : undefined

                    return (
                        <Button
                            key={service.id}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "h-9 px-4 rounded-full transition-all font-medium border",
                                isActive
                                    ? "hover:opacity-90 border-transparent shadow-md"
                                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200"
                            )}
                            style={isActive ? {
                                backgroundColor: bgColor,
                                color: textColor
                            } : {}}
                            onClick={() => setActiveService(service)}
                        >
                            {service.name}
                        </Button>
                    )
                })}

                <Link href="/configuracoes?tab=servicos">
                    <Button
                        variant="outline"
                        className="h-9 px-4 rounded-full gap-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 bg-white"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Novo Serviço
                    </Button>
                </Link>
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
    )
}

"use client"

import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificationConfigDialog } from "./NotificationConfigDialog"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ColumnHeaderBellProps {
    columnId: string
    type: 'date' | 'status'
    hasRules?: boolean // If true, show filled/active icon
    serviceId?: string
}

export function ColumnHeaderBell({ columnId, type, hasRules = false, serviceId }: ColumnHeaderBellProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <TooltipProvider>
            <Tooltip>
                <NotificationConfigDialog
                    targetType="column"
                    targetId={columnId}
                    serviceId={serviceId}
                    triggerType={type}
                    open={isOpen}
                    onOpenChange={setIsOpen}
                >
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-6 w-6 ml-1 transition-all duration-200",
                                // Ghost behavior: Opacity 0 unless active or group-hover
                                !hasRules && "opacity-0 group-hover/column:opacity-100",
                                hasRules ? "text-blue-500" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                            )}
                        >
                            {hasRules ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                        </Button>
                    </TooltipTrigger>
                </NotificationConfigDialog>
                <TooltipContent>
                    <p>{hasRules ? "Gerenciar alertas" : "Criar alerta automático"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

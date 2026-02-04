"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { NotificationRulesList } from "./NotificationRulesList"

export function NotificationManagerDialog({ children, serviceId }: { children?: React.ReactNode, serviceId?: string }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                        <Bell className="h-4 w-4" />
                        Meus Alertas
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Meus Alertas Configurados</DialogTitle>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {open && <NotificationRulesList serviceId={serviceId} />}
                </div>
            </DialogContent>
        </Dialog>
    )
}


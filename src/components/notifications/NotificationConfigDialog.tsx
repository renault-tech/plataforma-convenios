"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Bell, Calendar, Mail, Smartphone, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { MAIN_STATUS_OPTIONS } from "@/lib/constants/status"

interface NotificationConfigDialogProps {
    targetType: 'column' | 'row'
    targetId: string // Column ID (e.g., 'vencimento') or Row ID
    serviceId?: string // Context (Planilha ID)
    triggerType: 'date' | 'status'
    dateColumnId?: string // Column ID for date triggers
    icon?: React.ReactNode
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    statusOptions?: string[] // Available status options for this column
}

export function NotificationConfigDialog({
    targetType,
    targetId,
    serviceId,
    triggerType,
    dateColumnId,
    icon,
    children,
    open,
    onOpenChange,
    statusOptions
}: NotificationConfigDialogProps) {
    const [selectedChannels, setSelectedChannels] = useState<string[]>(['app'])
    const [offsets, setOffsets] = useState<number[]>([-7]) // Default 7 days before
    const [statusTo, setStatusTo] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false) // Internal state

    const supabase = createClient()

    // Determine controlled vs uncontrolled
    const isControlled = open !== undefined
    const displayOpen = isControlled ? open : internalOpen

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) setInternalOpen(newOpen)
        onOpenChange?.(newOpen)
    }

    const toggleChannel = (channel: string) => {
        setSelectedChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        )
    }

    const toggleOffset = (offset: number) => {
        setOffsets(prev =>
            prev.includes(offset) ? prev.filter(o => o !== offset) : [...prev, offset]
        )
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")


            // For dates, we might create multiple rules (one per offset)
            // For status, usually one rule

            const commonData = {
                user_id: user.id,
                service_id: serviceId, // Save Context
                target_type: targetType,
                target_id: targetId,
                channels: selectedChannels,
                active: true
            }

            if (triggerType === 'date') {
                const rules = offsets.map(offset => ({
                    ...commonData,
                    trigger_type: 'date',
                    trigger_config: { offset: offset, time: "09:00", column_id: dateColumnId }
                }))

                const { error } = await supabase.from('notification_rules').insert(rules)
                if (error) throw error

                // Trigger immediate check with feedback
                try {
                    const res = await fetch('/api/notifications/check', { cache: 'no-store' })
                    const json = await res.json()
                    if (json.success && json.count > 0) {
                        toast.success(`${json.count} novo(s) alerta(s) de prazo encontrado(s)!`)
                    } else {
                        toast.info(`Regra salva. Nenhum item vence hoje. (Coluna Alvo: ${dateColumnId || 'Padrão'})`)
                    }
                } catch (e) {
                    console.error("Check trigger failed", e)
                }
            } else {
                const { error } = await supabase.from('notification_rules').insert({
                    ...commonData,
                    trigger_type: 'status',
                    trigger_config: { to: statusTo }
                })
                if (error) throw error
            }

            toast.success("Notificação configurada com sucesso!")
            handleOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao salvar notificação.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={displayOpen} onOpenChange={handleOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {icon || <Bell className="h-5 w-5 text-blue-500" />}
                        Configurar Alerta
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Trigger Config */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Quando avisar?</Label>

                        {triggerType === 'date' ? (
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { label: "No dia do vencimento", val: 0 },
                                    { label: "1 dia antes", val: -1 },
                                    { label: "7 dias antes (1 semana)", val: -7 },
                                    { label: "30 dias antes (1 mês)", val: -30 },
                                ].map((opt) => (
                                    <div
                                        key={opt.val}
                                        className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 transition-colors cursor-default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            id={`offset-${opt.val}`}
                                            checked={offsets.includes(opt.val)}
                                            onCheckedChange={() => toggleOffset(opt.val)}
                                        />
                                        <Label htmlFor={`offset-${opt.val}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Quando o status mudar para:</Label>
                                <Select value={statusTo} onValueChange={setStatusTo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(statusOptions || MAIN_STATUS_OPTIONS).map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Channels Config */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Onde avisar?</Label>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant={selectedChannels.includes('app') ? "default" : "outline"}
                                className="flex-1 gap-2"
                                onClick={() => toggleChannel('app')}
                            >
                                <Smartphone className="h-4 w-4" />
                                App
                            </Button>
                            <Button
                                type="button"
                                variant={selectedChannels.includes('email') ? "default" : "outline"}
                                className="flex-1 gap-2"
                                onClick={() => toggleChannel('email')}
                            >
                                <Mail className="h-4 w-4" />
                                Email
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSave()
                        }}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? "Salvando..." : "Criar Alerta"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

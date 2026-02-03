"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInbox } from "@/contexts/InboxContext"
import { useState } from "react"
import { toast } from "sonner"

interface AlertSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AlertSettingsDialog({ open, onOpenChange }: AlertSettingsDialogProps) {
    const { userSettings, updateSettings } = useInbox()
    const [shortTerm, setShortTerm] = useState(userSettings.alert_days_short.toString())
    const [longTerm, setLongTerm] = useState(userSettings.alert_days_long.toString())
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        const short = parseInt(shortTerm)
        const long = parseInt(longTerm)

        if (isNaN(short) || isNaN(long)) {
            toast.error("Por favor, insira números válidos.")
            return
        }

        if (short >= long) {
            toast.error("O prazo curto deve ser menor que o prazo longo.")
            return
        }

        setIsLoading(true)
        try {
            await updateSettings({
                alert_days_short: short,
                alert_days_long: long
            })
            toast.success("Configurações de alerta salvas!")
            onOpenChange(false)
        } catch (error) {
            toast.error("Erro ao salvar configurações.")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurar Alertas</DialogTitle>
                    <DialogDescription>
                        Defina os prazos para considerar itens como "Próximos do Vencimento".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="short" className="text-right">
                            Curto Prazo
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="short"
                                type="number"
                                value={shortTerm}
                                onChange={(e) => setShortTerm(e.target.value)}
                                className="w-20"
                            />
                            <span className="text-sm text-slate-500">dias</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="long" className="text-right">
                            Longo Prazo
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="long"
                                type="number"
                                value={longTerm}
                                onChange={(e) => setLongTerm(e.target.value)}
                                className="w-20"
                            />
                            <span className="text-sm text-slate-500">dias</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useChat } from "@/contexts/ChatContext"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function ChatSettingsPanel() {
    const { settings, updateSettings } = useChat()

    const colors = [
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#8b5cf6', // Violet
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#0f172a', // Slate
    ]

    return (
        <div className="flex-1 bg-white p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Color Theme */}
            <div className="space-y-3">
                <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Cor do Tema</Label>
                <div className="flex gap-3 flex-wrap">
                    {colors.map(color => (
                        <button
                            key={color}
                            onClick={() => updateSettings({ theme_color: color })}
                            className={`h-8 w-8 rounded-full border-2 transition-all ${settings.theme_color === color ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            {/* Behavior Settings */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Enviar com Enter</Label>
                        <p className="text-xs text-slate-500">Nova linha com Shift + Enter</p>
                    </div>
                    <Switch
                        checked={settings.enter_to_send}
                        onCheckedChange={(checked: boolean) => updateSettings({ enter_to_send: checked })}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Abrir Automaticamente</Label>
                        <p className="text-xs text-slate-500">Ao receber nova mensagem</p>
                    </div>
                    <Switch
                        checked={settings.auto_open}
                        onCheckedChange={(checked: boolean) => updateSettings({ auto_open: checked })}
                    />
                </div>
            </div>

            <div className="h-[1px] bg-slate-100" />

            <div className="pt-4 text-center">
                <p className="text-xs text-slate-400">Versão do Chat 1.0</p>
            </div>
        </div>
    )
}

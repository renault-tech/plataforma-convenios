"use client"

import { useState, useEffect } from "react"
import { Clock, Settings, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

type DateTimeStyle = 'compact' | 'digital' | 'analog' | 'verbose'

interface DateTimeWidgetProps {
    style?: DateTimeStyle
    onStyleChange?: (style: DateTimeStyle) => void
    onAddWidget?: () => void
}

export function DateTimeWidget({ style = 'compact', onStyleChange, onAddWidget }: DateTimeWidgetProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [selectedStyle, setSelectedStyle] = useState<DateTimeStyle>(style)
    const supabase = createClient()

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Persist style preference
    const handleStyleChange = async (newStyle: DateTimeStyle) => {
        setSelectedStyle(newStyle)
        onStyleChange?.(newStyle)

        // Save to user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('profiles')
                .update({ datetime_widget_style: newStyle })
                .eq('id', user.id)
        }
    }

    const renderWidget = () => {
        switch (selectedStyle) {
            case 'verbose':
                return (
                    <div className="flex flex-col items-end">
                        <div className="text-sm font-semibold text-slate-700">
                            {format(currentTime, "EEEE", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-slate-500">
                            {format(currentTime, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-lg font-bold text-slate-900 mt-1">
                            {format(currentTime, "HH:mm:ss")}
                        </div>
                    </div>
                )

            case 'digital':
                return (
                    <div className="flex flex-col items-center bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg font-mono">
                        <div className="text-2xl font-bold tracking-wider">
                            {format(currentTime, "HH:mm:ss")}
                        </div>
                        <div className="text-xs mt-1 opacity-80">
                            {format(currentTime, "dd/MM/yyyy")}
                        </div>
                    </div>
                )

            case 'analog':
                return (
                    <div className="flex flex-col items-center">
                        <AnalogClock time={currentTime} />
                        <div className="text-xs text-slate-500 mt-2">
                            {format(currentTime, "dd/MM/yyyy")}
                        </div>
                    </div>
                )

            case 'compact':
            default:
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <div className="flex flex-col">
                            <div className="text-sm font-medium text-slate-700">
                                {format(currentTime, "HH:mm:ss")}
                            </div>
                            <div className="text-xs text-slate-500">
                                {format(currentTime, "dd/MM/yyyy")}
                            </div>
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="relative group">
            <div className="bg-white px-3 py-2 rounded-lg border shadow-sm">
                {renderWidget()}
            </div>

            {/* Add Widget Button - Left side */}
            {onAddWidget && (
                <button
                    onClick={onAddWidget}
                    className="absolute -top-2 -left-2 bg-blue-600 text-white border border-blue-700 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
                    title="Adicionar widget"
                >
                    <Plus className="h-3 w-3" />
                </button>
            )}

            {/* Settings Button - Right side */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="absolute -top-2 -right-2 bg-white border rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50">
                        <Settings className="h-3 w-3 text-slate-600" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStyleChange('compact')}>
                        <Clock className="h-4 w-4 mr-2" />
                        Compacto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStyleChange('digital')}>
                        <Clock className="h-4 w-4 mr-2" />
                        Digital
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStyleChange('analog')}>
                        <Clock className="h-4 w-4 mr-2" />
                        Analógico
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStyleChange('verbose')}>
                        <Clock className="h-4 w-4 mr-2" />
                        Por Extenso
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// Analog Clock Component
function AnalogClock({ time }: { time: Date }) {
    const hours = time.getHours() % 12
    const minutes = time.getMinutes()
    const seconds = time.getSeconds()

    const hourAngle = (hours * 30) + (minutes * 0.5)
    const minuteAngle = minutes * 6
    const secondAngle = seconds * 6

    return (
        <div className="relative w-24 h-24 bg-white border-2 border-slate-300 rounded-full shadow-md">
            {/* Clock face markers */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-0.5 h-2 bg-slate-400"
                    style={{
                        top: '8px',
                        left: '50%',
                        transformOrigin: 'center 40px',
                        transform: `translateX(-50%) rotate(${i * 30}deg)`
                    }}
                />
            ))}

            {/* Hour hand */}
            <div
                className="absolute w-1 h-7 bg-slate-700 rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center bottom',
                    transform: `translateX(-50%) translateY(-100%) rotate(${hourAngle}deg)`
                }}
            />

            {/* Minute hand */}
            <div
                className="absolute w-0.5 h-9 bg-slate-600 rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center bottom',
                    transform: `translateX(-50%) translateY(-100%) rotate(${minuteAngle}deg)`
                }}
            />

            {/* Second hand */}
            <div
                className="absolute w-px h-10 bg-red-500 rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center bottom',
                    transform: `translateX(-50%) translateY(-100%) rotate(${secondAngle}deg)`
                }}
            />

            {/* Center dot */}
            <div className="absolute w-2 h-2 bg-slate-800 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
    )
}

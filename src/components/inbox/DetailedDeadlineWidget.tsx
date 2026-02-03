import { Card } from "@/components/ui/card"
import { MoreHorizontal, AlertCircle } from "lucide-react"

interface DetailedDeadlineWidgetProps {
    shortTermCount: number
    shortTermDays: number
    longTermCount: number
    longTermDays: number
    onConfigure?: () => void
}

export function DetailedDeadlineWidget({
    shortTermCount,
    shortTermDays,
    longTermCount,
    longTermDays,
    onConfigure
}: DetailedDeadlineWidgetProps) {
    return (
        <Card className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-all h-full bg-white flex flex-col justify-between group relative overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 text-sm">Próximos Vencimentos</h3>
                {onConfigure && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onConfigure()
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <AlertCircle className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content Split */}
            <div className="flex flex-1 items-end mt-2">
                {/* Long Term (Left) */}
                <div className="flex-1 pr-4 border-r border-slate-100 flex flex-col justify-end">
                    <span className="text-xs text-slate-500 font-medium mb-1">{longTermDays} Dias</span>
                    <span className="text-3xl font-bold text-amber-500 leading-none">{longTermCount}</span>
                    {/* Abstract Sparkline Decoration */}
                    <div className="h-6 w-full mt-2 opacity-50 relative">
                        <svg viewBox="0 0 100 20" className="w-full h-full text-amber-200 fill-current" preserveAspectRatio="none">
                            <path d="M0,20 Q50,5 100,10 L100,20 L0,20 Z" />
                        </svg>
                    </div>
                </div>

                {/* Short Term (Right) */}
                <div className="flex-1 pl-4 flex flex-col justify-end">
                    <span className="text-xs text-slate-500 font-medium mb-1">{shortTermDays} Dias</span>
                    <span className="text-3xl font-bold text-red-500 leading-none">{shortTermCount}</span>
                    {/* Abstract Sparkline Decoration */}
                    <div className="h-6 w-full mt-2 opacity-50 relative">
                        <svg viewBox="0 0 100 20" className="w-full h-full text-red-200 fill-current" preserveAspectRatio="none">
                            <path d="M0,15 Q50,20 100,5 L100,20 L0,20 Z" />
                        </svg>
                    </div>
                </div>
            </div>
        </Card>
    )
}

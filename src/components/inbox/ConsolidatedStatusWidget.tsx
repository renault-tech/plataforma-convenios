import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusMetric {
    label: string
    count: number
    color: string
}

interface ConsolidatedStatusWidgetProps {
    data: StatusMetric[]
    total: number
}

export function ConsolidatedStatusWidget({ data, total }: ConsolidatedStatusWidgetProps) {
    const donePercent = total > 0 ? (data.find(d => d.label === 'Concluído')?.count || 0) / total * 100 : 0

    return (
        <Card className="p-4 border-slate-200 shadow-sm hover:shadow-md transition-all h-full bg-white flex flex-col justify-between group overflow-hidden">
            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                    </div>
                    <span className="font-medium text-sm text-slate-700">Progresso</span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-slate-900">{Math.round(donePercent)}%</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Concluído</span>
                    </div>

                    <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100">
                        {data.map((item, idx) => {
                            if (item.count === 0) return null
                            const percent = (item.count / total) * 100
                            return (
                                <div
                                    key={idx}
                                    className={cn("transition-all duration-500 h-full", item.color)}
                                    style={{ width: `${percent}%` }}
                                    title={`${item.label}: ${item.count}`}
                                />
                            )
                        })}
                    </div>

                    {/* Compact Legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1">
                        {data.slice(0, 4).map((item, idx) => (
                            <div className="flex items-center gap-1" key={idx}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                                <span>{item.label}</span>
                            </div>
                        ))}
                        {data.length > 4 && <span>+{data.length - 4}</span>}
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500 flex justify-between">
                <span>Total</span>
                <span className="font-semibold">{total}</span>
            </div>
        </Card>
    )
}

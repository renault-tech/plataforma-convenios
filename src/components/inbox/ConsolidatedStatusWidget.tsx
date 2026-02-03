import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ConsolidatedStatusWidgetProps {
    done: number
    inProgress: number
    toDo: number
    total: number
}

export function ConsolidatedStatusWidget({ done, inProgress, toDo, total }: ConsolidatedStatusWidgetProps) {
    const donePercent = total > 0 ? (done / total) * 100 : 0
    const progressPercent = total > 0 ? (inProgress / total) * 100 : 0
    // The rest is To Do

    return (
        <Card className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-all h-full bg-white flex flex-col justify-between group">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
                        </div>
                        <span className="font-semibold text-slate-900">Progresso Geral</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900">{Math.round(donePercent)}%</span>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Conclusão</span>
                    </div>

                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${donePercent}%` }} />
                        <div className="bg-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Concluído ({done})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Andamento ({inProgress})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <span>A Fazer ({toDo})</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-50 flex justify-between">
                <span>Total de Itens</span>
                <span className="font-medium text-slate-700">{total}</span>
            </p>
        </Card>
    )
}

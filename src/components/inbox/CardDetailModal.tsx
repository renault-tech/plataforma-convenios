import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign, AlertCircle, Activity, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface CardDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    items: any[]
    type?: 'alerts' | 'values' | 'status_dynamic' | 'active' | 'updates'
}

export function CardDetailModal({ open, onOpenChange, title, description, items, type }: CardDetailModalProps) {
    const safeItems = Array.isArray(items) ? items : []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 bg-slate-50">
                <div className="p-6 border-b border-slate-200 bg-white rounded-t-lg">
                    <DialogHeader className="gap-2">
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {type === 'alerts' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                            {type === 'values' && <DollarSign className="w-5 h-5 text-emerald-500" />}
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-3">
                        {safeItems.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                Nenhum item encontrado nesta categoria.
                            </div>
                        ) : (
                            safeItems.map((item, idx) => {
                                if (!item) return null

                                const href = item.service_slug ? `/servicos/${item.service_slug}?highlight=${item.id}` : '#'

                                const Content = () => (
                                    <>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${type === 'alerts' ? 'bg-red-50 text-red-600' :
                                                type === 'values' ? 'bg-emerald-50 text-emerald-600' :
                                                    type === 'active' ? 'bg-violet-50 text-violet-600' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {type === 'alerts' ? <AlertCircle className="w-4 h-4" /> :
                                                    type === 'values' ? <DollarSign className="w-4 h-4" /> :
                                                        type === 'active' ? <Activity className="w-4 h-4" /> :
                                                            <ArrowUpRight className="w-4 h-4" />}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{item.title || 'Item sem título'}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {item.service_name && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.service_color || '#cbd5e1' }} />
                                                            {item.service_name}
                                                        </span>
                                                    )}
                                                    {type === 'alerts' && item.date && <span>• Vence em {new Date(item.date).toLocaleDateString()}</span>}
                                                    {type === 'values' && item.value && <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 ml-4">
                                            {/* Status Badge */}
                                            {item.status && (
                                                <Badge variant="outline" className="hidden sm:inline-flex bg-slate-50 font-normal">
                                                    {item.status}
                                                </Badge>
                                            )}

                                            <div className="h-8 w-8 flex items-center justify-center rounded-full text-slate-300 group-hover:text-blue-600 bg-transparent group-hover:bg-blue-50 transition-colors">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </>
                                )

                                if (!item.service_slug) {
                                    return (
                                        <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 opacity-70 cursor-not-allowed">
                                            <Content />
                                        </div>
                                    )
                                }

                                return (
                                    <Link
                                        key={item.id || idx}
                                        href={href}
                                        className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                                    >
                                        <Content />
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

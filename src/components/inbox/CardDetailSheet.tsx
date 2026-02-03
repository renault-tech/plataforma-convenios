"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface DetailItem {
    id: string
    service_id: string
    service_name: string
    service_slug: string
    service_color: string
    title: string
    date?: string
    value?: number
    status?: string
    created_at: string
}

interface CardDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    items: DetailItem[]
    type: 'alerts' | 'values' | 'active' | 'updates' | 'status_dynamic'
}

export function CardDetailSheet({
    open,
    onOpenChange,
    title,
    description,
    items = [], // Default value to prevent crash
    type
}: CardDetailSheetProps) {
    const router = useRouter()

    const handleItemClick = (item: DetailItem) => {
        // Navigate to service with highlight parameter
        router.push(`/servicos/${item.service_slug}?highlight=${item.id}`)
        onOpenChange(false)
    }

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        } catch {
            return dateStr
        }
    }

    // Ensure items is an array before checking length
    const safeItems = Array.isArray(items) ? items : []

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-3">
                    {safeItems.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                            Nenhum item encontrado.
                        </p>
                    ) : (
                        safeItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={cn(
                                    "p-4 border rounded-lg cursor-pointer transition-all",
                                    "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                                    "bg-white"
                                )}
                                style={{
                                    borderLeftWidth: '4px',
                                    borderLeftColor: item.service_color
                                }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 truncate">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {item.service_name}
                                        </p>

                                        {/* Type-specific content */}
                                        <div className="mt-2 space-y-1">
                                            {type === 'alerts' && item.date && (
                                                <p className="text-sm text-amber-700 font-medium">
                                                    Vencimento: {formatDate(item.date)}
                                                </p>
                                            )}
                                            {type === 'values' && item.value !== undefined && (
                                                <p className="text-sm text-emerald-700 font-medium">
                                                    Valor: {formatValue(item.value)}
                                                </p>
                                            )}
                                            {type === 'active' && item.status && (
                                                <p className="text-sm text-blue-700 font-medium">
                                                    Status: {item.status}
                                                </p>
                                            )}
                                            {type === 'updates' && (
                                                <p className="text-sm text-slate-600">
                                                    Criado em: {formatDate(item.created_at)}
                                                </p>
                                            )}
                                            {type === 'status_dynamic' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.service_color }}></span>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {item.status || 'Sem status'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

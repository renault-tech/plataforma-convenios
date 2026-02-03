"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Package, Bug, TrendingUp, AlertTriangle } from "lucide-react"
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type ChangelogEntry = {
    id: string
    title: string
    description: string
    created_at: string
    category: 'feature' | 'bugfix' | 'improvement' | 'breaking'
}

type GroupedChangelog = {
    weekLabel: string
    entries: ChangelogEntry[]
}

const categoryIcons = {
    feature: <Sparkles className="h-4 w-4" />,
    bugfix: <Bug className="h-4 w-4" />,
    improvement: <TrendingUp className="h-4 w-4" />,
    breaking: <AlertTriangle className="h-4 w-4" />
}

const categoryColors = {
    feature: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    bugfix: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    improvement: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    breaking: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
}

const categoryLabels = {
    feature: "Novo",
    bugfix: "Correção",
    improvement: "Melhoria",
    breaking: "Importante"
}

export function ChangelogDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [changelog, setChangelog] = useState<GroupedChangelog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (!open) return

        async function fetchChangelog() {
            setIsLoading(true)
            try {
                // Fetch last 15 days of changelog
                const fifteenDaysAgo = subDays(new Date(), 15)

                const { data, error } = await supabase
                    .from('changelog')
                    .select('*')
                    .gte('created_at', fifteenDaysAgo.toISOString())
                    .order('created_at', { ascending: false })

                if (error) throw error

                // Group by week
                const grouped = groupByWeek(data || [])
                setChangelog(grouped)
            } catch (error) {
                console.error('Error fetching changelog:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchChangelog()
    }, [open, supabase])

    function groupByWeek(entries: ChangelogEntry[]): GroupedChangelog[] {
        const weeks = new Map<string, ChangelogEntry[]>()

        entries.forEach(entry => {
            const entryDate = new Date(entry.created_at)
            const weekStart = startOfWeek(entryDate, { weekStartsOn: 0 }) // Sunday
            const weekEnd = endOfWeek(entryDate, { weekStartsOn: 0 })

            const weekLabel = `${format(weekStart, 'dd MMM', { locale: ptBR })} - ${format(weekEnd, 'dd MMM', { locale: ptBR })}`

            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, [])
            }
            weeks.get(weekLabel)!.push(entry)
        })

        return Array.from(weeks.entries()).map(([weekLabel, entries]) => ({
            weekLabel,
            entries
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        O que há de novo?
                    </DialogTitle>
                    <DialogDescription>
                        Acompanhe as últimas novidades e atualizações da plataforma
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[500px] pr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : changelog.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma atualização nos últimos 15 dias
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {changelog.map((week, weekIndex) => (
                                <div key={weekIndex} className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        {week.weekLabel}
                                    </h3>
                                    <div className="space-y-3">
                                        {week.entries.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-md ${categoryColors[entry.category]}`}>
                                                        {categoryIcons[entry.category]}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium">{entry.title}</h4>
                                                            <Badge variant="outline" className={`text-xs ${categoryColors[entry.category]}`}>
                                                                {categoryLabels[entry.category]}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {entry.description}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(entry.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

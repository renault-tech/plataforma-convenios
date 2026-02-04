export const STATUS_OPTIONS = [
    "Pendente",
    "Em Análise",
    "Aguardando",
    "Em Execução",
    "Em Andamento",
    "Ativo",
    "Concluído",
    "Entregue",
    "Aprovado",
    "Pago",
    "Cancelado",
    "Rejeitado",
    "Suspenso",
    "Atrasado",
    "Vencido"
] as const;

export type StatusOption = typeof STATUS_OPTIONS[number];

export const MAIN_STATUS_OPTIONS = [
    "Ativo",
    "Pendente",
    "Em Execução",
    "Concluído",
    "Cancelado"
];

export const getStatusColor = (status: string): string => {
    const s = (status || '').toLowerCase().trim();

    // Green (Success/Done/Active)
    if (['concluído', 'concluido', 'entregue', 'aprovado', 'pago'].some(k => s.includes(k))) {
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
    }

    // Blue (Active/Running)
    if (['ativo', 'execução', 'execucao', 'vigente'].some(k => s.includes(k))) {
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }

    // Indigo (In Progress)
    if (['andamento'].some(k => s.includes(k))) {
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
    }

    // Yellow (Waiting/Pending)
    if (['pendente', 'aguardando', 'analise', 'análise'].some(k => s.includes(k))) {
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    }

    // Red (Error/Late)
    if (['atrasado', 'vencido', 'erro'].some(k => s.includes(k))) {
        return "bg-red-100 text-red-800 hover:bg-red-200";
    }

    // Slate (Cancelled/Inactive)
    if (['cancelado', 'rejeitado', 'suspenso', 'arquivado'].some(k => s.includes(k))) {
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }

    // Default
    return "bg-slate-100 text-slate-700 hover:bg-slate-200";
};

export type StatusCategory = 'done' | 'active' | 'pending' | 'error' | 'cancelled' | 'other';

export const getStatusCategory = (status: string): StatusCategory => {
    const s = (status || '').toLowerCase().trim();

    if (!s) return 'pending'; // Default to pending if empty
    if (['concluído', 'concluido', 'entregue', 'aprovado', 'pago'].some(k => s.includes(k))) return 'done';
    if (['ativo', 'execução', 'execucao', 'vigente'].some(k => s.includes(k))) return 'active';
    if (['andamento'].some(k => s.includes(k))) return 'active'; // Map Andamento to Active category for grouping
    if (['pendente', 'aguardando', 'analise', 'análise'].some(k => s.includes(k))) return 'pending';
    if (['atrasado', 'vencido', 'erro'].some(k => s.includes(k))) return 'error';
    if (['cancelado', 'rejeitado', 'suspenso', 'arquivado'].some(k => s.includes(k))) return 'cancelled';

    return 'other';
};

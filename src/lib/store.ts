import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FieldType = 'text' | 'number' | 'date' | 'currency' | 'status'

export interface ColumnDefinition {
    id: string
    label: string
    type: FieldType
    required?: boolean
}

export interface Agreement {
    id: string
    [key: string]: any
}

interface AppState {
    columns: ColumnDefinition[]
    agreements: Agreement[]
    addColumn: (col: ColumnDefinition) => void
    removeColumn: (id: string) => void
    addAgreement: (agreement: Agreement) => void
    updateAgreement: (id: string, data: Partial<Agreement>) => void
    deleteAgreement: (id: string) => void
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            columns: [
                { id: 'numero', label: 'Número', type: 'text', required: true },
                { id: 'objeto', label: 'Objeto', type: 'text', required: true },
                { id: 'valor', label: 'Valor', type: 'currency', required: true },
                { id: 'vencimento', label: 'Vencimento', type: 'date', required: true },
                { id: 'status', label: 'Status', type: 'status', required: true },
            ],
            agreements: [
                {
                    id: '1',
                    numero: '001/2024',
                    objeto: 'Reforma da Escola Municipal Central',
                    valor: 1500000.00,
                    vencimento: '2024-12-31',
                    status: 'Ativo'
                },
                {
                    id: '2',
                    numero: '002/2024',
                    objeto: 'Aquisição de Equipamentos Hospitalares',
                    valor: 750000.50,
                    vencimento: '2024-10-15',
                    status: 'Pendente'
                },
                {
                    id: '3',
                    numero: '003/2023',
                    objeto: 'Pavimentação Asfáltica Bairro Norte',
                    valor: 3200000.00,
                    vencimento: '2025-06-30',
                    status: 'Concluído'
                }
            ],
            addColumn: (col) => set((state) => ({ columns: [...state.columns, col] })),
            removeColumn: (id) =>
                set((state) => ({ columns: state.columns.filter((c) => c.id !== id) })),
            addAgreement: (agreement) =>
                set((state) => ({ agreements: [...state.agreements, agreement] })),
            updateAgreement: (id, data) =>
                set((state) => ({
                    agreements: state.agreements.map((a) =>
                        a.id === id ? { ...a, ...data } : a
                    ),
                })),
            deleteAgreement: (id) =>
                set((state) => ({
                    agreements: state.agreements.filter((a) => a.id !== id),
                })),
        }),
        {
            name: 'convenios-storage',
        }
    )
)

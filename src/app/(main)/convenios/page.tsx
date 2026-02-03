"use client"

import { AgreementTable } from "@/components/agreements/AgreementTable"
import { DynamicForm } from "@/components/agreements/DynamicForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AgreementsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2
                    className="text-3xl font-bold tracking-tight"
                    data-tour-group="agreements"
                    data-tour-title="Gestão de Convênios"
                    data-tour-desc="Esta é a área principal onde você visualiza e gerencia todos os registros."
                    data-tour-order="1"
                >
                    Convênios
                </h2>
                <div
                    data-tour-group="agreements"
                    data-tour-title="Novoitem"
                    data-tour-desc="Clique aqui para adicionar um novo registro."
                    data-tour-order="2"
                >
                    <DynamicForm />
                </div>
            </div>

            <AgreementTable />
        </div>
    )
}

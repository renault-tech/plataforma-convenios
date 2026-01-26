"use client"

import { AgreementTable } from "@/components/agreements/AgreementTable"
import { DynamicForm } from "@/components/agreements/DynamicForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function AgreementsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Convênios</h2>
                <DynamicForm />
            </div>

            <AgreementTable />
        </div>
    )
}

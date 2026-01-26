"use client"

import { useState } from "react"
import { useForm } from "react-hook-form" // Assuming installed, or will fail if not
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog" // Need to create Dialog component or assume it exists? I didn't create it yet!
import { useStore } from "@/lib/store"

// I need to create Dialog component first if I want to use it here.
// But I'll write this file assuming Dialog exists, then I'll create Dialog immediately after.

export function DynamicForm() {
    const { columns, addAgreement } = useStore()
    const [open, setOpen] = useState(false)
    const { register, handleSubmit, reset } = useForm()

    const onSubmit = (data: any) => {
        // Basic ID generation
        const newAgreement = {
            id: Math.random().toString(36).substr(2, 9),
            ...data
        }
        // Convert numbers
        columns.forEach(col => {
            if (col.type === 'currency' || col.type === 'number') {
                newAgreement[col.id] = Number(newAgreement[col.id])
            }
        })

        addAgreement(newAgreement)
        setOpen(false)
        reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Convênio
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Convênio</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do convênio. Campos definidos nas configurações.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {columns.map((col) => (
                        <div key={col.id} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={col.id} className="text-right">
                                {col.label}
                            </Label>
                            <Input
                                id={col.id}
                                type={col.type === 'date' ? 'date' : col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                                step={col.type === 'currency' ? "0.01" : "1"}
                                className="col-span-3"
                                {...register(col.id, { required: col.required })}
                            />
                        </div>
                    ))}
                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

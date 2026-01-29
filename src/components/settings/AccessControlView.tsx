"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GroupsManager } from "./GroupsManager"
import { PoliciesManager } from "./PoliciesManager"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AccessControlViewProps {
    onBack: () => void
    autoOpenGroupCreate?: boolean
}

export function AccessControlView({ onBack, autoOpenGroupCreate = false }: AccessControlViewProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Controle de Acesso</h2>
                    <p className="text-muted-foreground">Gerencie grupos de usuários e critérios de permissão.</p>
                </div>
            </div>

            <Tabs defaultValue="groups" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="groups">Grupos de Usuários</TabsTrigger>
                    <TabsTrigger value="policies">Critérios de Acesso</TabsTrigger>
                </TabsList>

                <TabsContent value="groups" className="mt-6">
                    <GroupsManager autoOpenCreate={autoOpenGroupCreate} />
                </TabsContent>

                <TabsContent value="policies" className="mt-6">
                    <PoliciesManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}

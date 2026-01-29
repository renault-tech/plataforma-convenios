"use client"

import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceProvider } from "@/contexts/ServiceContext";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ServiceProvider>
            <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
                <Sidebar />
                <div className="flex flex-1 flex-col">
                    <Navbar />
                    <main className="flex-1 overflow-auto bg-slate-50/50 p-6">
                        {children}
                    </main>
                </div>
            </div>
        </ServiceProvider>
    );
}

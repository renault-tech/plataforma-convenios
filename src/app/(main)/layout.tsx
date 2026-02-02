"use client"

import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceProvider } from "@/contexts/ServiceContext";
import { GroupProvider } from "@/contexts/GroupContext";
import { ChatProvider } from "@/contexts/ChatContext";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ServiceProvider>
            <GroupProvider>
                <ChatProvider>
                    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
                        <Sidebar />
                        <div className="flex flex-1 flex-col min-w-0">
                            <Navbar />
                            <main className="flex-1 overflow-auto bg-slate-50/50 p-6">
                                {children}
                            </main>
                        </div>
                    </div>
                </ChatProvider>
            </GroupProvider>
        </ServiceProvider>
    );
}

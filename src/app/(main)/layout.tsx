"use client"

import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceProvider } from "@/contexts/ServiceContext";
import { GroupProvider } from "@/contexts/GroupContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { InboxProvider } from "@/contexts/InboxContext";
import { useStore } from "@/lib/store";
import { useDarkMode } from "@/hooks/useDarkMode";

function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { zoomLevel } = useStore()
    useDarkMode() // Sync dark mode with DOM
    return (
        <main
            className="flex-1 overflow-auto bg-slate-50/50 p-6 transition-all duration-200 ease-in-out"
            style={{
                // Using transform for zoom to avoid layout shifts if 'zoom' property is not desired, 
                // but 'zoom' is often requested for this effect. Browser support for 'zoom' is good for this use case.
                // However, user asked for "zoom" affecting screen. content.
                // using standard CSS transform scale might be safer for modern apps but 'zoom' CSS property is what users usually mean by "zoom".
                zoom: zoomLevel
            }}
        >
            {children}
        </main>
    )
}

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ServiceProvider>
            <GroupProvider>
                <ChatProvider>
                    <InboxProvider>
                        <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
                            <Sidebar />
                            <div className="flex flex-1 flex-col min-w-0">
                                <Navbar />
                                <MainContentWrapper>
                                    {children}
                                </MainContentWrapper>
                            </div>
                        </div>
                    </InboxProvider>
                </ChatProvider>
            </GroupProvider>
        </ServiceProvider>
    );
}

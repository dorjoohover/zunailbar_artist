import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import ModalContainer from "@/components/modal/modal.container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
// Mongoose bhgu bnshu
// import connect from '../lib/mongoose';
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZU Nailbar Admin",
  description: "Zu Nailbar salon Admin Panel",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const defaultOpen = store.get("sidebar_state")?.value === "false";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased custom-bg`}
      >
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <div
            className={cn(
              "relative size-full p-2 pl-0 min-h-screen overflow-x-auto flex-1 bg-primary"
            )}
          >
            <ScrollArea
              className={cn(
                "rounded-xl overflow-hidden size-full h-[calc(100dvh-1rem)] fixed top-0 left-0 ml-1",
                "bg-[#f8f9fb]"
              )}
            >
              <Toaster />
              {children}
            </ScrollArea>
          </div>
          <ModalContainer />
        </SidebarProvider>
      </body>
    </html>
  );
}

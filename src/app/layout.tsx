import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

import { AppSidebar } from "@/components/app-sidebar";
import Template from "./template";
import { cookies } from "next/headers";
import ModalContainer from "@/components/modal/modal.container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ScrollAreaWrapper from "@/shared/components/scrollAreaWrapper";
import { Suspense } from "react";
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
  title: "ZU Nailbar Artist",
  description: "Zu Nailbar salon Artist Panel",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const token = store.get("token")?.value;
  const defaultOpen = store.get("sidebar_state")?.value === "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen} >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased custom-bg`}
        >
          <AppSidebar />
          <div className={cn("relative size-full p-2 pl-0 min-h-screen overflow-x-auto flex-1 bg-primary")}>
            <Template token={token}>
              <ScrollArea
                className={cn(
                  "rounded-xl overflow-hidden size-full h-[calc(100dvh-1rem)] fixed top-0 left-0 ml-1",
                  "bg-[#f8f9fb]",
                  // store.get("sidebar_state")?.value == "false" ? "bg-red-500" : ''
                )}
              >
                {/* <Navbar /> */}
                <Toaster />
                {children}

                {/* <Footer /> */}
              </ScrollArea>
            </Template>
          </div>
          <ModalContainer />
        </body>
      </html>
    </SidebarProvider>
  );
}

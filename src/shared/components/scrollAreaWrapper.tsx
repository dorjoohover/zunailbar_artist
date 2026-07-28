'use client'

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function ScrollAreaWrapper({ children }: Props) {
  const pathname = usePathname();

  return (
    <ScrollArea className={cn("rounded-xl overflow-hidden size-full h-[calc(100vh-1rem)] fixed top-0 left-0 ml-1", pathname === "/login" ? "custom-bg bg-cover bg-no-repeat" : "bg-[#f8f9fb]")}>
      {/* <Navbar /> */}
      {children}
      {/* <Footer /> */}
    </ScrollArea>
  );
}

"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE } from "@/lib/enum";
import { API } from "@/utils/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "./loading";

export default function Template({
  children,
  token,
}: {
  children: React.ReactNode;
  token?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const deleteCookie = async () => {
    try {
      if (pathname != "/login") {
        await fetch("/api/logout").then((d) => router.push("/login"));
      }
    } catch (error) {
      console.log(error);
    }
  };
  const me = async () => {
    if (token) {
      try {
        const res = await fetch(`${API["user"]}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        const data = await res.json();
        console.log( data.payload.user.role)
        if (!res.ok) {
          // deleteCookie();
        } else {
          data.payload.user.role != ROLE.MANAGER ? deleteCookie() : null;
        }
      } catch (error) {
        console.log("error", error);
        // deleteCookie();
      }
    }
  };

  useEffect(() => {
    me();
  }, [token]);
  
  if(pathname != '/orders') router.push('/orders')
  return (
    <div className="w-full max-w-screen">
      {pathname != "/login" && <SidebarTrigger />}

      {children}
    </div>
  );
}

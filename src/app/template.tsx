"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE } from "@/lib/enum";
import { API } from "@/utils/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

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
      console.error(error);
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
        if (!res.ok) {
          // deleteCookie();
        } else {
          if (data.payload.user.role != ROLE.MANAGER) {
            void deleteCookie();
          }
        }
      } catch (error) {
        console.error("error", error);
        // deleteCookie();
      }
    }
  };

  useEffect(() => {
    void me();
  }, [token]);

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/orders") {
      router.replace("/orders");
    }
  }, [pathname, router]);

  return (
    <div className="w-full max-w-screen">
      {pathname != "/login" && <SidebarTrigger />}

      {children}
    </div>
  );
}

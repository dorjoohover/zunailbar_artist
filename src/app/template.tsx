"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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

  const handleLogout = async () => {
    try {
      await fetch("/api/logout");
    } catch (error) {
      console.error(error);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="w-full max-w-screen">
      {pathname != "/login" && (
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <SidebarTrigger />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-rose-600 border-rose-300 hover:bg-rose-50"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Гарах
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}

"use client";
import { ROLE } from "@/lib/enum";
import { API } from "@/utils/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ALLOWED_PATHS = ["/orders", "/order_logs"];

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const deleteCookie = async () => {
    try {
      if (pathname !== "/login") {
        await fetch("/api/logout").then(() => router.push("/login"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const me = async (token: string) => {
    try {
      const res = await fetch(`${API["user"]}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.payload.user.role !== ROLE.MANAGER) {
        void deleteCookie();
      }
    } catch (error) {
      console.error("error", error);
    }
  };

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")?.[1];
    if (token) void me(token);
  }, []);

  useEffect(() => {
    if (pathname !== "/login" && !ALLOWED_PATHS.includes(pathname)) {
      router.replace("/orders");
    }
  }, [pathname, router]);

  return (
    <div className="w-full max-w-screen">
      {children}
    </div>
  );
}

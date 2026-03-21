"use client";

import DynamicHeader from "@/components/dynamicHeader";
import EChart from "./components/eChart";
import EChartPie from "./components/eChartPie";
import { ClipboardCheck, Milk, UsersRound } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  return (
    <section>
      <DynamicHeader />
      <div className="admin-container space-y-0">
        <div className="space-y-4 py-4 border-b">
          <h1 className="font-semibold">Aдмин ерөнхий хянах самбар</h1>
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={"/employees"}
              className="w-full text-primary hover:text-white space-x-4 bg-white flex justify-between border border-slate-200 rounded-2xl h-full p-6 cursor-pointer hover:bg-primary duration-150"
            >
              <div className="size-14 bg-orange-100 rounded-xl flex-center aspect-square">
                <ClipboardCheck className="size-5 text-primary" />
              </div>
              <div className="flex flex-col size-full justify-between text-left">
                <h1 className="font-medium text-sm flex items-center gap-2">
                  Нийт захиалга
                </h1>
                <h3 className="text-2xl font-bold">number</h3>
              </div>
            </Link>
            <Link
              href={"/users"}
              className="w-full text-primary hover:text-white space-x-4 bg-white flex justify-between border border-slate-200 rounded-2xl h-full p-6 cursor-pointer hover:bg-primary duration-150"
            >
              <div className="size-14 bg-blue-100 rounded-xl flex-center aspect-square">
                <UsersRound className="size-5 text-primary" />
              </div>
              <div className="flex flex-col size-full justify-between text-left">
                <h1 className="font-medium text-sm flex items-center gap-2">
                  Нийт хэрэглэгч
                </h1>
                <h3 className="text-2xl font-bold">number</h3>
              </div>
            </Link>
            <Link
              href={"/products"}
              className="w-full text-primary hover:text-white space-x-4 bg-white flex justify-between border border-slate-200 rounded-2xl h-full p-6 cursor-pointer hover:bg-primary duration-150"
            >
              <div className="size-14 bg-rose-100 rounded-xl flex-center aspect-square">
                <Milk className="size-5 text-primary" />
              </div>
              <div className="flex flex-col size-full justify-between text-left">
                <h1 className="font-medium text-sm flex items-center gap-2">
                  Нийт бүтээгдэхүүн
                </h1>
                <h3 className="text-2xl font-bold">number</h3>
              </div>
            </Link>
            <Link
              href={"/employees"}
              className="w-full text-primary hover:text-white space-x-4 bg-white flex justify-between border border-slate-200 rounded-2xl h-full p-6 cursor-pointer hover:bg-primary duration-150"
            >
              <div className="size-14 bg-green-100 rounded-xl flex-center aspect-square">
                {/* <Money className="size-5 text-primary" /> */}
                <span className="text-2xl text-primary">₮</span>
              </div>
              <div className="flex flex-col size-full justify-between text-left">
                <h1 className="font-medium text-sm flex items-center gap-2">
                  Нийт орлого
                </h1>
                <h3 className="text-2xl font-bold">money</h3>
              </div>
            </Link>
          </div>
        </div>
        <div className="space-y-4 py-4 border-b">
          <h1 className="font-semibold">График үзүүлэлтүүд</h1>
          <div className="double-col">
            <div className="bg-white rounded-2xl border border-slate-200">
              <EChart />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200">
              <EChartPie />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

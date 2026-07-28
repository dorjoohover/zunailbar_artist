"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import ContainerHeader from "@/components/containerHeader";
import DynamicHeader from "@/components/dynamicHeader";

const chartData = [
  { month: "January", manicure: 186, pedicure: 80 },
  { month: "February", manicure: 305, pedicure: 200 },
  { month: "March", manicure: 237, pedicure: 120 },
  { month: "April", manicure: 73, pedicure: 190 },
  { month: "May", manicure: 209, pedicure: 130 },
  { month: "June", manicure: 214, pedicure: 140 },
];

const chartConfig = {
  manicure: {
    label: "Manicure",
    color: "#2563eb",
  },
  pedicure: {
    label: "Pedicure",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

export const DashboardPage = () => {
  return (
    <section>
      <DynamicHeader />
      {/* <div className="admin-container grid grid-cols-2 gap-x-8">
        <div className="p-8 py-6 rounded-lg bg-white shadow-md space-y-8">
          <div className="space-y-1">
            <h1 className="font-semibold text-lg">Жишээ чарт</h1>
            <p className="text-sm text-slate-600">Lorem ipsum dolor sit.</p>
          </div>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="manicure" fill="oklch(70.4% 0.04 256.788)" radius={4} />
              <Bar dataKey="pedicure" fill="oklch(37.2% 0.044 257.287)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </div> */}
    </section>
  );
};

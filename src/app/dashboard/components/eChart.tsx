"use client";

import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function EChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    chart.setOption({
      title: {
        text: "Жишээ",
        left: "left"
      },
      tooltip: {},
      xAxis: {
        data: ["A", "B", "C", "D", "E", "F"],
      },
      yAxis: {},
      series: [
        {
          name: "Sales",
          type: "bar",
          data: [5, 20, 36, 10, 10, 20],
        },
      ],
    });

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      chart.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  return <div ref={chartRef} className="w-full h-[400px] p-4" />;
}

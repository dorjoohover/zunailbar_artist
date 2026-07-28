import { ChevronRight, Minus } from "lucide-react";
import React from "react";

interface ContainerHeaderProps {
  trigger?: string;
  title: string;
  count?: number;
}

export default function ContainerHeader({
  trigger,
  title,
  count ,
}: ContainerHeaderProps) {
  return (
    <div className="sticky top-0 left-0 right-0 z-40 flex items-center h-16 px-10 pr-4 space-x-2 bg-white border lg:pr-10 border-slate-100 shadow-light lg:space-x-5">
      <div className="flex items-center text-sm font-semibold lg:text-lg gap-x-2">
        <span className="opacity-80">{trigger}</span>

        {title && (
          <>
            <ChevronRight className="size-4 lg:size-5" /> <span>{title}</span>
          </>
        )}
      </div>

      <div className="flex items-center space-x-2 lg:space-x-5">
        <span>-</span>
        <span className="h-6 text-xs font-bold border rounded-full w-11 lg:w-14 lg:h-8 flex-center lg:text-base">
          {count ?? 0}
        </span>
      </div>
    </div>
  );
}

import { LoaderCircle } from "lucide-react";

export default function Loading() {
  // Or a custom loading skeleton component
  return (
    <div className="admin-container">
      <div className="h-[calc(100vh-4rem)] w-full flex flex-col justify-center items-center gap-y-2 text-slate-700">
          <LoaderCircle className="animate-spin size-8" />
          <p className="text-xs font-semibold">Уншиж байна</p>
      </div>
    </div>
  );
}

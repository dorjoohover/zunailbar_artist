import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { ControllerRenderProps, type FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

export const PasswordField = <T extends FieldValues>({
  props,
  view = false,
  label = "Password",
  className,
}: {
  view?: boolean;
  className?: string;
  label?: string;
  props: ControllerRenderProps<T>;
}) => {
  const [isView, setIsView] = useState(view);
  return (
    <>
      {label && <Label htmlFor="password">{label}</Label>}
      <div className="relative h-10 space-y-1">
        <Input
          {...props}
          id="password"
          type={isView ? "text" : "password"}
          placeholder="••••••••"
          className={cn("pr-10 bg-white h-full", className)}
        />

        {/* Toggle Icon */}
        <div className="absolute right-3 top-[35%] cursor-pointer text-gray-500 h-full">
          {isView ? (
            <Eye onClick={() => setIsView(false)} className="size-4.5" />
          ) : (
            <EyeOff onClick={() => setIsView(true)} className="size-4.5" />
          )}
        </div>
      </div>
    </>
  );
};

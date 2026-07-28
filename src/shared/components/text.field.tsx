import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { ControllerRenderProps, type FieldValues } from "react-hook-form";
import { mobileFormatter, money } from "@/lib/functions";
import { cn } from "@/lib/utils";
import { INPUT_TYPE } from "@/lib/enum";
export const TextField = <T extends FieldValues>({
  props,
  label,
  pl,
  type = INPUT_TYPE.TEXT,
  symbol = "₮",
  className = "bg-white h-10",
  max,
  min,
  disabled = false,
  pattern,
}: {
  pl?: string;
  pattern?: string;
  symbol?: string;
  type?: INPUT_TYPE; // "money" бол форматлана
  label?: string;
  disabled?: boolean;
  max?: string;
  min?: string;
  className?: string;
  props: ControllerRenderProps<T>;
}) => {
  const id = `${label}_${Math.round(Math.random() * 10)}`;
  const [display, setDisplay] = useState(
    type === "money"
      ? money(String(props.value ?? ""))
      : String(props.value ?? ""),
  );
  useEffect(() => {
    if (type === "money") {
      setDisplay(money(String(props.value ?? "0")));
    } else {
      props.value == undefined || props.value == null
        ? setDisplay("")
        : setDisplay(props.value.toString());
    }
  }, [props.value, type]);

  if (type == "date") {
    return (
      <div className="relative space-y-2">
        {label && (
          <Label htmlFor={id} className="truncate">
            {label}
          </Label>
        )}
        <Input
          {...props}
          type={type}
          max={max}
          min={min}
          disabled={disabled}
          id={id}
          placeholder={pl}
          className={cn("h-10", className)}
        />
      </div>
    );
  }
  if (type !== "money") {
    return (
      <div className="relative space-y-2">
        {label && (
          <Label htmlFor={id} className="truncate">
            {label}
          </Label>
        )}
        <Input
          pattern={pattern}
          {...props}
          disabled={disabled}
          type={type}
          onChange={(e) => {
            const raw = e.target.value;
            if (type && type == "number") {
              let value = parseInt(raw.replace(/[^\d]/g, ""));
              const v = isNaN(value) ? "0" : value.toString();
              props.onChange(v);
              setDisplay(v);
            } else {
              props.onChange(raw);
              setDisplay(raw);
            }
          }}
          value={display}
          id={id}
          placeholder={pl}
          className={cn("h-10", className)}
        />
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative w-full">
        <Input
          id={id}
          placeholder={pl}
          className={className}
          type="text"
          disabled={disabled}
          inputMode="decimal"
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, ""); // зөвхөн тоо
            props.onChange(raw); // form-д тоо хадгална
            setDisplay(raw); // фокус дотор raw тоо харагдана
          }}
          onBlur={() => setDisplay(money(String(props.value ?? "")))} // blur үед money формат
          onFocus={() => setDisplay(String(props.value ?? ""))} // focus үед raw утга
        />
        {type === "money" && (
          <span className="absolute top-[50%] -translate-y-[50%] right-3 flex items-center text-primary pointer-events-none">
            {symbol}
          </span>
        )}
      </div>
    </div>
  );
};

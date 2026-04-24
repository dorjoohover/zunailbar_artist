"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { COLOR_HEX, ColorName } from "@/lib/colors";

type InputType = {
  value: string | number;
  label: string;
  color?: string;
};

const normalizeSearchValue = (value: string) => value.toLowerCase();

export function ComboBox<T extends FieldValues>({
  items,
  search,
  name = "Сонгох",
  className = "w-full",
  pl,
  props,
}: {
  items: InputType[];
  name?: string;
  search?: (v: string) => void;
  className?: string;
  pl?: string;
  value?: string | number;
  label?: string;
  color?: string;
  props: ControllerRenderProps<T>;
}) {
  const [open, setOpen] = React.useState(false);
  const [localItems, setLocalItems] = React.useState(items);
  const { onChange, value: propValue } = props;

  // selectedValue-г string болгож state-д хадгалах
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
    propValue !== undefined ? propValue?.toString() : undefined,
  );

  // prop value өөрчлөгдөхөд state-ийг синхрончлох
  React.useEffect(() => {
    setSelectedValue(
      propValue !== undefined ? propValue?.toString() : undefined,
    );
  }, [propValue]);

  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && search) search("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "min-w-32 lg:min-h-10 justify-between bg-white text-xs w-full lg:text-sm",
            className,
          )}
        >
          {selectedValue
            ? (items.find((i) => i.value.toString() === selectedValue)?.label ??
              name)
            : name}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className={cn(className, "p-0 bg-white min-w-48")}
      >
        <Command filter={() => 1}>
          {search && (
            <CommandInput
              placeholder={pl}
              onValueChange={(value) => search(normalizeSearchValue(value))}
              className="h-9"
            />
          )}
          <CommandList className="max-h-60 min-w-60">
            <CommandEmpty>Хайлт олдсонгүй</CommandEmpty>
            <CommandGroup>
              {items.map((framework) => {
                const valueStr = framework.value.toString();
                return (
                  <CommandItem
                    key={framework.value}
                    value={`${framework.label}__${valueStr}`}
                    onSelect={(currentValue) => {
                      const val = currentValue?.split("__")[1] ?? currentValue;
                      if (val === selectedValue) return;
                      setSelectedValue(val); // state update
                      onChange(val); // parent update
                      setOpen(false);
                    }}
                  >
                    {framework.color && (
                      <div
                        className="size-4 rounded"
                        style={{
                          backgroundColor: framework.color
                            ? COLOR_HEX[framework.color as ColorName]
                            : "",
                        }}
                      />
                    )}
                    {framework.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedValue === valueStr
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

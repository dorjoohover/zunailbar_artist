"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2Icon, Plus } from "lucide-react";

import { ReactNode, useRef } from "react";

export const Modal = ({
  // Button text
  name,
  // Modal text
  title = name,
  btn = <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />,
  description,
  children,
  submit,
  submitTxt = "Хадгалах",
  open,
  setOpen,
  loading,
  w = "md",
  maw = "sm",
  size,
  reset,
}: {
  name?: string;
  maw?: string;
  title?: string;
  description?: string;
  submitTxt?: string;
  w?: string;
  size?: string;
  children?: ReactNode;
  btn?: ReactNode;
  submit?: () => void;
  reset?: () => void;
  open: boolean;
  loading?: boolean;
  setOpen: (v: boolean) => void;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submit) {
      submit();
    }
  };
  const mawClasses: Record<string, string> = {
    xs: "max-w-[calc(theme(maxWidth.xs)-1rem)]",
    sm: "max-w-[calc(theme(maxWidth.sm)-1rem)]",
    md: "max-w-[calc(theme(maxWidth.md)-1rem)]",
    lg: "max-w-[calc(theme(maxWidth.lg)-1rem)]",
    xl: "max-w-[calc(theme(maxWidth.xl)-1rem)]",
    "2xl": "max-w-[calc(theme(maxWidth.2xl)-1rem)]",
    "3xl": "max-w-[calc(theme(maxWidth.4xl)-1rem)]",
    "4xl": "max-w-[calc(theme(maxWidth.4xl)-1rem)]",
    "5xl": "max-w-[calc(theme(maxWidth.5xl)-1rem)]",
    "6xl": "max-w-[calc(theme(maxWidth.6xl)-1rem)]",
    "7xl": "max-w-[calc(theme(maxWidth.7xl)-1rem)]",
  };

  const dialogContentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)} modal={true}>
      {name && name !== "" && (
        <DialogTrigger asChild>
          <Button
            variant="purple"
            className="cursor-pointer uppercase text-xs font-bold ml-1"
          >
            <Plus strokeWidth={2.5} />
            <span className="hidden md:block">{name}</span>
          </Button>
        </DialogTrigger>
      )}
      {/* <DialogContent className={`max-w-${maw} lg:max-w-${w}`}> */}
      <DialogContent
        ref={dialogContentRef}
        className={cn(mawClasses[maw], "max-h-[90vh]")}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="p-4">{children}</ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="bg-white min-w-24">
              Цуцлах
            </Button>
          </DialogClose>
          {submit && (
            <Button
              variant={"purple"}
              loading={loading}
              onClick={(e) => handleSubmit(e)}
              className="min-w-24"
            >
              {/* Button dotroo loading ni ajillaad end bicsen ni hereggumshig bn  */}
              {/* {loading && btn} */}
              {/* {loading ? "Please wait..." : submitTxt} */}
              {submitTxt}
            </Button>
          )}
          {/* {reset && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                reset();
              }}
            >
              reset
            </Button>
          )} */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

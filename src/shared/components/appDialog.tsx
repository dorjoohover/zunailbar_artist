import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppDialogProps = {
  trigger: React.ReactNode; // dialog-г нээх товч
  title?: string;           // dialog-ын толгой
  description?: string;     // dialog-ын тайлбар
  confirmText?: string;     // баталгаажуулах товч дээр гаргах текст
  onConfirm?: () => void;   // баталгаажуулах үйлдэл
  className?: string;       // dialog-ийн custom class
  maw?: string;             // dialog max width
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

export default function AppDialog({
  trigger,
  title = "Баталгаажуулах уу?",
  description,
  confirmText = "Тийм",
  onConfirm,
  className,
  maw = "lg",
}: AppDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className={cn(mawClasses[maw], className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Цуцлах</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm}>{confirmText}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}



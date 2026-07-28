import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ReactNode } from "react";
import { Control, ControllerRenderProps, FieldValues, Path } from "react-hook-form";

export const FormItems = <T extends FieldValues>({ control, name, label, className, message = false, children }: { name: Path<T>; label?: string; message?: boolean; className?: string; control: Control<T, any, T>; children: (field: ControllerRenderProps<T>,) => ReactNode }) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>{children(field)}</FormControl>
          {/* {message && <FormMessage />} */}
        </FormItem>
      )}
    />
  );
};

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDate } from "@/lib/functions";
import { TableActionButtons } from "@/components/tableActionButtons";
import { IFeature } from "@/models/home.model";
import { icons } from "@/lib/constants";

export function getColumns(
  onEdit: (product: IFeature, index: number) => void,
  remove: (index: number, isHome: boolean) => Promise<boolean>
): ColumnDef<IFeature>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },

    {
      accessorKey: "title",
      header: "Гарчиг",
    },
    {
      accessorKey: "index",
      header: "Дараалал",
    },
    {
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }) => {
        const Icon = icons?.[row.getValue("icon") as string];
        return <Icon size={18} />;
      },
    },
    {
      accessorKey: "description",
      header: "Тайлбар",
    },

    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        // Bagasgasan
        <TableActionButtons
          rowData={row.original}
          onEdit={(data) => onEdit(data, 1)}
          onRemove={(data) => remove(row.index, false)}
        ></TableActionButtons>
      ),
    },
  ];
}

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseDate } from "@/lib/functions";
import { ISalaryLog } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import { SalaryLogValues } from "@/lib/constants";
import { SalaryLogStatus } from "@/lib/enum";
import { cn } from "@/lib/utils";

export function getColumns(
  onEdit: (product: ISalaryLog) => void,
  remove: (index: number) => Promise<boolean>,
): ColumnDef<ISalaryLog>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "user_name",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Хоч <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },

    {
      accessorKey: "salary_status",
      header: "Статус",
      cell: ({ row }) => {
        const status =
          SalaryLogValues[
            row.getValue<number>("salary_status") as SalaryLogStatus
          ];
        return (
          <span className={cn(status?.color, "")}>{status?.name || "-"}</span>
        );
      },
    },
    {
      accessorKey: "order_count",
      header: "Захиалгын тоо",
      cell: ({ row }) => {
        const res = row.getValue<string>("order_count");
        return <span>{res}</span>;
      },
    },
    {
      accessorKey: "amount",
      header: "Төлөх дүн",
      cell: ({ row }) => {
        const res = row.getValue<string>("amount");
        return <span>{res}</span>;
      },
    },
    {
      accessorKey: "date",
      header: "Огноо",
      cell: ({ row }) => {
        const value = row.getValue("date") as string | Date;
        const date = parseDate(
          value instanceof Date
            ? value
            : new Date(value.includes("T") ? value : `${value}T00:00:00`),
          false,
        );
        return date;
      },
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        <TableActionButtons
          rowData={row.original}
          onEdit={(data) => onEdit(data)}
          onRemove={(data) => remove(row.index)}
        ></TableActionButtons>
      ),
    },
  ];
}

// <div className="flex items-center gap-2">
//   <TooltipWrapper tooltip="Засварлах">
//     <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
//       <Pencil className="w-4 h-4" />
//     </Button>
//   </TooltipWrapper>

//   <AppAlertDialog
//     title="Итгэлтэй байна уу?"
//     description="Бүр устгана шүү."
//     onConfirm={async () => {
//       const res = await remove(row.index);
//       console.log(res);
//       toast("Амжилттай устгалаа!" + res, {});
//     }}
//     trigger={
//       <Button variant="ghost" size="icon">
//         <TooltipWrapper tooltip="Статус солих">
//           <Trash2 className="w-4 h-4 text-red-500" />
//         </TooltipWrapper>
//       </Button>
//     }
//   />
// </div>

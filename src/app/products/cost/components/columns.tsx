import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { money, parseDate } from "@/lib/functions";
import TooltipWrapper from "@/components/tooltipWrapper";
import { TableActionButtons } from "@/components/tableActionButtons";
import { ICost } from "@/models";
import { CostStatus } from "@/lib/enum";
import { getValuesCostStatus } from "@/lib/constants";

export function getColumns(onEdit: (product: ICost) => void, remove: (index: number) => Promise<boolean>): ColumnDef<ICost>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "product_name",
      header: ({ column }) => (
        <Button variant="table_header" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-bold">
          Бүтээгдэхүүн <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },
    {
      accessorKey: "branch_name",
      header: "Салбар",
    },

    {
      accessorKey: "price",
      header: "Үнэ",
      cell: ({ row }) => money(row.getValue("price"), "₮") ?? "-",
    },
    {
      accessorKey: "paid_amount",
      header: "Төлсөн",
      cell: ({ row }) => money(row.getValue("paid_amount") ?? 0, "₮") ?? "-",
    },
    {
      accessorKey: "cost_status",
      header: "Статус",
      cell: ({ row }) => {
        const status = getValuesCostStatus[row.getValue<number>("cost_status") as CostStatus];
        return <span className={status.color}>{status.name}</span>;
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="table_header" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-bold">
          Огноо <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = parseDate(new Date(row.getValue("date")), false);
        return date;
      },
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = new Date(rowA.getValue(columnId)).getTime();
        const dateB = new Date(rowB.getValue(columnId)).getTime();
        return dateA - dateB;
      },
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        // Bagasgasan
        <TableActionButtons rowData={row.original} onEdit={(data) => onEdit(data)} onRemove={(data) => remove(row.index)}></TableActionButtons>
      ),
    },
  ];
}

// {
//   <div className="flex items-center gap-2">
//     <TooltipWrapper tooltip="Засварлах">
//       <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
//         <Pencil className="w-4 h-4" />
//       </Button>
//     </TooltipWrapper>

//     <AppAlertDialog
//       title="Итгэлтэй байна уу?"
//       description="Бүр устгана шүү."
//       onConfirm={async () => {
//         const res = await remove(row.index);
//         console.log(res);
//         toast("Амжилттай устгалаа!" + res, {});
//       }}
//       trigger={
//         <TooltipWrapper tooltip="Устгах">
//           <Button variant="ghost" size="icon">
//             <Trash2 className="w-4 h-4 text-red-500" />
//           </Button>
//         </TooltipWrapper>
//       }
//     />
//   </div>;
// }

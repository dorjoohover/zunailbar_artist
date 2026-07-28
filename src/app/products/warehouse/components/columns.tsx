import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { parseDate } from "@/lib/functions";
import { ProductLogStatus, ProductTransactionStatus } from "@/lib/enum";
import { IProductLog, IProductWarehouse } from "@/models";
import TooltipWrapper from "@/components/tooltipWrapper";
import { TableActionButtons } from "@/components/tableActionButtons";

export function getColumns(onEdit: (product: IProductWarehouse) => void, remove: (index: number) => Promise<boolean>): ColumnDef<IProductWarehouse>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "warehouse_name",
      header: ({ column }) => (
        <Button variant="table_header" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-bold">
          Агуулах <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
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
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button variant="table_header" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-bold">
          Тоо ширхэг <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },

    {
      accessorKey: "date",
      header: "Огноо",
      cell: ({ row }) => {
        const date = parseDate(new Date(row.getValue("date")), false);
        return date;
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="table_header" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-bold">
          Үүсгэсэн <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = parseDate(new Date(row.getValue("created_at")), false);
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
      cell: ({ row }) => <TableActionButtons rowData={row.original} onEdit={(data) => onEdit(data)} onRemove={(data) => remove(row.index)}></TableActionButtons>,
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

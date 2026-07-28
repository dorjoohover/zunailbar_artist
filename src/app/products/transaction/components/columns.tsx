import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { parseDate } from "@/lib/functions";
import { IProductTransaction } from "@/models";
import { ProductTransactionStatus } from "@/lib/enum";
import { TableActionButtons } from "@/components/tableActionButtons";
import { getValuesProductTransactionStatus } from "@/lib/constants";

export function getColumns(
  onEdit: (product: IProductTransaction) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IProductTransaction>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "branch_name",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Салбар <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Хоч",
    },
    {
      accessorKey: "product_name",
      header: "Бүтээгдэхүүн",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Тоо ширхэг <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },
    {
      accessorKey: "product_transaction_status",
      header: "Төлөв",
      cell: ({ row }) => {
        const status =
          getValuesProductTransactionStatus[
            row.getValue<number>(
              "product_transaction_status"
            ) as ProductTransactionStatus
          ];
        return <span className={status.color}>{status.name}</span>;
      },
    },
    // {
    //   accessorKey: "price",
    //   header: ({ column }) => (
    //     <Button
    //       variant="table_header"
    //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //       className="font-bold"
    //     >
    //       Price <ArrowUpDown className="w-4 h-4 ml-2" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => `${row.getValue("price")}₮`,
    // },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
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
      cell: ({ row }) => (
        // Bagasgasan
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
//   <Button
//     variant="table_header"
//     size="icon"
//     onClick={() => onEdit(row.original)}
//   >
//     <Pencil className="w-4 h-4" />
//   </Button>

//   <AppAlertDialog
//     title="Итгэлтэй байна уу?"
//     description="Бүр устгана шүү."
//     onConfirm={async () => {
//       const res = await remove(row.index);
//       console.log(res);
//       toast("Амжилттай устгалаа!" + res, {});
//     }}
//     trigger={
//       <Button variant="table_header" size="icon">
//         <Trash2 className="w-4 h-4 text-red-500" />
//       </Button>
//     }
//   />
// </div>

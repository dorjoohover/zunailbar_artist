import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { money, parseDate } from "@/lib/functions";
import { IDiscount, IService } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import { getValueDiscount } from "@/lib/constants";
import { DISCOUNT } from "@/lib/enum";

export function getColumns(
  onEdit: (product: IDiscount) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IDiscount>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Нэр <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },

    {
      accessorKey: "type",
      header: "Төрөл",
      cell: ({ row }) => {
        const status =
          getValueDiscount[row.getValue<number>("type") as DISCOUNT];
        return <span>{status}</span>;
      },
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Дүн <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const type = row.getValue<number>("type") as DISCOUNT;
        const value = row.getValue("value");
        return type == DISCOUNT.Price
          ? money((value ?? 0).toString(), "₮")
          : `${value}%`;
      },
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Эхлэх <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = parseDate(new Date(row.getValue("start_date")), false);
        return date;
      },
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = new Date(rowA.getValue(columnId)).getTime();
        const dateB = new Date(rowB.getValue(columnId)).getTime();
        return dateA - dateB;
      },
    },
    {
      accessorKey: "end_date",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Дуусах <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = parseDate(new Date(row.getValue("end_date")), false);
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
        // <div className="flex items-center gap-2">
        //   <Button
        //     variant="ghost"
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
        //       <Button variant="ghost" size="icon">
        //         <Trash2 className="w-4 h-4 text-red-500" />
        //       </Button>
        //     }
        //   />
        // </div>
      ),
    },
  ];
}

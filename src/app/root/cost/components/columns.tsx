import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDate } from "@/lib/functions";
import { TableActionButtons } from "@/components/tableActionButtons";

export function getColumns(
  onEdit: (product: IProduct) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IProduct>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
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
    // {
    //   accessorKey: "ref",
    //   header: "Reference",
    // },
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

    // {
    //   accessorKey: "color",
    //   header: "Color",
    //   cell: ({ row }) => row.getValue("color") ?? "-",
    // },
    // {
    //   accessorKey: "size",
    //   header: "Size",
    //   cell: ({ row }) => row.getValue("size") ?? "-",
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

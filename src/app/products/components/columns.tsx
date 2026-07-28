import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { checkEmpty } from "@/lib/functions";
import { TableActionButtons } from "@/components/tableActionButtons";

export function getColumns(onEdit: (product: IProduct) => void, remove: (index: number) => Promise<boolean>): ColumnDef<IProduct>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },

    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="table_header" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-bold">
          Бүтээгдэхүүн <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-bold text-primary">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "brand_name",
      header: "Бренд",
      cell: ({ row }) => <>{checkEmpty(row.getValue("brand_name"))}</>,
    },
    {
      accessorKey: "category_name",
      header: "Англилал",
      cell: ({ row }) => checkEmpty(row.getValue("category_name")),
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

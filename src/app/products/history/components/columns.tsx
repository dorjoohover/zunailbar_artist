import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { money, parseDate } from "@/lib/functions";
import { ProductLogStatus, ProductTransactionStatus } from "@/lib/enum";
import { IProductLog } from "@/models";
import TooltipWrapper from "@/components/tooltipWrapper";
import { TableActionButtons } from "@/components/tableActionButtons";
import { getEnumValues, getValuesProductLogStatus } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function getColumns(
  onEdit: (product: IProductLog) => void,
  remove: (index: number) => Promise<boolean>,
  setStatus: (index: number, status: ProductLogStatus) => void
): ColumnDef<IProductLog>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "product_name",
      header: "Бүтээгдэхүүн",
    },
    {
      accessorKey: "currency",
      header: "",
      cell: ({ row }) => "",
    },
    {
      accessorKey: "price",
      header: "Үнэ",

      cell: ({ row }) =>
        money(
          row.getValue("price"),
          (row.getValue("currency") as string)?.toUpperCase()
        ),
    },
    {
      accessorKey: "unit_price",
      header: "Нэгжийн үнэ",

      cell: ({ row }) => money(row.getValue("unit_price"), "₮"),
    },
    {
      accessorKey: "quantity",
      header: "Тоо ширхэг",
    },
    {
      accessorKey: "total_amount",
      header: "Нийт үнэ",
      cell: ({ row }) => money(row.getValue("total_amount"), "₮"),
    },

    {
      accessorKey: "product_log_status",
      header: "Статус",
      cell: ({ row }) => {
        const status =
          getValuesProductLogStatus[
            row.getValue<number>("product_log_status") as ProductLogStatus
          ];
        return <span className={status.color}>{status.name}</span>;
      },
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
      header: "Үүсгэсэн",
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
        <TableActionButtons
          rowData={row.original}
          onEdit={(data) => onEdit(data)}
          onRemove={(d) => remove(row.index)}
        >
          <DropdownMenu>
            <TooltipWrapper tooltip="Статус солих">
              <DropdownMenuTrigger asChild>
                {/* <div className="items-center justify-center size-9 flex-center hover:bg-gray-100 rounded-sm hover:text-slate-800 duration-150 cursor-pointer">
                  <UserRoundCog className="size-4" />
                </div> */}
                <Button variant="ghost" size="icon">
                  <UserRoundCog className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipWrapper>

            <DropdownMenuContent>
              <DropdownMenuLabel>Статус солих</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {getEnumValues(ProductLogStatus).map((item, i) => {
                const status = getValuesProductLogStatus[item];
                return (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => setStatus(row.index, item)}
                  >
                    <span className={cn(status.color)}>{status.name}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableActionButtons>
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

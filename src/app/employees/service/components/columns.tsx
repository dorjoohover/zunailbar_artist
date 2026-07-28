import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { money, parseDate } from "@/lib/functions";
import { IProductTransaction, IUserService } from "@/models";
import { ProductTransactionStatus } from "@/lib/enum";
import { IService } from "@/models/service.model";
import TooltipWrapper from "@/components/tooltipWrapper";
import { TableActionButtons } from "@/components/tableActionButtons";
import { EmployeeUserServicePage } from ".";

// Generate service badge color
function stringToNiceColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 10) - hash);
  }

  // 0–360 хүртэл hue гаргана
  const hue = Math.abs(hash) % 360;

  // гоё өнгө гаргахын тулд saturation / lightness тогтмол байлгана
  return `hsl(${hue}, 70%, 60%)`;
}

export function getColumns(
  onEdit: (product: IUserService) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IUserService>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "user_name",
      header: ({ column }) => "Хоч",
      cell: ({ row }) => (
        <div className="font-bold text-brand-blue">
          {row.getValue("user_name")}
        </div>
      ),
    },
    {
      accessorKey: "service_name",
      header: ({ column }) => "Үйлчилгээ",

      // Badge nemsen
      cell: ({ row }) => {
        const service = row.getValue("service_name") as string;
        const color = stringToNiceColor(service);
        return (
          <div className="gap-2 flex">
            {service.split(",").map((s, k) => (
              <span
                className="badge "
                style={{
                  backgroundColor: color,
                }}
                key={k}
              >
                {s}
              </span>
            ))}
          </div>
        );
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
        //
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
//       <TooltipWrapper tooltip="Устгах">
//         <Button variant="ghost" size="icon">
//           <Trash2 className="w-4 h-4 text-red-500" />
//         </Button>
//       </TooltipWrapper>
//     }
//   />
// </div>

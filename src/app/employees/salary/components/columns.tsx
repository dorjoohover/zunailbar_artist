import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IUserService } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import { add15Days, parseDate } from "@/lib/functions";
import { SalaryStatus } from "@/lib/enum";
import { SalaryStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

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
  remove: (index: number) => Promise<boolean>,
): ColumnDef<IUserService>[] {
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
      cell: ({ row }) => (
        <div className="font-bold text-brand-blue">
          {row.getValue("user_name")}
        </div>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => <span>Цалин олгох өдөр</span>,
      cell: ({ row }) => (
        <div className="font-bold text-brand-blue">
          {add15Days(row.getValue("duration"))}
        </div>
      ),
    },
    {
      accessorKey: "percent",
      header: ({ column }) => <span>Цалингийн хувь</span>,
      cell: ({ row }) => (
        <div className="font-bold text-brand-blue">
          {row.getValue("percent")}
        </div>
      ),
    },
    {
      accessorKey: "salary_status",
      header: "Статус",
      cell: ({ row }) => {
        const status =
          SalaryStatusValue[
            row.getValue<number>("salary_status") as SalaryStatus
          ];
        return (
          <span className={cn(`${status.color} badge`)}>{status.name}</span>
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

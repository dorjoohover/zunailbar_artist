import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { formatTime, getDayName, parseDate } from "@/lib/functions";
import { Schedule } from "@/models";
import TooltipWrapper from "@/components/tooltipWrapper";

export function getColumns(
  onEdit: (product: Schedule) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<Schedule>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },

    {
      accessorKey: "index",
      header: "Гараг",
      cell: ({ row }) => {
        const date = getDayName(+(row.getValue("index") as string) + 1);
        return `${date}`;
      },
    },
    {
      accessorKey: "start_time",
      header: "Эхлэх цаг",
      cell: ({ row }) => {
        const time = row.getValue("start_time") as string;
        return time ? formatTime(time) : "-";
      },
    },
    {
      accessorKey: "end_time",
      header: "Сүүлийн авах цаг",
      cell: ({ row }) => {
        const time = row.getValue("end_time") as string;
        return time ? formatTime(time) : "-";
      },
    },
    {
      accessorKey: "finish_time",
      header: "Тарах цаг",
      cell: ({ row }) => {
        const time = row.getValue("finish_time") as string;
        return time ? formatTime(time) : "-";
      },
    },
    {
      accessorKey: "times",
      header: "Цагууд",
      cell: ({ row }) => {
        const time = row.getValue("times") as string;
        return `${time ? time?.split("|").join(", ") : "-"}`;
      },
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => "Үүсгэсэн",
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
    // {
    //   id: "actions",
    //   header: "Actions",
    //   cell: ({ row }) => (
    //     <div className="flex items-center gap-2">
    //       <TooltipWrapper tooltip="Засварлах">
    //         <Button
    //           variant="ghost"
    //           size="icon"
    //           onClick={() => onEdit(row.original)}
    //         >
    //           <Pencil className="w-4 h-4" />
    //         </Button>
    //       </TooltipWrapper>

    //       <TooltipWrapper tooltip="Засварлах">
    //         <AppAlertDialog
    //           title="Итгэлтэй байна уу?"
    //           description="Бүр устгана шүү."
    //           onConfirm={async () => {
    //             const res = await remove(row.index);
    //             console.log(res);
    //             toast("Амжилттай устгалаа!", {});
    //           }}
    //           trigger={
    //             <Button variant="ghost" size="icon">
    //               <Trash2 className="w-4 h-4 text-red-500" />
    //             </Button>
    //           }
    //         />
    //       </TooltipWrapper>
    //     </div>
    //   ),
    // },
  ];
}

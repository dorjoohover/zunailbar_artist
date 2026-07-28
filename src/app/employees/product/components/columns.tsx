"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CircleSmall,
  Hammer,
  Pencil,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IUser, IUserProduct } from "@/models";
import { UserProductStatus, UserStatus } from "@/lib/enum";
import { getEnumValues, getValuesUserProductStatus } from "@/lib/constants";
import TooltipWrapper from "@/components/tooltipWrapper";
import { cn } from "@/lib/utils";
import { formatTime, mnDate, mnDateFormat } from "@/lib/functions";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";

export const getColumns = (
  onEdit: (product: IUser) => void,
  setStatus: (index: number, status: UserProductStatus) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IUserProduct>[] => [
  {
    id: "select",
    header: ({ table }) => <span>№</span>,
    cell: ({ row }) => <span className="">{row.index + 1}</span>,
  },

  {
    accessorKey: "user_name",
    header: ({ column }) => (
      <Button
        // variant="table_head"
        variant="table_header"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Хоч
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-bold text-brand-blue">
        {row.getValue("user_name")}
      </div>
    ),
  },
  {
    accessorKey: "product_name",
    header: ({ column }) => (
      <Button
        // variant="table_head"
        variant="table_header"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Бүтээгдэхүүн
        <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => {
      return <p>{row.getValue("product_name")}</p>;
    },
  },
  {
    accessorKey: "brand_name",
    header: "Brand",
  },
  {
    accessorKey: "quantity",
    header: "Тоо ширхэг",
    // cell: ({ row }) => {
    //   return <p>{}</p>;
    // },
  },

  {
    accessorKey: "user_product_status",
    header: "Статус",
    cell: ({ row }) => {
      const status =
        getValuesUserProductStatus[
          row.getValue<number>("user_product_status") as UserProductStatus
        ];
      return (
        <span className={cn(`badge ${status?.color} inline-flex items-center`)}>
          {status?.name}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Үүсгэсэн",
    cell: ({ row }) => {
      const date = mnDateFormat(new Date(row.getValue("created_at") as string));
      return <span>{date}</span>;
    },
  },
  {
    id: "actions",
    header: "Үйлдэл",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <TooltipWrapper tooltip="Засварлах">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
          </TooltipWrapper>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <TooltipWrapper tooltip="Статус солих">
                <div className="items-center justify-center size-9 flex-center">
                  <UserRoundCog className="size-4" />
                </div>
              </TooltipWrapper>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Статус солих</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {getEnumValues(UserProductStatus)
                .splice(0, 4)
                .map((item, i) => {
                  const status = getValuesUserProductStatus[item];
                  // const status = UserProductStatus[item];
                  return (
                    <DropdownMenuItem
                      //   className={status.color}
                      key={i}
                      onClick={() => setStatus(row.index, item)}
                    >
                      <span className={cn(status?.color)}>{status?.name}</span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipWrapper tooltip="Утстгах">
            <AppAlertDialog
              title="Итгэлтэй байна уу?"
              description="Бүр устгана шүү."
              onConfirm={async () => {
                const res = await remove(row.index);
                console.log(res);
                toast("Амжилттай устгалаа!", {});
              }}
              trigger={
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              }
            />
          </TooltipWrapper>
        </div>
      );
    },
  },
];

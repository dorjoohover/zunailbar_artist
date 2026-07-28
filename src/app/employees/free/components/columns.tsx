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
import { IUser } from "@/models/user.model";
import { ArrowUpDown, Hammer, Trash2, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IBranch } from "@/models";
import { mobileFormatter, parseDate } from "@/lib/functions";
import { EmployeeStatus, ROLE, UserStatus } from "@/lib/enum";
import {
  EmployeeStatusValue,
  getEnumValues,
  roleIconMap,
  RoleValue,
} from "@/lib/constants";
import Image from "next/image";
import TooltipWrapper from "@/components/tooltipWrapper";
import { TableActionButtons } from "@/components/tableActionButtons";
import { cn } from "@/lib/utils";
import { getUserColor } from "@/lib/colors";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { IArtistLeave } from "@/models/artist.leaves.model";

export const getColumns = (
  onEdit: (product: IArtistLeave) => void,
  setStatus: (index: number, status: EmployeeStatus) => void,
  remove: (index: number) => Promise<boolean>,
): ColumnDef<IArtistLeave>[] => [
  {
    id: "select",
    header: ({ table }) => <span>№</span>,
    cell: ({ row }) => <span className="">{row.index + 1}</span>,
  },

  // {
  //   accessorKey: "user_name",
  //   header: "Нэр",
  //   cell: ({ row }) => {
  //     return <p>{row.getValue("user_name")}</p>;
  //   },
  // },
  {
    accessorKey: "branch_name",
    header: "Салбар",
    cell: ({ row }) => {
      const branch = row.getValue("branch_name");
      return branch || "-";
    },
  },

  {
    accessorKey: "date",
    header: "Огноо",
    cell: ({ row }) => {
      const date = parseDate(new Date(row.getValue("date")), false);
      return <p>{date}</p>;
    },
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => {
      const status =
        EmployeeStatusValue[row.getValue<number>("status") as UserStatus];
      return <span className={cn(`${status.color} badge`)}>{status.name}</span>;
    },
  },
  {
    accessorKey: "start_time",
    header: "Эхлэх цаг",
    cell: ({ row }) => {
      const date = row.getValue("start_time");
      return date || "-";
    },
  },
  {
    accessorKey: "end_time",
    header: "Дуусах цаг",
    cell: ({ row }) => {
      const date = row.getValue("end_time");
      return date || "-";
    },
  },
  {
    accessorKey: "creater_name",
    header: "Бүртгэсэн",
    cell: ({ row }) => {
      const date = row.getValue("creater_name");
      return date || "-";
    },
  },
  {
    accessorKey: "description",
    header: "Тайлбар",
    cell: ({ row }) => {
      const date = row.getValue("description");
      return date || "-";
    },
  },

  {
    id: "actions",
    header: "Үйлдэл",
    cell: ({ row }) => {
      return (
        <TableActionButtons
          rowData={row.original}
          edit={false}
          onEdit={(data) => onEdit(data)}
        >
          <DropdownMenu>
            <TooltipWrapper tooltip="Статус солих">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserRoundCog className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipWrapper>

            <DropdownMenuContent>
              <DropdownMenuLabel>Статус солих</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {getEnumValues(EmployeeStatus)
                .splice(1, 2)
                .map((item, i) => {
                  const status = EmployeeStatusValue[item];
                  return (
                    <DropdownMenuItem
                      key={i}
                      onClick={() => setStatus(row.index, item)}
                    >
                      <span className={cn(status.color, "w-full text-center")}>
                        {status.name}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipWrapper tooltip="Устгах">
            <AppAlertDialog
              title="Итгэлтэй байна уу?"
              description="Бүр устгана шүү."
              onConfirm={() => {
                remove(row.index);
              }}
              trigger={
                <Button variant="ghost" size="icon">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              }
            />
          </TooltipWrapper>
        </TableActionButtons>
      );
    },
  },
];

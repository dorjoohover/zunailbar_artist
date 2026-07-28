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
import { EmployeeStatus, ROLE, UserLevel, UserStatus } from "@/lib/enum";
import {
  EmployeeStatusValue,
  getUserLevelValue,
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

export const getColumns = (
  onEdit: (product: IUser) => void,
  setStatus: (index: number, status: EmployeeStatus) => void,
  giveProduct: (index: number) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IUser>[] => [
  {
    id: "select",
    header: ({ table }) => <span>№</span>,
    cell: ({ row }) => <span className="">{row.index + 1}</span>,
  },
  {
    accessorKey: "firstname",
    header: ({ column }) => (
      <Button
        // variant="table_head"
        variant="table_header"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Нэр <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-bold text-brand-blue">
        {row.getValue("firstname")}
      </div>
    ),
  },
  {
    accessorKey: "nickname",
    header: ({ column }) => (
      <Button
        // variant="table_head"
        variant="table_header"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Хоч <ArrowUpDown className="w-4 h-4 ml-2" />
      </Button>
    ),
  },
  {
    accessorKey: "mobile",
    header: "Утас",
    cell: ({ row }) => {
      return <p>{mobileFormatter(row.getValue("mobile"))}</p>;
    },
  },
  {
    accessorKey: "color",
    header: "Өнгө",
    cell: ({ row }) => {
      return (
        <div
          className={`h-5 w-8 rounded-full`}
          style={{
            backgroundColor: `${getUserColor(
              +((row.getValue("color") as string) ?? -1)
            )}`,
          }}
        ></div>
      );
    },
  },
  {
    accessorKey: "branch_name",
    header: "Салбар",
    cell: ({ row }) => {
      const branch = row.getValue("branch_name");
      return branch || "Unknown";
    },
  },
  {
    accessorKey: "birthday",
    header: "Т/өдөр",
    cell: ({ row }) => {
      const date = parseDate(new Date(row.getValue("birthday")), false);
      return date;
    },
  },
  {
    accessorKey: "experience",
    header: "Туршлага",
    cell: ({ row }) => {
      return `${row.getValue("experience") ?? 0} жил`;
    },
  },
  {
    accessorKey: "percent",
    header: "Цалин",
    cell: ({ row }) => {
      return `${row.getValue("percent") ?? 0}%`;
    },
  },
  {
    accessorKey: "salary_day",
    header: "Цалин олгох огноо",
    cell: ({ row }) => {
      const value  = row.getValue("salary_day");
      return `${value ? `${value} | ${Math.floor((+value + 15) % 30)}` : `-`} `;
    },
  },
  {
    accessorKey: "profile_img",
    header: "Профайл",
    cell: ({ row }) => {
      const role = (row.getValue<number>("role") ?? ROLE.ANY) as ROLE;
      const profile = row.getValue<string | null>("profile_img");
      return (
        <>
          {profile ? (
            <span
              className={`flex gap-2 items-center overflow-hidden font-bold aspect-square size-12 rounded bg-gray-100`}
            >
              <Image
                src={`/api/file/${profile}`}
                width={100}
                height={100}
                // objectFit="contain"
                className="object-cover size-full"
                alt={role.toString()}
              />
            </span>
          ) : (
            `-`
          )}
        </>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Үүрэг",
    cell: ({ row }) => {
      const role = (row.getValue<number>("role") ?? ROLE.ANY) as ROLE;

      const name = RoleValue[role];
      const { color } = roleIconMap[role] ?? {};
      return (
        <span className={`flex gap-2 items-center text-${color}-500 font-bold`}>
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: "user_status",
    header: "Статус",
    cell: ({ row }) => {
      const status =
        EmployeeStatusValue[row.getValue<number>("user_status") as UserStatus];
      return <span className={cn(`${status.color} badge`)}>{status.name}</span>;
    },
  },
  {
    accessorKey: "level",
    header: "Артистын түвшин",
    cell: ({ row }) => {
      const level = row.getValue<number>("level") as UserLevel
      
      if(!level) return <span>-</span>
      const status =
        getUserLevelValue[level] as unknown as any
       
      return <span className={cn(`${status.color} badge`)}>{status.name}</span>;
    },
  },
  {
    id: "actions",
    header: "Үйлдэл",
    cell: ({ row }) => {
      return (
        <TableActionButtons
          rowData={row.original}
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
                .splice(0, 4)
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

          <TooltipWrapper tooltip="Бүтээгдэхүүн өгөх">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => giveProduct(row.index)}
            >
              <Hammer className="size-4" />
            </Button>
          </TooltipWrapper>
          <TooltipWrapper tooltip="Устгах">
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
        </TableActionButtons>
      );
    },
  },
];

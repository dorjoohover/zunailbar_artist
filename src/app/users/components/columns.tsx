import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Gem, Trash2, UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mobileFormatter, parseDate } from "@/lib/functions";
import { IUser } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TooltipWrapper from "@/components/tooltipWrapper";
import {
  CUSTOMER_USER_LEVELS,
  getEnumValues,
  getUserLevelValue,
  UserStatusValue,
} from "@/lib/constants";
import { UserLevel, UserStatus } from "@/lib/enum";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AppAlertDialog } from "@/components/AlertDialog";

export function getColumns(
  onEdit: (product: IUser) => void,
  remove: (index: number) => Promise<boolean>,
  setStatus: (index: number, status: UserStatus) => void,
  setLevel: (index: number, status: UserLevel) => void
): ColumnDef<IUser>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },

    {
      accessorKey: "nickname",
      header: ({ column }) => "Нэр",
      cell: ({ row }) => {
        const value = row.getValue("nickname") ?? "-";
        return value;
      },
    },
    {
      accessorKey: "mobile",
      header: ({ column }) => "Утас",
      cell: ({ row }) => {
        const res = row.getValue("mobile");
        const value = res ? mobileFormatter(res as string) : "-";
        return value;
      },
    },
    {
      accessorKey: "level",
      header: ({ column }) => "Эрэмбэ",
      cell: ({ row }) => {
        const value = row.getValue("level") as UserLevel;

        if (value != undefined && value != null) {
          const level = getUserLevelValue[value];
          const { Icon, textColor } = level;
          return (
            <div>
              <Icon color={textColor} />
            </div>
          );
        } else {
          return <div>-</div>;
        }
      },
    },

    {
      accessorKey: "created_at",
      header: () => "Үүсгэсэн",
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
                {getEnumValues(UserStatus)
                  .splice(0, 4)
                  .map((item, i) => {
                    const status = UserStatusValue[item];
                    return (
                      <DropdownMenuItem
                        key={i}
                        onClick={() => setStatus(row.index, item)}
                      >
                        <span
                          className={cn(status.color, "w-full text-center")}
                        >
                          {status.name}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <TooltipWrapper tooltip="Эрэмбэ солих">
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Gem className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipWrapper>

              <DropdownMenuContent>
                <DropdownMenuLabel>Эрэмбэ солих</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CUSTOMER_USER_LEVELS.map((item, i) => {
                  const status = getUserLevelValue[item];
                  return (
                    <DropdownMenuItem
                      key={i}
                      onClick={() => setLevel(row.index, item)}
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
                onConfirm={async () => {
                  const res = await remove(row.index);
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
}

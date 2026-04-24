import { ColumnDef } from "@tanstack/react-table";
import { money, parseDate } from "@/lib/functions";
import {
  getUserLevelValue,
  getVoucherStatusValue,
  getVoucherTypeValue,
} from "@/lib/constants";
import { IVoucher } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import { UserLevel, VoucherStatus, VOUCHER } from "@/lib/enum";

export function getColumns(
  onEdit: (voucher: IVoucher) => void,
  remove: (voucher: IVoucher) => Promise<boolean>,
): ColumnDef<IVoucher>[] {
  return [
    {
      id: "index",
      header: () => <span>№</span>,
      cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      accessorKey: "name",
      header: () => <span>Урамшуулал</span>,
      cell: ({ row }) => {
        const voucher = row.original;
        return (
          <div className="space-y-1">
            <p className="font-semibold">{voucher.name}</p>
            {voucher.note && (
              <p className="text-xs text-muted-foreground">{voucher.note}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "user_name",
      header: () => <span>Хэрэглэгч</span>,
      cell: ({ row }) => {
        const voucher = row.original;
        return (
          <div className="space-y-1">
            <p>{voucher.user_name ?? "-"}</p>
            <p className="text-xs text-muted-foreground">
              {voucher.mobile ?? "-"}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: () => <span>Төрөл</span>,
      cell: ({ row }) => (
        <span>{getVoucherTypeValue[row.original.type as VOUCHER] ?? "-"}</span>
      ),
    },
    {
      accessorKey: "value",
      header: () => <span>Дүн</span>,
      cell: ({ row }) => {
        const voucher = row.original;
        if (voucher.type === VOUCHER.Percent) {
          return <span>{voucher.value ?? 0}%</span>;
        }

        return <span>{money(String(voucher.value ?? 0), "₮")}</span>;
      },
    },
    {
      accessorKey: "level",
      header: () => <span>Түвшин</span>,
      cell: ({ row }) => {
        const level = row.original.level;
        if (level == null) return <span>-</span>;

        return (
          <span>{getUserLevelValue[level as UserLevel]?.name ?? "-"}</span>
        );
      },
    },
    {
      accessorKey: "voucher_status",
      header: () => <span>Төлөв</span>,
      cell: ({ row }) => {
        const voucherStatus =
          getVoucherStatusValue[
            row.original.voucher_status as VoucherStatus
          ];
        return (
          <span className={voucherStatus?.color ?? ""}>
            {voucherStatus?.name ?? "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "used_order_id",
      header: () => <span>Ашигласан захиалга</span>,
      cell: ({ row }) => <span>{row.original.used_order_id ?? "-"}</span>,
    },
    {
      accessorKey: "used_at",
      header: () => <span>Ашигласан огноо</span>,
      cell: ({ row }) =>
        row.original.used_at ? (
          <span>{parseDate(row.original.used_at, true)}</span>
        ) : (
          <span>-</span>
        ),
    },
    {
      accessorKey: "created_at",
      header: () => <span>Үүсгэсэн</span>,
      cell: ({ row }) =>
        row.original.created_at ? (
          <span>{parseDate(row.original.created_at, true)}</span>
        ) : (
          <span>-</span>
        ),
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        <TableActionButtons
          rowData={row.original}
          onEdit={onEdit}
          onRemove={remove}
          title="Урамшуулал устгах уу?"
          description="Устгавал энэ урамшуулал дахин харагдахгүй болно."
        />
      ),
    },
  ];
}

import { ColumnDef } from "@tanstack/react-table";
import {
  mnDateFormat,
  mobileFormatter,
  money,
  resolveOrderTimeRange,
} from "@/lib/functions";
import { IOrderDetail } from "@/models";
import { OrderStatus } from "@/lib/enum";
import { IOrder } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import { OrderStatusValues } from "@/lib/constants";

export function getColumns(
  onEdit: (product: IOrder) => void,
  remove: (index: number) => Promise<boolean>,
): ColumnDef<IOrder>[] {
  return [
    {
      id: "select",
      header: () => <span>№</span>,
      cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      accessorKey: "details",
      header: () => <span>Гарчиг</span>,
      cell: ({ row }) => (
        <div className="font-semibold text-xs whitespace-normal break-words mb-1 max-w-[260px]">
          {(row.getValue("details") as IOrderDetail[])
            .map((e) => e.service_name)
            .join(",") || "Untitled Order"}
        </div>
      ),
    },
    {
      accessorKey: "artist",
      header: () => <span>Артист</span>,
      cell: ({ row }) => {
        const details = (row.original.details ?? []) as Array<
          IOrderDetail & { nickname?: string | null }
        >;
        const artists = Array.from(
          new Set(details.map((detail) => detail.nickname).filter(Boolean)),
        );

        return <span>{artists.join(", ") || "-"}</span>;
      },
    },
    {
      accessorKey: "customer",
      header: () => <span>Утасны дугаар</span>,
      cell: ({ row }) => (
        <span>{mobileFormatter((row.getValue("customer") as any)?.mobile ?? "")}</span>
      ),
    },
    {
      accessorKey: "order_date",
      header: () => <span>Захиалгын огноо</span>,
      cell: ({ row }) => <span>{row.getValue("order_date") as string}</span>,
    },
    {
      accessorKey: "start_time",
      header: () => <span>Эхлэх цаг</span>,
      cell: ({ row }) => {
        const { start_time } = resolveOrderTimeRange(row.original);
        return <span>{start_time?.slice(0, 5) ?? "-"}</span>;
      },
    },
    {
      accessorKey: "end_time",
      header: () => <span>Дуусах цаг</span>,
      cell: ({ row }) => {
        const { end_time } = resolveOrderTimeRange(row.original);
        return <span>{end_time?.slice(0, 5) ?? "-"}</span>;
      },
    },
    {
      accessorKey: "order_status",
      header: () => <span>Төлөв</span>,
      cell: ({ row }) => (
        <span>
          {OrderStatusValues[row.getValue("order_status") as OrderStatus]}
        </span>
      ),
    },
    {
      accessorKey: "total_amount",
      header: () => <span>Нийт төлбөр</span>,
      cell: ({ row }) => {
        const total = Number(row.getValue("total_amount") ?? 0);
        const discount = Number(row.original.discount ?? 0);

        return (
          <div className="space-y-1">
            <span>{money(total.toString())}₮</span>
            {row.original.voucher_name && (
              <div className="text-xs text-emerald-700">
                Урамшуулал: {row.original.voucher_name}
                {discount > 0 ? ` (-${money(String(discount))}₮)` : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: () => <span>Үүсгэсэн огноо</span>,
      cell: ({ row }) => {
        const date = mnDateFormat(new Date(row.getValue("created_at") as string));
        return <span>{date}</span>;
      },
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        <TableActionButtons
          rowData={row.original}
          onEdit={(data) => onEdit(data)}
          onRemove={() => remove(row.index)}
        />
      ),
    },
  ];
}

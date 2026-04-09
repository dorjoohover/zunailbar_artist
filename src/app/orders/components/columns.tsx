import { ColumnDef } from "@tanstack/react-table";
import { mnDateFormat, mobileFormatter, money } from "@/lib/functions";
import { IOrderDetail } from "@/models";
import { OrderStatus } from "@/lib/enum";
import { IOrder } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import { OrderStatusValues } from "@/lib/constants";

export function getColumns(
  onEdit: (product: IOrder) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IOrder>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "details",
      header: ({ table }) => <span>Гарчиг</span>,
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
      header: ({ table }) => <span>Утасны дугаар</span>,
      cell: ({ row }) => {
        return <span className="">
          {" "}
          {mobileFormatter((row.getValue("customer") as any)?.mobile ?? "")}
        </span>;
      },
    },
    {
      accessorKey: "order_date",
      header: ({ table }) => <span>Захиалгын огноо</span>,

      cell: ({ row }) => (
        <div>
          <span> {row.getValue("order_date") as string}</span>
        </div>
      ),
    },
    {
      accessorKey: "start_time",
      header: ({ table }) => <span>Эхлэх цаг</span>,

      cell: ({ row }) => (
        <div>
          <span> {(row.getValue("start_time") as string).slice(0, 5)}</span>
        </div>
      ),
    },
    {
      accessorKey: "end_time",
      header: ({ table }) => <span>Дуусах цаг</span>,

      cell: ({ row }) => (
        <div>
          <span> {(row.getValue("end_time") as string).slice(0, 5)}</span>
        </div>
      ),
    },

    {
      accessorKey: "order_status",
      header: ({ table }) => <span>Төлөв</span>,
      cell: ({ row }) => (
        <div>
          <span>
            {OrderStatusValues[row.getValue("order_status") as OrderStatus]}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: () => <span>Нийт төлбөр</span>,
      cell: ({ row }) => {
        const total = Number(row.getValue("total_amount") ?? 0);
        return <span>{money(total.toString())}₮</span>;
      },
    },

    {
      accessorKey: "created_at",
      header: ({ table }) => <span>Үүсгэсэн огноо</span>,
      cell: ({ row }) => {
        const date = mnDateFormat(
          new Date(row.getValue("created_at") as string)
        );
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
          onRemove={(data) => remove(row.index)}
        ></TableActionButtons>
      ),
    },
  ];
}

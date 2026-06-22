import { ColumnDef } from "@tanstack/react-table";
import { mobileFormatter, parseDate } from "@/lib/functions";
import { OrderLog } from "@/models";
import { OrderStatus, STATUS } from "@/lib/enum";
import { TableActionButtons } from "@/components/tableActionButtons";
import { OrderStatusValues, StatusValues } from "@/lib/constants";

const formatOrderLogChangedAt = (value: string | Date) => {
  if (typeof value === "string") {
    const match = value
      .trim()
      .match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
    if (match) {
      const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
      return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    const hour = String(value.getUTCHours()).padStart(2, "0");
    const minute = String(value.getUTCMinutes()).padStart(2, "0");
    const second = String(value.getUTCSeconds()).padStart(2, "0");
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  }
  return parseDate(value, true);
};

const displayText = (value?: string | null) => {
  const text = `${value ?? ""}`.trim();
  return text.toLowerCase() === "null" ? "" : text;
};

export function getColumns(
  view: (id: OrderLog) => void,
): ColumnDef<OrderLog>[] {
  return [
    {
      id: "select",
      header: () => <span>№</span>,
      cell: ({ row }) => <span>{row.index + 1}</span>,
    },
    {
      accessorKey: "changed_user_name",
      header: () => <span>Өөрчлөлт оруулсан</span>,
      cell: ({ row }) => (
        <div className="text-xs">
          <div>{displayText(row.getValue("changed_user_name") as string)}</div>
          <div className="text-muted-foreground">
            {mobileFormatter((row.original as any).changed_user_mobile ?? "")}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "customer_mobile",
      header: () => <span>Хэрэглэгчийн дугаар</span>,
      cell: ({ row }) => (
        <div>
          <span>{mobileFormatter(row.getValue("customer_mobile") as string)}</span>
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: () => <span>Хэрэглэгчийн нэр</span>,
      cell: ({ row }) => (
        <div>
          <span>{displayText(row.getValue("customer_name") as string)}</span>
        </div>
      ),
    },
    {
      accessorKey: "artist_names",
      header: () => <span>Артист</span>,
      cell: ({ row }) => (
        <div>
          <span>{displayText(row.getValue("artist_names") as string)}</span>
        </div>
      ),
    },
    {
      accessorKey: "changed_at",
      header: () => <span>Огноо</span>,
      cell: ({ row }) => (
        <div>
          <span>{formatOrderLogChangedAt(row.getValue("changed_at") as string | Date)}</span>
        </div>
      ),
    },
    {
      accessorKey: "old_order_status",
      header: () => <span>Хуучин төлөв</span>,
      cell: ({ row }) => (
        <div>
          <span>{OrderStatusValues[row.getValue("old_order_status") as OrderStatus]}</span>
        </div>
      ),
    },
    {
      accessorKey: "new_order_status",
      header: () => <span>Шинэ төлөв</span>,
      cell: ({ row }) => (
        <div>
          <span>{OrderStatusValues[row.getValue("new_order_status") as OrderStatus]}</span>
        </div>
      ),
    },
    {
      accessorKey: "old_status",
      header: () => <span>Хуучин төлөв</span>,
      cell: ({ row }) => (
        <div>
          <span>{StatusValues[row.getValue("old_status") as STATUS]}</span>
        </div>
      ),
    },
    {
      accessorKey: "new_status",
      header: () => <span>Шинэ төлөв</span>,
      cell: ({ row }) => (
        <div>
          <span>{StatusValues[row.getValue("new_status") as STATUS]}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Үйлдэл",
      cell: ({ row }) => (
        <TableActionButtons
          rowData={row.original}
          onEdit={(data) => view(data)}
          edit_text="Харах"
        />
      ),
    },
  ];
}

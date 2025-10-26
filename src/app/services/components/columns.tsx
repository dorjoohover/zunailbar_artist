import { ColumnDef } from "@tanstack/react-table";
import { IProduct } from "@/models/product.model";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppAlertDialog } from "@/components/AlertDialog";
import { toast } from "sonner";
import { money, parseDate } from "@/lib/functions";
import { IService } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import Image from "next/image";
import { getValueServiceView, icons, ServiceView } from "@/lib/constants";

export function getColumns(
  onEdit: (product: IService) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IService>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "branch_name",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Салбар <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Үйлчилгээ <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),

      cell: ({ row }) => {
        const view = (row.original as any).view;
        const color = view
          ? getValueServiceView[view as ServiceView].color
          : null;
        return (
          <p className={`${color ? color : ""}`}>{row.getValue("name")}</p>
        );
      },
    },
    {
      accessorKey: "image",
      header: "Зураг",
      cell: ({ row }) => (
        <Image
          alt={row.getValue("name")}
          src={`/api/file/${row.getValue("image")}`}
          width={50}
          height={50}
        />
      ),
    },

    {
      accessorKey: "icon",
      header: "Icon",
      cell: ({ row }) => {
        const Icon = icons?.[row.getValue("icon") as string];
        if (Icon) return <Icon size={18} />;
      },
    },

    {
      accessorKey: "duration",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Хугацаа <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => `${row.getValue("duration")}мин`,
    },
    {
      accessorKey: "min_price",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Үнэ <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => money(row.getValue("min_price"), "₮"),
    },
    {
      accessorKey: "max_price",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Дээд үнэ <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => money(row.getValue("max_price"), "₮"),
    },
    {
      accessorKey: "pre",
      header: "Урьдчилгаа",
      cell: ({ row }) => money(row.getValue("pre") ?? "0", "₮"),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="table_header"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-bold"
        >
          Үүсгэсэн <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
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
      cell: ({ row }) => (
        // Bagasgasan
        <TableActionButtons
          rowData={row.original}
          onEdit={(data) => onEdit(data)}
          onRemove={(data) => remove(row.index)}
        ></TableActionButtons>
        // <div className="flex items-center gap-2">
        //   <Button
        //     variant="ghost"
        //     size="icon"
        //     onClick={() => onEdit(row.original)}
        //   >
        //     <Pencil className="w-4 h-4" />
        //   </Button>

        //   <AppAlertDialog
        //     title="Итгэлтэй байна уу?"
        //     description="Бүр устгана шүү."
        //     onConfirm={async () => {
        //       const res = await remove(row.index);
        //       console.log(res);
        //       toast("Амжилттай устгалаа!" + res, {});
        //     }}
        //     trigger={
        //       <Button variant="ghost" size="icon">
        //         <Trash2 className="w-4 h-4 text-red-500" />
        //       </Button>
        //     }
        //   />
        // </div>
      ),
    },
  ];
}

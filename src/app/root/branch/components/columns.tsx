import { ColumnDef } from "@tanstack/react-table";

import { ArrowUpDown, Link as LLink, Map, MapPin, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDate } from "@/lib/functions";
import { IBranch } from "@/models";
import { TableActionButtons } from "@/components/tableActionButtons";
import Link from "next/link";

export function getColumns(
  onEdit: (product: IBranch) => void,
  remove: (index: number) => Promise<boolean>
): ColumnDef<IBranch>[] {
  return [
    {
      id: "select",
      header: ({ table }) => <span>№</span>,
      cell: ({ row }) => <span className="">{row.index + 1}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <span>Салбар</span>,
    },
    {
      accessorKey: "order_days",
      header: () => <div>Захиалга авах хоног</div>,
    },
    {
      accessorKey: "address",
      header: () => <div>Хаяг</div>,
      cell: ({ row }) => {
        const address = row.getValue("address") as string;

        return (
          <p
            style={{
              maxWidth: 120,
              minWidth: 80,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={address} // hover дээр бүтнээрээ харагдана
          >
            {address ?? ""}
          </p>
        );
      },
    },
    {
      accessorKey: "url",
      header: () => <div>Линк</div>,
      cell: ({ row }) => {
        const url = row.getValue("url");
        return (
          <Link href={url ?? "/"} target="_blank">
            <MapPin />
          </Link>
        );
      },
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => <span> Үүсгэсэн</span>,
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
        <TableActionButtons
          description="Тухайн салбарт харьяалагдах мэдээлэл бүгд устахыг анхаарна уу"
          rowData={row.original}
          onEdit={(data) => onEdit(data)}
          onRemove={(data) => remove(row.index)}
        ></TableActionButtons>
      ),
    },
  ];
}

// <div className="flex items-center gap-2">
//   <TooltipWrapper tooltip="Засварлах">
//     <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
//       <Pencil className="w-4 h-4" />
//     </Button>
//   </TooltipWrapper>

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
//         <TooltipWrapper tooltip="Статус солих">
//           <Trash2 className="w-4 h-4 text-red-500" />
//         </TooltipWrapper>
//       </Button>
//     }
//   />
// </div>

"use client";;
import ContainerHeader from "@/components/containerHeader";
import { IProduct, Product } from "@/models";
import { getColumns } from "./columns";
import { useState } from "react";
import { toast } from "sonner";
import { ProductDialog } from "./dialog";
import { ListType } from "@/lib/constants";

// Ustgah
// const initialProduct: IProduct = {
//   id: "1",
//   brand_id: "1",
//   category_id: "man",
//   name: "Ягаан будаг",
//   ref: "asd",
//   quantity: 12,
//   price: 15000,
//   color: "Pink",
//   size: "50ml",
//   created_at: new Date("2025-07-20"),
// };

// const initialProducts: IProduct[] = Array.from({ length: 40 }, (_, i) => ({
//   ...initialProduct,
//   id: (i + 1).toString(),
//   name: `Ягаан будаг ${i + 1}`,
// }));

export const ProductPage = ({ data }: { data: ListType<Product> }) => {
  const { count, items } = data;

  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [products, setProducts] = useState<IProduct[]>(items);
  const handleSave = () => {
    if (!editingProduct || !editingProduct.id) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
    );
    setEditingProduct(null);

    toast("Амжилттай хадгаллаа!", {});
  };
  const columns = getColumns(setEditingProduct);
  const onChange = (
    key: string | null,
    value: string | null | number | undefined
  ) => {
    key == null
      ? setEditingProduct(null)
      : setEditingProduct((prev) => {
          if (key === "id" && typeof value !== "string") return prev; // skip if invalid
          return {
            ...prev,
            [key]: value,
          };
        });
  };
  return (
    <div className="admin-container">
      <ContainerHeader title="Барааны жагсаалт" />
      {/* <DataTable columns={columns} data={products} /> */}
      <ProductDialog
        editingProduct={editingProduct}
        onChange={onChange}
        save={handleSave}
      />
    </div>
  );
};

"use client";

import { DialogContent, DialogTitle } from "@radix-ui/react-dialog";

import { useState } from "react";
import { IProduct, Product } from "@/models";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ProductDialog = ({
  editingProduct,
  onChange,
  save,
}: {
  editingProduct: IProduct | null;
  onChange: (key: string | null, value: string | null) => void;
  save: () => void;
}) => {
  return (
    <Dialog
      open={!!editingProduct}
      onOpenChange={(open) => !open && onChange(null, null)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Бараа засах</DialogTitle>
        </DialogHeader>

        {editingProduct && (
          <form action={""} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Нэр</label>
              <Input
                value={editingProduct.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Нэр"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Reference</label>
              <Input
                value={editingProduct.ref}
                onChange={(e) => onChange("ref", e.target.value)}
                placeholder="Reference"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Тоо ширхэг</label>
              <Input
                type="number"
                value={editingProduct.quantity}
                onChange={(e) => onChange("quantity", e.target.value)}
                placeholder="Тоо ширхэг"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Үнэ</label>
              <Input
                type="number"
                value={editingProduct.price}
                onChange={(e) => onChange("price", e.target.value)}
                placeholder="Үнэ"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Өнгө</label>
              <Input
                value={editingProduct.color}
                onChange={(e) => onChange("color", e.target.value)}
                placeholder="Өнгө"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Хэмжээ</label>
              <Input
                value={editingProduct.size}
                onChange={(e) => onChange("size", e.target.value)}
                placeholder="Хэмжээ"
                required
              />
            </div>
            <Button type="submit" onClick={save}>
              Хадгалах
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

const CustomInput = ({
  name,
  value,
  onChange,
  pl,
}: {
  name: string;
  pl: string;
  value: string | undefined;
  onChange: (e: string | null) => void;
}) => {
  return (
    <div>
      <label className="block mb-1 font-medium">{name}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={pl}
        required
      />
    </div>
  );
};

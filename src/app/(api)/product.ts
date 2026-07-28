"use server";
import { API, METHOD } from "@/utils/api";
import { cookies } from "next/headers";

export const searchProduct = async (id: string) => {
  try {
    const store = await cookies();
    const token = store.get("token")?.value;
    const merchant = store.get("merchant_id")?.value;
    const res = await fetch(
      `${API.product}/search/{id}${id != "" ? `?id=${id}` : ""}`,
      {
        cache: "no-store",
        method: METHOD.get,
        headers: {
          "merchant-id": merchant ?? "",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();
    if (!data.succeed) {
      throw new Error("Failed to fetch");
    }
    return data.payload;
  } catch (error) {
    console.log(error);
  }
};

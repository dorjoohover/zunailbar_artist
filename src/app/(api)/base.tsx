"use server";
import { Api, API } from "@/utils/api";
import { cookies } from "next/headers";

export async function imageUploader(images: FormData) {
  try {
    const store = await cookies();
    const token = store.get("token")?.value;
    console.log(token)
    const merchant = store.get("merchant_id")?.value;
    console.log(images.get("files"));
    let res = await fetch(`${API[Api.upload]}`, {
      method: "POST",
      headers: {
        cache: "no-store",
        Authorization: `Bearer ${token ?? ""}`,
        "merchant-id": merchant ?? "",
      },
      body: images,
    }).then((d) => d.json());
    images.delete("files");
    console.log(res);
    return res.payload.files;
  } catch (error) {
    console.log(error);
    return false;
  }
}

// "use server";
// import { IProduct, IUserProduct, UserProduct } from "@/models";
// import { API, METHOD } from "@/utils/api";
// import { cookies } from "next/headers";

// export const giveProductToEmployee = async (dto: IUserProduct[]) => {
//   const res = await fetch(`${API.user_product}`, {
//     cache: "no-store",
//     method: METHOD.post,
//     body: JSON.stringify({
//       items: dto,
//     }),
//     headers: {
//         ''
//     }
//   });
//   if (!res.ok) throw new Error("Failed to fetch");

//   return res.json();
// };

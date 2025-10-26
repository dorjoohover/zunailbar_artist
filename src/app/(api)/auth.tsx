"use server";

import { ILoginUser, IRegisterUser } from "@/models";
import { API, METHOD } from "@/utils/api";

export const login = async (dto: ILoginUser) => {
  try {
    console.log(API.login);
    const res = await fetch(`${API.login}`, {
      cache: "no-store",
      method: METHOD.post,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    const data = await res.json();
    if (!res.ok)
      return {
        error: data.message,
      };

    return { data: data.payload };
  } catch (error) {
    console.log(error);
    return {
      error: (error as Error).message,
    };
  }
};

export const register = async (dto: IRegisterUser) => {
  const res = await fetch(`${API.register}`, {
    cache: "no-store",
    method: METHOD.post,
    body: JSON.stringify(dto),
  });

  if (!res.ok) throw new Error("Failed to fetch");

  return res.json();
};

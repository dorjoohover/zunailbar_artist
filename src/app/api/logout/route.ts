import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await cookies();
  store.delete("token");
  store.delete("merchant_id");
  store.delete("branch_id");

  return NextResponse.redirect(
    new URL(
      "/login",
      process.env.NEXT_PUBLIC_BASE_URL || "https://admin.zunailbar.mn/"
    )
  );
}

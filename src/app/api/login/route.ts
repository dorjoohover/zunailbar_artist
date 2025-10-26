"use server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = await cookies();
    console.log(body);

    store.set("token", body.token);
    store.set("merchant_id", body.merchant);
    store.set("branch_id", body.branch);

    console.log("✅ Cookie set:", body);

    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "https://admin.zunailbar.mn")
    );
  } catch (error) {
    console.error("⛔ Route error:", error);
    return NextResponse.json({ success: false });
  }
}

"use server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = await cookies();

    store.set("token", body.token);
    store.set("merchant_id", body.merchant);
    store.set("branch_id", body.branch);

    return NextResponse.redirect(
      new URL(
        "/orders",
        process.env.NEXT_PUBLIC_BASE_URL || "http://admin.zunailbar.mn/",
      ),
    );
  } catch (error) {
    console.error("⛔ Route error:", error);
    return NextResponse.json({ success: false });
  }
}

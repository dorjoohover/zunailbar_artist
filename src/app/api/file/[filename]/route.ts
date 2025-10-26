import { Api, API } from "@/utils/api";
import { NextRequest, NextResponse } from "next/server";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;

  // үндсэн зураг
  let fileUrl = `${API[Api.file]}/${filename}`;

  try {
    let res = await fetch(fileUrl);

    // Хэрвээ зураг олдоогүй бол (404 гэх мэт) fallback хийнэ
    if (!res.ok) {
      const fallbackUrl = `${API[Api.file]}/noimage.jpg`;
      res = await fetch(fallbackUrl);

      if (!res.ok) {
        return new NextResponse("Failed to fetch file or fallback image", {
          status: 500,
        });
      }
    }

    const contentType =
      res.headers.get("Content-Type") || "application/octet-stream";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("File fetch error:", err);
    return new NextResponse("Алдаа гарлаа", { status: 500 });
  }
}

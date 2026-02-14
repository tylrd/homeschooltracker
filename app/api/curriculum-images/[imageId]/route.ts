import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getImageStore } from "@/lib/storage/image-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const imageStore = getImageStore();
  const image = await imageStore.getImageById(imageId);

  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const etag = createHash("sha1").update(image.imageData).digest("hex");
  const ifNoneMatch = request.headers.get("if-none-match")?.replaceAll('"', "");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: `"${etag}"`,
        "Last-Modified": image.updatedAt.toUTCString(),
      },
    });
  }

  const body = Uint8Array.from(image.imageData);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.byteSize),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ETag: `"${etag}"`,
      "Last-Modified": image.updatedAt.toUTCString(),
    },
  });
}

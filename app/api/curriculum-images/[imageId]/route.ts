import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getImageStore } from "@/lib/storage/image-store";

function isAuthFailure(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "Unauthorized" ||
      error.message === "No active organization selected")
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const imageStore = getImageStore();
  let image: Awaited<ReturnType<typeof imageStore.getImageById>> = null;

  try {
    image = await imageStore.getImageById(imageId);
  } catch (error) {
    if (isAuthFailure(error)) {
      // Avoid throwing 500s for image fetches when session is missing/expired.
      return new NextResponse(null, { status: 401 });
    }
    throw error;
  }

  if (!image) {
    return new NextResponse(null, { status: 404 });
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    let fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || fileExtension.length > 5) {
      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
      };
      fileExtension = mimeToExt[file.type] || "png";
    }

    const fileName = `bundle-images/bundle-${timestamp}-${randomString}.${fileExtension}`;

    try {
      const blob = await put(fileName, file, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url }, { status: 200 });
    } catch (uploadError: any) {
      console.error("Error uploading bundle image:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message || "Upload service unavailable"}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error uploading bundle image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

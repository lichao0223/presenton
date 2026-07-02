import { NextRequest, NextResponse } from "next/server";
import path from "path";

import {
  domToPptxExportAvailable,
  runDomToPptxExport,
} from "@/lib/run-dom-to-pptx-export";

export const runtime = "nodejs";

async function readExportRequestBody(req: NextRequest): Promise<{
  id?: unknown;
  title?: unknown;
}> {
  const rawBody = await req.text();
  if (!rawBody.trim()) {
    throw new Error("EMPTY_BODY");
  }

  const parsed = JSON.parse(rawBody) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("INVALID_BODY");
  }

  return parsed as { id?: unknown; title?: unknown };
}

function buildExportDownloadUrl(outPath: string): string {
  const appDataDirectory = process.env.APP_DATA_DIRECTORY?.trim();
  if (!appDataDirectory) {
    throw new Error("APP_DATA_DIRECTORY is required to download exported files.");
  }

  const exportsDirectory = path.join(appDataDirectory, "exports");
  const relativePath = path.relative(exportsDirectory, outPath);
  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Export finished outside the configured exports directory.");
  }

  return `/api/export-presentation/file?name=${encodeURIComponent(relativePath)}`;
}

export async function POST(req: NextRequest) {
  let body: Awaited<ReturnType<typeof readExportRequestBody>>;
  try {
    body = await readExportRequestBody(req);
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error instanceof Error &&
        (error.message === "EMPTY_BODY" || error.message === "INVALID_BODY"))
    ) {
      return NextResponse.json(
        { error: "Invalid dom-to-pptx export request JSON body" },
        { status: 400 }
      );
    }
    throw error;
  }

  const { id, title } = body;
  const cookieHeader = req.headers.get("cookie") ?? "";

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json(
      { error: "Missing Presentation ID" },
      { status: 400 }
    );
  }

  try {
    if (!(await domToPptxExportAvailable())) {
      throw new Error(
        "dom-to-pptx is not available. Install dom-to-pptx in the Next.js app."
      );
    }

    const { path: outPath } = await runDomToPptxExport({
      presentationId: id.trim(),
      title: typeof title === "string" ? title : undefined,
      cookieHeader,
    });

    return NextResponse.json({
      success: true,
      path: buildExportDownloadUrl(outPath),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[export-presentation:dom-to-pptx]", message);
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

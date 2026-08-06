import { NextResponse } from "next/server";

import { buildClaimChartDocxBuffer } from "@/lib/export/buildClaimChartDocx";
import { exportFilename } from "@/lib/export/buildExportSnapshot";
import type { ClaimChartExportSnapshot } from "@/lib/export/types";

/**
 * Server-side DOCX generation.
 * Keeps the `docx` package out of the client bundle (Turbopack breaks its `super` usage in the browser).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClaimChartExportSnapshot;
    if (!body?.elements?.length || !body.patentId) {
      return NextResponse.json(
        { error: "Invalid export snapshot" },
        { status: 400 }
      );
    }

    const snapshot: ClaimChartExportSnapshot = {
      ...body,
      generatedAt: new Date(body.generatedAt),
    };

    const buffer = await buildClaimChartDocxBuffer(snapshot);
    const filename = exportFilename(snapshot.patentId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't export the claim chart." },
      { status: 500 }
    );
  }
}

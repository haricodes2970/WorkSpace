import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/get-session";
import { exportWorkspace } from "@/platform/import-export/export.service";

export async function GET(req: NextRequest) {
  const session = await requireSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "json";

  try {
    const data = await exportWorkspace(session.profile.id);

    if (format === "json") {
      const json     = JSON.stringify(data, null, 2);
      const filename = `workspace-export-${new Date().toISOString().slice(0, 10)}.json`;
      return new NextResponse(json, {
        status: 200,
        headers: {
          "Content-Type":        "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control":       "no-store",
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format. Use ?format=json" }, { status: 400 });
  } catch (err) {
    console.error("[Export] failed:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

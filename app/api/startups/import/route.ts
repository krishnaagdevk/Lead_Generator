import { NextRequest, NextResponse } from "next/server";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import { importStartupAsLead, DiscoveredStartup } from "@/lib/server/startups";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = await getTenantUserId(session.userId);
    const body = await req.json();
    const { startup, startups } = body as { startup?: DiscoveredStartup; startups?: DiscoveredStartup[] };

    if (startup) {
      const res = await importStartupAsLead(startup, tenantId);
      return NextResponse.json(res);
    }

    if (Array.isArray(startups) && startups.length > 0) {
      const results = [];
      for (const item of startups) {
        const res = await importStartupAsLead(item, tenantId);
        results.push(res);
      }
      return NextResponse.json({ ok: true, importedCount: results.length, results });
    }

    return NextResponse.json({ error: "No startup provided" }, { status: 400 });
  } catch (error: any) {
    console.error("Import startup error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to import startup" },
      { status: 500 }
    );
  }
}

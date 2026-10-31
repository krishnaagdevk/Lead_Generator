import { NextRequest, NextResponse } from "next/server";
import { getSession, getTenantUserId } from "@/lib/server/auth";
import {
  createStartupSavedSearch,
  listStartupSavedSearches,
  syncDueStartupSearches,
} from "@/lib/server/startups";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTenantUserId(session.userId);

    // Run a background sync for any searches that have reached their scheduled time (2h / 3h)
    syncDueStartupSearches(tenantId).catch((err) =>
      console.error("Background sync error on saved searches:", err)
    );

    const searches = await listStartupSavedSearches(tenantId);
    return NextResponse.json({ ok: true, searches });
  } catch (error: any) {
    console.error("GET saved searches error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list saved searches" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTenantUserId(session.userId);

    const body = await req.json();
    const { name, role, query, location, source, intervalHours, autoImport } = body;

    if (!name || !role) {
      return NextResponse.json({ error: "Search Name and Target Role are required" }, { status: 400 });
    }

    const result = await createStartupSavedSearch(tenantId, {
      name,
      role,
      query,
      location,
      source,
      intervalHours: Number(intervalHours) || 2,
      autoImport: autoImport !== false,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("POST saved search error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create saved search" },
      { status: 500 }
    );
  }
}

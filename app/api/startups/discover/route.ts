import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { discoverStartups, POPULAR_TECH_ROLES, JOB_ROLE_CATEGORIES } from "@/lib/server/startups";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const location = searchParams.get("location") || "remote";
    const role = searchParams.get("role") || "";
    const source = (searchParams.get("source") || "all") as "all" | "producthunt" | "hackernews" | "linkedin" | "unstop";
    const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") || 25)));

    const startups = await discoverStartups({ query, location, role, source, limit });

    return NextResponse.json({
      ok: true,
      count: startups.length,
      roles: POPULAR_TECH_ROLES,
      roleCategories: JOB_ROLE_CATEGORIES,
      startups,
    });
  } catch (error: any) {
    console.error("Discover startups error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to discover startups" },
      { status: 500 }
    );
  }
}

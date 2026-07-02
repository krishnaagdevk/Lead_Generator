import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";
import { leadsToCSV, leadsToXLSX } from "@/lib/server/exports";

export async function GET(req: NextRequest, { params }: { params: Promise<{ format: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { format } = await params;
  const sp = req.nextUrl.searchParams;
  const searchJobId = sp.get("searchJobId") ? Number(sp.get("searchJobId")) : undefined;
  const websiteStatus = sp.get("websiteStatus") ?? undefined;
  const idsStr = sp.get("ids");
  const ids = idsStr ? idsStr.split(",").map(Number) : undefined;

  const leads = await prisma.lead.findMany({
    where: {
      userId: session.userId,
      ...(searchJobId && { searchJobId }),
      ...(websiteStatus && { websiteStatus: websiteStatus as never }),
      ...(ids && ids.length > 0 && { id: { in: ids } }),
    },
  });

  if (format === "csv") {
    const csv = leadsToCSV(leads as never);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=leads.csv",
      },
    });
  }

  if (format === "xlsx") {
    const xlsx = await leadsToXLSX(leads as never);
    return new NextResponse(xlsx.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=leads.xlsx",
      },
    });
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}

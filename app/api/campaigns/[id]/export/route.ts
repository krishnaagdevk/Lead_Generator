import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaignId = Number(id);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      logs: {
        include: { lead: true },
      },
    },
  });

  if (!campaign || campaign.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const format = req.nextUrl.searchParams.get("format") || "csv";

  // Build rows: Lead Name, Email, Status, Sent At, Opened At, Replied At
  const headers = ["Lead Name", "Email", "Status", "Sent At", "Opened At", "Replied At", "Classification"];
  const rows = campaign.logs.map((l) => [
    l.lead.name,
    l.lead.email || "",
    l.status,
    l.sentAt.toISOString(),
    l.openedAt ? l.openedAt.toISOString() : "",
    l.repliedAt ? l.repliedAt.toISOString() : "",
    l.replyClassification || "",
  ]);

  if (format === "csv") {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="campaign-${campaignId}-analytics.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}

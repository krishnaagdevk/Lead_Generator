import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { sendSMS } from "@/lib/server/sms";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.TWILIO_ACCOUNT_SID) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { message } = await req.json() as { message: string };
  const lead = await prisma.lead.findFirst({ where: { id: Number(id), userId: session.userId } });
  if (!lead?.phone) return NextResponse.json({ error: "Lead has no phone number" }, { status: 400 });

  try {
    const sid = await sendSMS(lead.phone, message);
    await prisma.smsLog.create({
      data: { leadId: lead.id, userId: session.userId, message, twilioSid: sid, status: "sent" },
    });
    return NextResponse.json({ sent: true, sid });
  } catch (err: any) {
    await prisma.smsLog.create({
      data: { leadId: lead.id, userId: session.userId, message, status: "failed" },
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
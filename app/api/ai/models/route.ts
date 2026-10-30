import { NextResponse } from "next/server";
import { getAvailableAIModels } from "@/lib/server/aiConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getAvailableAIModels();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to retrieve AI models", details: err?.message },
      { status: 500 }
    );
  }
}


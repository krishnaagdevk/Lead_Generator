import { Client } from "@notionhq/client";

export async function exportLeadsToNotion(leads: Array<{
  name: string; email?: string | null; phone?: string | null;
  address?: string | null; websiteStatus: string; leadScore: number; mapsUrl?: string | null;
}>): Promise<number> {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  let exported = 0;

  for (const lead of leads) {
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        Name:          { title: [{ text: { content: lead.name } }] },
        Email:         { email: lead.email ?? null },
        Phone:         { phone_number: lead.phone ?? null },
        Address:       { rich_text: [{ text: { content: lead.address ?? "" } }] },
        "Website Status": { select: { name: lead.websiteStatus } },
        "Lead Score":  { number: lead.leadScore },
        "Maps URL":    { url: lead.mapsUrl ?? null },
      },
    });
    exported++;
  }
  return exported;
}
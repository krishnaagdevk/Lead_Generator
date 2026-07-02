import ExcelJS from "exceljs";
import { google } from "googleapis";
import { buildOAuthClient, TokenData } from "./gmail";

type LeadRow = Record<string, unknown>;

export function leadsToCSV(leads: LeadRow[]): string {
  const fields = ["name", "category", "address", "phone", "email", "websiteUrl",
    "websiteStatus", "bestContact", "rating", "reviewCount", "mapsUrl", "pipelineStage", "notes"];
  const header = fields.join(",");
  const rows = leads.map((l) =>
    fields.map((f) => {
      const v = String(l[f] ?? "").replace(/"/g, '""');
      return v.includes(",") ? `"${v}"` : v;
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

export async function leadsToXLSX(leads: LeadRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Leads");

  ws.columns = [
    { header: "Name", key: "name", width: 28 },
    { header: "Category", key: "category", width: 20 },
    { header: "Address", key: "address", width: 36 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Website", key: "websiteUrl", width: 30 },
    { header: "Status", key: "websiteStatus", width: 14 },
    { header: "Best Contact", key: "bestContact", width: 14 },
    { header: "Rating", key: "rating", width: 8 },
    { header: "Reviews", key: "reviewCount", width: 10 },
    { header: "Maps URL", key: "mapsUrl", width: 40 },
    { header: "Pipeline", key: "pipelineStage", width: 14 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  // Style header
  ws.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
  });

  leads.forEach((l) => ws.addRow(l));

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportLeadsToGoogleSheet(
  tokenData: TokenData,
  leads: any[],
  userPlan?: string
): Promise<string> {
  const client = buildOAuthClient();
  client.setCredentials(tokenData);

  const sheets = google.sheets({ version: "v4", auth: client });

  const title = userPlan === "agency"
    ? `Leads Export - ${new Date().toLocaleDateString()}`
    : `LeadHunter Export - ${new Date().toLocaleDateString()}`;
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
    },
  });

  const spreadsheetId = spreadsheet.data.spreadsheetId;
  if (!spreadsheetId) throw new Error("Failed to create spreadsheet");

  const values = [
    ["Name", "Category", "Address", "Phone", "Email", "Website", "Status", "Rating", "Reviews", "Pipeline Stage", "Notes"],
    ...leads.map((l) => [
      l.name || "",
      l.category || "",
      l.address || "",
      l.phone || "",
      l.email || "",
      l.websiteUrl || "",
      l.websiteStatus || "",
      l.rating ? String(l.rating) : "",
      l.reviewCount ? String(l.reviewCount) : "",
      l.pipelineStage || "",
      l.notes || "",
    ]),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: { values },
  });

  return spreadsheet.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

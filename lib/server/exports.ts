import ExcelJS from "exceljs";

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

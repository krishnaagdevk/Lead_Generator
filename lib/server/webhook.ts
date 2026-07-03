export async function fireWebhook(url: string, event: string, payload: unknown): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
    });
    if (!res.ok) console.error(`Webhook ${url} returned ${res.status}`);
  } catch (err) {
    console.error(`Webhook ${url} failed:`, err);
  }
}
import { google } from "googleapis";

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export function encryptToken(data: TokenData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

export function decryptToken(encrypted: string): TokenData {
  return JSON.parse(Buffer.from(encrypted, "base64").toString("utf8")) as TokenData;
}

export function buildOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/email-accounts/callback"
  );
}

export function getAuthUrl(userId: number): string {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
    prompt: "consent",
    state: String(userId),
  });
}

export async function exchangeCode(code: string): Promise<{ tokens: TokenData; email: string }> {
  const client = buildOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const info = await oauth2.userinfo.get();

  return {
    tokens: {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
    },
    email: info.data.email!,
  };
}

export async function sendGmail(
  tokenData: TokenData,
  to: string,
  subject: string,
  body: string,
  trackingPixelUrl?: string
): Promise<string> {
  const client = buildOAuthClient();
  client.setCredentials(tokenData);

  const gmail = google.gmail({ version: "v1", auth: client });

  const htmlBody = body.replace(/\n/g, "<br>") +
    (trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="">` : "") +
    `<br><small style="color:#999">Reply with "unsubscribe" to opt out.</small>`;

  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join("\r\n");

  const encoded = Buffer.from(raw).toString("base64url");
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
  return res.data.id!;
}

export async function checkReplyForMessage(
  tokenData: TokenData,
  gmailMessageId: string,
  recipientEmail: string
): Promise<boolean> {
  try {
    const client = buildOAuthClient();
    client.setCredentials(tokenData);
    const gmail = google.gmail({ version: "v1", auth: client });

    const msg = await gmail.users.messages.get({ userId: "me", id: gmailMessageId });
    const threadId = msg.data.threadId;
    if (!threadId) return false;

    const thread = await gmail.users.threads.get({ userId: "me", id: threadId });
    const messages = thread.data.messages || [];

    for (const m of messages) {
      const headers = m.payload?.headers || [];
      const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";

      if (fromHeader.toLowerCase().includes(recipientEmail.toLowerCase())) {
        return true;
      }
    }
  } catch (err) {
    console.error("Error checking reply for message:", err);
  }
  return false;
}

function getBodyText(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        // Strip HTML tag wrappers basic regex
        return Buffer.from(part.body.data, "base64").toString("utf-8").replace(/<[^>]*>/g, "");
      }
      if (part.parts) {
        const subBody = getBodyText(part);
        if (subBody) return subBody;
      }
    }
  }
  return "";
}

export async function getReplyMessageBodyAndDetails(
  tokenData: TokenData,
  gmailMessageId: string,
  recipientEmail: string
): Promise<{ body: string } | null> {
  try {
    const client = buildOAuthClient();
    client.setCredentials(tokenData);
    const gmail = google.gmail({ version: "v1", auth: client });

    const msg = await gmail.users.messages.get({ userId: "me", id: gmailMessageId });
    const threadId = msg.data.threadId;
    if (!threadId) return null;

    const thread = await gmail.users.threads.get({ userId: "me", id: threadId });
    const messages = thread.data.messages || [];

    for (const m of messages) {
      const headers = m.payload?.headers || [];
      const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";

      if (fromHeader.toLowerCase().includes(recipientEmail.toLowerCase())) {
        const bodyText = getBodyText(m.payload);
        return { body: bodyText };
      }
    }
  } catch (err) {
    console.error("Error getting reply details for message:", err);
  }
  return null;
}

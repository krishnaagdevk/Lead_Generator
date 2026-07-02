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

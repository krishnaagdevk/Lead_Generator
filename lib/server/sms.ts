import twilio from "twilio";

let _client: twilio.Twilio | null = null;
function client() {
  if (!_client) _client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return _client;
}

export async function sendSMS(to: string, body: string): Promise<string> {
  const msg = await client().messages.create({
    body,
    from: process.env.TWILIO_FROM_NUMBER!,
    to,
  });
  return msg.sid;
}
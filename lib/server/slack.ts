import { WebClient } from "@slack/web-api";

let _client: WebClient | null = null;

function client(token?: string) {
  const botToken = token || process.env.SLACK_BOT_TOKEN;
  if (!botToken) return null;
  if (_client && !token) return _client;
  return new WebClient(botToken);
}

export async function sendSlackReplyNotification(options: {
  leadName: string;
  leadId: number;
  replyBody: string;
  classification: string;
  appUrl: string;
  channelId?: string;
  botToken?: string;
}): Promise<void> {
  const c = client(options.botToken);
  const channel = options.channelId || process.env.SLACK_CHANNEL_ID;
  if (!c || !channel) return;

  const classificationEmoji = {
    interested: "🔥",
    not_interested: "❌",
    meeting_requested: "📅",
    unsubscribed: "🚫",
  }[options.classification] ?? "💬";

  await c.chat.postMessage({
    channel,
    text: `${classificationEmoji} New Reply from *${options.leadName}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${classificationEmoji} *New Reply from ${options.leadName}*\n>${options.replyBody.slice(0, 200)}${options.replyBody.length > 200 ? "..." : ""}`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Open Lead →" },
          url: `${options.appUrl}/leads?drawer=${options.leadId}`,
          action_id: "open_lead",
        },
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `Classification: *${options.classification}* · via LeadHunter` }],
      },
    ],
  });
}

export async function sendSlackPipelineNotification(options: {
  leadName: string;
  leadId: number;
  fromStage: string;
  toStage: string;
  appUrl: string;
  channelId?: string;
  botToken?: string;
}): Promise<void> {
  const c = client(options.botToken);
  const channel = options.channelId || process.env.SLACK_CHANNEL_ID;
  if (!c || !channel) return;

  await c.chat.postMessage({
    channel,
    text: `📊 *${options.leadName}* moved from *${options.fromStage}* → *${options.toStage}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📊 *${options.leadName}* moved from *${options.fromStage}* to *${options.toStage}*`,
        },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: "Open Lead →" },
          url: `${options.appUrl}/leads?drawer=${options.leadId}`,
          action_id: "open_lead",
        },
      },
    ],
  });
}
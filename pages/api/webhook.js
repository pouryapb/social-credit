import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL + "webhook";

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

// Set telegram webhook
bot.telegram.setWebhook(url);

const handler = bot.webhookCallback("/webhook");

bot.on("text", (ctx) => {
  ctx.reply("Hello World!");
});

export default handler;

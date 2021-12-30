import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;
const url = process.env.NEXT_PUBLIC_VERCEL_URL + "/webhook";

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token, { telegram: { webhookReply: false } });
bot.telegram.setWebhook(url);

bot.on("text", (ctx) => {
  ctx.reply("Hello World!");
});

export default async function handler(req, res) {
  console.log(url);
  try {
    await bot.handleUpdate(req.body);
  } finally {
    res.status(200).end();
  }
}

import { Telegraf } from "telegraf";

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL + "/api/webhook";

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
bot.telegram.setWebhook(url);

bot.on("text", (ctx) => {
  ctx.reply("just to be 200% sure");
});

export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } finally {
    res.status(200).end();
  }
}

import { Telegraf } from "telegraf";
import mongoose from "mongoose";

import Chat from "../../models/chat";

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL + "/api/webhook";
const dbUrl = process.env.DB_URL;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const bot = new Telegraf(token);
bot.telegram.setWebhook(url);

bot.on("sticker", (ctx) => {
  if (["group", "supergroup"].includes(ctx.chat.type)) {
    ctx.replyWithMarkdownV2(
      `Sticker data: \`${JSON.stringify(ctx.message.sticker)}\``
    );
  } else {
    ctx.reply("I only understand stickers in groups!");
  }
});

export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } finally {
    res.status(200).end();
  }
}

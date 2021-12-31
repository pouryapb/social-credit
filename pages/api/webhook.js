import { Telegraf } from "telegraf";

import Chat from "../../models/chat";

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL + "/api/webhook";
const creditUpId = process.env.CREDIT_UP_ID;
const creditDownId = process.env.CREDIT_DOWN_ID;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
bot.telegram.setWebhook(url);

bot.on("sticker", async (ctx) => {
  if (["group", "supergroup"].includes(ctx.chat.type)) {
    if (!ctx.message.reply_to_message) return;
    if (![creditUpId, creditDownId].includes(ctx.message.sticker.file_id))
      return;

    const user = ctx.message.reply_to_message.from;
    const dir = ctx.message.sticker.file_id === creditUpId ? 1 : -1;

    if (await Chat.findOne({ chatId: ctx.chat.id }).exec()) {
      Chat.findOneAndUpdate(
        { "members.userId": user.id },
        { $inc: { "members.$.socialCredit": 20 * dir } }
      ).exec();
    } else {
      const chat = new Chat({
        chatId: ctx.chat.id,
        title: ctx.chat.title,
        members: [
          { userId: user.id, username: user.username, socialCredit: 20 * dir },
        ],
      });
      chat.save();
    }
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

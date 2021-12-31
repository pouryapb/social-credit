import { Telegraf } from "telegraf";

import dbConnect from "../../lib/dbConnect";
import Chat from "../../models/chat";

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL + "/api/webhook";

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
bot.telegram.setWebhook(url);

bot.on("sticker", async (ctx) => {
  const creditUpId = process.env.CREDIT_UP_ID;
  const creditDownId = process.env.CREDIT_DOWN_ID;

  if (!["group", "supergroup"].includes(ctx.chat.type))
    return ctx.reply("I only understand stickers in groups!");

  if (!ctx.message.reply_to_message) return console.log("No reply message");

  if (![creditUpId, creditDownId].includes(ctx.message.sticker.file_unique_id))
    return console.log("Not a credit sticker");

  await dbConnect();

  const user = ctx.message.reply_to_message.from;
  const dir = ctx.message.sticker.file_unique_id === creditUpId ? 1 : -1;

  if (await Chat.findOne({ chatId: ctx.chat.id }).exec()) {
    const sendResponse = (result) => {
      const currentCredit = result.members.find(
        (member) => member.userId === user.id
      ).socialCredit;

      ctx.reply(
        `@${user.username}'s Social Credit was ${
          dir > 0 ? "increased" : "decreased"
        } to ${currentCredit}!`
      );
    };

    // Update the user's social credit if exists
    Chat.findOneAndUpdate(
      { "members.userId": user.id },
      { $inc: { "members.$.socialCredit": 20 * dir } }
    )
      .exec()
      .then(sendResponse);

    // Create the user if it doesn't exist
    Chat.findOneAndUpdate(
      {
        members: {
          $not: { $elemMatch: { userId: user.id } },
        },
      },
      {
        $addToSet: {
          members: {
            userId: user.id,
            username: user.username,
            socialCredit: 20 * dir,
          },
        },
      }
    )
      .exec()
      .then(sendResponse);
  } else {
    const chat = new Chat({
      chatId: ctx.chat.id,
      title: ctx.chat.title,
      members: [
        { userId: user.id, username: user.username, socialCredit: 20 * dir },
      ],
    });
    await chat.save();

    ctx.reply(
      `@${user.username}'s Social Credit was ${
        dir > 0 ? "increased" : "decreased"
      } to ${20 * dir}!`
    );
  }
});

export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } finally {
    res.status(200).end();
  }
}

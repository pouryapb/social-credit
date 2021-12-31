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

  const user = ctx.message.reply_to_message.from;
  const dir = ctx.message.sticker.file_unique_id === creditUpId ? 1 : -1;

  if (user.id === ctx.message.from.id)
    return ctx.reply(
      dir > 0 ? "You sneaky bastard! 😄" : "Why do you hate yourself? 🙁"
    );

  await dbConnect();

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

    const docCount = await Chat.countDocuments({
      chatId: ctx.chat.id,
      "members.userId": user.id,
    }).exec();

    if (docCount > 0) {
      await Chat.findOneAndUpdate(
        { chatId: ctx.chat.id, "members.userId": user.id },
        { $inc: { "members.$.socialCredit": 20 * dir } },
        { new: true }
      )
        .exec()
        .then(sendResponse);
    } else {
      await Chat.findOneAndUpdate(
        { chatId: ctx.chat.id },
        {
          $push: {
            members: {
              userId: user.id,
              username: user.username,
              socialCredit: 20 * dir,
            },
          },
        },
        { new: true }
      )
        .exec()
        .then(sendResponse);
    }
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

bot.command("score", async (ctx) => {
  if (!["group", "supergroup"].includes(ctx.chat.type))
    return ctx.reply("I only understand this command in groups!");

  if (!ctx.message.reply_to_message)
    return ctx.reply("You need to reply someone!");

  await dbConnect();

  const user = ctx.message.reply_to_message.from;
  const chat = await Chat.findOne({ chatId: ctx.chat.id }).exec();

  if (!chat) return ctx.reply(`@${user.username}'s Social Credit is 0!`);

  const member = chat.members.find((m) => m.userId === user.id);

  if (!member) return ctx.reply(`@${user.username}'s Social Credit is 0!`);

  ctx.reply(`@${user.username}'s Social Credit is ${member.socialCredit}!`);
});

export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } finally {
    res.status(200).end();
  }
}

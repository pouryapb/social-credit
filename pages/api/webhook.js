import { Telegraf } from "telegraf";

import dbConnect from "../../lib/dbConnect";
import updateUser from "../../lib/updateUser";
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

  if (user.id === ctx.botInfo.id)
    return ctx.reply(dir > 0 ? "How generous! ☺️" : "What did I do? 🙁");

  await dbConnect();

  if (await Chat.findOne({ chatId: ctx.chat.id }).exec()) {
    const sendResponse = (result) => {
      const currentCredit = result.members.find(
        (member) => member.userId === user.id
      ).socialCredit;

      ctx.reply(
        `${user.first_name}'s Social Credit was ${
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
              first_name: user.first_name,
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
        {
          userId: user.id,
          first_name: user.first_name,
          username: user.username,
          socialCredit: 20 * dir,
        },
      ],
    });
    await chat.save();

    ctx.reply(
      `${user.first_name}'s Social Credit was ${
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

  if (ctx.message.reply_to_message.from.id === ctx.botInfo.id)
    return ctx.reply("I'm just a score keeper! 🤓");

  await dbConnect();

  const user = ctx.message.reply_to_message.from;
  const chat = await Chat.findOne({ chatId: ctx.chat.id }).exec();

  if (!chat) return ctx.reply(`${user.first_name}'s Social Credit is 0!`);

  const member = chat.members.find((m) => m.userId === user.id);

  if (!member) return ctx.reply(`${user.first_name}'s Social Credit is 0!`);

  ctx.reply(`${user.first_name}'s Social Credit is ${member.socialCredit}!`);
});

bot.command("list", async (ctx) => {
  if (!["group", "supergroup"].includes(ctx.chat.type))
    return ctx.reply("I only understand this command in groups!");

  await dbConnect();

  const chat = await Chat.findOne({ chatId: ctx.chat.id }).exec();

  if (!chat)
    return ctx.reply("All members in this group have 0 Social Credit!");

  const members = await Promise.all(
    chat.members
      .sort((a, b) => b.socialCredit - a.socialCredit)
      .map(async (m, index) => {
        let firstName = m.first_name;

        if (!firstName) {
          const member = await ctx.getChatMember(m.userId);
          firstName = member.user.first_name;
          await updateUser(m.userId, firstName);
        }

        let rank = index + 1;
        if (rank === 1) rank = "🥇.";
        else if (rank === 2) rank = "🥈.";
        else if (rank === 3) rank = "🥉.";
        else rank = `${rank}.`;

        return `${rank} ${firstName} (${m.socialCredit})`;
      })
  );

  const totalMembers = await ctx.getChatMembersCount();

  ctx.reply(
    `${members.join("\n")}${
      totalMembers - 1 - members.length !== 0
        ? "\n\nEveryone else has 0 Social Credit!"
        : ""
    }`
  );
});

export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } finally {
    res.status(200).end();
  }
}

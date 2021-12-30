import { Telegraf } from "telegraf";
import { json } from "micro";

const token = process.env.BOT_TOKEN;
const url = process.env.VERCEL_URL + "webhook";

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token, { telegram: { webhookReply: false } });

bot.on("text", (ctx) => {
  ctx.reply("Hello World!");
});

bot.catch((err) => console.log("Ooops", err));

module.exports = async function (req, res) {
  try {
    const body = await json(req);
    console.log(body);
    bot.handleUpdate(body);
    res.statusCode = 200;
    res.end("");
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html");
    res.end("<h1>Server Error</h1><p>Sorry, there was a problem</p>");
    console.error(e.message);
  }
};

const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");

module.exports = (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */

  if (phase === PHASE_PRODUCTION_BUILD) {
    const token = process.env.BOT_TOKEN;
    const url = process.env.VERCEL_URL + "/api/webhook";
    const dbUrl = process.env.DB_URL;
    new Telegraf(token).telegram.setWebhook(url);
    mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  return {
    reactStrictMode: true,
  };
};

const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const { Telegraf } = require("telegraf");

module.exports = (phase, { defaultConfig }) => {
  /**
   * @type {import('next').NextConfig}
   */

  if (phase === PHASE_PRODUCTION_BUILD) {
    const token = process.env.BOT_TOKEN;
    const url = process.env.VERCEL_URL + "/api/webhook";
    new Telegraf(token).telegram.setWebhook(url);
  }

  return {
    reactStrictMode: true,
  };
};

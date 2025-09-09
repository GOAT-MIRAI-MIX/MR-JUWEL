/install alldl.js const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("shaon-videos-downloader");

module.exports = {
  config: {
    name: "autodl",
    version: "0.0.5",
    hasPermssion: 0,
    credits: "𝐉𝐮𝐰𝐞𝐥 𝐂𝐡𝐚𝐭 𝐁𝐨𝐭", // ✅ তোমার নাম
    description: "Auto video downloader with emoji reaction",
    commandCategory: "user",
    usages: "",
    cooldowns: 5,
  },

  run: async function ({ api, event }) {
    return api.sendMessage(
      "✅ Auto Downloader চলছে... শুধু কোনো ভিডিওর লিংক পাঠাও।",
      event.threadID,
      event.messageID
    );
  },

  handleEvent: async function ({ api, event }) {
    try {
      const content = event.body ? event.body.trim() : "";
      if (!content.startsWith("http")) return;

      // 🎭 Platform detect
      let emoji = "🔗";
      let platform = "Video";

      if (content.includes("tiktok.com")) {
        emoji = "🎵";
        platform = "TikTok Video";
      } else if (content.includes("youtube.com") || content.includes("youtu.be")) {
        emoji = "▶️";
        platform = "YouTube Video";
      } else if (content.includes("facebook.com") || content.includes("fb.watch")) {
        emoji = "📘";
        platform = "Facebook Video";
      } else if (content.includes("instagram.com")) {
        emoji = "📸";
        platform = "Instagram Video";
      } else if (content.includes("imgur.com")) {
        emoji = "🖼️";
        platform = "Imgur Media";
      }

      // Start reaction
      api.setMessageReaction(emoji, event.messageID, () => {}, true);

      // Download info আনো
      const data = await alldown(content);
      if (!data || !data.url) {
        return api.sendMessage(
          "❌ Sorry! Video link not supported or invalid.",
          event.threadID,
          event.messageID
        );
      }

      // Download video
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      const videoBuffer = (
        await axios.get(data.url, { responseType: "arraybuffer" })
      ).data;

      const filePath = __dirname + "/cache/auto.mp4";
      fs.writeFileSync(filePath, Buffer.from(videoBuffer, "utf-8"));

      // Success reaction
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Send video with platform + name
      return api.sendMessage(
        {
          body: `${emoji} ${platform}\n👤 Requested by:𝐉𝐮𝐰𝐞𝐥 𝐂𝐡𝐚𝐭 𝐁𝐨𝐭\n\n 𝐌𝐑 𝐉𝐔𝐖𝐄𝐋 𝐂𝐡𝐚𝐭| 𝐁𝐨𝐱 \n📥𝗔𝘂𝘁𝗼 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿 \n🎬 𝐄𝐧𝐣𝐨𝐲 𝐭𝐡𝐞 𝐕𝐢𝐝𝐞𝐨 🎀`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (e) {
      api.setMessageReaction("❎", event.messageID, () => {}, true);
      return api.sendMessage(
        `⚠️ Download failed!\n\nError: ${e.message}`,
        event.threadID,
        event.messageID
      );
    }
  },
};

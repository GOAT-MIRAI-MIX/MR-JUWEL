const axios = require("axios");

module.exports = {
  config: {
    name: "ai",
    version: "1.0.1",
    credit: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "google ai",
    cooldowns: 0,
    hasPermssion: 0,
    commandCategory: "google",
    usages: {
      en: "{pn} message | photo reply"
    }
  },

  run: async ({ api, args, event }) => {
    const input = args.join(" ");
    const encodedApi = "aHR0cHM6Ly9hcGlzLWtlaXRoLnZlcmNlbC5hcHAvYWkvZGVlcHNlZWtWMz9xPQ==";
    const apiUrl = Buffer.from(encodedApi, "base64").toString("utf-8");

    if (event.type === "message_reply") {
      try {
        const imageUrl = event.messageReply.attachments[0]?.url;
        if (!imageUrl)
          return api.sendMessage("Please reply to an image.", event.threadID, event.messageID);

        const res = await axios.post(`${apiUrl}${encodeURIComponent(input || "Describe this image.")}`, {
          image: imageUrl
        });

        const result = res.data.result || res.data.response || res.data.message || "No response from AI.";
        api.sendMessage(result, event.threadID, event.messageID);
      } catch (err) {
        console.error("Error:", err.message);
        api.sendMessage("processing.....", event.threadID, event.messageID);
      }
    } else {
      if (!input) {
        return api.sendMessage(
          "Hey I'm Ai Chat Bot\nHow can I assist you today?",
          event.threadID,
          event.messageID
        );
      }

      try {
        const res = await axios.get(`${apiUrl}${encodeURIComponent(input)}`);
        const result = res.data.result || res.data.response || res.data.message || "No response from AI.";
        api.sendMessage(result, event.threadID, event.messageID);
      } catch (err) {
        console.error("Error:", err.message);
        api.sendMessage("Boss SAHU re Dakh ei file gece 😑", event.threadID, event.messageID);
      }
    }
  }
};

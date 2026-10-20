const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: "4k",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SHAHADAT SAHU", //don't change credit
    description: "Enhance Photo - Reply with image to upscale",
    commandCategory: "Image Editing Tools",
    usages: "Reply to an image",
    cooldowns: 5
  },

  handleEvent: async ({ api, event }) => {
    const { body, messageReply, threadID, messageID } = event;
    if (body?.toLowerCase().trim() === "4k") {
      if (!messageReply?.attachments?.length)
        return api.sendMessage("📸 Please reply to an image!", threadID, messageID);

      await processImage(api, threadID, messageID, messageReply);
    }
  },

  run: async ({ api, event }) => {
    const { threadID, messageID, messageReply } = event;
    if (!messageReply?.attachments?.length)
      return api.sendMessage("📸 Reply to an image to enhance!", threadID, messageID);

    await processImage(api, threadID, messageID, messageReply);
  }
};

async function processImage(api, threadID, messageID, messageReply) {
  const tempPath = __dirname + "/cache/4k.jpg";
  const img = messageReply.attachments[0].url;

  try {
    const configUrl =
      "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/refs/heads/main/SAHU-API.json";

    const apiConfig = await axios.get(configUrl);
    const apiUrl = apiConfig.data["4k"];

    const wait = await api.sendMessage("⏳ Enhancing your photo in 4K...", threadID);

    const enhanceUrl = `${apiUrl}?imageUrl=${encodeURIComponent(img)}`;
    const res = await axios.get(enhanceUrl);
    const resultImg = res.data?.result;

    if (!resultImg) throw new Error("No result");

    const buffer = (await axios.get(resultImg, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(tempPath, Buffer.from(buffer, "binary"));

    api.sendMessage(
      {
        body: "✔️ 4K Enhance Successful!",
        attachment: fs.createReadStream(tempPath)
      },
      threadID,
      () => fs.unlinkSync(tempPath),
      messageID
    );

    api.unsendMessage(wait.messageID);
  } catch (e) {
    api.sendMessage("❌ API Error! Boss JUWEL ke message din!", threadID, messageID);
  }
}

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "1.0",
    author: "Saimx69x | API Renz",
    countDown: 5,
    role: 0,
    shortDescription: "Edit image using FluxKontext API",
    longDescription: "Edit an uploaded image based on your prompt using FluxKontext API.",
    category: "ai-image-edit",
    guide: "{p}edit [prompt] (reply to image)"
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    const repliedImage = event.messageReply?.attachments?.[0];

    if (!repliedImage || repliedImage.type !== "photo") {
      return message.reply(
        "⚠️ Please reply to a photo **and** provide a prompt to edit it.\nExample: /edit Make it cartoon style"
      );
    }

    if (!prompt) {
      return message.reply(
        "⚠️ Please provide a prompt to edit the image.\nExample: /edit Make it cartoon style"
      );
    }

    const processingMsg = await message.reply("⏳ Processing your image...");

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_edit.jpg`);

    try {
      const imgURL = repliedImage.url;
      const apiURL = `https://dev.oculux.xyz/api/fluxkontext?prompt=${encodeURIComponent(prompt)}&ref=${encodeURIComponent(imgURL)}`;
      
      const res = await axios.get(apiURL, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

      await api.unsendMessage(processingMsg.messageID);
      message.reply({
        body: `✅ Edited image for: "${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      });

    } catch (err) {
      console.error("EDIT Error:", err);
      await api.unsendMessage(processingMsg.messageID);
      message.reply("❌ Failed to edit image. Please try again later.");
    } finally {
      if (fs.existsSync(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};

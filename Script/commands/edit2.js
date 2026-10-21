const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_ENDPOINT = "https://tawsif.is-a.dev/gemini/nano-banana";

module.exports = {
  config: {
    name: "editpro",
    aliases: ["edit2", "nanopro"],
    version: "1.0",
    author: "MOHAMMAD AKASH",
    countDown: 5,
    role: 0,
    shortDescription: "AI image editing from prompt + image",
    longDescription: "Reply to an image or send URL with prompt, and AI will edit the image.",
    category: "image",
    guide: {
      en: "{pn} <prompt> <image_url>\nReply to an image: {pn} <prompt>"
    }
  },

  onStart: async function ({ message, event, args }) {
    try {
      let prompt = args.join(" ").trim();
      let imageUrl;

      // If user replied to an image
      if (event.messageReply && event.messageReply.attachments?.length > 0) {
        const att = event.messageReply.attachments[0];
        if (att.type === "photo") imageUrl = att.url;
      }

      // If message contains a URL
      if (!imageUrl) {
        const findUrl = args.find(x => x.startsWith("http"));
        if (findUrl) {
          imageUrl = findUrl;
          prompt = prompt.replace(findUrl, "").trim();
        }
      }

      if (!imageUrl)
        return message.reply("❌ Please reply to an image or provide an image URL.");

      if (!prompt)
        return message.reply("❌ Please write a prompt.\nExample: !editpro cartoon effect");

      await message.reply("⏳ Processing your image...");

      const apiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;
      const res = await axios.get(apiUrl);

      if (!res.data.success || !res.data.imageUrl)
        throw new Error(res.data.error || "Invalid API response");

      const editedURL = res.data.imageUrl;

      // Download edited image
      const imgStream = await axios.get(editedURL, { responseType: "stream" });

      const cache = path.join(__dirname, "cache");
      if (!fs.existsSync(cache)) fs.ensureDirSync(cache);

      const filePath = path.join(cache, `edit_${Date.now()}.png`);
      const writer = fs.createWriteStream(filePath);

      imgStream.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await message.reply({
        body: `✨ Edited image generated!\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      return message.reply("❌ Failed to edit the image.\nError: " + err.message);
    }
  }
};

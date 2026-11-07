const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "kiss1",
    aliases: ["kis"],
    version: "1.0",
    author: "Talha",
    countDown: 5,
    role: 0,
    description: "Send a kiss gif to the mentioned user",
    category: "love",
  },

  onStart: async function ({ message, event }) {
    try {
      const mentions = Object.keys(event.mentions);

      if (!mentions.length) {
        return message.reply("༻﹡﹡﹡﹡﹡﹡﹡༺\n\n𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗮𝗴 𝗼𝗻𝗲 𝗽𝗲𝗿𝘀𝗼𝗻 ❗\n\n༻﹡﹡﹡﹡﹡﹡﹡༺");
      }

      const userID = mentions[0];
      const tagName = event.mentions[userID].replace("@", "");

      const kissGifs = [
        "https://i.postimg.cc/yxDKkJyH/02d4453f3eb0a76a87148433395b3ec3.gif",
        "https://i.postimg.cc/nLTf2Kdx/1483589602-6b6484adddd5d3e70b9eaaaccdf6867e.gif",
        "https://i.postimg.cc/Wpyjxnsb/574fcc797b21e-1533876813029926506824.gif",
        "https://i.postimg.cc/xdsT8SVL/kiss-anime.gif",
      ];

      const randomGif = kissGifs[Math.floor(Math.random() * kissGifs.length)];

      // Cache ফোল্ডার বানানো যদি না থাকে
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const gifPath = path.join(cacheDir, `kiss_${Date.now()}.gif`);

      // GIF ডাউনলোড করা
      const response = await axios.get(randomGif, { responseType: "arraybuffer" });
      fs.writeFileSync(gifPath, Buffer.from(response.data, "binary"));

      // মেসেজ পাঠানো
      await message.reply({
        body: `⚝──⭒─⭑─⭒──⚝\n\n@${tagName}, 𝐁𝐚𝐞 𝐠𝐢𝐯𝐞 𝐦𝐞 𝐚 𝐬𝐰𝐞𝐞𝐭 𝐤𝐢𝐬𝐬 💞\n\n⚝──⭒─⭑─⭒──⚝`,
        mentions: [{ tag: tagName, id: userID }],
        attachment: fs.createReadStream(gifPath),
      });

      // GIF ফাইল ডিলিট করা
      fs.unlinkSync(gifPath);

    } catch (err) {
      console.error("Kiss command error:", err);
      return message.reply(`❌ Error: ${err.message}`);
    }
  },
};

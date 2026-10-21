const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pet",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "nexo | Converted by MR JUWEL",
  description: "Pet a tagged user with image/video",
  commandCategory: "fun",
  usages: "pet @mention",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  try {
    // ✅ mention check
    if (!event.mentions || Object.keys(event.mentions).length === 0) {
      return api.sendMessage(
        "❌ একজন ইউজারকে mention করুন\n\nউদাহরণ: pet @user",
        event.threadID,
        event.messageID
      );
    }

    const userID = Object.keys(event.mentions)[0];
    const userName = await Users.getNameUser(userID);

    // ✅ cache folder
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/pet?userid=${userID}`;

    const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
    const contentType = res.headers["content-type"];

    let ext = "jpg";
    if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("mp4")) ext = "mp4";

    const filePath = path.join(cachePath, `pet_${userID}.${ext}`);
    fs.writeFileSync(filePath, res.data);

    // ✅ send message
    api.sendMessage(
      {
        body: `🐾 𝒀𝒐𝒖 𝒑𝒆𝒕𝒕𝒆𝒅 ${userName} 💖`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );

  } catch (err) {
    console.error("❌ Pet command error:", err);
    api.sendMessage(
      "⚠️ Pet image/video generate করতে সমস্যা হয়েছে!",
      event.threadID,
      event.messageID
    );
  }
};

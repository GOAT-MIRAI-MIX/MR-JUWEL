const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
  name: "goru",
  version: "2.3",
  hasPermssion: 0,
  credits: "ARIJIT × Ere'rious",
  description: "Tag/reply someone to make them a cow 😂",
  commandCategory: "fun",
  usages: "@mention / reply",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
  let targetID;

  // mention
  if (Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
  }

  // reply
  if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
  }

  if (!targetID) {
    return api.sendMessage(
      "❗ কাউকে tag বা reply কর 😹",
      event.threadID,
      event.messageID
    );
  }

  if (targetID === event.senderID) {
    return api.sendMessage(
      "❗ নিজেকে গরু বানাতে চাও কেন ভাই 🐮",
      event.threadID,
      event.messageID
    );
  }

  try {
    const waitMsg = await api.sendMessage(
      "⌛️ Wait কর...",
      event.threadID
    );

    // avatar fetch
    async function fetchAvatar(uid) {
      try {
        const url = `https://graph.facebook.com/${uid}/picture?width=720&height=720`;
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 15000
        });
        return Buffer.from(res.data);
      } catch (e) {
        const fallback = await Users.getAvatarUrl(uid);
        const res = await axios.get(fallback, {
          responseType: "arraybuffer"
        });
        return Buffer.from(res.data);
      }
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const bgPath = path.join(cacheDir, "cow_bg.jpg");

    let bgImage;
    if (!fs.existsSync(bgPath)) {
      const cowUrl = "https://files.catbox.moe/ecebko.jpg";
      const bgRes = await axios.get(cowUrl, {
        responseType: "arraybuffer"
      });
      await fs.writeFile(bgPath, bgRes.data);
    }

    bgImage = await loadImage(bgPath);

    const avatarBuffer = await fetchAvatar(targetID);
    const avatarImage = await loadImage(avatarBuffer);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImage, 0, 0);

    const avatarSize = 135;
    const x = 80;
    const y = 60;

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      x + avatarSize / 2,
      y + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();
    ctx.drawImage(avatarImage, x, y, avatarSize, avatarSize);
    ctx.restore();

    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "white";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 5;
    ctx.fillText("Kire chdna", 40, 50);

    const outPath = path.join(
      cacheDir,
      `goru_${targetID}_${Date.now()}.png`
    );
    await fs.writeFile(outPath, canvas.toBuffer());

    const name = await Users.getNameUser(targetID);

    await api.sendMessage(
      {
        body: `🤣😹\n${name} একদম আসল গরু হয়ে গেছে 🐮`,
        mentions: [{ tag: name, id: targetID }],
        attachment: fs.createReadStream(outPath)
      },
      event.threadID
    );

    api.unsendMessage(waitMsg.messageID);
    setTimeout(() => fs.unlink(outPath).catch(() => {}), 5000);

  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "⚠️ কিছু একটা সমস্যা হয়েছে 🙂",
      event.threadID,
      event.messageID
    );
  }
};

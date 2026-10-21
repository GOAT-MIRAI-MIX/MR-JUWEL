const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

function expToLevel(exp) {
  if (exp < 0) return 0;
  return Math.floor((Math.sqrt(1 + (4 * exp) / 3) + 1) / 2);
}
function expForLevel(level) {
  return Math.ceil((3 * level * (level - 1)) / 4);
}

module.exports.config = {
  name: "rank",
  aliases: ["level", "rankcard"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MR JUWEL",
  description: "আপনার (বা রিপ্লাই/মেনশন করা ইউজারের) লেভেল-র‍্যাঙ্ক কার্ড দেখুন",
  commandCategory: "economy",
  usages: "[reply/mention]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Currencies, Users }) {
  const { threadID, messageID } = event;

  let targetID = String(event.senderID);
  if (event.messageReply) targetID = String(event.messageReply.senderID);
  else if (event.mentions && Object.keys(event.mentions).length) targetID = String(Object.keys(event.mentions)[0]);

  const cur = (await Currencies.getData(targetID)) || { money: 0, exp: 0 };
  const name = (await Users.getNameUser(targetID)) || "Facebook User";

  const exp = cur.exp || 0;
  const money = cur.money || 0;
  const level = expToLevel(exp);
  const curLevelExp = expForLevel(level);
  const nextLevelExp = expForLevel(level + 1);
  const progress = Math.max(0, Math.min(1, (exp - curLevelExp) / ((nextLevelExp - curLevelExp) || 1)));

  const width = 800, height = 280;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#1f1c2c");
  grad.addColorStop(1, "#5b5a8f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  try {
    const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;
    const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
    const avatar = await loadImage(Buffer.from(res.data));
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 140, 90, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 50, 180, 180);
    ctx.restore();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(140, 140, 90, 0, Math.PI * 2, true);
    ctx.stroke();
  } catch (e) { /* avatar না পেলেও কার্ড বানানো থেমে থাকবে না */ }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(name, 270, 100);

  ctx.font = "24px sans-serif";
  ctx.fillText(`🏷️ Level: ${level}`, 270, 145);
  ctx.fillText(`💰 Money: ${money}`, 270, 180);
  ctx.fillText(`✨ EXP: ${exp}`, 270, 215);

  const barX = 270, barY = 235, barW = 480, barH = 24;
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(barX, barY, barW * progress, barH);
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(barX, barY, barW, barH);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = path.join(cacheDir, `rank_${targetID}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

  return api.sendMessage(
    {
      body: `🏆 ${name} এর র‍্যাঙ্ক কার্ড`,
      attachment: fs.createReadStream(filePath)
    },
    threadID,
    () => { try { fs.unlinkSync(filePath); } catch (e) {} },
    messageID
  );
};

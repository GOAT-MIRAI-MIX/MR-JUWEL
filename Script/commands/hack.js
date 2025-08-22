const axios = require('axios');
const fs = require('fs-extra');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
 config: {
 name: "hack",
 version: "1.0.3",
 hasPermssion: 0,
 usePrefix: true,
 credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑀_ ☢️",
 description: "Prank friends with hack simulation",
 commandCategory: "Group",
 usages: "@mention",
 cooldowns: 0
 },

 wrapText: async function (ctx, text, maxWidth) {
 return new Promise((resolve) => {
 if (ctx.measureText(text).width < maxWidth) return resolve([text]);
 const words = text.split(" ");
 const lines = [];
 let line = "";

 while (words.length > 0) {
 let split = false;

 while (ctx.measureText(words[0]).width >= maxWidth) {
 const temp = words[0];
 words[0] = temp.slice(0, -1);

 if (split) {
 words[1] = `${temp.slice(-1)}${words[1]}`;
 } else {
 split = true;
 words.splice(1, 0, temp.slice(-1));
 }
 }

 if (ctx.measureText(line + words[0]).width < maxWidth) {
 line += `${words.shift()} `;
 } else {
 lines.push(line.trim());
 line = "";
 }

 if (words.length === 0) lines.push(line.trim());
 }

 return resolve(lines);
 });
 },

 run: async function ({ args, usersData, threadsData, api, event }) {
 const cachePath = __dirname + "/cache";
 if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

 const pathImg = cachePath + "/background.png";
 const pathAvt1 = cachePath + "/Avtmot.png";
 const mentionID = Object.keys(event.mentions)[0] || event.senderID;
 const userInfo = await api.getUserInfo(mentionID);
 const name = userInfo[mentionID].name;

 const backgroundUrl = "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ";
 const avatarUrl = `https://graph.facebook.com/${mentionID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

 try {
 const avatarBuffer = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
 fs.writeFileSync(pathAvt1, Buffer.from(avatarBuffer, "utf-8"));

 const bgBuffer = (await axios.get(backgroundUrl, { responseType: "arraybuffer" })).data;
 fs.writeFileSync(pathImg, Buffer.from(bgBuffer, "utf-8"));

 const baseImage = await loadImage(pathImg);
 const baseAvt1 = await loadImage(pathAvt1);
 const canvas = createCanvas(baseImage.width, baseImage.height);
 const ctx = canvas.getContext("2d");

 ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
 ctx.font = "400 23px Arial";
 ctx.fillStyle = "#1878F3";
 ctx.textAlign = "start";

 const lines = await this.wrapText(ctx, name, 1160);
 ctx.fillText(lines.join("\n"), 200, 497);

 ctx.beginPath();
 ctx.drawImage(baseAvt1, 83, 437, 100, 101);

 const imageBuffer = canvas.toBuffer();
 fs.writeFileSync(pathImg, imageBuffer);
 fs.removeSync(pathAvt1);

 return api.sendMessage({
 body: "✅ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮 𝙃𝙖𝙘𝙠𝙚𝙙 𝙏𝙝𝙞𝙨 𝙐𝙨𝙚𝙧! My Lord, Please Check Your Inbox.",
 attachment: fs.createReadStream(pathImg)
 }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);

 } catch (error) {
 console.error("Hack module error:", error);
 return api.sendMessage("❌ একটি সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।", event.threadID, event.messageID);
 }
 }
};

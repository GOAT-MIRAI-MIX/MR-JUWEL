module.exports.config = {
 name: "fork",
 version: "2.0.4",
 hasPermssion: 0,
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 description: "Stable fork system",
 commandCategory: "other",
 usages: "fork",
 cooldowns: 3,
};

const fs = require("fs-extra");
const axios = require("axios");

module.exports.run = async function({ api, event }) {

 const repo = "MR-JUWEL-CHAT-BOT2026/MR-JUWEL-CHAT-BOT-2026";
 const repoLink = `https://github.com/${repo}`;

 const msg = `
━━━━━━━━━━━━━━━━━━━━━━
乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
𝗕𝗢𝗦𝗦 𝗔𝗥 𝗙𝗢𝗥𝗞 𝗟𝗶𝗡𝗞
━━━━━━━━━━━━━━━━━━━━━━

📌 Repo: ${repoLink}

━━━━━━━━━━━━━━━━━━━━━━
𝗠𝗥 𝗝𝗨𝗪𝗘𝗟 𝗖𝗛𝗔𝗧 𝗕𝗢𝗧
━━━━━━━━━━━━━━━━━━━━━━
`;

 const imageUrl = "https://i.postimg.cc/3J9mQk5V/banner.jpg";
 const path = __dirname + "/cache/fork.jpg";

 try {
 const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
 fs.writeFileSync(path, Buffer.from(img.data));

 return api.sendMessage({
 body: msg,
 attachment: fs.createReadStream(path)
 }, event.threadID, () => fs.unlinkSync(path), event.messageID);

 } catch (e) {
 return api.sendMessage(msg, event.threadID, event.messageID);
 }
};

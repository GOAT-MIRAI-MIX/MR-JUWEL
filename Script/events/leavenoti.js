module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "3.0.0",
  credits: "𝐌𝐑 𝐉𝐔𝐖𝐄𝐋",
  description: "Kick detect with kicker name + frame + cooldown",
  dependencies: {
    "fs-extra": "",
    "path": ""
  }
};

const cooldown = new Map();

module.exports.run = async function ({ api, event, Users }) {
  try {
    const { createReadStream, existsSync, mkdirSync } = require("fs-extra");
    const { join } = require("path");

    const threadID = event.threadID;
    const leftID = event.logMessageData.leftParticipantFbId;
    const authorID = event.author;

    // ❌ Bot ignore
    if (leftID == api.getCurrentUserID()) return;

    // ❌ Self leave ignore
    if (leftID == authorID) return;

    // ⏱️ Cooldown 20s
    if (cooldown.has(threadID)) return;
    cooldown.set(threadID, true);
    setTimeout(() => cooldown.delete(threadID), 20000);

    // ✅ Left user name
    let leftName = global.data.userName.get(leftID);
    if (!leftName) {
      leftName = await Users.getNameUser(leftID);
      global.data.userName.set(leftID, leftName);
    }

    // ✅ Kicker name (SMART DETECT)
    let kickerName = global.data.userName.get(authorID);
    if (!kickerName) {
      kickerName = await Users.getNameUser(authorID);
      global.data.userName.set(authorID, kickerName);
    }

    // 🎯 Message with frame + kicker info
    const msg = `
╔═════════════════╗
║ 🚫 GROUP REMOVE 🚫 ║
╠═════════════════╣
👤 Name: ${leftName}
⚡ Kicked By: ${kickerName}
━━━━━━━━━━━━━━━━━━━
😡 তোমার এই গ্রুপে থাকার কোনো যোগ্যাতা নেই ছাগল!
🤪 তাই তোমাকে লাথি মেরে গ্রুপ থেকে বের করে দেওয়া হলো!
🤧 WELLCOME REMOVE🫡👋
╚══════════════════╝
`;

    // 📂 GIF system
    const folder = join(__dirname, "cache", "leaveGif");
    const gifPath = join(folder, "leave.gif");

    if (!existsSync(folder)) mkdirSync(folder, { recursive: true });

    if (existsSync(gifPath)) {
      return api.sendMessage({
        body: msg,
        attachment: createReadStream(gifPath)
      }, threadID);
    } else {
      return api.sendMessage(msg, threadID);
    }

  } catch (err) {
    console.log("Leave error:", err);
  }
};

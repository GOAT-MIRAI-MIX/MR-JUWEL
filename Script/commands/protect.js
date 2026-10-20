const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "protect",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "MOHAMMAD AKASH | Fixed by ChatGPT",
  description: "Lock group avatar, name, nickname, emoji, theme",
  commandCategory: "group",
  usages: "protect on | protect off",
  cooldowns: 5
};

// =======================
// RUN COMMAND
// =======================
module.exports.run = async ({ api, event, args }) => {
  const threadID = event.threadID;
  const path = __dirname + `/cache/protect_${threadID}.json`;

  if (!args[0] || !["on", "off"].includes(args[0])) {
    return api.sendMessage(
      "Use:\nprotect on\nprotect off",
      threadID,
      event.messageID
    );
  }

  // ========== PROTECT ON ==========
  if (args[0] === "on") {
    const threadInfo = await api.getThreadInfo(threadID);

    const data = {
      name: threadInfo.threadName || "",
      emoji: threadInfo.emoji || "👍",
      theme: threadInfo.threadColor || "#0084ff",
      avatar: threadInfo.imageSrc || "REMOVE",
      nickname: {}
    };

    threadInfo.userInfo.forEach(u => {
      data.nickname[u.id] = u.nickname || "";
    });

    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    return api.sendMessage(
      "🛡 PROTECT MODE: ON\n\n" +
      "✔ Avatar Locked\n" +
      "✔ Name Locked\n" +
      "✔ Nickname Locked\n" +
      "✔ Theme Locked\n" +
      "✔ Emoji Locked",
      threadID,
      event.messageID
    );
  }

  // ========== PROTECT OFF ==========
  if (args[0] === "off") {
    if (fs.existsSync(path)) fs.unlinkSync(path);

    return api.sendMessage(
      "🔓 PROTECT MODE: OFF\nAll group locks removed.",
      threadID,
      event.messageID
    );
  }
};

// =======================
// HANDLE EVENT (AUTO RESTORE)
// =======================
module.exports.handleEvent = async ({ api, event }) => {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();
  const path = __dirname + `/cache/protect_${threadID}.json`;

  if (!fs.existsSync(path)) return;
  if (author === botID) return;

  const data = JSON.parse(fs.readFileSync(path));

  // ===== GROUP NAME PROTECT =====
  if (logMessageType === "log:thread-name") {
    api.setTitle(data.name, threadID);
    api.sendMessage("⚠ Group name is locked!", threadID);
  }

  // ===== GROUP AVATAR PROTECT =====
  if (logMessageType === "log:thread-image") {
    if (data.avatar === "REMOVE") {
      api.changeGroupImage("", threadID);
    } else {
      try {
        const img = (await axios.get(data.avatar, { responseType: "stream" })).data;
        api.changeGroupImage(img, threadID);
      } catch (e) {
        api.sendMessage("⚠ Avatar restore failed!", threadID);
      }
    }
  }

  // ===== NICKNAME PROTECT =====
  if (logMessageType === "log:user-nickname") {
    const uid = logMessageData.participant_id;
    api.changeNickname(
      data.nickname[uid] || "",
      threadID,
      uid
    );
    api.sendMessage("⚠ Nickname is locked!", threadID);
  }

  // ===== THEME / COLOR PROTECT =====
  if (logMessageType === "log:thread-color") {
    api.changeThreadColor(data.theme || "#0084ff", threadID);
    api.sendMessage("⚠ Theme is locked!", threadID);
  }

  // ===== EMOJI PROTECT =====
  if (logMessageType === "log:thread-icon") {
    api.changeThreadEmoji(data.emoji || "👍", threadID);
    api.sendMessage("⚠ Emoji is locked!", threadID);
  }
};

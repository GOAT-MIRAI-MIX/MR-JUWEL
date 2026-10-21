const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "antiProtect",
  version: "3.0.0",
  credits: "SHAHADAT SAHU",
  description: "Protect group name and photo",
  eventType: ["log:thread-name", "log:thread-icon"],
  cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
  try {
    const threadID = event.threadID;
    const senderID = event.author || event.senderID;

    const dir = `${__dirname}/../../cache/antiProtect/`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const dataFile = dir + `${threadID}.json`;

    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = (threadInfo.adminIDs || []).map(i => i.id);
    const botID = api.getCurrentUserID();
    const isAdmin = adminIDs.includes(senderID);
    const botAdmin = adminIDs.includes(botID);
    if (!botAdmin) return;

    if (!fs.existsSync(dataFile)) {
      const snap = {
        name: threadInfo.threadName || "",
        image: threadInfo.imageSrc || null
      };
      fs.writeFileSync(dataFile, JSON.stringify(snap, null, 2));
      return;
    }

    const old = JSON.parse(fs.readFileSync(dataFile));

    if (isAdmin || senderID == botID) {
      const snap = {
        name: threadInfo.threadName,
        image: threadInfo.imageSrc
      };
      fs.writeFileSync(dataFile, JSON.stringify(snap, null, 2));
      return;
    }

    switch (event.logMessageType) {

      case "log:thread-name": {
        await api.setTitle(old.name, threadID).catch(() => {});
        return api.sendMessage(
          `🚫 Group name change blocked!\n👤 User: ${senderID}\nReverted to: "${old.name}"`,
          threadID
        );
      }

      case "log:thread-icon": {
        try {
          if (old.image) {
            const res = await axios.get(old.image, { responseType: "arraybuffer" });
            const buf = Buffer.from(res.data, "binary");
            await api.changeGroupImage(buf, threadID);
          }
        } catch {}
        return api.sendMessage(
          `🚫 Group photo change blocked!\n👤 User: ${senderID}\nOld photo restored.`,
          threadID
        );
      }
    }
  } catch (e) {
    console.log("antiProtect Error:", e);
  }
};

module.exports.config = {
  name: "blacklistuser",
  eventType: ["log:subscribe"],
  version: "5.0.0",
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Auto kick blacklisted users (JSON + 20 slot support)"
};

const fs = require("fs-extra");
const path = require("path");

// ✅ SAME PATH as main blacklist file
const filePath = path.join(__dirname, "../events/cache/blacklist.json");

// 📥 Load JSON
function load() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(filePath));
  } catch {
    return [];
  }
}

module.exports.run = async function ({ api, event }) {
  try {
    if (event.logMessageType !== "log:subscribe") return;
    if (!event.logMessageData?.addedParticipants) return;

    const threadID = event.threadID;

    // ✅ JSON list
    const jsonList = load().map(String);

    // ✅ 20 SLOT list from command
    let slotList = [];
    try {
      const blacklistCmd = require("../commands/blacklist.js");
      slotList = (blacklistCmd.config.blacklistedUIDs || []).map(String);
    } catch {}

    // 🔥 MERGE BOTH
    const blacklist = [...new Set([...jsonList, ...slotList])];

    // 🛡️ Check bot admin
    let isAdmin = false;
    try {
      const info = await api.getThreadInfo(threadID);
      isAdmin = info.adminIDs.some(e => e.id == api.getCurrentUserID());
    } catch {}

    for (const user of event.logMessageData.addedParticipants) {
      const uid = String(user.userFbId);

      if (blacklist.includes(uid)) {

        if (isAdmin) {

          // 🔥 MESSAGE FIRST
          await api.sendMessage(
`┏━━━━━━━━━━━━━━━━━┓
┃ 🚫 𝘽𝙇𝘼𝘾𝙆𝙇𝙄𝙎𝙏 𝘼𝙇𝙀𝙍𝙏
┣━━━━━━━━━━━━━━━━━┫
┃ 👤 নাম: ${user.fullName}
┃ 🆔 UID: ${uid}
┃ ❌ স্ট্যাটাস: ব্ল্যাকলিস্ট
┣━━━━━━━━━━━━━━━━━┫
┃ 📛 কারণ:
┃ তুই আমার বস 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐ এর সাথে
┃ আর তার গুপে বাল"পাকনামি করার জন্য
┃ তোকে বস ব্লক"লিস্টে রাখছে
┃ তুই এই গুপে এড হতে পারবি না
┃ কিক খা 🥵🤌🤧🦵
┣━━━━━━━━━━━━━━━━━┫
┃ ⚡ অ্যাকশন: KICK SOON...
┗━━━━━━━━━━━━━━━━━┛`,
            threadID
          );

          // ⏳ delay
          await new Promise(r => setTimeout(r, 1200));

          // 🔥 KICK
          try {
            await api.removeUserFromGroup(uid, threadID);
          } catch {}

        } else {
          await api.sendMessage(
`⚠️ BLACKLIST WARNING

👤 ${user.fullName}
🆔 ${uid}

❌ ব্ল্যাকলিস্টেড
😢 বট অ্যাডমিন না`,
            threadID
          );
        }
      }
    }

  } catch (e) {
    console.log("Blacklist Error:", e);
  }
};

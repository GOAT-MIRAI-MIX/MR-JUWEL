module.exports.config = {
  name: "joinnoti",
  eventType: ["log:subscribe"],
  version: "7.2.0",
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Ultra Join System + VIP + Daily Report + 10 Frame Auto System",
  dependencies: {
    "axios": "",
    "moment-timezone": "",
    "fs-extra": ""
  }
};

const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const axios = require("axios");

const cooldown = {};
const VIP_UID = ["61593603338850"];

const filePath = path.join(__dirname, "cache", "dailyJoin.json");

/* ================= ENSURE FILE ================= */
function ensureFile() {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
}

/* ================= LOAD DATA ================= */
function loadData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(filePath));
}

/* ================= SAVE DATA ================= */
function saveData(data) {
  ensureFile();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* ================= GET USER AVATAR ================= */
async function getUserAvatar(uid) {
  try {
    const response = await axios.get(`https://graph.facebook.com/${uid}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
      responseType: 'stream'
    });
    return response.data;
  } catch (e) {
    return null;
  }
}

/* ================= GET USER INFO ================= */
async function getUserInfo(api, uid) {
  try {
    const info = await api.getUserInfo(uid);
    return info[uid];
  } catch (e) {
    return null;
  }
}

/* ================= MAIN EVENT ================= */
module.exports.run = async function ({ api, event, Users }) {
  try {
    const { threadID, author } = event;

    const now = Date.now();
    const today = moment.tz("Asia/Dhaka").format("DD-MM-YYYY");

    const prefix = global.config.PREFIX || "/";

    const threadInfo = await api.getThreadInfo(threadID);
    const totalMembers = threadInfo.participantIDs.length;
    const allMembers = threadInfo.participantIDs;

    let data = loadData();

    if (!data[threadID]) data[threadID] = { date: today, count: 0 };

    if (data[threadID].date !== today) {
      data[threadID].date = today;
      data[threadID].count = 0;
    }

    /* ================= AUTO FRAME ROTATE ================= */
    if (!global.autoFrameIndex) global.autoFrameIndex = {};
    if (!global.autoFrameIndex[threadID]) {
      global.autoFrameIndex[threadID] = 1;
    } else {
      global.autoFrameIndex[threadID]++;
      if (global.autoFrameIndex[threadID] > 10) {
        global.autoFrameIndex[threadID] = 1;
      }
    }

    const frame = global.autoFrameIndex[threadID];

    /* ================= BOT JOIN ================= */
    if (
      event.logMessageData.addedParticipants.some(
        u => u.userFbId == api.getCurrentUserID()
      )
    ) {
      return api.sendMessage(
`┌───🤖────🤖───┐
│ 𝐑𝐈𝐘𝐀 𝐁𝐎𝐓 𝐇𝐄𝐑𝐄 
└───🤖────🤖───┘

🎀 তোমাদের মধ্যে চলে এসেছি আমি
🎀 বিনোদন দিবো, কথা বলবো, মজা করবো

💠 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
👑 𝐎𝐰𝐧𝐞𝐫 : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐

━━━━━━━━━━━━━━━━━━

💖 𝐋𝐄𝐓'𝐒 𝐇𝐀𝐕𝐄 𝐅𝐔𝐍 𝐓𝐎𝐆𝐄𝐓𝐇𝐄𝐑 💖`,
        threadID
      );
    }

    /* ================= COOLDOWN ================= */
    if (cooldown[threadID] && now - cooldown[threadID] < 30000) return;
    cooldown[threadID] = now;

    const addedUsers = event.logMessageData.addedParticipants;

    const mentions = addedUsers.map(u => ({
      tag: u.fullName,
      id: u.userFbId
    }));

    const names = addedUsers.map(u => u.fullName);
    const count = addedUsers.length;

    /* ================= FIND WHO ADDED ================= */
    let adderName = "";
    let adderID = "";
    let isViaLink = false;

    // Check if the adder is in the group
    if (allMembers.includes(author)) {
      try {
        const adderInfo = await getUserInfo(api, author);
        if (adderInfo) {
          adderName = adderInfo.name;
          adderID = author;
        } else {
          adderName = "Unknown User";
          adderID = author;
        }
      } catch (e) {
        adderName = "Unknown User";
        adderID = author;
      }
    } else {
      // User not in group - might be via link or left
      isViaLink = true;
      adderName = "🌐 Joined via Group Link";
      adderID = "link";
    }

    // Check if any added user is VIP
    const isVIP = addedUsers.some(u => VIP_UID.includes(u.userFbId));

    /* ================= DAILY COUNT ================= */
    data[threadID].count += count;
    saveData(data);

    /* ================= GET USER AVATAR ================= */
    const firstUser = addedUsers[0];
    const avatarStream = await getUserAvatar(firstUser.userFbId);

    /* ================= VIP FRAME ================= */
    if (isVIP) {
      const vipUser = addedUsers.find(u => VIP_UID.includes(u.userFbId));
      const vipAvatar = await getUserAvatar(vipUser.userFbId);
      
      // VIP mentions
      const vipMentions = [
        { tag: vipUser.fullName, id: vipUser.userFbId }
      ];
      
      if (!isViaLink) {
        vipMentions.push({ tag: adderName, id: adderID });
      }

      return api.sendMessage({
        body:
`╔═══👑════════👑═══╗
𝐖𝐄𝐋𝐂𝐎𝐌𝐄 🅙𝐔🅦𝐄🅛 🅑𝐎𝐒🅢 
╚═══👑═════════👑═══╝

    👑 ${vipUser.fullName} 👑

━━━━━━━━━━━━━━━━━━━

আসসালামু ওয়ালাইকুম 
乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐ বস

এই গ্রুপে আপনাকে স্বাগতম
আপনি এই গ্রুপের বিশেষ একজন ব্যক্তি
আপনাকে এই গ্রুপে পেয়ে আমরা গর্বিত
আশা করি এই গ্রুপে আপনি অনেক সম্মান পাবেন
সবার থেকে অনেক ভালোবাসা পাবেন

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `👤 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
👥 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}

━━━━━━━━━━━━━━━━━━

    💎 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐉𝐔𝐖𝐄𝐋 𝐁𝐎𝐒𝐒 💎`,
        mentions: vipMentions,
        attachment: vipAvatar
      }, threadID);
    }

    /* ================= BIG JOIN ================= */
    if (count >= 5) {
      const bigMentions = [...mentions];
      if (!isViaLink) {
        bigMentions.push({ tag: adderName, id: adderID });
      }

      return api.sendMessage({
        body:
`┌───🎊─────🎊───┐
│ 🎉 𝐁𝐈𝐆 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 🎉
└───🎊─────🎊───┘

👥 ${count} 𝐍𝐄𝐖 𝐌𝐄𝐌𝐁𝐄𝐑𝐒

━━━━━━━━━━━━━━━━━
🌸 সবাইকে জানাই স্বাগতম
🌸 আমাদের পরিবারে আপনাদের পেয়ে আনন্দিত

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `👤 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
👥 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
📊 𝐓𝐨𝐝𝐚𝐲 : ${data[threadID].count}
━━━━━━━━━━━━━━━━━

💝 𝐇𝐀𝐏𝐏𝐘 𝐓𝐎 𝐇𝐀𝐕𝐄 𝐘𝐎𝐔 💝`,
        mentions: bigMentions,
        attachment: avatarStream
      }, threadID);
    }

    /* ================= FRAME SYSTEM ================= */

    let msg = "";
    const frameMentions = [...mentions];
    if (!isViaLink) {
      frameMentions.push({ tag: adderName, id: adderID });
    }

    if (frame === 1) {
      msg = `┌───🌸───🌸───┐
│ ✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨ │
└───🌸────🌸───┘

🌸 ${names.join(", ")}

━━━━━━━━━━━━━━━━
💗 আমাদের পরিবারের নতুন সদস্য
💗 আপনাকে পেয়ে আমরা গর্বিত

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `➕ 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
👥 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━`;
    }

    if (frame === 2) {
      msg = `┌───🦋───🦋───┐
│ ✨ 𝐌𝐀𝐆𝐈𝐂𝐀𝐋 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨ 
└───🦋───🦋───┘

🦋 ${names.join(", ")}

━━━━━━━━━━━━━━━━
🎭 আপনার আগমন জাদুর মতো
🎭 নতুন সম্পর্কের শুরু

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `👤 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
👥 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━`;
    }

    if (frame === 3) {
      msg = `┌───💫────💫───┐
│ ✨ 𝐍𝐄𝐖 𝐅𝐀𝐂𝐄 ✨ 
└───💫────💫───┘

💫 ${names.join(", ")}

━━━━━━━━━━━━━━━━
🌺 স্বাগতম জানাই আপনাকে
🌺 আপনার সাথে নতুন সম্পর্ক শুরু হলো

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `💫 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
💫 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━`;
    }

    if (frame === 4) {
      msg = `┌───🌺────🌺───┐
│ ✨ 𝐇𝐄𝐘 𝐓𝐇𝐄𝐑𝐄 ✨ 
└───🌺─────🌺───┘

🌺 ${names.join(", ")}

━━━━━━━━━━━━━━━━
🌷 আপনার আগমনে আলো ছড়িয়েছে
🌷 এ গ্রুপ এখন আরও রঙিন

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `💫 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
💫 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━━`;
    }

    if (frame === 5) {
      msg = `┌───💎────💎───┐
│ ✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨ │
└───💎────💎───┘

💎 ${names.join(", ")}

━━━━━━━━━━━━━━━━
🌟 নতুন শুরু, নতুন সম্পর্ক
🌟 এই গ্রুপকে আপনার দ্বিতীয় বাড়ি ভাবুন

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `🌸 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
🌸 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━`;
    }

    if (frame === 6) {
      msg = `┌───🌟────🌟───┐
│ ✨ 𝐇𝐈 𝐓𝐇𝐄𝐑𝐄 ✨ 
└───🌟────🌟───┘

🌟 ${names.join(", ")}

━━━━━━━━━━━━━━━━━━
💫 আপনাকে স্বাগতম জানাচ্ছি
💫 আশা করি এখানে ভালো লাগবে

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `➕ 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
👥 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━`;
    }

    if (frame === 7) {
      msg = `┌───💕─────💕───┐
│ ✨ 𝐍𝐄𝐖 𝐉𝐎𝐈𝐍 ✨ │
└───💕─────💕───┘

💕 ${names.join(", ")}

━━━━━━━━━━━━━━━━
🌺 আমাদের সাথে থাকার জন্য ধন্যবাদ
🌺 এখানে সবাই আপনাকে পছন্দ করবে

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `💫 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
💫 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━`;
    }

    if (frame === 8) {
      msg = `┌───🌷─────🌷───┐
│ ✨ 𝐀 𝐍𝐄𝐖 𝐅𝐑𝐈𝐄𝐍𝐃 ✨ │
└───🌷─────🌷───┘

🌷 ${names.join(", ")}

━━━━━━━━━━━━━━━━━
🌹 নতুন বন্ধু পেয়ে ভালো লাগলো
🌹 আপনি এখানে উষ্ণ অভ্যর্থনা পাবেন

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `🌸 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
🌸 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━`;
    }

    if (frame === 9) {
      msg = `┌───🎊─────🎊───┐
│ ✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨ │
└───🎊─────🎊───┘

🎊 ${names.join(", ")}

━━━━━━━━━━━━━━━━━
🎉 এই গ্রুপ এখন আপনার
🎉 সবাই আপনার সাথে বন্ধুত্ব করতে চায়

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `👤 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
👥 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━━━━`;
    }

    if (frame === 10) {
      msg = `┌───🎀─────🎀───┐
│ ✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨ 
└───🎀─────🎀───┘

🎀 ${names.join(", ")}

━━━━━━━━━━━━━━━━━
✨ আপনাকে পেয়ে আমরা সত্যিই আনন্দিত
✨ এখানে আপনার প্রতিটি মুহূর্ত সুন্দর হোক

${isViaLink ? '🌐 𝐉𝐨𝐢𝐧𝐞𝐝 𝐯𝐢𝐚 : 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤' : `🌸 𝐀𝐝𝐝𝐞𝐝 𝐁𝐲 : ${adderName}`}
🌸 𝐓𝐨𝐭𝐚𝐥 : ${totalMembers}
━━━━━━━━━━━━━━━━━`;
    }

    return api.sendMessage({
      body: msg,
      mentions: frameMentions,
      attachment: avatarStream
    }, threadID);

  } catch (e) {
    console.log("JoinNoti Error:", e);
    // Error handling - send basic message if something fails
    try {
      const { threadID } = event;
      api.sendMessage("⚠️ নতুন সদস্য join করেছেন কিন্তু বিজ্ঞপ্তি পাঠাতে সমস্যা হয়েছে।", threadID);
    } catch (err) {
      console.log("Final Error:", err);
    }
  }
};

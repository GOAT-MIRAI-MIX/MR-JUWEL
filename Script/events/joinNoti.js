module.exports.config = {
  name: "joinnoti",
  eventType: ["log:subscribe"],
  version: "7.1.0",
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
const VIP_UID = ["61591542717221"];

const filePath = path.join(__dirname, "cache", "dailyJoin.json");
const frameFile = path.join(__dirname, "cache", "frame.json");

/* ================= FRAME SYSTEM ================= */
function loadFrame() {
  if (!fs.existsSync(frameFile)) return {};
  return JSON.parse(fs.readFileSync(frameFile));
}

function saveFrame(data) {
  fs.writeFileSync(frameFile, JSON.stringify(data, null, 2));
}

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

/* ================= GET AVATAR ================= */
async function getAvatar(uid) {
  try {
    const avatar = await axios.get(`https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, {
      responseType: "stream"
    });
    return avatar.data;
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

    let data = loadData();
    let frameDB = loadFrame();

    if (!data[threadID]) data[threadID] = { date: today, count: 0 };
    if (!frameDB[threadID]) frameDB[threadID] = 1;

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
      const prefix = global.config.PREFIX || "/";
      return api.sendMessage(
`┌───🌸────🌷───┐
│👑 𝐑𝐈𝐘𝐀 𝐁𝐎𝐓 𝐇𝐄𝐑𝐄 ✨
└───🎀────🪄───┘

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

    const adderName = await Users.getNameUser(author);

    const isVIP = addedUsers.some(u => VIP_UID.includes(u.userFbId));

    /* ================= DAILY COUNT ================= */
    data[threadID].count += count;
    saveData(data);

    /* ================= GET AVATAR FOR FIRST USER ================= */
    const firstUser = addedUsers[0];
    let avatarStream = null;
    if (firstUser) {
      avatarStream = await getAvatar(firstUser.userFbId);
    }

    /* ================= VIP MESSAGE ================= */
    if (isVIP) {
      const msg = `┌───👑────💎───┐
│  𝐕𝐈𝐏 𝐀𝐑𝐑𝐈𝐕𝐀𝐋  │
└───🌟────✨───┘

💝 স্বাগতম জানাচ্ছি বিশেষ অতিথিকে!

👤 নাম : ${names.join(", ")}

📊 আজকের যোগদান : ${data[threadID].count}

❤️ ধন্যবাদ আমাদের সাথে থাকার জন্য!`;

      if (avatarStream) {
        return api.sendMessage({
          body: msg,
          mentions,
          attachment: avatarStream
        }, threadID);
      } else {
        return api.sendMessage({
          body: msg,
          mentions
        }, threadID);
      }
    }

    /* ================= BIG JOIN ================= */
    if (count >= 5) {
      const msg = `┌───🎉────🎊───┐
│  𝐁𝐈𝐆 𝐆𝐑𝐎𝐔𝐏  │
└───🎈────🎁───┘

👥 ${count} জন সদস্য যোগদান করেছেন
➕ যোগ করেছেন : ${adderName}
📊 আজকের মোট : ${data[threadID].count}

💝 সবাইকে আন্তরিক স্বাগতম!`;

      if (avatarStream) {
        return api.sendMessage({
          body: msg,
          mentions,
          attachment: avatarStream
        }, threadID);
      } else {
        return api.sendMessage({
          body: msg,
          mentions
        }, threadID);
      }
    }

    /* ================= FRAME SYSTEM ================= */

    let msg = "";
    let welcomeText = "";
    let welcomeLine1 = "";
    let welcomeLine2 = "";
    let welcomeLine3 = "";
    let welcomeLine4 = "";

    // Random welcome messages in Bangla (3-4 lines)
    const welcomeMessages = [
      {
        line1: "💝 হৃদয়ের উষ্ণ অভিনন্দন",
        line2: "🌸 স্নেহের আবেশে স্বাগতম",
        line3: "🎉 আনন্দের সাথে আগমন",
        line4: "⭐ নতুন শুরুতে শুভেচ্ছা"
      },
      {
        line1: "🌺 ভালোবাসায় ভরপুর স্বাগতম",
        line2: "💫 উজ্জ্বল ভবিষ্যতের শুভেচ্ছা",
        line3: "🌟 তারা ভরা স্বপ্নের আগমন",
        line4: "🌈 রঙিন জীবনের সূচনা"
      },
      {
        line1: "🌸 নতুন ফুলের আগমন",
        line2: "💝 হৃদয়ে ভালোবাসা নিয়ে",
        line3: "⭐ উজ্জ্বল আলোর প্রতীক",
        line4: "🌺 সুন্দর ভবিষ্যতের শুভেচ্ছা"
      },
      {
        line1: "🎊 স্বাগতম নতুন বন্ধু",
        line2: "💝 ভালোবাসায় আবৃত",
        line3: "🌟 উজ্জ্বল তারকার আগমন",
        line4: "🌈 নতুন রঙের সমাহার"
      }
    ];

    const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    welcomeLine1 = randomWelcome.line1;
    welcomeLine2 = randomWelcome.line2;
    welcomeLine3 = randomWelcome.line3;
    welcomeLine4 = randomWelcome.line4;

    if (frame === 1) {
      welcomeText = `🌸 স্বাগতম নতুন সদস্য 🌸`;
      msg = `┌───🌸────🌷───┐
│  ${welcomeText}  │
└───🎀────🪄───┘

👤 নাম : ${names.join(", ")}
👥 যোগদান : ${count} জন
➕ যোগ করেছেন : ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 2) {
      welcomeText = `🌟 নতুন মুখের আগমন 🌟`;
      msg = `┌───🌟────⭐───┐
│  ${welcomeText}  │
└───✨────💫───┘

👤 ${names.join(", ")}
👥 +${count} জন যোগদান
➕ ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 3) {
      welcomeText = `💫 নতুন যাত্রার শুরু 💫`;
      msg = `┌───💫────🌠───┐
│  ${welcomeText}  │
└───🌟────⭐───┘

👤 নাম : ${names.join(", ")}
👥 যোগদান : ${count} জন
➕ যোগ করেছেন : ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 4) {
      welcomeText = `🌺 নতুন বন্ধুর আগমন 🌺`;
      msg = `┌───🌺────🌸───┐
│  ${welcomeText}  │
└───🌷────🌹───┘

👤 ${names.join(", ")}
👥 +${count} জন যোগদান
➕ ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 5) {
      welcomeText = `✨ নতুন আশার আলো ✨`;
      msg = `┌───✨────🌟───┐
│  ${welcomeText}  │
└───⭐────💫───┘

👤 নাম : ${names.join(", ")}
👥 যোগদান : ${count} জন
➕ যোগ করেছেন : ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 6) {
      welcomeText = `💎 নতুন সম্ভাবনার শুরু 💎`;
      msg = `┌───💎────💠───┐
│  ${welcomeText}  │
└───🔮────💡───┘

👤 ${names.join(", ")}
👥 +${count} জন যোগদান
➕ ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 7) {
      welcomeText = `🎊 নতুন সদস্যকে অভিনন্দন 🎊`;
      msg = `┌───🎊────🎉───┐
│  ${welcomeText}  │
└───🎁────🎈───┘

👤 নাম : ${names.join(", ")}
👥 যোগদান : ${count} জন
➕ যোগ করেছেন : ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 8) {
      welcomeText = `🌷 নতুন প্রাণের স্পন্দন 🌷`;
      msg = `┌───🌷────🌹───┐
│  ${welcomeText}  │
└───🌸────🌺───┘

👤 ${names.join(", ")}
👥 +${count} জন যোগদান
➕ ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 9) {
      welcomeText = `⭐ নতুন স্বপ্নের শুরু ⭐`;
      msg = `┌───⭐────🌟───┐
│  ${welcomeText}  │
└───✨────💫───┘

👤 নাম : ${names.join(", ")}
👥 যোগদান : ${count} জন
➕ যোগ করেছেন : ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (frame === 10) {
      welcomeText = `🌈 নতুন রঙের সমাহার 🌈`;
      msg = `┌───🌈────🎨───┐
│  ${welcomeText}  │
└───💜────🧡───┘

👤 ${names.join(", ")}
👥 +${count} জন যোগদান
➕ ${adderName}

${welcomeLine1}
${welcomeLine2}
${welcomeLine3}
${welcomeLine4}`;
    }

    if (avatarStream) {
      return api.sendMessage({
        body: msg,
        mentions,
        attachment: avatarStream
      }, threadID);
    } else {
      return api.sendMessage({
        body: msg,
        mentions
      }, threadID);
    }

  } catch (e) {
    console.log("JoinNoti Error:", e);
  }
};

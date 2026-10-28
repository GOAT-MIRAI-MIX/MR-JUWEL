const fs = require("fs");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "sigmaboy",
  version: "13.0.0",
  hasPermssion: 0,
  credits: "M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "random sigmaboy video",
  commandCategory: "sigma",
  usages: "sigmaboy | sigmaboy <number> | sigmaboy unban <id>",
  cooldowns: 0, // কুলডাউন নিচের কোডে নিজে হ্যান্ডেল করা হয় (অ্যাডমিন বাদে ১৫ সেকেন্ড)
};

// ===== Video List =====
// এখানে ভিডিও লিংক বসান (প্রতিটি লিংক কমা দিয়ে আলাদা করুন)
const videoList = [
  "https://i.imgur.com/gX1UC6Z.mp4",
  "https://i.imgur.com/XOZHscf.mp4",
  "https://i.imgur.com/oSea5n7.mp4",
  "https://i.imgur.com/sdYiLgj.mp4",
  "https://i.imgur.com/ARtdo3y.mp4",
  "https://i.imgur.com/ehShfsH.mp4",
  "https://i.imgur.com/96od2AY.mp4",
  "https://i.imgur.com/yPsoM7y.mp4",
  "https://i.imgur.com/Z6yzxVr.mp4",
  "https://i.imgur.com/wpTyRAk.mp4",
  "https://i.imgur.com/vfnCCEJ.mp4",
  "https://i.imgur.com/mMls0Lw.mp4",
  "https://i.imgur.com/hcmsiAt.mp4",
  "https://i.imgur.com/ovOe6Ld.mp4",
  "https://i.imgur.com/u9a1wC5.mp4",
  "https://i.imgur.com/lovWQSe.mp4",
  "https://i.imgur.com/P4L6u20.mp4",
  "https://i.imgur.com/bEcPmra.mp4",
  "https://i.imgur.com/2sD8aOo.mp4",
  "https://i.imgur.com/P9Ih9qX.mp4",
  "https://i.imgur.com/wDccwCw.mp4",
  "https://i.imgur.com/wvO12h7.mp4",
  "https://i.imgur.com/2EPpIwc.mp4",
  "https://i.imgur.com/e7NGkxO.mp4",
  "https://i.imgur.com/X1x55j0.mp4",
  "https://i.imgur.com/rczUIjt.mp4",
  "https://i.imgur.com/i2JUOos.mp4",
  "https://i.imgur.com/ljCsOaB.mp4",
  "https://i.imgur.com/7afYjRL.mp4",
  "https://i.imgur.com/WqnDkow.mp4"
];

// ===== Paths =====
const CACHE_DIR = path.join(__dirname, "cache", "sigmaboy_cache");
const DATA_FILE = path.join(__dirname, "cache", "sigmaboy_data.json");
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (e) {}

// ===== 💾 Persistent Ban Storage =====
function loadBanned() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return data.banned || {};
  } catch (e) {
    return {};
  }
}

function saveBanned() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ banned: global.client.sigmaboyBanned }, null, 2)
    );
  } catch (e) {
    console.log("Ban save error:", e);
  }
}

// ===== Trackers =====
if (!global.client.sigmaboySpamTracker) global.client.sigmaboySpamTracker = {};
if (!global.client.sigmaboyBanned) global.client.sigmaboyBanned = loadBanned();
if (!global.client.sigmaboyCooldown) global.client.sigmaboyCooldown = {};
if (!global.client.sigmaboyLast) global.client.sigmaboyLast = {};

// ===== Font Converter → 𝐀𝐁𝐂𝐃 =====
// bold অক্ষরগুলো surrogate pair, তাই Array.from দিয়ে ভাঙতে হয়
function toBoldFont(text) {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bold = Array.from("𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗");
  return Array.from(text).map(ch => {
    const i = normal.indexOf(ch);
    return i > -1 ? bold[i] : ch;
  }).join("");
}

// ===== Admin Check =====
function isAdmin(id) {
  const cfg = global.config || {};
  const list = [].concat(cfg.ADMINBOT || [], cfg.OPERATOR || []).map(String);
  return list.includes(String(id));
}

// ===== 🔁 No-Repeat Random Picker =====
function pickIndex(threadID) {
  if (videoList.length <= 1) return 0;
  const last = global.client.sigmaboyLast[threadID];
  let idx;
  do {
    idx = Math.floor(Math.random() * videoList.length);
  } while (idx === last);
  global.client.sigmaboyLast[threadID] = idx;
  return idx;
}

// ===== ⬇️ Download (temp file → rename) =====
function downloadVideo(url, dest) {
  return new Promise((resolve, reject) => {
    const tmp = `${dest}.${Date.now()}.tmp`;
    const ws = fs.createWriteStream(tmp);

    const fail = (err) => {
      try { ws.destroy(); } catch (e) {}
      try { fs.unlinkSync(tmp); } catch (e) {}
      reject(err);
    };

    const req = request(url);
    req.on("response", (res) => {
      if (res.statusCode !== 200) {
        req.abort();
        fail(new Error("HTTP " + res.statusCode));
      }
    });
    req.on("error", fail);
    ws.on("error", fail);
    ws.on("close", () => {
      try {
        if (!fs.existsSync(tmp)) return;
        if (fs.statSync(tmp).size === 0) return fail(new Error("Empty file"));
        fs.renameSync(tmp, dest);
        resolve();
      } catch (e) {
        fail(e);
      }
    });
    req.pipe(ws);
  });
}

// ===== 📦 Video Cache =====
async function getVideoFile(index) {
  const url = videoList[index];
  const file = path.join(CACHE_DIR, path.basename(url));
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return file;
  await downloadVideo(url, file);
  return file;
}

// ===== 🛡️ Ban / Spam / Cooldown Check =====
function checkUser(api, threadID, replyID, senderID) {
  // 👑 অ্যাডমিনের জন্য কুলডাউন, স্প্যাম ও ব্যান কিছুই নেই
  if (isAdmin(senderID)) return true;

  const now = Date.now();

  // 🚫 Ban Check
  if (global.client.sigmaboyBanned[senderID]) {
    api.sendMessage(
      toBoldFont("🚫 You are BANNED! You cannot use this command."),
      threadID,
      replyID
    );
    return false;
  }

  // 📊 Spam Check (5 times / 60s) — কুলডাউনের আগে চেক হয়
  if (!global.client.sigmaboySpamTracker[senderID]) {
    global.client.sigmaboySpamTracker[senderID] = [];
  }
  global.client.sigmaboySpamTracker[senderID] = global.client.sigmaboySpamTracker[senderID]
    .filter(t => now - t < 60000);
  global.client.sigmaboySpamTracker[senderID].push(now);

  if (global.client.sigmaboySpamTracker[senderID].length > 5) {
    global.client.sigmaboyBanned[senderID] = true;
    saveBanned();
    api.sendMessage(
      toBoldFont("🚫 SPAM DETECTED! You sent 5+ commands in 1 minute.\nYou have been BANNED."),
      threadID,
      replyID
    );
    return false;
  }

  // ⏱️ Cooldown Check (15s)
  const lastUsed = global.client.sigmaboyCooldown[senderID] || 0;
  const remaining = 15 - Math.floor((now - lastUsed) / 1000);

  if (remaining > 0) {
    api.sendMessage(
      toBoldFont(`⏳ Please wait ${remaining}s before using this command again!`),
      threadID,
      replyID
    );
    return false;
  }
  global.client.sigmaboyCooldown[senderID] = now;
  return true;
}

// ===== 🎬 Send Video =====
async function sendVideo(api, threadID, replyID, senderID, index) {
  try {
    const file = await getVideoFile(index);
    const bodyText = toBoldFont("Sigma Boy Video");

    api.sendMessage(
      { body: bodyText, attachment: fs.createReadStream(file) },
      threadID,
      (err) => {
        if (err) return console.log("Send error:", err);
      },
      replyID
    );
  } catch (e) {
    console.log("Video error:", e);
    api.sendMessage(
      toBoldFont("❌ Failed to download video. Try again!"),
      threadID,
      replyID
    );
  }
}

// ===== ▶️ Command =====
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // ===== 🔓 Unban (Admin only): sigmaboy unban <id> =====
  if (args && args[0] && args[0].toLowerCase() === "unban") {
    if (!isAdmin(senderID)) {
      return api.sendMessage(
        toBoldFont("❌ Only admin can use unban."),
        threadID,
        messageID
      );
    }
    const target = args[1];
    if (!target) {
      return api.sendMessage(
        toBoldFont("⚠️ Usage: sigmaboy unban <user id>"),
        threadID,
        messageID
      );
    }
    if (!global.client.sigmaboyBanned[target]) {
      return api.sendMessage(
        toBoldFont("ℹ️ This user is not banned."),
        threadID,
        messageID
      );
    }
    delete global.client.sigmaboyBanned[target];
    delete global.client.sigmaboySpamTracker[target];
    delete global.client.sigmaboyCooldown[target];
    saveBanned();
    return api.sendMessage(
      toBoldFont(`✅ Unbanned ${target}`),
      threadID,
      messageID
    );
  }

  // ===== 📭 Empty list guard =====
  if (videoList.length === 0) {
    return api.sendMessage(
      toBoldFont("⚠️ No videos added yet!"),
      threadID,
      messageID
    );
  }

  // ===== 🔢 Video by number: sigmaboy <number> =====
  let index = null;
  if (args && args[0]) {
    const n = parseInt(args[0], 10);
    if (isNaN(n) || n < 1 || n > videoList.length) {
      return api.sendMessage(
        toBoldFont(`❌ Invalid number! Choose between 1 and ${videoList.length}`),
        threadID,
        messageID
      );
    }
    index = n - 1;
  }

  if (!checkUser(api, threadID, messageID, senderID)) return;

  if (index === null) {
    index = pickIndex(threadID);
  } else {
    global.client.sigmaboyLast[threadID] = index;
  }

  await sendVideo(api, threadID, messageID, senderID, index);
};

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  JUWEL GUARD  —  Group Name / Photo / Theme / Emoji Lock ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  কী করে:
 *   • গ্রুপের নাম বা ফটো কেউ চেঞ্জ করলে → আগেরটা ফিরিয়ে দেয় + চেঞ্জকারীকে KICK করে
 *   • থিম বা ইমোজি কেউ চেঞ্জ করলে      → শুধু আগেরটা ফিরিয়ে দেয় (ওয়ার্নিং/কিক নেই)
 *
 *  ইনস্টল: শুধু এই ফাইলটা  Script/events/  ফোল্ডারে রাখুন। আর কিছু চেঞ্জ করা লাগবে না।
 */

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// ───────────────────────── সেটিংস (দরকার হলে এখানে বদলান) ─────────────────────────
const SETTINGS = {
  EXEMPT_GROUP_ADMINS: true,  // true  = গ্রুপ অ্যাডমিনরা নাম/ফটো বদলালে কিক হবে না (এবং নতুনটাই সেভ হবে)
                              // false = অ্যাডমিন হলেও কিক/রিভার্ট হবে (বট অ্যাডমিন ছাড়া)
  EXEMPT_BOT_ADMINS: true,    // config.json এর ADMINBOT / DEVELOPER সবসময় ছাড় পাবে
  KICK_ON_NAME: true,         // নাম চেঞ্জ করলে কিক
  KICK_ON_PHOTO: true,        // ফটো চেঞ্জ করলে কিক
  SNAPSHOT_ON_LOAD: true,     // বট চালু হলে সব গ্রুপের ব্যাকআপ নেবে (যেগুলোর ব্যাকআপ নেই)
  SNAPSHOT_DELAY_MS: 2500,    // এক গ্রুপ থেকে আরেক গ্রুপের ব্যাকআপের মাঝে বিরতি (রেট-লিমিট এড়াতে)
  MAX_GROUPS_ON_LOAD: 100
};

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
// ──────────────────────────────────────────────────────────────────────────────────

module.exports.config = {
  name: "juwelGuard",
  version: "1.0.0",
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Auto backup & restore of group name, photo, theme and emoji",
  eventType: [
    "log:thread-name",
    "log:thread-icon",
    "log:thread-color",
    "log:thread-image",
    "change_thread_image",
    "log:subscribe"
  ],
  cooldowns: 0
};

// ───────────────────────── ফাইল / স্টোরেজ ─────────────────────────
const CACHE_DIR = path.join(__dirname, "..", "..", "cache", "juwelGuard");
fs.ensureDirSync(CACHE_DIR);

const jsonFile = (tid) => path.join(CACHE_DIR, `${tid}.json`);
const imgFile = (tid) => path.join(CACHE_DIR, `${tid}.jpg`);

function readSnap(tid) {
  try {
    if (!fs.existsSync(jsonFile(tid))) return null;
    return JSON.parse(fs.readFileSync(jsonFile(tid), "utf8"));
  } catch (_) { return null; }
}
function writeSnap(tid, snap) {
  try { fs.writeFileSync(jsonFile(tid), JSON.stringify(snap, null, 2)); } catch (_) {}
}

// বট নিজে রিস্টোর করার সময় যে ইভেন্ট তৈরি হয় সেগুলো ইগনোর করার জন্য
const restoring = new Map(); // key -> expiry timestamp
const lock = (tid, field) => restoring.set(`${tid}:${field}`, Date.now() + 20000);
const isLocked = (tid, field) => {
  const exp = restoring.get(`${tid}:${field}`);
  if (!exp) return false;
  if (Date.now() > exp) { restoring.delete(`${tid}:${field}`); return false; }
  return true;
};

// ───────────────────────── হেল্পার ─────────────────────────
const call = (fn, ...args) =>
  new Promise((resolve, reject) => {
    try {
      const ret = fn(...args, (err, res) => (err ? reject(err) : resolve(res)));
      if (ret && typeof ret.then === "function") ret.then(resolve, reject);
    } catch (e) { reject(e); }
  });

const getThreadInfo = (api, tid) => call(api.getThreadInfo.bind(api), tid);

async function downloadImage(url, tid) {
  if (!url) return false;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
    fs.writeFileSync(imgFile(tid), Buffer.from(res.data));
    return true;
  } catch (_) { return false; }
}

async function takeFullSnapshot(api, tid, info) {
  info = info || (await getThreadInfo(api, tid));
  if (!info) return null;
  const snap = {
    name: info.threadName || "",
    emoji: info.emoji || null,
    color: info.threadColor || info.color || null,
    hasImage: false,
    savedAt: Date.now()
  };
  snap.hasImage = await downloadImage(info.imageSrc, tid);
  if (!snap.hasImage && fs.existsSync(imgFile(tid))) snap.hasImage = true; // আগের কপি আছে
  writeSnap(tid, snap);
  return snap;
}

function isExemptUser(api, uid, adminIDs) {
  uid = String(uid);
  try { if (uid === String(api.getCurrentUserID())) return true; } catch (_) {}
  if (SETTINGS.EXEMPT_BOT_ADMINS) {
    const cfg = global.config || {};
    const list = [].concat(cfg.ADMINBOT || [], cfg.DEVELOPER || []).map(String);
    if (list.includes(uid)) return true;
  }
  if (SETTINGS.EXEMPT_GROUP_ADMINS && adminIDs.includes(uid)) return true;
  return false;
}

async function userName(api, uid) {
  try {
    const u = await call(api.getUserInfo.bind(api), [uid]);
    return (u && u[uid] && u[uid].name) || "Unknown User";
  } catch (_) { return "Unknown User"; }
}

// ───────────────────────── সুন্দর নোটিশ ডিজাইন ─────────────────────────
const LINE = "━━━━━━━━━━━━━━━━━━━━━━";
function frame(icon, title, rows, footer) {
  return (
`╔${LINE}╗
   ${icon}  ${title}
╚${LINE}╝

${rows.join("\n")}

${footer ? footer + "\n" : ""}${LINE}
✦ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗕𝘆 ➤ ${CREDIT} ✦`
  );
}

const FOOT = "🛡️ 𝗔𝘂𝘁𝗼 𝗕𝗮𝗰𝗸𝘂𝗽 & 𝗥𝗲𝘀𝘁𝗼𝗿𝗲 𝗔𝗰𝘁𝗶𝘃𝗲";
const KICK_DELAY_MS = 3000; // ওয়ার্নিং দেওয়ার কত সেকেন্ড পর কিক হবে

// নাম/ফটো: ব্যাকআপ ফেরানোর পর ওয়ার্নিং নোটিশ
function noticeWarn(kind, who, oldVal, willKick) {
  const isName = kind === "name";
  const rows = [
    `👤 চেঞ্জকারী : ${who}`,
    isName ? `♻️ আগের নাম ফিরিয়ে আনা হয়েছে : ${oldVal}` : `♻️ আগের ছবি ফিরিয়ে আনা হয়েছে`,
    ``,
    `⚠️ 𝗔𝗗𝗠𝗜𝗡 ছাড়া, 𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡 ও 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡 ছাড়া`,
    `কেউ গ্রুপের ${isName ? "নাম" : "ছবি"} চেঞ্জ করতে পারবে না!`
  ];
  if (willKick) rows.push(``, `⏳ ${KICK_DELAY_MS / 1000} সেকেন্ড পর তাকে গ্রুপ থেকে কিক করা হবে...`);
  return frame(isName ? "🏷️" : "🖼️", "𝗪𝗔𝗥𝗡𝗜𝗡𝗚 • " + (isName ? "𝗡𝗔𝗠𝗘 𝗟𝗢𝗖𝗞𝗘𝗗" : "𝗣𝗛𝗢𝗧𝗢 𝗟𝗢𝗖𝗞𝗘𝗗"), rows, FOOT);
}

// কিক সম্পন্ন হওয়ার পর নোটিশ
function noticeKicked(kind, who, ok, botIsAdmin) {
  const isName = kind === "name";
  const rows = ok
    ? [`👤 ${who}`, `🚫 গ্রুপের ${isName ? "নাম" : "ছবি"} চেঞ্জ করার কারণে`, `👢 তাকে গ্রুপ থেকে কিক দেওয়া হয়েছে!`]
    : [`👤 ${who}`, botIsAdmin ? `⚠️ কিক করা সম্ভব হয়নি` : `⚠️ বট গ্রুপ অ্যাডমিন নয়, তাই কিক করা যায়নি`];
  return frame("👢", ok ? "𝗨𝗦𝗘𝗥 𝗞𝗜𝗖𝗞𝗘𝗗" : "𝗞𝗜𝗖𝗞 𝗙𝗔𝗜𝗟𝗘𝗗", rows, FOOT);
}

// থিম/ইমোজি: রিস্টোর + ওয়ার্নিং (কিক নেই)
function noticeSoft(kind, who, oldVal) {
  const isTheme = kind === "theme";
  return frame(
    isTheme ? "🎨" : "😀",
    "𝗪𝗔𝗥𝗡𝗜𝗡𝗚 • " + (isTheme ? "𝗧𝗛𝗘𝗠𝗘 𝗟𝗢𝗖𝗞𝗘𝗗" : "𝗘𝗠𝗢𝗝𝗜 𝗟𝗢𝗖𝗞𝗘𝗗"),
    [
      `👤 চেঞ্জকারী : ${who}`,
      isTheme ? `♻️ আগের থিম ফিরিয়ে আনা হয়েছে` : `♻️ আগের ইমোজি ফিরিয়ে আনা হয়েছে : ${oldVal || "👍"}`,
      ``,
      `⚠️ 𝗔𝗗𝗠𝗜𝗡 ছাড়া, 𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡 ও 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡 ছাড়া`,
      `কেউ গ্রুপের ${isTheme ? "থিম" : "ইমোজি"} চেঞ্জ করতে পারবে না!`
    ],
    FOOT
  );
}

// ───────────────────────── onLoad: বট চালু হলে ব্যাকআপ নেওয়া ─────────────────────────
module.exports.onLoad = async function ({ api }) {
  if (!SETTINGS.SNAPSHOT_ON_LOAD) return;
  // অ্যাসিঙ্ক ব্যাকগ্রাউন্ডে চলবে, বটের স্টার্টআপ আটকাবে না
  setTimeout(async () => {
    try {
      const list = await call(api.getThreadList.bind(api), SETTINGS.MAX_GROUPS_ON_LOAD, null, ["INBOX"]);
      const groups = (list || []).filter((t) => t.isGroup);
      for (const t of groups) {
        const tid = String(t.threadID);
        if (readSnap(tid)) continue;
        try { await takeFullSnapshot(api, tid); } catch (_) {}
        await new Promise((r) => setTimeout(r, SETTINGS.SNAPSHOT_DELAY_MS));
      }
      console.log(`[juwelGuard] Backup ready for ${groups.length} group(s).`);
    } catch (e) {
      console.log("[juwelGuard] onLoad snapshot skipped:", e && e.message);
    }
  }, 15000);
};

// ───────────────────────── মূল ইভেন্ট হ্যান্ডলার ─────────────────────────
module.exports.run = async function ({ api, event }) {
  try {
    const threadID = String(event.threadID);
    const author = String(event.author || event.senderID || "");
    const type = event.logMessageType || event.type;
    const data = event.logMessageData || {};
    const botID = String(api.getCurrentUserID());

    // বটকে কোনো গ্রুপে অ্যাড করলে ব্যাকআপ নাও
    if (type === "log:subscribe") {
      const added = (data.addedParticipants || []).map((p) => String(p.userFbId));
      if (added.includes(botID) && !readSnap(threadID)) {
        setTimeout(() => takeFullSnapshot(api, threadID).catch(() => {}), 5000);
      }
      return;
    }

    // কোন ফিল্ড চেঞ্জ হয়েছে
    let field = null;
    if (type === "log:thread-name") field = "name";
    else if (type === "log:thread-icon") field = "emoji";
    else if (type === "log:thread-color") field = "color";
    else if (type === "log:thread-image" || type === "change_thread_image") field = "image";
    if (!field) return;

    // বটের নিজের রিস্টোর থেকে তৈরি ইভেন্ট → ইগনোর
    if (isLocked(threadID, field) && author === botID) return;

    const snap = readSnap(threadID);

    // ব্যাকআপ না থাকলে: এখনকার অবস্থাটাই ব্যাকআপ হিসেবে রাখো (রিভার্ট করার মতো আগের কিছু নেই)
    if (!snap) {
      await takeFullSnapshot(api, threadID).catch(() => {});
      return;
    }

    const info = await getThreadInfo(api, threadID);
    const adminIDs = ((info && info.adminIDs) || []).map((a) => String(a.id || a));
    const botIsAdmin = adminIDs.includes(botID);
    const exempt = isExemptUser(api, author, adminIDs);

    // ───── ছাড়প্রাপ্ত (বট / বট-অ্যাডমিন / গ্রুপ-অ্যাডমিন) → নতুনটাই ব্যাকআপ ─────
    if (exempt) {
      if (field === "name") snap.name = data.name != null ? data.name : (info && info.threadName) || snap.name;
      if (field === "emoji") snap.emoji = data.thread_icon || (info && info.emoji) || snap.emoji;
      if (field === "color") snap.color = data.theme_color || data.thread_color || (info && (info.threadColor || info.color)) || snap.color;
      if (field === "image") snap.hasImage = (await downloadImage(info && info.imageSrc, threadID)) || snap.hasImage;
      snap.savedAt = Date.now();
      writeSnap(threadID, snap);
      return;
    }

    // ───── সাধারণ সদস্য ─────
    const who = await userName(api, author);

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // ===== থিম: রিস্টোর + ওয়ার্নিং (কিক নেই) =====
    if (field === "color") {
      if (!snap.color) return;
      lock(threadID, "color");
      await call(api.changeThreadColor.bind(api), snap.color, threadID).catch(() => {});
      return api.sendMessage(noticeSoft("theme", who), threadID);
    }

    // ===== ইমোজি: রিস্টোর + ওয়ার্নিং (কিক নেই) =====
    if (field === "emoji") {
      lock(threadID, "emoji");
      await call(api.changeThreadEmoji.bind(api), snap.emoji || "👍", threadID).catch(() => {});
      return api.sendMessage(noticeSoft("emoji", who, snap.emoji), threadID);
    }

    // ===== নাম / ফটো: ১) ব্যাকআপ ফেরাও ২) ওয়ার্নিং ৩) ৩ সেকেন্ড পর কিক ৪) কিক-নোটিশ =====
    if (field === "name" || field === "image") {
      const kind = field === "name" ? "name" : "photo";
      const doKick = (field === "name" ? SETTINGS.KICK_ON_NAME : SETTINGS.KICK_ON_PHOTO) && botIsAdmin;

      // ১) ব্যাকআপ ফিরিয়ে আনা
      if (field === "name") {
        lock(threadID, "name");
        await call(api.setTitle.bind(api), snap.name || "", threadID).catch(() => {});
      } else if (snap.hasImage && fs.existsSync(imgFile(threadID))) {
        lock(threadID, "image");
        await call(api.changeGroupImage.bind(api), fs.createReadStream(imgFile(threadID)), threadID).catch(() => {});
      }

      // ২) ওয়ার্নিং
      await call(api.sendMessage.bind(api), noticeWarn(kind, who, snap.name || "—", doKick), threadID).catch(() => {});

      // ৩) কিক
      let kicked = false;
      if (doKick) {
        await sleep(KICK_DELAY_MS);
        kicked = await call(api.removeUserFromGroup.bind(api), author, threadID).then(() => true).catch(() => false);
      } else {
        return; // কিক বন্ধ (বা বট অ্যাডমিন নয়): ওয়ার্নিংই যথেষ্ট
      }

      // ৪) কিক-নোটিশ
      return api.sendMessage(noticeKicked(kind, who, kicked, botIsAdmin), threadID);
    }
  } catch (e) {
    console.log("[juwelGuard] Error:", e && e.message ? e.message : e);
  }
};

/**
 * BAD WORD AUTO UNSEND — Script/commands/antilink2.js  (v2.0.0)
 * কোনো ইউজার গ্রুপে গালি দিলে বট ওই মেসেজটা সাথে সাথে unsend করার চেষ্টা করবে। আর কিছু করবে না
 * (কোনো নোটিশ নেই, কিক নেই, লিংক চেক নেই)। গ্রুপ অ্যাডমিন ও বট অ্যাডমিনের মেসেজে কিছু হবে না।
 * শব্দ ম্যানেজ (শুধু গ্রুপ অ্যাডমিন):  antilink2 add <শব্দ> | del <শব্দ> | list
 */
const fs = require("fs-extra");
const path = require("path");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

module.exports.config = {
  name: "antilink2",
  version: "2.0.0",
  hasPermssion: 1,
  credits: CREDIT, // একই ভ্যারিয়েবল ব্যবহার, তাই লুকানো অক্ষরের গরমিল হবে না
  description: "Delete links & bad words from normal users",
  commandCategory: "group",
  usages: "antilink2 add|del|list",
  cooldowns: 3
};


const FILE = path.join(__dirname, "cache", "antilink2.json");

const uniq = (a) => { const s = new Set(), o = []; for (const x of a) { const k = x.trim().toLowerCase(); if (k && !s.has(k)) { s.add(k); o.push(x.trim()); } } return o; };

// 👇 নতুন গালি কোডে যোগ করতে চাইলে এই লিস্টে কমা দিয়ে লিখুন (এখন থেকে এটা সত্যিই কাজ করবে)
const WORDS_EN_BN = ["fuck", "bitch", "asshole", "fucking", "motherfucker", "mother fucker", "fucker", "bollocks", "Sawya", "sawya", "tui magi", "stupid juwel", "bot fuck you", "🖕", "🖕🖕", "🖕🖕🖕", "toke🖕", "toke🖕🖕", "toke 🖕", "🖕 fuck", "fuck 🖕", "chut", "gand", "bhosdi", "benchod", "madarchod", "randi", "kutta bacsa", "magi", "Magi", "MC Bot", "MC bot", "Mc Bot", "Vodar Bot", "Sawyar Bot", "sawyar bot", "bot tor booske chudi", "Bot tor boos ke chudi", "xodi", "Xodi", "cdi", "Cdi", "tor mar Voda", "tor mare cdi", "Tor mare chodi", "Tor mar voda", "Tor mar Voda", "Tor Bon ar Voda", "Pompom", "chutmarani", "juwek ke cudi", "Juwel ke cdi", "tor boos Juwel ke Chudi", "bokacoda", "xoda", "72 Lack", "chdi", "chup magi", "Chup magi", "tok chudi", "Tor mar Sawya", "Tor bon ar sawya", "Tor Bon ar Sawya", "Sawya dey", "tok abal", "Voda", "voda", "Juwel ke chudi", "abal", "vodar group", "Vodar group", "Sawyar group", "nunu", "Nunu", "Tuntuni", "tuntuni", "tor boos ke cudi", "Tor boos ke cudi", "Tor boss ke chudi", "আবাল", "সাউয়া", "ভোদা", "মাগি", "চুদি", "বোকাচোদা", "বোকাচুদা", "মাদারচোদ", "চুদা", "চুদতে", "সেক্স করতে", "ভোদার গুপ", "সাউয়ার", "খানকি", "পুটকি", "গুদ", "রেন্ডি", "হাত মার", "গিটার বাজাও", "হাত মাড়া", "চুদবো", "চুদানির পোলা", "মাং", "মাংগের বেডি", "বালের বট", "তোর বোন এর ভোদা", "তোর বোন এর সাউয়া", "তোর বোন কে চুদি", "সাউয়ার বট", "সাউয়ার কথা", "তোর মার ভোদা", "তোর সাউয়া", "তোর মায়ের সাউয়া", "তোর মার সাউয়া", "তোর বোনের সাউয়া", "তোর সাউয়া মাগি", "জুয়েল কে চুদি", "জুয়েল চোকাচোদা", "এডমিন এর বাল", "চোদার", "তোর মতো মাগি", "তোক চুদি", "তুই ১২ মাগি", "জুয়েল এর মারে চুদি", "জুয়েল এর মাকে চুদি", "জুয়েল এর মার ভোদা", "জুয়েল এর মার সাউয়া", "তুই হাত মাড়া মাগি", "তোর মা মাগি", "তোর বোন মাগি", "তোর মাকে চুদি", "তোর বোনকে চুদি", "জুয়েল এর বোন কে চুদি", "জুয়েল এর বোন এর সাউয়া", "জয়েল এর বোন এর ভোদা", "কার বাল", "নিছের বাল", "চোকাচোদা", "রেন্ডির ছেলে", "রেন্ডি মেয়ে", "পম্পম", "Pompom", "আবাল নাকি", "জুয়েল বোকাচোদা", "তুই বোকাচোদা", "তুই বুকাচুদা", "জাও গিটার বাজাও", "হাত মারবে", "হাত মারবো", "হাত মারো", "হাত মারতে জাবে", "বট এর বসকে চুদি", "বট তোর বসকে চুদি", "বট তোর বস জুয়েল কে চুদি", "গিটার বাজাবো", "তুই ১২ ভাতারী মাগি", "তুই হাত মাড়া"];
const DEFAULT_WORDS = uniq(WORDS_EN_BN);

// ফাইলে শুধু "যোগ" আর "বাদ" করা শব্দ সেভ হয়; ডিফল্ট লিস্ট সবসময় কোড থেকে আসে
let DB = { added: [], removed: [] };
try {
  fs.ensureDirSync(path.dirname(FILE));
  if (fs.existsSync(FILE)) {
    const j = fs.readJsonSync(FILE);
    if (Array.isArray(j.added)) DB.added = j.added;
    if (Array.isArray(j.removed)) DB.removed = j.removed;
    if (Array.isArray(j.words)) DB.added = uniq(DB.added.concat(j.words)); // পুরনো ফরম্যাট
  }
} catch (_) {}
const save = () => { try { fs.writeJsonSync(FILE, DB); } catch (_) {} };
const allWords = () => {
  const rem = new Set(DB.removed.map((x) => x.trim().toLowerCase()));
  return uniq(DEFAULT_WORDS.concat(DB.added)).filter((x) => !rem.has(x.toLowerCase()));
};

const creditOK = () => module.exports.config.credits === CREDIT && CREDIT.includes("JU");
const LINE = "━━━━━━━━━━━━━━━━━━━━━━";
const frame = (icon, title, rows) =>
`╔${LINE}╗
   ${icon}  ${title}
╚${LINE}╝

${rows.join("\n")}

${LINE}
🛡️ 𝗔𝘂𝘁𝗼 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗶𝗼𝗻 • 𝗔𝗹𝘄𝗮𝘆𝘀 𝗢𝗻
✦ 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗕𝘆 ➤ ${CREDIT} ✦`;

const creditMsg = () => frame("⛔", "𝗖𝗥𝗘𝗗𝗜𝗧 𝗘𝗥𝗥𝗢𝗥", [
  "⚠️ এই কোডের ক্রেডিট চেঞ্জ করা হয়েছে!", "🚫 তাই এই ফিচারটি কাজ করবে না।", "✅ ঠিক ক্রেডিট ফিরিয়ে দিন।"]);

// ───── গালি ডিটেকশন ─────
// স্পেস + যেকোনো যতিচিহ্ন/সিম্বল (বাংলা দাঁড়ি । সহ) দিয়ে শব্দ আলাদা করা
const SPLIT_RE = /[\s\p{P}\p{S}]+/u;

// NFC করলে ড়/ঢ়/য় সব একই রূপে আসে; লুকানো অক্ষর বাদ
const clean = (t) => String(t).normalize("NFC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").toLowerCase();
const squash = (t) => t.replace(/([a-z])\1+/g, "$1");
const isLatin = (w) => /^[a-z]+$/.test(w);

const SUB_OK = new Set(["fuck", "bitch", "sawya"]);
const canSub = (w) => isLatin(w) && (w.length >= 6 || SUB_OK.has(w));

function badWordIn(text) {
  const t = clean(text);
  const spaced = t.replace(/\s+/g, " ");
  const tokens = t.split(SPLIT_RE).filter(Boolean);

  // "f u c k" / "f.u.c.k" ধরার জন্য: পাশাপাশি এক অক্ষরের টোকেনগুলো জোড়া লাগানো
  const runs = [];
  let cur = "";
  for (const tok of tokens) {
    if (tok.length === 1 && /[a-z]/.test(tok)) cur += tok;
    else { if (cur.length >= 3) runs.push(cur); cur = ""; }
  }
  if (cur.length >= 3) runs.push(cur);

  for (const raw of allWords()) {
    const w = clean(raw).trim().replace(/\s+/g, " ");
    if (!w) continue;

    // একাধিক শব্দ / ইমোজি / সংখ্যা মেশানো: লেখার ভেতর খোঁজা
    if (/\s/.test(w) || /[^a-z\u0980-\u09FF]/.test(w)) {
      if (spaced.includes(w)) return raw;
      if (/^[a-z ]+$/.test(w) && squash(spaced).includes(squash(w))) return raw;
      continue;
    }

    if (isLatin(w)) {
      const sw = squash(w);
      for (const tok of tokens) {
        if (tok === w) return raw;
        const st = squash(tok);
        if (w.length >= 5 && st === sw) return raw;      // fuuuck, chuuudi
        if (canSub(w) && st.includes(sw)) return raw;    // fucking
      }
      if (canSub(w)) for (const r of runs) if (squash(r).includes(sw)) return raw; // f u c k
    } else {
      // বাংলা: ৪+ অক্ষরের শব্দ টোকেনের ভেতরে পেলেই ধরবে (চুদিস, মাগিরা), ছোটগুলো (গুদ, মাং) হুবহু মিললে
      for (const tok of tokens) {
        if (tok === w) return raw;
        if (w.length >= 4 && tok.includes(w)) return raw;
      }
    }
  }
  return null;
}

const adminCache = new Map();
async function getAdmins(api, tid) {
  const c = adminCache.get(tid);
  if (c && Date.now() - c.t < 60000) return c.ids;
  const info = await api.getThreadInfo(tid);
  const ids = (info.adminIDs || []).map((a) => String(a.id || a));
  adminCache.set(tid, { t: Date.now(), ids });
  return ids;
}

const unsend = (api, mid) => new Promise((res) => {
  let done = false;
  const fin = (ok, err) => { if (done) return; done = true; if (!ok) console.log("[antilink2] unsend failed:", err && err.error ? err.error : err); res(ok); };
  try {
    const p = api.unsendMessage(mid, (e) => fin(!e, e));
    if (p && typeof p.then === "function") p.then(() => fin(true), (e) => fin(false, e));
  } catch (e) { fin(false, e); }
});

// ───── অটো স্ক্যান: গালি পেলে শুধু ওই মেসেজ unsend ─────
module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event || !["message", "message_reply"].includes(event.type)) return;
    if (event.isGroup === false) return;
    if (!creditOK()) return;
    const body = String(event.body || "");
    if (!body) return;

    const tid = String(event.threadID);
    const sender = String(event.senderID);
    const botID = String(api.getCurrentUserID());
    if (sender === botID) return;

    const bad = badWordIn(body);
    if (!bad) return;

    const cfg = global.config || {};
    const botAdmins = [].concat(cfg.ADMINBOT || [], cfg.DEVELOPER || [], cfg.OPERATOR || []).map(String);
    if (botAdmins.includes(sender)) return;
    try { if ((await getAdmins(api, tid)).includes(sender)) return; } catch (_) {}

    let ok = await unsend(api, event.messageID);
    if (!ok) { await new Promise((r) => setTimeout(r, 1000)); ok = await unsend(api, event.messageID); }
    console.log(`[antilink2] bad word "${bad}" | msg ${event.messageID} | unsend ${ok ? "request sent" : "FAILED"}`);
  } catch (e) { console.log("[antilink2] Error:", e && e.message ? e.message : e); }
};

// ───── কমান্ড: শব্দ ম্যানেজ ─────
module.exports.run = async function ({ api, event, args }) {
  const tid = String(event.threadID);
  const send = (m) => api.sendMessage(m, tid, event.messageID);
  if (!creditOK()) return send(creditMsg());

  const act = (args[0] || "").toLowerCase();
  const w = args.slice(1).join(" ").trim();
  const wl = w.toLowerCase();

  if (act === "list") {
    const list = allWords();
    return send(frame("📚", "𝗕𝗟𝗢𝗖𝗞𝗘𝗗 𝗪𝗢𝗥𝗗𝗦", [list.map((x, i) => `${i + 1}. ${x}`).join("\n") || "কোনো শব্দ নেই"]));
  }
  if (act === "add" && w) {
    DB.removed = DB.removed.filter((x) => x.toLowerCase() !== wl);
    if (!allWords().some((x) => x.toLowerCase() === wl)) DB.added.push(w);
    save();
    return send(frame("➕", "𝗪𝗢𝗥𝗗 𝗔𝗗𝗗𝗘𝗗", [`✅ "${w}" ব্লক লিস্টে যোগ হয়েছে`]));
  }
  if (act === "del" && w) {
    DB.added = DB.added.filter((x) => x.toLowerCase() !== wl);
    if (DEFAULT_WORDS.some((x) => x.toLowerCase() === wl) && !DB.removed.some((x) => x.toLowerCase() === wl)) DB.removed.push(w);
    save();
    return send(frame("➖", "𝗪𝗢𝗥𝗗 𝗥𝗘𝗠𝗢𝗩𝗘𝗗", [`✅ "${w}" ব্লক লিস্ট থেকে সরানো হয়েছে`]));
  }
  return send(frame("🛡️", "𝗕𝗔𝗗 𝗪𝗢𝗥𝗗 𝗔𝗨𝗧𝗢 𝗨𝗡𝗦𝗘𝗡𝗗", [
    "🤬 গালি দিলে বট ওই মেসেজ unsend করবে", "", "শব্দ ম্যানেজ:", "antilink2 add <শব্দ>", "antilink2 del <শব্দ>", "antilink2 list"]));
};

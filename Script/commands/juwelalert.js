/**
 * ╔══════════════════════════════════════════════════════════╗
 *  JUWEL ALERT  —  Session Alert + Bot Start/Stop Notice
 *  Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  v1.9.0 — ক্রেডিট/কমান্ডের নাম/নোটিশ বদলালে কোড বন্ধ হয়ে যায়; কমান্ড দিলে নোটিশ দেখায়।
 *  v1.8.0 — সব নোটিশে (লক/সেশন ALERT সহ) বট কতক্ষণ চালু ছিল তা দেখায়।
 *           সময়ের ক্রম: সেকেন্ড → মিনিট → ঘণ্টা → দিন।
 *  v1.7.0 — আইডি লক/সেশন সমস্যার নোটিশ একবারই, বট বন্ধের নোটিশও একবারই (রিস্টার্টেও বারবার যাবে না)।
 *           টানা ৫ মিনিট সুস্থ থাকলে তবেই লক খোলে এবং একবার "BACK ONLINE" যায়।
 *  v1.6.0 — প্রতিটি নোটিশে বটের নাম, অ্যাডমিনের নাম ও প্রথম অ্যাডমিন UID (config.json থেকে)।
 *  v1.5.0 — ফেসবুক আইডি লক/লগআউট হয়ে বট বন্ধ হলেও নোটিশ যাবে।
 *
 *  সেটিংস: config.json-এর "JUWEL_ALERT" অংশ (TG_TOKEN, TG_CHAT, DISCORD_WEBHOOK, HEARTBEAT_URL)
 *  অথবা env: JUWEL_TG_TOKEN, JUWEL_TG_CHAT (Telegram) | JUWEL_DISCORD_WEBHOOK (Discord) — env আগে
 *
 *  কমান্ড:  #juwelalert        (অবস্থা দেখায়, শুধু বট-অ্যাডমিন)
 *           #juwelalert test   (টেস্ট নোটিশ পাঠায়)
 */

// এই ফাইলকে `node juwelalert.js --juwel-watch` দিয়ে চালালে এটা ওয়াচডগ হিসেবে চলে
const IS_WATCHER = require.main === module && process.argv.includes("--juwel-watch");

if (!IS_WATCHER) { try { console.log("[JuwelAlert] ফাইল লোড হয়েছে (juwelalert.js)"); } catch (_) {} }

const axios = require("axios");

/* ───────────── config.json থেকে সেটিংস ───────────── */
(function loadAlertSettings() {
  try {
    const fs = require("fs"), path = require("path");
    const file = path.join(__dirname, "..", "..", "config.json");
    if (!fs.existsSync(file)) return;
    const cfg = JSON.parse(fs.readFileSync(file, "utf8")).JUWEL_ALERT || {};
    const map = { TG_TOKEN: "JUWEL_TG_TOKEN", TG_CHAT: "JUWEL_TG_CHAT", DISCORD_WEBHOOK: "JUWEL_DISCORD_WEBHOOK", HEARTBEAT_URL: "JUWEL_HEARTBEAT_URL" };
    Object.keys(map).forEach((k) => {
      const v = cfg[k] === undefined || cfg[k] === null ? "" : String(cfg[k]).trim();
      if (v && !process.env[map[k]]) process.env[map[k]] = v;
    });
  } catch (_) {}
})();

const PROBE_EVERY_MS = Number(process.env.JUWEL_PROBE_MS) || 2 * 60 * 1000;
const PROBE_FAILS_BEFORE_ALERT = 2;
const BOOT_NOTICE_DELAY_MS = Number(process.env.JUWEL_BOOT_MS) || 20 * 1000;
const LOGIN_GRACE_MS = Number(process.env.JUWEL_LOGIN_GRACE_MS) || 3 * 60 * 1000; // এর মধ্যে লগইন না হলে সতর্কতা
const STOP_NOTICE_WAIT_MS = 6000; // বন্ধ হওয়ার আগে নোটিশ পাঠাতে সর্বোচ্চ এত সময় অপেক্ষা
const RECOVER_STABLE_MS = Number(process.env.JUWEL_RECOVER_MS) || 5 * 60 * 1000; // এতক্ষণ টানা সুস্থ থাকলে তবেই "ফিরে এসেছে"
const EPISODE_MAX_MS = 6 * 60 * 60 * 1000; // নিরাপত্তা: ৬ ঘণ্টা পর লক নিজে খুলে যাবে

/* ───────────── একবারই-পাঠানো লক (ফাইলে থাকে, রিস্টার্টেও টিকে) ───────────── */
const LATCH_FILE = require("path").join(__dirname, "..", "..", "juwelalert.latch.json");
function latchRead() {
  try { return JSON.parse(require("fs").readFileSync(LATCH_FILE, "utf8")) || {}; }
  catch (_) { return {}; }
}
function latchWrite(o) {
  try { require("fs").writeFileSync(LATCH_FILE, JSON.stringify(o)); } catch (_) {}
}
// key: "alert" (লক/সেশন সমস্যা) | "stop" (বট বন্ধ)
function canSend(key) {
  const t = latchRead()[key];
  return !(t && Date.now() - t < EPISODE_MAX_MS);
}
function markSent(key) {
  const o = latchRead();
  o[key] = Date.now();
  latchWrite(o);
}
function clearLatch() { latchWrite({}); }

const state = global.__juwelAlert || (global.__juwelAlert = {
  started: false,
  bootAt: Date.now(),
  logHits: [],
  lastLoginIssueAt: 0,
  lockAt: 0,
  lockReason: "",
  probeFails: 0,
  lastProbeOk: null,
  lastProbeAt: 0,
  lastAlertAt: 0,
  alertSending: false,
  okSince: 0,
  down: false,
  downSince: 0,
  bootNoticeSent: false
});

/* ───────────── helpers ───────────── */
const dhakaTime = () => {
  try { return new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { return new Date().toISOString(); }
};
const pad2 = (n) => String(n).padStart(2, "0");
// সেকেন্ড থেকে দিন/ঘণ্টা/মিনিট/সেকেন্ড
const uptimeParts = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};
// সময় সবসময় এই ক্রমে: সেকেন্ড → মিনিট → ঘণ্টা → দিন
const fmtDur = (ms) => {
  const u = uptimeParts(ms / 1000);
  return u.s + "s " + u.m + "m " + u.h + "h " + u.d + "d";
};
// সব নোটিশে একই সাজানো সময়-ব্লক (সেকেন্ড → মিনিট → ঘণ্টা → দিন)
const uptimeLines = (up) =>
  " ┌ ⏳ SECONDS ➤ " + pad2(up.s) + "\n" +
  " ├ ⏰ MINUTES ➤ " + pad2(up.m) + "\n" +
  " ├ 🕐 HOURS ➤ " + pad2(up.h) + "\n" +
  " └ 📆 DAYS ➤ " + pad2(up.d) + "\n" +
  " ✦ " + pad2(up.s) + "s " + pad2(up.m) + "m " + pad2(up.h) + "h " + up.d + "d";

// ইংরেজি অক্ষর ও সংখ্যা → 𝗔𝗕𝗖𝗗 𝟭𝟮𝟯 (Sans-Serif Bold). বাংলা/ইমোজি অপরিবর্তিত থাকে।
const fx = (str) => String(str).replace(/[A-Za-z0-9]/g, (c) => {
  const n = c.charCodeAt(0);
  if (n >= 65 && n <= 90) return String.fromCodePoint(0x1D5D4 + n - 65);
  if (n >= 97 && n <= 122) return String.fromCodePoint(0x1D5EE + n - 97);
  return String.fromCodePoint(0x1D7EC + n - 48);
});
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐"; // ফন্ট-রূপান্তর হয় না, যেমন আছে তেমন


/* ───────────── সুরক্ষা: ক্রেডিট/নাম বদলালে কোড বন্ধ ───────────── */
// ক্রেডিট (বডি মেসেজের CREDIT), ক্রেডিট (config.credits), কমান্ডের নাম (config.name) —
// এই তিনটার যেকোনো একটা বদলালে কোড চলবে না; কমান্ড দিলে নিচের নোটিশ দেখাবে।
// নোটিশের লেখা বদলালেও কোড চলবে না। (মান সরাসরি নয়, SHA-256 হ্যাশে যাচাই হয়)
const _sha = (x) => require("crypto").createHash("sha256").update(String(x), "utf8").digest("hex");
const _H = {
  credit: "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81",
  name: "864f6c9e58252e2bf3c51f9ca68be25dcfaf82ebdf23b4b51e8a40f974e6d06d",
  notice: "c4dbf6d8de79cd4a8c5f048046657a9a4267911ae0798e6559adf61f7b6d6ac6"
};
const TAMPER_NOTICE = "⛔ এই কোডের ক্রেডিট বা কমান্ডের নাম পরিবর্তন করা হয়েছে, তাই কোড বন্ধ করা হয়েছে।\nআসল ক্রেডিট ও নাম ফিরিয়ে দিন, তারপর বট রিস্টার্ট দিন।";
function integrityOK() {
  try {
    const cfg = (module.exports && module.exports.config) || {};
    return _sha(CREDIT) === _H.credit &&
           _sha(cfg.credits) === _H.credit &&
           _sha(cfg.name) === _H.name &&
           _sha(TAMPER_NOTICE) === _H.notice;
  } catch (_) { return false; }
}

const stripAnsi = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, "");

function log(msg, level) {
  try { require("../../utils/log.js")("[JuwelAlert] " + msg, level || "info"); }
  catch (_) { try { process.stdout.write("[JuwelAlert] " + msg + "\n"); } catch (__) {} }
}

function adminIDs() {
  const c = global.config || {};
  return [...new Set([...(c.ADMINBOT || []), ...(c.DEVELOPER || [])].map(String))];
}

// সাম্প্রতিক লক/লগইন সমস্যা ধরা পড়ে থাকলে কারণের আগে বসানো হয়
function withLock(reason) {
  if (state.lockAt && Date.now() - state.lockAt < 15 * 60 * 1000) {
    return "🔒 ফেসবুক আইডি লক/লগইন সমস্যা (" + state.lockReason + ") — " + reason;
  }
  return reason;
}

async function sendExternal(text) {
  if (!integrityOK()) return false; // ক্রেডিট/নাম বদলানো — পাঠানো বন্ধ
  text = withCredit(text); // ফন্ট + ক্রেডিট সব বার্তায়
  const tgToken = process.env.JUWEL_TG_TOKEN, tgChat = process.env.JUWEL_TG_CHAT;
  const dc = process.env.JUWEL_DISCORD_WEBHOOK;
  let sent = false;
  // প্রতিটি মাধ্যমের ফলাফল: null = সেট করা নেই, true = গেছে, false = ব্যর্থ
  const res = (state.lastSend = { tg: null, dc: null, tgErr: "", dcErr: "" });
  const jobs = [];
  if (tgToken && tgChat) {
    jobs.push((async () => {
      try {
        await axios.post("https://api.telegram.org/bot" + tgToken + "/sendMessage", { chat_id: tgChat, text }, { timeout: 15000 });
        sent = true; res.tg = true;
      } catch (e) {
        res.tg = false;
        res.tgErr = String((e.response && e.response.data && e.response.data.description) || e.message || e).slice(0, 80);
        log("Telegram পাঠানো যায়নি: " + (e.message || e), "warn");
      }
    })());
  }
  if (dc) {
    jobs.push((async () => {
      try { await axios.post(dc, { content: text.slice(0, 1900) }, { timeout: 15000 }); sent = true; res.dc = true; }
      catch (e) {
        res.dc = false;
        res.dcErr = String(e.message || e).slice(0, 80);
        log("Discord পাঠানো যায়নি: " + (e.message || e), "warn");
      }
    })());
  }
  // Telegram ও Discord একসাথে (parallel) যায় — দ্রুত পৌঁছানোর জন্য
  await Promise.all(jobs);
  if (!tgToken && !tgChat && !dc) log("JUWEL_TG_TOKEN/JUWEL_TG_CHAT বা JUWEL_DISCORD_WEBHOOK সেট করা নেই — শুধু লগে লেখা হলো।", "warn");
  return sent;
}

async function sendMessengerToAdmins(text) {
  if (!integrityOK()) return;
  text = withCredit(text); // ফন্ট + ক্রেডিট সব বার্তায়
  const api = global.client && global.client.api;
  if (!api) return;
  for (const id of adminIDs()) {
    try { await new Promise((res) => api.sendMessage(text, id, () => res())); } catch (_) {}
  }
}

/* ───────────── alerts ───────────── */
const HEAD = (title) => "╔══════════════════╗\n   " + title + "\n╚══════════════════╝";
const LINE = "━━━━━━━━━━━━━━━━━━━━";

// লক/সেশন সমস্যার নোটিশ — একটা সমস্যায় মাত্র একবার (রিস্টার্ট হলেও)
async function raiseAlert(reason) {
  const now = Date.now();
  if (!state.down) { state.down = true; state.downSince = now; }
  if (!canSend("alert")) return; // আগেই একবার গেছে → আর নয়
  // পাঠানো চলছে, বা আগের চেষ্টা ব্যর্থ হয়ে থাকলে ১ মিনিটের আগে আবার নয়
  if (state.alertSending || now - state.lastAlertAt < 60 * 1000) return;
  state.alertSending = true;
  state.lastAlertAt = now;
  const upA = uptimeParts(process.uptime());
  const text =
    HEAD("🚨 JUWEL BOT • ALERT") + "\n\n" +
    "🔴 STATUS ➤ SESSION PROBLEM\n" + LINE + "\n" +
    "📛 কারণ ➤ " + reason + "\n" + LINE + "\n" +
    "⏱ চালু ছিল\n" + uptimeLines(upA) + "\n" + LINE + "\n" +
    "🕒 TIME ➤ " + dhakaTime() + "\n" + LINE + "\n" +
    "🛠 করণীয়: নতুন appstate.json (কুকি) বসিয়ে বট রিস্টার্ট দিন।";
  log("সতর্কতা: " + reason, "error");
  try {
    const ok = await sendExternal(text);
    if (ok) markSent("alert");
  } finally { state.alertSending = false; }
}

// সমস্যা মিটে টানা ৫ মিনিট সুস্থ থাকলে একবার "BACK ONLINE" + লক খুলে দেয়
async function raiseRecovery() {
  const hadAlert = state.down || !canSend("alert");
  const o = latchRead();
  const ts = Object.values(o).filter(Boolean);
  const since = state.downSince || (ts.length ? Math.min.apply(null, ts) : Date.now());
  const downFor = Date.now() - since;
  clearLatch(); // নতুন সমস্যা হলে আবার একবার নোটিশ যাবে
  state.down = false; state.downSince = 0; state.probeFails = 0; state.lastAlertAt = 0;
  state.lockAt = 0; state.lockReason = ""; state.okSince = 0;
  if (!hadAlert) return; // শুধু সাধারণ বন্ধ/চালু হলে আলাদা "ফিরে এসেছে" নোটিশ নয়
  const text =
    HEAD("✅ JUWEL BOT • BACK ONLINE") + "\n\n" +
    "🟢 STATUS ➤ ONLINE\n" + LINE + "\n" +
    "⏳ অফলাইন ছিল ➤ " + fmtDur(downFor) + "\n" +
    "🕒 TIME ➤ " + dhakaTime();
  log("সেশন ফিরে এসেছে।", "success");
  await sendExternal(text);
  await sendMessengerToAdmins(text);
}

/* ───────────── stop notice (বট বন্ধ হলে) ───────────── */
let stopPromise = null;

// startMs/endMs দিলে সেটা দিয়ে uptime হিসাব হয় (watchdog ব্যবহার করে)
function stopText(reason, startMs, endMs) {
  const end = endMs || Date.now();
  const start = startMs || (end - process.uptime() * 1000);
  const up = uptimeParts((end - start) / 1000);
  let started;
  try { started = new Date(start).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { started = new Date(start).toISOString(); }
  let stopped;
  try { stopped = new Date(end).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { stopped = new Date(end).toISOString(); }

  return (
    HEAD("🔴 JUWEL BOT • STOPPED") + "\n\n" +
    "🔴 STATUS ➤ OFFLINE\n" + LINE + "\n" +
    "📛 কারণ ➤ " + reason + "\n" + LINE + "\n" +
    "⏱ চালু ছিল\n" + uptimeLines(up) + "\n" + LINE + "\n" +
    "📅 STARTED ➤ " + started + "\n" +
    "🕒 STOPPED ➤ " + stopped
  );
}

// ওয়াচডগকে লাইন পাঠায় (SENT / REASON:... / CRASH:... / EXIT:...)
//   REASON = বট নিজে নোটিশ পাঠাচ্ছে (ব্যর্থ হলে ওয়াচডগ এই কারণসহ আবার পাঠাবে)
//   CRASH  = শুধু সম্ভাব্য কারণ জানিয়ে রাখা (বট হঠাৎ মরলে ওয়াচডগ এটা ব্যবহার করবে)
function watchSend(line) {
  try {
    const w = global.__juwelAlertWatcher;
    if (w && w.stdin && w.stdin.writable) w.stdin.write(line + "\n");
  } catch (_) {}
}

// বাইরের হার্টবিট সার্ভিসকে সাথে সাথে "ফেল" জানায়
function heartbeatFail() {
  const HB = process.env.JUWEL_HEARTBEAT_URL;
  if (!HB) return;
  try { axios.get(HB.replace(/\/$/, "") + "/fail", { timeout: 5000 }).catch(() => {}); } catch (_) {}
}

// একবারই পাঠায়; একই promise ফেরত দেয় যাতে exit তার জন্য অপেক্ষা করতে পারে
function sendStopNotice(reason) {
  if (stopPromise) return stopPromise;
  reason = withLock(reason);
  log("বট বন্ধ হচ্ছে: " + reason, "warn");
  watchSend("REASON:" + reason);
  heartbeatFail();
  // এই সমস্যায় আগেই একবার STOPPED গেছে → আর পাঠাবে না (ওয়াচডগকেও জানিয়ে দেয়)
  if (!canSend("stop")) {
    watchSend("SENT");
    stopPromise = Promise.resolve(false);
    return stopPromise;
  }
  stopPromise = Promise.race([
    sendExternal(stopText(reason)).then((ok) => { if (ok) { markSent("stop"); watchSend("SENT"); } return ok; }).catch(() => false),
    new Promise((res) => setTimeout(res, STOP_NOTICE_WAIT_MS))
  ]);
  return stopPromise;
}

function installShutdownHook() {
  if (global.__juwelAlertShutdownHooked) return;
  global.__juwelAlertShutdownHooked = true;

  const origExit = process.exit.bind(process);

  // কমান্ড/কোড/লগইন-এরর হ্যান্ডলার থেকে process.exit() ডাকলে — আগে নোটিশ, তারপর বন্ধ
  process.exit = function (code) {
    const c = code === undefined ? 0 : code;
    sendStopNotice("process.exit(" + c + ") — কোড দিয়ে বন্ধ করা হয়েছে").then(
      () => origExit(c),
      () => origExit(c)
    );
  };

  // Ctrl+C, systemd/pm2/docker stop, টার্মিনাল বন্ধ
  const names = {
    SIGINT: "Ctrl+C (SIGINT)",
    SIGTERM: "stop সিগন্যাল (SIGTERM)",
    SIGHUP: "টার্মিনাল বন্ধ (SIGHUP)",
    SIGQUIT: "quit সিগন্যাল (SIGQUIT)",
    SIGBREAK: "Ctrl+Break (SIGBREAK)"
  };
  Object.keys(names).forEach((sig) => {
    try {
      process.on(sig, () => {
        sendStopNotice(names[sig] + " — ম্যানুয়ালি বন্ধ").then(() => origExit(0), () => origExit(0));
      });
    } catch (_) {}
  });

  // লগইন ব্যর্থ হওয়ার পর কিছু চালু না থাকলে Node নিজে থেকেই থামে (process.exit ছাড়াই)।
  // তখন এই ইভেন্টে নোটিশ পাঠানো হয়; পাঠানোর কাজ থাকায় প্রসেস নোটিশ শেষ হওয়া পর্যন্ত বাঁচে।
  try {
    process.on("beforeExit", () => {
      sendStopNotice("বট নিজে থেকেই থেমে গেছে (কোনো কাজ বাকি নেই — লগইন ব্যর্থ/আইডি লক হতে পারে)");
    });
  } catch (_) {}

  // ক্র্যাশ হলে কারণটা ওয়াচডগকে জানিয়ে রাখে (আচরণ বদলায় না, শুধু নজর রাখে)
  try {
    process.on("uncaughtExceptionMonitor", (err) => {
      const r = "ক্র্যাশ — " + String((err && (err.stack || err.message)) || err).split("\n")[0].slice(0, 200);
      watchSend("CRASH:" + withLock(r));
      heartbeatFail();
    });
  } catch (_) {}

  // যেকোনো উপায়ে প্রসেস শেষ হলে exit code জানিয়ে রাখে (শুধু sync লেখা চলে)
  process.on("exit", (code) => { watchSend("EXIT:" + code); });
}

/* ───────────── watchdog (আলাদা প্রসেস) ───────────── */
function startWatchdog() {
  if (global.__juwelAlertWatcher) return;
  if (String(process.env.JUWEL_WATCHDOG || "").toLowerCase() === "off") return;
  try {
    const cp = require("child_process");
    const child = cp.spawn(process.execPath, [__filename, "--juwel-watch"], {
      detached: true,
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true,
      env: Object.assign({}, process.env, {
        JW_PID: String(process.pid),
        JW_START: String(Date.now() - Math.round(process.uptime() * 1000))
      })
    });
    child.on("error", () => {});
    if (child.stdin) child.stdin.on("error", () => {});
    child.unref();
    try { child.stdin.unref(); } catch (_) {}
    global.__juwelAlertWatcher = child;
    log("watchdog চালু (pid " + child.pid + ") — ক্র্যাশ/kill/লক হলেও বন্ধ-নোটিশ যাবে।", "success");
  } catch (e) { log("watchdog চালু করা যায়নি: " + e.message, "warn"); }
}

// ওয়াচডগ প্রসেসের ভেতরের কাজ
function runWatcher() {
  // pm2/systemd/Docker stop-এ পুরো প্রসেস-ট্রি-তে সিগন্যাল যায়।
  // ওয়াচডগ সেগুলো উপেক্ষা করে বেঁচে থাকে, যাতে বট মরার পর নোটিশ পাঠাতে পারে।
  ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT", "SIGBREAK"].forEach((s) => { try { process.on(s, () => {}); } catch (_) {} });
  try { process.on("uncaughtException", () => {}); } catch (_) {}
  try { process.on("unhandledRejection", () => {}); } catch (_) {}

  const parentPid = Number(process.env.JW_PID) || 0;
  const startMs = Number(process.env.JW_START) || Date.now();
  let reason = "", crash = "", exitCode = null, handled = false, finishing = false, buf = "";

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line === "SENT") handled = true;
      else if (line.indexOf("REASON:") === 0) reason = line.slice(7);
      else if (line.indexOf("CRASH:") === 0) crash = line.slice(6);
      else if (line.indexOf("EXIT:") === 0) exitCode = line.slice(5);
    }
  });

  const finish = async () => {
    if (finishing) return;
    finishing = true;
    // বট মরে গেছে, তাই আর কোনো SENT আসবে না; পাইপের বাকি ডাটা পড়ার জন্য অল্প অপেক্ষা
    await new Promise((r) => setTimeout(r, 300));
    // বট নিজে পাঠায়নি এবং এই সমস্যায় আগে STOPPED যায়নি — তখনই ওয়াচডগ পাঠাবে
    if (!handled && canSend("stop")) {
      const why = reason || crash ||
        (exitCode !== null && exitCode !== "undefined"
          ? "বট বন্ধ হয়েছে (exit code " + exitCode + ")"
          : "হঠাৎ বন্ধ — kill -9 / মেমরি শেষ / হোস্ট জোর করে বন্ধ করেছে");
      const msg = stopText(why + " [watchdog]", startMs, Date.now());
      // একবার ব্যর্থ হলে আরও ২ বার চেষ্টা
      for (let i = 0; i < 3; i++) {
        let ok = false;
        try { ok = await sendExternal(msg); } catch (_) {}
        if (ok) { markSent("stop"); break; }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    process.exit(0);
  };

  process.stdin.on("end", finish);
  process.stdin.on("close", finish);
  process.stdin.on("error", finish);

  // stdin বন্ধ না হলেও PID দিয়ে বট মরেছে কি না দেখে (প্রতি ১ সেকেন্ডে)
  setInterval(() => {
    if (!parentPid) return;
    try { process.kill(parentPid, 0); }
    catch (e) { if (e.code !== "EPERM") finish(); }
  }, 1000);

  process.stdin.resume();
}

/* ───────────── log watcher ───────────── */
const BAD_PATTERNS = [
  /FATAL: Session/i, /Session looks dead/i, /Login failed \[/i,
  /Fresh login failed/i, /re-login required/i, /checkpoint/i, /not logged in/i
];
const GOOD_PATTERNS = [/recovered after \d+ attempt/i, /traffic resumed/i, /session established/i];

// এগুলো লগে দেখলেই সতর্কতা (একবার) + ওয়াচডগকে কারণ জানানো হয় (বট মরার অপেক্ষা না করে)
const LOCK_PATTERNS = [
  /Error retrieving userID/i,
  /login[_ ]?blocked/i,
  /checkpoint/i,
  /account.{0,40}(locked|disabled|suspended|restricted|blocked)/i,
  /(locked|disabled|suspended|blocked).{0,40}account/i,
  /(Fresh )?login failed/i,
  /login (approval|error)/i,
  /FATAL: Session/i,
  /Session looks dead/i,
  /not logged in/i,
  /appstate.{0,40}(die|dead|invalid|expired)/i
];

function installLogWatcher() {
  if (global.__juwelAlertLogHooked) return;
  global.__juwelAlertLogHooked = true;
  ["log", "warn", "error"].forEach((method) => {
    const orig = console[method];
    console[method] = function () {
      try {
        const line = stripAnsi(Array.prototype.map.call(arguments, (a) => (typeof a === "string" ? a : "")).join(" "));
        if (line && line.length < 2000 && !/JuwelAlert/.test(line) && line.indexOf("📩") === -1) {
          if (LOCK_PATTERNS.some((r) => r.test(line))) {
            const short = line.trim().slice(0, 160);
            state.lockAt = Date.now();
            state.lockReason = short;
            state.okSince = 0; // লক দেখা গেলে "সুস্থ থাকার" গণনা আবার শুরু
            // বট এরপর মরলে ওয়াচডগ এই কারণটাই জানাবে
            watchSend("CRASH:🔒 ফেসবুক আইডি লক/লগইন সমস্যা — " + short);
            // নোটিশ একবারই যাবে (raiseAlert নিজেই লক দেখে)
            raiseAlert("🔒 লক/লগইন সমস্যা ধরা পড়েছে | লগ: " + short);
          }
          if (BAD_PATTERNS.some((r) => r.test(line))) {
            state.lastLoginIssueAt = Date.now();
            state.logHits.push({ t: Date.now(), line: line.trim().slice(0, 160) });
            if (state.logHits.length > 20) state.logHits.shift();
          } else if (GOOD_PATTERNS.some((r) => r.test(line))) {
            // লগ দেখে আর "ফিরে এসেছে" নোটিশ নয় — শুধু গণনা রিসেট; রিকভারি যাচাই করে probe()
            state.lastLoginIssueAt = 0; state.logHits = []; state.probeFails = 0;
          }
        }
      } catch (_) {}
      return orig.apply(console, arguments);
    };
  });
}

/* ───────────── active probe ───────────── */
function evaluate(reason) {
  state.okSince = 0;
  const recent = state.lastLoginIssueAt && (Date.now() - state.lastLoginIssueAt < 15 * 60 * 1000);
  if (state.probeFails >= PROBE_FAILS_BEFORE_ALERT || (state.probeFails >= 1 && recent)) {
    const extra = recent && state.logHits.length ? " | লগ: " + state.logHits[state.logHits.length - 1].line : "";
    raiseAlert(reason + extra);
  }
}

function probe() {
  const api = global.client && global.client.api;
  state.lastProbeAt = Date.now();
  if (!api || typeof api.getCurrentUserID !== "function") {
    state.lastProbeOk = false;
    // লগইন চলছে — কিছুক্ষণ অপেক্ষা
    if (Date.now() - state.bootAt < LOGIN_GRACE_MS) return;
    state.probeFails++;
    state.okSince = 0;
    return raiseAlert(withLock("লগইন সম্পন্ন হয়নি (" + fmtDur(Date.now() - state.bootAt) + " ধরে api নেই) — আইডি লক/কুকি নষ্ট হতে পারে"));
  }
  let uid;
  try { uid = api.getCurrentUserID(); } catch (_) {}
  if (!uid) { state.probeFails++; state.lastProbeOk = false; return evaluate("api থেকে UID পাওয়া যাচ্ছে না"); }

  let done = false;
  const timer = setTimeout(() => {
    if (done) return; done = true;
    state.probeFails++; state.lastProbeOk = false;
    evaluate("ফেসবুক সার্ভার থেকে সাড়া নেই (timeout)");
  }, 25000);
  try {
    api.getUserInfo(uid, (err) => {
      if (done) return; done = true; clearTimeout(timer);
      if (err) {
        state.probeFails++; state.lastProbeOk = false;
        evaluate("সেশন পরীক্ষা ব্যর্থ: " + String((err && (err.error || err.message)) || err).slice(0, 120));
      } else {
        state.probeFails = 0; state.lastProbeOk = true;
        // সমস্যার পর টানা RECOVER_STABLE_MS সুস্থ থাকলে তবেই রিকভারি (বারবার ওঠানামায় নোটিশ যাবে না)
        if (state.down || !canSend("alert") || !canSend("stop")) {
          if (!state.okSince) state.okSince = Date.now();
          const stable = Date.now() - state.okSince >= RECOVER_STABLE_MS;
          const noRecentLock = Date.now() - (state.lockAt || 0) >= RECOVER_STABLE_MS;
          if (stable && noRecentLock) raiseRecovery();
        }
      }
    });
  } catch (e) {
    done = true; clearTimeout(timer);
    state.probeFails++; state.lastProbeOk = false;
    evaluate("পরীক্ষা চালাতে ত্রুটি: " + e.message);
  }
}

/* ───────────── heartbeat (ঐচ্ছিক, বাইরের মনিটর) ───────────── */
function startHeartbeat() {
  const HB = process.env.JUWEL_HEARTBEAT_URL;
  if (!HB || global.__juwelAlertHeartbeat) return;
  global.__juwelAlertHeartbeat = true;
  const ping = () => { try { axios.get(HB, { timeout: 10000 }).catch(() => {}); } catch (_) {} };
  ping();
  const h = setInterval(ping, 60 * 1000);
  if (h.unref) h.unref();
  log("heartbeat চালু — বাইরের মনিটরে প্রতি ৬০ সেকেন্ডে ping যাবে।", "success");
}

/* ───────────── boot ───────────── */
function start() {
  if (state.started) return;
  if (!integrityOK()) { try { console.log("[JuwelAlert] ক্রেডিট/কমান্ডের নাম বদলানো হয়েছে — কোড বন্ধ।"); } catch (_) {} return; }
  state.started = true;
  installLogWatcher();
  installShutdownHook();
  startWatchdog();
  startHeartbeat();
  const t = setInterval(probe, PROBE_EVERY_MS);
  if (t.unref) t.unref();

  // চালু-নোটিশ: লগইন সফল হওয়ার পর (api পাওয়া গেলে) পাঠায়।
  // লগইন না হলে "চালু" নোটিশ যাবে না; সেক্ষেত্রে probe() সতর্কতা দেবে।
  const sendBoot = async () => {
    if (!canSend("alert")) return; // আইডি লক/সেশন সমস্যা চলছে — "STARTED" নোটিশ নয়
    const text =
      HEAD("🟢 JUWEL BOT • STARTED") + "\n\n" +
      "🟢 STATUS ➤ ONLINE\n" + LINE + "\n" +
      uptimeBlock() + "\n" + LINE + "\n" +
      "🕒 TIME ➤ " + dhakaTime() + "\n" +
      "⚙️ COMMANDS ➤ " + (global.client && global.client.commands ? global.client.commands.size : "?");
    // Telegram/Discord-এও যায় (বন্ধ করতে env: JUWEL_TG_BOOT=off)
    if (String(process.env.JUWEL_TG_BOOT || "").toLowerCase() !== "off") await sendExternal(text);
    await sendMessengerToAdmins(text);
  };
  const waitLogin = () => {
    if (state.bootNoticeSent) return;
    const api = global.client && global.client.api;
    if (!api) {
      if (Date.now() - state.bootAt < 10 * 60 * 1000) {
        const r = setTimeout(waitLogin, 5000);
        if (r.unref) r.unref();
      }
      return;
    }
    state.bootNoticeSent = true;
    sendBoot();
  };
  const b = setTimeout(waitLogin, BOOT_NOTICE_DELAY_MS);
  if (b.unref) b.unref();
  log("চালু হয়েছে — সেশন নজরদারি শুরু।", "success");
}

function healthText() {
  const up = uptimeParts(process.uptime());
  const startedAt = new Date(Date.now() - process.uptime() * 1000);
  const probeTxt = state.lastProbeOk === null ? "PENDING" : state.lastProbeOk ? "✅ OK" : "❌ FAILED";
  const probeAgo = state.lastProbeAt ? " (" + fmtDur(Date.now() - state.lastProbeAt) + " ago)" : "";
  const tg = process.env.JUWEL_TG_TOKEN && process.env.JUWEL_TG_CHAT ? "ON ✅" : "OFF ❌";
  const dc = process.env.JUWEL_DISCORD_WEBHOOK ? "ON ✅" : "OFF ❌";
  const wd = global.__juwelAlertWatcher ? "ON ✅" : "OFF ❌";
  const hb = process.env.JUWEL_HEARTBEAT_URL ? "ON ✅" : "OFF ❌";
  const ram = Math.round(process.memoryUsage().rss / 1048576);
  const cmds = global.client && global.client.commands ? global.client.commands.size : "?";
  let started;
  try { started = startedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { started = startedAt.toISOString(); }

  return (
    HEAD("🤖 JUWEL BOT • STATUS") + "\n\n" +
    (state.down ? "🔴 STATUS ➤ PROBLEM" : "🟢 STATUS ➤ ONLINE") + "\n" + LINE + "\n" +
    "⏱ UPTIME\n" + uptimeLines(up) + "\n" + LINE + "\n" +
    "📅 STARTED ➤ " + started + "\n" +
    "🕒 NOW ➤ " + dhakaTime() + "\n" + LINE + "\n" +
    "🩺 HEALTH CHECK\n" +
    " ┌ RESULT ➤ " + probeTxt + probeAgo + "\n" +
    " ├ FAILS IN ROW ➤ " + state.probeFails + "\n" +
    " └ LOGIN WARNINGS ➤ " + state.logHits.length + "\n" + LINE + "\n" +
    "📡 ALERT CHANNELS\n" +
    " ┌ TELEGRAM ➤ " + tg + "\n" +
    " ├ DISCORD ➤ " + dc + "\n" +
    " ├ WATCHDOG ➤ " + wd + "\n" +
    " └ HEARTBEAT ➤ " + hb + "\n" + LINE + "\n" +
    "💾 RAM ➤ " + ram + " MB\n" +
    "⚙️ COMMANDS ➤ " + cmds
  );
}

/* ───────────── uptime ব্লক (test ও চালু-নোটিশে ব্যবহার হয়) ───────────── */
function uptimeBlock() {
  const up = uptimeParts(process.uptime());
  const startedAt = new Date(Date.now() - process.uptime() * 1000);
  let started;
  try { started = startedAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { started = startedAt.toISOString(); }
  return "⏱ UPTIME\n" + uptimeLines(up) + "\n" + LINE + "\n" + "📅 STARTED ➤ " + started;
}

/* ───────────── test notice (সাজানো) ───────────── */
function testText() {
  const tg = process.env.JUWEL_TG_TOKEN && process.env.JUWEL_TG_CHAT ? "CONNECTED ✅" : "NOT SET ❌";
  const dc = process.env.JUWEL_DISCORD_WEBHOOK ? "CONNECTED ✅" : "NOT SET ❌";
  const wd = global.__juwelAlertWatcher ? "ACTIVE ✅" : "OFF ❌";
  const hb = process.env.JUWEL_HEARTBEAT_URL ? "ACTIVE ✅" : "NOT SET ⚪";
  const cmds = global.client && global.client.commands ? global.client.commands.size : "?";
  return (
    HEAD("🧪 JUWEL ALERT • TEST") + "\n\n" +
    "🎉 অভিনন্দন! এই বার্তা পেয়েছেন মানে\n" +
    "আপনার সতর্কতা ব্যবস্থা ১০০% ঠিক আছে।\n" + LINE + "\n" +
    "📡 ALERT CHANNELS\n" +
    " ┌ ✈️ TELEGRAM ➤ " + tg + "\n" +
    " ├ 💬 DISCORD ➤ " + dc + "\n" +
    " ├ 🐕 WATCHDOG ➤ " + wd + "\n" +
    " └ 💓 HEARTBEAT ➤ " + hb + "\n" + LINE + "\n" +
    "🔔 আপনি যা যা জানতে পারবেন\n" +
    " ┌ 🟢 বট চালু হলে\n" +
    " ├ 🔴 বট বন্ধ হলে (ক্র্যাশ/আইডি লক সহ) — একবার\n" +
    " ├ 🚨 সেশন/লগইন সমস্যা হলে — একবার\n" +
    " └ ✅ সেশন ফিরে এলে\n" + LINE + "\n" +
    uptimeBlock() + "\n" + LINE + "\n" +
    "⚙️ COMMANDS ➤ " + cmds + "\n" +
    "🕒 TIME ➤ " + dhakaTime()
  );
}

function testResultText(ok) {
  const r = state.lastSend || { tg: null, dc: null, tgErr: "", dcErr: "" };
  const st = (v, err) => v === true ? "✅ SENT" : v === false ? "❌ FAILED" + (err ? " (" + err + ")" : "") : "⚪ NOT SET";
  return (
    HEAD(ok ? "✅ TEST • SUCCESS" : "❌ TEST • FAILED") + "\n\n" +
    "📬 DELIVERY REPORT\n" +
    " ┌ ✈️ TELEGRAM ➤ " + st(r.tg, r.tgErr) + "\n" +
    " └ 💬 DISCORD ➤ " + st(r.dc, r.dcErr) + "\n" + LINE + "\n" +
    (ok
      ? "🎯 টেস্ট বার্তা পাঠানো হয়েছে।\nTelegram/Discord ইনবক্স চেক করুন।"
      : "🛠 পাঠানো যায়নি। এগুলো দেখুন:\n" +
        " ┌ JUWEL_TG_TOKEN সঠিক কি না\n" +
        " ├ JUWEL_TG_CHAT (chat id) সঠিক কি না\n" +
        " ├ টেলিগ্রামে বটকে আগে /start দিয়েছেন কি না\n" +
        " └ JUWEL_DISCORD_WEBHOOK সঠিক কি না") + "\n" + LINE + "\n" +
    "🕒 TIME ➤ " + dhakaTime()
  );
}

// বটের নাম / অ্যাডমিনের নাম / প্রথম অ্যাডমিন UID — config.json থেকে (লগইনের আগে ও ওয়াচডগেও কাজ করে)
//   BOTNAME, BOTADMINNAME, ADMINBOT[0]
let _botInfo = null;
function botInfo() {
  if (_botInfo) return _botInfo;
  let c = {};
  try {
    const fs = require("fs"), path = require("path");
    const file = path.join(__dirname, "..", "..", "config.json");
    if (fs.existsSync(file)) c = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {}
  const g = global.config || {};
  const pick = (k) => String(c[k] !== undefined && c[k] !== "" ? c[k] : (g[k] !== undefined ? g[k] : "")).trim();
  const admins = (Array.isArray(c.ADMINBOT) && c.ADMINBOT.length ? c.ADMINBOT : g.ADMINBOT) || [];
  const info = { name: pick("BOTNAME") || "—", admin: pick("BOTADMINNAME") || "—", uid: admins.length ? String(admins[0]) : "—" };
  // config সম্পূর্ণ পাওয়া গেলে মনে রাখি; না পেলে পরের বার আবার চেষ্টা
  if (c.BOTNAME || g.BOTNAME) _botInfo = info;
  return info;
}
const infoBlock = () => {
  const b = botInfo();
  return "🤖 " + fx("BOT") + " ➤ " + b.name + "\n👑 " + fx("ADMIN") + " ➤ " + b.admin + "\n🆔 " + fx("UID") + " ➤ " + b.uid;
};

// কার্ড = ফন্ট-রূপান্তরিত টেক্সট + বট/অ্যাডমিন/UID + (রূপান্তরহীন) ক্রেডিট লাইন
const withCredit = (t) => fx(t) + "\n" + LINE + "\n" + infoBlock() + "\n" + LINE + "\n✨ Credit ➤ " + CREDIT;

/* ───────────── command ───────────── */
module.exports.config = {
  name: "juwelalert",
  aliases: ["jalert"],
  version: "1.9.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "সেশন সতর্কতা ও বট চালু/বন্ধ নোটিশ",
  commandCategory: "system",
  usages: "juwelalert [test]",
  cooldowns: 5
};

module.exports.onLoad = function () {
  try { start(); } catch (e) { log("start ত্রুটি: " + e.message, "error"); }
};

// onLoad না চললেও (কিছু লোডারে) প্রথম ইভেন্টেই চালু হয়ে যাবে
module.exports.handleEvent = function () {
  if (!integrityOK()) return;
  if (!state.started) { try { start(); } catch (_) {} }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!integrityOK()) return api.sendMessage(TAMPER_NOTICE, threadID, messageID); // ক্রেডিট/নাম বদলানো
  if (!state.started) start();
  if ((args[0] || "").toLowerCase() === "test") {
    const ok = await sendExternal(testText());
    return api.sendMessage(withCredit(testResultText(ok)), threadID, messageID);
  }
  return api.sendMessage(withCredit(healthText()), threadID, messageID);
};

// ওয়াচডগ মোডে শুধু নজরদারি চলে; নইলে স্বাভাবিকভাবে চালু
if (IS_WATCHER) {
  if (!integrityOK()) process.exit(0); // ক্রেডিট/নাম বদলানো — ওয়াচডগও চলবে না
  try { runWatcher(); } catch (_) { process.exit(1); }
} else {
  // ফাইল লোড হওয়ার সাথে সাথেই চালু — onLoad/handleEvent না চললেও নজরদারি কাজ করবে
  try { start(); } catch (e) { log("start ত্রুটি: " + e.message, "error"); }
          }

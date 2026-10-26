/**
 * ╔══════════════════════════════════════════════════════════╗
 *  JUWEL ALERT  —  Session Alert + Bot Start/Stop Notice
 *  Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  v2.3.0 — • বট বন্ধ হওয়ার সাথে সাথে (১-২ সেকেন্ডের মধ্যে) STOPPED নোটিশ।
 *           • আপটাইম এখন ইংরেজিতে সাজানো ব্লক: Days / Hours / Minutes / Seconds আলাদা লাইনে।
 *  v2.2.0 — বট অনলাইন হতে কত সেকেন্ড লাগলো দেখায়; সব বার্তা UI কার্ড ডিজাইনে।
 *  v2.1.0 — ক্রেডিট-লক (JUWEL + বনি মাস); config.json থেকে টোকেন; ওয়াচডগ; লক-ডিটেক্ট।
 *
 *  ⚠️ সবচেয়ে জরুরি (একবারের কাজ):
 *  আপনার বটের যে মূল ফাইলে login চলে (যেমন Priyansh.js / main.js / index.js),
 *  তার একদম উপরে এই লাইন বসান (পাথ নিজের ফোল্ডার অনুযায়ী):
 *
 *      require("./modules/commands/juwelalert.js");
 *
 *  (বিকল্প: `node -r ./modules/commands/juwelalert.js Priyansh.js` দিয়ে চালান।)
 *
 *  কী করে:
 *   ১) বট চালু (এবং লগইন সফল) হলে Telegram/Discord + মেসেঞ্জার অ্যাডমিনদের "চালু" নোটিশ।
 *   ২) সেশন মরলে / লক হলে / লগইন ব্যর্থ হলে সাথে সাথে সতর্কতা।
 *   ৩) লগইন ৩ মিনিটের মধ্যে সম্পন্ন না হলে সতর্কতা।
 *   ৪) সেশন ফিরলে "আবার অনলাইন" নোটিশ।
 *   ৫) বট যেকোনো কারণে বন্ধ হলে "STOPPED" নোটিশ — কত সময় চালু ছিল সহ:
 *        • স্তর ১: বট নিজে (process.exit, Ctrl+C, SIGTERM, SIGHUP, ইভেন্ট লুপ খালি হওয়া)
 *        • স্তর ২: আলাদা WATCHDOG প্রসেস — ক্র্যাশ / kill -9 / OOM হলেও ১ সেকেন্ডের কমে নোটিশ।
 *        • স্তর ৩ (ঐচ্ছিক): বাইরের হার্টবিট (healthchecks.io) — পুরো কন্টেইনার মরলেও।
 *            env: JUWEL_HEARTBEAT_URL=https://hc-ping.com/xxxx-xxxx
 *   ওয়াচডগ বন্ধ রাখতে env: JUWEL_WATCHDOG=off
 *
 *  সেটিংস: config.json-এর "JUWEL_ALERT" অংশ (TG_TOKEN, TG_CHAT, DISCORD_WEBHOOK, HEARTBEAT_URL)
 *  অথবা env: JUWEL_TG_TOKEN, JUWEL_TG_CHAT | JUWEL_DISCORD_WEBHOOK — env আগে
 *
 *  কমান্ড:  <prefix>juwelalert        (অবস্থা দেখায়, শুধু বট-অ্যাডমিন)
 *           <prefix>juwelalert test   (টেস্ট নোটিশ পাঠায়)
 */

// এই ফাইলকে `node juwelalert.js --juwel-watch` দিয়ে চালালে এটা ওয়াচডগ হিসেবে চলে
const IS_WATCHER = require.main === module && process.argv.includes("--juwel-watch");

if (!IS_WATCHER) { try { console.log("[JuwelAlert] ফাইল লোড হয়েছে (juwelalert.js)"); } catch (_) {} }

const axios = require("axios");
const https = require("https");
// Telegram-এর কানেকশন খোলা (keep-alive) রাখা হয়, যাতে বন্ধ হওয়ার মুহূর্তে নোটিশ দ্রুত যায়
const tgAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 20000 });

/* ───────────── config.json থেকে সেটিংস ───────────── */
function findConfigFile() {
  const fs = require("fs"), path = require("path");
  const cands = [
    path.join(__dirname, "..", "..", "config.json"),
    path.join(process.cwd(), "config.json"),
    path.join(__dirname, "config.json")
  ];
  for (const f of cands) { try { if (fs.existsSync(f)) return f; } catch (_) {} }
  return "";
}

(function loadAlertSettings() {
  try {
    const fs = require("fs");
    const file = findConfigFile();
    if (!file) return;
    const cfg = JSON.parse(fs.readFileSync(file, "utf8")).JUWEL_ALERT || {};
    const map = { TG_TOKEN: "JUWEL_TG_TOKEN", TG_CHAT: "JUWEL_TG_CHAT", DISCORD_WEBHOOK: "JUWEL_DISCORD_WEBHOOK", HEARTBEAT_URL: "JUWEL_HEARTBEAT_URL" };
    Object.keys(map).forEach((k) => {
      const v = cfg[k] === undefined || cfg[k] === null ? "" : String(cfg[k]).trim();
      if (v && !process.env[map[k]]) process.env[map[k]] = v;
    });
  } catch (_) {}
})();

const PROBE_EVERY_MS = Number(process.env.JUWEL_PROBE_MS) || 2 * 60 * 1000;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const PROBE_FAILS_BEFORE_ALERT = 2;
const BOOT_NOTICE_DELAY_MS = Number(process.env.JUWEL_BOOT_MS) || 2 * 1000;
const LOGIN_GRACE_MS = Number(process.env.JUWEL_LOGIN_GRACE_MS) || 3 * 60 * 1000;
const STOP_NOTICE_WAIT_MS = 4000; // বন্ধ হওয়ার আগে নোটিশ পাঠাতে সর্বোচ্চ এত সময় অপেক্ষা

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
  down: false,
  downSince: 0,
  bootNoticeSent: false,
  onlineAfterSec: null
});

/* ───────────── helpers ───────────── */
const dhakaTime = () => {
  try { return new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { return new Date().toISOString(); }
};
const pad2 = (n) => String(n).padStart(2, "0");
const uptimeParts = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};
// এক লাইনের ফরম্যাট (অফলাইন ছিল / লগইন সময় ইত্যাদির জন্য)
const upStr = (sec) => { const u = uptimeParts(sec); return u.d + " দিন " + pad2(u.h) + " ঘণ্টা " + pad2(u.m) + " মিনিট " + pad2(u.s) + " সেকেন্ড"; };
const fmtDur = (ms) => upStr(ms / 1000);
const fmtTime = (ms) => { try { return new Date(ms).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); } catch (_) { return new Date(ms).toISOString(); } };

// আপটাইম ব্লক (ইংরেজি): Days / Hours / Minutes / Seconds আলাদা লাইনে, সিরিয়ালি
const upBlock = (sec, title) => {
  const u = uptimeParts(sec);
  return "⏱ " + (title || "UPTIME") + "\n" +
    "   ┌ 📅 Days    ➤ " + pad2(u.d) + "\n" +
    "   ├ 🕐 Hours   ➤ " + pad2(u.h) + "\n" +
    "   ├ ⏰ Minutes ➤ " + pad2(u.m) + "\n" +
    "   └ ⏳ Seconds ➤ " + pad2(u.s);
};

// ইংরেজি অক্ষর ও সংখ্যা → 𝗔𝗕𝗖𝗗 𝟭𝟮𝟯 (Sans-Serif Bold). বাংলা/ইমোজি অপরিবর্তিত থাকে।
const fx = (str) => String(str).replace(/[A-Za-z0-9]/g, (c) => {
  const n = c.charCodeAt(0);
  if (n >= 65 && n <= 90) return String.fromCodePoint(0x1D5D4 + n - 65);
  if (n >= 97 && n <= 122) return String.fromCodePoint(0x1D5EE + n - 97);
  return String.fromCodePoint(0x1D7EC + n - 48);
});

/* ───────────── ক্রেডিট লক ───────────── */
// ⚠️ মূল ক্রেডিট (CREDIT_JUWEL) বদলালে বা মুছলে কোড কাজ করবে না।
const crypto = require("crypto");
const CREDIT_JUWEL = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_BONI = "বনি মাস";
const HASH_JUWEL = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const CREDIT = CREDIT_JUWEL;

const sha = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");

function creditOk() {
  try {
    const cfg = module.exports.config || {};
    return (
      sha(CREDIT_JUWEL) === HASH_JUWEL &&
      sha(cfg.credits) === HASH_JUWEL
    );
  } catch (_) {
    return false;
  }
}

const CREDIT_ENDED_MSG =
  "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
  "┃ ❌ ক্রেডিট শেষ!\n" +
  "┃ এই কোডের ক্রেডিট মুছে ফেলা বা বদলানো হয়েছে,\n" +
  "┃ তাই কোড কাজ করবে না।\n" +
  "┃ আসল ক্রেডিট ফিরিয়ে দিন, তারপর বট রিস্টার্ট করুন।\n" +
  "╰━━━━━━━━━━━━━━━━━━━━╯";

const stripAnsi = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, "");

function log(msg, level) {
  try { require("../../utils/log.js")("[JuwelAlert] " + msg, level || "info"); }
  catch (_) { try { process.stdout.write("[JuwelAlert] " + msg + "\n"); } catch (__) {} }
}

function adminIDs() {
  const c = global.config || {};
  return [...new Set([...(c.ADMINBOT || []), ...(c.DEVELOPER || [])].map(String))];
}

function withLock(reason) {
  if (state.lockAt && Date.now() - state.lockAt < 15 * 60 * 1000) {
    return "🔒 ফেসবুক আইডি লক/লগইন সমস্যা (" + state.lockReason + ") — " + reason;
  }
  return reason;
}

async function sendExternal(text) {
  if (!creditOk()) return false;
  text = withCredit(text);
  const tgToken = process.env.JUWEL_TG_TOKEN, tgChat = process.env.JUWEL_TG_CHAT;
  const dc = process.env.JUWEL_DISCORD_WEBHOOK;
  let sent = false;
  const res = (state.lastSend = { tg: null, dc: null, tgErr: "", dcErr: "" });
  const jobs = [];
  if (tgToken && tgChat) {
    jobs.push((async () => {
      try {
        await axios.post("https://api.telegram.org/bot" + tgToken + "/sendMessage", { chat_id: tgChat, text }, { timeout: 8000, httpsAgent: tgAgent });
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
      try { await axios.post(dc, { content: text.slice(0, 1900) }, { timeout: 8000 }); sent = true; res.dc = true; }
      catch (e) {
        res.dc = false;
        res.dcErr = String(e.message || e).slice(0, 80);
        log("Discord পাঠানো যায়নি: " + (e.message || e), "warn");
      }
    })());
  }
  await Promise.all(jobs);
  if (!tgToken && !tgChat && !dc) log("JUWEL_TG_TOKEN/JUWEL_TG_CHAT বা JUWEL_DISCORD_WEBHOOK সেট করা নেই — শুধু লগে লেখা হলো।", "warn");
  return sent;
}

async function sendMessengerToAdmins(text) {
  if (!creditOk()) return;
  text = withCredit(text);
  const api = global.client && global.client.api;
  if (!api) return;
  for (const id of adminIDs()) {
    try { await new Promise((res) => api.sendMessage(text, id, () => res())); } catch (_) {}
  }
}

/* ───────────── alerts ───────────── */
const LINE = "┣━━━━━━━━━━━━━━━━━━━━┫";

async function raiseAlert(reason) {
  if (!creditOk()) return;
  const now = Date.now();
  if (!state.down) { state.down = true; state.downSince = now; }
  if (now - state.lastAlertAt < ALERT_COOLDOWN_MS) return;
  state.lastAlertAt = now;
  const text =
    "🚨 JUWEL BOT সেশন সমস্যা\n" +
    "📛 কারণ ➤ " + reason + "\n" +
    upBlock(process.uptime(), "UPTIME") + "\n" +
    "🕒 সময় ➤ " + dhakaTime() + "\n" +
    "🛠 নতুন appstate.json বসিয়ে বট রিস্টার্ট দিন।";
  log("সতর্কতা: " + reason, "error");
  await sendExternal(text);
}

async function raiseRecovery() {
  if (!creditOk() || !state.down) return;
  const downFor = Date.now() - state.downSince;
  state.down = false; state.downSince = 0; state.probeFails = 0; state.lastAlertAt = 0;
  state.lockAt = 0; state.lockReason = "";
  const text =
    "✅ JUWEL BOT আবার অনলাইন\n" +
    "⏳ অফলাইন ছিল ➤ " + fmtDur(downFor) + "\n" +
    upBlock(process.uptime(), "UPTIME") + "\n" +
    "🕒 সময় ➤ " + dhakaTime();
  log("সেশন ফিরে এসেছে।", "success");
  await sendExternal(text);
  await sendMessengerToAdmins(text);
}

/* ───────────── stop notice (বট বন্ধ হলে) ───────────── */
let stopPromise = null;

function stopText(reason, startMs, endMs) {
  const end = endMs || Date.now();
  const start = startMs || (end - process.uptime() * 1000);
  return (
    "🔴 JUWEL BOT বন্ধ হয়েছে\n" +
    "📛 কারণ ➤ " + reason + "\n" +
    upBlock((end - start) / 1000, "TOTAL UPTIME") + "\n" +
    "🕒 সময় ➤ " + fmtTime(end)
  );
}

// ওয়াচডগকে লাইন পাঠায় (SENT / REASON:... / CRASH:... / EXIT:...)
function watchSend(line) {
  try {
    const w = global.__juwelAlertWatcher;
    if (w && w.stdin && w.stdin.writable) w.stdin.write(line + "\n");
  } catch (_) {}
}

function heartbeatFail() {
  const HB = process.env.JUWEL_HEARTBEAT_URL;
  if (!HB) return;
  try { axios.get(HB.replace(/\/$/, "") + "/fail", { timeout: 5000 }).catch(() => {}); } catch (_) {}
}

function sendStopNotice(reason) {
  if (stopPromise) return stopPromise;
  reason = withLock(reason);
  log("বট বন্ধ হচ্ছে: " + reason, "warn");
  watchSend("REASON:" + reason);
  heartbeatFail();
  stopPromise = Promise.race([
    sendExternal(stopText(reason)).then((ok) => { if (ok) watchSend("SENT"); return ok; }).catch(() => false),
    new Promise((res) => setTimeout(res, STOP_NOTICE_WAIT_MS))
  ]);
  return stopPromise;
}

function installShutdownHook() {
  if (global.__juwelAlertShutdownHooked) return;
  global.__juwelAlertShutdownHooked = true;

  const origExit = process.exit.bind(process);

  process.exit = function (code) {
    const c = code === undefined ? 0 : code;
    sendStopNotice("process.exit(" + c + ") — কোড দিয়ে বন্ধ করা হয়েছে").then(
      () => origExit(c),
      () => origExit(c)
    );
  };

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

  try {
    process.on("beforeExit", () => {
      sendStopNotice("বট নিজে থেকেই থেমে গেছে (কোনো কাজ বাকি নেই — লগইন ব্যর্থ/আইডি লক হতে পারে)");
    });
  } catch (_) {}

  try {
    process.on("uncaughtExceptionMonitor", (err) => {
      const r = "ক্র্যাশ — " + String((err && (err.stack || err.message)) || err).split("\n")[0].slice(0, 200);
      watchSend("CRASH:" + withLock(r));
      heartbeatFail();
    });
  } catch (_) {}

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
  ["SIGINT", "SIGTERM", "SIGHUP", "SIGQUIT", "SIGBREAK"].forEach((s) => { try { process.on(s, () => {}); } catch (_) {} });
  try { process.on("uncaughtException", () => {}); } catch (_) {}
  try { process.on("unhandledRejection", () => {}); } catch (_) {}

  const parentPid = Number(process.env.JW_PID) || 0;
  const startMs = Number(process.env.JW_START) || Date.now();
  let reason = "", crash = "", exitCode = null, handled = false, finishing = false, buf = "";
  let fastTimer = null, fastJob = null;

  // কানেকশন আগে থেকেই গরম রাখা হয়, যাতে পাঠানো দ্রুত হয়
  const warm = () => {
    const tk = process.env.JUWEL_TG_TOKEN;
    if (tk) axios.get("https://api.telegram.org/bot" + tk + "/getMe", { timeout: 8000, httpsAgent: tgAgent }).catch(() => {});
  };
  warm();
  setInterval(warm, 20000);

  const sendNow = async (why) => {
    const msg = stopText(why + " [watchdog]", startMs, Date.now());
    for (let i = 0; i < 3; i++) {
      let ok = false;
      try { ok = await sendExternal(msg); } catch (_) {}
      if (ok) break;
      await new Promise((r) => setTimeout(r, 700));
    }
  };

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line === "SENT") { handled = true; if (fastTimer) clearTimeout(fastTimer); }
      else if (line.indexOf("REASON:") === 0) {
        reason = line.slice(7);
        // বট ১.২ সেকেন্ডের মধ্যে নিজে পাঠাতে না পারলে ওয়াচডগ নিজেই পাঠাবে
        if (!fastTimer && !handled) {
          fastTimer = setTimeout(() => {
            if (!handled) { handled = true; fastJob = sendNow(reason); }
          }, 1200);
        }
      }
      else if (line.indexOf("CRASH:") === 0) crash = line.slice(6);
      else if (line.indexOf("EXIT:") === 0) exitCode = line.slice(5);
    }
  });

  const finish = async () => {
    if (finishing) return;
    finishing = true;
    await new Promise((r) => setTimeout(r, 100));
    if (fastJob) await fastJob;
    else if (!handled) {
      handled = true;
      const why = reason || crash ||
        (exitCode !== null && exitCode !== "undefined"
          ? "বট বন্ধ হয়েছে (exit code " + exitCode + ")"
          : "হঠাৎ বন্ধ — kill -9 / মেমরি শেষ / হোস্ট জোর করে বন্ধ করেছে");
      await sendNow(why);
    }
    process.exit(0);
  };

  process.stdin.on("end", finish);
  process.stdin.on("close", finish);
  process.stdin.on("error", finish);

  // প্রতি ০.২৫ সেকেন্ডে দেখে বট মরেছে কি না
  setInterval(() => {
    if (!parentPid) return;
    try { process.kill(parentPid, 0); }
    catch (e) { if (e.code !== "EPERM") finish(); }
  }, 250);

  process.stdin.resume();
}

/* ───────────── log watcher ───────────── */
const BAD_PATTERNS = [
  /FATAL: Session/i, /Session looks dead/i, /Login failed \[/i,
  /Fresh login failed/i, /re-login required/i, /checkpoint/i, /not logged in/i
];
const GOOD_PATTERNS = [/recovered after \d+ attempt/i, /traffic resumed/i, /session established/i];

const LOCK_PATTERNS = [
  /Error retrieving userID/i,
  /login[_ ]?blocked/i,
  /checkpoint/i,
  /account.{0,40}(locked|disabled|suspended|restricted)/i,
  /(locked|disabled|suspended).{0,40}account/i,
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
            watchSend("CRASH:🔒 ফেসবুক আইডি লক/লগইন সমস্যা — " + short);
            raiseAlert("🔒 লক/লগইন সমস্যা ধরা পড়েছে | লগ: " + short);
          }
          if (BAD_PATTERNS.some((r) => r.test(line))) {
            state.lastLoginIssueAt = Date.now();
            state.logHits.push({ t: Date.now(), line: line.trim().slice(0, 160) });
            if (state.logHits.length > 20) state.logHits.shift();
          } else if (GOOD_PATTERNS.some((r) => r.test(line))) {
            state.lastLoginIssueAt = 0; state.logHits = []; state.probeFails = 0;
            raiseRecovery();
          }
        }
      } catch (_) {}
      return orig.apply(console, arguments);
    };
  });
}

/* ───────────── active probe ───────────── */
function evaluate(reason) {
  const recent = state.lastLoginIssueAt && (Date.now() - state.lastLoginIssueAt < 15 * 60 * 1000);
  if (state.probeFails >= PROBE_FAILS_BEFORE_ALERT || (state.probeFails >= 1 && recent)) {
    const extra = recent && state.logHits.length ? " | লগ: " + state.logHits[state.logHits.length - 1].line : "";
    raiseAlert(reason + extra);
  }
}

function probe() {
  if (!creditOk()) return;
  const api = global.client && global.client.api;
  state.lastProbeAt = Date.now();
  if (!api || typeof api.getCurrentUserID !== "function") {
    state.lastProbeOk = false;
    if (Date.now() - state.bootAt < LOGIN_GRACE_MS) return;
    state.probeFails++;
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
        if (state.down) raiseRecovery();
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
  if (!creditOk()) { log("ক্রেডিট শেষ — কোড চালু হলো না।", "error"); return; }
  state.started = true;
  installLogWatcher();
  installShutdownHook();
  startWatchdog();
  startHeartbeat();

  // Telegram কানেকশন গরম রাখা — বন্ধ হওয়ার মুহূর্তে নোটিশ যেন সাথে সাথে যায়
  const warm = () => {
    const tk = process.env.JUWEL_TG_TOKEN;
    if (tk) axios.get("https://api.telegram.org/bot" + tk + "/getMe", { timeout: 8000, httpsAgent: tgAgent }).catch(() => {});
  };
  warm();
  const wm = setInterval(warm, 20000);
  if (wm.unref) wm.unref();

  const t = setInterval(probe, PROBE_EVERY_MS);
  if (t.unref) t.unref();

  const sendBoot = async () => {
    const secs = state.onlineAfterSec === null ? process.uptime() : state.onlineAfterSec;
    const text =
      "🟢 JUWEL BOT চালু হয়েছে\n" +
      "⚡ অনলাইন হতে লেগেছে ➤ " + secs.toFixed(1) + " সেকেন্ড\n" +
      upBlock(process.uptime(), "UPTIME") + "\n" +
      "🕒 সময় ➤ " + dhakaTime();
    if (String(process.env.JUWEL_TG_BOOT || "").toLowerCase() !== "off") await sendExternal(text);
    await sendMessengerToAdmins(text);
  };
  const waitLogin = () => {
    if (state.bootNoticeSent) return;
    const api = global.client && global.client.api;
    if (!api) {
      if (Date.now() - state.bootAt < 10 * 60 * 1000) {
        const r = setTimeout(waitLogin, 1000);
        if (r.unref) r.unref();
      }
      return;
    }
    state.bootNoticeSent = true;
    state.onlineAfterSec = process.uptime();
    sendBoot();
  };
  const b = setTimeout(waitLogin, BOOT_NOTICE_DELAY_MS);
  if (b.unref) b.unref();
  log("চালু হয়েছে — সেশন নজরদারি শুরু।", "success");
}

function healthText() {
  const probeTxt = state.lastProbeOk === null ? "এখনো হয়নি" : state.lastProbeOk ? "✅ ঠিক আছে" : "❌ ব্যর্থ";
  const tg = process.env.JUWEL_TG_TOKEN && process.env.JUWEL_TG_CHAT ? "✅" : "❌";
  const wd = global.__juwelAlertWatcher ? "✅" : "❌";
  return (
    (state.down ? "🔴 JUWEL BOT সমস্যায়" : "🟢 JUWEL BOT ঠিক আছে") + "\n" +
    upBlock(process.uptime(), "UPTIME") + "\n" +
    "🩺 সেশন পরীক্ষা ➤ " + probeTxt + "\n" +
    "✈️ Telegram " + tg + "  🐕 Watchdog " + wd + "\n" +
    "🕒 সময় ➤ " + dhakaTime()
  );
}

/* ───────────── test notice ───────────── */
function testText() {
  const tg = process.env.JUWEL_TG_TOKEN && process.env.JUWEL_TG_CHAT ? "✅" : "❌";
  const dc = process.env.JUWEL_DISCORD_WEBHOOK ? "✅" : "❌";
  const wd = global.__juwelAlertWatcher ? "✅" : "❌";
  return (
    "🧪 JUWEL ALERT টেস্ট — এই বার্তা এলে সব ঠিক আছে\n" +
    "✈️ Telegram " + tg + "  💬 Discord " + dc + "  🐕 Watchdog " + wd + "\n" +
    upBlock(process.uptime(), "UPTIME") + "\n" +
    "🕒 সময় ➤ " + dhakaTime()
  );
}

function testResultText(ok) {
  const r = state.lastSend || { tg: null, dc: null, tgErr: "", dcErr: "" };
  const st = (v, err) => v === true ? "✅" : v === false ? "❌" + (err ? " (" + err + ")" : "") : "⚪ সেট নেই";
  return (
    (ok ? "✅ টেস্ট নোটিশ পাঠানো হয়েছে" : "❌ টেস্ট নোটিশ পাঠানো যায়নি") + "\n" +
    "✈️ Telegram " + st(r.tg, r.tgErr) + "  💬 Discord " + st(r.dc, r.dcErr) + "\n" +
    (ok ? "" : "🛠 টোকেন/চ্যাট আইডি দেখুন, আর টেলিগ্রামে বটকে /start দিন।\n") +
    upBlock(process.uptime(), "UPTIME") + "\n" +
    "🕒 সময় ➤ " + dhakaTime()
  );
}

// বটের নাম / অ্যাডমিনের নাম / প্রথম অ্যাডমিন UID — config.json থেকে
let _botInfo = null;
function botInfo() {
  if (_botInfo) return _botInfo;
  let c = {};
  try {
    const fs = require("fs");
    const file = findConfigFile();
    if (file) c = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {}
  const g = global.config || {};
  const pick = (k) => String(c[k] !== undefined && c[k] !== "" ? c[k] : (g[k] !== undefined ? g[k] : "")).trim();
  const admins = (Array.isArray(c.ADMINBOT) && c.ADMINBOT.length ? c.ADMINBOT : g.ADMINBOT) || [];
  const info = { name: pick("BOTNAME") || "—", admin: pick("BOTADMINNAME") || "—", uid: admins.length ? String(admins[0]) : "—" };
  if (c.BOTNAME || g.BOTNAME) _botInfo = info;
  return info;
}
const infoBlock = () => {
  const b = botInfo();
  return "🤖 " + fx("BOT") + " ➤ " + b.name + "\n👑 " + fx("ADMIN") + " ➤ " + b.admin + "\n🆔 " + fx("UID") + " ➤ " + b.uid;
};

// ফ্রেম: প্রতিটি লাইনের আগে ┃, উপরে-নিচে বক্স; ┣━┫ লাইন আলাদাকারী হিসেবে থাকে
const frame = (t) =>
  "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
  String(t).split("\n").map((l) => (l.charAt(0) === "┣" ? l : "┃ " + l)).join("\n") +
  "\n╰━━━━━━━━━━━━━━━━━━━━╯";

const withCredit = (t) => frame(
  fx(t) + "\n" + LINE + "\n" + infoBlock() + "\n" + LINE +
  "\n© Code Credit: " + CREDIT_JUWEL
);

/* ───────────── command ───────────── */
module.exports.config = {
  name: "juwelalert",
  aliases: ["jalert"],
  version: "2.3.0",
  hasPermssion: 2,
  credits: CREDIT_JUWEL,
  credits2: CREDIT_BONI,
  description: "সেশন সতর্কতা ও বট চালু/বন্ধ নোটিশ",
  commandCategory: "system",
  usages: "juwelalert [test]",
  cooldowns: 5
};

module.exports.onLoad = function () {
  try { start(); } catch (e) { log("start ত্রুটি: " + e.message, "error"); }
};

module.exports.handleEvent = function () {
  if (!creditOk()) return;
  if (!state.started) { try { start(); } catch (_) {} }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!creditOk()) return api.sendMessage(CREDIT_ENDED_MSG, threadID, messageID);
  if (!state.started) start();
  if ((args[0] || "").toLowerCase() === "test") {
    const ok = await sendExternal(testText());
    return api.sendMessage(withCredit(testResultText(ok)), threadID, messageID);
  }
  return api.sendMessage(withCredit(healthText()), threadID, messageID);
};

// ওয়াচডগ মোডে শুধু নজরদারি চলে; নইলে স্বাভাবিকভাবে চালু
if (IS_WATCHER) {
  try { runWatcher(); } catch (_) { process.exit(1); }
} else {
  try { start(); } catch (e) { log("start ত্রুটি: " + e.message, "error"); }
      }

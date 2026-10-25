/**
 * ╔══════════════════════════════════════════════════════════╗
 *  JUWEL ALERT  —  Session Alert + Bot Start/Stop Notice
 *  Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 * ╚══════════════════════════════════════════════════════════╝
 *
 *  কী করে:
 *   ১) বট চালু হলে নোটিশ পাঠায় (সময়সহ)।
 *   ২) বট বন্ধ হলে নোটিশ পাঠায় (সময়সহ):
 *        - স্বাভাবিক বন্ধ (Ctrl+C / stop / restart) → সাথে সাথে নোটিশ
 *        - হঠাৎ ক্র্যাশ / সেশন মরে গেলে → সেশন পরীক্ষায় ধরা পড়লে নোটিশ
 *        - হঠাৎ বন্ধ হয়ে গিয়ে থাকলে পরের বার চালু হওয়ার নোটিশে জানায়
 *   ৩) সেশন ফিরে এলে "আবার অনলাইন" নোটিশ (সময়সহ)।
 *   ৪) #juwelalert test দিলে টেস্ট নোটিশ পাঠায় (সময়সহ)।
 *   ৫) প্রতিটি নোটিশের নিচে JUWEL কোডের ক্রেডিট দেখায়।
 *   ৬) ক্রেডিট (দুটির যেকোনো একটি) মুছলে/বদলালে কোড চলবে না;
 *      কমান্ড দিলে "ক্রেডিট শেষ" বলবে।
 *
 *  env: JUWEL_TG_TOKEN, JUWEL_TG_CHAT   (Telegram)
 *       JUWEL_DISCORD_WEBHOOK            (Discord)
 *       JUWEL_TG_BOOT=off                (চালু-নোটিশ Telegram/Discord-এ বন্ধ)
 *
 *  কমান্ড:  #juwelalert        (সেশনের অবস্থা, শুধু বট-অ্যাডমিন)
 *           #juwelalert test   (টেস্ট নোটিশ)
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ───────────── ক্রেডিট লক ───────────── */
// ⚠️ নিচের দুটি ক্রেডিট বদলালে বা মুছলে কোড কাজ করবে না।
const CREDIT_JUWEL = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_BONI = "বনি মাস";
const HASH_JUWEL = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const HASH_BONI = "dbf6602242f5f7e3fe1e11a63fb8d8785806bf58dfc30e50c2157b694b502d24";

const sha = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");

function creditOk() {
  try {
    const cfg = module.exports.config || {};
    return (
      sha(CREDIT_JUWEL) === HASH_JUWEL &&
      sha(CREDIT_BONI) === HASH_BONI &&
      sha(cfg.credits) === HASH_JUWEL &&
      sha(cfg.credits2) === HASH_BONI
    );
  } catch (_) {
    return false;
  }
}

const CREDIT_ENDED_MSG =
  "❌ ক্রেডিট শেষ!\n" +
  "এই কোডের ক্রেডিট মুছে ফেলা বা বদলানো হয়েছে, তাই কোড কাজ করবে না।\n" +
  "আসল ক্রেডিট ফিরিয়ে দিন, তারপর বট রিস্টার্ট করুন।";

const footer = () =>
  "\n━━━━━━━━━━━━━━\n" +
  "© Code Credit: " + CREDIT_JUWEL + "\n" +
  "© Credit: " + CREDIT_BONI;

/* ───────────── সেটিং ───────────── */
const PROBE_EVERY_MS = Number(process.env.JUWEL_PROBE_MS) || 5 * 60 * 1000;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const PROBE_FAILS_BEFORE_ALERT = 2;
const BOOT_NOTICE_DELAY_MS = Number(process.env.JUWEL_BOOT_MS) || 45 * 1000;
const HEARTBEAT_MS = 60 * 1000;
const STATE_FILE = path.join(__dirname, "juwelalert.state.json");

const state = global.__juwelAlert || (global.__juwelAlert = {
  started: false,
  bootAt: Date.now(),
  logHits: [],
  lastLoginIssueAt: 0,
  probeFails: 0,
  lastProbeOk: null,
  lastProbeAt: 0,
  lastAlertAt: 0,
  down: false,
  downSince: 0,
  bootNoticeSent: false,
  shutdownSent: false
});

/* ───────────── helpers ───────────── */
const dhakaTime = () => {
  try { return new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { return new Date().toISOString(); }
};
const fmtDur = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return (d ? d + "d " : "") + h + "h " + m + "m";
};
const stripAnsi = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, "");

function log(msg, level) {
  try { require("../../utils/log.js")("[JuwelAlert] " + msg, level || "info"); }
  catch (_) { try { process.stdout.write("[JuwelAlert] " + msg + "\n"); } catch (__) {} }
}

function adminIDs() {
  const c = global.config || {};
  return [...new Set([...(c.ADMINBOT || []), ...(c.DEVELOPER || [])].map(String))];
}

function readStateFile() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (_) { return null; }
}
function writeStateFile(obj) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(obj)); } catch (_) {}
}
function writeStateFileSync(obj) { writeStateFile(obj); }

async function sendExternal(text) {
  if (!creditOk()) return false;
  const tgToken = process.env.JUWEL_TG_TOKEN, tgChat = process.env.JUWEL_TG_CHAT;
  const dc = process.env.JUWEL_DISCORD_WEBHOOK;
  const full = text + footer();
  let sent = false;
  if (tgToken && tgChat) {
    try {
      await axios.post("https://api.telegram.org/bot" + tgToken + "/sendMessage", { chat_id: tgChat, text: full }, { timeout: 15000 });
      sent = true;
    } catch (e) { log("Telegram পাঠানো যায়নি: " + (e.message || e), "warn"); }
  }
  if (dc) {
    try { await axios.post(dc, { content: full.slice(0, 1900) }, { timeout: 15000 }); sent = true; }
    catch (e) { log("Discord পাঠানো যায়নি: " + (e.message || e), "warn"); }
  }
  if (!tgToken && !tgChat && !dc) log("JUWEL_TG_TOKEN/JUWEL_TG_CHAT বা JUWEL_DISCORD_WEBHOOK সেট করা নেই — শুধু লগে লেখা হলো।", "warn");
  return sent;
}

async function sendMessengerToAdmins(text) {
  if (!creditOk()) return;
  const api = global.client && global.client.api;
  if (!api) return;
  const full = text + footer();
  for (const id of adminIDs()) {
    try { await new Promise((res) => api.sendMessage(full, id, () => res())); } catch (_) {}
  }
}

/* ───────────── alerts ───────────── */
async function raiseAlert(reason) {
  if (!creditOk()) return;
  const now = Date.now();
  if (!state.down) { state.down = true; state.downSince = now; }
  if (now - state.lastAlertAt < ALERT_COOLDOWN_MS) return;
  state.lastAlertAt = now;
  const text =
    "🚨 JUWEL BOT বন্ধ / সমস্যায়\n" +
    "বটের সেশন সমস্যায় আছে বা বট বন্ধ হয়ে গেছে।\n" +
    "কারণ: " + reason + "\n" +
    "সময়: " + dhakaTime() + "\n" +
    "করণীয়: নতুন appstate.json (কুকি) বসিয়ে বট রিস্টার্ট দিন।";
  log("সতর্কতা: " + reason, "error");
  await sendExternal(text);
}

async function raiseRecovery() {
  if (!creditOk() || !state.down) return;
  const downFor = Date.now() - state.downSince;
  state.down = false; state.downSince = 0; state.probeFails = 0; state.lastAlertAt = 0;
  const text =
    "✅ JUWEL BOT আবার চালু / অনলাইন\n" +
    "বন্ধ ছিল প্রায়: " + fmtDur(downFor) + "\n" +
    "সময়: " + dhakaTime();
  log("সেশন ফিরে এসেছে।", "success");
  await sendExternal(text);
  await sendMessengerToAdmins(text);
}

/* ───────────── বন্ধ হওয়ার নোটিশ (Ctrl+C / stop / restart) ───────────── */
function installShutdownNotice() {
  if (global.__juwelAlertShutdownHooked) return;
  global.__juwelAlertShutdownHooked = true;

  const onStop = (sig) => {
    if (state.shutdownSent) return;
    state.shutdownSent = true;
    writeStateFileSync({ clean: true, stoppedAt: Date.now(), beat: Date.now() });
    const text =
      "🔴 JUWEL BOT বন্ধ হয়েছে\n" +
      "কারণ: " + sig + "\n" +
      "চালু ছিল: " + fmtDur(Date.now() - state.bootAt) + "\n" +
      "সময়: " + dhakaTime();
    const done = () => { try { process.exit(0); } catch (_) {} };
    const timer = setTimeout(done, 5000);
    sendExternal(text).then(() => { clearTimeout(timer); done(); }).catch(done);
  };
  ["SIGINT", "SIGTERM", "SIGHUP"].forEach((sig) => {
    try { process.on(sig, () => onStop(sig)); } catch (_) {}
  });
}

/* ───────────── log watcher ───────────── */
const BAD_PATTERNS = [
  /FATAL: Session/i, /Session looks dead/i, /Login failed \[/i,
  /Fresh login failed/i, /re-login required/i, /checkpoint/i, /not logged in/i
];
const GOOD_PATTERNS = [/recovered after \d+ attempt/i, /traffic resumed/i, /session established/i];

function installLogWatcher() {
  if (global.__juwelAlertLogHooked) return;
  global.__juwelAlertLogHooked = true;
  ["log", "warn", "error"].forEach((method) => {
    const orig = console[method];
    console[method] = function () {
      try {
        const line = stripAnsi(Array.prototype.map.call(arguments, (a) => (typeof a === "string" ? a : "")).join(" "));
        if (line && line.length < 2000 && !/JuwelAlert/.test(line)) {
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
    state.probeFails++; state.lastProbeOk = false;
    return evaluate("api অবজেক্ট পাওয়া যাচ্ছে না");
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

/* ───────────── boot ───────────── */
function start() {
  if (state.started) return;
  if (!creditOk()) {
    log("ক্রেডিট শেষ — কোড চালু হলো না।", "error");
    return;
  }
  state.started = true;

  // আগের বার কীভাবে বন্ধ হয়েছিল তা দেখে নিই
  const prev = readStateFile();
  let prevNote = "";
  if (prev && prev.clean === false && prev.beat) {
    prevNote = "\n⚠️ আগের বার হঠাৎ বন্ধ হয়ে গিয়েছিল (ক্র্যাশ/পাওয়ার কাট)।\nবন্ধ ছিল প্রায়: " + fmtDur(Date.now() - prev.beat);
  } else if (prev && prev.clean === true && prev.stoppedAt) {
    prevNote = "\nবন্ধ ছিল প্রায়: " + fmtDur(Date.now() - prev.stoppedAt);
  }
  writeStateFile({ clean: false, beat: Date.now() });

  installLogWatcher();
  installShutdownNotice();

  const t = setInterval(probe, PROBE_EVERY_MS);
  if (t.unref) t.unref();
  const hb = setInterval(() => writeStateFile({ clean: false, beat: Date.now() }), HEARTBEAT_MS);
  if (hb.unref) hb.unref();

  // চালু-নোটিশ
  const b = setTimeout(async () => {
    if (state.bootNoticeSent || !creditOk()) return;
    state.bootNoticeSent = true;
    const text = "🟢 JUWEL BOT চালু হয়েছে" + prevNote + "\nসময়: " + dhakaTime();
    if (String(process.env.JUWEL_TG_BOOT || "").toLowerCase() !== "off") await sendExternal(text);
    await sendMessengerToAdmins(text);
  }, BOOT_NOTICE_DELAY_MS);
  if (b.unref) b.unref();
  log("চালু হয়েছে — সেশন নজরদারি শুরু।", "success");
}

function healthText() {
  const probeTxt = state.lastProbeOk === null ? "এখনো হয়নি" : state.lastProbeOk ? "✅ ঠিক আছে" : "❌ ব্যর্থ";
  const tg = process.env.JUWEL_TG_TOKEN && process.env.JUWEL_TG_CHAT ? "চালু" : "বন্ধ";
  const dc = process.env.JUWEL_DISCORD_WEBHOOK ? "চালু" : "বন্ধ";
  return (
    "🩺 সেশন অবস্থা\n━━━━━━━━━━━━━━\n" +
    "অবস্থা: " + (state.down ? "🔴 সমস্যায়" : "🟢 ভালো") + "\n" +
    "আপটাইম: " + fmtDur(Date.now() - state.bootAt) + "\n" +
    "শেষ পরীক্ষা: " + probeTxt + (state.lastProbeAt ? " (" + fmtDur(Date.now() - state.lastProbeAt) + " আগে)" : "") + "\n" +
    "পরপর ফেইল: " + state.probeFails + "\n" +
    "লগে লগইন-সমস্যা: " + state.logHits.length + " টি\n" +
    "Telegram: " + tg + " | Discord: " + dc + "\n" +
    "সময়: " + dhakaTime() +
    footer()
  );
}

/* ───────────── command ───────────── */
module.exports.config = {
  name: "juwelalert",
  aliases: ["jalert"],
  version: "2.0.0",
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

  // ক্রেডিট শেষ হলে কিছুই চলবে না
  if (!creditOk()) return api.sendMessage(CREDIT_ENDED_MSG, threadID, messageID);

  if (!state.started) start();
  if ((args[0] || "").toLowerCase() === "test") {
    const ok = await sendExternal(
      "🧪 JUWEL ALERT টেস্ট নোটিশ\n" +
      "এই বার্তা এলে Telegram/Discord নোটিশ ঠিক আছে।\n" +
      "সময়: " + dhakaTime()
    );
    return api.sendMessage(
      (ok
        ? "✅ টেস্ট নোটিশ পাঠানো হয়েছে — Telegram/Discord চেক করুন।"
        : "❌ পাঠানো যায়নি। JUWEL_TG_TOKEN/JUWEL_TG_CHAT বা JUWEL_DISCORD_WEBHOOK সঠিক কি না দেখুন।") +
      "\nসময়: " + dhakaTime() + footer(),
      threadID, messageID
    );
  }
  return api.sendMessage(healthText(), threadID, messageID);
};

// ফাইল লোড হওয়ার সাথে সাথেই চালু
try { start(); } catch (e) { log("start ত্রুটি: " + e.message, "error"); }

const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");

module.exports.config = {
  name: "upt",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "System Status Image (Uptime, RAM, Memory, Ping, Disk)",
  commandCategory: "system",
  usages: "upt",
  cooldowns: 5
};

// ছবি তৈরির জন্য canvas দরকার: npm i canvas
let createCanvas, loadImage;
try {
  ({ createCanvas, loadImage } = require("canvas"));
} catch (e) {
  createCanvas = null;
  console.log("[upt] canvas লোড হয়নি:", e.message);
}

// ব্যাকগ্রাউন্ড টেমপ্লেট (upt_bg.png) এই দুই জায়গার যেকোনো একটায় রাখুন
const CACHE_DIR = path.join(__dirname, "cache");
const BG_PATHS = [
  path.join(CACHE_DIR, "upt_bg.png"),
  path.join(__dirname, "upt_bg.png")
];

// কাউন্ট ফাইলে সেভ হবে, রিস্টার্টেও হারাবে না
const COUNT_FILE = path.join(CACHE_DIR, "totalCommands.json");

function log(...a) {
  try { console.log("[upt]", ...a); } catch (e) {}
}

function loadCount() {
  try {
    return JSON.parse(fs.readFileSync(COUNT_FILE, "utf8")).total || 0;
  } catch (e) {
    return 0;
  }
}

function saveCount() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(COUNT_FILE, JSON.stringify({ total: global.totalCommands }));
  } catch (e) {}
}

if (typeof global.totalCommands !== "number") global.totalCommands = loadCount();

function addCount() {
  global.totalCommands++;
  saveCount();
}

// ---------- সিস্টেম তথ্য ----------
function getMemory() {
  const total = os.totalmem();
  let free = os.freemem();
  try {
    // Linux এ cache বাদ দিয়ে আসল available মেমোরি
    const m = fs.readFileSync("/proc/meminfo", "utf8").match(/MemAvailable:\s+(\d+)\s*kB/);
    if (m) free = Number(m[1]) * 1024;
  } catch (e) {}
  const used = total - free;
  return { total, used, percent: (used / total) * 100 };
}

function getDisk() {
  try {
    const root = path.parse(process.cwd()).root || "/";
    const s = fs.statfsSync(root);
    const total = s.blocks * s.bsize;
    const free = s.bavail * s.bsize;
    if (!total) return null;
    return ((total - free) / total) * 100;
  } catch (e) {
    return null;
  }
}

function getPing(event) {
  return new Promise(resolve => {
    const start = Date.now();
    let done = false;
    let hard = null;
    const finish = v => { if (!done) { done = true; if (hard) clearTimeout(hard); resolve(v); } };
    hard = setTimeout(() => finish(null), 3500);
    try {
      const req = https.request(
        { method: "HEAD", host: "www.facebook.com", path: "/", timeout: 3000 },
        res => { res.resume(); finish(Date.now() - start); }
      );
      req.on("timeout", () => { req.destroy(); finish(null); });
      req.on("error", () => finish(null));
      req.end();
    } catch (e) {
      finish(null);
    }
  }).then(v => {
    if (v !== null) return v;
    const t = Number(event && event.timestamp);
    if (t) return Math.max(0, Date.now() - t);
    return null;
  });
}

function gb(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

// ---------- ছবি আঁকা ----------
const FONT = "Arial, Helvetica, sans-serif";

// জায়গা না থাকলে ফন্ট নিজে ছোট হয়ে যাবে
function fitFont(ctx, text, style, size, maxW) {
  let s = size;
  do {
    ctx.font = `${style} ${s}px ${FONT}`;
    if (ctx.measureText(text).width <= maxW) break;
    s -= 1;
  } while (s > 14);
}

// তিন গজের ছক: রিং-এর কেন্দ্র আর নিচের লেবেল (DAY / HOURS / MINUTES) এর কেন্দ্র
const GAUGES = [
  { cx: 405, cy: 505, pillCx: 397, color: "#39ff14" },
  { cx: 745, cy: 505, pillCx: 741, color: "#ff2bd6" },
  { cx: 1070, cy: 505, pillCx: 1070, color: "#2bb7ff" }
];

function drawRing(ctx, g, fraction) {
  const R = 144;
  const lw = 24;
  const start = -Math.PI / 2;
  const f = Math.max(0, Math.min(1, fraction));

  ctx.save();
  // নিচের প্যানেলের বর্ডারে যেন আর্ক না যায়
  ctx.beginPath();
  ctx.rect(g.cx - 200, g.cy - 200, 400, 612 - (g.cy - 200));
  ctx.clip();

  // ট্র্যাক
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.strokeStyle = g.color + "33";
  ctx.beginPath();
  ctx.arc(g.cx, g.cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // প্রগ্রেস
  if (f > 0) {
    ctx.strokeStyle = g.color;
    ctx.shadowColor = g.color;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, R, start, start + Math.PI * 2 * f);
    ctx.stroke();
  }
  ctx.restore();
}

// আর্ক যেন নিচের লেবেলের ওপর না পড়ে, তাই লেবেল আবার বসানো হয়
function restorePill(ctx, bg, pillCx) {
  const x0 = pillCx - 113, x1 = pillCx + 113, y0 = 578, y1 = 647, c = 26;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0 + c, y0);
  ctx.lineTo(x1 - c, y0);
  ctx.lineTo(x1, y0 + c);
  ctx.lineTo(x1, y1 - c);
  ctx.lineTo(x1 - c, y1);
  ctx.lineTo(x0 + c, y1);
  ctx.lineTo(x0, y1 - c);
  ctx.lineTo(x0, y0 + c);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(bg, 0, 0);
  ctx.restore();
}

function drawBigNumber(ctx, g, text) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  fitFont(ctx, text, "italic bold", 118, 165);
  const grad = ctx.createLinearGradient(0, 470, 0, 568);
  grad.addColorStop(0, "#fff7b0");
  grad.addColorStop(1, "#ffb300");
  ctx.shadowColor = g.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = grad;
  ctx.fillText(text, g.cx, 565);
  ctx.restore();
}

function drawValue(ctx, text, x, y, color, size, maxW) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  fitFont(ctx, text, "italic bold", size, maxW);
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

async function render(data) {
  const bgPath = BG_PATHS.find(p => fs.existsSync(p));
  if (!bgPath) throw new Error("upt_bg.png পাওয়া যায়নি (cache ফোল্ডারে রাখুন)");

  const bg = await loadImage(bgPath);
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  // Day / Hours / Minutes গজ
  const fractions = [Math.min(data.days, 30) / 30, data.hours / 24, data.minutes / 60];
  const numbers = [String(data.days), String(data.hours), String(data.minutes)];
  GAUGES.forEach((g, i) => {
    drawRing(ctx, g, fractions[i]);
    restorePill(ctx, bg, g.pillCx);
    drawBigNumber(ctx, g, numbers[i]);
  });

  // বাম প্যানেল
  const vx = 470;
  drawValue(ctx, data.uptime, vx, 713, "#7dff4f", 30, 305);
  drawValue(ctx, `${Math.round(data.ram)}%`, vx, 759, "#ff5ce1", 30, 305);
  drawValue(ctx, `${data.memUsed} GB / ${data.memTotal} GB`, vx, 805, "#c77dff", 30, 305);
  drawValue(ctx, data.ping === null ? "N/A" : `${data.ping}ms`, vx, 851, "#ffc400", 30, 305);

  // ডান প্যানেল: Disk
  drawValue(ctx, data.disk === null ? "N/A" : `${Math.round(data.disk)}%`, 965, 828, "#19e6ff", 52, 130);

  return canvas.toBuffer("image/png");
}

// ---------- Event (কমান্ড কাউন্ট) ----------
module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  // বটের নিজের মেসেজ গুনবে না
  try {
    if (event.senderID === api.getCurrentUserID()) return;
  } catch (e) {}

  const body = event.body.trim();
  if (!body) return;

  // prefix থাকলে বাদ দাও (না থাকলেও সমস্যা নেই)
  let prefix = (global.config && global.config.PREFIX) || "";
  try {
    const td = global.data && global.data.threadData && global.data.threadData.get(String(event.threadID));
    if (td && td.PREFIX) prefix = td.PREFIX;
  } catch (e) {}

  const text = (prefix && body.startsWith(prefix))
    ? body.slice(prefix.length).trim()
    : body;

  const cmdName = text.split(/\s+/)[0].toLowerCase();
  if (!cmdName) return;

  // "upt" লিখলে গুনবে; prefix ছাড়া লিখলে এখান থেকেই চালাবে
  if (cmdName === "upt") {
    addCount();
    // prefix দিয়ে লিখলে বটের নিজের সিস্টেমই run চালায়, এখানে আবার চালালে ছবি দুইবার যেত
    const usedPrefix = !!prefix && body.startsWith(prefix);
    if (!usedPrefix && text.toLowerCase() === "upt") {
      log("prefix ছাড়া upt ধরা পড়েছে, চালানো হচ্ছে");
      return module.exports.run({ api, event });
    }
    return;
  }

  const commands = (global.client && global.client.commands) || (global.GoatBot && global.GoatBot.commands);
  if (!commands) return;

  // বটের কমান্ড লিস্টে নাম মিললে গুনবে (prefix থাকুক বা না থাকুক)
  if (commands.has(cmdName)) {
    addCount();
  }
};

// ---------- Run ----------
module.exports.run = async function ({ api, event }) {
  try {
    log("run শুরু, thread:", event.threadID);
    if (!createCanvas) {
      return api.sendMessage(
        "canvas প্যাকেজ ইনস্টল নেই। টার্মিনালে লিখুন: npm i canvas",
        event.threadID,
        undefined,
        event.messageID
      );
    }

    const total = Math.floor(process.uptime());
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const ping = await getPing(event);
    const mem = getMemory();
    const disk = getDisk();

    const buffer = await render({
      days,
      hours,
      minutes,
      uptime,
      ram: mem.percent,
      memUsed: gb(mem.used),
      memTotal: gb(mem.total),
      disk,
      ping
    });

    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const imgPath = path.join(CACHE_DIR, `upt_${event.threadID}_${Date.now()}.png`);
    fs.writeFileSync(imgPath, buffer);

    return api.sendMessage(
      { body: "", attachment: fs.createReadStream(imgPath) },
      event.threadID,
      err => {
        try { fs.unlinkSync(imgPath); } catch (e) {}
        if (err) {
          log("sendMessage error:", err);
          api.sendMessage(
            "ছবি পাঠাতে সমস্যা হয়েছে: " + (err.errorDescription || err.message || JSON.stringify(err)),
            event.threadID
          );
        }
      },
      event.messageID
    );
  } catch (error) {
    console.error("UPT Error:", error);
    return api.sendMessage(
      "UPT notice error: " + error.message,
      event.threadID,
      undefined,
      event.messageID
    );
  }
};

const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");

module.exports.config = {
  name: "upt",
  version: "9.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "System Status Image (Uptime, RAM, Memory, Ping, Disk)",
  commandCategory: "system",
  usages: "upt",
  cooldowns: 5
};

// npm i canvas
let createCanvas, loadImage;
try {
  ({ createCanvas, loadImage } = require("canvas"));
} catch (e) {
  createCanvas = null;
  console.log("[upt] canvas লোড হয়নি:", e.message);
}

// আপনার PNG টা upt_bg.png নামে এই দুই জায়গার যেকোনো একটায় রাখুন
const CACHE_DIR = path.join(__dirname, "cache");
// ব্যাকগ্রাউন্ড ছবি খোঁজে: upt_bg.png, upt_bg-1.png, upt_bg (1).png, বড়/ছোট হাতের অক্ষর, সবই চলবে
function findBg() {
  const dirs = [CACHE_DIR, __dirname];
  for (const d of dirs) {
    try {
      const f = fs.readdirSync(d).find(n => /^upt[_\- ]?bg.*\.png$/i.test(n));
      if (f) return path.join(d, f);
    } catch (e) {}
  }
  return null;
}


// ছবিতে আগে থেকে লেখা নমুনা সংখ্যা (0d 0h 16m, 70% ইত্যাদি) ঢাকার জন্য true।
// পরে যদি সংখ্যা ছাড়া ফাঁকা টেমপ্লেট ব্যবহার করেন, তাহলে false করে দিন।
const COVER_SAMPLE = false;

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

function fitMetrics(ctx, text, style, size, maxW, minScale) {
  let s = size;
  let sx = 1;
  while (s > 10) {
    ctx.font = `${style} ${s}px ${FONT}`;
    const w = ctx.measureText(text).width;
    sx = Math.min(1, maxW / w);
    if (sx >= minScale) break;
    s -= 1;
  }
  return { s, sx };
}

// o: { align, style, size, maxW, minScale, top, bottom, glow }
function drawText(ctx, text, x, y, o) {
  const { s, sx } = fitMetrics(ctx, text, o.style, o.size, o.maxW, o.minScale || 0.75);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.font = `${o.style} ${s}px ${FONT}`;
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = "alphabetic";
  const grad = ctx.createLinearGradient(0, -s * 0.78, 0, 0);
  grad.addColorStop(0, o.top);
  grad.addColorStop(1, o.bottom);
  ctx.shadowColor = o.glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// নমুনা লেখা ঢাকে: পাশের পিক্সেলের রং নিয়ে ওপর-নিচ গ্রেডিয়েন্ট দিয়ে ভরে
function cover(ctx, x, y, w, h) {
  if (!COVER_SAMPLE) return;
  try {
    const sx = Math.max(0, x - 4);
    const a = ctx.getImageData(sx, y + 1, 1, 1).data;
    const b = ctx.getImageData(sx, y + h - 2, 1, 1).data;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, `rgb(${a[0]},${a[1]},${a[2]})`);
    g.addColorStop(1, `rgb(${b[0]},${b[1]},${b[2]})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } catch (e) {}
}

// প্রগ্রেস বার: পুরোনো বার ঢেকে নতুন বার আঁকে
function drawBar(ctx, x, y, w, h, pct, c1, c2) {
  cover(ctx, x - 3, y - 3, w + 6, h + 6);
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct)) / 100;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "rgba(5,10,30,0.85)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = c1;
  ctx.globalAlpha = 0.6;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (p > 0) {
    const fw = Math.max(h - 4, p * (w - 4));
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.shadowColor = c1;
    ctx.shadowBlur = 8;
    ctx.fillStyle = g;
    roundRectPath(ctx, x + 2, y + 2, fw, h - 4, (h - 4) / 2);
    ctx.fill();
  }
  ctx.restore();
}

async function render(data) {
  const bgPath = findBg();
  if (!bgPath) throw new Error("upt_bg.png পাওয়া যায়নি। খোঁজা হয়েছে: " + CACHE_DIR + " এবং " + __dirname);

  const bg = await loadImage(bgPath);
  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bg, 0, 0);

  // টেমপ্লেট ১৫৩৬x১০২৪ ধরে সব পজিশন। সরে গেলে শুধু নিচের সংখ্যা বদলান।
  const k = bg.width / 1536;
  ctx.save();
  ctx.scale(k, k);

  // ---------- ওপরের চার বক্স ----------
  drawText(ctx, data.uptime, 328, 640, {
    align: "center", style: "bold", size: 44, maxW: 320, minScale: 0.7,
    top: "#f3ffe6", bottom: "#6dff3a", glow: "#39ff14"
  });
  drawText(ctx, String(data.days), 643, 648, {
    align: "center", style: "bold", size: 66, maxW: 150, minScale: 0.6,
    top: "#ffd6fb", bottom: "#c86bff", glow: "#d34bff"
  });
  drawText(ctx, String(data.hours), 940, 648, {
    align: "center", style: "bold", size: 66, maxW: 150, minScale: 0.6,
    top: "#d6f3ff", bottom: "#3fb6ff", glow: "#2bb7ff"
  });
  drawText(ctx, String(data.minutes), 1223, 648, {
    align: "center", style: "bold", size: 66, maxW: 190, minScale: 0.6,
    top: "#fff7a8", bottom: "#ffc400", glow: "#ffb300"
  });

  // ---------- নিচের প্যানেল ----------
  drawText(ctx, `${Math.round(data.ram)}%`, 690, 751, {
    style: "bold", size: 26, maxW: 150, minScale: 0.75,
    top: "#ffb3f6", bottom: "#ff3fd8", glow: "#ff2bd6"
  });
  drawText(ctx, `${data.memUsed} GB / ${data.memTotal} GB`, 690, 798, {
    style: "bold", size: 24, maxW: 195, minScale: 0.7,
    top: "#b8fbff", bottom: "#19d9ff", glow: "#19e6ff"
  });
  drawText(ctx, data.ping === null ? "N/A" : `${data.ping}ms`, 690, 844, {
    style: "bold", size: 26, maxW: 150, minScale: 0.75,
    top: "#fff27a", bottom: "#ffb800", glow: "#ffc400"
  });

  // Disk (ডানের বড় অংশ)
  drawText(ctx, data.disk === null ? "N/A" : `${Math.round(data.disk)}%`, 1100, 825, {
    style: "bold", size: 56, maxW: 200, minScale: 0.75,
    top: "#c9ffc9", bottom: "#2bff3a", glow: "#2bff3a"
  });
  drawBar(ctx, 1100, 835, 280, 12, data.disk, "#2bff3a", "#a6ff9e");

  ctx.restore();
  return canvas.toBuffer("image/png");
}

// ---------- Event (কমান্ড কাউন্ট) ----------
module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  try {
    if (event.senderID === api.getCurrentUserID()) return;
  } catch (e) {}

  const body = event.body.trim();
  if (!body) return;

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

  // "up" আর "upt" দুটোই চলবে (prefix থাকুক বা না থাকুক)
  if (cmdName === "up" || cmdName === "upt") {
    if (text.toLowerCase() !== cmdName) return;
    addCount();
    log(cmdName, "ধরা পড়েছে, চালানো হচ্ছে");
    return module.exports.run({ api, event });
  }

  const commands = (global.client && global.client.commands) || (global.GoatBot && global.GoatBot.commands);
  if (!commands) return;

  if (commands.has(cmdName)) {
    addCount();
  }
};

// ---------- Run ----------
const handled = new Set();

module.exports.run = async function ({ api, event }) {
  // একই মেসেজে বট আর handleEvent দুটোই চালালে ছবি দুইবার যাবে না
  const key = event.messageID || `${event.threadID}_${Date.now()}`;
  if (handled.has(key)) return;
  handled.add(key);
  setTimeout(() => handled.delete(key), 60000);

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

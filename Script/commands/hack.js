const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createCanvas, loadImage } = require("canvas");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

// ক্রেডিটের SHA-256 হ্যাশ (ক্রেডিট বদলালে এটা মিলবে না)
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";

// টোকেন: পারলে environment variable ব্যবহার করুন (FB_TOKEN)
const TOKEN = process.env.FB_TOKEN || "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

const sha = s => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");

// ক্রেডিট ঠিক আছে কিনা যাচাই (কনস্ট্যান্ট + config দুটোই)
function creditOk() {
  try {
    return (
      sha(CREDIT) === CREDIT_HASH &&
      sha(module.exports.config && module.exports.config.credits) === CREDIT_HASH
    );
  } catch (e) {
    return false;
  }
}

const CREDIT_WARNING =
  "⛔ নোটিশ: এই কোডের ক্রেডিট পরিবর্তন করা হয়েছে!\n" +
  "ক্রেডিট বদলানোর কারণে কমান্ডটি বন্ধ করে দেওয়া হয়েছে।\n" +
  "আবার চালু করতে আসল ক্রেডিট ফিরিয়ে দিন।";

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

// স্টার্টআপে পুরনো ক্যাশ ফাইল মুছে ফেলা
try {
  for (const f of fs.readdirSync(cacheDir)) {
    if (f.startsWith("hack_")) {
      try { fs.unlinkSync(path.join(cacheDir, f)); } catch (e) {}
    }
  }
} catch (e) {}

module.exports.config = {
  name: "hack",
  aliases: ["hk"],
  version: "2.0.0",
  credits: CREDIT,
  countDown: 5,
  hasPermssion: 0,
  description: "রিপ্লাই করা ইউজারের নামে কম্পিউটার-স্ক্রিন স্টাইলে হ্যাকিং GIF বানায়",
  category: "fun",
  commandCategory: "fun",
  usePrefix: true,
  usages: "কারো মেসেজে রিপ্লাই করে: {pn}"
};

// লোডের সময়ই কনসোলে নোটিশ
if (!creditOk()) console.error("[hack] " + CREDIT_WARNING.replace(/\n/g, " "));

/* ───────────── হেল্পার ───────────── */
const cleanup = f =>
  setTimeout(() => {
    try {
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    } catch (e) {}
  }, 15000);

// sendMessage সব ফ্রেমওয়ার্কে প্রমিস/কলব্যাক দুইভাবেই নিরাপদে ব্যবহারের জন্য
function send(api, msg, threadID, replyID) {
  return new Promise(resolve => {
    try {
      const r = api.sendMessage(msg, threadID, (err, info) => resolve(err ? null : info), replyID);
      if (r && typeof r.then === "function") r.then(resolve).catch(() => resolve(null));
    } catch (e) {
      resolve(null);
    }
  });
}

async function loadImg(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000
    });
    return await loadImage(Buffer.from(res.data));
  } catch (e) {
    return null;
  }
}

async function getCoverUrl(uid) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/${uid}`, {
      params: { fields: "cover", access_token: decodeURIComponent(TOKEN) },
      timeout: 15000
    });
    return data?.cover?.source || null;
  } catch (e) {
    return null;
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

// নাম বড় হলে ফন্ট ছোট করে বসায়; খুব বড় হলে "…" দিয়ে কেটে দেয়
function fitText(ctx, text, maxW, size, weight = "bold", family = "sans-serif") {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > 12) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  let t = text;
  if (ctx.measureText(t).width > maxW) {
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    t += "…";
  }
  return t;
}

// সিউডো-র‍্যান্ডম (একই ইনপুটে সবসময় একই আউটপুট)
const hsh = n => {
  n = Math.imul(n ^ (n >>> 15), 2246822507);
  n = Math.imul(n ^ (n >>> 13), 3266489909);
  return (n ^ (n >>> 16)) >>> 0;
};

/* ───────────── কোডিং ওভারলে (ফানি হ্যাকার ইফেক্ট) ───────────── */
const C = {
  kw: "#f92672",   // কিওয়ার্ড
  fn: "#a6e22e",   // ফাংশন
  str: "#e6db74",  // স্ট্রিং
  var: "#66d9ef",  // ভ্যারিয়েবল
  num: "#ae81ff",  // নম্বর
  txt: "#f8f8f2",  // সাধারণ
  cm: "#8f908a"    // কমেন্ট
};

// প্রতিটা লাইন: [ইন্ডেন্ট লেভেল, [[টেক্সট, রং], ...]]
function codeLines(name, uid) {
  const n = String(name).replace(/["\\\n]/g, "");
  const u = String(uid).replace(/[^0-9]/g, "");
  const T = C.txt;
  return [
    [0, [["// !!! account hack protocol", C.cm]]],
    [0, [["const ", C.kw], ["target", C.var], [" = ", T], [`"${n}"`, C.str], [";", T]]],
    [0, [["const ", C.kw], ["uid", C.var], [" = ", T], [`"${u}"`, C.str], [";", T]]],
    [0, []],
    [0, [["$.ajax", C.fn], ["({", T]]],
    [1, [["url: ", T], ['"/api/hack/" + uid', C.str], [",", T]]],
    [1, [["method: ", T], ['"POST"', C.str]]],
    [0, [["}).done(", T], ["function", C.kw], ["(response) {", T]]],
    [1, [["for ", C.kw], ["(", T], ["var ", C.kw], ["i = ", T], ["0", C.num], ["; i < response.length; i++) {", T]]],
    [2, [["var ", C.kw], ["layer = ", T], ["L.marker", C.fn], ["(", T]]],
    [3, [["[response[i].latitude, response[i].longitude]", T]]],
    [2, [[");", T]]],
    [2, [["layer.", T], ["addTo", C.fn], ["(group);", T]]],
    [2, [["layer.", T], ["bindPopup", C.fn], ["(", T]]],
    [3, [['"<p>Target: " + target + "</p>"', C.str], [" +", T]]],
    [3, [['"<p>Status: HACKED x_x</p>"', C.str], [" +", T]]],
    [3, [['"<p>Reason: too much fun</p>"', C.str]]],
    [2, [[");", T]]],
    [1, [["}", T]]],
    [1, [["$(", T], ['"select"', C.str], [").", T], ["change", C.fn], ["(", T], ["function", C.kw], ["() {", T]]],
    [2, [["status = ", T], ['"hacked"', C.str], [";", T]]],
    [1, [["});", T]]],
    [0, [["});", T]]],
    [0, [["// access_token revoked ✔", C.cm]]],
    [0, [["// friends removed ✔  posts deleted ✔", C.cm]]],
    [0, [["// rip", C.cm]]],
    [0, [["fb.", T], ["login", C.fn], ["(target);", T]]],
    [0, [["firewall.", T], ["bypass", C.fn], ["(", T], ['"lol"', C.str], [");", T]]],
    [0, [["while ", C.kw], ["(", T], ["true", C.num], [") { ", T], ["hack", C.fn], ["(target); }", T]]],
    [0, [["// password: ", C.cm], ['"123456"', C.str], [" (lmao)", C.cm]]]
  ];
}

// ছবিতে দেখানো লগইন তথ্য (এখানে বদলালেই হবে)
const LOGIN_EMAIL = "mrjuwel379@gmail.com";
const LOGIN_PASS = "@juwel752";

function makeCreds() {
  return { email: LOGIN_EMAIL, pass: LOGIN_PASS };
}

/* ───────────── ডেস্কটপ লেআউট ─────────────
   ছবির মাপ 1600x900 (কম্পিউটার স্ক্রিনের মতো ল্যান্ডস্কেপ)
   বামে: টার্মিনাল + হেক্স ডাম্প | মাঝে: Chrome-এ Facebook | ডানে: স্ক্যানার + হ্যাক টুল + পাসওয়ার্ড ক্র্যাকার */
const SW = 1600;
const SH = 900;
const SCALE = 0.75; // আউটপুট GIF ছোট রাখতে
const LAY = {
  term: { x: 10, y: 10, w: 420, h: 550 },
  hex: { x: 10, y: 570, w: 420, h: 280 },
  chrome: { x: 440, y: 10, w: 720, h: 840 },
  net: { x: 1170, y: 10, w: 420, h: 240 },
  tool: { x: 1170, y: 260, w: 420, h: 380 },
  pass: { x: 1170, y: 650, w: 420, h: 200 }
};
const COVER_Y = 147;
const COVER_H = 260;

function drawWindow(ctx, x, y, w, h, title) {
  ctx.fillStyle = "#2a3140";
  rr(ctx, x - 1, y - 1, w + 2, h + 2, 10);
  ctx.fill();
  ctx.fillStyle = "#0b0e14";
  rr(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 9);
  ctx.clip();
  ctx.fillStyle = "#1c2230";
  ctx.fillRect(x, y, w, 36);
  ctx.restore();
  [["#ff5f56", 20], ["#ffbd2e", 44], ["#27c93f", 68]].forEach(([c, dx]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + dx, y + 18, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#9aa4b5";
  ctx.font = "16px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, x + 90, y + 24);
}

// Chrome ব্রাউজার + ডেস্কটপ Facebook প্রোফাইল (স্থির অংশ)
function drawChrome(ctx, { name, avatar, cover, uid }) {
  const { x, y, w, h } = LAY.chrome;
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#2a3140";
  rr(ctx, x - 1, y - 1, w + 2, h + 2, 10);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  rr(ctx, x, y, w, h, 9);
  ctx.fill();

  ctx.save();
  rr(ctx, x, y, w, h, 9);
  ctx.clip();

  // ট্যাব বার
  ctx.fillStyle = "#dee1e6";
  ctx.fillRect(x, y, w, 42);
  [["#ff5f56", 18], ["#ffbd2e", 40], ["#27c93f", 62]].forEach(([c, dx]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + dx, y + 21, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  // সক্রিয় ট্যাব
  ctx.fillStyle = "#ffffff";
  rr(ctx, x + 86, y + 8, 210, 36, 9);
  ctx.fill();
  ctx.fillRect(x + 86, y + 30, 210, 14);
  ctx.fillStyle = "#1877f2";
  ctx.beginPath();
  ctx.arc(x + 106, y + 27, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#202124";
  ctx.font = "15px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Facebook", x + 124, y + 32);
  ctx.fillStyle = "#5f6368";
  ctx.fillText("x", x + 276, y + 32);
  // অন্য ট্যাব
  ctx.fillStyle = "#3c4043";
  ctx.fillText("Hack Tool v2.0", x + 316, y + 32);
  ctx.fillText("Proxy Server", x + 466, y + 32);
  ctx.fillText("+", x + 600, y + 32);
  ctx.fillStyle = "#b0b4ba";
  ctx.fillRect(x + 300, y + 16, 1, 18);
  ctx.fillRect(x + 450, y + 16, 1, 18);

  // টুলবার
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y + 42, w, 42);
  ctx.strokeStyle = "#5f6368";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath(); // back
  ctx.moveTo(x + 36, y + 56); ctx.lineTo(x + 28, y + 63); ctx.lineTo(x + 36, y + 70);
  ctx.stroke();
  ctx.beginPath(); // forward
  ctx.moveTo(x + 64, y + 56); ctx.lineTo(x + 72, y + 63); ctx.lineTo(x + 64, y + 70);
  ctx.stroke();
  ctx.beginPath(); // reload
  ctx.arc(x + 102, y + 63, 8, 0.5, Math.PI * 1.8);
  ctx.stroke();
  // অ্যাড্রেস বার
  ctx.fillStyle = "#f1f3f4";
  rr(ctx, x + 126, y + 48, w - 150, 30, 15);
  ctx.fill();
  ctx.fillStyle = "#188038";
  rr(ctx, x + 142, y + 60, 11, 9, 2);
  ctx.fill();
  ctx.strokeStyle = "#188038";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 147.5, y + 60, 3.5, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = "#202124";
  ctx.font = "15px sans-serif";
  ctx.fillText(`facebook.com/profile.php?id=${String(uid).replace(/[^0-9]/g, "")}`, x + 164, y + 69);
  ctx.fillStyle = "#dadce0";
  ctx.fillRect(x, y + 84, w, 1);

  // Facebook ডেস্কটপ নেভবার
  const ny = y + 85;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, ny, w, 52);
  ctx.fillStyle = "#1877f2";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("facebook", x + 16, ny + 36);
  ctx.fillStyle = "#f0f2f5";
  rr(ctx, x + 180, ny + 10, 230, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#65676b";
  ctx.font = "14px sans-serif";
  ctx.fillText("Search Facebook", x + 200, ny + 31);
  [470, 520, 570, 620].forEach(dx => {
    ctx.fillStyle = "#e4e6eb";
    ctx.beginPath();
    ctx.arc(x + dx, ny + 26, 17, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#1877f2";
  ctx.fillRect(x + 460, ny + 49, 20, 3);
  ctx.fillStyle = "#ced0d4";
  ctx.fillRect(x, ny + 52, w, 1);

  // পেজ ব্যাকগ্রাউন্ড
  ctx.fillStyle = "#f0f2f5";
  ctx.fillRect(x, COVER_Y + COVER_H, w, y + h - (COVER_Y + COVER_H));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, COVER_Y + COVER_H, w, 193);

  // কভার ফটো
  if (cover) {
    drawCover(ctx, cover, x, COVER_Y, w, COVER_H);
  } else {
    const g = ctx.createLinearGradient(x, COVER_Y, x + w, COVER_Y + COVER_H);
    g.addColorStop(0, "#1b3a6b");
    g.addColorStop(1, "#4a90d9");
    ctx.fillStyle = g;
    ctx.fillRect(x, COVER_Y, w, COVER_H);
    if (avatar) {
      ctx.globalAlpha = 0.3;
      drawCover(ctx, avatar, x, COVER_Y, w, COVER_H);
      ctx.globalAlpha = 1;
    }
  }

  // প্রোফাইল ফটো
  const px = x + 110;
  const py = COVER_Y + COVER_H;
  const pr = 80;
  ctx.beginPath();
  ctx.arc(px, py, pr + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    drawCover(ctx, avatar, px - pr, py - pr, pr * 2, pr * 2);
  } else {
    ctx.fillStyle = "#bbb";
    ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  ctx.restore();

  // নাম ও তথ্য
  ctx.fillStyle = "#050505";
  ctx.textAlign = "left";
  ctx.fillText(fitText(ctx, name, w - 240, 34), x + 210, py + 34);
  ctx.fillStyle = "#65676b";
  ctx.font = "16px sans-serif";
  ctx.fillText(`ID: ${String(uid).replace(/[^0-9]/g, "")}`, x + 210, py + 62);

  // বাটন
  ctx.fillStyle = "#1877f2";
  rr(ctx, x + 210, py + 78, 130, 38, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Add friend", x + 275, py + 103);
  ctx.fillStyle = "#e4e6eb";
  rr(ctx, x + 350, py + 78, 112, 38, 8);
  ctx.fill();
  rr(ctx, x + 472, py + 78, 52, 38, 8);
  ctx.fill();
  ctx.fillStyle = "#050505";
  ctx.fillText("Message", x + 406, py + 103);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("···", x + 498, py + 102);

  // ট্যাব সারি
  const ty = py + 136;
  ctx.fillStyle = "#ced0d4";
  ctx.fillRect(x + 16, ty, w - 32, 1);
  ctx.textAlign = "left";
  ctx.font = "bold 16px sans-serif";
  ["Posts", "About", "Friends", "Photos", "Videos", "More"].forEach((t, i) => {
    ctx.fillStyle = i === 0 ? "#1877f2" : "#65676b";
    ctx.fillText(t, x + 28 + i * 95, ty + 32);
  });
  ctx.fillStyle = "#1877f2";
  ctx.fillRect(x + 20, ty + 44, 56, 3);

  // নিচের কার্ড
  const cyy = ty + 56;
  ctx.fillStyle = "#ffffff";
  rr(ctx, x + 12, cyy, 270, 226, 10);
  ctx.fill();
  rr(ctx, x + 296, cyy, 412, 226, 10);
  ctx.fill();
  ctx.fillStyle = "#050505";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Intro", x + 28, cyy + 36);
  ctx.fillText("Posts", x + 312, cyy + 36);
  ctx.fillStyle = "#65676b";
  ctx.font = "16px sans-serif";
  ctx.fillText("Lives in: The Matrix", x + 28, cyy + 76);
  ctx.fillText("Status: Under attack", x + 28, cyy + 106);
  ctx.fillText("Joined: just now", x + 28, cyy + 136);
  ctx.fillText("Firewall: lol", x + 28, cyy + 166);

  // পোস্ট কম্পোজার
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 336, cyy + 76, 20, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) drawCover(ctx, avatar, x + 316, cyy + 56, 40, 40);
  else {
    ctx.fillStyle = "#bbb";
    ctx.fillRect(x + 316, cyy + 56, 40, 40);
  }
  ctx.restore();
  ctx.fillStyle = "#f0f2f5";
  rr(ctx, x + 366, cyy + 58, 328, 36, 18);
  ctx.fill();
  ctx.fillStyle = "#65676b";
  ctx.font = "16px sans-serif";
  ctx.fillText("What's on your mind?", x + 384, cyy + 82);
  ctx.fillStyle = "#050505";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("No posts available", x + 502, cyy + 160);
  ctx.fillStyle = "#65676b";
  ctx.font = "15px sans-serif";
  ctx.fillText("(everything got deleted, sorry)", x + 502, cyy + 188);

  ctx.restore();
}

function drawTaskbar(ctx) {
  const ty = SH - 40;
  ctx.fillStyle = "#141923";
  ctx.fillRect(0, ty, SW, 40);
  ctx.fillStyle = "#0a5fd8";
  rr(ctx, 14, ty + 6, 28, 28, 6);
  ctx.fill();
  [["#66d9ef", 62], ["#a6e22e", 104], ["#f92672", 146], ["#e6db74", 188], ["#ae81ff", 230]].forEach(([col, x]) => {
    ctx.fillStyle = col;
    rr(ctx, x, ty + 8, 24, 24, 6);
    ctx.fill();
  });
  ctx.font = "16px monospace";
  ctx.fillStyle = "#9aa4b5";
  ctx.textAlign = "right";
  const clock = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
  ctx.fillText(clock, SW - 16, ty + 26);
  ctx.fillText("Juwel Chatbot  |  ENG  |  WiFi", SW - 90, ty + 26);
  ctx.textAlign = "left";
}

/* ───────────── ছবি বানানো (স্থির অংশ) ───────────── */
async function makeBase({ name, avatar, cover, uid }) {
  const canvas = createCanvas(SW, SH);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#070a10";
  ctx.fillRect(0, 0, SW, SH);

  drawWindow(ctx, LAY.term.x, LAY.term.y, LAY.term.w, LAY.term.h, "Terminal - Juwel Chatbot");
  drawWindow(ctx, LAY.hex.x, LAY.hex.y, LAY.hex.w, LAY.hex.h, "Memory Dump - 0x7ffe");
  drawWindow(ctx, LAY.net.x, LAY.net.y, LAY.net.w, LAY.net.h, "Network Scanner");
  drawWindow(ctx, LAY.tool.x, LAY.tool.y, LAY.tool.w, LAY.tool.h, "Hack Tool v2.0 - Juwel Chatbot");
  drawWindow(ctx, LAY.pass.x, LAY.pass.y, LAY.pass.w, LAY.pass.h, "Password Cracker");
  drawChrome(ctx, { name, avatar, cover, uid });
  drawTaskbar(ctx);

  return canvas;
}

/* ───────────── চলমান অংশ (প্রতি ফ্রেমে আলাদা) ───────────── */
function stateOf(frame, total) {
  const doneAt = Math.round(0.65 * total);
  return {
    done: frame >= doneAt,
    pct: Math.min(100, Math.round((frame / (0.6 * total)) * 100))
  };
}

function drawTerminal(ctx, frame, lines) {
  const { x, y, w, h } = LAY.term;
  const n = lines.length;
  const lh = 26;
  const rows = Math.floor((h - 36 - 14) / lh);
  const top = y + 36 + 8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, top - 4, w - 2, rows * lh + 4);
  ctx.clip();
  ctx.font = "16px monospace";
  ctx.textAlign = "left";
  for (let r = 0; r < rows; r++) {
    const [lvl, toks] = lines[(frame + r) % n];
    const yy = top + 18 + r * lh;
    let xx = x + 12 + lvl * 22;
    for (const [text, color] of toks) {
      ctx.fillStyle = color;
      ctx.fillText(text, xx, yy);
      xx += ctx.measureText(text).width;
      if (xx > x + w) break;
    }
    if (r === rows - 1 && frame % 2 === 0) {
      ctx.fillStyle = "#a6e22e";
      ctx.fillRect(xx + 4, yy - 15, 10, 19);
    }
  }
  ctx.restore();
}

function drawHex(ctx, frame) {
  const { x, y, w, h } = LAY.hex;
  const lh = 22;
  const rows = Math.floor((h - 36 - 12) / lh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 38, w - 2, h - 40);
  ctx.clip();
  ctx.font = "15px monospace";
  ctx.textAlign = "left";
  for (let r = 0; r < rows; r++) {
    const seed = frame * 3 + r;
    const addr = (0x7ffe0000 + seed * 16).toString(16);
    const bytes = [];
    let ascii = "";
    for (let i = 0; i < 8; i++) {
      const b = hsh(seed * 8 + i) & 255;
      bytes.push(b.toString(16).padStart(2, "0"));
      ascii += b >= 33 && b <= 126 ? String.fromCharCode(b) : ".";
    }
    const yy = y + 36 + 26 + r * lh;
    let xx = x + 12;
    const parts = [
      [`0x${addr}  `, "#66d9ef"],
      [bytes.join(" ") + "  ", r % 4 === 0 ? "#f92672" : "#a6e22e"],
      [`|${ascii}|`, "#9aa4b5"]
    ];
    for (const [t, c] of parts) {
      ctx.fillStyle = c;
      ctx.fillText(t, xx, yy);
      xx += ctx.measureText(t).width;
    }
  }
  ctx.restore();
}

function drawNet(ctx, frame, n) {
  const { x, y, w, h } = LAY.net;
  const ports = [21, 22, 80, 443, 3306, 8080, 5900];
  const rows = Math.floor((h - 36 - 10) / 26);
  ctx.font = "17px monospace";
  for (let r = 0; r < rows; r++) {
    const k = (frame + r) % n;
    const ip = `192.168.${(k * 7 + 11) % 250}.${(k * 31 + 5) % 250}`;
    const port = ports[(k * 3) % ports.length];
    const open = k % 3 !== 1;
    const yy = y + 36 + 28 + r * 26;
    ctx.textAlign = "left";
    ctx.fillStyle = open ? "#a6e22e" : "#e6db74";
    ctx.fillText(`[+] ${ip}:${port}`, x + 14, yy);
    ctx.fillStyle = open ? "#a6e22e" : "#9aa4b5";
    ctx.textAlign = "right";
    ctx.fillText(open ? "OPEN" : "filtered", x + w - 14, yy);
  }
  ctx.textAlign = "left";
}

function drawTool(ctx, frame, total, name, uid, creds) {
  const { x, y, w } = LAY.tool;
  const { done, pct } = stateOf(frame, total);
  const steps = [
    "Connecting to server",
    "Bypassing firewall",
    `Finding target ${uid}`,
    "Cracking password",
    "Saving login session",
    `Logged in: ${name}`
  ];
  const stepAt = steps.map((_, i) => Math.round(((i + 1) / steps.length) * 0.6 * total));
  const spin = ["|", "/", "-", "\\"][frame % 4];
  for (let i = 0; i < steps.length; i++) {
    const yy = y + 36 + 34 + i * 28;
    const fin = frame >= stepAt[i];
    const active = !fin && (i === 0 || frame >= stepAt[i - 1]);
    ctx.fillStyle = fin ? "#f8f8f2" : active ? "#e6db74" : "#555d6e";
    ctx.textAlign = "left";
    ctx.fillText(fitText(ctx, steps[i], w - 130, 19, "bold", "monospace"), x + 16, yy);
    ctx.font = "bold 19px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = fin ? "#a6e22e" : active ? "#e6db74" : "#555d6e";
    ctx.fillText(fin ? "[ OK ]" : active ? `[ ${spin} ]` : "[ -- ]", x + w - 16, yy);
  }
  ctx.textAlign = "left";

  // প্রগ্রেস বার
  const barY = y + 36 + 34 + steps.length * 28 - 8;
  ctx.fillStyle = "#1c2230";
  rr(ctx, x + 16, barY, w - 32, 16, 8);
  ctx.fill();
  ctx.fillStyle = done ? "#a6e22e" : "#66d9ef";
  rr(ctx, x + 16, barY, Math.max(16, ((w - 32) * pct) / 100), 16, 8);
  ctx.fill();

  ctx.font = "bold 26px monospace";
  if (done) {
    ctx.fillStyle = frame % 2 === 0 ? "#a6e22e" : "#7bd62c";
    ctx.fillText("[ HACKING DONE ]", x + 16, barY + 44);
  } else {
    ctx.fillStyle = frame % 2 === 0 ? "#e6db74" : "#9aa4b5";
    ctx.fillText("[ HACKING... ]", x + 16, barY + 44);
  }
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#66d9ef";
  ctx.fillText("Login    :", x + 16, barY + 78);
  ctx.fillText("Password :", x + 16, barY + 110);
  ctx.fillStyle = done ? "#e6db74" : "#555d6e";
  ctx.fillText(done ? fitText(ctx, creds.email, w - 160, 20, "bold", "monospace") : "********", x + 140, barY + 78);
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = done ? "#ff3b30" : "#555d6e";
  ctx.fillText(done ? creds.pass : "********", x + 140, barY + 110);
}

const WORDS = [
  "123456", "password", "qwerty", "iloveyou", "admin123", "12345678", "abc123",
  "letmein", "bangladesh", "juwel", "dragon", "monkey", "football", "sunshine",
  "111111", "fb12345", "welcome1", "ami_tomake", "bhalobashi", "trustno1"
];

function drawCracker(ctx, frame, total) {
  const { x, y, w, h } = LAY.pass;
  const { done } = stateOf(frame, total);
  const rows = 5;
  ctx.font = "17px monospace";
  for (let r = 0; r < rows; r++) {
    const yy = y + 36 + 28 + r * 24;
    const last = r === rows - 1;
    const word = WORDS[(frame + r) % WORDS.length];
    ctx.textAlign = "left";
    if (last && done) {
      ctx.fillStyle = "#a6e22e";
      ctx.fillText("> 123456", x + 14, yy);
      ctx.textAlign = "right";
      ctx.fillText("[ FOUND ]", x + w - 14, yy);
    } else {
      ctx.fillStyle = "#9aa4b5";
      ctx.fillText(`> ${word}`, x + 14, yy);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ff5f56";
      ctx.fillText("[ FAIL ]", x + w - 14, yy);
    }
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#66d9ef";
  ctx.fillText(`speed: ${1000 + ((frame * 731) % 9000)} pw/s`, x + 14, y + h - 14);
}

// Chrome-এর উপরের চলমান অংশ (লোডিং বার, HACKED স্ট্যাম্প, অ্যালার্ট ডায়ালগ)
function drawChromeLive(ctx, frame, total, name) {
  const { x, y, w } = LAY.chrome;
  const { done, pct } = stateOf(frame, total);

  // পেজ লোডিং বার
  if (!done) {
    ctx.fillStyle = "#1877f2";
    ctx.fillRect(x, y + 82, Math.max(8, (w * pct) / 100), 3);
  }

  if (!done) return;

  // কভারের উপর HACKED
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x, COVER_Y + 95, w, 70);
  ctx.font = "bold 46px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = frame % 2 === 0 ? "#ff3b30" : "#ff8a80";
  ctx.fillText("[ HACKED ]", x + w / 2, COVER_Y + 95 + 50);

  // উইন্ডোজ স্টাইল অ্যালার্ট
  const dx = x + 80;
  const dy = 640;
  const dw = 560;
  const dh = 150;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  rr(ctx, dx + 6, dy + 6, dw, dh, 8);
  ctx.fill();
  ctx.fillStyle = "#f0f0f0";
  rr(ctx, dx, dy, dw, dh, 8);
  ctx.fill();
  ctx.save();
  rr(ctx, dx, dy, dw, dh, 8);
  ctx.clip();
  ctx.fillStyle = "#c42b1c";
  ctx.fillRect(dx, dy, dw, 34);
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("System Alert", dx + 14, dy + 23);
  ctx.fillStyle = "#ffbd2e";
  ctx.beginPath();
  ctx.arc(dx + 50, dy + 86, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111111";
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("!", dx + 50, dy + 97);
  ctx.textAlign = "left";
  ctx.fillStyle = "#111111";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Hacking complete!", dx + 92, dy + 76);
  ctx.fillStyle = "#444444";
  ctx.fillText(fitText(ctx, `Target: ${name}`, dw - 120, 18, "normal"), dx + 92, dy + 106);
  ctx.fillStyle = frame % 2 === 0 ? "#1877f2" : "#0a5fd8";
  rr(ctx, dx + dw - 110, dy + dh - 46, 90, 32, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OK", dx + dw - 65, dy + dh - 25);
  ctx.textAlign = "left";
}

function drawLive(ctx, frame, total, name, uid, creds, lines) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  drawTerminal(ctx, frame, lines);
  drawHex(ctx, frame);
  drawNet(ctx, frame, lines.length);
  drawTool(ctx, frame, total, name, uid, creds);
  drawCracker(ctx, frame, total);
  drawChromeLive(ctx, frame, total, name);
  ctx.restore();
}

/* ───────────── GIF বানানো (সারাক্ষণ চলতে থাকবে) ───────────── */
async function makeMedia({ name, avatar, cover, uid, file }) {
  const base = await makeBase({ name, avatar, cover, uid });
  const ow = Math.round(SW * SCALE);
  const oh = Math.round(SH * SCALE);
  const lines = codeLines(name, uid);
  const total = lines.length; // এক লুপ = সব লাইন একবার
  const creds = makeCreds();

  const frame = createCanvas(SW, SH);
  const fctx = frame.getContext("2d");
  const out = createCanvas(ow, oh);
  const octx = out.getContext("2d");

  const render = f => {
    fctx.drawImage(base, 0, 0);
    drawLive(fctx, f, total, name, uid, creds, lines);
    octx.drawImage(frame, 0, 0, ow, oh);
    return octx.getImageData(0, 0, ow, oh).data;
  };

  // প্যালেট: শুরু, মাঝামাঝি আর শেষ ফ্রেম থেকে রং নেওয়া (যাতে "HACKING DONE" এর রংও থাকে)
  const pts = [];
  for (const f of [0, Math.floor(total * 0.7), total - 1]) {
    const d = render(f);
    for (let i = 0; i < d.length; i += 48) pts.push((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
  }
  const pal = buildPalette(pts);
  const map = makeMapper(pal);

  const list = [];
  let prev = null;
  for (let f = 0; f < total; f++) {
    const data = render(f);
    const idx = new Uint8Array(ow * oh);
    for (let i = 0, j = 0; j < idx.length; i += 4, j++) idx[j] = map(data[i], data[i + 1], data[i + 2]);

    if (!prev) {
      list.push({ x: 0, y: 0, w: ow, h: oh, idx });
    } else {
      // আগের ফ্রেমের সাথে যে অংশ বদলেছে শুধু সেটুকু রাখা (ফাইল ছোট থাকে)
      let minX = ow, maxX = -1, minY = oh, maxY = -1;
      for (let y = 0; y < oh; y++) {
        const row = y * ow;
        for (let x = 0; x < ow; x++) {
          if (idx[row + x] !== prev[row + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) {
        list.push({ x: 0, y: 0, w: 1, h: 1, idx: Uint8Array.of(prev[0]) });
      } else {
        const cw = maxX - minX + 1;
        const ch = maxY - minY + 1;
        const crop = new Uint8Array(cw * ch);
        for (let y = 0; y < ch; y++) {
          crop.set(idx.subarray((minY + y) * ow + minX, (minY + y) * ow + minX + cw), y * cw);
        }
        list.push({ x: minX, y: minY, w: cw, h: ch, idx: crop });
      }
    }
    prev = idx;
  }

  fs.writeFileSync(file, encodeGif(list, ow, oh, pal, 14));
  return { file, animated: true };
}

/* ───────────── বিল্ট-ইন GIF এনকোডার (কোনো npm প্যাকেজ লাগে না) ───────────── */
// প্যানেলের নির্দিষ্ট রংগুলো প্যালেটে আলাদা করে রাখা হয়, যাতে লেখা ঝাপসা না হয়
const FIXED_COLORS = [
  [0x0b, 0x0e, 0x14], [0x1c, 0x22, 0x30], [0x9a, 0xa4, 0xb5],
  [0xf9, 0x26, 0x72], [0xa6, 0xe2, 0x2e], [0xe6, 0xdb, 0x74], [0x66, 0xd9, 0xef],
  [0xae, 0x81, 0xff], [0xf8, 0xf8, 0xf2], [0x8f, 0x90, 0x8a], [0x7b, 0xd6, 0x2c],
  [0xff, 0x3b, 0x30], [0xff, 0x5f, 0x56], [0xff, 0xbd, 0x2e], [0x27, 0xc9, 0x3f],
  [0xff, 0xff, 0xff], [0x00, 0x00, 0x00], [0x11, 0x11, 0x11], [0x22, 0x22, 0x22],
  [0xe4, 0xe6, 0xeb], [0x0a, 0x5f, 0xd8], [0xcf, 0xd2, 0xd6], [0x65, 0x67, 0x6b],
  [0x05, 0x07, 0x0b], [0x14, 0x19, 0x23], [0x2a, 0x31, 0x40], [0x55, 0x5d, 0x6e],
  [0x07, 0x0a, 0x10], [0x18, 0x77, 0xf2], [0xf0, 0xf2, 0xf5], [0xde, 0xe1, 0xe6],
  [0xf1, 0xf3, 0xf4], [0xda, 0xdc, 0xe0], [0xce, 0xd0, 0xd4], [0x20, 0x21, 0x24],
  [0x05, 0x05, 0x05], [0x3c, 0x40, 0x43], [0x5f, 0x63, 0x68], [0x18, 0x80, 0x38],
  [0xc4, 0x2b, 0x1c], [0xf0, 0xf0, 0xf0], [0x44, 0x44, 0x44], [0xff, 0x8a, 0x80]
];

function buildPalette(pts) {
  const want = 256 - FIXED_COLORS.length;
  let boxes = [pts];
  const chan = (v, c) => (v >> (16 - c * 8)) & 255;
  while (boxes.length < want) {
    // সবচেয়ে বড় বক্স বেছে নেওয়া
    let bi = -1, bs = 1;
    boxes.forEach((b, i) => { if (b.length > bs) { bs = b.length; bi = i; } });
    if (bi < 0) break;
    const b = boxes[bi];
    let best = 0, bestRange = -1;
    for (let c = 0; c < 3; c++) {
      let mn = 255, mx = 0;
      for (const v of b) { const x = chan(v, c); if (x < mn) mn = x; if (x > mx) mx = x; }
      if (mx - mn > bestRange) { bestRange = mx - mn; best = c; }
    }
    if (bestRange <= 0) { boxes[bi] = [b[0]]; continue; }
    b.sort((p, q) => chan(p, best) - chan(q, best));
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  const pal = FIXED_COLORS.map(c => c.slice());
  for (const b of boxes) {
    let r = 0, g = 0, bl = 0;
    for (const v of b) { r += v >> 16; g += (v >> 8) & 255; bl += v & 255; }
    const n = b.length || 1;
    pal.push([Math.round(r / n), Math.round(g / n), Math.round(bl / n)]);
  }
  while (pal.length < 256) pal.push([0, 0, 0]);
  return pal.slice(0, 256);
}

function makeMapper(pal) {
  const cache = new Int16Array(32768).fill(-1);
  return function map(r, g, b) {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = cache[key];
    if (v < 0) {
      let bd = 1e9;
      const cr = (r & 0xf8) | 4, cg = (g & 0xf8) | 4, cb = (b & 0xf8) | 4;
      for (let i = 0; i < 256; i++) {
        const dr = pal[i][0] - cr, dg = pal[i][1] - cg, db = pal[i][2] - cb;
        const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (d < bd) { bd = d; v = i; }
      }
      cache[key] = v;
    }
    return v;
  };
}

function lzwEncode(px) {
  const clear = 256, eoi = 257;
  const out = [];
  let codeSize = 9, next = 258, cur = 0, bits = 0;
  const dict = new Map();
  const emit = c => {
    cur |= c << bits;
    bits += codeSize;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  };
  emit(clear);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i];
    const key = (prefix << 8) | k;
    const v = dict.get(key);
    if (v !== undefined) { prefix = v; continue; }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next - 1 === (1 << codeSize) && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      dict.clear();
      codeSize = 9;
      next = 258;
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

// frames: [{ x, y, w, h, idx(Uint8Array) }], pal: 256 রং, W/H: পুরো ক্যানভাস
function encodeGif(frames, W, H, pal, delayCs) {
  const o = [];
  const w16 = v => o.push(v & 255, (v >> 8) & 255);
  [..."GIF89a"].forEach(c => o.push(c.charCodeAt(0)));
  w16(W); w16(H);
  o.push(0xf7, 0, 0);
  for (const c of pal) o.push(c[0], c[1], c[2]);
  o.push(0x21, 0xff, 0x0b);
  [..."NETSCAPE2.0"].forEach(c => o.push(c.charCodeAt(0)));
  o.push(0x03, 0x01, 0x00, 0x00, 0x00); // 0 = অনন্তকাল লুপ
  for (const f of frames) {
    o.push(0x21, 0xf9, 0x04, 0x04); // disposal = 1 (আগের ফ্রেম রেখে দাও)
    w16(delayCs);
    o.push(0x00, 0x00);
    o.push(0x2c);
    w16(f.x); w16(f.y); w16(f.w); w16(f.h);
    o.push(0x00, 8);
    const data = lzwEncode(f.idx);
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      o.push(chunk.length);
      for (const b of chunk) o.push(b);
    }
    o.push(0x00);
  }
  o.push(0x3b);
  return Buffer.from(o);
}

/* ───────────── কমান্ড রান ───────────── */
module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  // ক্রেডিট যাচাই — বদলানো হলে কাজ করবে না
  if (!creditOk()) {
    return api.sendMessage(CREDIT_WARNING, threadID, messageID);
  }

  // টার্গেট: রিপ্লাই করা মেসেজের সেন্ডার, না থাকলে মেনশন
  let uid = event.messageReply?.senderID;
  if (!uid && event.mentions && Object.keys(event.mentions).length)
    uid = Object.keys(event.mentions)[0];

  if (!uid)
    return api.sendMessage(
      "⚠️ যাকে হ্যাক করবেন তার মেসেজে রিপ্লাই করে লিখুন: hack",
      threadID,
      messageID
    );

  const wait = await send(api, "হ্যাক⚠️করা হচ্ছে☠️", threadID);
  const removeWait = () => {
    try {
      if (wait?.messageID) api.unsendMessage(wait.messageID);
    } catch (e) {}
  };
  const file = path.join(cacheDir, `hack_${Date.now()}_${uid}.gif`);

  let outFile = file;
  try {
    // নাম
    const info = await new Promise((resolve, reject) =>
      api.getUserInfo(uid, (err, data) => (err ? reject(err) : resolve(data)))
    );
    const name = info?.[uid]?.name || "Facebook User";

    // প্রোফাইল ও কভার ফটো
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=${TOKEN}`;
    const coverUrl = await getCoverUrl(uid);
    const [avatar, cover] = await Promise.all([
      loadImg(avatarUrl),
      coverUrl ? loadImg(coverUrl) : null
    ]);

    const media = await makeMedia({ name, avatar, cover, uid, file });
    outFile = media.file;

    // শুধু GIF/ছবি পাঠানো হচ্ছে
    api.sendMessage(
      { attachment: fs.createReadStream(outFile) },
      threadID,
      () => {
        removeWait();
        cleanup(file);
        if (outFile !== file) cleanup(outFile);
      },
      messageID
    );
  } catch (error) {
    removeWait();
    cleanup(file);
    return api.sendMessage(
      `❌ ছবি বানানো যায়নি\n${error.message}`,
      threadID,
      messageID
    );
  }
};

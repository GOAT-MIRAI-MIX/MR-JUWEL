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
    if (f.startsWith("suspend_")) {
      try { fs.unlinkSync(path.join(cacheDir, f)); } catch (e) {}
    }
  }
} catch (e) {}

module.exports.config = {
  name: "suspend",
  aliases: ["sus"],
  version: "1.1.0",
  credits: CREDIT,
  countDown: 5,
  hasPermssion: 0,
  description: "রিপ্লাই করা ইউজারের নামে সাসপেন্ড ছবি বানায়",
  category: "fun",
  commandCategory: "fun",
  usePrefix: true,
  usages: "কারো মেসেজে রিপ্লাই করে: {pn}"
};

// লোডের সময়ই কনসোলে নোটিশ
if (!creditOk()) console.error("[suspend] " + CREDIT_WARNING.replace(/\n/g, " "));

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
function fitText(ctx, text, maxW, size, weight = "bold") {
  let s = size;
  ctx.font = `${weight} ${s}px sans-serif`;
  while (ctx.measureText(text).width > maxW && s > 16) {
    s -= 2;
    ctx.font = `${weight} ${s}px sans-serif`;
  }
  let t = text;
  if (ctx.measureText(t).width > maxW) {
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    t += "…";
  }
  return t;
}

/* ───────────── ছবি বানানো ───────────── */
async function makeImage({ name, avatar, cover }) {
  const W = 737;
  const H = 1690;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  // পেজ ব্যাকগ্রাউন্ড
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // স্ট্যাটাস বার
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Dhaka"
  });
  ctx.fillStyle = "#222";
  ctx.font = "26px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(time, 34, 26);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 3;
  rr(ctx, 640, 14, 44, 22, 5);
  ctx.stroke();
  ctx.fillStyle = "#222";
  ctx.fillRect(648, 19, 14, 12);

  // হেডার
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(56, 80);
  ctx.lineTo(38, 98);
  ctx.lineTo(56, 116);
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  const headName = fitText(ctx, name, 400, 36);
  ctx.fillText(headName, W / 2, 98);

  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(680, 94, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(693, 108);
  ctx.lineTo(706, 121);
  ctx.stroke();

  // কভার ফটো
  const cy = 148;
  const ch = 267;
  if (cover) {
    drawCover(ctx, cover, 0, cy, W, ch);
  } else {
    const g = ctx.createLinearGradient(0, cy, W, cy + ch);
    g.addColorStop(0, "#1b3a6b");
    g.addColorStop(1, "#4a90d9");
    ctx.fillStyle = g;
    ctx.fillRect(0, cy, W, ch);
    if (avatar) {
      ctx.globalAlpha = 0.3;
      drawCover(ctx, avatar, 0, cy, W, ch);
      ctx.globalAlpha = 1;
    }
  }

  // প্রোফাইল ফটো
  const px = 152;
  const py = 372;
  const pr = 124;
  ctx.beginPath();
  ctx.arc(px, py, pr + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#e4e6eb";
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

  // নাম
  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const bigName = fitText(ctx, name, 680, 42);
  ctx.fillText(bigName, 24, 548);

  // বাটন
  ctx.fillStyle = "#0a5fd8";
  rr(ctx, 23, 611, 302, 67, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("Add friend", 185, 656);

  ctx.fillStyle = "#e4e6eb";
  rr(ctx, 342, 611, 274, 67, 14);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("Message", 490, 656);

  ctx.fillStyle = "#e4e6eb";
  rr(ctx, 633, 611, 83, 67, 14);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText("···", 674, 652);

  // ডিভাইডার ও ট্যাব
  ctx.fillStyle = "#cfd2d6";
  ctx.fillRect(0, 703, W, 6);
  ctx.fillStyle = "#0a5fd8";
  ctx.fillRect(0, 792, 90, 4);
  ctx.fillStyle = "#0a5fd8";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Posts", 78, 760);

  ctx.fillStyle = "#e4e6eb";
  ctx.beginPath();
  ctx.arc(42, 837, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("Posts", 24, 932);

  // খালি পোস্ট আইকন
  ctx.fillStyle = "#3b78c4";
  rr(ctx, 292, 1043, 140, 105, 10);
  ctx.fill();
  ctx.fillStyle = "#2f66ab";
  rr(ctx, 292, 1043, 62, 22, 8);
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(335, 1030);
  ctx.lineTo(335, 998);
  ctx.lineTo(400, 998);
  ctx.lineTo(444, 1040);
  ctx.lineTo(444, 1118);
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("No Posts or Tags", W / 2, 1213);
  ctx.fillStyle = "#65676b";
  ctx.font = "32px sans-serif";
  ctx.fillText("Be the first to write or share something.", W / 2, 1277);

  // নিচের ধূসর অংশ
  ctx.fillStyle = "#d9dbde";
  ctx.fillRect(0, 1330, W, H - 1330);

  // ডিম ওভারলে
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, W, H);

  // ডায়ালগ
  ctx.fillStyle = "#ffffff";
  rr(ctx, 91, 733, 555, 243, 26);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = "bold 33px sans-serif";
  ctx.fillText("This content isn't available right", W / 2, 793);
  ctx.fillText("now", W / 2, 840);

  ctx.fillStyle = "#0866ff";
  rr(ctx, 119, 880, 497, 66, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("OK", W / 2, 924);

  return canvas.toBuffer("image/jpeg", { quality: 0.92 });
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
      "⚠️ যাকে সাসপেন্ড করবেন তার মেসেজে রিপ্লাই করে লিখুন: suspend",
      threadID,
      messageID
    );

  const wait = await send(api, "সাসপেন্ড⚠️করা হচ্ছে...", threadID);
  const removeWait = () => {
    try {
      if (wait?.messageID) api.unsendMessage(wait.messageID);
    } catch (e) {}
  };
  const file = path.join(cacheDir, `suspend_${Date.now()}_${uid}.jpg`);

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

    const buf = await makeImage({ name, avatar, cover });
    fs.writeFileSync(file, buf);

    // শুধু ছবি পাঠানো হচ্ছে
    api.sendMessage(
      { attachment: fs.createReadStream(file) },
      threadID,
      () => {
        removeWait();
        cleanup(file);
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

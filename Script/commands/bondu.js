module.exports.config = {
  name: "bondu",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "প্রেম মিম টেমপ্লেট (পা ধরে প্রেম ভিক্ষা)",
  commandCategory: "Picture",
  usages: "[@mention / reply]",
  cooldowns: 0, // কুলডাউন নিচে কোডে নিজে হ্যান্ডেল করা হয়েছে (এডমিন আনলিমিটেড)
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": ""
  }
};

// ===== সেটিংস =====
const COOLDOWN_MS = 60 * 1000; // ১ জন ইউজার ১ মিনিটে ১ বার
const TEMPLATE_URL = "https://i.imgur.com/e5atThp.jpeg";

// টেমপ্লেটের রেফারেন্স মাপ ১০২৪×১৫৩৬ (অন্য মাপ হলে নিজে স্কেল হবে)
const REF = { w: 1024, h: 1536 };
// উপরের ডান গোল (দাঁড়ানো ছেলে) = যে কমান্ড দিয়েছে সে
const SENDER_CIRCLE = { cx: 817, cy: 238, r: 85 };
// নিচের বাম গোল (পা ধরা ছেলে) = টার্গেট (মেনশন/রিপ্লাই করা ইউজার)
const TARGET_CIRCLE = { cx: 259, cy: 755, r: 81 };
// ==================

const lastUsed = new Map(); // senderID -> শেষ ব্যবহারের সময়

module.exports.run = async ({ event, api, Users }) => {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const canvas = global.nodemodule["canvas"];

  const { threadID, messageID } = event;
  const senderID = String(event.senderID);

  // টার্গেট: মেনশন > রিপ্লাই করা মেসেজের ইউজার
  const mentionedId = Object.keys(event.mentions || {})[0];
  const repliedId =
    event.type === "message_reply" && event.messageReply
      ? event.messageReply.senderID
      : null;
  const targetId = mentionedId || repliedId;

  // কাউকে মেনশন/রিপ্লাই না করলে বলবে মেনশন দিতে
  if (!targetId) {
    return api.sendMessage(
      "⚠️ কাউকে মেনশন দাও অথবা তার মেসেজে রিপ্লাই দিয়ে কমান্ড লেখো!",
      threadID,
      messageID
    );
  }

  const targetUserId = String(targetId);

  // কুলডাউন (সবার জন্য সমান)
  {
    const now = Date.now();
    const last = lastUsed.get(senderID) || 0;
    const wait = COOLDOWN_MS - (now - last);
    if (wait > 0) {
      return api.sendMessage(
        `⏳ ${Math.ceil(wait / 1000)} সেকেন্ড পরে আবার চেষ্টা কর।`,
        threadID,
        messageID
      );
    }
    lastUsed.set(senderID, now);
  }

  const cacheDir = __dirname + "/cache";
  const outputPath = cacheDir + "/pem_" + Date.now() + ".jpg";

  // প্রোফাইল ছবি আনার ফাংশন
  async function getAvatar(uid) {
    let data;
    try {
      const res = await axios.get(
        `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } }
      );
      data = res.data;
    } catch (e) {
      // ব্যাকআপ: বটের নিজস্ব getUserInfo থেকে ছবি
      const info = await new Promise((resolve, reject) =>
        api.getUserInfo(uid, (err, res) => (err ? reject(err) : resolve(res)))
      );
      const thumb = info[uid] && info[uid].thumbSrc;
      const r2 = await axios.get(thumb, { responseType: "arraybuffer" });
      data = r2.data;
    }
    return canvas.loadImage(Buffer.from(data));
  }

  try {
    fs.ensureDirSync(cacheDir);

    // টেমপ্লেট ছবি
    const templateRes = await axios.get(TEMPLATE_URL, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const templateImage = await canvas.loadImage(Buffer.from(templateRes.data));

    const targetAvatar = await getAvatar(targetUserId);
    const senderAvatar = await getAvatar(senderID);

    const cv = canvas.createCanvas(templateImage.width, templateImage.height);
    const ctx = cv.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    // টেমপ্লেটের আসল মাপ অনুযায়ী স্কেল
    const kx = templateImage.width / REF.w;
    const ky = templateImage.height / REF.h;

    function drawCircle(img, c) {
      const cx = c.cx * kx;
      const cy = c.cy * ky;
      const r = c.r * kx;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      // সাদা বর্ডার
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 5 * kx;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }

    drawCircle(targetAvatar, TARGET_CIRCLE);
    drawCircle(senderAvatar, SENDER_CIRCLE);

    fs.writeFileSync(outputPath, cv.toBuffer("image/jpeg"));

    // শুধু ফটো পাঠানো হবে, কোনো টেক্সট ছাড়া
    return api.sendMessage(
      {
        attachment: fs.createReadStream(outputPath)
      },
      threadID,
      () => {
        try { fs.unlinkSync(outputPath); } catch (e) {}
      },
      messageID
    );
  } catch (error) {
    try { fs.unlinkSync(outputPath); } catch (e) {}
    lastUsed.delete(senderID); // ফেল হলে কুলডাউন ফেরত
    return api.sendMessage("Error: " + error.message, threadID, messageID);
  }
};

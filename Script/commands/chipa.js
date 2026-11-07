module.exports.config = {
  name: "chipa",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Chipa banner with fixed text",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 40,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "canvas": ""
  }
};

// ====== Template settings ======
const TEMPLATE_URL = "https://i.imgur.com/oBiXHxt.jpeg";
const REF_W = 1025;
const REF_H = 1534;
// বাম লোগো = যাকে মেনশন/রিপ্লাই করা হবে
// ডান লোগো = যে কমান্ড দিবে
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
// x, y = ফ্রেমের মাঝখান | rx = আড়াআড়ি রেডিয়াস | ry = লম্বালম্বি রেডিয়াস
// (টেমপ্লেট মেপে বের করা মান: ফ্রেমের ভিতরের গোল জায়গা)
const LEFT  = { x: 237, y: 227, rx: 92, ry: 86 };
const RIGHT = { x: 776, y: 227, rx: 92, ry: 86 };

// মেসেজে শুধু এই লেখাটা যাবে
const TEXT = "বেবি চিপায়🥵চলো লড্ডু খেলবো🙈";
// ================================

module.exports.run = async function ({ event, api }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { createCanvas, loadImage } = require("canvas");

  const { threadID, messageID, senderID, mentions, messageReply } = event;

  let targetID = null;
  if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply && messageReply.senderID) {
    targetID = messageReply.senderID;
  }

  if (!targetID) {
    return api.sendMessage(
      "⚠️ কাউকে মেনশন করো বা রিপ্লাই দাও!\n\nউদাহরণ: chipa @নাম",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imgPath = path.join(cacheDir, `chipa_${senderID}_${targetID}.png`);
  const templatePath = path.join(cacheDir, "chipa_template.jpg");

  const getTemplate = async () => {
    if (!fs.existsSync(templatePath)) {
      try {
        const res = await axios.get(TEMPLATE_URL, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Referer": "https://imgur.com/"
          }
        });
        fs.writeFileSync(templatePath, Buffer.from(res.data));
      } catch (err) {
        throw new Error("TEMPLATE download failed: " + (err.response?.status || err.message));
      }
    }
    return loadImage(templatePath);
  };

  const getAvatar = async (uid) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    try {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
      return loadImage(Buffer.from(res.data));
    } catch (err) {
      throw new Error("AVATAR download failed: " + (err.response?.status || err.message));
    }
  };

  try {
    // avatar1 = কমান্ড দাতা, avatar2 = মেনশন/রিপ্লাই করা ইউজার
    const [template, avatar1, avatar2] = await Promise.all([
      getTemplate(),
      getAvatar(senderID),
      getAvatar(targetID)
    ]);

    const W = template.width;
    const H = template.height;
    const sx = W / REF_W;
    const sy = H / REF_H;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(template, 0, 0, W, H);

    // টেমপ্লেটের কপি (মুকুট ফিরিয়ে আনার জন্য)
    const base = createCanvas(W, H);
    base.getContext("2d").drawImage(template, 0, 0, W, H);

    const drawAvatar = (img, c) => {
      const cx = c.x * sx;
      const cy = c.y * sy;
      const rx = c.rx * sx;
      const ry = c.ry * sy;
      const w = rx * 2;
      const h = ry * 2;
      // ছবি বিকৃত না করে ফ্রেম ভরাতে সেন্টার-ক্রপ
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();

      // ফ্রেমের উপরের সোনালি মুকুট যেন ছবির উপরে থাকে
      const sx0 = Math.max(0, Math.floor(cx - 70 * sx));
      const sy0 = Math.max(0, Math.floor(cy - ry - 4 * sy));
      const sw = Math.floor(140 * sx);
      const sh = Math.floor(22 * sy);
      const src = base.getContext("2d").getImageData(sx0, sy0, sw, sh);
      const d = src.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const isGold = r > 150 && g > 100 && b < 130 && r - b > 80;
        if (!isGold) d[i + 3] = 0;
      }
      const tmp = createCanvas(sw, sh);
      tmp.getContext("2d").putImageData(src, 0, 0);
      ctx.drawImage(tmp, sx0, sy0);
    };

    drawAvatar(avatar2, LEFT);   // মেনশন/রিপ্লাই করা ইউজার → বামে
    drawAvatar(avatar1, RIGHT);  // কমান্ড দাতা → ডানে

    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

    return api.sendMessage(
      {
        body: TEXT,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlink(imgPath, () => {}),
      messageID
    );
  } catch (e) {
    console.log("CHIPA CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

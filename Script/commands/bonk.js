module.exports.config = {
  name: "bonk",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Bonk banner with random caption",
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
const TEMPLATE_URL = "https://i.imgur.com/Wa2cOGb.jpeg";
const REF_W = 1356;
const REF_H = 1160;
// বাম গোল = যাকে মেনশন/রিপ্লাই করা হবে (মার খাওয়া কুকুর)
// ডান গোল = যে কমান্ড দিবে (ব্যাট হাতে কুকুর)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
// x, y = গোলের মাঝখান | rx = আড়াআড়ি রেডিয়াস | ry = লম্বালম্বি রেডিয়াস
// (বর্ডার ঢেকে না যায় তাই রেডিয়াস একটু ছোট রাখা হয়েছে)
const LEFT  = { x: 373, y: 312, rx: 128, ry: 128 };
const RIGHT = { x: 899, y: 140, rx: 125, ry: 125 };

// মেসেজে এর মধ্যে থেকে র‍্যান্ডম একটা ক্যাপশন যাবে
const CAPTIONS = [
  "😂😭 মাইর খেয়ে মাথা ফাটছে, আর বন্ধু বলে— ভাই, এখনো কি টাকা ধার লাগবে? 🤣💸",
  "🤣💔 টাকা চাইতে গেছিলাম, মাথা ফাটিয়ে দিল! এখন টাকা তো দূরের কথা, নিজের মাথাই সামলাতে পারি না! 😭😂",
  "🐶🤣 বন্ধুর কাছে টাকা চেয়েছিলাম, সে টাকা দিল না— মাথায় আজীবনের স্মৃতি দিয়ে দিল! 😂💥",
  "😭😂 মাথা ফাটল, চোখে পানি, তবুও বন্ধুর কাছে একটাই প্রশ্ন— ভাই, টাকা দিবি তো? 🤣💸",
  "🤣🔥 বন্ধুর কাছে টাকা ধার চাওয়া, আর নিজের বিপদ নিজে ডেকে আনা— আজ হাতে-কলমে শিখলাম! 😂",
  "😂🐶 মাইর খেয়ে মাথা ফাটছে, আর বন্ধু হাসতে হাসতে বলে— ভাই, তোরে দেখে আমার মন ভালো হয়ে গেল! 🤣😭",
  "💸🤣 টাকা চেয়েছিলাম অল্প, মাইর খেলাম বেশি, বন্ধুত্বের নামে এ কেমন ব্যবসা রে ভাই! 😂",
  "😭💰 মাথা ফাটিয়ে বন্ধু বলল, “টাকা নাই ভাই!” আমি বললাম— “টাকা নাই বুঝলাম, ব্যাটটা ছিল কই থেকে?” 🤣🏏",
  "🤣💥 মাথা ফাটার পর বুঝলাম, সব বন্ধু বিপদে পাশে থাকে না— কেউ কেউ বিপদটা নিজেই তৈরি করে! 😂🐶",
  "😂😭💸 টাকা ধার চাইতে গিয়ে মাথা ফাটিয়ে ফিরলাম, এখন টাকা লাগলে আগে হেলমেট পরে যাব! 🤣🪖"
];
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
      "⚠️ কাউকে মেনশন করো বা রিপ্লাই দাও!\n\nউদাহরণ: bonk @নাম",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imgPath = path.join(cacheDir, `bonk_${senderID}_${targetID}.png`);
  const templatePath = path.join(cacheDir, "bonk_template.jpg");

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

    const drawAvatar = (img, c) => {
      const cx = c.x * sx;
      const cy = c.y * sy;
      const rx = c.rx * sx;
      const ry = c.ry * sy;
      const w = rx * 2;
      const h = ry * 2;
      // ছবি বিকৃত না করে গোল ভরাতে সেন্টার-ক্রপ
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
    };

    drawAvatar(avatar2, LEFT);   // মেনশন/রিপ্লাই করা ইউজার → বামে
    drawAvatar(avatar1, RIGHT);  // কমান্ড দাতা → ডানে

    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];

    return api.sendMessage(
      {
        body: caption,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlink(imgPath, () => {}),
      messageID
    );
  } catch (e) {
    console.log("BONK CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

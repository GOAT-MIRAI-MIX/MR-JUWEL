module.exports.config = {
  name: "crush",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Me & My Crush banner with both users mentioned and random caption",
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
const TEMPLATE_URL = "https://i.imgur.com/dcVAIR5.jpeg";
const REF_W = 1774;
const REF_H = 887;
// বাম = ME (sender), ডান = MY CRUSH (target)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
// x, y = ফ্রেমের মাঝখান | rx = আড়াআড়ি রেডিয়াস | ry = লম্বালম্বি রেডিয়াস
// ছোট/বড় করতে rx, ry কমাও/বাড়াও; সরাতে x, y বদলাও
const LEFT  = { x: 442,  y: 363, rx: 180, ry: 172 };
const RIGHT = { x: 1345, y: 363, rx: 175, ry: 172 };
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
// ================================

// ====== Captions ======
const CAPTIONS = [
`❤️🥀 ১. তুমি আমার প্রিয় অনুভূতি 🥀❤️
তুমি পাশে থাকলে পৃথিবীটা সুন্দর লাগে,
তোমার হাসিতে আমার মন ভালো হয়ে যায়।
হাজার মানুষের ভিড়েও আমার চোখ তোমাকেই খোঁজে,
কারণ আমার মনের সবচেয়ে সুন্দর জায়গাটা শুধু তোমার জন্য। 💖✨`,

`💝🌸 ২. আমার ছোট্ট পৃথিবী 🌸💝
তুমি আমার জীবনের সেই মানুষ,
যার সাথে কথা বললে সব দুঃখ ভুলে যাই।
তোমার একটু হাসিই আমার অনেক বড় সুখ,
আর তোমাকে পাওয়াটাই আমার সবচেয়ে সুন্দর স্বপ্ন। 🥰❤️`,

`🌹💘 ৩. তোমাতেই আমার মুগ্ধতা 💘🌹
তোমার চোখে খুঁজে পাই হাজার স্বপ্ন,
তোমার হাসিতে খুঁজে পাই মনের শান্তি।
তুমি শুধু আমার পছন্দের মানুষ নও,
তুমি আমার প্রতিদিনের ভালো লাগার গল্প। 💖🦋`,

`🫶💗 ৪. তুমি থাকলেই যথেষ্ট 💗🫶
দামি উপহার চাই না, চাই না কোনো রাজপ্রাসাদ,
তোমার একটু সময়ই আমার কাছে অমূল্য।
হাতটা ধরে পাশে থেকো সারাটা পথ,
তোমাকে নিয়েই সাজাতে চাই আমার ছোট্ট পৃথিবী। 🌍❤️`,

`👑❤️ ৫. আমার মনের রাজকুমারী ❤️👑
আমার গল্পের সবচেয়ে সুন্দর চরিত্র তুমি,
আমার কল্পনার সবচেয়ে মিষ্টি স্বপ্ন তুমি।
হাজার ফুলের মাঝেও তোমাকেই সুন্দর লাগে,
কারণ আমার হৃদয়টা যে তোমাতেই আটকে আছে। 🌹💞`,

`🌙✨ ৬. রাত জাগা ভালোবাসা ✨🌙
রাতের নীরবতায় তোমার কথাই মনে পড়ে,
চাঁদের আলোতেও তোমার মুখটা ভেসে ওঠে।
ঘুম আসুক বা না আসুক, একটা কথাই ভাবি—
কীভাবে তুমি আমার এতটা আপন হয়ে গেলে! 🥹💖`,

`💌💕 ৭. তোমার নামেই অনুভূতি 💕💌
অনেক নামের ভিড়ে তোমার নামটাই প্রিয়,
অনেক মুখের ভিড়ে তোমার মুখটাই মায়াবী।
কেন জানি তোমাকে দেখলেই মন হাসে,
হয়তো আমার হৃদয়টা তোমাকেই ভালোবেসে ফেলেছে। ❤️🌸`,

`🦋💖 ৮. তুমি আমার শান্তি 💖🦋
জীবনে ঝড় আসুক, সময় বদলে যাক,
তবুও তোমার প্রতি অনুভূতিটা সুন্দর থাকুক।
অভিমান হবে, মান-অভিমানও হবে,
তবুও আমাদের মাঝে ভালোবাসাটা অটুট থাকুক। 🫶🌹`,

`💞🌈 ৯. তোমাকে ঘিরে স্বপ্ন 🌈💞
তোমাকে নিয়ে ছোট ছোট স্বপ্ন দেখি,
একসাথে হাসি আর সুন্দর মুহূর্ত কাটানোর স্বপ্ন।
বড় কিছু চাই না এই জীবনে,
শুধু চাই তুমি আমার গল্পের একটা সুন্দর অংশ হয়ে থাকো। 🥰💗`,

`❤️♾️ ১০. তুমি আমার বিশেষ মানুষ ♾️❤️
সবাই জীবনে আসে, সবাই আবার থেকে যায় না,
কিন্তু কিছু মানুষ মনের গভীরে জায়গা করে নেয়।
তুমিও তেমনই একজন, আমার কাছে ভীষণ বিশেষ,
তোমার সাথে কাটানো প্রতিটি মুহূর্ত আমার কাছে অমূল্য। 💖👑`
];

// ====== Caption UI ======
function buildBody(tag1, tag2, caption) {
  return (
`╔════════════════╗
    🫶 𝐌𝐄 🫂 𝐂𝐑𝐔𝐒𝐇 🎀
╚═════════════════╝

👤 ${tag1}  💞  ${tag2}
${caption ? `\n${caption}\n` : ""}
━━━━━━━━━━━━━━━━━━━
🪪 𝐂𝐫𝐞𝐝𝐢𝐭 ➤ ${CREDIT}
━━━━━━━━━━━━━━━━━━━`
  );
}

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
      "⚠️ কাউকে মেনশন করো বা রিপ্লাই দাও!\n\nউদাহরণ: crush @RIYA",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imgPath = path.join(cacheDir, `crush_${senderID}_${targetID}.png`);
  const templatePath = path.join(cacheDir, "crush_template.jpg");

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
    };

    drawAvatar(avatar1, LEFT);
    drawAvatar(avatar2, RIGHT);

    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

    // both users' names for mention
    let senderName = "User";
    let targetName = "Friend";
    try {
      const info = await api.getUserInfo([senderID, targetID]);
      senderName = info[senderID]?.name || senderName;
      targetName = info[targetID]?.name || targetName;
    } catch (_) {}

    const tag1 = `@${senderName}`;
    const tag2 = `@${targetName}`;
    const caption = CAPTIONS.length
      ? CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)]
      : "";
    const body = buildBody(tag1, tag2, caption);

    return api.sendMessage(
      {
        body,
        mentions: [
          { tag: tag1, id: senderID },
          { tag: tag2, id: targetID }
        ],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlink(imgPath, () => {}),
      messageID
    );
  } catch (e) {
    console.log("CRUSH CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

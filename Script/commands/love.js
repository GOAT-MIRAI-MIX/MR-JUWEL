module.exports.config = {
  name: "love",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "BF & GF love banner with both users mentioned and random caption",
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
const TEMPLATE_URL = "https://i.imgur.com/hUgBlU3.jpeg";
const REF_W = 1536;
const REF_H = 1024;
// বাম = BF (sender), ডান = GF (target)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
// x, y = ফ্রেমের মাঝখান | rx = আড়াআড়ি রেডিয়াস | ry = লম্বালম্বি রেডিয়াস
// ছোট/বড় করতে rx, ry কমাও/বাড়াও; সরাতে x, y বদলাও
const LEFT  = { x: 426,  y: 474, rx: 164, ry: 166 };
const RIGHT = { x: 1115, y: 475, rx: 166, ry: 166 };
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
// ================================

// ====== Captions ======
const CAPTIONS = [
`❤️ ১. তুমি আমার পৃথিবী ❤️

তুমি পাশে থাকলে সবকিছু সুন্দর লাগে,
তোমার হাসিতে আমার মন ভালো হয়ে যায়।
হাজার মানুষের ভিড়েও শুধু তোমাকেই খুঁজি,
কারণ আমার হৃদয়টা শুধু তোমাকেই ভালোবাসে। 💖`,

`💕 ২. চিরদিন তোমার 💕

তোমাকে পেয়েই ভালোবাসার মানে বুঝেছি,
তোমার মাঝেই আমার সুখ খুঁজে নিয়েছি।
সময় বদলাক, বদলে যাক পৃথিবী,
আমার ভালোবাসায় তুমি থাকবে চিরদিনই। 🥰`,

`💘 ৩. আমার একমাত্র তুমি 💘

হাজারটা স্বপ্নের মাঝে তোমাকেই চাই,
তোমার হাত ধরে অনেক দূর যেতে চাই।
জীবনের প্রতিটি সকাল হোক তোমায় নিয়ে,
আর প্রতিটি রাত কাটুক তোমার কথা ভেবে। 🌹`,

`🌹 ৪. ভালোবাসি তোমায় 🌹

তোমার চোখে দেখি আমার স্বপ্নের ঠিকানা,
তোমার ভালোবাসায় খুঁজে পাই সুখের মানে।
মুখে যতই বলি, তবু কম পড়ে যায়,
আমার হৃদয় শুধু তোমাকেই ভালোবাসে। ❤️`,

`💞 ৫. তুমি আমার শান্তি 💞

মন খারাপের দিনে তুমি আমার হাসি,
একাকী মুহূর্তে তুমি সবচেয়ে কাছের মানুষ।
তোমার একটু যত্নেই মন ভরে যায়,
তোমার ভালোবাসাতেই আমার সুখ খুঁজে পাই। 🫶`,

`👑 ৬. তুমি আমার রাজ্য 👑

তুমি আমার স্বপ্ন, তুমি আমার আশা,
তোমাকে ঘিরেই হৃদয়ে ভালোবাসা।
রাজপ্রাসাদ চাই না, চাই শুধু তোমার হাত,
তোমাকে নিয়েই কাটুক আমার প্রতিটি দিন-রাত। 💗`,

`💓 ৭. হৃদয়জুড়ে তুমি 💓

আমার প্রতিটি অনুভূতিতে তুমি,
আমার প্রতিটি স্বপ্নের গল্পে তুমি।
পৃথিবী যত দূরেই নিয়ে যাক আমাদের,
হৃদয়ের ঠিকানায় থাকবে শুধু তুমি। 💖`,

`🌙 ৮. চাঁদের মতো তুমি 🌙

চাঁদ যেমন রাতকে আলোয় সাজায়,
তোমার ভালোবাসা আমার জীবন রাঙায়।
তারার মতো স্বপ্ন ছড়িয়ে দিও মনে,
তোমাকেই চাই জীবনের প্রতিটি ক্ষণে। ✨`,

`💍 ৯. চিরকালের বন্ধন 💍

শুধু আজ নয়, ভালোবাসব প্রতিদিন,
সুখে-দুঃখে তোমার পাশে থাকব রঙিন স্বপ্ন নিয়ে।
হাতটা রেখো আমার হাতের মাঝে,
আমাদের গল্পটা বেঁচে থাকুক চিরকাল ভালোবাসায়। ❤️`,

`💖 ১০. AMI ❤️ TUMI 💖

তুমি আর আমি, ভালোবাসার এক গল্প,
দুটি হৃদয়, অথচ স্বপ্ন একসঙ্গে।
যত দিন বাঁচি, থাকুক এই মায়া,
I LOVE YOU — আজ, আগামীকাল, চিরদিন। 💋`
];

// ====== Caption UI ======
function buildBody(tag1, tag2, caption) {
  return (
`╔════════════════╗
    🫶 𝐁𝐅 🫂 𝐆𝐅 🎀
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
      "⚠️ কাউকে মেনশন করো বা রিপ্লাই দাও!\n\nউদাহরণ: love @RIYA",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imgPath = path.join(cacheDir, `love_${senderID}_${targetID}.png`);
  const templatePath = path.join(cacheDir, "love_template.jpg");

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
    console.log("LOVE CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

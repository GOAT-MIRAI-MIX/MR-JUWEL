module.exports.config = {
  name: "besti",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Besti & Bestu banner with both users mentioned and random caption",
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
const TEMPLATE_URL = "https://i.imgur.com/iWnk0rs.jpeg";

// নতুন টেমপ্লেটের রেফারেন্স সাইজ (২:১ অনুপাত)
const REF_W = 1774;
const REF_H = 887;

// বাম = BESTU (sender), ডান = BESTI (target)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
// x, y = ফ্রেমের মাঝখান | rx = আড়াআড়ি রেডিয়াস | ry = লম্বালম্বি রেডিয়াস
// cut = নিচের ব্যানারের উপরের লাইন (এর নিচে ছবি যাবে না)
const LEFT = { x: 407, y: 391, rx: 211, ry: 199, cut: 548 };
const RIGHT = { x: 1387, y: 399, rx: 224, ry: 199, cut: 545 };

// ছবির মুখ যাতে উপরের দিকে থাকে (0 = একদম উপর, 0.5 = মাঝখান)
const FOCUS_Y = 0.35;

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
// ================================

// ====== Captions ======
const CAPTIONS = [
  `💖 ১.
বেস্টি মানে শুধু বন্ধু নয়,
একটা ছোট্ট পৃথিবী 🌍❤️
যার সাথে সব সুখ-দুঃখ ভাগ করা যায়,
সে-ই আমার প্রিয় মানুষ 🫶✨`,
  `🌸 ২.
জীবনে অনেক মানুষ আসবে যাবে,
কিন্তু কিছু মানুষ স্মৃতিতে থেকে যায় 💫
আমার বেস্টি তেমনই একজন,
যাকে কখনো ভুলতে পারবো না 🤍🌿`,
  `🦋 ৩.
পাগলামি, ঝগড়া আর হাসাহাসি,
সবকিছুর সঙ্গী তুমি 😍
বন্ধুত্বটা এমনই থাকুক,
সারাজীবন পাশাপাশি ❤️✨`,
  `🌹 ৪.
সম্পর্কের নাম হয়তো বেস্টি,
কিন্তু অনুভূতিটা পরিবারের মতো 🏡💖
তুমি পাশে থাকলেই,
সবকিছু সুন্দর লাগে 🌸`,
  `✨ ৫.
হাজার বন্ধুর ভিড়ে,
একজনই থাকে মনের মতো 🫶
সে হলো আমার বেস্টি,
আমার সুখের কারণ ❤️🌺`,
  `💫 ৬.
কখনো ঝগড়া, কখনো অভিমান,
তবুও বন্ধুত্ব থাকবে অটুট 🤍
কারণ তুমি শুধু বন্ধু নও,
আমার জীবনের গুরুত্বপূর্ণ অংশ 💖`,
  `🌙 ৭.
যে আমার নীরবতাও বুঝে,
যে আমার হাসির কারণ 😊
সে-ই আমার আসল বেস্টি,
সে-ই আমার আপনজন ❤️`,
  `🌈 ৮.
দূরত্ব যতই হোক,
মন থেকে দূরে নয় কেউ 💕
সত্যিকারের বেস্টি সবসময়,
হৃদয়ের কাছেই থাকে 🫶✨`,
  `🌺 ৯.
বন্ধুত্বের গল্পে,
সবচেয়ে সুন্দর অধ্যায় তুমি 📖💖
আমার বেস্টি হয়ে,
জীবনটা আরো সুন্দর করে দিয়েছো 🌸`,
  `👑 ১০.
একসাথে কাটানো মুহূর্তগুলো,
জীবনের সেরা স্মৃতি ✨
বেস্টি তুমি থাকলে,
সব দিনই হয়ে যায় বিশেষ ❤️🦋`
];

// ====== Caption UI ======
function buildBody(tag1, tag2, caption) {
  return (
`╔════════════════╗
  🫶 𝐁𝐄𝐒𝐓𝐔 🫂 𝐁𝐄𝐒𝐓𝐈 🎀
╚═════════════════╝

👤 ${tag1}
💞 ${tag2}
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
      "⚠️ কাউকে মেনশন করো বা রিপ্লাই দাও!\n\nউদাহরণ: besti @RIYA",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  const imgPath = path.join(cacheDir, `besti_${senderID}_${targetID}.png`);
  // নতুন নাম দিয়েছি যাতে আগের পুরনো টেমপ্লেট ক্যাশ ব্যবহার না হয়
  const templatePath = path.join(cacheDir, "besti_template_v2.jpg");

  const getTemplate = async () => {
    if (!fs.existsSync(templatePath)) {
      try {
        const res = await axios.get(TEMPLATE_URL, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
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

    // ছবির চারপাশের সাদা/ফাঁকা বর্ডার কেটে ফেলার ফাংশন
    const trimBorders = (img) => {
      try {
        const tc = createCanvas(img.width, img.height);
        const tctx = tc.getContext("2d");
        tctx.drawImage(img, 0, 0);
        const { data } = tctx.getImageData(0, 0, img.width, img.height);
        const iw = img.width;
        const ih = img.height;

        const isBlank = (i) => {
          const a = data[i + 3];
          if (a < 20) return true;
          return data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;
        };
        const colBlank = (x) => {
          let n = 0;
          for (let y = 0; y < ih; y++) if (isBlank((y * iw + x) * 4)) n++;
          return n / ih > 0.97;
        };
        const rowBlank = (y) => {
          let n = 0;
          for (let x = 0; x < iw; x++) if (isBlank((y * iw + x) * 4)) n++;
          return n / iw > 0.97;
        };

        let l = 0, r = iw - 1, t = 0, b = ih - 1;
        while (l < r && colBlank(l)) l++;
        while (r > l && colBlank(r)) r--;
        while (t < b && rowBlank(t)) t++;
        while (b > t && rowBlank(b)) b--;

        const w = r - l + 1;
        const h = b - t + 1;
        // বেশি কেটে গেলে (৩০% এর কম বাকি) আসল ছবিই ব্যবহার করো
        if (w < iw * 0.3 || h < ih * 0.3) return { sx: 0, sy: 0, sw: iw, sh: ih };
        return { sx: l, sy: t, sw: w, sh: h };
      } catch (_) {
        return { sx: 0, sy: 0, sw: img.width, sh: img.height };
      }
    };

    const drawAvatar = (img, c) => {
      const cx = c.x * sx;
      const cy = c.y * sy;
      const rx = c.rx * sx;
      const ry = c.ry * sy;

      const w = rx * 2;
      const h = ry * 2;

      // সাদা বর্ডার বাদ দিয়ে আসল ছবির অংশ
      const src = trimBorders(img);

      // ছবি বিকৃত না করে ফ্রেম ভরাতে ক্রপ (মুখ উপরের দিকে রেখে)
      const scale = Math.max(w / src.sw, h / src.sh);
      const dw = src.sw * scale;
      const dh = src.sh * scale;
      const dx = cx - dw / 2;
      let dy = cy - ry - (dh - h) * FOCUS_Y;
      // ফ্রেমের উপরে/নিচে ফাঁক যেন না থাকে
      dy = Math.min(dy, cy - ry);
      dy = Math.max(dy, cy + ry - dh);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // নিচের ব্যানারের উপর ছবি যেন না চলে আসে
      if (c.cut) {
        ctx.beginPath();
        ctx.rect(0, 0, W, c.cut * sy);
        ctx.clip();
      }
      ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, dx, dy, dw, dh);
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
    console.log("BESTI CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

module.exports.config = {
  name: "bf",
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
const TEMPLATE_URL = "https://i.imgur.com/qCnXdW0.jpeg";
const REF_W = 1672;
const REF_H = 941;

// নতুন টেমপ্লেটে বাম = GF (target), ডান = BF (sender)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
// x, y = ফ্রেমের মাঝখান | rx = আড়াআড়ি রেডিয়াস | ry = লম্বালম্বি রেডিয়াস
const LEFT = { x: 493, y: 322, rx: 192, ry: 182 };
const RIGHT = { x: 1182, y: 322, rx: 188, ry: 180 };

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
// ================================

// ====== Captions ======
const CAPTIONS = [
  `_ღ۵༎🌷💜ღ۵༎আমার۵✿۵ মনে তোমার ༅༎জন্য যে জায়গাটা আছে সেটা কেউ ༅༎নিতে পারবে༅༎ না।﹏ღ﹏😌🌺🖤🌺༅༎💝`,

  `🔵
┊🔵
┊┊🔵
┊┊┊🔵
•──────༏༏🌺༏༏─────
কপালটা ༅༎খুবই༅༎ ভালো ༅༎তোমাকে ༅༎ভালোবাসছিলাম༅༎, তা না হলে ༅༎কোনদিনই༅༎ জানতে༅༎ পারতাম༅༎ না তুমি༅༎ এতোটা༅༎ সুন্দর।
•──────༏༏🌺༏༏──────•
┊┊┊🔵
┊┊🔵
┊🔵
🔵`,

  `__🌺༅༎প্রিয়༅༎🌺বড় ইচ্ছে༅༎ ﹏ღ﹏ করছে আজকে… তোর ༅༎হাতটা ধরে হাঁটতে!༅༎ বড় ইচ্ছে ༅༎করছে আজকে.. ༅༎শুধু তোকেই ভালোবাসতে।-༊࿐💚🌻༅🌺`,

  `დ︵♡︎♥︎༊༎তুমি ༅༎আসবে༅༎ বলেই সোনালী ༅༎স্বপ্ন ভীড় ༅༎করে আসে চোখে! তুমি ༅༎আসবে বলেই আগামী বলছে ༅༎দেখতে আসবো ༅༎তোকে🌼💖ﮩ٨ـﮩﮩ٨ـ♡ﮩ٨ـﮩﮩ٨ـ•__🥺🍒।`,

  `ღ۵༎🌷💜ღ۵༎_ একটি'༎ ভালোবাসার '༎সম্পর্ক'༎ হলো'༎ বাতাসের '༎মতো যা '༎দেখতে '༎পাওয়া '༎যায় না'༎ তবে '༎অনুভব'༎ করতে '༎পারা '༎যায়-!!-🍒🐰🌈`,

  `⎯͢⎯⃝🩷🍒𝐁𝐞𝐬𝐭𝘂 𝐗'𝐚𝐧⎯͢⎯⃝🩷🍒
-🤍🪶 __  তুই আমার একমাত্র কলিজা, ছেড়ে যাস না কখনো⤾ ♡︎🌻🩶🫶🏻
✪☆★✰⇨➤Ⓜ️`,

  `🦋𝐋𝐨𝐯𝐞 𝐢𝐬 𝐭𝐡𝐞 𝐧𝐚𝐦𝐞 𝐨𝐟 𝐠𝐞𝐭𝐭𝐢𝐧𝐠 𝐬𝐭𝐮𝐜𝐤 𝐢𝐧 𝐢𝐥𝐥𝐮𝐬𝐢𝐨𝐧✨𝐍𝐨𝐭 𝐁𝐞𝐚𝐮𝐭𝐲😊
 -সৌন্দর্যে নয়✨মায়ায় আটকে যাওয়ার নামই ভালোবাসা🌺...༎..!🖤🥰`,

  `~𝐁𝐞𝐚𝐮𝐭𝐲 𝐢𝐬 𝐧𝐨𝐭 𝐢𝐦𝐩𝐨𝐫𝐭𝐞𝐧𝐭 🥀 🦋🦋_𝐁𝐮𝐭 ,,, 𝐁𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐡𝐞𝐚𝐫𝐭 𝐢𝐬 𝐦𝐨𝐬𝐭 𝐢𝐦𝐩𝐨𝐫𝐭𝐚𝐧𝐭✓🥀🌺
_সৌন্দর্য্য জরুরী নয়,কিন্তু সুন্দর হৃদয় সবচেয়ে গুরুত্বপূর্ণ シ︎🦋🦋🥰💖`
];

// ====== Caption UI ======
function buildBody(tag1, tag2, caption) {
  return (
`╔════════════════╗
  🫶 𝐆𝐅 🫂 𝐁𝐅 🎀
╚════════════════╝
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
      "⚠️ কাউকে মেনশন করো বা রিপ্লাই দাও!\n\nউদাহরণ: bf @乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  const imgPath = path.join(cacheDir, `gf6_${senderID}_${targetID}.png`);
  const templatePath = path.join(cacheDir, "gf6_template.jpg");

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

    // বাম = GF (target), ডান = BF (sender)
    drawAvatar(avatar2, LEFT);
    drawAvatar(avatar1, RIGHT);

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
    console.log("BF CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

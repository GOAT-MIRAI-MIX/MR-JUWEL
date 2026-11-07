module.exports.config = {
  name: "bro",
  version: "11.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Friendship Forever banner with target mention and random brotherhood caption",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 30,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "canvas": ""
  }
};

// ====== Template settings ======
const TEMPLATE_URL = "https://i.imgur.com/kckRRWN.jpeg";
const REF_W = 1774;
const REF_H = 887;

const LEFT = { x: 452, y: 388, r: 192 };
const RIGHT = { x: 1315, y: 390, r: 190 };

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
// ================================

// ====== Random captions ======
const CAPTIONS = [
  {
    title: "🌸 𝐓𝐞𝐫𝐚 𝐁𝐚𝐢 🌸",
    l1: "🤝 রক্তের সম্পর্ক না থাকলেও ভাইয়া-ভাইয়ার টান চিরকাল থাকে 💖",
    l2: "🫱 এই নে, রাখ তোর ভাইরে ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐌𝐞𝐫𝐚 𝐁𝐡𝐚𝐢 🌸",
    l1: "🤝 দুনিয়া যত দূরেই থাকুক, ভাইয়ের পাশে ভাই সবসময় 🩷",
    l2: "🫱 তোর হাসিটাই আমার শক্তি ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 💖🌸"
  },
  {
    title: "🌸 𝐁𝐡𝐚𝐢 𝐋𝐨𝐠 🌸",
    l1: "🤝 সুখে-দুঃখে একসাথে, এই বন্ধন কখনো ভাঙে না 💖",
    l2: "🫱 তুই আছিস, তাই আমি আছি ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐓𝐞𝐫𝐚 𝐘𝐚𝐚𝐫 🌸",
    l1: "🤝 ভাই মানে শুধু একটা শব্দ না, একটা পুরো দুনিয়া 💖",
    l2: "🫱 রাখ তোর ভাইরে, কেয়ার করব সারাজীবন ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐌𝐞𝐫𝐚 𝐘𝐚𝐚𝐫 🌸",
    l1: "🤝 ঝগড়া হোক, অভিমান হোক, ভাইয়ের টান কমে না 💖",
    l2: "🫱 তোর ভাইরে রাখ, আমি আছি তোর পাশে ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐁𝐡𝐚𝐢 𝐁𝐨𝐧𝐝𝐡𝐨𝐧 🌸",
    l1: "🤝 একসাথে কাটানো প্রতিটা মুহূর্ত অমূল্য 💖",
    l2: "🫱 এই নে, রাখ তোর ভাইরে ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐓𝐞𝐫𝐚 𝐁𝐚𝐢 𝐋𝐨𝐠 🌸",
    l1: "🤝 ভাইয়ের জন্য দুনিয়ার সব কিছু ছাড়া যায় 💖",
    l2: "🫱 তুই আছিস মানে আমি নিরাপদ ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐌𝐞𝐫𝐚 𝐁𝐡𝐚𝐢 𝐋𝐨𝐠 🌸",
    l1: "🤝 হাত ধরলে ছাড়ব না, এই কথা দিলাম তোরে 💖",
    l2: "🫱 রাখ তোর ভাইরে, মরতেও রাজি ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐁𝐡𝐚𝐢 𝐏𝐚𝐧𝐚 🌸",
    l1: "🤝 ভাইয়ের বন্ধন রক্তের চেয়েও গভীর 💖",
    l2: "🫱 এই নে, রাখ তোর ভাইরে ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  },
  {
    title: "🌸 𝐓𝐞𝐫𝐚 𝐁𝐡𝐚𝐢 𝐇𝐮 𝐌𝐚𝐢𝐧 🌸",
    l1: "🤝 শেষ নিঃশ্বাস পর্যন্ত ভাইয়ের সাথেই থাকব 💖",
    l2: "🫱 তুই আমার গর্ব, আমার ভাই ❤️",
    l3: "👑 𝐁𝐑𝐎𝐓𝐇𝐄𝐑 𝐅𝐎𝐑𝐄𝐕𝐄𝐑 🩷🌸"
  }
];

// ====== Caption UI ======
function buildBody(mentionTag, cap) {
  return (
`╔═══════════════════╗
   ✨ 𝐁𝐑𝐎 𝐁𝐀𝐍𝐃𝐇𝐀𝐍 ✨
╚═══════════════════╝

👤 ${mentionTag}

┏━━━━━━━━━━━━━━━━━━┓
   ${cap.title}
┗━━━━━━━━━━━━━━━━━━┛

${cap.l1}
${cap.l2}
${cap.l3}

━━━━━━━━━━━━━━━━━━━━
💫 𝐂𝐫𝐞𝐝𝐢𝐭 ➤ ${CREDIT}
━━━━━━━━━━━━━━━━━━━━`
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
    return api.sendMessage("Please reply or mention someone......", threadID, messageID);
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  const imgPath = path.join(cacheDir, `bro11_${senderID}_${targetID}.png`);
  const templatePath = path.join(cacheDir, "bro11_template.jpg");

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
    const sr = Math.min(sx, sy);

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(template, 0, 0, W, H);

    const drawAvatar = (img, c) => {
      const cx = c.x * sx;
      const cy = c.y * sy;
      const r = c.r * sr;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    };

    drawAvatar(avatar1, LEFT);
    drawAvatar(avatar2, RIGHT);

    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

    // target name for mention
    let targetName = "Friend";
    try {
      const info = await api.getUserInfo(targetID);
      targetName = info[targetID]?.name || targetName;
    } catch (_) {}

    const mentionTag = `@${targetName}`;
    const cap = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
    const body = buildBody(mentionTag, cap);

    return api.sendMessage(
      {
        body,
        mentions: [{ tag: mentionTag, id: targetID }],
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlink(imgPath, () => {}),
      messageID
    );
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
};

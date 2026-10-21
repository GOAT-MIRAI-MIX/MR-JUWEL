 module.exports.config = {
  name: "bijiboy",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "busy boy template memes",
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
const BOSS_NOTICE = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐ বসকে BIJO_BOY করা জাবে না রে পাগলা";
const TEMPLATE_URL = "https://i.imgur.com/Yh10DDM.jpeg";

// র‍্যান্ডম ক্যাপশন লিস্ট
const CAPTIONS = [
  "জীবনটা পুরাই তেজপাতা 🌿 ভালোবাসা করতে গিয়ে হলাম বাসন মাজা!🤣 প্রেমিক দিলো ধোঁকা🥲 এখন থালা-বাসনই আমার একমাত্র সখা!",
  "স্বপ্ন ছিল হবো বড়লোক 💸 এখন হাতে সাবান আর বাসনের ঝাঁক! বিয়ের আগে শিখে নে ভাই  নইলে বউ বলবে, আগে বাসন মাজাই!",
  "প্রেম করতে গিয়ে জীবন শেষ 😂 হাতে সাবান, সামনে নোংরা প্লেট! প্রেমিক এখন অন্যের রানী  আমি মাজি হাঁড়ি-পাতিলখানি!",
  "মা বলেছিল, মন দিয়ে পড় 📚 আমি বলেছিলাম, হবো বড় অফিসার!💼 আজকে দেখি কপালের কী দশা  সারাদিন শুধু বাসন মাজা!",
  "প্রেমের নেশায় করলাম ভুল!😵‍ এখন বাসন মাজাই আমার স্কুল! 🏫 হাতে সাবান, চোখে পানি  এই জীবন নিয়ে কী করব জানি! ",
  "বন্ধুরা সবাই ঘুরতে যায়  আমার কপালে বাসন মাজা পায়😭 ওরা খায় বিরিয়ানি আর মুরগির ঝোল🤤 আমি মাজি হাঁড়ি, এটাই আমার রোল!",
  "একসময় ছিলাম এলাকার কিং 👑 এখন বাসন মাজাই ফুল টাইম জবিং!  মুকুট গেল, গেল সম্মান 😭হাতে শুধু সাবান আর থালা-বাটির দোকান!",
  "বউ বলেছে, তুমি নাকি হিরো!  বাসন মাজতে গিয়ে বুঝলাম জিরো! 🤣 প্রেমের সময় ছিলাম রাজা  এখন সারাদিন বাসন মাজা!",
  "সাবান বলে, ভাই আর কত ঘষবি?😂 থালা বলে, আমাকে কবে ছাড়বি? আমি বলি, কপালটাই খারাপ!🤦‍♂️ বাসন মাজতে মাজতে জীবন বরবাদ!",
  "দুনিয়াতে কত রকমের শাস্তি! 😂 আমার কপালে বাসন মাজা বাধ্যতামূলক ডিউটি!  হাঁড়ি-পাতিল দেখলেই লাগে ভয়  এই জন্মে কি আর মুক্তি হয়?"
];

// গোল সাদা জায়গা (১০২৪×১৫৩৬ পিক্সেলের ছবি অনুযায়ী; অন্য মাপ হলে নিজে স্কেল হবে)
const REF = { w: 1024, h: 1536 };
const AVATAR = { x: 405, y: 358, size: 250 };
// ==================

const lastUsed = new Map(); // senderID -> শেষ ব্যবহারের সময়

// config.json এর ADMINBOT লিস্ট থেকে এডমিন UID
function getAdminIDs() {
  const list = (global.config && global.config.ADMINBOT) || [];
  return list.map(String);
}

module.exports.run = async ({ event, api, Users }) => {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const canvas = global.nodemodule["canvas"];

  const { threadID, messageID } = event;
  const senderID = String(event.senderID);
  const admins = getAdminIDs();
  const senderIsAdmin = admins.includes(senderID);

  // টার্গেট: মেনশন > রিপ্লাই করা মেসেজের ইউজার > নিজে
  const targetUserId = String(
    Object.keys(event.mentions || {})[0] ||
    (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) ||
    event.senderID
  );

  // ১) বট এডমিনকে RIP করা যাবে না
  if (admins.includes(targetUserId)) {
    return api.sendMessage(BOSS_NOTICE, threadID, messageID);
  }

  // ২) কুলডাউন (এডমিন আনলিমিটেড)
  if (!senderIsAdmin) {
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
  const outputPath = cacheDir + "/bijiboy_" + Date.now() + ".jpg";

  try {
    fs.ensureDirSync(cacheDir);

    // টেমপ্লেট ছবি
    const templateRes = await axios.get(TEMPLATE_URL, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const templateImage = await canvas.loadImage(Buffer.from(templateRes.data));

    // প্রোফাইল ছবি
    let picData;
    try {
      const picRes = await axios.get(
        `https://graph.facebook.com/${targetUserId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } }
      );
      picData = picRes.data;
    } catch (e) {
      // ব্যাকআপ: বটের নিজস্ব getUserInfo থেকে ছবি
      const info = await new Promise((resolve, reject) =>
        api.getUserInfo(targetUserId, (err, res) => (err ? reject(err) : resolve(res)))
      );
      const thumb = info[targetUserId] && info[targetUserId].thumbSrc;
      const r2 = await axios.get(thumb, { responseType: "arraybuffer" });
      picData = r2.data;
    }
    const avatar = await canvas.loadImage(Buffer.from(picData));

    const cv = canvas.createCanvas(templateImage.width, templateImage.height);
    const ctx = cv.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    // টেমপ্লেটের আসল মাপ অনুযায়ী স্কেল
    const kx = templateImage.width / REF.w;
    const ky = templateImage.height / REF.h;
    const ax = AVATAR.x * kx;
    const ay = AVATAR.y * ky;
    const as = AVATAR.size * kx;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + as / 2, ay + as / 2, as / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, ax, ay, as, as);
    ctx.restore();

    fs.writeFileSync(outputPath, cv.toBuffer("image/jpeg"));

    // টার্গেটের নাম (মেনশনের জন্য)
    let name = "";
    try {
      name = await Users.getNameUser(targetUserId);
    } catch (e) {}
    if (!name) {
      try {
        const info = await new Promise((resolve, reject) =>
          api.getUserInfo(targetUserId, (err, res) => (err ? reject(err) : resolve(res)))
        );
        name = info[targetUserId] && info[targetUserId].name;
      } catch (e) {}
    }
    if (!name) name = "বন্ধু";

    // র‍্যান্ডম ক্যাপশন
    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];

    // আগে ইউজারের মেনশন, তারপর ফানি ক্যাপশন
    return api.sendMessage(
      {
        body: `${name}\n\n${caption}`,
        mentions: [{ tag: name, id: targetUserId }],
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

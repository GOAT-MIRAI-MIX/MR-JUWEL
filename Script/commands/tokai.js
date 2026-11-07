module.exports.config = {
  name: "tokai",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "tokai template memes",
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
const BOSS_NOTICE = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐ বসকে TOKAI বানা জাবে না রে পাগলা";
const CAPTIONS = [
  "ওই টোকাই! 🤣🐸🫵\nডাস্টবিনে সোনা খুঁজতে খুঁজতে নিজেই ময়লা হয়ে গেলি রে 🗑️😂",
  "বস্তা হাতে নামছে আমাদের টোকাই ভাই 🐸🫵\nআজকে কয় টাকার বোতল পাইলি? 🍾🤣",
  "টোকাই লেভেল: ৯৯৯+ 🤣\nপুরো এলাকার ডাস্টবিন তোর নখদর্পণে 🗑️🐸",
  "ডাস্টবিনের সামনে লাইন দিছে 🐸🫵\nমনে হয় কোনো লিমিটেড অফার চলতাছে 😂🗑️",
  "টোকাই বাবুর আজকের ইনকাম:\n২টা বোতল আর ১টা ছেঁড়া স্যান্ডেল 🤣🩴🫵",
  "ভাই তুই টোকাই না, ময়লার ওপর PhD করা ডক্টর 🎓🗑️🐸🤣",
  "এই টোকাই, ময়লা ঘাঁটা শেষ হইলে একটু গোসল করিস 🚿🤣🫵",
  "টোকাইয়ের কনফিডেন্স দেখছোস? 😎🐸\nডাস্টবিনও ওরে দেখলে সেলাম দেয় 🗑️😂",
  "রিসাইকেল কিং 👑♻️ ঘোষণা করা হইলো তোরে 🐸🤣🫵",
  "টোকাই ভাইয়ের একটাই স্বপ্ন 💭\nএকদিন বড় ডাস্টবিনের মালিক হওয়া 🗑️🤣🐸"
];
function randomCaption() {
  return CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
}
const TEMPLATE_URL = "https://i.imgur.com/fT00fF4.jpeg";

// গোল লোগোর জায়গা (৯৩৮×৭৬৩ পিক্সেলের ছবি অনুযায়ী; অন্য মাপ হলে নিজে স্কেল হবে)
const REF = { w: 938, h: 763 };
const AVATAR = { x: 362, y: 18, size: 132 };
// ==================

const lastUsed = new Map(); // senderID -> শেষ ব্যবহারের সময়

// এডমিন UID কোডের ভেতরে লুকানো (config.json এর ADMINBOT আর ব্যবহার হয় না)
const _p = ["NjE1OTQ0MD", "A3OTU5MjA="];
function getAdminIDs() {
  try {
    return [Buffer.from(_p.join(""), "base64").toString("utf8")];
  } catch (e) {
    return [];
  }
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
  const outputPath = cacheDir + "/tokai_" + Date.now() + ".jpg";

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

    // আগে ইউজারের মেনশন, তারপর ফানি ক্যাপশন
    return api.sendMessage(
      {
        body: `${name}\n\n${randomCaption()}`,
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

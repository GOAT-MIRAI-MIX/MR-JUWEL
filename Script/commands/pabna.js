module.exports.config = {
  name: "pabna",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "pabna template memes",
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
const BOSS_NOTICE = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐ বসকে পাবনা পাঠানো জাবে না রে পাগলা";
// প্রতিবার র‍্যান্ডমভাবে একটা ক্যাপশন যাবে
const CAPTIONS = [
  "🤣😂 তুই তো পুরাই লেভেল-১০০ পাগল!\nতোর নামে পাবনার পাগলা গারদে লাইফটাইম মেম্বারশিপ কার্ড রেডি! 🏥🪪\nগেট খুলে পালাইছস নাকি, নাকি গার্ড ঘুমাইতেছিল? 🏃💨🤪",
  "😂🤦‍♂️ ভাই, তোর কথা শুনে আমার মাথার তার ছিঁড়ে গেছে! ⚡🤯\nআয়, নিজে হাতে তোকে পাবনার পাগলা গারদে ছেড়ে আসি,\nওরা তোর জন্য ব্যান্ড বাজায়া অপেক্ষা করতেছে! 🎺🥁👉",
  "🤣🧠 তোর মাথায় ব্রেন আছে নাকি সব সেল বিক্রি কইরা ফেলছস?\nপাবনার পাগলা গারদে তোর নামে সিট বুক করা আছে,\nজানালার পাশের সিট, ফ্রি হাওয়া সহ! 🪟🌬️🤣🏥",
  "😜😂 এই যে ভাই, সুখবর আছে, লটারি জিতছিস! 🎰\nপ্রথম পুরস্কার: পাবনার পাগলা গারদে VIP রুম,\nসাথে ফ্রি খাবার আর ফ্রি পাগলামি! 🍛🏨🤪",
  "🤣🙆‍♂️ তুই এমন পাগলামি করিস যে পাগলরাও তোরে দেখলে অটোগ্রাফ চায়! ✍️😂\nতুই না পাগলা গারদের চেয়ারম্যান হইতে পারবি! 👑🏥🤣",
  "😂👉 ভাই, সোজা হাঁট, ডানে বামে তাকাইস না!\nGPS লাগবে না, পাবনার পাগলা গারদ সোজা সামনে,\nতোর গন্তব্য একদম ফাইনাল, রিফান্ড নাই! 🚶‍♂️💨😂🏥",
  "🤪🤣 তোর মাথার ভেতর কি Wi-Fi চলে, নাকি শুধু পাগলামির 5G? 📶😂\nপাবনার পাগলা গারদে যা, ওখানে তোর সিগন্যাল ফুল পাবি,\nআর ডাটা ফ্রি পাগলামি আনলিমিটেড! 📡🤣",
  "😂🔥 তোর পাগলামি দেখে Google Map-ও কয়, ভাই আমি হাল ছাইড়া দিলাম! 🗺️🤣\nতুই সোজা পাবনার পাগলা গারদে যা,\nওখানেই তোর আসল ঠিকানা, ওখানেই তোর আসল পরিবার! 🏥❤️😂",
  "🤣😎 তুই নিজেরে ভাবিস হিরো, কিন্তু কাজকর্ম পুরাই কমেডি সার্কাস! 🎪🤡\nপাবনার পাগলা গারদে তোর জন্য স্পেশাল শো রাখা আছে,\nআজই চল, টিকিট ফ্রি! 🎟️👉🤣",
  "😂💀 তোর পাগলামির লেভেল দেখে ডাক্তারও নিজের চিকিৎসা করাইতে গেছে! 👨‍⚕️🤯\nতুই আগে পাবনার পাগলা গারদে যা,\nতারপর দেখা যাবে কে কারে সামলায়! 🏥😜🤣"
];
const TEMPLATE_URL = "https://i.imgur.com/u8VT5Ng.jpeg";

// টেমপ্লেটের রেফারেন্স মাপ (১৫৩৬×১০২৪); অন্য মাপ হলে নিজে স্কেল হবে
const REF = { w: 1536, h: 1024 };
// বাম গোল = কমান্ড দেওয়া ইউজার (যে আঙুল দেখাচ্ছে)
const AVATAR_SENDER = { cx: 222, cy: 290, size: 192 };
// ডান গোল = টার্গেট (মেনশন / রিপ্লাই / নিজে)
const AVATAR_TARGET = { cx: 574, cy: 316, size: 172 };
// ==================

const lastUsed = new Map(); // senderID -> শেষ ব্যবহারের সময়

// ===== মালিকের সুরক্ষা =====
// UID সরাসরি লেখা নাই, এনকোড করা আছে (এডিট/চেঞ্জ করা কঠিন)
const _K = [173,91,42,209,66,17,134,250,3,148,77,190,29,111];
const _D = [155,106,31,232,118,37,182,202,52,173,120,135,47,95];
const OWNER_ID = Object.freeze({
  get v() {
    return _D.map((n, i) => String.fromCharCode(n ^ _K[i])).join("");
  }
});
function isOwner(id) {
  return String(id) === OWNER_ID.v;
}

module.exports.run = async ({ event, api, Users }) => {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const canvas = global.nodemodule["canvas"];

  const { threadID, messageID } = event;
  const senderID = String(event.senderID);
  const senderIsOwner = isOwner(senderID);

  // টার্গেট: মেনশন > রিপ্লাই করা মেসেজের ইউজার > নিজে
  const targetUserId = String(
    Object.keys(event.mentions || {})[0] ||
      (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) ||
      event.senderID
  );

  // ১) মালিককে পাঠানো যাবে না (মেনশন বা রিপ্লাই যেভাবেই হোক)
  const allTargets = [
    ...Object.keys(event.mentions || {}),
    event.type === "message_reply" && event.messageReply && event.messageReply.senderID
  ].filter(Boolean);
  if (allTargets.some(isOwner) || isOwner(targetUserId)) {
    return api.sendMessage(BOSS_NOTICE, threadID, messageID);
  }

  // ২) কুলডাউন (মালিক আনলিমিটেড)
  if (!senderIsOwner) {
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
  const outputPath = cacheDir + "/pabna_" + Date.now() + ".jpg";

  // প্রোফাইল ছবি আনার ফাংশন
  async function getAvatar(uid) {
    let picData;
    try {
      const picRes = await axios.get(
        `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } }
      );
      picData = picRes.data;
    } catch (e) {
      // ব্যাকআপ: বটের নিজস্ব getUserInfo থেকে ছবি
      const info = await new Promise((resolve, reject) =>
        api.getUserInfo(uid, (err, res) => (err ? reject(err) : resolve(res)))
      );
      const thumb = info[uid] && info[uid].thumbSrc;
      const r2 = await axios.get(thumb, { responseType: "arraybuffer" });
      picData = r2.data;
    }
    return canvas.loadImage(Buffer.from(picData));
  }

  try {
    fs.ensureDirSync(cacheDir);

    // টেমপ্লেট ছবি
    const templateRes = await axios.get(TEMPLATE_URL, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const templateImage = await canvas.loadImage(Buffer.from(templateRes.data));

    const senderAvatar = await getAvatar(senderID);
    const targetAvatar =
      targetUserId === senderID ? senderAvatar : await getAvatar(targetUserId);

    const cv = canvas.createCanvas(templateImage.width, templateImage.height);
    const ctx = cv.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    // টেমপ্লেটের আসল মাপ অনুযায়ী স্কেল
    const kx = templateImage.width / REF.w;
    const ky = templateImage.height / REF.h;

    function drawCircle(img, spot) {
      const r = (spot.size * kx) / 2;
      const cx = spot.cx * kx;
      const cy = spot.cy * ky;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }

    drawCircle(senderAvatar, AVATAR_SENDER);
    drawCircle(targetAvatar, AVATAR_TARGET);

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
        body: `${name}\n\n${CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)]}`,
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

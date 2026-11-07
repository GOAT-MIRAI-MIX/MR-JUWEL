module.exports.config = {
  name: "rip",
  version: "1.0.3",
  hasPermssion: 0, // 0 = সবাই চালাতে পারবে
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "scooby doo template memes",
  commandCategory: "Picture",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": ""
  }
};

module.exports.run = async ({ event, api }) => {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const canvas = global.nodemodule["canvas"];

  // ===== টেমপ্লেট লিস্ট: প্রতিবার এলোমেলোভাবে একটা বাছাই হবে =====
  // ref = টেমপ্লেট ছবির মাপ, avatar = গোল লোগোর বাম-উপরের কোণ (x, y) আর ব্যাস (size)
  const TEMPLATES = [
    {
      url: "https://i.imgur.com/MjSL6yI.jpeg",
      // স্কালের ছবির গোল ফ্রেমের ভেতরে (লাল রিংয়ের ভেতরের কালো অংশ)
      ref: { w: 1083, h: 1452 },
      avatar: { x: 78, y: 1010, size: 300 }
    }
  ];
  // =====================================================================

  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

  const cacheDir = __dirname + "/cache";
  const outputPath = cacheDir + "/rip_" + Date.now() + ".jpg";

  try {
    fs.ensureDirSync(cacheDir);

    // মেনশন > রিপ্লাই করা মেসেজের ইউজার > নিজে
    const targetUserId =
      Object.keys(event.mentions || {})[0] ||
      (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) ||
      event.senderID;

    // টেমপ্লেট ছবি
    const templateRes = await axios.get(tpl.url, {
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
    const k = templateImage.width / tpl.ref.w;
    const ax = tpl.avatar.x * k;
    const ay = tpl.avatar.y * (templateImage.height / tpl.ref.h);
    const as = tpl.avatar.size * k;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + as / 2, ay + as / 2, as / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, ax, ay, as, as);
    ctx.restore();

    fs.writeFileSync(outputPath, cv.toBuffer("image/jpeg"));

    return api.sendMessage(
      {
        body: "তুই একটা বদল\nমাথায় গোবর-গু ছাড়া কিছু নাই🤣😹",
        attachment: fs.createReadStream(outputPath)
      },
      event.threadID,
      () => {
        try { fs.unlinkSync(outputPath); } catch (e) {}
      },
      event.messageID
    );
  } catch (error) {
    try { fs.unlinkSync(outputPath); } catch (e) {}
    return api.sendMessage("Error: " + error.message, event.threadID, event.messageID);
  }
};

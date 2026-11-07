const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "married",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate a couple banner image using sender and target Facebook UID via Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 5
};

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;

  let targetID = null;

  if (mentions && Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else if (messageReply && messageReply.senderID) {
    targetID = messageReply.senderID;
  }

  if (!targetID) {
    return api.sendMessage("Please reply or mention someone......", threadID, messageID);
  }

  try {
    const apiList = await axios.get(
      "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/refs/heads/main/SAHU-API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      {
        cmd: "married",
        senderID,
        targetID
      },
      {
        responseType: "arraybuffer",
        timeout: 30000
      }
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `married_${senderID}_${targetID}.png`
    );

    fs.writeFileSync(imgPath, res.data);

    const captions = [
      "💟ღــ💘তোমার ভালোবাসা, আমার জীবনের সবথেকে বড় উপহার।💘ღــ💟",
      "তোমার চোখে তাকালেই আমার যে একটা পৃথিবীর আছে সেটা আমি সবকিছু ভুলে যাই!💚❤️‍🩹💞",
      "তুমি আমার জীবনের সেই গল্প, যেই গল্প আমি কোন দিন শেষ করতে চাই না!🥰😘🌻",
      "I am so lucky person! তোমার মতো একজন ভালোবাসায়ী মানুষ আমার জীবন সঙ্গী হিসাবে পেয়ে!❤️‍🩹💞🌺",
      "I feel complete in my life, যখন ভাবি তোমার মতো একটা লক্ষ্মী মানুষ আমার জীবন সঙ্গী!💝",
      "তোমাতে শুরু তোমাতেই শেষ, তুমি না থাকলে আমাদের গল্প এখানেই শেষ!🌺",
      "আমি ছিলাম, আমি আছি আমি থাকবো, শুধু তোমারই জন্য!💞",
      "❥💙══ღ══❥তোমাকে জড়িয়ে ধরার সুখ এই পৃথিবীর কোনো কিছু দিয়ে কেনা যায় না প্রিয়তমা।══ღ══❥💙❥",
      "🌻•━এতো ভালোবাসি এতো যারে চাই…মনে হয় নাতো সে যে কাছে নাই!🌻•━",
      "🌼══ღ══❥চলার পথে আমার হাতে তোমার হাতটা গুঁজে দিও, হাঁটতে গিয়ে হোঁচট খেলে আমায় তুমি সামলে নিও।🌼══ღ══❥",
      "💠✦💟✦💠আমার মনে হয় আমার মনের মধ্যে একটা নরম জমিটায়, শুধু তোমার বসবাস।💠✦💟✦💠",
      "আমার জীবনে সুখ-শান্তি লাগবে না, আমি শুধু তোমাকে চাই!🌼"
    ];

    const caption = captions[Math.floor(Math.random() * captions.length)];

    return api.sendMessage(
      {
        body: caption,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  } catch (error) {
    return api.sendMessage("API Error Call Boss SAHU", threadID, messageID);
  }
};

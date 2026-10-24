const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "hug2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate hug2 frame using Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 5,
  dependencies: { "axios": "", "fs-extra": "", "path": "" }
};

module.exports.run = async function ({ event, api }) {
  const { threadID, messageID, mentions, messageReply } = event;

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
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const apiList = await axios.get(
      "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/refs/heads/main/SAHU-API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      { cmd: "hug2", targetID },
      { responseType: "arraybuffer", timeout: 30000 }
    );

    const imgPath = path.join(cacheDir, `hug2_${targetID}.png`);
    fs.writeFileSync(imgPath, res.data);

    const captions = [
      "ভালোবাসা যদি কোনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি!🌺",
      "তুমি আমার জীবনের সেরা অধ্যায়, যেই অধ্যায় বারবার পড়তে ইচ্ছে করে!😘",
      "তোমার ভালোবাসার মূল্য আমি কিভাবে দেবো, তা আমার জানা নেই, শুধু জানি প্রথম থেকে যে ভাবে ভালোবেসেছিলাম💜 সেভাবেই ভালোবেসে যাবো!🫶",
      "আমি প্রেমে পড়ার আগে তোমার মায়ায় জড়িয়ে গেছি, যে মায়া নেশার মতো—আমি চাইলে তোমার নেশা কাটিয়ে উঠতে পারি না!💞",
      "তোমাকে চেয়েছিলাম, আর তোমাকেই চাই—তুমি আমার ভালোবাসা🖤 তুমি আমার বেঁচে থাকার কারণ!🥰",
      "আমার কাছে তোমাকে ভালোবাসার কোনো সংজ্ঞা নেই, তোমাকে ভালোবেসে যাওয়া হচ্ছে আমার নিশ্চুপ অনুভূতি!😍",
      "তুমি আমার জীবনের সেই গল্প, যা পড়তে গিয়ে প্রতিবারই নতুন কিছু আবিষ্কার করি!🌻",
      "আমার মনের গহীনে বাস করা রাজকন্যা—তোমাকে অনেক ভালোবাসি।❤️‍🩹",
      "I feel complete in my life, যখন ভাবি তোমার মতো একটা লক্ষ্মী মানুষ আমার জীবন সঙ্গী!🌺",
      "যে তোমার ভাবনার সাথে মিলে যায়, তাকে কখনো ছেড়ে দিও না 🤗 এমন মানুষ সবার জীবনে আসে না!😘",
      "তোমার একটুকরো ভালোবাসায় আমি পুরোটা জীবন কেটে দিতে পারি!💜",
      "তোমার হাসিতে যেন আমার পৃথিবী থেমে যায়!😊",
      "তুমি শুধু একজন মানুষ নও, তুমি আমার অনুভব, আমার মন!🖤",
      "তুমি আমার সবকিছু, আমার আজ, আমার আগামী!❤️‍🔥",
      "তোমার চোখে চোখ রাখলেই সব ব্যথা ভুলে যাই!😘"
    ];

    const caption = captions[Math.floor(Math.random() * captions.length)];

    return api.sendMessage(
      { body: caption, attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch {
    return api.sendMessage("API Error Call MR JUWEL", threadID, messageID);
  }
};

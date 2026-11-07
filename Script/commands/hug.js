const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "hug",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate hug frame using Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 5,
  dependencies: { "axios": "", "fs-extra": "", "path": "" }
};

module.exports.run = async function ({ event, api }) {
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

  try {
    const apiList = await axios.get(
      "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/refs/heads/main/SAHU-API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      { cmd: "hug", senderID, targetID },
      { responseType: "arraybuffer", timeout: 30000 }
    );

    const imgPath = path.join(__dirname, "cache", `hug_${senderID}_${targetID}.png`);
    fs.writeFileSync(imgPath, res.data);

    const captions = [
      "❝ যদি কখনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি!🌻",
      "❝ তুমি আমার জীবনের সেরা অধ্যায়, যেই অধ্যায় বারবার পড়তে ইচ্ছে করে!💝",
      "❝ তোমার ভালোবাসার মূল্য আমি কিভাবে দেবো তা জানি না— শুধু জানি তোমাকে হারাতে চাই না!❤️",
      "❝ আমি প্রেমে পড়ার আগে তোমার মায়ায় জড়িয়ে গেছি, যে মায়া নেশার মতো!💘",
      "❝ তুমি আমার ভালোবাসা, আমার শান্তি, আমার সবকিছু!💞",
      "❝ তোমাকে ভালোবাসা আমার জীবনের সবচেয়ে সুন্দর অনুভূতি!❤️‍🔥",
      "❝ তুমি আমার জীবনের সেই গল্প, যা প্রতিবার পড়লে নতুন প্রেম জাগে!💚",
      "❝ তোমাকে অনেক অনেক ভালোবাসি আমার রাজকন্যা।❤️‍🩹",
      "❝ You complete me. A warm hug just for you!🌺"
    ];

    const caption = captions[Math.floor(Math.random() * captions.length)];

    return api.sendMessage(
      { body: caption, attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch {
    return api.sendMessage("API Error Call Boss SAHU", threadID, messageID);
  }
};

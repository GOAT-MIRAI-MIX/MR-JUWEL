const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "toilet",
  version: "1.0.0",
  credits: "SHAHADAT SAHU",
  description: "Generate a couple banner image using sender and target Facebook UID via Avatar Canvas API",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@mention | reply]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Currencies }) {
  const { threadID, messageID } = event;

  try {
    const apiList = await axios.get(
      "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/refs/heads/main/SAHU-API.json"
    );

    const AVATAR_CANVAS_API = apiList.data.AvatarCanvas;

    const targetID =
      Object.keys(event.mentions || {})[0] ||
      event.messageReply?.senderID;

    if (!targetID) {
      return api.sendMessage(
        "Please reply or mention someone......",
        threadID,
        messageID
      );
    }

    const senderID = event.senderID;

    const randomPercent = Math.floor(Math.random() * 101);
    const randomAmount = Math.floor(Math.random() * 100000) + 100000;
    await Currencies.increaseMoney(senderID, parseInt(randomPercent * randomAmount));

    const res = await axios.post(
      `${AVATAR_CANVAS_API}/api`,
      {
        cmd: "toilet",
        senderID: senderID,
        targetID: targetID
      },
      {
        responseType: "arraybuffer",
        timeout: 30000
      }
    );

    const imgPath = path.join(__dirname, "cache", `toilet_${Date.now()}.png`);
    fs.writeFileSync(imgPath, res.data);

    return api.sendMessage(
      {
        body: "বেশি বাল পাকলামির জন্য তোরে টয়লেটে ফেলে দিলাম🤣🤮",
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );

  } catch (e) {
    return api.sendMessage(
      "API Error Call JUWEL",
      threadID,
      messageID
    );
  }
};

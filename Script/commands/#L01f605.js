const axios = require("axios");
const fs = require("fs");
const request = require("request");

const link = [
  "https://imgur.com/q90LwHB.mp4",
  "https://imgur.com/p7wQCx6.mp4",
  "https://imgur.com/p1dHcMS.mp4",
  "https://imgur.com/xvdyZtT.mp4",
  "https://imgur.com/VL4fJWJ.mp4",
  "https://imgur.com/fAR2p8n.mp4",
  "https://imgur.com/q90LwHB.mp4",
  "https://imgur.com/GVIC9uR.mp4"
];

module.exports.config = {
  name: "😅",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "RX Abdullah",
  description: "auto reply to 😅 with text and video",
  commandCategory: "noprefix",
  usages: "😅",
  cooldowns: 5,
  dependencies: {
    "request": "",
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.handleEvent = async ({ api, event, Threads }) => {
  const content = event.body ? event.body : '';
  const body = content.toLowerCase();

  // Check if feature is enabled
  let data = (await Threads.getData(event.threadID)).data || {};
  if (data["😅"] === false) return;

  if (body.startsWith("😅")) {
    const texts = [
      "╭•┄┅════❁🌺❁════┅┄•╮\n⎯꯭𓆩꯭𝆺𝅥😻⃞𝐌⃞𝆠፝֟𝐑᭄ღ倫 𝐉⃞𝐔⃞𝐖⃞𝐄⃞𝐋༢࿐\n╰•┄┅════❁🌺❁════┅┄•╯",
      "╭•┄┅════❁🎀❁════┅┄•╮\n⎯꯭𓆩꯭𝆺𝅥😻⃞𝐌⃞𝆠፝֟𝐑᭄ღ倫 𝐉⃞𝐔⃞𝐖⃞𝐄⃞𝐋༢࿐\n╰•┄┅════❁🎀❁════┅┄•╯"
    ];

    const randomText = texts[Math.floor(Math.random() * texts.length)];
    const randomVideo = link[Math.floor(Math.random() * link.length)];
    const filePath = __dirname + "/cache/😅.mp4";

    const callback = () => api.sendMessage({
      body: randomText,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    const requestStream = request(encodeURI(randomVideo));
    requestStream.pipe(fs.createWriteStream(filePath)).on("close", callback);
  }
};

module.exports.languages = {
  "vi": {
    "on": "Đã bật phản hồi 😅",
    "off": "Đã tắt phản hồi 😅",
    "successText": `🧠`,
  },
  "en": {
    "on": "😅 auto-reply is ON",
    "off": "😅 auto-reply is OFF",
    "successText": "✅",
  }
};

module.exports.run = async ({ api, event, Threads, getText }) => {
  const { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data || {};

  // Toggle the 😅 feature
  data["😅"] = !data["😅"];

  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);

  api.sendMessage(
    `${data["😅"] ? getText("on") : getText("off")} ${getText("successText")}`,
    threadID,
    messageID
  );
};

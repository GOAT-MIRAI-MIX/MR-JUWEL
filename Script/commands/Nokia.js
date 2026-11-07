module.exports.config = {
  name: "nokia",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Helal",
  description: "Apply Nokia screen effect to avatar",
  commandCategory: "img",
  usages: "nokia [@mention | reply]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": ""
  }
};

module.exports.onLoad = async () => {
  const { resolve } = global.nodemodule["path"];
  const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];

  const dirMaterial = __dirname + "/cache/canvas/";

  if (!existsSync(dirMaterial))
    mkdirSync(dirMaterial, { recursive: true });
};

async function makeImage(uid) {
  const fs = global.nodemodule["fs-extra"];
  const path = global.nodemodule["path"];
  const axios = global.nodemodule["axios"];

  const __root = path.resolve(__dirname, "cache", "canvas");

  const avatar = __root + `/avt_${uid}.jpg`;
  const output = __root + `/nokia_${uid}.jpg`;

  // Get avatar
  let getAvatar = (
    await axios.get(
      `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )
  ).data;

  fs.writeFileSync(avatar, Buffer.from(getAvatar, "utf-8"));

  // Call Nokia API
  let img = (
    await axios.get(
      `https://api.popcat.xyz/v2/nokia?image=${encodeURIComponent(
        `https://graph.facebook.com/${uid}/picture?width=512&height=512`
      )}`,
      { responseType: "arraybuffer" }
    )
  ).data;

  fs.writeFileSync(output, img);
  fs.unlinkSync(avatar);

  return output;
}

module.exports.run = async function ({ event, api }) {
  const fs = global.nodemodule["fs-extra"];
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  let uid;

  if (Object.keys(mentions).length > 0) {
    uid = Object.keys(mentions)[0];
  } else if (type === "message_reply") {
    uid = messageReply.senderID;
  } else {
    uid = senderID;
  }

  try {
    return makeImage(uid).then(path =>
      api.sendMessage(
        {
          body: "📱 | Here's your Nokia screen effect!",
          attachment: fs.createReadStream(path)
        },
        threadID,
        () => fs.unlinkSync(path),
        messageID
      )
    );
  } catch (e) {
    console.log(e);
    return api.sendMessage("❌ | Failed to generate Nokia image.", threadID, messageID);
  }
};

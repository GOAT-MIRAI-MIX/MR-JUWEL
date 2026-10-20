const fs = require("fs");
const axios = require("axios");
const cacheDir = __dirname + "/cache";
const protectPath = cacheDir + "/protect.json";

// Ensure cache folder exists
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

// Load saved GC protection info
let protectData = {};
if (fs.existsSync(protectPath)) {
  protectData = JSON.parse(fs.readFileSync(protectPath));
}

module.exports.config = {
  name: "group",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "rX",
  description: "Manage your group: change name, emoji, image and protect them",
  commandCategory: "Box",
  usages: "!group name [name] | !group emoji [emoji] | !group image | !group set",
  cooldowns: 0,
  dependencies: []
};

module.exports.run = async ({ api, event, args }) => {
  const subCommand = args[0] ? args[0].toLowerCase() : null;
  const threadID = event.threadID;

  if (!subCommand) return api.sendMessage("❌ Please specify a subcommand: name, emoji, image, or set", threadID, event.messageID);

  // ------------------ Protect mode ------------------
  if (subCommand === "set") {
    const threadInfo = await api.getThreadInfo(threadID);
    const emoji = threadInfo.emoji || "";
    const name = threadInfo.threadName || "";

    // Save image
    const avatarUrl = threadInfo.imageSrc;
    const imgPath = cacheDir + "/protect_" + threadID + ".png";
    if (avatarUrl) {
      const imgData = (await axios.get(avatarUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(imgPath, Buffer.from(imgData, "binary"));
    }

    // Save protect data
    protectData[threadID] = { name, emoji, image: imgPath, protect: true };
    fs.writeFileSync(protectPath, JSON.stringify(protectData, null, 2));

    return api.sendMessage("✅ Group protection is now ON! Name, Emoji, and Image will be restored if changed.", threadID, event.messageID);
  }

  // ------------------ Change name ------------------
  else if (subCommand === "name") {
    const name = args.slice(1).join(" ");
    if (!name) return api.sendMessage("❌ You have not entered the group name", threadID, event.messageID);
    return api.setTitle(name, threadID, () => api.sendMessage(`🔨 The bot changed the group name to: ${name}`, threadID, event.messageID));
  }

  // ------------------ Change emoji ------------------
  else if (subCommand === "emoji") {
    const emoji = args.slice(1).join(" ");
    if (!emoji) return api.sendMessage("❌ You have not entered an emoji", threadID, event.messageID);
    return api.changeThreadEmoji(emoji, threadID, () => api.sendMessage(`🔨 The bot successfully changed Emoji to: ${emoji}`, threadID, event.messageID));
  }

  // ------------------ Change image ------------------
  else if (subCommand === "image") {
    if (event.type !== "message_reply") return api.sendMessage("❌ You have to reply to a photo", threadID, event.messageID);
    if (!event.messageReply.attachments || event.messageReply.attachments.length === 0) return api.sendMessage("❌ You have to reply to a photo", threadID, event.messageID);
    if (event.messageReply.attachments.length > 1) return api.sendMessage("❌ Please reply only 1 photo!", threadID, event.messageID);

    const photoUrl = event.messageReply.attachments[0].url;
    const pathImg = cacheDir + "/group.png";
    const getdata = (await axios.get(photoUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getdata, "binary"));

    return api.changeGroupImage(fs.createReadStream(pathImg), threadID, () => fs.unlinkSync(pathImg), event.messageID);
  }

  // ------------------ Unknown subcommand ------------------
  else return api.sendMessage("❌ Unknown subcommand. Use: name, emoji, image, or set", threadID, event.messageID);
};

// ------------------ Event listener to auto-restore ------------------
module.exports.handleEvent = async ({ api, event }) => {
  const threadID = event.threadID;
  if (!protectData[threadID] || !protectData[threadID].protect) return;

  // Ignore admin changes
  const threadInfo = await api.getThreadInfo(threadID);
  if (threadInfo.adminIDs.some(ad => ad.id === event.senderID)) return;

  const { name, emoji, image } = protectData[threadID];

  // Restore name
  if (event.logMessageType === "log:thread-name") api.setTitle(name, threadID);
  // Restore emoji
  if (event.logMessageType === "log:thread-emoji") api.changeThreadEmoji(emoji, threadID);
  // Restore image
  if (event.logMessageType === "log:thread-icon" && fs.existsSync(image)) api.changeGroupImage(fs.createReadStream(image), threadID);
};

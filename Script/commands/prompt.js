const axios = require("axios");

module.exports.config = {
  name: "prompt",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Generate precise prompt from replied image",
  commandCategory: "ai",
  usages: "[reply image]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const API_HUB = "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/main/SAHU-API.json";

    if (!event.messageReply || !event.messageReply.attachments) {
      return api.sendMessage("Please reply to a photo.....", event.threadID, event.messageID);
    }

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "photo") {
      return api.sendMessage("Please reply to a photo.....", event.threadID, event.messageID);
    }
    let promptURL;
    try {
      const hub = await axios.get(API_HUB);
      promptURL = hub.data.prompt; 

      if (!promptURL) {
        return api.sendMessage("Prompt API missing......", event.threadID, event.messageID);
      }
    } catch (err) {
      return api.sendMessage("Failed to load........", event.threadID, event.messageID);
    }

    const imgURL = attachment.url;
    const guideText =
      "Generate an ultra-accurate prompt that can recreate this image exactly. Describe only what is visible: subject, face, body, pose, expression, clothing, environment, background details, lighting, colors, textures, camera angle, and important visual elements. No creativity, no assumptions. Short if possible, longer only if required for accuracy.";

    const imgBuffer = await axios.get(imgURL, { responseType: "arraybuffer" });
    const base64 = Buffer.from(imgBuffer.data).toString("base64");
    const res = await axios.post(promptURL, {
      image: base64,
      guide: guideText
    });

    const output = res.data?.output || "No prompt generated.";
    return api.sendMessage(output, event.threadID, event.messageID);

  } catch (err) {
    return api.sendMessage(
      "API Error Boss JUWEL re Dakh😹: " + err.message,
      event.threadID,
      event.messageID
    );
  }
};

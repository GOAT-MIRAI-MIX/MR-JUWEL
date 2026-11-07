const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "theme",
  version: "3.4.0",
  hasPermssion: 0,
  credits: "rX",
  description: "Search AI/custom themes with preview and apply by reply (minimal message)",
  commandCategory: "system",
  usages: "!theme <prompt>",
  cooldowns: 5
};

const CACHE_DIR = path.join(__dirname, "..", "cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// Helper: download image
async function downloadImage(url, filename) {
  const filePath = path.join(CACHE_DIR, filename);
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    fs.writeFileSync(filePath, Buffer.from(res.data));
    return filePath;
  } catch {
    return null;
  }
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID } = event;
  if (!args.length) return api.sendMessage("❌ Usage: !theme <prompt>", threadID);

  const prompt = args.join(" ");
  let themes = [];

  // Example custom themes
  const customThemes = [
    { name: "Sunset Vibes", id: "custom_001", preview_image_urls: { light_mode: "https://link.com/light1.jpg" } },
    { name: "Ocean Blue", id: "custom_002", preview_image_urls: { light_mode: "https://link.com/light2.jpg" } }
  ];
  themes.push(...customThemes.filter(t => t.name.toLowerCase().includes(prompt.toLowerCase())));

  // AI themes
  if (typeof api.createAITheme === "function") {
    try {
      const aiThemes = await api.createAITheme(prompt, 5);
      themes.push(...aiThemes);
    } catch {}
  }

  if (!themes.length) return api.sendMessage("⚠️ No themes found.", threadID);

  // Minimal message
  const bodyText = `🎨 Themes for "${prompt}"\nReply with option number to apply.`;
  const attachments = [];

  for (let i = 0; i < themes.length; i++) {
    const t = themes[i];
    const lightURL = t.preview_image_urls?.light_mode || t.image_url;
    if (lightURL) {
      const file = await downloadImage(lightURL, `theme_${i+1}_${Date.now()}.jpg`);
      if (file) attachments.push(fs.createReadStream(file));
    }
  }

  api.sendMessage({ body: bodyText, attachment: attachments }, threadID, (err, info) => {
    if (err) return console.error(err);
    if (!global.client.handleReply) global.client.handleReply = [];
    global.client.handleReply.push({
      type: "theme_selection",
      name: module.exports.config.name,
      author: senderID,
      messageID: info.messageID,
      threadID,
      themes
    });
  });
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, senderID, body } = event;

  if (senderID !== handleReply.author) return;
  const num = parseInt(body);
  if (isNaN(num) || num < 1 || num > handleReply.themes.length)
    return api.sendMessage("⚠️ Invalid reply. Reply with a number from the list.", threadID);

  const selected = handleReply.themes[num-1];
  const themeID = selected.fbid || selected.id || selected.theme_fbid;
  if (!themeID) return api.sendMessage("⚠️ Cannot find theme ID.", threadID);

  // Remove selection from handleReply
  const index = global.client.handleReply.findIndex(r => r.messageID === handleReply.messageID);
  if (index > -1) global.client.handleReply.splice(index, 1);

  try {
    // Unsend preview message
    if (typeof api.unsendMessage === "function") {
      await api.unsendMessage(handleReply.messageID);
    }

    // Apply theme using api
    if (typeof api.setThreadThemeMqtt === "function") {
      await api.setThreadThemeMqtt(threadID, themeID);
      api.sendMessage(`✅ Theme applied successfully!\nSelected theme: ${selected.name}`, threadID);
    } else {
      api.sendMessage("⚠️ Bot does not support setThreadThemeMqtt.", threadID);
    }
  } catch (err) {
    console.error(err);
    api.sendMessage(`⚠️ Failed to apply theme: ${err.message || err}`, threadID);
  }
};

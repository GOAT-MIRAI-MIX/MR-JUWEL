const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const triggers = [
  // ইংরেজি
  "Juwel", "jewel", "juwel", "jewel boss", "mr juwel", "boss juwel",
  "juyel", "Juyel", "juwl", "Jwel",
  "juwel vai", "juwel vaiya", "jowel", "Jowel", "hi juwel",
  "love you juwel",
  
  // বাংলা - সব বানান
  "জোয়েল", "জোহেল", "জোয়েলjuweljuwel ভাই", 
  "জুয়েল ভাইয়া", "জুয়েল বস",
  "জুয়েল কই", "জুয়েল কোথায়", "কই জুয়েল", 
  "জোয়েল", "জুয়েল", "জুয়েল",
  "জুয়েল আসো", "জুয়েল শুনো", "জুয়েল ভালোবাসি", 
  "আই লাভ ইউ জুয়েল",
  "মিস ইউ জুয়েল", "হ্যালো জুয়েল", "হাই জুয়েল"
];

const audioUrls = [
  "https://files.catbox.moe/2nbk9d.mp3",
  "https://files.catbox.moe/pkooah.mp3",
  "https://files.catbox.moe/xjplr6.mp3",
  "https://files.catbox.moe/q7dwfu.mp3",
  "https://files.catbox.moe/2wv3fz.mp3",
  "https://files.catbox.moe/9z7tm8.mp3",
  "https://files.catbox.moe/eztcbq.mp3",
  "https://files.catbox.moe/crl00r.mp3",
  "https://files.catbox.moe/twc0kr.mp3",
  "https://files.catbox.moe/ke8seq.mp3",
  "https://files.catbox.moe/9vcx2u.mp3",
  "https://files.catbox.moe/nvg08m.mp3",
  "https://files.catbox.moe/nk6dpg.mp3",
  "https://files.catbox.moe/314f6q.mp3"
];

// এই লেখাটা বললে ট্রিগার কাজ করবে না
const blockTriggers = [
  "juwel ahamed'z",
  "juwel ahmed'z",
  "juwel ahame dz",
  "juwel ahamedz",
  "জুয়েল আহামেদ'জ"
];

const cooldown = new Map();
const COOLDOWN_TIME = 30 * 60 * 1000;

// কনফিগ ফাইল থেকে বট অ্যাডমিন লোড করার ফাংশন
function getBotAdmins() {
  try {
    const configPath = path.join(__dirname, "..", "..", "config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return config.ADMINBOT || config.adminBot || config.botAdmin || [];
    }
    
    const configPath2 = path.join(process.cwd(), "config.json");
    if (fs.existsSync(configPath2)) {
      const config = JSON.parse(fs.readFileSync(configPath2, "utf-8"));
      return config.ADMINBOT || config.adminBot || config.botAdmin || [];
    }
  } catch (e) {
    console.log("[AUTOVOICE] Config read error:", e.message);
  }
  return [];
}

module.exports.config = {
  name: "autovoice",
  version: "1.0.0",
  hasPermission: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Auto voice reply",
  commandCategory: "no prefix",
  usages: "",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body) return;

    const msg = event.body.toLowerCase().trim();
    
    // 🚫 ব্লক চেক - এই লেখাগুলো থাকলে ট্রিগার কাজ করবে না
    const isBlocked = blockTriggers.some(b => {
      const blockLower = b.toLowerCase();
      return msg === blockLower || msg.includes(blockLower);
    });
    
    if (isBlocked) return;
    
    // ✅ ট্রিগার চেক
    const isJewel = triggers.some(t => {
      const triggerLower = t.toLowerCase();
      return msg === triggerLower || msg.includes(triggerLower);
    });
    
    if (!isJewel) return;

    const senderID = event.senderID;
    const now = Date.now();

    // কনফিগ থেকে বট অ্যাডমিন লিস্ট নেওয়া
    const botAdmins = getBotAdmins();
    const isAdmin = botAdmins.includes(senderID);

    // বট অ্যাডমিন হলে ভয়েস দিবে না
    if (isAdmin) return;

    const lastTime = cooldown.get(senderID) || 0;
    if (now - lastTime < COOLDOWN_TIME) return;
    cooldown.set(senderID, now);

    const url = audioUrls[Math.floor(Math.random() * audioUrls.length)];

    const voice = await axios({
      url,
      method: "GET",
      responseType: "stream",
      timeout: 15000
    });

    return api.sendMessage(
      {
        body: "🅙𝐔🅦𝐄🅛",
        attachment: voice.data
      },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.log("[AUTOVOICE ERROR]", err.message || err);
  }
};

module.exports.run = async function () {};

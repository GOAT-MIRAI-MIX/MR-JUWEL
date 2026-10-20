const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
  name: "admin",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Show Owner Info as Text with Image",
  commandCategory: "info",
  usages: "admin",
  cooldowns: 5
};

const IMAGE_URL = "https://i.imgur.com/elZgt87.jpeg";

// A-Z, a-z, 0-9 -> 𝐀𝐁𝐂𝐃 (Mathematical Bold)
function bold(text) {
  return Array.from(text).map(ch => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(0x1D400 + (c - 65));
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1D41A + (c - 97));
    if (c >= 48 && c <= 57) return String.fromCodePoint(0x1D7CE + (c - 48));
    return ch;
  }).join("");
}

module.exports.run = async function ({ api, event }) {
  const time = moment().tz("Asia/Dhaka").format("hh:mm:ss A • DD/MM/YYYY");

  const design = `
╔═══════════════════════════╗
║   👑 ${bold("KING JUWEL")} 👑   ║
╚═══════════════════════════╝

  ┌─❰ 👤 ${bold("IDENTITY")} ❱─┐
  │  🧑 Name     ➺ ${bold("JUWEL")}
  │  🎭 Nick     ➺ ${bold("MR JUWEL")}
  │  🚹 Gender   ➺ ${bold("MALE")}
  │  🎂 Age      ➺ ${bold("22+")}
  │  🎈 Birthday ➺ ${bold("APRIL 24")}
  │  🩸 Blood    ➺ ${bold("A+")}
  │  📏 Height   ➺ ${bold('5"6')}
  │  ⚖️ Weight   ➺ ${bold("54+")}
  │  🕌 Religion ➺ ${bold("ISLAM")}
  │  🏡 Address  ➺ ${bold("RANGPUR")}
  └───────────────┘

  ┌─❰ 💫 ${bold("ATTITUDE")} ❱─┐
  │  😈 Attitude ➺ ${bold("KING")}
  │  🎮 FreeFire ➺ ${bold("LOVER")}
  │  📚 Study    ➺ ${bold("OFF")}
  │  💼 Work     ➺ ${bold("CONTRACTION")}
  │  ❤️ Relation ➺ ${bold("SINGLE")}
  └───────────────┘

  ┌─❰ 🌐 ${bold("CONTACT")} ❱─┐
  │  📘 Messenger ➺ ${bold("mrjuwel444")}
  │  📱 WhatsApp  ➺ ${bold("+8801943488192")}
  │  📸 Instagram ➺ ${bold("mrjuwel_2025")}
  │  🎵 TikTok    ➺ ${bold("mrjuwel2025")}
  │  ✈️ Telegram  ➺ ${bold("mrjuwel2025")}
  │  📧 Email     ➺ ${bold("mrjuwel315@gmail.com")}
  └───────────────┘

╔═══════════════════════════╗
║  🕒 ${bold(time)}  ║
║  👑 ${bold("POWERED BY JUWEL")} 👑  ║
╚═══════════════════════════╝
`;

  const cacheDir = __dirname + "/cache";
  const path = cacheDir + "/admin.jpg";
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  try {
    const res = await axios.get(IMAGE_URL, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    fs.writeFileSync(path, Buffer.from(res.data));

    return api.sendMessage(
      { body: design, attachment: fs.createReadStream(path) },
      event.threadID,
      () => fs.existsSync(path) && fs.unlinkSync(path),
      event.messageID
    );
  } catch (e) {
    console.log("Image load failed:", e.message);
    return api.sendMessage(design, event.threadID, event.messageID);
  }
};

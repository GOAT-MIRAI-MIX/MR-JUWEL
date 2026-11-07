const axios = require("axios");
const fs = require("fs");

// ====== API URLs (প্রথমটা কাজ না করলে পরেরটা try করবে) ======
const apiUrls = [
  "https://mr-juwel-f9fh.onrender.com/gemini",
  "https://api.nixhost.top/aryan/gemini"
];
const dbPath = __dirname + "/gemini_db.json";

// ====== ORIGINAL CREDIT (এটা লক করা) ======
const ORIGINAL_CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

function isCreditValid() {
  return module.exports.config.credits === ORIGINAL_CREDIT;
}

function creditWarning() {
  return (
    "⚠️ 𝗖𝗥𝗘𝗗𝗜𝗧 𝗖𝗛𝗔𝗡𝗚𝗘𝗗!\n\n" +
    "❌ এই কোডের ক্রেডিট পরিবর্তন করা হয়েছে, তাই কমান্ড কাজ করবে না।\n\n" +
    "👑 Original Credit:\n" + ORIGINAL_CREDIT + "\n\n" +
    "✅ ক্রেডিট ঠিক করলে কমান্ড আবার চলবে।"
  );
}

function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ====== API কল (fallback সহ) ======
async function fetchAnswer(content) {
  let lastError;
  for (const url of apiUrls) {
    try {
      const res = await axios.get(url, {
        params: { prompt: content, q: content },
        timeout: 60000 // Render ফ্রি সার্ভার ঘুমিয়ে থাকলে দেরি হতে পারে
      });
      const answer =
        res.data.answer ||
        res.data.response ||
        res.data.result ||
        res.data.message ||
        (typeof res.data === "string" ? res.data : JSON.stringify(res.data));
      if (answer) return answer;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("সব API ব্যর্থ হয়েছে");
}

module.exports.config = {
  name: "gemini",
  version: "1.2",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Gemini AI Chat (UI + reply system)",
  commandCategory: "ai",
  usages: "[question]",
  cooldowns: 5,
  aliases: ["ai", "gem"]
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!isCreditValid()) {
    return api.sendMessage(creditWarning(), threadID, messageID);
  }

  const content = args.join(" ");

  if (!content) {
    return api.sendMessage("❌ কিছু জিজ্ঞেস করো বেবি ❤️", threadID, messageID);
  }

  return askAI(api, threadID, messageID, senderID, content);
};

// Reply handler
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, messageReply, body } = event;

  if (!messageReply || !body) return;

  if (!isCreditValid()) {
    return api.sendMessage(creditWarning(), threadID, messageID);
  }

  const db = loadDB();
  if (!db[messageReply.messageID]) return;

  return askAI(api, threadID, messageID, senderID, body);
};

async function askAI(api, threadID, messageID, senderID, content) {
  api.sendMessage(
    "🔎 প্রশ্ন খুঁজতেছি...\n⏳ অপেক্ষা করো বেবি...",
    threadID,
    async (err, info) => {
      if (err) return;
      try {
        const answer = await fetchAnswer(content);

        const ui = `
╭─❍
│ 🤖 AI ASSISTANT
╰───────────────⧕

📝 𝗬𝗼𝘂𝗿 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻:
╭─────────────
${content}
╰─────────────

💬 𝗔𝗜 𝗥𝗲𝗽𝗹𝘆:
╭─────────────
${answer}
╰─────────────

╭─────────────
│ ❤️ Gemini AI Chat
│ 👑 Credits: ${ORIGINAL_CREDIT}
╰─────────────
`;

        api.editMessage(ui, info.messageID);

        const db = loadDB();
        db[info.messageID] = { threadID, senderID, prompt: content };
        saveDB(db);

      } catch (e) {
        api.editMessage("❌ Error: " + e.message, info.messageID);
      }
    },
    messageID
  );
  }

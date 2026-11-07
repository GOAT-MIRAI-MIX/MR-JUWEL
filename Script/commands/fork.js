module.exports.config = {
 name: "fork",
 version: "2.1.0",
 hasPermssion: 0,
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 description: "Stable fork system with live GitHub stats card",
 commandCategory: "other",
 usages: "fork",
 cooldowns: 3,
};

const OWNER = "GOAT-MIRAI-MIX";
const REPO = "MR-JUWEL";
const repoLink = `https://github.com/${OWNER}/${REPO}`;

// সুরক্ষা: ক্রেডিট বা রিপো লিংক বদলালে কমান্ড কাজ করবে না
const LOCK = {
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 repo: "https://github.com/GOAT-MIRAI-MIX/MR-JUWEL",
};


module.exports.run = async function({ api, event }) {

 if (module.exports.config.credits !== LOCK.credits || repoLink !== LOCK.repo) {
 return api.sendMessage(
 "⚠️ ক্রেডিট অথবা রিপো লিংক চেঞ্জ করা হয়েছে, তাই এই কমান্ড কাজ করছে না।",
 event.threadID,
 event.messageID
 );
 }

 const msg = `
🔥 𝗚𝗢𝗔𝗧 𝗠𝗜𝗥𝗔𝗜 𝗠𝗜𝗫 🔥

━━━━━━━━━━━━━━━━━━━━━━
⚡ 𝗚𝗢𝗔𝗧 𝗠𝗜𝗥𝗔𝗜 𝗠𝗜𝗫 𝗘𝗩𝗘𝗡 𝗣𝗟𝗨𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗
✅ 𝗚𝗢𝗔𝗧 𝗕𝗢𝗧 & 𝗠𝗜𝗥𝗔𝗜 𝗩𝗘𝗥𝗦𝗜𝗢𝗡 - 𝗗𝗨𝗜𝗧𝗔𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 𝗞𝗔𝗔𝗝 𝗞𝗢𝗥𝗘
━━━━━━━━━━━━━━━━━━━━━━
`;

 const setupVideo = "https://youtu.be/kNHDYw8GoQg";
 const linkMsg = `📌 𝗥𝗘𝗣𝗢 𝗟𝗜𝗡𝗞:\n${repoLink}\n\n🎬 𝗦𝗘𝗧-𝗨𝗣 𝗩𝗜𝗗𝗘𝗢:\n${setupVideo}`;

 return api.sendMessage(msg + "\n" + linkMsg, event.threadID, event.messageID);
};

module.exports.config = {
  name: "prefix",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Display bot prefix & uptime",
  commandCategory: "Information",
  usages: "",
  cooldowns: 5
};

const spamMap = new Map();
const SPAM_COOLDOWN = 10000;

const triggerWords = [
  "prefix", "mprefix", "mpre", "bot prefix", "what is the prefix", "prefx", "prfix",
  "perfix", "what prefix", "where prefix",
  "প্রিফিক্স", "বট প্রিফিক্স", "প্রিফিক্স কি",
  "प्रीफिक्स", "बॉट प्रीफिक्स",
  "dấu lệnh", "daulenh", "tiền tố"
];

module.exports.handleEvent = async ({ event, api, Threads }) => {
  const { threadID, messageID, body, senderID } = event;
  if (!body || !triggerWords.includes(body.toLowerCase().trim())) return;

  const now = Date.now();
  if (now - (spamMap.get(senderID) || 0) < SPAM_COOLDOWN) return;
  spamMap.set(senderID, now);

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  const up = process.uptime();
  const uptime = `${Math.floor(up / 86400)}d ${Math.floor((up % 86400) / 3600)}h ${Math.floor((up % 3600) / 60)}m`;

  return api.sendMessage(
`╔═─━⌬ PREFIX ⌬━─═╗
║ ✅ Prefix : 『 ${prefix} 』
║ ⏱️ Uptime : ${uptime}
╚═━━━━━━━━━━━━━═╝`,
    threadID,
    messageID
  );
};

module.exports.run = async ({ event, api }) => {
  return api.sendMessage("💡 Type 'prefix' to see the bot prefix & uptime.", event.threadID);
};

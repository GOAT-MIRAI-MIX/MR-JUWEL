const num = 6;     // ৬টা কমান্ড দিলেই ব্যান
const timee = 60;  // ৬০ সেকেন্ড (১ মিনিট) এর মধ্যে

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

module.exports.config = {
  name: "spamban",
  version: "2.1.0",
  hasPermssion: 0,
  credits: CREDIT,
  description: `১ মিনিটে ${num}টি কমান্ড দিলে অটো ব্যান`,
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const msg =
`╭──────────────────╮
   🛡️ 𝗔𝗡𝗧𝗜 𝗦𝗣𝗔𝗠 𝗦𝗬𝗦𝗧𝗘𝗠
╰──────────────────╯
┏━━━━━━━━━━━━━━━━┓
┃ ⏱️ সময়: ${timee} সেকেন্ড
┃ 🚫 লিমিট: ${num}টি কমান্ড
┃ ⚠️ লিমিট পার হলে অটো ব্যান
┗━━━━━━━━━━━━━━━━┛
👑 ${CREDIT}`;
  return api.sendMessage(msg, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  const { senderID, threadID } = event;

  if (!global.client.autoban) global.client.autoban = {};

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  if (!event.body || event.body.indexOf(prefix) != 0) return;

  const now = Date.now();
  let rec = global.client.autoban[senderID];

  // নতুন ইউজার বা সময় শেষ হলে রিসেট
  if (!rec || rec.timeStart + timee * 1000 <= now) {
    global.client.autoban[senderID] = { timeStart: now, number: 1 };
    return;
  }

  rec.number++;
  if (rec.number < num) return;

  // ---- ব্যান শুরু ----
  const dataUser = (await Users.getData(senderID)) || {};
  const data = dataUser.data || {};
  if (data.banned == true) return;

  let namethread = "Unknown";
  try {
    const t = (await Threads.getData(threadID)).threadInfo;
    namethread = (t && t.threadName) || "Unknown";
  } catch (e) {}

  const moment = require("moment-timezone");
  const timeDate = moment.tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");
  const reason = `স্প্যাম: ${timee} সেকেন্ডে ${num}টি কমান্ড`;

  data.banned = true;
  data.reason = reason;
  data.dateAdded = timeDate;
  await Users.setData(senderID, { data });
  global.data.userBanned.set(senderID, { reason, dateAdded: timeDate });

  global.client.autoban[senderID] = { timeStart: now, number: 0 };

  const userMsg =
`╭━━━━━━━━━━━━━━━━━╮
   🚫 𝗨𝗦𝗘𝗥 𝗕𝗔𝗡𝗡𝗘𝗗 🚫
╰━━━━━━━━━━━━━━━━━╯
👤 নাম: ${dataUser.name || "Unknown"}
🆔 আইডি: ${senderID}
📛 কারণ: ${reason}
🕒 সময়: ${timeDate}
━━━━━━━━━━━━━━━━━
✅ অ্যাডমিনকে রিপোর্ট করা হয়েছে
👑 ${CREDIT}`;

  api.sendMessage(userMsg, threadID, () => {
    const adminMsg =
`╭━━━━━━━━━━━━━━━━━╮
   🚨 𝗦𝗣𝗔𝗠 𝗥𝗘𝗣𝗢𝗥𝗧 🚨
╰━━━━━━━━━━━━━━━━━╯
👤 নাম: ${dataUser.name || "Unknown"}
🆔 ইউজার আইডি: ${senderID}
💬 গ্রুপ: ${namethread}
🆔 গ্রুপ আইডি: ${threadID}
📛 কারণ: ${reason}
🕒 সময়: ${timeDate}
━━━━━━━━━━━━━━━━━
👑 ${CREDIT}`;
    for (const ad of global.config.ADMINBOT) api.sendMessage(adminMsg, ad);
  });
};

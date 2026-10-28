const chalk = require('chalk');

module.exports.config = {
  name: "join",
  version: "4.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Join one or all bot groups (with member count) or add another user by UID/reply",
  commandCategory: "system",
  usages: "[uid | reply a message]",
  cooldowns: 5
};

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const TOP = "╔═════════════════════╗";
const BOT = "╚═════════════════════╝";
const DIV = "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈";

const box = (title) => `${TOP}\n   ${title}\n${BOT}`;
const footer = () => `${DIV}\n👑 𝗖𝗿𝗲𝗱𝗶𝘁 ➜ ${CREDIT}`;

module.exports.onLoad = () => {
  console.log(chalk.bold.hex("#00c300")(" JOIN COMMAND LOADED SUCCESSFULLY ✅"));
};

module.exports.handleReply = async function ({ api, event, handleReply, Threads }) {
  const { threadID, messageID, senderID, body } = event;
  const { ID, author, targetID } = handleReply;

  // শুধু যে কমান্ড চালিয়েছে সেই রিপ্লাই দিতে পারবে
  if (author && author != senderID) return;

  if (!body) {
    return api.sendMessage(
      `${box("⚠️ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗜𝗡𝗣𝗨𝗧")}\n\n❗ নাম্বার দিন (যেমন: 1 2 3) অথবা "add all" লিখুন।\n\n${footer()}`,
      threadID,
      messageID
    );
  }

  const input = body.trim().toLowerCase();
  let selectedIndexes = [];

  if (input === "add all") {
    selectedIndexes = ID.map((_, index) => index);
  } else {
    selectedIndexes = body
      .split(/\s+/)
      .map(x => parseInt(x.trim()) - 1)
      .filter(i => !isNaN(i) && i >= 0 && i < ID.length);

    if (selectedIndexes.length === 0) {
      return api.sendMessage(
        `${box("❌ 𝗪𝗥𝗢𝗡𝗚 𝗜𝗡𝗣𝗨𝗧")}\n\n⭕ ভুল ইনপুট!\n👉 নাম্বার (1 2 3) অথবা 'add all' ব্যবহার করুন।\n\n${footer()}`,
        threadID,
        messageID
      );
    }
  }

  const userToAdd = targetID || senderID;
  let added = 0, skipped = 0, failed = 0;

  for (const i of selectedIndexes) {
    try {
      const threadIDToJoin = ID[i];
      const threadInfo = await Threads.getInfo(threadIDToJoin);
      const { participantIDs, approvalMode, adminIDs } = threadInfo;
      const name = threadInfo.threadName || "Unnamed Group";

      if (participantIDs.includes(userToAdd)) {
        skipped++;
        continue;
      }

      await api.addUserToGroup(userToAdd, threadIDToJoin);

      if (approvalMode && !adminIDs.some(ad => ad.id == api.getCurrentUserID())) {
        api.sendMessage(
          `⏳ 𝗣𝗘𝗡𝗗𝗜𝗡𝗚 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟\n${DIV}\n📨 গ্রুপ: ${name}\n👤 ইউজার: ${userToAdd}\n📌 অ্যাডমিন অ্যাপ্রুভালের অপেক্ষায়।`,
          threadID
        );
      } else {
        api.sendMessage(
          `🎉 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬 𝗔𝗗𝗗𝗘𝗗\n${DIV}\n🏷️ গ্রুপ: ${name}\n👤 ইউজার: ${userToAdd}\n✅ সফলভাবে অ্যাড হয়েছে।`,
          threadID
        );
      }

      added++;
    } catch (err) {
      failed++;
      api.sendMessage(
        `❌ 𝗙𝗔𝗜𝗟𝗘𝗗\n${DIV}\n⚠️ গ্রুপ #${i + 1} এ অ্যাড করা যায়নি।\n📛 কারণ: ${err.message}`,
        threadID
      );
    }
  }

  const report =
    `${box("📊 𝗝𝗢𝗜𝗡 𝗥𝗘𝗣𝗢𝗥𝗧")}\n\n` +
    `👤 Target       ➜ ${userToAdd}\n` +
    `${DIV}\n` +
    `✅ Added        ➜ ${added}\n` +
    `⏩ Already in  ➜ ${skipped}\n` +
    `❌ Failed        ➜ ${failed}\n\n` +
    `${footer()}`;

  return api.sendMessage(report, threadID);
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const { threadID, messageID, senderID } = event;

  // টার্গেট ইউজার: রিপ্লাই করা মেসেজের সেন্ডার, অথবা UID, না হলে নিজে
  let targetID = senderID;
  const botID = api.getCurrentUserID();
  if (event.messageReply && event.messageReply.senderID && event.messageReply.senderID != botID) {
    targetID = event.messageReply.senderID;
  } else if (args && args[0] && /^\d{5,}$/.test(args[0])) {
    targetID = args[0];
  }

  const allThreads = await Threads.getAll();
  const ID = [];

  let msg = `${box("🔰 𝗝𝗢𝗜𝗡 𝗕𝗢𝗫 𝗟𝗜𝗦𝗧 🔰")}\n\n`;
  msg += targetID == senderID
    ? `👤 টার্গেট ➜ আপনি\n`
    : `👤 টার্গেট ➜ ${targetID}\n`;
  msg += `📦 মোট গ্রুপ ➜ ${allThreads.length}\n${DIV}\n`;

  // Threads.getAll() এ মেম্বার লিস্ট থাকে না, তাই লাইভ ইনফো এনে কাউন্ট করা হচ্ছে
  const getMemberCount = async (t) => {
    try {
      const live = await api.getThreadInfo(t.threadID);
      if (live && Array.isArray(live.participantIDs)) return live.participantIDs.length;
    } catch (e) {}
    try {
      const saved = await Threads.getInfo(t.threadID);
      if (saved && Array.isArray(saved.participantIDs)) return saved.participantIDs.length;
    } catch (e) {}
    const cached = t.threadInfo || {};
    if (Array.isArray(cached.participantIDs)) return cached.participantIDs.length;
    return "N/A";
  };

  const counts = await Promise.all(allThreads.map(getMemberCount));

  allThreads.forEach((t, i) => {
    const info = t.threadInfo || {};
    const name = info.threadName || "Unnamed Group";
    msg += `\n【${i + 1}】 ${name}\n      👥 মেম্বার: ${counts[i]}\n`;
    ID.push(t.threadID);
  });

  msg +=
    `\n${DIV}\n` +
    `✏️ রিপ্লাই করুন:\n` +
    `  ➤ নাম্বার দিয়ে (যেমন: 1 3 5)\n` +
    `  ➤ অথবা লিখুন: add all\n\n` +
    `💡 অন্য কাউকে অ্যাড করতে:\n` +
    `  ➤ join <uid>  অথবা কারো মেসেজে রিপ্লাই দিয়ে join\n` +
    `${footer()}`;

  return api.sendMessage(
    msg,
    threadID,
    (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          author: senderID,
          messageID: info.messageID,
          ID,
          targetID
        });
      }
    },
    messageID
  );
};

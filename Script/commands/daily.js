module.exports.config = {
  name: "daily",
  aliases: ["bonus", "checkin"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MR JUWEL",
  description: "প্রতিদিন ফ্রি কয়েন বোনাস সংগ্রহ করুন, স্ট্রিক বাড়ালে বেশি বোনাস",
  commandCategory: "economy",
  usages: "",
  cooldowns: 3
};

const BASE_REWARD = 500;
const STREAK_BONUS = 100;
const MAX_STREAK_BONUS_DAYS = 10;
const CLAIM_WINDOW_MS = 20 * 60 * 60 * 1000;   // ২০ ঘণ্টা পার হলে আবার claim করা যাবে
const STREAK_RESET_MS = 48 * 60 * 60 * 1000;   // ৪৮ ঘণ্টার বেশি গ্যাপ হলে স্ট্রিক ভাঙবে

module.exports.run = async function ({ api, event, Currencies }) {
  const { threadID, messageID, senderID } = event;

  let cur = await Currencies.getData(senderID);
  if (!cur) {
    await Currencies.createData(senderID, { money: 0, exp: 0, data: {} });
    cur = await Currencies.getData(senderID);
  }

  const data = cur.data || {};
  const now = Date.now();
  const last = data.lastDaily || 0;
  const prevStreak = data.dailyStreak || 0;

  if (now - last < CLAIM_WINDOW_MS) {
    const remain = CLAIM_WINDOW_MS - (now - last);
    const h = Math.floor(remain / 3600000);
    const m = Math.floor((remain % 3600000) / 60000);
    return api.sendMessage(
      `⏳ আপনি আজকের ডেইলি বোনাস আগেই সংগ্রহ করেছেন।\nআবার claim করতে বাকি: ${h} ঘণ্টা ${m} মিনিট`,
      threadID, messageID
    );
  }

  const streakBroken = (now - last) > STREAK_RESET_MS;
  const newStreak = streakBroken ? 1 : prevStreak + 1;
  const streakBonus = Math.min(newStreak, MAX_STREAK_BONUS_DAYS) * STREAK_BONUS;
  const reward = BASE_REWARD + streakBonus;
  const newMoney = (cur.money || 0) + reward;

  data.lastDaily = now;
  data.dailyStreak = newStreak;
  await Currencies.setData(senderID, { money: newMoney, data });

  return api.sendMessage(
    `🎁 ডেইলি বোনাস সংগ্রহ করা হয়েছে!\n` +
    `💰 পেয়েছেন: ${reward} কয়েন (বেস ${BASE_REWARD} + স্ট্রিক বোনাস ${streakBonus})\n` +
    `🔥 স্ট্রিক: ${newStreak} দিন${streakBroken && prevStreak > 0 ? " (আগের স্ট্রিক ভেঙে গিয়েছিল)" : ""}\n` +
    `👛 মোট ব্যালেন্স: ${newMoney} কয়েন`,
    threadID, messageID
  );
};

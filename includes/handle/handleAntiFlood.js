// 🛡️ handleAntiFlood.js
// থ্রেড-এডমিন `/antiflood on` দিয়ে চালু করলে, কোনো মেম্বার অল্প সময়ে অনেক মেসেজ
// দিলে প্রথমে সতর্ক করে, বারবার করলে গ্রুপ থেকে রিমুভ করে দেয়। গ্রুপ-এডমিন,
// বট-এডমিন ও ডেভেলপারদের উপর এটা কাজ করে না।

const WINDOW_MS = 8000;   // এই সময়ের মধ্যে মেসেজ গোনা হয়
const LIMIT = 6;          // এত মেসেজ হলে ফ্লাড ধরা হবে
const WARN_RESET_MS = 60000;

module.exports = function ({ api, Threads }) {
  const trackers = new Map();  // threadID -> Map(senderID -> [timestamps])
  const warned = new Map();    // threadID -> Set(senderID)

  return async function ({ event }) {
    if (!event.isGroup || !event.body) return;
    const threadID = String(event.threadID);
    const senderID = String(event.senderID);

    const ADMINBOT = (global.config.ADMINBOT || []).map(String);
    const DEVELOPER = (global.config.DEVELOPER || []).map(String);
    if (ADMINBOT.includes(senderID) || DEVELOPER.includes(senderID)) return;

    const threadSetting = global.data.threadData.get(threadID) || {};
    if (threadSetting.antiFlood !== true) return;

    if (!trackers.has(threadID)) trackers.set(threadID, new Map());
    const threadTracker = trackers.get(threadID);
    const now = Date.now();
    const list = (threadTracker.get(senderID) || []).filter(t => now - t < WINDOW_MS);
    list.push(now);
    threadTracker.set(senderID, list);

    if (list.length < LIMIT) return;
    threadTracker.set(senderID, []);

    try {
      const info = global.data.threadInfo.get(threadID) || await Threads.getInfo(threadID);
      const isThreadAdmin = (info.adminIDs || []).some(a => String(a.id) === senderID);
      if (isThreadAdmin) return;
    } catch (e) { /* ইনফো না পেলেও চালিয়ে যাওয়া নিরাপদ */ }

    if (!warned.has(threadID)) warned.set(threadID, new Set());
    const warnedSet = warned.get(threadID);

    if (!warnedSet.has(senderID)) {
      warnedSet.add(senderID);
      setTimeout(() => warnedSet.delete(senderID), WARN_RESET_MS);
      return api.sendMessage(
        "⚠️ স্প্যাম করবেন না, একটু ধীরে মেসেজ দিন! বারবার করলে গ্রুপ থেকে রিমুভ করে দেওয়া হবে।",
        threadID
      );
    }

    try {
      await api.removeUserFromGroup(senderID, threadID);
      return api.sendMessage("🚫 বারবার স্প্যাম করার কারণে একজন সদস্যকে গ্রুপ থেকে রিমুভ করা হয়েছে।", threadID);
    } catch (e) {
      return api.sendMessage("⚠️ একজন সদস্য স্প্যাম করছে, কিন্তু তাকে রিমুভ করা সম্ভব হয়নি (পারমিশন নেই)।", threadID);
    }
  };
};

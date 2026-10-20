const fs = require("fs-extra");
const path = require("path");

const BAN_FILE = path.join(__dirname, "bannedUsers.json");

// =========================
// 📋 ব্যাকআপ সিস্টেম
// =========================
if (fs.existsSync(BAN_FILE)) {
  const backupFile = path.join(__dirname, "bannedUsers_backup.json");
  if (!fs.existsSync(backupFile)) {
    try {
      fs.copySync(BAN_FILE, backupFile);
      console.log("💾 ব্যাকআপ সংরক্ষিত: bannedUsers_backup.json");
    } catch (err) {
      console.error("❌ ব্যাকআপ ব্যর্থ:", err.message);
    }
  }
}

// =========================
// GLOBAL DATA INIT
// =========================
if (!global.data) global.data = {};
if (!global.data.userBanned) global.data.userBanned = new Map();

// =========================
// LOAD BAN DATA
// =========================
function loadBan() {
  try {
    if (!fs.existsSync(BAN_FILE)) {
      fs.writeFileSync(BAN_FILE, JSON.stringify({}, null, 2));
      console.log("📄 নতুন ব্যান ফাইল তৈরি করা হয়েছে");
      return;
    }

    const data = JSON.parse(fs.readFileSync(BAN_FILE, "utf8"));
    
    global.data.userBanned.clear();
    for (let id in data) {
      global.data.userBanned.set(id, data[id]);
    }

    console.log(`✅ ব্যান ডেটা লোড হয়েছে: ${global.data.userBanned.size} জন`);
  } catch (error) {
    console.error("❌ ব্যান ফাইল লোডে ত্রুটি:", error);
    fs.writeFileSync(BAN_FILE, JSON.stringify({}, null, 2));
  }
}

// =========================
// SAVE BAN DATA
// =========================
function saveBan() {
  try {
    const obj = Object.fromEntries(global.data.userBanned);
    fs.writeFileSync(BAN_FILE, JSON.stringify(obj, null, 2));
    console.log(`💾 ব্যান ডেটা সেভ করা হয়েছে: ${Object.keys(obj).length} জন`);
  } catch (error) {
    console.error("❌ ব্যান ডেটা সেভে ত্রুটি:", error);
  }
}

// =========================
// INITIAL LOAD
// =========================
loadBan();

// =========================
// CONFIG
// =========================
module.exports.config = {
  name: "ban",
  version: "4.1.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Mirai Stable Ban System with Persistent Storage",
  commandCategory: "group",
  cooldowns: 3
};

// =========================
// HANDLE EVENT (অটো ব্লক)
// =========================
module.exports.handleEvent = async ({ event, api }) => {
  const { senderID, threadID } = event;

  const banData = global.data.userBanned.get(senderID);
  if (!banData) return;

  // ইউজারের নাম বের করুন
  let userName = banData.userName || "অজানা";
  try {
    const userInfo = await api.getUserInfo(senderID);
    if (userInfo && userInfo[senderID]) {
      userName = userInfo[senderID].name || banData.userName || "অজানা";
    }
  } catch (error) {
    console.error("ইউজারের নাম বের করতে সমস্যা:", error);
  }

  return api.sendMessage(
    `⛔ ${userName}, আপনি ব্যান করা আছেন!\n📝 কারণ: ${banData.reason}\n👮 ব্যান করেছেন: ${banData.byName || "অজানা"}\n♾️ স্থায়ী ব্যান`,
    threadID
  );
};

// =========================
// COMMAND
// =========================
module.exports.run = async ({ event, api, args }) => {
  const { threadID, messageID, messageReply, mentions } = event;
  const fullMsg = event.body || "";
  const cmd = fullMsg.split(" ")[0].toLowerCase();

  // =========================
  // টার্গেট আইডি বের করুন
  // =========================
  let targetID = null;
  let startIdx = 1;

  // ১. রিপ্লাই চেক
  if (messageReply) {
    targetID = messageReply.senderID;
    startIdx = 1;
  } 
  // ২. মেনশন চেক
  else if (Object.keys(mentions || {}).length > 0) {
    targetID = Object.keys(mentions)[0];
    startIdx = 1;
  } 
  // ৩. আর্গুমেন্ট থেকে UID বের করুন
  else if (args.length > 0) {
    // চেক করুন args[0] টাইম কিনা (এখন টাইম চেক করব না)
    if (/^(\d+)([mhd])$/.test(args[0])) {
      // টাইম প্যারামিটার এড়িয়ে যান
      if (args.length > 1) {
        targetID = args[1]; // UID হিসেবে ধরুন
        startIdx = 3; // UID, টাইম, কারণ
      } else {
        return api.sendMessage(
          "⚠️ দয়া করে UID দিন অথবা @মেনশন করুন\n\n" +
          "উদাহরণ:\n" +
          "➜ /ban @user স্প্যাম\n" +
          "➜ /ban 123456789 স্প্যাম\n" +
          "➜ রিপ্লাই করে /ban কারণ",
          threadID,
          messageID
        );
      }
    } else {
      targetID = args[0];
      startIdx = 1;
    }
  }

  if (!targetID) {
    return api.sendMessage(
      "⚠️ দয়া করে UID দিন / রিপ্লাই দিন / মেনশন করুন",
      threadID,
      messageID
    );
  }

  if (!/^\d+$/.test(targetID)) {
    return api.sendMessage("❌ সঠিক UID দিন (শুধু সংখ্যা)!", threadID, messageID);
  }

  // =========================
  // BAN
  // =========================
  if (cmd === "ban" || cmd === "/ban") {
    // আগে থেকেই ব্যান কিনা চেক
    if (global.data.userBanned.has(targetID)) {
      const existing = global.data.userBanned.get(targetID);
      
      return api.sendMessage(
        `⚠️ ইতিমধ্যেই ব্যান করা!\n📝 কারণ: ${existing.reason}\n♾️ স্থায়ী ব্যান`,
        threadID,
        messageID
      );
    }

    // ইউজারের নাম বের করুন
    let userName = "অজানা";
    try {
      const userInfo = await api.getUserInfo(targetID);
      if (userInfo && userInfo[targetID]) {
        userName = userInfo[targetID].name || "অজানা";
      }
    } catch (error) {
      console.error("ইউজারের নাম বের করতে সমস্যা:", error);
    }

    // কারণ পার্স (টাইম প্যারামিটার এড়িয়ে যান)
    let reason = "";
    
    // চেক করুন args[startIdx] টাইম কিনা
    if (args[startIdx] && /^(\d+)([mhd])$/.test(args[startIdx])) {
      // টাইম প্যারামিটার উপেক্ষা করুন
      reason = args.slice(startIdx + 1).join(" ") || "কারণ উল্লেখ নেই";
    } else {
      reason = args.slice(startIdx).join(" ") || "কারণ উল্লেখ নেই";
    }

    // ব্যান ডেটা সেভ (নাম সহ)
    const banInfo = {
      reason: reason,
      by: event.senderID,
      byName: "অজানা",
      time: Date.now(),
      userName: userName
    };

    // ব্যান কার নাম বের করুন
    try {
      const byUserInfo = await api.getUserInfo(event.senderID);
      if (byUserInfo && byUserInfo[event.senderID]) {
        banInfo.byName = byUserInfo[event.senderID].name || "অজানা";
      }
    } catch (error) {
      console.error("ব্যান কার নাম বের করতে সমস্যা:", error);
    }

    global.data.userBanned.set(targetID, banInfo);
    saveBan();

    // রেসপন্স (নাম সহ)
    return api.sendMessage(
`╔═══════BAN═════════╗
👤 ইউজার: ${userName}
🆔 UID: ${targetID}
📝 কারণ: ${reason}
♾️ স্থায়ী ব্যান
👮 ব্যান করেছেন: ${banInfo.byName}
╚════════════════════╝`,
      threadID,
      messageID
    );
  }

  // =========================
  // UNBAN
  // =========================
  if (cmd === "unban" || cmd === "/unban") {
    if (!global.data.userBanned.has(targetID)) {
      return api.sendMessage("⚠️ এই ইউজার ব্যান করা নেই", threadID, messageID);
    }

    const banInfo = global.data.userBanned.get(targetID);
    
    // ইউজারের নাম বের করুন
    let userName = banInfo.userName || "অজানা";
    try {
      const userInfo = await api.getUserInfo(targetID);
      if (userInfo && userInfo[targetID]) {
        userName = userInfo[targetID].name || banInfo.userName || "অজানা";
      }
    } catch (error) {
      console.error("ইউজারের নাম বের করতে সমস্যা:", error);
    }
    
    global.data.userBanned.delete(targetID);
    saveBan();

    return api.sendMessage(
`🟢 UNBAN সফল

👤 ইউজার: ${userName}
🆔 UID: ${targetID}
📝 পূর্ববর্তী কারণ: ${banInfo.reason}
♾️ স্থায়ী ব্যান ছিল
👮 ব্যান করেছিলেন: ${banInfo.byName || "অজানা"}
✅ এখন আনব্যান করা হয়েছে`,
      threadID,
      messageID
    );
  }

  // =========================
  // BANLIST
  // =========================
  if (cmd === "banlist" || cmd === "/banlist") {
    const bannedUsers = Array.from(global.data.userBanned.entries());
    
    if (bannedUsers.length === 0) {
      return api.sendMessage("📋 কোনো ব্যান করা ইউজার নেই", threadID, messageID);
    }

    let listMessage = "╔════BAN LIST ════╗\n";
    
    for (const [id, data] of bannedUsers) {
      // ইউজারের নাম বের করুন
      let userName = data.userName || "অজানা";
      try {
        const userInfo = await api.getUserInfo(id);
        if (userInfo && userInfo[id]) {
          userName = userInfo[id].name || data.userName || "অজানা";
        }
      } catch (error) {
        console.error("ইউজারের নাম বের করতে সমস্যা:", error);
      }
      
      listMessage += `\n👤 ${userName}\n`;
      listMessage += `   🆔 ${id}\n`;
      listMessage += `   📝 ${data.reason}\n`;
      listMessage += `   ♾️ স্থায়ী\n`;
      listMessage += `   👮 ${data.byName || "অজানা"}\n`;
    }
    listMessage += "╚═════════════════════╝";

    return api.sendMessage(listMessage, threadID, messageID);
  }
};

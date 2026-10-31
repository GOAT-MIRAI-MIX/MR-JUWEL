const fs = require("fs");
const path = require("path");

module.exports.config = {
 name: "addadmin",
 version: "4.1.0",
 hasPermssion: 2,
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 description: "বাংলা Ultimate Admin System (Add + Protect + Temp + Log)",
 commandCategory: "group",
 usages: "reply / @mention / UID / সময়",
 cooldowns: 5
};

// 📁 ডাটা ফাইল
const dataPath = path.join(__dirname, "adminData.json");

// 📥 ডাটা লোড
function loadData() {
 try {
 if (!fs.existsSync(dataPath)) return {};
 return JSON.parse(fs.readFileSync(dataPath, "utf8"));
 } catch {
 return {};
 }
}

// 💾 ডাটা সেভ
function saveData(data) {
 fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// 🔍 Admin চেক (id / uid / সরাসরি স্ট্রিং — সব ফরম্যাট সাপোর্ট করে)
function isAdmin(threadInfo, userID) {
 const list = (threadInfo && threadInfo.adminIDs) || [];
 return list.some(a => {
 const id = typeof a === "object" && a !== null ? (a.id || a.uid || a.userID) : a;
 return String(id) === String(userID);
 });
}

module.exports.run = async function ({ api, event, args, Users }) {
 const { threadID, messageID, mentions, messageReply } = event;
 const threadInfo = await api.getThreadInfo(threadID);

 const data = loadData();
 if (!data[threadID]) data[threadID] = { owners: [], temps: {} };

 let targetID;
 let time = parseInt(args[1]);

 // 🎯 ইউজার সিলেক্ট
 if (messageReply) targetID = messageReply.senderID;
 else if (mentions && Object.keys(mentions).length > 0) {
 targetID = Object.keys(mentions)[0];
 time = parseInt(args[args.length - 1]);
 }
 else if (args[0]) targetID = args[0];
 else {
 return api.sendMessage(
`╔════════════════════╗
 ⚠️ ইউজার পাওয়া যায়নি
╚════════════════════╝

📌 কাউকে Reply / Mention / UID দাও`,
 threadID, messageID
 );
 }

 targetID = String(targetID);

 try {
 // ⚠️ Already admin
 if (isAdmin(threadInfo, targetID)) {
 return api.sendMessage(
`╔════════════════════╗
 ⚠️ আগে থেকেই Admin
╚════════════════════╝

👤 এই ইউজার আগে থেকেই Admin আছে`,
 threadID, messageID
 );
 }

 // 🚀 Admin বানানো (বট admin না হলে এখানেই error আসবে)
 await api.changeAdminStatus(threadID, targetID, true);

 const name = await Users.getNameUser(targetID);

 // 🔒 Owner save
 if (!data[threadID].owners.includes(targetID)) {
 data[threadID].owners.push(targetID);
 }

 // ⏱️ Temporary admin
 if (!isNaN(time)) {
 const expire = Date.now() + time * 60 * 60 * 1000;
 data[threadID].temps[targetID] = expire;

 setTimeout(async () => {
 try {
 const newInfo = await api.getThreadInfo(threadID);
 if (isAdmin(newInfo, targetID)) {
 const d = loadData();
 if (d[threadID]) {
 d[threadID].owners = d[threadID].owners.filter(i => i !== targetID);
 delete d[threadID].temps[targetID];
 saveData(d);
 }
 await api.changeAdminStatus(threadID, targetID, false);
 api.sendMessage(
`⏱️ সময় শেষ!

👤 ${name} এখন আর Admin না`,
 threadID
 );
 }
 } catch {}
 }, time * 60 * 60 * 1000);
 }

 saveData(data);

 // 📩 ইনবক্স নোটিফাই
 api.sendMessage(
`🎉 অভিনন্দন!

আপনাকে একটি গ্রুপে Admin বানানো হয়েছে ✅`,
 targetID
 );

 // 📊 লগ
 console.log(`[ADMIN LOG] ${event.senderID} -> ${targetID}`);

 return api.sendMessage(
`╔════════════════════╗
 ✅ 𝗔𝗗𝗗 𝗔𝗗𝗠𝗜𝗡
╚════════════════════╝

👤 নাম: ${name}
🆔 UID: ${targetID}

${!isNaN(time) ? `⏱️ সময়: ${time} ঘন্টা` : "🔒 স্থায়ী Admin"}

🛡️ Protected System চালু`,
 threadID,
 messageID
 );

 } catch (e) {
 console.log("[ADMIN ERROR]", e);
 return api.sendMessage(
`╔════════════════════╗
 ❌ ব্যর্থ
╚════════════════════╝

⚠️ Admin করতে সমস্যা হয়েছে!
👉 নিশ্চিত হও বট গ্রুপে Admin আছে এবং UID সঠিক`,
 threadID,
 messageID
 );
 }
};

// 🛡️ Protection System
module.exports.handleEvent = async function ({ api, event }) {
 const { threadID, logMessageType, logMessageData } = event;

 if (logMessageType !== "log:thread-admins") return;

 const data = loadData();
 if (!data[threadID]) return;

 const removed = logMessageData.ADMIN_EVENT == "remove_admin";
 const targetID = String(logMessageData.TARGET_ID);

 // 🔒 Protected admin remove হলে auto add
 if (removed && data[threadID].owners.includes(targetID)) {
 try {
 await api.changeAdminStatus(threadID, targetID, true);
 api.sendMessage(
`╔════════════════════╗
 🛡️ প্রোটেকশন চালু
╚════════════════════╝

❌ Protected Admin remove করা যাবে না!
✅ আবার Admin করে দেওয়া হয়েছে`,
 threadID
 );
 } catch {}
 }
};

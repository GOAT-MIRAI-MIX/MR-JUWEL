module.exports.config = {
 name: 'listbox',
 version: '2.0.1',
 credits: '乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐',
 hasPermssion: 2,
 description: '[Ban/Unban/Del/Out] Manage all group threads',
 commandCategory: 'Admin',
 usages: '[page/all]',
 cooldowns: 5
};

const LINE = "━━━━━━━━━━━━━━━━━━━━";
const THIN = "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈";

module.exports.handleReply = async function ({ api, event, Threads, handleReply }) {
 const { threadID } = event;
 if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

 const moment = require("moment-timezone");
 const time = moment.tz("Asia/Dhaka").format("HH:mm:ss | DD/MM/YYYY");

 const args = event.body.trim().split(/\s+/);
 const action = (args[0] || "").toLowerCase();
 const index = parseInt(args[1]) - 1;

 if (isNaN(index) || !handleReply.groupid[index]) {
 return api.sendMessage(
`╭${LINE}╮
┃ ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐍𝐔𝐌𝐁𝐄𝐑
╰${LINE}╯`, threadID);
 }

 const idgr = handleReply.groupid[index];
 const groupName = handleReply.groupName[index];

 try {

 if (action === "ban") {
 const data = (await Threads.getData(idgr)).data || {};
 data.banned = 1;
 data.dateAdded = time;

 await Threads.setData(idgr, { data });
 global.data.threadBanned.set(idgr, { dateAdded: time });

 return api.sendMessage(
`╭${LINE}╮
┃  🚫 𝐁𝐀𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒
┣${THIN}
┃ 🔷 𝐍𝐚𝐦𝐞 : ${groupName}
┃ 🔰 𝐓𝐈𝐃  : ${idgr}
┃ ⏰ 𝐓𝐢𝐦𝐞 : ${time}
╰${LINE}╯
   ${module.exports.config.credits}`, threadID);
 }

 if (["unban", "ub"].includes(action)) {
 const data = (await Threads.getData(idgr)).data || {};
 data.banned = 0;
 data.dateAdded = null;

 await Threads.setData(idgr, { data });
 global.data.threadBanned.delete(idgr);

 return api.sendMessage(
`╭${LINE}╮
┃  ✅ 𝐔𝐍𝐁𝐀𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒
┣${THIN}
┃ 🔷 𝐍𝐚𝐦𝐞 : ${groupName}
┃ 🔰 𝐓𝐈𝐃  : ${idgr}
┃ ⏰ 𝐓𝐢𝐦𝐞 : ${time}
╰${LINE}╯
   ${module.exports.config.credits}`, threadID);
 }

 if (action === "del") {
 await Threads.delData(idgr);

 return api.sendMessage(
`╭${LINE}╮
┃  🗑️ 𝐃𝐄𝐋𝐄𝐓𝐄 𝐒𝐔𝐂𝐂𝐄𝐒𝐒
┣${THIN}
┃ 🔷 𝐍𝐚𝐦𝐞 : ${groupName}
┃ 🔰 𝐓𝐈𝐃  : ${idgr}
┃ ✔ 𝐃𝐚𝐭𝐚 𝐑𝐞𝐦𝐨𝐯𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲
╰${LINE}╯
   ${module.exports.config.credits}`, threadID);
 }

 if (action === "out") {
 api.sendMessage(
`╭${LINE}╮
┃  👋 𝐋𝐄𝐀𝐕𝐈𝐍𝐆 𝐆𝐑𝐎𝐔𝐏
┣${THIN}
┃ 🔷 ${groupName}
╰${LINE}╯`,
 idgr,
 () => api.removeUserFromGroup(api.getCurrentUserID(), idgr)
 );

 return api.sendMessage(
`╭${LINE}╮
┃  ✅ 𝐎𝐔𝐓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒
┣${THIN}
┃ 🔷 𝐍𝐚𝐦𝐞 : ${groupName}
┃ 🔰 𝐓𝐈𝐃  : ${idgr}
╰${LINE}╯
   ${module.exports.config.credits}`, threadID);
 }

 return api.sendMessage(
`╭${LINE}╮
┃ ⚠️ 𝐔𝐧𝐤𝐧𝐨𝐰𝐧 𝐀𝐜𝐭𝐢𝐨𝐧
┃ ban | unban | del | out
╰${LINE}╯`, threadID);

 } catch (e) {
 console.log(e);
 return api.sendMessage(
`╭${LINE}╮
┃ ❌ 𝐄𝐫𝐫𝐨𝐫 𝐎𝐜𝐜𝐮𝐫𝐫𝐞𝐝!
╰${LINE}╯`, threadID);
 }
};

module.exports.run = async function ({ api, event, args }) {
 let threadList = [];

 try {
 const data = await api.getThreadList(100, null, ["INBOX"]);

 for (const thread of data) {
 if (thread.isGroup) {
 threadList.push({
 name: thread.name || "No Name",
 id: thread.threadID,
 count: thread.messageCount
 });
 }
 }

 } catch (e) {
 console.log(e);
 }

 if (!threadList.length) {
 return api.sendMessage(
`╭${LINE}╮
┃ ❌ 𝐍𝐨 𝐆𝐫𝐨𝐮𝐩 𝐅𝐨𝐮𝐧𝐝!
╰${LINE}╯`, event.threadID);
 }

 threadList.sort((a, b) => b.count - a.count);

 let page = 1;
 const limit = 30;

 if (args[0] && args[0].toLowerCase() !== "all") {
 page = parseInt(args[0]) || 1;
 }

 const totalPage = Math.ceil(threadList.length / limit);
 const isAll = args[0] && args[0].toLowerCase() === "all";
 const groups = isAll
 ? threadList
 : threadList.slice((page - 1) * limit, page * limit);

 let msg =
`╭${LINE}╮
┃     📦 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 📦
┣${THIN}
┃ 🔢 𝐓𝐨𝐭𝐚𝐥 𝐆𝐫𝐨𝐮𝐩𝐬 : ${threadList.length}
╰${LINE}╯

`;

 const groupid = [];
 const groupName = [];

 groups.forEach((g, i) => {
 msg +=
`┏━❰ ${i + 1} ❱━━━━━━━━━━━━━
┃ 🔷 ${g.name}
┃ 🔰 𝐓𝐈𝐃 : ${g.id}
┃ 💬 𝐌𝐬𝐠 : ${g.count}
┗━━━━━━━━━━━━━━━━━━━

`;
 groupid.push(g.id);
 groupName.push(g.name);
 });

 if (!isAll) {
 msg += `📄 𝐏𝐚𝐠𝐞 : ${page}/${totalPage}\n\n`;
 }

 msg +=
`╭${LINE}╮
┃  ⚙️ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒
┣${THIN}
┃ 🚫 ban + number
┃ ✅ unban + number
┃ 🗑️ del + number
┃ 👋 out + number
╰${LINE}╯
   ${this.config.credits}`;

 return api.sendMessage(msg, event.threadID, (err, info) => {
 if (err) return console.log(err);
 global.client.handleReply.push({
 name: this.config.name,
 author: event.senderID,
 messageID: info.messageID,
 groupid,
 groupName,
 type: "reply"
 });
 });
};

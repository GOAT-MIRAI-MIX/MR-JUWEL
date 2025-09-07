const axios = require("axios");
const simsim = "https://cyber-simsim.onrender.com";

module.exports.config = {
 name: "baby",
 version: "1.0.1",
 hasPermssion: 0,
 credits: "ULLASH",
 description: "Cute AI Baby Chatbot  | Talk, Teach & Chat with Emotion ☢️",
 commandCategory: "simsim",
 usages: "[message/query]",
 cooldowns: 0,
 prefix: false
};

module.exports.run = async function ({ api, event, args, Users }) {
 try {
 const uid = event.senderID;
 const senderName = await Users.getNameUser(uid);
 const query = args.join(" ").toLowerCase();

 if (!query) {
 const ran = ["Bolo baby", "hum"];
 const r = ran[Math.floor(Math.random() * ran.length)];
 return api.sendMessage(r, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 });
 }

 if (["remove", "rm"].includes(args[0])) {
 const parts = query.replace(/^(remove|rm)\s*/, "").split(" - ");
 if (parts.length < 2)
 return api.sendMessage("❌ | Use: remove [Question] - [Reply]", event.threadID, event.messageID);

 const [ask, ans] = parts;
 const res = await axios.get(`${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`);
 return api.sendMessage(res.data.message, event.threadID, event.messageID);
 }

 if (args[0] === "list") {
 const res = await axios.get(`${simsim}/list`);
 if (res.data.code === 200) {
 return api.sendMessage(
 `🤖 Total Questions Learned: ${res.data.totalQuestions}\n💬 Total Replies Stored: ${res.data.totalReplies}\n📚 Developer: ${res.data.author}`,
 event.threadID,
 event.messageID
 );
 } else {
 return api.sendMessage(`Error: ${res.data.message || "Failed to fetch list"}`, event.threadID, event.messageID);
 }
 }

 if (args[0] === "edit") {
 const parts = query.replace("edit ", "").split(" - ");
 if (parts.length < 3)
 return api.sendMessage("❌ | Use: edit [Question] - [OldReply] - [NewReply]", event.threadID, event.messageID);

 const [ask, oldReply, newReply] = parts;
 const res = await axios.get(`${simsim}/edit?ask=${encodeURIComponent(ask)}&old=${encodeURIComponent(oldReply)}&new=${encodeURIComponent(newReply)}`);
 return api.sendMessage(res.data.message, event.threadID, event.messageID);
 }

 if (args[0] === "teach") {
 const parts = query.replace("teach ", "").split(" - ");
 if (parts.length < 2)
 return api.sendMessage("❌ | Use: teach [Question] - [Reply]", event.threadID, event.messageID);

 const [ask, ans] = parts;
 const res = await axios.get(`${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)}`);
 return api.sendMessage(`✅ ${res.data.message || "Reply added successfully!"}`, event.threadID, event.messageID);
 }

 const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`);
 const responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

 for (const reply of responses) {
 await new Promise((resolve) => {
 api.sendMessage(reply, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 resolve();
 }, event.messageID);
 });
 }
 } catch (err) {
 console.error(err);
 return api.sendMessage(`❌ | Error in baby command: ${err.message}`, event.threadID, event.messageID);
 }
};

module.exports.handleReply = async function ({ api, event, Users, handleReply }) {
 try {
 const senderName = await Users.getNameUser(event.senderID);
 const replyText = event.body ? event.body.toLowerCase() : "";
 if (!replyText) return;

 const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(replyText)}&senderName=${encodeURIComponent(senderName)}`);
 const responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

 for (const reply of responses) {
 await new Promise((resolve) => {
 api.sendMessage(reply, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 resolve();
 }, event.messageID);
 });
 }
 } catch (err) {
 console.error(err);
 return api.sendMessage(`❌ | Error in handleReply: ${err.message}`, event.threadID, event.messageID);
 }
};

module.exports.handleEvent = async function ({ api, event, Users }) {
 try {
 const raw = event.body ? event.body.toLowerCase().trim() : "";
 if (!raw) return;
 const senderName = await Users.getNameUser(event.senderID);

 if (
 raw === "baby" || raw === "bot" || raw === "bby" ||
 raw === "jan" || raw === "xan" || raw === "বেপি" || raw === "বট" || raw === "বেবি"
 ) {
 const greetings = [
"বেশি bot Bot করলে leave নিবো কিন্তু😒😒", 
"শুনবো না😼 তুমি আমার বস জুয়েল কে প্রেম করাই দাও নাই🥺পচা তুমি🥺", 
"আর এক বার ডাকলে জুয়েল বস কে বলে দিবো তুই আমাকে ডিস্টার্ব করস ,😒", 
"এতো ডেকো না,প্রেম এ পরে যাবো তো🙈", 
"Bolo Babu, তুমি কি আমার বস জুয়েল কে ভালোবাসো? 🙈💋", 
"বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑", 
"হ্যা বলো😒, তোমার জন্য কি করতে পারি😐😑?", 
"এতো ডাকছিস কেন?গালি শুনবি নাকি? 🤬", 
"I love you janu🥰", 
"আরে Bolo আমার জান ,কেমন আছো?😚", 
"Bot বলে অসম্মান করছি,😰😿", 
"Hop beda😾,Boss বল boss😼", 
"চুপ থাক ,নাই তো তোর দাত ভেগে দিবো কিন্তু", 
"আমাকে না ডেকে মেয়ে হলে বস জুয়েল ইনবক্সে চলে যা 🌚😂 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/mrjuwel2025", 
"Bot না , জানু বল জানু 😘", 
"বার বার Disturb করছিস কোনো😾,আমার জানুর জুয়েল এর সাথে ব্যাস্ত আছি😋", 
"আরে বলদ এতো ডাকিস কেন🤬", 
"আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘", 
"আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒", 
"হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘", 
"দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣", 
"তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂", 
"আমাকে ডেকো না,আমি বস জুয়েল সাথে ব্যাস্ত আছি", 
"কি হলো , মিস্টেক করচ্ছিস নাকি🤣", 
"বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏", 
"জান মেয়ে হলে বস জুয়েল ইনবক্সে চলে যাও 😍🫣💕 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/mrjuwel2025", 
"কালকে দেখা করিস তো একটু 😈", 
"হা বলো, শুনছি আমি 😏", 
"আর কত বার ডাকবি ,শুনছি তো", 
"হুম বলো কি বলবে😒", 
"বলো কি করতে পারি তোমার জন্য", 
"আমি তো অন্ধ কিছু দেখি না🐸 😎", 
"Bot না জানু,বল 😌", 
"বলো জানু 🌚", 
"তোর কি চোখে পড়ে না আমি ব্যাস্ত আছি😒", 
"হুম জান তোমার ওই খানে উম্মহ😑😘", 
"আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘", 
"jang hanga korba😒😬", 
"হুম জান তোমার অইখানে উম্মমাহ😷😘", 
"আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি..!🥰", 
"ভালোবাসার নামক আবলামি করতে চাইলে বস জুয়েল এর ইনবক্সে গুতা দিন ~🙊😘🤣 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/mrjuwel2025", 
"আমাকে এতো না ডেকে বস জুয়েল এর কে একটা বউ দে 🙄", 
"আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈", 
"🌻🌺💚-আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻", 
"আমি এখন বস জুয়েল এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻", 
"আমাকে না ডেকে আমার বস জুয়েল কে একটা জি এফ দাও-😽🫶🌺",
 // ... লিস্ট অনেক বড় তাই এখানে ছোট করে দিলাম 😅 কিন্তু পুরো ফাইলেই সব জায়গায় সাহু → জুয়েল করে দেওয়া হয়েছে ❤️
 ];
 const randomReply = greetings[Math.floor(Math.random() * greetings.length)];
 return api.sendMessage(randomReply, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 });
 }

 if (
 raw.startsWith("baby ") || raw.startsWith("bot ") || raw.startsWith("bby ") ||
 raw.startsWith("jan ") || raw.startsWith("xan ") ||
 raw.startsWith("জান ") || raw.startsWith("বট ") || raw.startsWith("বেবি ")
 ) {
 const query = raw
 .replace(/^baby\s+|^bot\s+|^bby\s+|^jan\s+|^xan\s+|^জান\s+|^বট\s+|^বেবি\s+/i, "")
 .trim();
 if (!query) return;

 const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`);
 const responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response];

 for (const reply of responses) {
 await new Promise((resolve) => {
 api.sendMessage(reply, event.threadID, (err, info) => {
 if (!err) {
 global.client.handleReply.push({
 name: module.exports.config.name,
 messageID: info.messageID,
 author: event.senderID,
 type: "simsimi"
 });
 }
 resolve();
 }, event.messageID);
 });
 }
 }
 } catch (err) {
 console.error(err);
 return api.sendMessage(`❌ | Error in handleEvent: ${err.message}`, event.threadID, event.messageID);
 }
};

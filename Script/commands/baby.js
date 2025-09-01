 const senderName = await Users.getNameUser(event.senderID);

 if (
 raw === "baby" || raw === "bot" || raw === "bby" ||
 raw === "jan" || raw === "xan" || raw === "বেপি" || raw === "বট" || raw === "বেবি"
 ) {
 const greetings = [
  "বেশি bot Bot করলে leave নিবো কিন্তু😒😒",
  "শুনবো না😼 তুমি আমার বস রাজ কে প্রেম করাই দাও নাই🥺পচা তুমি🥺",
  "আমি আবাল দের সাথে কথা বলি না,ok😒",
  "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈",
  "Bolo Babu, তুমি কি আমার বস রাজ কে ভালোবাসো? 🙈💋",
  "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑",
  "হ্যা বলো😒, তোমার জন্য কি করতে পারি😐😑?",
  "এতো ডাকছিস কেন?গালি শুনবি নাকি? 🤬",
  "I love you janu🥰",
  "আরে Bolo আমার জান ,কেমন আছো?😚",
  "Bot বলে অসম্মান করছি,😰😿",
  "Hop beda😾,Boss বল boss😼",
  "চুপ থাক ,নাই তো তোর দাত ভেগে দিবো কিন্তু",
  "আমাকে না ডেকে মেয়ে হলে বস রাজ এর ইনবক্সে চলে যা 🌚😂 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/rdx.raj.king490",
  "Bot না , জানু বল জানু 😘",
  "বার বার Disturb করছিস কোনো😾,আমার জানুর সাথে ব্যাস্ত আছি😋",
  "আরে বলদ এতো ডাকিস কেন🤬",
  "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘",
  "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒",
  "হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘",
  "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
  "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂",
  "আমাকে ডেকো না,আমি বস রাজ এর সাথে ব্যাস্ত আছি",
  "কি হলো , মিস্টেক করচ্ছিস নাকি🤣",
  "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
  "জান মেয়ে হলে বস রাজ এর ইনবক্সে চলে যাও 😍🫣💕 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 𝐋𝐢𝐧𝐤 : https://www.facebook.com/rdx.raj.king490",
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
  "ভালোবাসার নামক আবলামি করতে চাইলে বস রাজ এর ইনবক্সে গুতা দিন ~🙊😘🤣 🆔 : https://www.facebook.com/rdx.raj.king490",
  "আমাকে এতো না ডেকে রাজ কে একটা গফ দে 🙄",
  "আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈",
  "🌻🌺💚-আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻",
  "আমি এখন বস রাজ এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻",
  "আমাকে না ডেকে আমার বস রাজ কে একটা জি এফ দাও-😽🫶🌺",
  "ঝাং থুমালে আইলাপিউ পেপি-💝😽",
  "উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈",
  "জান তোমার বান্ধবী রে আমার বস রাজ এর হাতে তুলে দিবা-🙊🙆‍♂",
  "আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧",
  "ঝাং 🫵থুমালে য়ামি রাইতে পালুপাসি উম্মম্মাহ-🌺🤤💦",
  "চুনা ও চুনা আমার বস রাজ এর হবু বউ রে কেও দেকছো খুজে পাচ্ছি না😪🤧😭",
  "স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💝🌺🌻",
  "জান হাঙ্গা করবা-🙊😝🌻",
  "জান মেয়ে হলে চিপায় আসো বস রাজ থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽",
  "হুদাই আমারে শয়তানে লারে-😝😑☹️"
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

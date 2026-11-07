const axios = require("axios");
const deltaNext = 5;

function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

module.exports.config = {
  name: "call",
  version: "1.0.2",
  author: "Chitron Bhattacharjee + Modified by JUWEL",
  countDown: 15,
  role: 0,
  shortDescription: "Call bomber (BD only)",
  longDescription: "Bangladeshi নাম্বারে Call API পাঠায়। কোন কয়েন লাগবে না।",
  category: "tools",
  guide: "{pn} 01xxxxxxxxx"
};

module.exports.onStart = async function ({ message, args, event, usersData }) {
  const number = args[0];
  const senderID = event.senderID;

  // User exp → level
  const userData = await usersData.get(senderID);
  const exp = userData.exp || 0;
  const level = expToLevel(exp);

  // Level requirement (same as before)
  if (level < 2) {
    return message.reply("🚫 এই কমান্ড ব্যবহার করতে আপনার লেভেল কমপক্ষে 2 হতে হবে!");
  }

  // Invalid BD number check
  if (!number || !/^01[0-9]{9}$/.test(number)) {
    return message.reply(
      "📵 একটি বৈধ বাংলাদেশি মোবাইল নাম্বার দিন!\n" +
      "👉 উদাহরণ: call 01xxxxxxxxx\n" +
      "⚠️ অনুগ্রহ করে কাউকে বিরক্ত করতে ব্যবহার করবেন না।"
    );
  }

  // No coin system — no balance check — free command
  message.reply(`📞 কল বোম্বিং শুরু হয়েছে ${number} নম্বরে...\n🕐 অনুগ্রহ করে অপেক্ষা করুন...`);

  try {
    await axios.get(`https://tbblab.shop/callbomber.php?mobile=${number}`);
    return message.reply(`✅ কল বোম্বিং সম্পন্ন হয়েছে ${number} নম্বরে!`);
  } catch (error) {
    return message.reply(`❌ ত্রুটি ঘটেছে: ${error.message}`);
  }
};

module.exports.onChat = async function () {};

// 🧪 ডেমো ফাইল — প্রমাণ করার জন্য যে খাঁটি GoatBot/Mirai স্টাইলের (onStart,
// message, usersData, threadsData) কমান্ড ফাইল কোনো পরিবর্তন ছাড়াই এই বটে কাজ করে।
// চাইলে এই ফাইলটা ডিলিট করে দিতে পারো, এটা শুধু উদাহরণ।
module.exports.config = {
  name: "godbotdemo",
  version: "1.0.0",
  author: "demo",
  role: 0,
  category: "test",
  guide: "{pn}"
};

module.exports.onStart = async function ({ message, args, usersData, event, role }) {
  const info = await usersData.get(event.senderID);
  return message.reply(`✅ GoatBot/Mirai style command কাজ করছে!\nname: ${info.name}\nrole: ${role}\nargs: ${args.join(" ")}`);
};

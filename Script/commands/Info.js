module.exports.config = {
  name: "info",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Bot information command",
  commandCategory: "For users",
  hide: true,
  usages: "",
  cooldowns: 5,
};

// কমান্ড কাউন্টার ফাইল
const getCounterPath = () => __dirname + "/cache/info_count.json";

function bumpCounter(fs) {
  const p = getCounterPath();
  let count = 0;
  try {
    count = JSON.parse(fs.readFileSync(p, "utf8")).count || 0;
  } catch (e) {}
  count += 1;
  try {
    fs.writeFileSync(p, JSON.stringify({ count }));
  } catch (e) {}
  return count;
}

// RAM ব্যবহারের প্রগ্রেস বার
function bar(percent, size = 10) {
  const p = Math.max(0, Math.min(100, percent));
  const filled = Math.round((p / 100) * size);
  return "█".repeat(filled) + "░".repeat(size - filled) + ` ${p.toFixed(0)}%`;
}

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const { threadID, senderID } = event;
  const request = global.nodemodule["request"];
  const fs = global.nodemodule["fs-extra"];
  const os = require("os");
  const moment = global.nodemodule["moment-timezone"];

  fs.ensureDirSync(__dirname + "/cache");

  const { configPath } = global.client;
  delete require.cache[require.resolve(configPath)];
  const config = require(configPath);

  const { commands } = global.client;
  const threadSetting = (await Threads.getData(String(threadID))).data || {};
  const prefix = threadSetting.hasOwnProperty("PREFIX")
    ? threadSetting.PREFIX
    : config.PREFIX;

  // ===== আপটাইম =====
  const uptime = process.uptime();
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  const uptimeText = `${d ? d + "d " : ""}${h}h ${m}m ${s}s`;

  const totalUsers = global.data.allUserID.length;
  const totalThreads = global.data.allThreadID.length;

  // ===== সিস্টেম =====
  const botRAM = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
  const totalRAM = os.totalmem() / 1024 / 1024 / 1024;
  const usedRAM = totalRAM - os.freemem() / 1024 / 1024 / 1024;
  const ramPercent = (usedRAM / totalRAM) * 100;
  const cpuModel = ((os.cpus()[0] && os.cpus()[0].model) || "Unknown")
    .replace(/\s+/g, " ")
    .trim();
  const cpuCores = os.cpus().length;
  const load = os.loadavg()[0].toFixed(2);
  const platform = `${os.platform()} (${os.arch()})`;

  // ===== সময় (বাংলাদেশ) =====
  const now = moment.tz("Asia/Dhaka");
  const timeNow = now.format("hh:mm:ss A");
  const dateNow = now.format("DD MMMM YYYY");
  const dayNow = now.format("dddd");

  // ===== গ্রুপ =====
  let groupName = "N/A";
  let memberCount = "N/A";
  let adminCount = "N/A";
  try {
    const info = await api.getThreadInfo(threadID);
    groupName = info.threadName || "Unnamed";
    memberCount = info.participantIDs.length;
    adminCount = info.adminIDs.length;
  } catch (e) {}

  // ===== ইউজার =====
  let userName = "Unknown";
  try {
    userName = await Users.getNameUser(senderID);
  } catch (e) {}

  const usedCount = bumpCounter(fs);
  const ping = Date.now() - event.timestamp;

  const msg =
`╭━━━━━━━━━━━━━━━━━━━━━━╮
      ✨ 𝐑𝐈𝐘𝐀 𝐁𝐎𝐓 ✨
   𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 𝐂𝐀𝐑𝐃
╰━━━━━━━━━━━━━━━━━━━━━━╯
┏━━━ 🤖 𝐁𝐎𝐓 ━━━━━━━━━━
┃ ➤ 𝐍𝐚𝐦𝐞       ⟫ 𝐑𝐈𝐘𝐀
┃ ➤ 𝐏𝐫𝐞𝐟𝐢𝐱     ⟫ ${config.PREFIX}
┃ ➤ 𝐁𝐨𝐱 𝐏𝐫𝐞𝐟𝐢𝐱 ⟫ ${prefix}
┃ ➤ 𝐌𝐨𝐝𝐮𝐥𝐞𝐬    ⟫ ${commands.size}
┃ ➤ 𝐏𝐢𝐧𝐠       ⟫ ${ping}ms
┃ ➤ 𝐔𝐩𝐭𝐢𝐦𝐞     ⟫ ${uptimeText}
┗━━━━━━━━━━━━━━━━━━━━━
┏━━━ 🖥️ 𝐒𝐘𝐒𝐓𝐄𝐌 ━━━━━━
┃ ➤ 𝐁𝐨𝐭 𝐑𝐀𝐌  ⟫ ${botRAM} MB
┃ ➤ 𝐒𝐞𝐫𝐯𝐞𝐫   ⟫ ${usedRAM.toFixed(2)}/${totalRAM.toFixed(2)} GB
┃ ➤ 𝐔𝐬𝐚𝐠𝐞    ⟫ ${bar(ramPercent)}
┃ ➤ 𝐂𝐏𝐔      ⟫ ${cpuModel}
┃ ➤ 𝐂𝐨𝐫𝐞𝐬    ⟫ ${cpuCores} | 𝐋𝐨𝐚𝐝 ${load}
┃ ➤ 𝐍𝐨𝐝𝐞     ⟫ ${process.version}
┃ ➤ 𝐎𝐒       ⟫ ${platform}
┗━━━━━━━━━━━━━━━━━━━━━
┏━━━ 🕒 𝐓𝐈𝐌𝐄 ━━━━━━━━━
┃ ➤ 𝐃𝐚𝐭𝐞 ⟫ ${dateNow}
┃ ➤ 𝐃𝐚𝐲  ⟫ ${dayNow}
┃ ➤ 𝐓𝐢𝐦𝐞 ⟫ ${timeNow}
┃ ➤ 𝐙𝐨𝐧𝐞 ⟫ Asia/Dhaka 🇧🇩
┗━━━━━━━━━━━━━━━━━━━━━
┏━━━ 👥 𝐆𝐑𝐎𝐔𝐏 ━━━━━━━
┃ ➤ 𝐍𝐚𝐦𝐞    ⟫ ${groupName}
┃ ➤ 𝐌𝐞𝐦𝐛𝐞𝐫𝐬 ⟫ ${memberCount}
┃ ➤ 𝐀𝐝𝐦𝐢𝐧𝐬  ⟫ ${adminCount}
┃ ➤ 𝐈𝐃      ⟫ ${threadID}
┗━━━━━━━━━━━━━━━━━━━━━
┏━━━ 🙋 𝐘𝐎𝐔 ━━━━━━━━━
┃ ➤ 𝐍𝐚𝐦𝐞    ⟫ ${userName}
┃ ➤ 𝐔𝐈𝐃     ⟫ ${senderID}
┃ ➤ 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 ⟫ fb.com/${senderID}
┗━━━━━━━━━━━━━━━━━━━━━
┏━━━ 📊 𝐒𝐓𝐀𝐓𝐒 ━━━━━━━
┃ ➤ 𝐆𝐫𝐨𝐮𝐩𝐬    ⟫ ${totalThreads}
┃ ➤ 𝐔𝐬𝐞𝐫𝐬     ⟫ ${totalUsers}
┃ ➤ 𝐈𝐧𝐟𝐨 𝐔𝐬𝐞𝐝 ⟫ ${usedCount} বার
┗━━━━━━━━━━━━━━━━━━━━━
┏━━━ 👑 𝐎𝐖𝐍𝐄𝐑 ━━━━━━━
┃ ➤ 𝐍𝐚𝐦𝐞 ⟫ 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
┃ ➤ 𝐅𝐁   ⟫ fb.com/mrjuwel444
┃ ➤ 𝐌𝐒𝐆  ⟫ m.me/mrjuwel444
┃ ➤ 𝐖𝐀   ⟫ +8801943488192
┗━━━━━━━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━━━━━━━━╮
  ❤️ 𝐓𝐡𝐚𝐧𝐤𝐬 𝐅𝐨𝐫 𝐔𝐬𝐢𝐧𝐠 ❤️
     🌺 𝐑𝐈𝐘𝐀 𝐁𝐎𝐓 🌺
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

  const imgLinks = [
    "https://i.imgur.com/MkTK40j.jpeg",
  ];

  const imgLink = imgLinks[Math.floor(Math.random() * imgLinks.length)];
  const cachePath = __dirname + "/cache/info.jpg";

  // ছবি ডাউনলোড ব্যর্থ হলে শুধু টেক্সট পাঠাবে
  const sendTextOnly = () =>
    api.sendMessage(msg, threadID, undefined, event.messageID);

  const callback = () => {
    api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(cachePath),
      },
      threadID,
      () => fs.unlinkSync(cachePath),
      event.messageID
    );
  };

  return request(encodeURI(imgLink))
    .on("error", sendTextOnly)
    .pipe(fs.createWriteStream(cachePath))
    .on("close", callback)
    .on("error", sendTextOnly);
};

// 🔒 Credits Protection
if (module.exports.config.credits !== "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐") {
  throw new Error("⚠️ Credits পরিবর্তন করা হয়েছে! অনুগ্রহ করে আসল ক্রেডিট ব্যবহার করুন।");
}

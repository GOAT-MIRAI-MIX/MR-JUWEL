module.exports.config = {
  name: "adminonly",
  version: "2.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Admin only mode on/off",
  commandCategory: "Admin",
  usages: "adminonly [on | off | status]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": ""
  }
};

const fs = require("fs-extra");
const { resolve } = require("path");

const dataPath = resolve(__dirname, "cache", "data.json");

// IMPORTANT: use require() so we share the SAME cached object that the
// bot's main handler (handleCommand) reads. We change it in memory
// (takes effect instantly) and also save it to disk (survives restart).
function loadData() {
  fs.ensureDirSync(resolve(__dirname, "cache"));
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ adminbox: {} }, null, 4), "utf8");
  }
  let data;
  try {
    data = require(dataPath);
  } catch (e) {
    fs.writeFileSync(dataPath, JSON.stringify({ adminbox: {} }, null, 4), "utf8");
    delete require.cache[require.resolve(dataPath)];
    data = require(dataPath);
  }
  if (typeof data.adminbox !== "object" || data.adminbox === null) data.adminbox = {};
  return data;
}

function saveData(data) {
  fs.ensureDirSync(resolve(__dirname, "cache"));
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 4), "utf8");
}

const LINE = "━━━━━━━━━━━━━━━━━━━━━━";

function ui(title, status, desc) {
  return (
    `╔${LINE}╗\n` +
    `   ⚙️  𝗔𝗗𝗠𝗜𝗡 𝗢𝗡𝗟𝗬 𝗠𝗢𝗗𝗘\n` +
    `╚${LINE}╝\n\n` +
    `${title}\n` +
    `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
    `  📌 𝗦𝘁𝗮𝘁𝘂𝘀 : ${status}\n` +
    `┗━━━━━━━━━━━━━━━━━━━━┛\n\n` +
    `💬 ${desc}\n\n` +
    `${LINE}`
  );
}

module.exports.onLoad = function () {
  const data = loadData();
  saveData(data);
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const data = loadData();
  const { adminbox } = data;
  const current = adminbox[threadID] === true;
  const option = (args[0] || "").toLowerCase();

  // Status only
  if (option === "status") {
    return api.sendMessage(
      ui(
        "📊 বর্তমান অবস্থা",
        current ? "🔒 ON" : "🔓 OFF",
        current
          ? "এখন শুধু বট অ্যাডমিন বট ব্যবহার করতে পারবে।"
          : "এখন সবাই বট ব্যবহার করতে পারবে।"
      ),
      threadID,
      messageID
    );
  }

  // Decide new state: on / off / toggle
  let next;
  if (option === "on") next = true;
  else if (option === "off") next = false;
  else next = !current;

  adminbox[threadID] = next;

  try {
    saveData(data);
  } catch (err) {
    return api.sendMessage(
      "❌ ডাটা সেভ করতে সমস্যা হয়েছে!\n" + err.message,
      threadID,
      messageID
    );
  }

  if (next) {
    return api.sendMessage(
      ui(
        "✅ সফলভাবে চালু হয়েছে",
        "🔒 ON",
        "Admin Only Mode চালু!\nশুধু বট অ্যাডমিন বট ব্যবহার করতে পারবে।"
      ),
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    ui(
      "✅ সফলভাবে বন্ধ হয়েছে",
      "🔓 OFF",
      "Admin Only Mode বন্ধ!\nএখন সবাই বট ব্যবহার করতে পারবে।"
    ),
    threadID,
    messageID
  );
};

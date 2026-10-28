module.exports.config = {
  name: "file",
  version: "1.0.3",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Delete the file or folder in the commands folder",
  commandCategory: "Admin",
  usages: "\nfile start <text>\nfile ext <text>\nfile <text>\nfile [leave blank]\nfile help",
  cooldowns: 5
};

// 𝙰𝙱𝙲𝙳 ফন্ট কনভার্টার (শুধু লেখার জন্য, ফাইলের নাম বদলায় না)
const mono = (str) => [...String(str)].map(c => {
  const k = c.charCodeAt(0);
  if (k >= 65 && k <= 90) return String.fromCodePoint(0x1D670 + k - 65);
  if (k >= 97 && k <= 122) return String.fromCodePoint(0x1D68A + k - 97);
  if (k >= 48 && k <= 57) return String.fromCodePoint(0x1D7F6 + k - 48);
  return c;
}).join("");

const header = (title) =>
`╭━━━━━━━━━━━━━━━━━━╮
   ⚡ ${mono(title)}
╰━━━━━━━━━━━━━━━━━━╯`;

const line = "━━━━━━━━━━━━━━━━━━━━";

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID != handleReply.author) return;
  const fs = require("fs-extra");
  const path = require("path");

  const nums = [...new Set(
    event.body
      .split(/\s+/)
      .map(n => parseInt(n))
      .filter(n => !isNaN(n) && n >= 1 && n <= handleReply.files.length)
  )];

  if (nums.length == 0)
    return api.sendMessage(
      `${header("Invalid")}\n\n⚠️ ${mono("Please reply with valid number(s) from the list.")}`,
      event.threadID, event.messageID
    );

  let done = "", failed = "";

  for (const num of nums) {
    const target = handleReply.files[num - 1];

    if (target === path.basename(__filename)) {
      failed += `⛔ ${target} ${mono("(this command itself)")}\n`;
      continue;
    }

    const fullPath = path.join(__dirname, target);
    try {
      const stat = fs.statSync(fullPath);
      let icon = "";
      if (stat.isDirectory()) { icon = "🗂️"; fs.removeSync(fullPath); }
      else if (stat.isFile()) { icon = "📄"; fs.unlinkSync(fullPath); }
      done += `✅ ${icon} ${target}\n`;
    } catch (e) {
      failed += `❌ ${target} → ${e.message}\n`;
    }
  }

  let out = `${header("Delete Result")}\n\n`;
  if (done) out += `🗑️ ${mono("Deleted")}:\n${line}\n${done}`;
  if (failed) out += `\n⚠️ ${mono("Problems")}:\n${line}\n${failed}`;
  out += `\n${line}\n📊 ${mono("Total")}: ${nums.length}`;

  return api.sendMessage(out, event.threadID, event.messageID);
};

module.exports.run = async function ({ api, event, args }) {
  const fs = require("fs-extra");
  const path = require("path");

  let files = fs.readdirSync(__dirname + "/") || [];
  let key = "";

  if (args[0] == "help") {
    const helpMsg =
`${header("File Help")}

📌 ${mono("file")}
   ↳ ${mono("show all files")}

📌 ${mono("file start <text>")}
   ↳ ${mono("names starting with text")}
   ↳ ${mono("e.g.")} file start rank

📌 ${mono("file ext <text>")}
   ↳ ${mono("filter by extension")}
   ↳ ${mono("e.g.")} file ext .js

📌 ${mono("file <text>")}
   ↳ ${mono("names containing text")}
   ↳ ${mono("e.g.")} file help

${line}
💡 ${mono("Reply with number(s) to delete")}
💡 ${mono("Multiple: 1 3 5")}`;
    return api.sendMessage(helpMsg, event.threadID, event.messageID);
  }
  else if (args[0] == "start" && args[1]) {
    const word = args.slice(1).join(" ");
    files = files.filter(f => f.startsWith(word));
    if (files.length == 0)
      return api.sendMessage(`⚠️ ${mono("No files start with")}: ${word}`, event.threadID, event.messageID);
    key = `🔎 ${mono("Starts with")}: ${word}`;
  }
  else if (args[0] == "ext" && args[1]) {
    const ext = args[1];
    files = files.filter(f => f.endsWith(ext));
    if (files.length == 0)
      return api.sendMessage(`⚠️ ${mono("No files end with")}: ${ext}`, event.threadID, event.messageID);
    key = `🔎 ${mono("Extension")}: ${ext}`;
  }
  else if (!args[0]) {
    if (files.length == 0)
      return api.sendMessage(`⚠️ ${mono("Commands folder is empty")}`, event.threadID, event.messageID);
    key = `📂 ${mono("All files")}`;
  }
  else {
    const word = args.join(" ");
    files = files.filter(f => f.includes(word));
    if (files.length == 0)
      return api.sendMessage(`⚠️ ${mono("No files contain")}: ${word}`, event.threadID, event.messageID);
    key = `🔎 ${mono("Contains")}: ${word}`;
  }

  let list = "";
  files.forEach((file, idx) => {
    let icon = "📄";
    try {
      if (fs.statSync(path.join(__dirname, file)).isDirectory()) icon = "🗂️";
    } catch (e) {}
    list += `${mono(String(idx + 1).padStart(2, "0"))} ┃ ${icon} ${file}\n`;
  });

  const body =
`${header("File Manager")}

${key}
📊 ${mono("Total")}: ${files.length}
${line}
${list}${line}
💬 ${mono("Reply with number(s) to delete")}
💬 ${mono("Multiple numbers: 1 3 5")}`;

  return api.sendMessage(body, event.threadID, (e, info) => {
    if (e) return console.log(e);
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: event.senderID,
      files
    });
  });
};

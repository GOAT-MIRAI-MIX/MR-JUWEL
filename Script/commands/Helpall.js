const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "helpall",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "乛 MR ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Premium all command list with modern UI",
  commandCategory: "system",
  usages: "[No args]",
  cooldowns: 5
};

// ✦ মোনোস্পেস বোল্ড ফন্ট (𝙰𝙱𝙲𝙳 স্টাইল)
function toMonoBold(text) {
  const map = {
    'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴',
    'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹',
    'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾',
    'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃',
    'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈',
    'Z': '𝚉',
    'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎',
    'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓',
    'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘',
    'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝',
    'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢',
    'z': '𝚣'
  };
  return text.split('').map(c => map[c] || c).join('');
}

// ✦ সিরিয়াল নাম্বার (মোনোস্পেস স্টাইল)
function toMonoNumber(num) {
  const map = {
    '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺',
    '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
  };
  return num.toString().split('').map(d => map[d] || d).join('');
}

// 🔥 মেইন ফাংশন
async function sendHelp(api, event) {
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const allCommands = [...commands.keys()]
    .filter(cmd => cmd && cmd.trim() !== "")
    .map(cmd => cmd.trim())
    .sort();

  const total = allCommands.length;

  // 🔥 প্রতি লাইনে কমান্ড (২ কলাম গ্রিড লুক)
  const commandList = allCommands.map((cmd, i) => {
    const serial = toMonoNumber(i + 1);
    const padded = serial.padStart(4, ' ');
    const name = toMonoBold(cmd);
    return `  ⟡ ${padded}  ▸  ${name}`;
  }).join("\n");

  const finalText = `
╭━━━〔 ✦ 𝐇𝐄𝐋𝐏 𝐌𝐄𝐍𝐔 ✦ 〕━━━╮
┃
┃   ⌬ 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 : ${toMonoNumber(total)}
┃   ⌬ 𝐏𝐫𝐞𝐟𝐢𝐱       : ${toMonoBold("!")}
┃   ⌬ 𝐒𝐭𝐚𝐭𝐮𝐬       : ${toMonoBold("Online")}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━━━┓
┃    ✿ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 ✿     ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
${commandList}

╭━━━━━━━━━━━━━━━━━━━━━━╮
┃  ⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 ${toMonoBold("JUWEL")} ⚡  ┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`;

  const imgPath = __dirname + "/cache/helpallbg.jpg";
  const bg = "https://i.imgur.com/MkTK40j.jpeg";

  try {
    const res = await axios({
      url: encodeURI(bg),
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const writer = fs.createWriteStream(imgPath);
    res.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        {
          body: finalText,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => { try { fs.unlinkSync(imgPath); } catch (e) {} },
        messageID
      );
    });

    writer.on("error", () => {
      api.sendMessage(finalText, threadID, messageID);
    });

  } catch (error) {
    console.error("Error:", error);
    api.sendMessage(finalText, threadID, messageID);
  }
}

// 🔥 প্রিফিক্স কমান্ড
module.exports.run = async function ({ api, event }) {
  return sendHelp(api, event);
};

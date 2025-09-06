const request = require("request");
const fs = require("fs-extra");
const moment = require("moment-timezone");

module.exports.config = {
    name: "admin",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "ULLASH", //don't change my credit 
    description: "Show Owner Info",
    commandCategory: "info",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function({ api, event }) {
    var time = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");

    var callback = () => api.sendMessage({
        body: `
┏━━━━━━━━━━━━━━━━━┓
┃      🌟 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 🌟      
┣━━━━━━━━━━━━━━━━━┫
┃ 👤 𝐍𝐚𝐦𝐞      : 𝐉𝐔𝐖𝐄𝐋 ッ
┃ 🚹 𝐆𝐞𝐧𝐝𝐞𝐫    : 𝐌𝐀𝐋𝐄
┃ ❤️ 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧  : 𝐒𝐈𝐍𝐆𝐄𝐋😐
┃ 🎂 𝐀𝐠𝐞         :20+
┃ 🕌 𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧  : 𝐈𝐒𝐋𝐀𝐌
┃ 🏫 𝐄𝐝𝐮𝐜𝐚𝐭𝐢𝐨𝐧 : 𝐁𝐔𝐒𝐈𝐍𝐄𝐒𝐒𝐌𝐀𝐍
┃ 🏡 𝐀𝐝𝐝𝐫𝐞𝐬𝐬  : 𝐑𝐀𝐍𝐆𝐏𝐔𝐑 𝐂𝐈𝐓𝐘
┣━━━━━━━━━━━━━━━━━┫
┃ 🎭 𝐓𝐢𝐤𝐭𝐨𝐤  : mrjuwel2025
┃ 📢 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 : mrjuwel2026
┃ 🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : facebook.com/mrjuwel2025
┣━━━━━━━━━━━━━━━━━┫
┃ 🕒 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 𝐓𝐢𝐦𝐞:  ${time}
┗━━━━━━━━━━━━━━━━━┛
        `,
        attachment: fs.createReadStream(__dirname + "/cache/1.png")
    }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"));
  
    const imageURL = "https://i.imgur.com/P7YaVy2.jpeg";

    return request(encodeURI(imageURL))
        .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
        .on('close', () => callback());
};

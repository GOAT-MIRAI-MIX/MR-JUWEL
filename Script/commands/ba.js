module.exports.config = {
 name: "emoji_voice",
 version: "10.0",
 hasPermssion: 0,
 credits: "𝗦𝗵𝗮𝗵𝗮𝗱𝗮𝘁 𝗦𝗔𝗛𝗨",
 description: "Emoji দিলে কিউট মেয়ের ভয়েস পাঠাবে 😍",
 commandCategory: "noprefix",
 usages: "😘🥰😍",
 cooldowns: 5
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const emojiAudioMap = {
 "☺️": "https://files.catbox.moe/q1wrn4.mp3",
 "😑": "https://files.catbox.moe/q4ji6t.mp3",
 "💔": "https://files.catbox.moe/qhqkhf.mp3",
 "😌": "https://files.catbox.moe/eb1o8q.mp3",
 "🍼": "https://files.catbox.moe/ay5sfh.mp3",
 "😉": "https://files.catbox.moe/svl56z.mp3",
 "😱": "https://files.catbox.moe/17o3ao.mp3",
 "🤣": "https://files.catbox.moe/cab8wb.mp3",
 "🥵": "https://files.catbox.moe/l90704.mp3",
 "😏": "https://files.catbox.moe/6yeaxb.mp3",
 "🤦": "https://files.catbox.moe/jxuwix.mp3",
 "🙂": "https://files.catbox.moe/9ve7qo.mp3",
 "😔": "https://files.catbox.moe/ggu5rq.mp3",
 "🙈": "https://files.catbox.moe/jhbvme.mp3",
 "🤫": "https://files.catbox.moe/28fc5u.mp3",
 "🤧": "https://files.catbox.moe/zh3mdg.mp3",
 "🤔": "https://files.catbox.moe/d6skqg.mp3",
 "🥹": "https://files.catbox.moe/4oa6mt.mp3",
 "😭": "https://files.catbox.moe/5zz1or.mp3",
 "😡": "https://files.catbox.moe/2g5l28.mp3",
 "😒": "https://files.catbox.moe/bk9lzs.mp3",
 "🙄": "https://files.catbox.moe/mq1nas.mp3",
 "😍": "https://files.catbox.moe/jz5zko.mp3",
 "😻": "https://files.catbox.moe/y8ul2j.mp3",
 "😿": "https://files.catbox.moe/tqxemm.mp3",
 "😚": "https://files.catbox.moe/37dqpx.mp3",
 "😆": "https://files.catbox.moe/09mpz2.mp3",
 "🥹": "https://files.catbox.moe/61yy0n.mp4",
 "😩": "https://files.catbox.moe/b4m5aj.mp3",
 "🫣": "https://files.catbox.moe/ttb6hi.mp3",
 "🐸": "https://files.catbox.moe/utl83s.mp3"
};

module.exports.handleEvent = async ({ api, event }) => {
 const { threadID, messageID, body } = event;
 if (!body || body.length > 2) return;

 const emoji = body.trim();
 const audioUrl = emojiAudioMap[emoji];
 if (!audioUrl) return;

 const cacheDir = path.join(__dirname, 'cache');
 if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

 const filePath = path.join(cacheDir, `${encodeURIComponent(emoji)}.mp3`);

 try {
   const response = await axios({
     method: 'GET',
     url: audioUrl,
     responseType: 'stream'
   });

   const writer = fs.createWriteStream(filePath);
   response.data.pipe(writer);

   writer.on('finish', () => {
     api.sendMessage({
       attachment: fs.createReadStream(filePath)
     }, threadID, () => {
       fs.unlink(filePath, (err) => {
         if (err) console.error("Error deleting file:", err);
       });
     }, messageID);
   });

   writer.on('error', (err) => {
     console.error("Error writing file:", err);
     api.sendMessage("ইমুজি দিয়ে লাভ নাই\nযাও মুড়ি খাও জান😘", threadID, messageID);
   });

 } catch (error) {
   console.error("Error downloading audio:", error);
   api.sendMessage("ইমুজি দিয়ে লাভ নাই\nযাও মুড়ি খাও জান😘", threadID, messageID);
 }
};

module.exports.run = () => {};

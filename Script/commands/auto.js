module.exports = {
 config:{
 name: "autodl",
 version: "1.0.3",
 hasPermssion: 0,
 credits: "Tamim",  // Don't change creadit
 description: "auto video download",
 commandCategory: "user",
 usages: "",
 cooldowns: 5,
},
run: async function({ api, event, args }) {},
handleEvent: async function ({ api, event, args }) {
 const axios = require("axios")
 const request = require("request")
 const fs = require("fs-extra")
 const content = event.body ? event.body : '';
 const body = content.toLowerCase();
 const { alldown } = require("shaon-videos-downloader")
 if (body.startsWith("https://")) {
 api.setMessageReaction("⚠️", event.messageID, (err) => {}, true);
const data = await alldown(content);
 console.log(data)
 let Shaon = data.url;
 api.setMessageReaction("☢️", event.messageID, (err) => {}, true);
 const video = (await axios.get(Shaon, {
 responseType: "arraybuffer",
 })).data;
 fs.writeFileSync(__dirname + "/cache/auto.mp4", Buffer.from(video, "utf-8"))

 return api.sendMessage({
 body: `🔥🚀 𝐌𝐑 𝐉𝐔𝐖𝐄𝐋 𝐂𝐡𝐚𝐭 𝐁𝐨𝐱 🔥💻 
📥⚡𝗔𝘂𝘁𝗼 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿⚡📂
🎬 𝐄𝐧𝐣𝐨𝐲 𝐭𝐡𝐞 𝐕𝐢𝐝𝐞𝐨 🎀`,
 attachment: fs.createReadStream(__dirname + "/cache/auto.mp4")

 }, event.threadID, event.messageID);
 }
}
}Bot

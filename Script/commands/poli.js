module.exports.config = {

name: "poli",

version: "1.0.",

hasPermission: 0,

credits: "𝐈𝐬𝐥𝐚𝐦𝐢𝐜𝐤 𝐂𝐲𝐛𝐞𝐫",

description: "generate image from pollination",

commandCategory: "user",

usages: "poli text",

cooldowns: 2,

};

module.exports.run = async ({ api, event, args }) => {

const axios = require('axios');

const fs = require('fs-extra');

let { threadID, messageID } = event;

let query = args.join(" ");

if (!query) return api.sendMessage("put text/query", threadID, messageID);

let path = __dirname + `/cache/poli.png`;

const poli = (await axios.get(`https://image.pollinations.ai/prompt/${query}`, {

responseType: "arraybuffer",

})).data;

fs.writeFileSync(path, Buffer.from(poli, "utf-8"));

api.sendMessage({

body: "Here's your image✨🌺",

attachment: fs.createReadStream(path)

}, threadID, () => fs.unlinkSync(path), messageID);

};

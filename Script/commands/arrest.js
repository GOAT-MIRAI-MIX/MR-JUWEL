module.exports.config = {
 name: "arrest",
 version: "2.1.0",
 hasPermssion: 0,
 credits: "CYBER ☢️_𖣘 -BOT ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 description: "Arrest a friend you mention",
 commandCategory: "tagfun",
 usages: "[mention]",
 cooldowns: 2,
 dependencies: {
 "axios": "",
 "fs-extra": "",
 "path": "",
 "jimp": ""
 }
};

module.exports.onLoad = async () => {
 const { resolve } = global.nodemodule["path"];
 const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
 const { downloadFile } = global.utils;
 const dirMaterial = __dirname + `/cache/canvas/`;
 const path = resolve(__dirname, 'cache/canvas', 'batgiam.png');
 const fallbackAvatar = resolve(__dirname, 'cache/canvas', 'default_avatar.png');

 if (!existsSync(dirMaterial)) mkdirSync(dirMaterial, { recursive: true });

 
 if (!existsSync(path)) {
 await downloadFile("https://i.imgur.com/ep1gG3r.png", path);
 }

 
 if (!existsSync(fallbackAvatar)) {
 await downloadFile("https://i.imgur.com/u7b9H4F.png", fallbackAvatar); // Example fallback avatar
 }
};

async function makeImage({ one, two }) {
 const fs = global.nodemodule["fs-extra"];
 const path = global.nodemodule["path"];
 const axios = global.nodemodule["axios"];
 const jimp = global.nodemodule["jimp"];
 const __root = path.resolve(__dirname, "cache", "canvas");
 const fallbackAvatar = path.resolve(__root, "default_avatar.png");

 let batgiam_img = await jimp.read(__root + "/batgiam.png");

 const randomID = Math.floor(Math.random() * 999999);
 let pathImg = `${__root}/batgiam_${randomID}.png`;
 let avatarOne = `${__root}/avt_${one}_${randomID}.png`;
 let avatarTwo = `${__root}/avt_${two}_${randomID}.png`;

 // Public profile picture (tokenless)
 const avatarUrlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512`;
 const avatarUrlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512`;

 // Try download, use fallback if fail
 try {
 const getAvatarOne = (await axios.get(avatarUrlOne, { responseType: 'arraybuffer' })).data;
 fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, 'utf-8'));
 } catch (e) {
 fs.copyFileSync(fallbackAvatar, avatarOne);
 }

 try {
 const getAvatarTwo = (await axios.get(avatarUrlTwo, { responseType: 'arraybuffer' })).data;
 fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, 'utf-8'));
 } catch (e) {
 fs.copyFileSync(fallbackAvatar, avatarTwo);
 }

 let circleOne = await jimp.read(await circle(avatarOne));
 let circleTwo = await jimp.read(await circle(avatarTwo));

 batgiam_img.resize(500, 500)
 .composite(circleOne.resize(100, 100), 375, 9)
 .composite(circleTwo.resize(100, 100), 160, 92);

 let raw = await batgiam_img.getBufferAsync("image/png");
 fs.writeFileSync(pathImg, raw);

 fs.unlinkSync(avatarOne);
 fs.unlinkSync(avatarTwo);

 return pathImg;
}

async function circle(image) {
 const jimp = require("jimp");
 image = await jimp.read(image);
 image.circle();
 return await image.getBufferAsync("image/png");
}

module.exports.run = async function ({ event, api, args }) {
 const fs = global.nodemodule["fs-extra"];
 const { threadID, messageID, senderID } = event;

 if (!event.mentions || Object.keys(event.mentions).length === 0)
 return api.sendMessage("বলদ একজনকে ট্যাগ করতে হবে 🌚🌝", threadID, messageID);

 var mention = Object.keys(event.mentions)[0];
 let tag = event.mentions[mention].replace("@", "");
 var one = senderID, two = mention;

 return makeImage({ one, two }).then(path =>
 api.sendMessage({
 body: `হালা মুরগী চোর তোরে আজকে হাতে নাতে ধরছি পালাবি কই 😹🕵️‍♂️\n=> ${tag}`,
 mentions: [{
 tag: tag,
 id: mention
 }],
 attachment: fs.createReadStream(path)
 }, threadID, () => fs.unlinkSync(path), messageID));
};
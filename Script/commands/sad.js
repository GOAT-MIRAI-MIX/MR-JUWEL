module.exports.config = {
 name: "sad",
 version: "1.0.0",
 hasPermssion: 2,
 credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 description: "hot video",
 commandCategory: "admin",
 usages: "horny vedio",
 cooldowns: 5,
 dependencies: {
 request: '',
 "fs-extra": '',
 axios: ''
 }
};

module.exports.run = async function({ api, event }) {
 const request = global.nodemodule["request"];
 const fs = global.nodemodule["fs-extra"];
var videoLinks = [
"https://drive.google.com/uc?export=download&id=10srxhZa-VS6dQPZUEKbjBHFe9cibWwEA",
"https://drive.google.com/uc?export=download&id=1Z9wmpUoOEcSFcBAz4hpTyON2RqajW9rg",
"https://drive.google.com/uc?export=download&id=1XcwsrCgJ3YYv1SUgJQeU9jDLeSbn_alt",
"
"https://drive.google.com/uc?export=download&id=1O6qyK_uscxXNOittXT4L7TM-xJ7QYuX4",
];
 

 const path = __dirname + "/cache/hotvideo.mp4";
 const randomLink = videoLinks[Math.floor(Math.random() * videoLinks.length)];

 request(encodeURI(randomLink))
 .pipe(fs.createWriteStream(path))
 .on("close", () => {
 api.sendMessage({
 body: "My hero Kingdom of heaven ✡️",
 attachment: fs.createReadStream(path)
 }, event.threadID, () => fs.unlinkSync(path));
 });
};

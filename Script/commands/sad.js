module.exports.config = {
 name: "sad",
 version: "1.0.0",
 hasPermssion: 2,
 credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 description: "sad video",
 commandCategory: "admin",
 usages: "sad vedio",
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
"https://drive.google.com/uc?export=download&id=1pcjJ_W_obE6DaKK9dDOQkrzaMbMHmvBY",
"https://drive.google.com/uc?export=download&id=1am3rLEJMo66XVoLMt0q5r96jBcDfvaQb",
"https://drive.google.com/uc?export=download&id=1NxSHGy5aajQRgYGYGNcOP5tH2rauYZx4",
"https://drive.google.com/uc?export=download&id=1YQ5cmJUorqeV0AyvkCrnukpKEtvSg1ot",
"https://drive.google.com/uc?export=download&id=12zDJK1pDyBgZ0s4StxFGwOjMxrJECmew",

];
 

 const path = __dirname + "/cache/hotvideo.mp4";
 const randomLink = videoLinks[Math.floor(Math.random() * videoLinks.length)];

 request(encodeURI(randomLink))
 .pipe(fs.createWriteStream(path))
 .on("close", () => {
 api.sendMessage({
 body: "boy sad video😌",
 attachment: fs.createReadStream(path)
 }, event.threadID, () => fs.unlinkSync(path));
 });
};

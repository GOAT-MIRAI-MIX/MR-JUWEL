const fs = require('fs');
const request = require("request");
module.exports.config = {
 'name': "noti2",
 'version': "1.0.0",
 'hasPermssion': 0x2,
 'credits': "MAHBUB SHAON",
 'description': '',
 'commandCategory': "sandnoto",
 'usages': "[msg]",
 'cooldowns': 0x5
};
let atmDir = [];
const getAtm = (_0x256b0d, _0x25051b) => new Promise(async _0x504b5d => {
 let _0x39037f = {
 body: _0x25051b
 };
 let _0x6fb239 = [];
 for (let _0x3a401f of _0x256b0d) {
 await new Promise(async _0x25cb60 => {
 try {
 let _0x4f3f27 = await request.get(_0x3a401f.url);
 let _0x582438 = _0x4f3f27.uri.pathname;
 let _0x25bbb7 = _0x582438.substring(_0x582438.lastIndexOf('.') + 1);
 let _0x4b5597 = __dirname + ("/cache/" + _0x3a401f.filename + '.' + _0x25bbb7);
 _0x4f3f27.pipe(fs.createWriteStream(_0x4b5597)).on("close", () => {
 _0x6fb239.push(fs.createReadStream(_0x4b5597));
 atmDir.push(_0x4b5597);
 _0x25cb60();
 });
 } catch (_0x3b31c5) {
 console.log(_0x3b31c5);
 }
 });
 }
 _0x39037f.attachment = _0x6fb239;
 _0x504b5d(_0x39037f);
});
module.exports.handleReply = async function ({
 api: _0x1cda31,
 event: _0x218c1b,
 handleReply: _0x2b1045,
 Users: _0x7741bf,
 Threads: _0x39b81e
}) {
 const {
 threadID: _0x2c3393,
 messageID: _0x1072ac,
 senderID: _0x8b2908,
 body: _0x32e73c
 } = _0x218c1b;
 let _0x509b63 = await _0x7741bf.getNameUser(_0x8b2908);
 switch (_0x2b1045.type) {
 case "sendnoti":
 {
 let _0x10c0a6 = "== User Reply ==\n\n『Reply』 : " + _0x32e73c + "\n\n\nUser Name " + _0x509b63 + " \nFrom Group " + ((await _0x39b81e.getInfo(_0x2c3393)).threadName || "Unknow");
 if (_0x218c1b.attachments.length > 0) {
 _0x10c0a6 = await getAtm(_0x218c1b.attachments, "== User Reply ==\n\n『Reply』 : " + _0x32e73c + "\n\n\nUser Name: " + _0x509b63 + " \nFrom Group " + ((await _0x39b81e.getInfo(_0x2c3393)).threadName || "Unknow"));
 }
 _0x1cda31.sendMessage(_0x10c0a6, _0x2b1045.threadID, (_0x516df4, _0x31f2df) => {
 atmDir.forEach(_0x4de0f3 => fs.unlinkSync(_0x4de0f3));
 atmDir = [];
 global.client.handleReply.push({
 'name': this.config.name,
 'type': "reply",
 'messageID': _0x31f2df.messageID,
 'messID': _0x1072ac,
 'threadID': _0x2c3393
 });
 });
 break;
 }
 case "reply":
 {
 let _0x1d62c6 = "𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍\n•┄┅═════❁🌺❁═════┅┄•\n\n｢𝐌𝐄𝐒𝐒𝐀𝐆𝐄｣ : " + _0x32e73c + "\n\n\n｢𝗔𝗗𝗠𝗜𝗡 ｣ " + _0x509b63 + "\n\n•┄┅═════❁🌺❁═════┅┄• আপনি যদি এডমিন এর সঙ্গে কথা বলতে চান। তাইলে অবশ্যই মেসেজের রিপ্লাই দিয়া মেসেজ করো। আমি তা এডিমন এর কাছে পৌঁছে দিবো আর সরাসরি এডমিন সাথে কথা বলতে চাইলে এডমিন কে নক করতে পারেন এডমিনের আইডি fb.com/mrjuwel2025";
 if (_0x218c1b.attachments.length > 0) {
 _0x1d62c6 = await getAtm(_0x218c1b.attachments, _0x32e73c + " 𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍 \n•┄┅═════❁🌺❁═════┅┄•\n\n 𝐀𝐃𝐌𝐈𝐍 " + _0x509b63 + "\n\n•┄┅═════❁🌺❁═════┅┄• আপনি যদি এডমিন এর সঙ্গে কথা বলতে চান। তাইলে অবশ্যই মেসেজের রিপ্লাই দিয়া মেসেজ করো। আমি তা এডিমন এর কাছে পৌঁছে দিবো. আর সরাসরি এডমিন সাথে কথা বলতে চাইলে এডমিন কে নক করতে পারেন এডমিনের আইডি fb.com/mrjuwel2025");
 }
 _0x1cda31.sendMessage(_0x1d62c6, _0x2b1045.threadID, (_0x22a99a, _0xf02cc1) => {
 atmDir.forEach(_0x4d34da => fs.unlinkSync(_0x4d34da));
 atmDir = [];
 global.client.handleReply.push({
 'name': this.config.name,
 'type': "sendnoti",
 'messageID': _0xf02cc1.messageID,
 'threadID': _0x2c3393
 });
 }, _0x2b1045.messID);
 break;
 }
 }
};
module.exports.run = async function ({
 api: _0x34fc69,
 event: _0x5cd554,
 args: _0x316999,
 Users: _0x56ade5
}) {
 const {
 threadID: _0x5206b2,
 messageID: _0x48b91c,
 senderID: _0x4b2640,
 messageReply: _0x415c8b
 } = _0x5cd554;
 if (!_0x316999[0]) {
 return _0x34fc69.sendMessage("Please input message", _0x5206b2);
 }
 let _0x20cecf = global.data.allThreadID || [];
 let _0x56a425 = 0;
 let _0x55b9ed = 0;
 let _0x2548b1 = "𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍\n•┄┅═════❁🌺❁═════┅┄•\n\n𝐌𝐀𝐒𝐒𝐀𝐆𝐄: " + _0x316999.join(" ") + "\n\n𝗔𝗗𝗠𝗜𝗡 𝗡𝗔𝗠𝗘: " + (await _0x56ade5.getNameUser(_0x4b2640)) + " ";
 if (_0x5cd554.type == "message_reply") {
 _0x2548b1 = await getAtm(_0x415c8b.attachments, "𝐌𝐀𝐒𝐒𝐀𝐆𝐄 𝐅𝐑𝐎𝐌 𝐀𝐃𝐌𝐈𝐍\n•┄┅═════❁🌺❁═════┅┄•\n𝐌𝐀𝐒𝐒𝐀𝐆𝐄: " + _0x316999.join(" ") + "\n\n𝗔𝗗𝗠𝗜𝗡 𝗡𝗔𝗠𝗘: " + (await _0x56ade5.getNameUser(_0x4b2640)));
 }
 await new Promise(_0x23b092 => {
 _0x20cecf.forEach(_0x5e1f39 => {
 try {
 _0x34fc69.sendMessage(_0x2548b1, _0x5e1f39, (_0x133974, _0x2e5a77) => {
 if (_0x133974) {
 _0x55b9ed++;
 } else {
 _0x56a425++;
 atmDir.forEach(_0x4e3200 => fs.unlinkSync(_0x4e3200));
 atmDir = [];
 global.client.handleReply.push({
 'name': this.config.name,
 'type': "sendnoti",
 'messageID': _0x2e5a77.messageID,
 'messID': _0x48b91c,
 'threadID': _0x5206b2
 });
 _0x23b092();
 }
 });
 } catch (_0x1c8fd3) {
 console.log(_0x1c8fd3);
 }
 });
 });
 _0x34fc69.sendMessage("Send to " + _0x56a425 + " thread, not send to " + _0x55b9ed + " thread", _0x5206b2);
};

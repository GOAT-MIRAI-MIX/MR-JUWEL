module.exports.config = {
 'name': "setbot",
 'version': "1.0.3",
 'hasPermssion': 0x2,
 'credits': "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 'description': "Command Prompt",
 'commandCategory': "utilities",
 'cooldowns': 0x5,
 'dependencies': {
 'axios': ''
 }
};
module.exports.languages = {
 'vi': {
 'returnResult': "Đây là kết quả phù hợp: \n",
 'returnNull': "Không tìm thấy kết quả dựa vào tìm kiếm của bạn!"
 },
 'en': {
 'returnResult': "This is your result: \n",
 'returnNull': "There is no result with your input!"
 }
};
module.exports.handleEvent = async function ({
 api: _0x13c802,
 event: _0x31f269,
 args: _0x52146d,
 Users: _0x33564d,
 Threads: _0x5cd50f
}) {
 const _0x5753a7 = require("moment-timezone");
 var _0x560be2 = _0x5753a7.tz("Asia/Dhaka").format("hh:mm:ss");
 var _0xa1aae5 = global.config.ADMINBOT;
 var _0x2868ee = _0x5753a7.tz("Asia/Dhaka").format('ss');
 if (_0x560be2 == "12:00:" + _0x2868ee && _0x2868ee < 6) {
 for (let _0x124d24 of _0xa1aae5) setTimeout(() => _0x13c802.sendMessage("〉Now: " + _0x560be2 + "\n[❗] Bot will proceed to restart !", _0x124d24, () => process.exit(1)), 1000);
 }
};
module.exports.run = async function ({
 api: _0x2e168c,
 event: _0xd967bd,
 getText: _0x48c22f,
 args: _0x1d5764
}) {
 if (!_0x1d5764[0]) {
 return _0x2e168c.sendMessage("🛠 | Here are the bot's full settings | 🛠\n=== Manage Settings ===\n[1] Prefix.\n[2] Bot name.\n[3] List of Admins.\n[4] Language.\n[5] Auto-restart.\n=== Operations Management ===\n[6] Check for updates.\n[7] Get the list of banned users.\n[8] Get the list of banned groups.\n[9] Send notifications to all groups.\n[10]. Search UID through username.\n[11]. Search box TID by box name\n[12]. Change emoji box\n[13]. Rename the box\n[14]. View info box\n-> To choose, reply to this message with <-", _0xd967bd.threadID, (_0x20de0d, _0x3abf68) => {
 global.client.handleReply.push({
 'name': this.config.name,
 'messageID': _0x3abf68.messageID,
 'author': _0xd967bd.senderID,
 'type': "choose"
 });
 }, _0xd967bd.messageID);
 }
};
module.exports.handleReply = async function ({
 api: _0x1e262b,
 event: _0x4db658,
 client: _0x46f372,
 handleReply: _0x1f5e31,
 Currencies: _0x3db0be,
 Users: _0x581ec7,
 Threads: _0x592afa
}) {
 const {
 userName: _0x59ca18
 } = global.data;
 const {
 writeFileSync: _0x2978be,
 readFileSync: _0x394b7f
 } = global.nodemodule["fs-extra"];
 const _0x1cc464 = [];
 l = 1;
 switch (_0x1f5e31.type) {
 case "choose":
 switch (_0x4db658.body) {
 case '1':
 return _0x1e262b.sendMessage("The bot's preset is : " + global.config.PREFIX, _0x4db658.threadID, _0x4db658.messageID);
 case '2':
 return _0x1e262b.sendMessage("The bot's name is : " + global.config.BOTNAME, _0x4db658.threadID, _0x4db658.messageID);
 case '3':
 {
 const _0x5d5540 = global.config.ADMINBOT || [];
 var _0x28f0df = [];
 for (const _0xbc8b38 of _0x5d5540) if (parseInt(_0xbc8b38)) {
 const _0x272279 = _0x59ca18.get(_0xbc8b38) || (await _0x581ec7.getNameUser(_0xbc8b38));
 _0x28f0df.push(_0x272279 + " - " + _0xbc8b38);
 }
 return _0x1e262b.sendMessage("[Admin] List of all bot operators: \n\n" + _0x28f0df.join("\n"), _0x4db658.threadID, _0x4db658.messageID);
 }
 case '4':
 if ('vi' == global.config.language) {
 return _0x1e262b.sendMessage("Language: Vietnamese", _0x4db658.threadID, _0x4db658.messageID);
 }
 if ('en' == global.config.language) {
 _0x1e262b.sendMessage("Language : English", _0x4db658.threadID, _0x4db658.messageID);
 }
 break;
 case '5':
 return _0x1e262b.sendMessage("Bot will restart at 12hours", _0x4db658.threadID, _0x4db658.messageID);
 case '6':
 return _0x1e262b.sendMessage("Currently bot is in version : " + global.config.version, _0x4db658.threadID, _0x4db658.messageID);
 case '7':
 {
 const _0xca1d38 = global.data.userBanned.keys();
 for (const _0x523076 of _0xca1d38) {
 const _0x3b677d = global.data.userName.get(_0x523076) || (await _0x581ec7.getNameUser(_0x523076));
 _0x1cc464.push(l++ + ". " + _0x3b677d + " \nUID: " + _0x523076);
 }
 return _0x1e262b.sendMessage("Currently available " + _0x1cc464.length + " users get banned\n\n" + _0x1cc464.join("\n") + "\n\n", _0x4db658.threadID);
 }
 case '8':
 {
 const _0x405660 = global.data.threadBanned.keys();
 for (const _0x1668e9 of _0x405660) {
 nameT = (await global.data.threadInfo.get(_0x1668e9).threadName) || "Name does not exist";
 _0x1cc464.push(l++ + ". " + nameT + "\nTID: " + _0x1668e9);
 return _0x1e262b.sendMessage("Currently available " + _0x1cc464.length + " banned group\n\n" + _0x1cc464.join("\n") + "\n\n", _0x4db658.threadID);
 }
 }
 break;
 case '9':
 return _0x1e262b.sendMessage("Reply to this message to enter the message you want to send to the groups", _0x4db658.threadID, (_0x4acbbe, _0x128f33) => {
 global.client.handleReply.push({
 'name': this.config.name,
 'messageID': _0x128f33.messageID,
 'author': _0x4db658.senderID,
 'type': "sendnoti"
 });
 }, _0x4db658.messageID);
 case '10':
 return _0x1e262b.sendMessage("Reply to this message to enter username", _0x4db658.threadID, (_0x12fb41, _0x405130) => {
 global.client.handleReply.push({
 'name': this.config.name,
 'messageID': _0x405130.messageID,
 'author': _0x4db658.senderID,
 'type': "getuid"
 });
 }, _0x4db658.messageID);
 case '11':
 return _0x1e262b.sendMessage("Reply to this message to enter the box name", _0x4db658.threadID, (_0x6c03a0, _0xeb5e3e) => {
 global.client.handleReply.push({
 'name': this.config.name,
 'messageID': _0xeb5e3e.messageID,
 'author': _0x4db658.senderID,
 'type': "gettidbox"
 });
 }, _0x4db658.messageID);
 case '12':
 return _0x1e262b.sendMessage("Reply to this message to enter the emoji you want to change", _0x4db658.threadID, (_0xfd507a, _0x2e63f7) => {
 global.client.handleReply.push({
 'name': this.config.name,
 'messageID': _0x2e63f7.messageID,
 'author': _0x4db658.senderID,
 'type': "emojibox"
 });
 }, _0x4db658.messageID);
 case '13':
 return _0x1e262b.sendMessage("Reply to this message to enter the box name to change", _0x4db658.threadID, (_0x18e4e9, _0x5b7f21) => {
 global.client.handleReply.push({
 'name': this.config.name,
 'messageID': _0x5b7f21.messageID,
 'author': _0x4db658.senderID,
 'type': "namebox"
 });
 }, _0x4db658.messageID);
 case '14':
 {
 require("request");
 let _0x9b710c = await _0x1e262b.getThreadInfo(_0x4db658.threadID);
 _0x9b710c.participantIDs.length;
 let _0x3ec76b = _0x9b710c.participantIDs.length;
 var _0x3bb6e1 = [];
 var _0x6bf41b = [];
 var _0x1e4eac = [];
 for (let _0x38c205 in _0x9b710c.userInfo) {
 var _0x13b727 = _0x9b710c.userInfo[_0x38c205].gender;
 var _0x43b6dc = _0x9b710c.userInfo[_0x38c205].name;
 if ("MALE" == _0x13b727) {
 _0x3bb6e1.push(_0x38c205 + _0x13b727);
 } else if ("FEMALE" == _0x13b727) {
 _0x6bf41b.push(_0x13b727);
 } else {
 _0x1e4eac.push(_0x43b6dc);
 }
 }
 var _0x565806 = _0x3bb6e1.length;
 var _0x217334 = _0x6bf41b.length;
 let _0xcd3022 = _0x9b710c.adminIDs.length;
 let _0x3cc478 = _0x9b710c.messageCount;
 _0x9b710c.nicknames;
 let _0x225cff = _0x9b710c.emoji;
 let _0x2796e5 = _0x9b710c.threadName;
 let _0x571a61 = _0x9b710c.threadID;
 let _0x33e26d = _0x9b710c.approvalMode;
 var _0x1a6cc7 = 0 == _0x33e26d ? "Turn off" : 1 == _0x33e26d ? "Turn on" : 'Kh';
 _0x1e262b.sendMessage("✨Name: " + _0x2796e5 + "\n🤖 ID Box: " + _0x571a61 + "\n👀 Approve: " + _0x1a6cc7 + "\n🧠 Emoji: " + _0x225cff + "\n👉 Information: including " + _0x3ec76b + " member\n👦Male : " + _0x565806 + " member\n👩‍🦰\nFemale: " + _0x217334 + " member\nWith " + _0xcd3022 + " administrators\n🕵️‍♀️ Total number of messages: " + _0x3cc478 + " tin.\n", _0x4db658.threadID);
 }
 }
 break;
 case "sendnoti":
 {
 var _0x3ad798 = global.data.allThreadID || [];
 let _0x4ca3b6 = await _0x581ec7.getNameUser(_0x4db658.senderID);
 var _0x65d4d4 = 1;
 var _0x49a57d = [];
 for (const _0x20f8ed of _0x3ad798) if (!(isNaN(parseInt(_0x20f8ed)) || _0x20f8ed == _0x4db658.threadID)) {
 _0x1e262b.sendMessage("Notice from admin " + _0x4ca3b6 + " \n\n" + _0x4db658.body, _0x20f8ed, (_0x110f83, _0xccdf13) => {
 if (_0x110f83) {
 _0x49a57d.push(_0x20f8ed);
 }
 });
 _0x65d4d4++;
 await new Promise(_0x3005fc => setTimeout(_0x3005fc, 500));
 }
 return _0x1e262b.sendMessage("Successfully sent to : " + _0x65d4d4 + " the group\n\nFailure " + _0x49a57d.length + " the group", _0x4db658.threadID, _0x4db658.messageID);
 }
 case "getuid":
 _0x1e262b.getUserID('' + _0x4db658.body, (_0x4f3f00, _0x417060) => {
 var _0xf6b0fe = [];
 for (var _0x5bd901 in _0x417060) _0xf6b0fe += "Name : " + _0x417060[_0x5bd901].name + "\nUID : " + _0x417060[_0x5bd901].userID + "\n\n";
 return _0x1e262b.sendMessage(_0xf6b0fe, _0x4db658.threadID);
 });
 break;
 case "gettidbox":
 try {
 const _0x3e6a59 = _0x4db658.body || '';
 const _0x4a1e8f = (await _0x592afa.getAll(["threadID", "threadInfo"])).filter(_0x5a2bd9 => !!_0x5a2bd9.threadInfo);
 var _0x3ca4e5 = [];
 var _0x169b80 = '';
 var _0x3d6821 = 0;
 _0x4a1e8f.forEach(_0xb485db => {
 if ((_0xb485db.threadInfo.threadName || '').toLowerCase().includes(_0x3e6a59.toLowerCase())) {
 _0x3ca4e5.push({
 'name': _0xb485db.threadInfo.threadName,
 'id': _0xb485db.threadID
 });
 }
 });
 _0x3ca4e5.forEach(_0x1270a5 => _0x169b80 += "\n" + (_0x3d6821 += 1) + ". " + _0x1270a5.name + " - " + _0x1270a5.id);
 if (_0x3ca4e5.length > 0) {
 _0x1e262b.sendMessage("Result of search : " + _0x169b80, _0x4db658.threadID);
 } else {
 _0x1e262b.sendMessage("Not found", _0x4db658.threadID, _0x4db658.messageID);
 }
 } catch (_0x401164) {
 return _0x1e262b.sendMessage(_0x401164, _0x4db658.threadID);
 }
 break;
 case "namebox":
 try {
 _0x1e262b.setTitle('' + _0x4db658.body, _0x4db658.threadID, _0x4db658.messageID);
 return _0x1e262b.sendMessage("Changed the box name to " + _0x4db658.body, _0x4db658.threadID);
 } catch (_0x5dfeec) {
 return _0x1e262b.sendMessage("Error! An error occurred. Please try again later", _0x4db658.threadID);
 }
 break;
 case "emojibox":
 try {
 _0x1e262b.changeThreadEmoji(_0x4db658.body, _0x4db658.threadID, () => _0x1e262b.sendMessage("🔨 The bot successfully changed Emoji to: " + _0x4db658.body, _0x4db658.threadID, _0x4db658.messageID));
 } catch (_0x153b96) {
 _0x1e262b.sendMessage("Error! An error occurred. Please try again later", _0x4db658.threadID);
 }
 }
};
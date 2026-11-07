module.exports.config = {
 'name': 'say',
 'version': "1.0.1",
 'hasPermssion': 0x0,
 'credits': "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
 'description': "Make the bot return google's audio file via text",
 'commandCategory': "media",
 'usages': "[bn] [Text]",
 'cooldowns': 0x5,
 'dependencies': {
 'path': '',
 'fs-extra': ''
 }
};
module.exports.run = async function ({
 api: _0x5cee6f,
 event: _0x6b558b,
 args: _0x5c8dc1
}) {
 try {
 const {
 createReadStream: _0x19316d,
 unlinkSync: _0x1b899a
 } = global.nodemodule["fs-extra"];
 const {
 resolve: _0x1b6f6e
 } = global.nodemodule.path;
 var _0x50a304 = _0x6b558b.type == "message_reply" ? _0x6b558b.messageReply.body : _0x5c8dc1.join(" ");
 var _0x173460 = ['bn'].some(_0x657a78 => _0x50a304.indexOf(_0x657a78) == 0) ? _0x50a304.slice(0, _0x50a304.indexOf(" ")) : global.config.language;
 var _0xa243c2 = _0x173460 != global.config.language ? _0x50a304.slice(3, _0x50a304.length) : _0x50a304;
 const _0x5e6854 = _0x1b6f6e(__dirname, "cache", _0x6b558b.threadID + '_' + _0x6b558b.senderID + ".mp3");
 await global.utils.downloadFile("https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(_0xa243c2) + "&tl=bn&client=tw-ob", _0x5e6854);
 return _0x5cee6f.sendMessage({
 'attachment': _0x19316d(_0x5e6854)
 }, _0x6b558b.threadID, () => _0x1b899a(_0x5e6854));
 } catch (_0x1008a6) {
 return console.log(_0x1008a6);
 }
 ;
};
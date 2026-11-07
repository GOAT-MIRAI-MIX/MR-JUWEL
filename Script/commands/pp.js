module.exports.config = {
    name: "pp",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Lấy ID người dùng và tên.",
    commandCategory: "Công cụ",
    cooldowns: 0
};

module.exports.run = async function({ event, api, args, client, Currencies, Users, utils }) {
    const fs = global.nodemodule["fs-extra"];
    const request = global.nodemodule["request"];
    const axios = global.nodemodule['axios']; 
    let uid;
    let name;

    if (event.type == "message_reply") { 
        uid = event.messageReply.senderID;
        name = await Users.getNameUser(uid);
    } else if (!args[0]) {
        uid = event.senderID;
        name = await Users.getNameUser(uid);
    } else if (args[0].indexOf(".com/") !== -1) {
        const res_ID = await api.getUID(args[0]);
        const userData = await api.getUserInfoV2(res_ID);
        uid = res_ID;
        name = userData[res_ID].name;
    } else if (args.join().indexOf('@') !== -1) {
        uid = Object.keys(event.mentions)[0];
        name = await Users.getNameUser(uid);
    }

    if (!uid) {
        return api.sendMessage("Không tìm thấy người dùng!", event.threadID, event.messageID);
    }

    var callback = () => api.sendMessage({ 
        body: `== Profile ==\nTên: ${name}\nID: ${uid}`, 
        attachment: fs.createReadStream(__dirname + "/cache/1.png")
    }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"), event.messageID);

    request(encodeURI(`https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`))
        .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
        .on('close', () => callback());
};

module.exports.config = {
    name: "fbpost",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "CYBER BOT TEAM • Fixed by JUWEL",
    description: "Facebook style post generator",
    commandCategory: "Edit-img",
    usages: "fbpost <text>",
    cooldowns: 5,
    dependencies: { "canvas": "", "axios": "", "jimp": "" }
};

module.exports.circle = async (image) => {
    const jimp = global.nodemodule["jimp"];
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}

module.exports.wrapText = (ctx, text, maxWidth) => {
    return new Promise(resolve => {
        if (ctx.measureText(text).width < maxWidth) return resolve([text]);
        const words = text.split(" ");
        const lines = [];
        let line = "";

        while (words.length > 0) {
            if (ctx.measureText(line + words[0]).width < maxWidth) {
                line += words.shift() + " ";
            } else {
                lines.push(line.trim());
                line = "";
            }
            if (words.length === 0) lines.push(line.trim());
        }
        resolve(lines);
    });
};

module.exports.run = async function ({ api, event, args }) {

    const { loadImage, createCanvas } = require("canvas");
    const axios = require("axios");
    const fs = require("fs-extra");

    let text = args.join(" ");
    if (!text) return api.sendMessage(`❗Usage: fbpost <text>`, event.threadID, event.messageID);

    const user = await api.getUserInfoV2(event.senderID);

    // File path
    let avatarPath = __dirname + "/cache/avt.png";
    let templatePath = __dirname + "/cache/template.png";

    // Download avatar
    const avatar = (await axios.get(user.avatar, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(avatarPath, Buffer.from(avatar, "utf-8"));

    // Make circle avatar
    let circleAvatar = await this.circle(avatarPath);

    // Download template image
    const template = (await axios.get("https://i.imgur.com/VrcriZF.jpg", { responseType: "arraybuffer" })).data;
    fs.writeFileSync(templatePath, Buffer.from(template, "utf-8"));

    // Load images
    let base = await loadImage(templatePath);
    let ava = await loadImage(circleAvatar);

    // Create canvas
    let canvas = createCanvas(base.width, base.height);
    let ctx = canvas.getContext("2d");

    // Draw template
    ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

    // Draw profile photo
    ctx.drawImage(ava, 17, 17, 104, 104);

    // Name
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText(user.name, 130, 60);

    // Post text
    ctx.font = "500 40px Arial";
    let lines = await this.wrapText(ctx, text, 650);
    ctx.fillText(lines.join("\n"), 30, 170);

    // Export
    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(templatePath, imageBuffer);

    // Send
    return api.sendMessage(
        { attachment: fs.createReadStream(templatePath) },
        event.threadID,
        () => {
            fs.unlinkSync(templatePath);
            fs.unlinkSync(avatarPath);
        },
        event.messageID
    );
};

module.exports.config = {
  name: "qr",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "rX Abdullah",
  description: "Generate styled QR code from text (clean red/pink theme)",
  commandCategory: "user",
  usages: "[text]",
  cooldowns: 5,
  dependencies: {
    "qrcode": "",
    "jimp": "",
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
  const QRCode = global.nodemodule["qrcode"];
  const Jimp = global.nodemodule["jimp"];
  const text = args.join(" ");

  if (!text)
    return api.sendMessage(
      "❌ Please enter some text to generate QR!",
      event.threadID,
      event.messageID
    );

  const qrPath = __dirname + "/cache/qr.png";
  const finalPath = __dirname + "/cache/love_qr.png";

  try {
    // 🔴 Generate red-pink QR
    await QRCode.toFile(qrPath, text, {
      errorCorrectionLevel: "H",
      type: "image/png",
      color: {
        dark: "#FF0000", // Red dots
        light: "#FFF0F5" // Light pink background
      },
      scale: 10,
      margin: 2
    });

    // 🩷 Load QR & create border
    const qrImage = await Jimp.read(qrPath);
    const frameWidth = qrImage.bitmap.width + 100;
    const frameHeight = qrImage.bitmap.height + 100;
    const frame = new Jimp(frameWidth, frameHeight, "#ffffff");

    // Center QR on white frame
    frame.composite(qrImage, 50, 50);

    // Add soft pink overlay (light romantic tone)
    const overlay = new Jimp(frameWidth, frameHeight, "#ffb6c180");
    frame.composite(overlay, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.15
    });

    // Save & send
    await frame.writeAsync(finalPath);

    api.sendMessage(
      {
        body: "💖 Here's your QR code!",
        attachment: createReadStream(finalPath)
      },
      event.threadID,
      () => {
        unlinkSync(qrPath);
        unlinkSync(finalPath);
      },
      event.messageID
    );
  } catch (e) {
    console.error(e);
    api.sendMessage("⚠️ Error generating QR code!", event.threadID, event.messageID);
  }
};

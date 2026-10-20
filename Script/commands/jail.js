const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const request = require('request');

module.exports.config = {
  name: "jail",
  version: "8.0",
  hasPermssion: 0,
  credits: "MOHAMMAD AKASH",
  description: "Wanted poster with thin bars (clear view)",
  commandCategory: "fun",
  usages: "@tag or reply",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  let uid, name = "WANTED";

  // === Target User Detect ===
  if (Object.keys(mentions).length > 0) {
    uid = Object.keys(mentions)[0];
    name = mentions[uid].replace("@", "");
  } else if (type === "message_reply") {
    uid = messageReply.senderID;
  } else {
    uid = senderID;
  }

  try {
    name = await Users.getNameUser(uid);
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const avatarPath = path.join(cacheDir, `wanted_avatar_${uid}.jpg`);
    const outputPath = path.join(cacheDir, `wanted_output_${Date.now()}.png`);

    const imageUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    // === Download Avatar ===
    const download = (url, dest, cb) => {
      request(encodeURI(url))
        .pipe(fs.createWriteStream(dest))
        .on("close", cb)
        .on("error", () => {
          const fallback = "https://i.imgur.com/8Q2Z3tI.png";
          request(encodeURI(fallback))
            .pipe(fs.createWriteStream(dest))
            .on("close", cb);
        });
    };

    download(imageUrl, avatarPath, async () => {
      try {
        const wantedPath = await generateWantedPoster(avatarPath, name);
        api.sendMessage({
          body: `@${name} WANTED! 🔒 Locked Up!`,
          mentions: [{ tag: name, id: uid }],
          attachment: fs.createReadStream(wantedPath)
        }, threadID, messageID);

        setTimeout(() => {
          [avatarPath, wantedPath].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
        }, 10000);
      } catch (err) {
        console.error(err);
        api.sendMessage("⚠️ Poster তৈরি করা যায়নি!", threadID, messageID);
      }
    });
  } catch (e) {
    console.error("Error:", e);
    return api.sendMessage("⚠️ কিছু সমস্যা হয়েছে, আবার চেষ্টা করো!", threadID, messageID);
  }
};

// === Function: Generate Thin Bars Poster ===
async function generateWantedPoster(avatarPath, name) {
  const avatar = await loadImage(avatarPath);
  const width = 600, height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // WANTED text
  ctx.font = 'bold 100px Arial';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#991b1b';
  ctx.shadowBlur = 20;
  ctx.fillText('WANTED', width / 2, 120);
  ctx.shadowColor = 'transparent';

  // Avatar (Circle)
  const cx = width / 2, cy = height / 2 + 20, r = 200;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Thin Bars
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 20;
  const barCount = 8, spacing = width / (barCount + 1);
  for (let i = 1; i <= barCount; i++) {
    const x = i * spacing;
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x, height - 180);
    ctx.stroke();
  }

  // Horizontal Bars
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(spacing, 260);
  ctx.lineTo(width - spacing, 260);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(spacing, height - 260);
  ctx.lineTo(width - spacing, height - 260);
  ctx.stroke();

  ctx.globalAlpha = 1.0;

  // Locked Up text
  ctx.font = 'italic 50px "Segoe UI"';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#60a5fa';
  ctx.shadowBlur = 20;
  ctx.fillText('Locked Up!', width / 2, height - 100);
  ctx.shadowColor = 'transparent';

  // Name
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(name.toUpperCase(), width / 2, height - 50);

  const outputPath = path.join(__dirname, 'cache', `wanted_thin_${Date.now()}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer());
  return outputPath;
}

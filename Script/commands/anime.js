const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

module.exports.config = {
  name: "anime",
  version: "1.3.0",
  hasPermssion: 0,
  credits: CREDIT,
  description: "Anime Video",
  commandCategory: "Video",
  usages: "anime",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

const LINKS = [
  "https://i.imgur.com/R3ptum9.mp4",
  "https://i.imgur.com/tUed2nt.mp4",
  "https://i.imgur.com/sqHWn6v.mp4",
  "https://i.imgur.com/CU2KBTj.mp4",
  "https://i.imgur.com/en18l6Z.mp4",
  "https://i.imgur.com/FrRANZq.mp4",
  "https://i.imgur.com/GmVN0IA.mp4",
  "https://i.imgur.com/OVjxg39.mp4",
  "https://i.imgur.com/2ZxQMZT.mp4",
  "https://i.imgur.com/35i7fZn.mp4",
  "https://i.imgur.com/h4YJi4u.mp4",
  "https://i.imgur.com/hECxsV2.mp4",
  "https://i.imgur.com/wPNLVdB.mp4",
  "https://i.imgur.com/MLnjK9Z.mp4",
  "https://i.imgur.com/2jlAzWF.mp4",
  "https://i.imgur.com/scTn8LO.mp4",
  "https://i.imgur.com/oZlfcRM.mp4",
  "https://i.imgur.com/yAF2Vv8.mp4"
];

const MOODS = [
  "Anime Mode 🎌",
  "Otaku Vibes 🔥",
  "Senpai Energy 🌸",
  "Epic Fight ⚔️",
  "Kawaii Mood 💖"
];

const MAX_SIZE = 25 * 1024 * 1024; // Messenger লিমিট ~25MB
const MAX_TRIES = 6;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCaption(index, total) {
  return [
    "╭━━━━━━━━━━━━━━━━━━╮",
    "   🎌  𝐀𝐍𝐈𝐌𝐄  𝐕𝐈𝐃𝐄𝐎  🎌",
    "╰━━━━━━━━━━━━━━━━━━╯",
    "",
    `🎬 ভিডিও  : ${index}/${total}`,
    `⚡ মুড       : ${pick(MOODS)}`,
    "",
    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
    `👑 ${CREDIT}`
  ].join("\n");
}

function download(url, dest) {
  return axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 60000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      "Referer": "https://imgur.com/",
      "Accept": "video/mp4,video/*;q=0.9,*/*;q=0.8"
    }
  }).then((res) => {
    const type = String(res.headers["content-type"] || "");
    if (!type.includes("video")) {
      res.data.destroy();
      throw new Error("Not a video (content-type: " + type + ")");
    }

    const len = parseInt(res.headers["content-length"] || "0", 10);
    if (len > MAX_SIZE) {
      res.data.destroy();
      throw new Error("File too large: " + len);
    }

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(dest);
      let received = 0;
      let failed = false;

      const fail = (err) => {
        if (failed) return;
        failed = true;
        try { res.data.destroy(); } catch (e) {}
        try { writer.destroy(); } catch (e) {}
        reject(err);
      };

      res.data.on("data", (chunk) => {
        received += chunk.length;
        if (received > MAX_SIZE) fail(new Error("File too large (stream)"));
      });

      res.data.pipe(writer);
      writer.on("finish", () => { if (!failed) resolve(); });
      writer.on("error", fail);
      res.data.on("error", fail);
    });
  });
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  // প্রতিবার আলাদা ফাইল নাম, যাতে একসাথে অনেকে ব্যবহার করলে ফাইল মিশে না যায়
  const videoPath = path.join(cacheDir, `anime_${Date.now()}_${threadID}.mp4`);

  const cleanup = () => {
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    } catch (e) {
      console.error("[anime] cleanup error:", e.message);
    }
  };

  const waitMsg = await new Promise((resolve) =>
    api.sendMessage("⏳ Anime ভিডিও লোড হচ্ছে, একটু অপেক্ষা করো...", threadID, (err, info) =>
      resolve(err ? null : info)
    )
  );

  // ডাউনলোড ফেল করলে অন্য লিংক দিয়ে আবার চেষ্টা করবে
  const pool = shuffle(LINKS).slice(0, MAX_TRIES);
  let usedUrl = null;

  for (const url of pool) {
    try {
      await download(url, videoPath);
      const size = fs.statSync(videoPath).size;
      if (size > 0 && size <= MAX_SIZE) {
        usedUrl = url;
        break;
      }
      console.error(`[anime] bad file size (${url}): ${size}`);
      cleanup();
    } catch (err) {
      const status = err.response ? ` [HTTP ${err.response.status}]` : "";
      console.error(`[anime] download failed (${url})${status}:`, err.message);
      cleanup();
    }
  }

  if (waitMsg && waitMsg.messageID) {
    try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
  }

  if (!usedUrl) {
    return api.sendMessage(
      `❌ Anime ভিডিও পাঠাতে সমস্যা হয়েছে!\nআবার চেষ্টা করো।\n\n👑 ${CREDIT}`,
      threadID,
      messageID
    );
  }

  const caption = buildCaption(LINKS.indexOf(usedUrl) + 1, LINKS.length);

  api.sendMessage(
    {
      body: caption,
      attachment: fs.createReadStream(videoPath)
    },
    threadID,
    (err) => {
      if (err) console.error("[anime] send error:", err);
      cleanup();
    },
    messageID
  );
};

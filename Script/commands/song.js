const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const COOLDOWN = 2 * 60 * 1000; // ২ মিনিট
const SELECT_TIMEOUT = 20 * 1000; // ২০ সেকেন্ড
const MAX_RESULTS = 5;
const PRELOAD_COUNT = 5; // কতগুলো গান আগে থেকে রেডি করা হবে (সার্ভারে চাপ পড়লে ৩ করো)
const cooldowns = new Map();

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

let apiCache = { url: null, time: 0 };
const ytapi = async () => {
  if (apiCache.url && Date.now() - apiCache.time < 5 * 60 * 1000)
    return apiCache.url;
  const api = await axios.get(
    "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json",
    { timeout: 15000 }
  );
  apiCache = { url: api.data.ytapi, time: Date.now() };
  return apiCache.url;
};

module.exports.config = {
  name: "song",
  aliases: ["music", "songs", "gan"],
  version: "2.2.0",
  credits: CREDIT,
  countDown: 0,
  hasPermssion: 0,
  description: "YouTube music downloader",
  category: "media",
  commandCategory: "media",
  usePrefix: true,
  usages: "{pn} song name"
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const safeUnsend = (api, id) => {
  if (!id) return;
  try {
    const p = api.unsendMessage(id);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
};
const cleanup = files =>
  setTimeout(() => {
    files.forEach(f => {
      try {
        if (f && fs.existsSync(f)) fs.unlinkSync(f);
      } catch (e) {}
    });
  }, 15000);

async function saveToFile(url, file, timeout = 120000) {
  const res = await axios.get(url, { responseType: "stream", timeout });
  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(file);
    res.data.pipe(w);
    w.on("finish", resolve);
    w.on("error", reject);
    res.data.on("error", reject);
  });
}

function getThumb(song) {
  const id = song.videoId || song.id;
  return (
    song.thumbnail ||
    song.thumbnails?.[0]?.url ||
    song.thumb ||
    (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null)
  );
}

function formatLeft(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} মিনিট ${sec} সেকেন্ড` : `${sec} সেকেন্ড`;
}

/* ───────────── গানের সময় ফরম্যাট ───────────── */
function formatDuration(d) {
  if (d === undefined || d === null || d === "") return "N/A";

  if (typeof d === "object") {
    d = d.timestamp || d.text || d.seconds || d.duration || null;
    if (d === null) return "N/A";
  }

  // সেকেন্ড হিসেবে সংখ্যা এলে (যেমন 215)
  if (typeof d === "number" || /^\d+(\.\d+)?$/.test(String(d).trim())) {
    const total = Math.floor(Number(d));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = n => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  // আগে থেকেই "3:45" ফরম্যাটে থাকলে
  return String(d);
}

/* ───────────── জব তৈরি + অপেক্ষা (প্রিলোডেও ব্যবহার হয়) ───────────── */
async function createJob(song) {
  const API = await ytapi();

  const { data: job } = await axios.post(
    `${API}/api/download`,
    { url: song.url, format: "mp3" },
    { timeout: 30000 }
  );
  if (!job?.job_id) throw new Error("ডাউনলোড জব তৈরি হয়নি");

  for (let i = 0; i < 400; i++) {
    const { data: status } = await axios.get(
      `${API}/api/jobs/${job.job_id}`,
      { timeout: 15000 }
    );
    if (status.status === "failed")
      throw new Error("এই গানটি ডাউনলোড করা যায়নি");
    if (status.status === "completed" && status.file_url)
      return { API, result: status };
    await sleep(i < 10 ? 300 : 700);
  }
  throw new Error("এই গানটি ডাউনলোড করা যায়নি");
}

/* ───────────── গান ডাউনলোড ───────────── */
async function downloadSong(api, event, song, prefetched) {
  let data;
  try {
    data = prefetched ? await prefetched : await createJob(song);
  } catch (e) {
    data = await createJob(song); // প্রিলোড ফেল করলে নতুন করে চেষ্টা
  }

  const { API, result } = data;
  const url = result.file_url.startsWith("/")
    ? `${API}${result.file_url}`
    : result.file_url;

  const file = path.join(cacheDir, `song_${Date.now()}_${event.senderID}.mp3`);
  await saveToFile(url, file, 120000);
  return {
    file,
    title: result.title || song.title || "Unknown",
    duration: result.duration
  };
}

/* ───────────── কমান্ড রান ───────────── */
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  if (!args.length)
    return api.sendMessage(
      "🎵 গানের নাম লিখুন!\n\n📌 উদাহরণ: song tum hi ho",
      threadID,
      messageID
    );

  const last = cooldowns.get(senderID);
  if (last && Date.now() - last < COOLDOWN) {
    const left = COOLDOWN - (Date.now() - last);
    return api.sendMessage(
      `⏳ একটু অপেক্ষা করুন!\n\nআবার কমান্ড দিতে পারবেন: ${formatLeft(left)} পর`,
      threadID,
      messageID
    );
  }
  cooldowns.set(senderID, Date.now());

  const query = args.join(" ");

  const searchMsg = await api.sendMessage(
    `🔎 ইউটিউব থেকে তোমার গান সার্চ করা হচ্ছে...\n\n🎶 "${query}"\n⏳ একটু অপেক্ষা করো`,
    threadID,
    messageID
  );

  const thumbFiles = [];
  try {
    const API = await ytapi();
    const { data } = await axios.get(`${API}/api/search`, {
      params: { q: query, limit: 15 },
      timeout: 30000
    });

    const seen = new Set();
    const songs = (data.results || [])
      .filter(s => {
        const id = s.videoId || s.id || s.url;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, MAX_RESULTS);

    if (!songs.length) throw new Error("কোনো গান পাওয়া যায়নি");

    // সার্চ রেজাল্ট পাওয়ার সাথেই ব্যাকগ্রাউন্ডে জব শুরু (থাম্বনেইলের সাথে একসাথে চলবে)
    const jobs = songs.map((s, i) => {
      if (i >= PRELOAD_COUNT) return null;
      const p = createJob(s);
      p.catch(() => {}); // এরর হলে ক্র্যাশ যেন না করে
      return p;
    });

    const stamp = Date.now();
    const attachments = (
      await Promise.all(
        songs.map(async (song, i) => {
          const t = getThumb(song);
          if (!t) return null;
          const f = path.join(cacheDir, `thumb_${stamp}_${senderID}_${i}.jpg`);
          try {
            await saveToFile(t, f, 5000);
            thumbFiles.push(f);
            return fs.createReadStream(f);
          } catch (e) {
            return null;
          }
        })
      )
    ).filter(Boolean);

    const nums = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    let body = `╭━━━━━━━━━━━━━━━━━━╮\n   🎵 𝗦𝗢𝗡𝗚 𝗦𝗘𝗔𝗥𝗖𝗛 🎵\n╰━━━━━━━━━━━━━━━━━━╯\n🔍 "${query}"\n\n`;
    songs.forEach((s, i) => {
      body += `${nums[i]} ${s.title || "Unknown"}\n`;
      body += `   👤 ${s.channel?.name || s.channel || s.author?.name || "Unknown"}\n`;
      body += `   ⏱️ সময়: ${formatDuration(s.duration ?? s.timestamp ?? s.duration_seconds)}\n`;
      if (i < songs.length - 1) body += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
    });
    body += `\n━━━━━━━━━━━━━━━━━━\n📩 গান পেতে এই মেসেজে রিপ্লাই করে\n🔢 1-${songs.length} নম্বর লিখুন\n⏰ ২০ সেকেন্ডের মধ্যে সিলেক্ট করুন\n━━━━━━━━━━━━━━━━━━\n👑 ${CREDIT}`;

    const msg = { body };
    if (attachments.length) msg.attachment = attachments;

    api.sendMessage(msg, threadID, (err, info) => {
      safeUnsend(api, searchMsg?.messageID);
      cleanup(thumbFiles);
      if (err || !info) return;

      const entry = {
        name: "song",
        messageID: info.messageID,
        author: senderID,
        results: songs,
        jobs,
        busy: false
      };
      global.client.handleReply.push(entry);

      // ২০ সেকেন্ডে সিলেক্ট না করলে লিস্ট ডিলিট
      setTimeout(() => {
        const list = global.client.handleReply;
        const idx = list.findIndex(h => h.messageID === info.messageID);
        if (idx === -1) return; // আগেই সিলেক্ট হয়ে গেছে
        if (entry.busy) return; // ডাউনলোড চলছে, ডিলিট করা যাবে না
        list.splice(idx, 1);
        safeUnsend(api, info.messageID);
      }, SELECT_TIMEOUT);
    });
  } catch (error) {
    safeUnsend(api, searchMsg?.messageID);
    cleanup(thumbFiles);
    cooldowns.delete(senderID);
    return api.sendMessage(
      `⚠️ সার্চ ব্যর্থ হয়েছে\n${
        error.response?.data?.error?.message || error.message
      }`,
      threadID,
      messageID
    );
  }
};

/* ───────────── নম্বর রিপ্লাই ───────────── */
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID } = event;

  const choice = parseInt(String(event.body || "").trim(), 10);

  // অন্য কেউ রিপ্লাই করলে নোটিশ
  if (senderID !== handleReply.author) {
    if (!isNaN(choice))
      return api.sendMessage(
        `🚫 এটা তোমার কমান্ড না!\n\n⚠️ শুধু যে কমান্ড দিয়েছে সে-ই গান সিলেক্ট করতে পারবে।\n🎵 নিজে গান পেতে নিজে কমান্ড দাও।`,
        threadID,
        messageID
      );
    return;
  }

  if (isNaN(choice) || choice < 1 || choice > handleReply.results.length)
    return api.sendMessage(
      `❌ ভুল নম্বর! 1 থেকে ${handleReply.results.length} এর মধ্যে লিখুন।`,
      threadID,
      messageID
    );

  if (handleReply.busy) return;
  handleReply.busy = true;

  const song = handleReply.results[choice - 1];
  const waitMsg = await api.sendMessage(
    `⏳ গান আনা হচ্ছে...\n\n🎼 ${song.title || "Unknown"}\n🚀 একটু অপেক্ষা করুন`,
    threadID,
    messageID
  );

  let file;
  try {
    const res = await downloadSong(
      api,
      event,
      song,
      handleReply.jobs?.[choice - 1]
    );
    file = res.file;

    const dur = formatDuration(
      song.duration ?? song.timestamp ?? song.duration_seconds ?? res.duration
    );

    const body =
`╭━━━━━━━━━━━━━━━━━━╮
   ${CREDIT}
╰━━━━━━━━━━━━━━━━━━╯
🎼 ${res.title}
👤 ${song.channel?.name || song.channel || song.author?.name || "Unknown"}
⏱️ সময়: ${dur}
🎚️ MP3 • 192kbps
━━━━━━━━━━━━━━━━━━
👑 ${CREDIT}`;

    api.sendMessage(
      { body, attachment: fs.createReadStream(file) },
      threadID,
      () => {
        safeUnsend(api, waitMsg?.messageID);
        safeUnsend(api, handleReply.messageID);
        cleanup([file]);
      }
    );

    const list = global.client.handleReply;
    const idx = list.findIndex(h => h.messageID === handleReply.messageID);
    if (idx !== -1) list.splice(idx, 1);
  } catch (error) {
    handleReply.busy = false;
    safeUnsend(api, waitMsg?.messageID);
    cleanup([file]);
    return api.sendMessage(
      `❌ ডাউনলোড ব্যর্থ\n\n${error.message}\n\n🔁 অন্য একটি নম্বর দিয়ে রিপ্লাই করুন।`,
      threadID,
      messageID
    );
  }
};

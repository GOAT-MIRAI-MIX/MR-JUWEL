const fs = require("fs-extra");

const path = __dirname + "/birthdayData.json";
const logFile = __dirname + "/birthday.log";

// ===== SETTINGS =====
const TIMEZONE = "Asia/Dhaka";
const BIRTH_MONTH = 4;   // April
const BIRTH_DAY = 24;    // 24 তারিখ (জন্মদিন)
const COUNTDOWN_DAYS = 9; // কত দিন আগে থেকে countdown শুরু (15 April থেকে)
const SEND_DELAY = 1500; // প্রতিটা থ্রেডে পাঠানোর মাঝে বিরতি (ms)

module.exports.config = {
  name: "autobirthday",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "MR JUWEL",
  description: "Auto Birthday (10AM countdown + 11:59PM main + persistent)",
  commandCategory: "system",
  cooldowns: 5
};

// ===== HELPERS =====
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getDhakaTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());

  const o = {};
  for (const p of parts) o[p.type] = p.value;

  return {
    year: +o.year,
    month: +o.month,
    day: +o.day,
    hours: +o.hour,
    minutes: +o.minute,
    today: `${o.year}-${o.month}-${o.day}`
  };
}

function readData() {
  const def = { lastMorning: "", lastNight: "" };
  try {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify(def, null, 2));
      return def;
    }
    return { ...def, ...JSON.parse(fs.readFileSync(path, "utf8")) };
  } catch (e) {
    fs.writeFileSync(path, JSON.stringify(def, null, 2));
    return def;
  }
}

function saveData(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function broadcast(api, msg, threads) {
  for (const t of threads) {
    try {
      await api.sendMessage(msg, t.threadID);
    } catch (e) {
      console.log("Send failed:", t.threadID, e && e.message ? e.message : e);
    }
    await sleep(SEND_DELAY);
  }
}

// ===== MAIN =====
let running = false;

async function checkBirthday(api) {
  if (running) return; // আগের কাজ শেষ না হলে নতুন করে শুরু হবে না
  running = true;

  try {
    const t = getDhakaTime();
    const data = readData();

    // জন্মদিন পর্যন্ত বাকি দিন (বছর নিজে থেকেই ধরবে)
    const diff = Math.round(
      (Date.UTC(t.year, BIRTH_MONTH - 1, BIRTH_DAY) -
        Date.UTC(t.year, t.month - 1, t.day)) / 86400000
    );

    // ================= MORNING (10:00 AM এর পর, মিস হলেও ধরবে) =================
    const isMorningTime = t.hours >= 10 && t.hours < 22;
    if (
      isMorningTime &&
      diff >= 1 && diff <= COUNTDOWN_DAYS &&
      data.lastMorning !== t.today
    ) {
      // আগে mark করে নিচ্ছি যাতে ডুপ্লিকেট না যায়
      data.lastMorning = t.today;
      saveData(data);

      const threads = await api.getThreadList(100, null, ["INBOX"]);
      if (threads && threads.length) {
        const msg =
`⁽────⁽𝐌𝐑₎────₎
╔════ཐི༏ཋྀ════╗
━〲🅙𝐔🅦𝐄🅛⤸⃞🩷࿐ এর বার্থডে আসতেছে আর বাকি *${diff} দিন*!
🎁 সবাই উইশ করার জন্য রেডি থাকেন! 🥳`;

        await broadcast(api, msg, threads);
        fs.appendFileSync(logFile, `[${t.today}] Morning Sent (${diff} days left)\n`);
        console.log("Morning message sent");
      }
    }

    // ================= NIGHT (11:59 PM, জন্মদিনের আগের দিন) =================
    if (diff === 1 && t.hours === 23 && t.minutes >= 59 && data.lastNight !== t.today) {
      data.lastNight = t.today;
      saveData(data);

      const threads = await api.getThreadList(100, null, ["INBOX"]);
      if (threads && threads.length) {
        const msg =
`🎉 আজ 𝑴𝑹 𝑱𝑼𝑾𝑬𝑳 এর জন্মদিন! 🎂

🎂ღ𝑯𝒂𝒑𝒑𝒚 𝑩𝒊𝒓𝒕𝒉𝒅𝒂𝒚 𝑻𝒐𝒐 𝒀𝒐𝒖 𝑱𝒖𝒘𝒆𝒍🥳

জন্মদিনের শুভেচ্ছা ও ভালোবাসা রইলো❤᭄
“-༎আজকের༎এই༎দিন༎🍂🥀༊༅তোমার༅জন্য༅অনেক💞!!🤗༊༅ সুখময়༎নতুন༎এক༅প্রভাত༎🥰🥀🖤༎ আজকের༎এইদিন༎তোমার༅জন্য༎হোক༎কষ্টহীন🦋🤗💞༊༅ আজকের༎এই༅সময়টা༅🌺🍁😽༎শুধু༎তোমার༎জন্য😽🌈 তোমার༎জন্য༎আজ༎পৃথিবীটা༎হয়ে যাক༎রঙিন🌈🤗

আমারツ এর পক্ষ থেকে༆ツ
🎊𝐇𝐀𝐏𝐏𝐘 𝐁𝐈𝐑𝐓𝐇𝐃𝐀𝐘 🎉

⁽────⁽𝐌𝐑₎────₎
╔════ཐི༏ཋྀ════╗
━〲🅙𝐔🅦𝐄🅛⤸⃞🩷࿐
💚ღ𝑴𝒂𝒏𝒚 𝑴𝒂𝒏𝒚 𝑯𝒂𝒑𝒑𝒚 𝑹𝒆𝒕𝒖𝒓𝒏 𝑶𝒇𝒇 𝑻𝒉𝒆 𝑫𝒂𝒚 𝑱𝒖𝒘𝒆𝒍ღ`;

        await broadcast(api, msg, threads);
        fs.appendFileSync(logFile, `[${t.today}] Night Sent\n`);
        console.log("Night message sent");
      }
    }
  } catch (e) {
    console.log("Birthday error:", e);
  } finally {
    running = false;
  }
}

// ===== AUTO LOOP =====
function startLoop(api) {
  if (global.birthdayLoop) return;
  global.birthdayLoop = setInterval(() => checkBirthday(api), 20 * 1000);
  checkBirthday(api);
}

// বট চালু হওয়ার সাথে সাথেই লুপ শুরু (যদি তোমার বট onLoad সাপোর্ট করে)
module.exports.onLoad = function ({ api }) {
  startLoop(api);
};

// onLoad না থাকলে প্রথম ইভেন্টেই লুপ শুরু হবে
module.exports.handleEvent = async function ({ api }) {
  startLoop(api);
};

// ===== COMMAND =====
module.exports.run = async function ({ api, event }) {
  startLoop(api);
  return api.sendMessage("✅ Birthday system running...", event.threadID);
};

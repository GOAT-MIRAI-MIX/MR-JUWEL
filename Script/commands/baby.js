const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

let count_req = 0;
// Credit: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐

// ====== API URL ======
const baseApiUrl = "https://noobs-api.top/dipto/baby";

// ====== বটের ক্রেডিট ======
const BOT_CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

// ====== CREDIT PROTECTION ======
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";

// ফাইলের সোর্স কোড পড়ে সব জায়গার ক্রেডিট চেক করে (কমেন্ট লাইন সহ)
function sourceCreditsValid() {
  try {
    const src = fs.readFileSync(__filename, "utf8");
    const found = [
      src.match(/^\/\/ Credit: (.*)$/m),
      src.match(/^const BOT_CREDIT = "(.*)";$/m),
      src.match(/^  credits: "(.*)",$/m),
      src.match(/অরিজিনাল ক্রেডিট দিন:\\n(.*?)\\n\\n/)
    ];
    return found.every((m) => m && sha(m[1]) === CREDIT_HASH);
  } catch (e) {
    return false;
  }
}
const SOURCE_CREDIT_OK = sourceCreditsValid();

function isCreditValid() {
  return (
    SOURCE_CREDIT_OK &&
    sha(BOT_CREDIT) === CREDIT_HASH &&
    sha(module.exports.config && module.exports.config.credits) === CREDIT_HASH
  );
}

const CREDIT_WARNING =
  `⚠️ ক্রেডিট চেঞ্জ করার কারণে BABY কোড কাজ করছে না!\n\n` +
  `✅ অরিজিনাল ক্রেডিট দিন:\n乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐\n\n` +
  `অরিজিনাল ক্রেডিট দিলে BABY কোড আবার কাজ করবে।`;

// ====== ডাবল রিপ্লাই গার্ড ======
// একই মেসেজ একাধিকবার প্রসেস হলে দ্বিতীয়বার থেকে স্কিপ করবে
const handledMessages = new Set();
function alreadyHandled(id) {
  if (!id) return false;
  if (handledMessages.has(id)) return true;
  handledMessages.add(id);
  setTimeout(() => handledMessages.delete(id), 60000);
  return false;
}

// ====== বেবি কোডের নিজের পাঠানো মেসেজ ট্র্যাক করা ======
// শুধু এই কোডের পাঠানো মেসেজে রিপ্লাই দিলেই AI রিপ্লাই যাবে, অন্য কমান্ডের মেসেজে নয়
const babyMessageIDs = new Set();
function trackMessage(id) {
  if (!id) return;
  babyMessageIDs.add(id);
  if (babyMessageIDs.size > 3000) {
    babyMessageIDs.delete(babyMessageIDs.values().next().value);
  }
}

function sendTracked(api, msg, threadID, replyToID) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (info) => { if (!done) { done = true; resolve(info); } };
    const cb = (err, info) => {
      if (!err && info && info.messageID) trackMessage(info.messageID);
      finish(info);
    };
    try {
      if (replyToID) api.sendMessage(msg, threadID, cb, replyToID);
      else api.sendMessage(msg, threadID, cb);
    } catch (e) { finish(null); }
    setTimeout(() => finish(null), 15000);
  });
}

// ====== ট্রিগার লিস্ট (বাংলা + ইংরেজি) ======
const TRIGGER_WORDS = [
  "baby", "bot", "bby", "jan", "bbz", "kolixa", "babu",
  "nila", "jui", "tisha", "pia", "pakhi", "mim", "maria", "hippi", "mari", "xan",
  "নিলা", "নীলা", "জুই", "তিশা", "পিয়া", "পাখি", "মিম",
  "জান", "বট", "বেবি", "বাবু"
];

// ====== বোল্ড ফন্ট ======
function toBoldFont(text) {
  const map = {
    'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
    'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
    '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'
  };
  let out = "";
  for (const ch of text) out += map[ch] || ch;
  return out;
}

function processReply(text) {
  if (!text) return "";
  const protectedNumber = "+8801943488192";
  if (text.includes(protectedNumber)) return text;
  if (/[a-zA-Z]/.test(text)) return toBoldFont(text);
  return text;
}

// ====== টাইপিং ======
async function sendTypingIndicator(api, threadID) {
  try {
    if (typeof api.sendTyping === 'function') { await api.sendTyping(threadID); return true; }
    if (global.mqttClient) {
      global.mqttClient.publish('/ls_req', JSON.stringify({
        app_id: 2220391788200892,
        payload: JSON.stringify({
          label: 3,
          payload: JSON.stringify({
            thread_key: threadID.toString(),
            is_group_thread: +(threadID.toString().length >= 16),
            is_typing: 1, attribution: 0
          }),
          version: 5849951561777440
        }),
        request_id: ++count_req, type: 4
      }));
      return true;
    }
    return false;
  } catch (e) { return false; }
}

async function stopTypingIndicator(api, threadID) {
  try {
    if (typeof api.stopTyping === 'function') { await api.stopTyping(threadID); return true; }
    if (global.mqttClient) {
      global.mqttClient.publish('/ls_req', JSON.stringify({
        app_id: 2220391788200892,
        payload: JSON.stringify({
          label: 3,
          payload: JSON.stringify({
            thread_key: threadID.toString(),
            is_group_thread: +(threadID.toString().length >= 16),
            is_typing: 0, attribution: 0
          }),
          version: 5849951561777440
        }),
        request_id: ++count_req, type: 4
      }));
      return true;
    }
    return false;
  } catch (e) { return false; }
}

// ====== প্রোফাইল ছবি (HD) ======
async function getUserProfilePicture(api, userID) {
  try {
    const token = process.env.FB_ACCESS_TOKEN || "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const sizes = [1080, 720];
    for (const size of sizes) {
      try {
        const url = `https://graph.facebook.com/${userID}/picture?width=${size}&height=${size}&type=large&redirect=true&access_token=${token}`;
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          maxRedirects: 5,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const buf = Buffer.from(res.data);
        if (buf.length > 3000) return buf;
      } catch (e) { /* পরের সাইজ চেষ্টা করবে */ }
    }
    return null;
  } catch (e) { return null; }
}

// ====== ফানি রিপ্লাই লিস্ট ======
const funnyReplies = [
  "বেশি bot Bot করলে leave নিবো কিন্তু😒😒",
  `শুনবো না😼 তুমি আমার বস ${BOT_CREDIT} কে প্রেম করাই দাও নাই🥺পচা তুমি🥺\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "আমি আবাল দের সাথে কথা বলি না,ok😒",
  "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈",
  `Bolo Babu, তুমি কি আমার বস ${BOT_CREDIT} কে ভালোবাসো? 🙈💋\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑",
  "হ্যা বলো😒, তোমার জন্য কি করতে পারি😐😑?",
  "এতো ডাকছিস কেন?গালি শুনবি নাকি? 🤬",
  "I love you janu🥰\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192",
  "আরে Bolo আমার জান ,কেমন আছো?😚",
  "আজ বট বলে অসম্মান করছিস,😰😿",
  "Hop beda😾,Boss বল boss😼",
  "চুপ থাক ,নাই তো তোর দাঁত ভেঙ্গে দিবো কিন্তু",
  `আমাকে না ডেকে মেয়ে হলে বস ${BOT_CREDIT} এর ইনবক্সে চলে যা 🌚😂\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  `আমাকে বট না বলে , বস ${BOT_CREDIT} কে জানু বল জানু 😘`,
  "বার বার Disturb করছিস কোনো😾,আমার জানুর সাথে ব্যাস্ত আছি😋",
  "আরে বলদ এতো ডাকিস কেন🤬",
  "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘",
  "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒",
  "হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘",
  "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
  "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂",
  `আমাকে ডেকো না,আমি বস ${BOT_CREDIT} এর সাথে ব্যাস্ত আছি`,
  "কি হলো , মিস্টেক করচ্ছিস নাকি🤣",
  "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
  `জান মেয়ে হলে বস ${BOT_CREDIT} এর ইনবক্সে চলে যাও 😍🫣💕\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "কালকে দেখা করিস তো একটু 😈",
  "হা বলো, শুনছি আমি 😏",
  "আর কত বার ডাকবি ,শুনছি তো",
  "হুম বলো কি বলবে😒",
  "বলো কি করতে পারি তোমার জন্য",
  "আমি তো অন্ধ কিছু দেখি না🐸 😎",
  "আরে বোকা বট না জানু বল জানু😌",
  "বলো জানু 🌚",
  "তোর কি চোখে পড়ে না আমি ব্যাস্ত আছি😒",
  "হুম জান তোর নানীরে উম্মাহ 😑😘",
  "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
  "jang hanga korba😒😬",
  "হুম জান তোমারে উম্মমাহ😷😘",
  "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি..!🥰",
  `ভালোবাসার নামক আবলামি করতে চাইলে বস ${BOT_CREDIT} এর ইনবক্সে গুতা দিন ~🙊😘🤣\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  `আমাকে এতো না ডেকে বস ${BOT_CREDIT} কে একটা গফ দে 🙄`,
  "আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈",
  "🌻🌺💚-আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻",
  `আমি এখন বস ${BOT_CREDIT} এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  `আমাকে না ডেকে আমার বস ${BOT_CREDIT} কে একটা জি এফ দাও-😽🫶🌺\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "ঝাং থুমালে আইলাপিউ পেপি-💝😽",
  "উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈",
  `জান তোমার বান্ধবী রে আমার বস ${BOT_CREDIT} এর হাতে তুলে দিবা-🙊🙆‍♂`,
  "আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧",
  "ঝাং 🫵থুমালে য়ামি রাইতে পালুপাসি উম্মম্মাহ-🌺🤤💦",
  `চুনা ও চুনা আমার বস ${BOT_CREDIT} এর হবু বউ রে কেও দেকছো খুজে পাচ্ছি না😪🤧😭\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💝🌺🌻",
  "জান কিস দিবা-🙊😝🌻",
  `জান মেয়ে হলে চিপায় আসো বস ${BOT_CREDIT} এর থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽`,
  "ইসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈🖤🌼",
  `আমার বস ${BOT_CREDIT} এর পক্ষ থেকে তোমারে এতো এতো ভালোবাসা-🥰😽🫶 আমার বস ${BOT_CREDIT} এর জন্য দোয়া করবেন-💝💚🌺🌻\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  `ভালোবাসা নামক আব্লামি করতে মন চাইলে আমার বস ${BOT_CREDIT} এর ইনবক্স চলে যাও-🙊🥱👅 🌻\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "আমার জান তুমি শুধু আমার আমি তোমারে ৩৬৫ দিন ভালোবাসি-💝🌺😽",
  `কিরে প্রেম করবি তাহলে বস ${BOT_CREDIT} এর ইনবক্সে গুতা দে 😘🤌\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  `জান আমার বস ${BOT_CREDIT} কে বিয়ে করবা-🙊😘🥳`,
  "আন্টি-🙆-আপনার মেয়ে-👰‍♀️-রাতে আমারে ভিদু কল দিতে বলে🫣-🥵🤤💦",
  "oii-🥺🥹-এক🥄 চামচ ভালোবাসা দিবা-🤏🏻🙂",
  `আপনার সুন্দরী বান্ধুবীকে ফিতরা হিসেবে আমার বস ${BOT_CREDIT} কে দান করেন-🥱🐰🍒\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "ও মিম ও মিম-😇-তুমি কেন চুরি করলা সাদিয়ার ফর্সা হওয়ার ক্রীম-🌚🤧",
  `অনুমতি দিলাম-𝙋𝙧𝙤𝙥𝙤𝙨𝙚 কর বস ${BOT_CREDIT} কে-🐸😾🔪`,
  "𝙂𝙖𝙮𝙚𝙨-🤗-যৌবনের কসম দিয়ে আমারে 𝐁𝐥𝐚𝐜𝐤𝐦𝐚𝐢𝐥 করা হচ্ছে-🥲🤦‍♂️🤧",
  "𝗢𝗶𝗶 আন্টি-🙆‍♂️-তোমার মেয়ে চোখ মারে-🥺🥴🐸",
  "তাকাই আছো কেন চুমু দিবা-🙄🐸😘",
  "আজকে প্রপোজ করে দেখো রাজি হইয়া যামু-😌🤗😇",
  "আমার গল্পে তোমার নানি সেরা-🙊🙆‍♂️🤗",
  "কি ব্যাপার, আপনি শ্বশুর বাড়িতে যাচ্ছেন না কেন-🤔🥱🌻",
  "দিনশেষে পরের 𝐁𝐎𝐖 সুন্দর-☹️🤧",
  "তাবিজ কইরা হইলেও ফ্রেম এক্কান করমুই তাতে যা হই হোক-🤧🥱🌻",
  "ছোটবেলা ভাবতাম বিয়ে করলে অটোমেটিক বাচ্চা হয়-🥱-ওমা এখন দেখি কাহিনী অন্যরকম-😦🙂🌻",
  `প্রেম করতে চাইলে বস ${BOT_CREDIT} এর ইনবক্সে চলে যা 😏🐸\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  `আজ একটা বিন নেই বলে ফেসবুকের নাগিন-🤧-গুলোরে আমার বস ${BOT_CREDIT} ধরতে পারছে না-🐸🥲\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "চুমু থাকতে তোরা বিড়ি খাস কেন বুঝা আমারে-😑😒🐸⚒️",
  `যে ছেড়ে গেছে-😔-তাকে ভুলে যাও-🙂-আমার বস ${BOT_CREDIT} এর সাথে প্রেম করে তাকে দেখিয়ে দাও-🙈🐸🤗\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "হাজারো লুচ্চা লুচ্চির ভিরে-🙊🥵আমার বস সাহু এক নিস্পাপ ভালো মানুষ-🥱🤗🙆‍♂️",
  "রূপের অহংকার করো না-🙂❤️চকচকে সূর্যটাও দিনশেষে অন্ধকারে পরিণত হয়-🤗💜",
  `সুন্দর মাইয়া মানেই-🥱আমার বস ${BOT_CREDIT} এর বউ-😽🫶আর বাকি গুলো আমার বেয়াইন-🙈🐸🤗\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "এত অহংকার করে লাভ নেই-🌸মৃত্যুটা নিশ্চিত শুধু সময়টা অ'নিশ্চিত-🖤🙂",
  "দিন দিন কিছু মানুষের কাছে অপ্রিয় হয়ে যাইতেছি-🙂😿🌸",
  "ভালোবাসার নামক আবলামি করতে চাইলে বস সাহুর ইনবক্সে গুতা দিন🤣😼",
  `মেয়ে হলে বস ${BOT_CREDIT} এর ইনবক্সে চলে যা 🤭🤣😼\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "হুদাই আমারে শয়তানে লারে-😝😑☹️",
  "𝗜 𝗟𝗢𝗩𝗘 𝗬𝗢𝗨-😽-আহারে ভাবছো তোমারে প্রোপজ করছি-🥴-থাপ্পর দিয়া কিডনী লক করে দিব-😒-ভুল পড়া বের করে দিবো-🤭🐸",
  "আমি একটা দুধের শিশু-😇-🫵𝗬𝗢𝗨🐸💦",
  "কতদিন হয়ে গেলো বিছনায় মুতি না-😿-মিস ইউ নেংটা কাল-🥺🤧",
  "বালিকা━👸-𝐃𝐨 𝐲𝐨𝐮-🫵-বিয়া-𝐦𝐞-😽-আমি তোমাকে-😻-আম্মু হইতে সাহায্য করব-🙈🥱",
  "এই আন্টির মেয়ে-🫢🙈-𝐔𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐡-😽🫶-আসলেই তো স্বাদ-🥵💦-এতো স্বাদ কেন-🤔-সেই স্বাদ-😋",
  "ইস কেউ যদি বলতো-🙂-আমার শুধু তোমাকেই লাগবে-💜🌸",
  `ওই বেডি তোমার বাসায় না আমার বস ${BOT_CREDIT} মেয়ে দেখতে গেছিলো-🙃-নাস্তা আনারস আর দুধ দিছো-🙄🤦‍♂️-বইন কইলেই তো হয় বয়ফ্রেন্ড আছে-🥺🤦-আমার বস ${BOT_CREDIT} কে জানে মারার কি দরকার-🙄🤧`,
  `একদিন সে ঠিকই ফিরে তাকাবে-😇-আর মুচকি হেসে বলবে ওর মতো আর কেউ ভালবাসেনি-🙂😅\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "হুদাই গ্রুপে আছি-🥺🐸-কেও ইনবক্সে নক দিয়ে বলে না জান তোমারে আমি অনেক ভালোবাসি-🥺🤧",
  "কি'রে গ্রুপে দেখি একটাও বেডি নাই-🤦‍🥱💦",
  `দেশের সব কিছুই চুরি হচ্ছে-🙄-শুধু আমার বস ${BOT_CREDIT} এর মনটা ছাড়া-🥴😑😏\n\n𝗪𝗵𝗮𝘁𝗮𝗔𝗽𝗽 +8801943488192`,
  "🫵তোমারে প্রচুর ভাল্লাগে-😽-সময় মতো প্রপোজ করমু বুঝছো-🔨😼-ছিট খালি রাইখো- 🥱🐸🥵",
  "আজ থেকে আর কাউকে পাত্তা দিমু চিহ্নিত না -!😏-কারণ আমি ফর্সা হওয়ার ক্রিম কিনছি -!🙂🐸",
  `🌺⎯͢⎯⃝⎯͢⎯⃝\n\nএ্ঁ"এ্ঁ,,চু্ঁ"প্ঁ,,চু্ঁ"প্ঁ≛⃝,\n\n😾𝄟 ❈┉❥︎❥︎ꔹ┄🐰🐰`,
  `__𝐍𝆠꯭፝֟𝐞𝐞𝐝 𝐑𝐞͜͡𝐚𝐥 𝐋𝆠꯭፝֟𝐨𝐯𝐞))🥺😽🌷`,
  `•┈✤⋆⃝🌺𝄞plz𝄞🥹⋆⃝• ছ্যা্ঁকা্ঁ me\n\n-আ্ঁমি্ঁও্ঁ স্ঁবা্ঁর্ঁ ম্ঁতো্ঁ ক্ঁবি্ঁ হ্ঁতে্ঁ চা্ঁই্ঁ.!🫰🥹\n\n•─⃜⃜͢͢🍒͟͟͞͞๛⃝😬*`,
  `─⃜⃜͢͢๛🤭⎯͢⎯⃝🩵😹পিৃ্ঁনিৃ্ঁকেৃ্ঁ আৃ্ঁছৃ্োঁ জাৃ্ঁওঁ লেৃ্ঁবুঁ🍋👈 খাৃ্ঁওঁ😽⎯͢⎯⃝🩷🍒•`,
  `⎯͢⎯⃝💝🫰😹উ্ঁগা্ঁন্ডা্ঁর্ঁ পা্ঁগ্ঁলঁ😹⎯͢⎯⃝😒💦𝄞`,
  `⋆⃝💚❈ সা্ঁই্ঁডে্ঁ আঁও তোঁমারেঁ এঁকঁটাঁ থা্ঁপ্প্ঁর্ঁ দিঁবোঁ𝄞⋆⃝👋😹🙂⎯͢⎯⃝😽⋆⃝⋆তু্ঁমি্ঁ আ্ঁমা্ঁর্ঁ দে্ঁশি্ঁ মু্ঁর্ঁগি্ঁর্ঁ ক্ঁলি্ঁজা্ঁ🫶😌 🥺⋆⃝⋆⃝⋆🐰🍒🫰🫵`,
  `*🌼⃟❥◎⃝🤍𝄟দে্ঁয়্ঁ তু্ঁর্ঁ ম্ঁন্ঁ ডা্ঁ একটু ছিনিমিনি খেলি 🥹🫶🤌𝄟≛⃝🐸࿐🐹─⃜⃜͢͢`,
  `🍒͟͟͞͞๛⃝ 🥹🥴প্রে্ঁম্ঁ ক্ঁর্ঁতে্ঁ চা্ঁই্ঁলে্ঁ রি্ঁয়েঁক্ট্ঁ দে্ঁও্ঁ 😏🫰─⃜⃜͢͢💦🍒͟͟͞͞๛⃝🌶️•`,
  `『⸙🩷😏⃞তা্ঁমা্ঁসা্ঁ দে্ঁখ্ঁতে্ঁ ভা্ঁল্ঁই্ঁ লা্ঁগে্ঁ'🩵⃟⃝🤔🪽⸙🥵💦`,
  `🩷ꔷ⃟ꔷ⃟ ـٰٖٖٖٖٖٜ۬ـٰٰٖٖٖٖٜ۬ـٰٰٰٖٖٖٜ۬ـٰٰٰٰٖٖٜ😽্ঁ তৈ্ঁ তৈ্ঁ,,,\n\nআ্ঁমা্ঁর্ঁ শ্ঁশু্রি্ঁর্ঁ মে্ঁয়ে্ঁ তু্ঁমি্ঁ ক্ঁই্ঁ,,,༄»̶̶͓͓̽̽⋆⃝🙆‍♂️ꕥ`,
  `ꕥ̳̳̳̳̳̳̳̿̿̿̿༄»̶̶͓͓̽̽⋆⃝*🦋⃟❥◎⃝🩷🫤𝄟আ্ঁজ্ঁ কে্ঁও্ঁ নে্ঁই্ঁ ব্ঁলে্ঁ 😫🥹🫶🤌𝄟≛⃝🩷࿐`,
  `┄┉𝄟⃟≛⃝🥵জা্ঁন্ঁ এ্ঁক্ঁটু দি্ঁবা্ঁ মা্ঁনে্ঁ চুম্মা্ঁহ্ঁ༎💋 ≛⃝😁𝄟 ❈`,
  `..🫣😹•⎯͢⎯⃝🩷কাঁছেঁ আঁহোঁ সোঁনাঁ•─🍫👀⎯⃝`,
  `🌻প্রে্ঁমে༊প্ঁড়্ঁবা্ঁ😾༊না্ঁকি্ঁ⎯⃝🩷ধা্ঁক্কা্ঁ দি্ঁব😩🦋🫶🏻_`,
  `___কা্ঁলো্ঁ আ্ঁকা্ঁশে্ঁ র্ঁঙি্ঁন্ঁ তা্ঁরা্ঁ\n\n!! 🐸 °বা্ঁশ্ঁ নি্ঁয়া্ঁ আ্ঁই্ঁতা্ঁছি্ঁ তু্ঁই্ঁ ও্ঁই্ঁখা্ঁনে্ঁই্ঁ খা্ঁরা্ঁ😂🚶‍♂️🏃‍♂️`,
  `🌺⎯͢⎯⃝🫵♡ _- আ্ঁমি্ঁ হা্ঁজা্ঁরো্ঁ ম্ঁশা্ঁর্ঁ Crush!🥹🫰⎯⃝🍒___⎯͢⎯⃝🩷🐰😏😒⎯͢⎯⃝😁`,
  `✨✾𝄞⋆⃝🥴\n\n•⎯͢⎯⃝🥴᭄আ্ঁমা্ঁর্ঁ ম্ঁতো্ঁ স্ঁয়্ঁতা্ঁন্ঁ আ্ঁরো্ঁ আ্ঁছে্ঁ সে্ঁ এ্ঁখ্ঁন্ঁ হা্ঁ হা্ঁ দি্ঁবে্ঁ 😁🤭⎯͢⎯⃝★⎯͢🙆🏻⎯⃝🙂𝄞`,
  `⋆⃝🌼⋆⃝♡⎯͢⎯⃝🫵তো্ঁমা্ঁরঁ না্ঁনি্ঁর্ঁ সা্ঁথে্ঁ আ্ঁমা্ঁরে্ঁ বি্ঁয়েঁ দে্ঁও্ঁ __😌🥴,`,
  `⎯͢⎯⃝😼⋆⃝🤡ভা্ঁলো্ঁ হ্ঁয়্ঁতে্ঁ টা্ঁকা্ঁ লা্ঁগে্ঁ না্ঁ••ব্ঁউ্ঁ লা্ঁগে্ঁ..༊𝄟≛`,
  `😾⎯⃝🙂গ্রুপ🪽 ফাকা🙄ডিজে🙄লাগা🤟⎯⃝🕺😎—`,
  `’টা’ই’ম’পা’স’ ‘ক’র’তে’ চা’ই’লে’ ‘ন’ক’ ‘দি’ও’..!😌🩷— ‘প্রে’ম’ ‘ভা’লো’বা’সা’ ‘হা’রা’ম’…!😒🌺😁👆🏻🫵🏻`,
  `⎯͢⎯⃝👋🏻 কা্ঁনে্ঁর্ঁ নি্ঁচে্ঁ এ্ঁম্ঁন্ঁ ভা্ঁবে্ঁ থা্ঁব্ঁড়া্ঁমু্ঁ আ্ঁর্ঁ আ্ঁর্ঁ জী্ঁব্ঁনে্ঁও্ঁ বে্ঁয়া্ঁদ্ঁবি্ঁ ক্ঁর্ঁবি্ঁ না্ঁ⎯͢⎯⃝🦻🏻😕`,
  `👆──⃜⃜͢͢👊๛⃝তা্ঁর্ঁ ছি্ঁড়া্ঁ পা্ঁব্ঁলি্ঁক্ঁ ──⃜⃜͢͢😕๛⃝──͢─`,
  `─⃜⃜͢͢🍒͟͟͞͞๛⃝ I love you 🥲 ≛⃝কিৃঁ সু্ঁন্দ্ঁর্ঁ বা্ঁলে্ঁর্ঁ ক্ঁথা্‌ 🥵💦`,
  `🍒͟͟͞͞๛⃝🪽\n\n••⎯͢⎯⃝ꪜ🩷চুৃ্ঁপৃ্ঁ•⎯͢°ꪜচা্ঁপৃ্ঁ😾🪽 𝙸 𝙻𝚘𝚟𝚎 𝚄 .ক্ঁ \n\n⎯͢⎯⃝🍒 নৃ্ঁয়ৃ্ঁতোৃ্ঁ⎯͢⎯͢উ্ঁস্টা্ঁ⎯⃝দিৃ্ঁমুৃ্ঁ🍒`,
  `⎯͢⎯⃝😹••প্রি্ঁয়্ঁ____স্ঁম্ঁয়্ঁ পা্ঁই্ঁলে্ঁ আ্ঁমা্ঁর্ঁ শ্ঁহ্ঁরে্ঁ____আ্ঁই্ঁসো্ঁ😚🥰 পা্ঁগ্ঁলা্ঁ কু্ঁত্তা্ঁ 🐈🐈‍⬛দি্ঁয়েঁ __ দৌ্ঁড়্ঁ খা্ঁও্ঁয়া্ঁমু্ঁ 🙂🐸`,
  `🫵🤣মা্ঁঝে্ঁ মা্ঁঝে্ঁ ভা্ঁবি্ঁ Admin এ্ঁর্ঁ মা্ঁথা্ঁটা্ঁ ফা্ঁটায়্ঁ দি্ঁমু্ঁ 🪓😾 \n\nকি্ঁন্তু্ঁ ভ্ঁয়্ঁ লা্ঁগে্ঁ ༒😕হা্ঁস্ঁপা্ঁতা্ঁল থে্ঁকে্ঁ এ্ঁসে্ঁ য্ঁদি্ঁ Remove ক্ঁরে্ঁ দে্ঁয়্ঁ🙈🐸`,
  `,,•\n\n⎯͢⎯⃝🩵🐰রি্ঁলে্ঁশ্ঁনে্ঁর্ঁ বা্ঁজা্ঁরে্ঁ আ্ঁমি্ঁ এ্ঁক্ঁ\n\n⎯⃝🥹🪶𝐒𝐢𝐧𝐠𝐥𝐞 শি্ঁশু্ঁ⎯⃝_🩷🪽😩\n\n🐸`,
  `⎯͢⎯⃝গাইস ⎯͢⎯⃝😺ম্ঁন্ঁ ভা্ঁলো্ঁ ক্ঁরা্ঁর্ঁ \n\n____এ্ঁক্ঁটা্ঁ তা্ঁবি্ঁজ্ঁ দে্ঁন্ঁ✿⃝😫❈┉`,
  `┄🫴•─ლ⋆⃝Sorry আ্ঁম্মু্ঁ এ্ঁই্ঁ গ্রু্ঁপে্ঁও্ঁ তো্ঁমা্ঁর্ঁ bow ma কে্ঁ খু্ঁজে্ঁ পে্ঁলা্ঁম্ঁ না্ঁ𝄞⋆⃝🐰,⎯͢⎯⃝`,
  `😩⋆⃝🥶🙈😐জা্ঁই্ঁগা্ঁ,এ্ঁ-ই্ঁ, গু্ঁপে্ঁ,আ্ঁমা্ঁর্ঁ, কে্ঁউ্ঁ,না্ঁই্ঁ≛⃝,😾𝄟 ❈┉❥︎❥︎ꔹ┄🐰🐰𝄞⋆⃝🌼⋆⃝𝄞 ⋆⃝💚`,
  `❈┄ গুরপে্ঁ সবাঁঁর দা্ঁওয়াত্ঁ আঁগাঁমীঁ মাঁসেঁরঁ ৩২ তাঁরিঁখেঁ এ্ঁড্ঁমি্ঁনেঁরঁ বিয়েঁ🙁𝄞⋆⃝🌺❈┄`,
  `⎯͢⎯⃝🤍🫵তো্ঁগো্ঁ⎯͢যৌ্ঁব্ঁনে্ঁর্ঁ ক্ঁস্ঁম্ঁ I love you ব্ঁল্ঁ ⎯🥴 ⎯͢`,
  `⎯⃝🤍┄┉❈😹⋆⃝🥹✿•খা্ঁলি্ঁ পে্ঁটে্ঁ লা্ঁগে্ঁ খি্ঁদা্ঁ😷তো্ঁমা্ঁয়্ঁ দে্ঁখে্ঁ আ্ঁমি্ঁ ফি্ঁদা্ঁ✿⃝ 😌🫶❈┉`,
  `⎯͢⎯⃝🩵আ্ঁজ্ঁকে্ঁ ভা্ঁলো্ঁ হ্ঁয়ে্ঁ গে্ঁছি্ঁ দে্ঁই্ঁখা্ঁ কি্ঁছু্ঁ ক্ঁই্ঁলা্ঁম্‌ঁ না্ঁ\n\n😒⎯͢⎯⃝🩷🍒⎯͢⎯⃝`,
  `🩵༎😾⎯͢ হ্ঁই্ঁছে্ঁ ঢ্ঁং বা্ঁদ দা্ঁও্ঁ আ্ঁসো্ঁ প্রে্ঁম্ঁ ক্ঁরি্ঁ🙈♡⎯⃝༎❥︎⃝`,
  `┄┉𝄟⃟≛⃝💙হাঁজাঁরোঁ লুঁচ্চাঁ লু্ঁচ্চি্ঁর্ঁ বিঁড়েঁ আঁমিঁ এঁকঁ ♥⃝ ভা্ঁলো্ঁ মাৃনুঁষঁ ≛⃝💙𝄟 ❈┉❥︎`,
  `❥︎ꔹ┄🥱🤟🐸🌝🤧গা্ঁল্ঁটা্ঁ দে্ঁ তো্ঁরে্ঁ এ্ঁকৃ্ঁটা্ঁ চু্ঁম্মা্ঁ দে্ঁই্ঁ💋🌱🪽🪄`,
  `🤢💜✨⎯͢⎯⃝🥹༊𝄟≛😾"দে্ঁহি্ঁ ই্ঁক্টু্ঁ সা্ঁই্ঁট্ঁ দে্ঁ ও্ঁরে্ঁ,,থা্ঁপ্পা্ঁড়্ঁ,, দি্ঁমু্ঁ⎯💦🤥"`,
  `😒⎯͢⎯⃝★⎯͢⎯⃝🌚♦️-"I love you বি্ঁক্রি্ঁ ক্ঁর্ঁতে্ঁ আ্ঁস্ঁছি্ঁ-" 🙃\n\n🍁-!"তু্ঁমি্ঁ চা্ঁই্ঁলে্ঁ অ্ঁর্ডা্ঁর্ঁ দি্ঁতে্ঁ পা্ঁরো্ঁ ডে্ঁলি্ঁভা্ঁরি্ঁ -"🥵\n\n-"চা্ঁর্জ্ঁ চু্ঁম্মা্ঁহ্ঁ-"🥵💋`,
  `⎯͢⎯⃝ এ্ঁতো্ঁ ব্ঁড়ো্ঁ গ্ৰু্ঁপে্ঁ আ্ঁমা্ঁর্ঁ কে্ঁউ্ঁ না্ঁই্ঁ 😒🥹⎯͢⎯⃝😣🙂🌸⃝🩷Single থা্ঁক্ঁলে্ঁ ন্ঁক্ঁদি্ঁও্ঁ…You Tube দে্ঁখে্ঁ প্র্ঁচু্ঁর্ঁ ভা্ঁলো্ঁবা্ঁসা্ঁ শি্ঁখ্ঁছি্ঁ🙈🌸⃝🩷`,
  `⎯͢⎯͢✿⃟🌻😘ই্ঁয়ে্ঁ মা্ঁনে্ঁ,.. কি্ঁ.ব্ঁল্ঁবো্ঁ আ্ঁমা্ঁর্ঁ স্ঁর্ঁম্ঁ ক্ঁরে্ঁ ✿⃟‎‎‎‎‎🌷🐰😌😁⎯͢⎯͢`,
  `༆̞̎̎̎͢⋆⃝ও্ঁই্ঁ চ্ঁলো্ঁ ঈ্ঁদে্ঁর্ঁ প্ঁর্ঁ বি্ঁয়ে্ঁ ক্ঁরি্ঁ⎯͢⎯⃝🙈⎯⃝`,
  `🫵♡ ⎯͢ থা্ঁপ্ঁরা্ঁই্ঁয়া্ঁ লা্ঁল্ঁ ক্ঁরে্ঁ দি্ঁমু্ঁ⎯⃝ 🌺ব্ঁল্ঁ ভা্ঁলো্ঁবা্ঁসি্ঁ⎯͢⎯⃝`,
  `🩷╀❂❥তু্ঁই্ঁ .....!🫵\n\n⎯͢⎯⃝🙊য্ঁদি্ঁ আ্ঁমা্ঁর্ঁ হ্ঁই্ঁতি্ঁ রে্ঁ.....!🫣😊\n\n⎯͢⎯⃝🥴আ্ঁমি্ঁ হ্ঁই্ঁতা্ঁম্ঁ তো্ঁর্ঁ-....!🫵😒\n\n⎯͢⎯⃝🫣 তো্ঁরে্ঁ.....!🫵\n\n⎯͢⎯⃝🐸 উ্ঁড়া্ঁধূ্ঁরা্ঁ huma huma দি্ঁয়া্ঁ .....!🥱\n\n⎯͢⎯⃝ 🧐আ্ঁমি্ঁ দি্ঁতা্ঁম্ঁ দৌ্ঁড়্ঁ .....🏃‍♀️🏃‍♀️`,
  `༊༎_🍒ও্ঁগো্ঁ "শু্ঁন্ঁচো্ঁ🍒_༊༎⎯͢⎯⃝🥹আ্ঁমা্ঁরো্ঁ কি্ঁন্ত্ঁ এ্ঁটা্ঁ ই্ঁন্ঁব্ঁক্স্ঁ আ্ঁছে্ঁ 🥹⎯͢⎯⃝😼ԅ⁠(⁠ ͒⁠ ⁠۝ ͒⁠ ⁠)⁠ᕤ😼জা্ঁ দু্ঁষ্টু্ঁ এ্ঁভা্ঁবে্ঁ কে্ঁউ্ঁ ব্ঁলে্ঁԅ⁠(⁠ ͒⁠ ⁠۝ ͒⁠ ⁠)⁠ᕤ😂😂😂`,
  `⎯͢⎯⎯⎯͢࿐ ֟፝❍Ꭵᚐ  𝙰𝚂𝙾⎯⎯͢ডং ⎯͢কঁরিঁ-🤧`,
  `🤭❈⋆ স্ঁম্ঁয়্ঁ হো্ঁক্ঁ আ্ঁমি্ঁ এ্ঁক্ঁদি্ঁন্ঁ ম্ঁন্ঁ খু্ঁলে্ঁ 𝐢 𝐥𝐨𝐯𝐞 𝐲𝐨𝐮😍 ব্ঁল্ঁমু্ঁ𝄞⋆⃝𝄞🤟⋆⃝༎┉❈𒁍 𓆩`,
  `๛⃝➤⃚፝͜͡❥̈́͜͡⃝🌺-এ্ঁতো্ঁ যে্ঁ পে্ঁকে্ঁ গে্ঁছো্ঁ ব্ঁয়্ঁস্ঁ ক্ঁত্ঁ তো্ঁমা্ঁর্ঁ<!!🐸‣᭄⎯͢ ⸙-🌼💝⎯⎯͢ ֟፝আমার⎯⎯͢ ֟፝শহরে⎯⎯͢ ֟፝বস্তির⎯⎯͢ ֟፝ছেলে⎯⎯͢ ֟፝𝑵𝒐𝒕⎯⎯͢ ֟፝𝑨𝒍𝒍𝒂𝒘-!🤧🤮🤣•`,
  `⎯͢⎯⃝🫰😾এ্ঁই্ঁ ব্ঁয়্ঁসে্ঁ লু্ঁচ্চা্ঁমি্ঁ বা্ঁদ্ঁ দা্ঁও্ঁ প্রি্ঁয়্ঁ⎯͢⎯⃝🥹`,
  `😒✾𝄞⋆⃝𓊈‎✾🎤চো্ঁরি্ঁ চো্ঁরিঁ দি্ঁল্ঁ তে্ঁরা্ঁ চু্ঁরা্ঁয়ে্ঁঙ্গে্ঁ..!🖤🙈🎧ধী্ঁরে্ঁ ধী্ঁরে্ঁ তে্ঁরে্ঁ আ্ঁম্মু্ঁকো্ঁ শা্ঁশু্ঁরী্ঁ বা্ঁনা্ঁয়ে্ঁঙ্গে্ঁ-!!🐸🔪`,
  `👌ܔ⑅⃝➔✾𝄞m🙆‍♀️🤭🙊🙈🫵`,
  `😅🤟//_____𝐌𝐲 ঠো্ঁট্ঁ 💋𝐘𝐨𝐮𝐫 ঠো্ঁট্ঁ 💋 𝐓𝐡𝐞𝐲 টা্ঁর্চ্ঁ 🙈 𝐓𝐡𝐞𝐧উ্ঁম্মা্ঁহ্ঁ উ্ঁম্মা্ঁহ্ঁ _____//👀💋😌`,
  `🐸⎯⃝💚🌺তো্ঁর্ঁ মো্ঁন্ঁ পা্ঁরা্ঁয়্ঁ থা্ঁক্ঁতে্ঁ দে্ঁ আ্ঁমা্ঁয়্ঁ⎯͢⎯⃝😽😹⎯͢`,
  `⎯⃝🩵😹 এ্ঁই্ঁ মু্ঁহূ্ঁর্তে্ঁ আ্ঁপ্ঁনি্ঁ র্ঁং না্ঁম্বা্ঁরে্ঁ ডা্ঁয়া্ঁল্ঁ ক্ঁর্ঁছে্ঁন্ঁ, অ্ঁন্য্ঁ না্ঁম্বা্ঁরে্ঁ চে্ঁষ্টা্ঁ ক্ঁরে্ঁন্ঁ🤣⎯͢⎯⃝🩷`,
  `🍒🚬---❈🌺⋆⃝জা্ঁন্ঁ পা্ঁখি্ঁ⋆⃝🌼❈┄┉❈🐰⋆⃝টু্ঁকি্ঁ𝄞⋆⃝মু্ঁই্ঁ আ্ঁই্ঁশা্ঁ প্ঁর্ঁছি্ঁ🙊⋆⃝🌺❈┄চ্ঁল্ঁ༉༐༐🙈প্ঁলা্ঁয়ে্ঁ༉༐༐👻যা্ঁই্ঁ ✿⃝༉༐༐💚•`,
  `⎯͢⎯⃝🍒🩵হা্ঁমি্ঁ" সি্ঁঙ্গে্ঁল্ঁ" প্লি্ঁজ্ঁ "ডি্ঁস্টা্ঁর্ব্ঁ "মি্ঁহ্ঁ⎯͢⎯⃝🤦💦🥵`,
  `⎯͢🩷𝐌𝐑ꜛ⪼─⃞⤹ 𝐉🅤𝐖🅔𝐋ꜛ國🩷🪽`,
  `,, 🥹\n\n🫲🏻👚🫱🏻 \n\n👖\n\n°আ্ঁসো্ঁ বু্ঁকে্ঁ আ্ঁসো্ঁ🥹🙈 𝐏𝐢𝐨 🥲\n\n\nNodi তে্ঁ নি্ঁয়েঁ ফে্ঁলে্ঁ dei,,,!!!👻🥴🥴🤣আ্ঁমা্ঁর্ঁ প্রে্ঁমেৃঁ তো্ঁ প্ঁর্ঁবা্ঁ না্ঁㅤㅤㅤ ㅤ`,
  `٭ ⣿ ˔🎻 ๑\n\n𝄖𝄗𝄗𝄙𝄙𝄗𝄗𝄖\n\n⊹ ⎯ 🍥️️️️️ ֹ︵ ️️️️️️️️️️️️️️𐙚️️️️️️️️️️️️️️ __♡গ𝆠፝֟ল্পটা ত𝆠፝֟খন𝆠፝֟ই সু𝆠፝֟ন্দ𝆠፝֟র ছি𝆠፝֟লো,,য𝆠፝֟খন তু𝆠፝֟মি ছি𝆠፝֟লে অ𝆠፝֟পরি𝆠፝֟চি𝆠፝֟ত আ𝆠፝֟র আ𝆠፝֟মি ছি𝆠፝֟লা𝆠፝֟ম আ𝆠፝֟মি𝆠፝֟তে সী𝆠፝֟মাব𝆠፝֟দ্ধ♡"..__ ːꜛ:-❫ ⋆ 🫠💔🪽🥢\n\n⇄ʝυɯҽʅ !¡ -💗🌷🙂`,
  `٭ ⣿ ˔🎻 ๑\n\n𝄖𝄗𝄗𝄙𝄙𝄗𝄗𝄖\n\n⊹ ⎯ 🍥️️️️️ ֹ︵ ️️️️️️️️️️️️️️𐙚️️️️️️️️️️️️️️ __♡অ༐𝆠፝֟মি বড়𝆠፝֟ই লো𝆠፝֟ভী,,এ𝆠፝֟ত কি𝆠፝֟ছু থা𝆠፝֟ক༐𝆠፝֟র প𝆠፝֟র ও আ𝆠፝֟মি শু𝆠፝֟ধু তো𝆠፝֟ম༐𝆠፝֟র অ𝆠፝֟ভ༐𝆠፝֟বে অ𝆠፝֟ভ༐𝆠፝֟বী♡"..__ ːꜛ:-❫ ⋆ 😅💔🪽🥢\n\n⇄ʝυɯҽʅ !¡ -💗🌷🙂`,
  `:❯⁽🥂₎┆____মা𝆠፝֟য়༐ সব𝆠፝֟༐র প্র𝆠፝֟তি আ𝆠፝֟সে না,,য༐𝆠፝֟র প্র𝆠፝֟তি আ𝆠፝֟সে সে ক𝆠፝֟খ𝆠፝֟নো বু𝆠፝֟ঝে ন༐!🫶🫠🌸 ⁽🥢₎⊹-'́💜 ⊹.\n\n☺️🫶🎀ʝυɯҽʅ━♡َ❯❯ 🩷🪽࿐`,
  `𖥔🍶🤍🌷🎀\n\n─ ─  ─ ─ ─ ──  ─  ─  ─  ─ ─  ─ ─  ─ ─ ✧জীবন চলেছে এক অজানা গল্পের দিকে,,যারা শেষ কোথায় জানা নেই.!!🌷🫶🙂🎀\n\n𝄗 .ʿ𖣁.ʝυɯҽʅ𝅄۫🩷⊹🩶ღ₊\n\n﹌﹌﹌﹌﹌﹌﹌﹌﹌﹌𐙚 !`,
  `𖥔🍶🤍🌷\n\n🌷🎻︱─ ─ ─ ─ ─আমি হারিয়ে যাওয়া এক চিঠি"যা পৌঁছানোর আগে চিরে ফেলা হয়েছে ─ ─ ❯⤿🙂❤️‍🩹🪽⤸ -/ᜊ\n\n--🅙𝐮𝐰𝐞𝐥❯🪻🩷🪄ㅤㅤㅤ ㅤ!`,
  `٭ ⣿ ˔🎻 ๑\n\n𝄖𝄗𝄗𝄙𝄙𝄗𝄗𝄖\n\n⊹ ⎯ 🍥️️️️️ ֹ︵ ️️️️️️️️️️️️️️𐙚️️️️️️️️️️️️️️ __কেউ কারো আপন নয়,,কিছুটা মায়া"আর বাকিটা অভিনয় "..__ ːꜛ:-❫ ⋆ 😅💔🪽🥢\n\n⇄🅙𝐮𝐰𝐞𝐥 !¡ -💗🌷🙂`,
  `───⤹💗⤸📰🌷🥢🪶\n\n╰─✎⿻ - - *জীবনটা ঘড়ির কাটার মতো হয়ে গেছে, প্রয়োজন ছাড়া কেউ ফিরেও তাকায় না.!🥺🖤* \n\n___۵__৫"অপ্রিয়"ܔ🅙𝐮𝐰𝐞𝐥😅𓆪🖤🌷ㅤㅤㅤ ㅤ!`,
  `٭ ⣿ ˔🎻 ๑\n\n𝄖𝄗𝄗𝄙𝄙𝄗𝄗𝄖\n\n⊹ ⎯ 🍥️️️️️ ֹ︵ ️️️️️️️️️️️️️️𐙚️️️️️️️️️️️️️️ কে𝆠፝֟উ ক༏𝆠፝֟রে༏𝆠፝֟ অ༏𝆠፝֟পন𝆠፝֟ ন𝆠፝֟য়,,কি𝆠፝֟ছুট༏𝆠፝֟ ম༏𝆠፝֟য়༏𝆠፝֟"অ༏𝆠፝֟র ব༏𝆠፝֟কিট༏𝆠፝֟ অ𝆠፝֟ভিন𝆠፝֟য় "...! ːꜛ:-❫ ⋆ 🙂🌷🪽🥢\n\n⇄🅙𝆠፝֟𝐮𝐰𝆠፝֟𝐞𝐥 !¡ -💗🌷🙂`,
  `───⤹󰟱⤸︵🩷🪽\n\n╰─⤹➥꯭‌𝆺꯭𝅥‌〲𝐘𝗼͜͡𝘂 𝐀𝗿𝗲 𝐓𝗵𝗲 𝐌𝗼͜͡𝘀𝘁 𝐏𝗿𝗲𝗰͜͡𝗶𝗼𝘂𝘀 𝐏𝗮͜͡𝗿𝘁 𝐎𝐟 𝐌𝘆 𝐋𝗶𝗳͜͡𝗲〲⊰𝟑⤹🐝🌷🌻⤸ ✧ !`,
  `˖°☁️🌷།國།⋆ ˚｡⋆୨୧˚\n\n‎─⪼আর যে অভিযোগ অবশিষ্টツ\n\nথাকবে সেগুলো কাফনের উপর\n\nলিখে রাইখো আমার_-💔🙂\n\n✧˖°☁️🌷།國།⋆ ˚｡⋆୨୧️️️️`,
  `─ ─ - মা𝆠፝֟নুষ আপন সাজে, ত𝆠፝֟বে কেউই আপন হ-𝆠፝֟য় না বার-বা𝆠፝֟র প্রমা𝆠፝֟ন পাচ্ছি: তবুও আ𝆠፝֟মার শি-ক্ষা হয় না𝆠፝֟! -:›❯🦋😌🩵💌🌻\n\n乛 ꜛᏯ࿐🖤🥀✅`,
  `───⤹📰⤸🩵🌷🥢\n\n╰── ⊹⎯͢জীবনে অসাধারণ কাউকে খুঁজোনা, সাধারণ কাউকে খুজো যে তোমাকে অসাধারণ করে রাখবে-❯•⊰𝟑⤹💜🌼⤸🍓🌷✧ ˖°`,
  `☁️🌷།國།⋆ ˚｡⋆୨୧˚\n\n-তোমার জন্য অপেক্ষা করাটাツ\n\nক্লান্তিকর নয়,বরং ভালোবাসার'\n\nসবচেয়ে সুন্দরতম অধ্যায়'🫂\n\n✧˖°☁️🌷།國།⋆ ˚｡⋆୨୧`,
  `°☁️🌷།國།⋆ ˚｡⋆୨୧˚\n\n─ Ꮗ ভালোবাসা সুন্দর যদি তুমি এই স্বার্থপর পৃথিবী'র মাঝে একজন সত্যিকারে'র বিশ্বস্ত মানুষ খুঁজে পাও"...🤍:)💜َ🌷🥢>\n\n˖°☁️🌷།國།⋆ ˚｡⋆୨୧˚`,
  `- ●───༊༆ 😩\n\n༎ ༎পত্রিকায় ༎ দেখলাম༎🥶\n\n༎এই গ্রুপে আমি ༎ নাকি༎ একমাত্র ༎༎ single মেয়ে 😼😼😁🤪\n\n- ●───༊`,
  `༆─'⸙ স্নিগ্ধতা'র এক টুকরো আলো'র স্পর্শে মুগ্ধতা'র আবরণে আমার সব'টুকু জুড়ে শুধু'ই তুমি -!🩵✨🌷ㅤㅤㅤㅤㅤㅤ✧`,
  `˖°☁️🌷國⋆ ˚｡⋆୨୧˚\n\n─ Ꮗচলে আয় চুপটি করে ভেসে যাই প্রেম সাগরে'-চল কুড়োই মুক্ত ঝিনুক দুজনে আলতো করে-)✨💚🌷💫\n\nㅤㅤㅤㅤㅤㅤ✧˖°☁️🌷國⋆ ˚｡⋆୨୧˚`,
  `এক দফা এক দাবি\n\n🇬‌🇫‌ চাৃ্ঁইৃ্ঁ\n\n✊\n\n\\\n\n\\ 🥺\n\n( )>\n\n_/ \\_\n\n🇧‌🇴‌🇼‌ চাৃ্ঁইৃ্ঁ\n\n✊\n\n\\\n\n\\ 🥺\n\n( )>\n\n_/ \\_`,
  `⎯͢⎯⃝ 🫤 𝐌𝐲 ঠো্ঁট্ঁ 👄𝐘𝐨𝐮𝐫 ঠো্ঁট্ঁ 👄👀 𝐓𝐡𝐞𝐲 টা্ঁর্চ্ঁ 🤌 𝐓𝐡𝐞𝐧 ঠা্ঁস্ঁ ঠা্ঁস্ঁ ⎯͢⎯⃝👋👋`
];

// ====== ফানি রিপ্লাই + প্রোফাইল ছবি ======
async function sendFunnyReplyWithImage(api, event, userID, userName) {
  const selectedReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];
  const styledReply = processReply(selectedReply);

  const avatarBuffer = await getUserProfilePicture(api, userID);

  if (avatarBuffer) {
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const avatarPath = path.join(cacheDir, `${userID}_avatar.jpg`);
    fs.writeFileSync(avatarPath, avatarBuffer);

    const msg = {
      body: `${styledReply}`,
      attachment: fs.createReadStream(avatarPath)
    };

    await sendTracked(api, msg, event.threadID, event.messageID);

    setTimeout(() => {
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }, 5000);
  } else {
    await sendTracked(api, styledReply, event.threadID, event.messageID);
  }
}

// ====== কনফিগ ======
module.exports.config = {
  name: "baby",
  aliases: [
    "maria", "hippi", "bby", "bbz", "xan", "mari",
    "jan", "babu", "kolixa",
    "বট", "bot",
    "নিলা", "নীলা", "জুই", "তিশা", "পিয়া", "পাখি", "মিম",
    "nila", "jui", "tisha", "pia", "pakhi", "mim"
  ],
  premium: false,
  version: "1.6.2",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: `AI auto teach + Typing effect | Credit: ${BOT_CREDIT}`,
  commandCategory: "chat",
  usages: "[query] | teach [Q] - [A] | tc [Q] - [A] | টিস [Q] - [A]",
  cooldowns: 0,
  prefix: false
};

// ====== ট্রিগার REGEX ======
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const TRIGGER_GROUP = TRIGGER_WORDS.map(escapeRegex).join("|");
const TRIGGER_REGEX = new RegExp(`^(${TRIGGER_GROUP})\\s+`, "i");
const COMMAND_SKIP_REGEX = new RegExp(
  `^(${TRIGGER_GROUP})\\s+(teach|tc|t|টিস|শিখাও|শেখাও|remove|rm|ডিলিট|delete|del|list|লিস্ট|edit|এডিট)(\\s|$)`,
  "i"
);

// ====== TEACH কমান্ড হ্যান্ডলার ======
async function handleTeach(api, event, uid, query) {
  // "teach" / "tc" / "টিস" / "শিখাও" / "t" — সব সাপোর্ট করবে
  const cleaned = query
    .replace(/^(teach|tc|t|টিস|শিখাও|শেখাও)\s+/i, "")
    .trim();

  const parts = cleaned.split(" - ");
  if (parts.length < 2 || !parts[0].trim() || !parts[1].trim()) {
    return api.sendMessage(
      `❌ | ব্যবহার: teach [প্রশ্ন] - [উত্তর]\n\n📌 উদাহরণ:\n• baby teach hi - hello\n• baby tc hi - hello\n• baby টিস hi - hello\n\n💠 Credit: ${BOT_CREDIT}`,
      event.threadID, event.messageID
    );
  }

  const ask = parts[0].trim();
  const ans = parts[1].trim();

  try {
    await axios.get(
      `${baseApiUrl}?teach=${encodeURIComponent(ask)}&reply=${encodeURIComponent(ans)}&senderID=${uid}&threadID=${event.threadID}`
    );
    return api.sendMessage(
      `✅ | নতুন টিচ যোগ হয়েছে!\n\n❓ প্রশ্ন: ${ask}\n💬 উত্তর: ${ans}\n\n💠 Credit: ${BOT_CREDIT}`,
      event.threadID, event.messageID
    );
  } catch (e) {
    console.error("Teach Error:", e.message);
    return api.sendMessage(
      `❌ | টিচ যোগ করা যায়নি!\n\n💠 Credit: ${BOT_CREDIT}`,
      event.threadID, event.messageID
    );
  }
}

// ====== RUN ======
// run শুধু teach / remove / list / edit কমান্ড সামলাবে।
// সাধারণ চ্যাট রিপ্লাই handleEvent দেবে (ডাবল রিপ্লাই ঠেকাতে)।
module.exports.run = async function ({ api, event, args, Users }) {
  if (event.senderID === api.getCurrentUserID()) return;

  const uid = event.senderID;
  const rawQuery = args.join(" ");
  const firstWord = args[0] ? args[0].toLowerCase() : "";

  const isTeach = ["teach", "tc", "t", "টিস", "শিখাও", "শেখাও"].includes(firstWord);
  const isRemove = ["remove", "rm", "ডিলিট", "delete", "del"].includes(firstWord);
  const isList = ["list", "লিস্ট"].includes(firstWord);
  const isEdit = ["edit", "এডিট"].includes(firstWord);

  // সাব-কমান্ড না হলে কিছু করবে না — handleEvent রিপ্লাই দেবে
  if (!isTeach && !isRemove && !isList && !isEdit) return;

  if (!isCreditValid()) return api.sendMessage(CREDIT_WARNING, event.threadID, event.messageID);

  try {
    if (!baseApiUrl) return api.sendMessage("❌ API not loaded yet.", event.threadID, event.messageID);

    // ✅ TEACH / TC / টিস / শিখাও
    if (isTeach) {
      return handleTeach(api, event, uid, rawQuery);
    }

    // ✅ REMOVE / RM
    if (isRemove) {
      const cleaned = rawQuery.replace(/^(remove|rm|ডিলিট|delete|del)\s+/i, "").trim();
      const parts = cleaned.split(" - ");
      if (parts.length < 1 || !parts[0].trim())
        return api.sendMessage(
          `❌ | ব্যবহার: remove [প্রশ্ন]\n\n💠 Credit: ${BOT_CREDIT}`,
          event.threadID, event.messageID
        );
      const ask = parts[0].trim();
      try {
        await axios.get(`${baseApiUrl}?remove=${encodeURIComponent(ask)}&senderID=${uid}`);
        return api.sendMessage(
          `✅ | রিমুভ করা হয়েছে!\n\n❓ প্রশ্ন: ${ask}\n\n💠 Credit: ${BOT_CREDIT}`,
          event.threadID, event.messageID
        );
      } catch (e) {
        return api.sendMessage(`❌ | রিমুভ করা যায়নি!\n\n💠 Credit: ${BOT_CREDIT}`, event.threadID, event.messageID);
      }
    }

    // ✅ LIST
    if (isList) {
      try {
        const res = await axios.get(`${baseApiUrl}?list=all`);
        if (res.data) {
          return api.sendMessage(
            `❇️ | Total Teach = ${res.data.length || "0"}\n♻️ | Total Response = ${res.data.responseLength || "0"}\n\n💠 Credit: ${BOT_CREDIT}`,
            event.threadID, event.messageID
          );
        } else return api.sendMessage(`❌ Error getting list\n\n💠 Credit: ${BOT_CREDIT}`, event.threadID, event.messageID);
      } catch (e) {
        return api.sendMessage(`❌ Error getting list\n\n💠 Credit: ${BOT_CREDIT}`, event.threadID, event.messageID);
      }
    }

    // ✅ EDIT
    if (isEdit) {
      const cleaned = rawQuery.replace(/^(edit|এডিট)\s+/i, "").trim();
      const parts = cleaned.split(" - ");
      if (parts.length < 2)
        return api.sendMessage(
          `❌ | ব্যবহার: edit [প্রশ্ন] - [নতুন উত্তর]\n\n💠 Credit: ${BOT_CREDIT}`,
          event.threadID, event.messageID
        );
      const ask = parts[0].trim();
      const newReply = parts[1].trim();
      try {
        await axios.get(`${baseApiUrl}?edit=${encodeURIComponent(ask)}&replace=${encodeURIComponent(newReply)}&senderID=${uid}`);
        return api.sendMessage(
          `✅ | এডিট হয়েছে!\n\n❓ প্রশ্ন: ${ask}\n💬 নতুন উত্তর: ${newReply}\n\n💠 Credit: ${BOT_CREDIT}`,
          event.threadID, event.messageID
        );
      } catch (e) {
        return api.sendMessage(`❌ | এডিট করা যায়নি!\n\n💠 Credit: ${BOT_CREDIT}`, event.threadID, event.messageID);
      }
    }
  } catch (e) {
    console.error("Run Error:", e.message);
  }
};

// ====== HANDLE EVENT ======
// সব চ্যাট রিপ্লাই (ট্রিগার শব্দ / প্রিফিক্স / বটের মেসেজে রিপ্লাই) এখানেই হ্যান্ডেল হয়
module.exports.handleEvent = async function ({ api, event, Users }) {
  if (event.senderID === api.getCurrentUserID()) return;

  const text = event.body?.toLowerCase().trim();
  if (!text || !baseApiUrl) return;

  // ✅ যদি "baby teach ..." বা "baby tc ..." টাইপ কমান্ড হয় → handleEvent skip (run সামলাবে)
  if (COMMAND_SKIP_REGEX.test(text)) return;

  const senderID = event.senderID;

  // শুধু বেবি কোডের নিজের পাঠানো মেসেজে রিপ্লাই হলেই true
  const isReplyToBot = !!(event.messageReply &&
    event.messageReply.senderID === api.getCurrentUserID() &&
    babyMessageIDs.has(event.messageReply.messageID));

  const isExactTrigger = TRIGGER_WORDS.some(t => text === t.toLowerCase());
  const hasPrefix = TRIGGER_REGEX.test(text);

  if (!isExactTrigger && !hasPrefix && !isReplyToBot) return;

  // ✅ একই মেসেজে দ্বিতীয়বার রিপ্লাই দেওয়া বন্ধ
  if (alreadyHandled(event.messageID)) return;

  if (!isCreditValid()) return api.sendMessage(CREDIT_WARNING, event.threadID, event.messageID);

  const senderName = await Users.getNameUser(senderID);

  if (isExactTrigger) {
    await sendTypingIndicator(api, event.threadID);
    await new Promise(r => setTimeout(r, 3000));
    await stopTypingIndicator(api, event.threadID);
    await sendFunnyReplyWithImage(api, event, senderID, senderName);
    return;
  }

  if (hasPrefix) {
    const query = text.replace(TRIGGER_REGEX, "").trim();
    if (!query) {
      await sendTypingIndicator(api, event.threadID);
      await new Promise(r => setTimeout(r, 3000));
      await stopTypingIndicator(api, event.threadID);
      await sendFunnyReplyWithImage(api, event, senderID, senderName);
      return;
    }

    await sendTypingIndicator(api, event.threadID);
    await new Promise(r => setTimeout(r, 5000));
    await stopTypingIndicator(api, event.threadID);

    try {
      const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(query)}&senderID=${senderID}&font=1`);
      let aiReply = res.data.reply || res.data.response;

      if (!aiReply || aiReply.trim() === "") {
        await sendFunnyReplyWithImage(api, event, senderID, senderName);
        return;
      }

      const styledReply = processReply(aiReply);
      return sendTracked(api, styledReply, event.threadID, event.messageID);
    } catch (e) {
      console.error("AI Error:", e.message);
      await sendFunnyReplyWithImage(api, event, senderID, senderName);
    }
    return;
  }

  if (isReplyToBot) {
    // ✅ অটো-টিচ: রিপ্লাই পাঠানোর আগেই চালু হবে (আগে return এর কারণে কখনো চলত না)
    const ask = event.messageReply.body?.toLowerCase().trim();
    const ans = event.body?.toLowerCase().trim();
    if (ask && ans && ask !== ans) {
      setTimeout(async () => {
        try {
          await axios.get(`${baseApiUrl}?teach=${encodeURIComponent(ask)}&reply=${encodeURIComponent(ans)}&senderID=${senderID}&threadID=${event.threadID}`);
          console.log("✅ Auto-taught:", ask, "→", ans);
        } catch (err) {
          console.error("❌ Auto-teach error:", err.message);
        }
      }, 300);
    }

    try {
      await sendTypingIndicator(api, event.threadID);
      await new Promise(r => setTimeout(r, 3000));
      await stopTypingIndicator(api, event.threadID);

      const res = await axios.get(`${baseApiUrl}?text=${encodeURIComponent(text)}&senderID=${senderID}&font=1`);
      let aiReply = res.data.reply || res.data.response;

      if (!aiReply || aiReply.trim() === "") {
        await sendFunnyReplyWithImage(api, event, senderID, senderName);
        return;
      }

      const styledReply = processReply(aiReply);
      return sendTracked(api, styledReply, event.threadID, event.messageID);
    } catch (e) {
      console.error("Reply AI Error:", e.message);
      await sendFunnyReplyWithImage(api, event, senderID, senderName);
    }
  }
};

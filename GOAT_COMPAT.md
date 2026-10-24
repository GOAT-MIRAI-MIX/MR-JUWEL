<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,18,24&height=200&section=header&text=Mirai%20%2B%20GoatBot&fontSize=54&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Hybrid%20Compatibility%20Guide&descSize=20&descAlignY=60" width="100%"/>
</p>

<p align="center">
  <img src="assets/juwel-logo.svg" alt="Mirai + Goat — JUWEL — MR JUWEL BOT" width="520"/>
</p>

<h1 align="center">🤖+🐐 Mirai-Goat-Mix — Hybrid guide</h1>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=20&duration=2600&pause=800&color=FFD200&center=true&vCenter=true&width=820&lines=Mirai+%2B+GoatBot+%E2%80%94+one+bot%2C+two+command+styles;Copy+the+file+%E2%86%92+restart+%E2%86%92+done;No+code+change+needed" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/🤖_MIRAI-CORE-ff4d4d?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/🐐_GOATBOT-COMPAT_LAYER-ffaa00?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/🔀_HYBRID-MODE-a855f7?style=for-the-badge"/>
</p>

---

এই ফর্কে **Mirai** আর **GoatBot** দুই ধরনের কমান্ড/ইভেন্ট কোডই চলে। বটের মূল কাঠামো (লঞ্চার, লগইন, লাইসেন্স) Mirai-র; GoatBot-এর কোড চালানোর জন্য একটা সামঞ্জস্য (compat) লেয়ার যোগ করা হয়েছে।

This fork runs **both Mirai-style and GoatBot-style** commands and events in the same folders. The core (launcher, login, license) is Mirai; a compatibility layer lets GoatBot code run unchanged.

<h2 align="center">🚀 কীভাবে ব্যবহার করবেন / How to use</h2>

```bash
npm install
# appstate.json এ কুকি বসান, config.json এ ADMINBOT/DEVELOPER এ আপনার UID দিন
npm start          # ⚠️ সবসময় npm start / node Juwel.js — node Main.js নয়
```

| আপনি যা চান | কোথায় রাখবেন |
|:---|:---|
| 🤖 Mirai কমান্ড | `Script/commands/` |
| 🐐 GoatBot কমান্ড (`scripts/cmds/*.js` থেকে) | `Script/commands/` *(কোনো পরিবর্তন ছাড়াই)* |
| 🤖 Mirai ইভেন্ট | `Script/events/` |
| 🐐 GoatBot ইভেন্ট (`scripts/events/*.js` থেকে) | `Script/events/` *(কোনো পরিবর্তন ছাড়াই)* |

> ✅ ফাইল কপি করে বট রিস্টার্ট দিলেই হলো।

---

<h2 align="center">✅ কী কী সাপোর্টেড (GoatBot) / What is supported</h2>

- 🧩 **`config`:** `name, aliases, role, countDown, category, author, version, shortDescription, longDescription, guide, envConfig, usePrefix` → Mirai-র `hasPermssion, cooldowns, commandCategory, credits, description, usages` এ স্বয়ংক্রিয়ভাবে ম্যাপ হয় *(শুধু যা নেই তাই যোগ হয়)*।
- 🎯 **Handlers:** `onStart`, `onChat`, `onReply`, `onReaction`, `onEvent`, `onAnyEvent`, `onFirstChat`, `onLoad`
- 📦 **প্যারামিটার:** `api, event, args, message, usersData, threadsData, globalData(stub), role, commandName, prefix, getLang, envCommands, removeCommandNameFromBody, Reply, Reaction`
- 💬 **`message`:** `reply / send / unsend / reaction / err` (Promise **এবং** callback দুটোই)
- 🌍 **Globals:** `global.GoatBot.onReply / onReaction / commands / aliases / config`, `global.db`, `global.temp`
- 🛠️ **`global.utils`:** `getStreamFromURL, getStreamsFromAttachment, downloadFile, getPrefix, getTime, convertTime, formatNumber, randomString, randomNumber, removeHomeDir, splitPage, translate, shortenURL, findUid, log, ...`
  *(Mirai-র নিজের `global.utils` ফাংশন আগের মতোই থাকে।)*
- 🈯 **Language:** `langs` + `getLang("key", ...vars)` (`%1`, `{pn}`, `{p}`, `{n}` সহ)
- 📡 **Events:** GoatBot ইভেন্ট ফাইল (`onStart` + ফাংশন রিটার্ন) — সব `log:*` ইভেন্টে চলে, ফাইল নিজে ফিল্টার করে।

> 🔑 **Role:** Goat `0/1/2` ↔ Mirai `hasPermssion` `0/1/2` *(ডেভেলপার = 3, Goat কমান্ডে 2 হিসেবে যায়)*।

---

<h2 align="center">🗄️ ডাটা কোথায় থাকে / Data mapping</h2>

| Goat API | Mirai-তে যা হয় |
|:---|:---|
| `usersData.get(uid)` | Mirai `Users` + `Currencies` টেবিল (`money`, `exp` Currencies থেকে; `data` = Mirai `data` কলাম) |
| `threadsData.get(tid)` | Mirai `Threads` টেবিল + লাইভ `getThreadInfo` (`adminIDs` Goat-এর মতো আইডির অ্যারে) |

---

<h2 align="center">⚠️ পরিচিত সীমাবদ্ধতা / Known limitations</h2>

- ❌ GoatBot ড্যাশবোর্ড, MongoDB, `globalData`, Google Drive/imgbb আপলোড (`utils.drive`, `utils.uploadImgbb`) সাপোর্টেড নয় — কল করলে স্পষ্ট এরর মেসেজ আসে, বট ক্র্যাশ করে না।
- ❌ `loadScripts/unloadScripts` (কমান্ড হট-লোড, যেমন Goat-এর `cmd` কমান্ড) নেই — ফাইল কপি করে রিস্টার্ট দিন।
- ⚠️ `onStart`-এ Goat কমান্ড `api.getThreadInfo(id)` ইত্যাদি Promise স্টাইলে ডাকলে সেটা আপনার FCA (`sahu-fca`) Promise সাপোর্ট করার ওপর নির্ভর করে।
- 📦 কমান্ড অতিরিক্ত npm প্যাকেজ চাইলে `npm i <package>` দিন (Goat-এর সাধারণ প্যাকেজ — cheerio, lodash, qrcode ইত্যাদি — `package.json`-এ আছে)।

---

<h2 align="center">🧬 ভেতরে কী আছে / Internals</h2>

| ফাইল | কাজ |
|:---|:---|
| `Juwel.js` | `Main.js` চালানোর সময় `--require includes/compat/preload.js` যোগ করে |
| `includes/compat/preload.js` | `Script/commands` ও `Script/events` এর ফাইল require হলে Goat → Mirai রূপান্তর |
| `includes/compat/goatRuntime.js` | অ্যাডাপ্টার + `onChat/onReply/onReaction/onEvent` ডিসপ্যাচ + `global.GoatBot` |
| `includes/compat/goatApi.js` | `message`, `usersData`, `threadsData`, `getLang` |
| `includes/compat/goatUtils.js` | Goat-স্টাইল `global.utils` হেল্পার |
| `includes/handle/handle{OnChat,Reply,Reaction,Event}.js` | Goat ডিসপ্যাচ হুক (Mirai লজিক অপরিবর্তিত) |

> 🔒 `Main.js` (এনক্রিপ্টেড) একটুও পরিবর্তন করা হয়নি।

---

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/⬅_BACK_TO-README-00c6ff?style=for-the-badge"/></a>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,18,24&height=110&section=footer"/>
</p>

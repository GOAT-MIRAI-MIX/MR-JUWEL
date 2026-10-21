# 🐐+🪽 Mirai-Goat-Mix — Hybrid guide

এই ফর্কে **Mirai** আর **GoatBot** দুই ধরনের কমান্ড/ইভেন্ট কোডই চলে। বটের মূল কাঠামো (লঞ্চার, লগইন, লাইসেন্স) Mirai-র; GoatBot-এর কোড চালানোর জন্য একটা সামঞ্জস্য (compat) লেয়ার যোগ করা হয়েছে।

This fork runs **both Mirai-style and GoatBot-style** commands and events in the same folders. The core (launcher, login, license) is Mirai; a compatibility layer lets GoatBot code run unchanged.

## কীভাবে ব্যবহার করবেন / How to use

```bash
npm install
# appstate.json এ কুকি বসান, config.json এ ADMINBOT/DEVELOPER এ আপনার UID দিন
npm start          # ⚠️ সবসময় npm start / node Juwel.js — node Main.js নয়
```

| আপনি যা চান | কোথায় রাখবেন |
|---|---|
| Mirai কমান্ড | `Script/commands/` |
| GoatBot কমান্ড (`scripts/cmds/*.js` থেকে) | `Script/commands/` (কোনো পরিবর্তন ছাড়াই) |
| Mirai ইভেন্ট | `Script/events/` |
| GoatBot ইভেন্ট (`scripts/events/*.js` থেকে) | `Script/events/` (কোনো পরিবর্তন ছাড়াই) |

ফাইল কপি করে বট রিস্টার্ট দিলেই হলো।

## কী কী সাপোর্টেড (GoatBot) / What is supported

- `config`: `name, aliases, role, countDown, category, author, version, shortDescription, longDescription, guide, envConfig, usePrefix` → Mirai-র `hasPermssion, cooldowns, commandCategory, credits, description, usages` এ স্বয়ংক্রিয়ভাবে ম্যাপ হয় (শুধু যা নেই তাই যোগ হয়)।
- `onStart`, `onChat`, `onReply`, `onReaction`, `onEvent`, `onAnyEvent`, `onFirstChat`, `onLoad`
- প্যারামিটার: `api, event, args, message, usersData, threadsData, globalData(stub), role, commandName, prefix, getLang, envCommands, removeCommandNameFromBody, Reply, Reaction`
- `message.reply / send / unsend / reaction / err` (Promise **এবং** callback দুটোই)
- `global.GoatBot.onReply / onReaction / commands / aliases / config`, `global.db`, `global.temp`
- `global.utils`: `getStreamFromURL, getStreamsFromAttachment, downloadFile, getPrefix, getTime, convertTime, formatNumber, randomString, randomNumber, removeHomeDir, splitPage, translate, shortenURL, findUid, log, ...`
  (Mirai-র নিজের `global.utils` ফাংশন আগের মতোই থাকে।)
- `langs` + `getLang("key", ...vars)` (`%1`, `{pn}`, `{p}`, `{n}` সহ)
- GoatBot ইভেন্ট ফাইল (`onStart` + ফাংশন রিটার্ন) — সব `log:*` ইভেন্টে চলে, ফাইল নিজে ফিল্টার করে।

Role: Goat `0/1/2` ↔ Mirai `hasPermssion` `0/1/2` (ডেভেলপার = 3, Goat কমান্ডে 2 হিসেবে যায়)।

## ডাটা কোথায় থাকে / Data mapping

- `usersData.get(uid)` → Mirai `Users` + `Currencies` টেবিল (`money`, `exp` Currencies থেকে; `data` = Mirai `data` কলাম)
- `threadsData.get(tid)` → Mirai `Threads` টেবিল + লাইভ `getThreadInfo` (`adminIDs` Goat-এর মতো আইডির অ্যারে)

## পরিচিত সীমাবদ্ধতা / Known limitations

- GoatBot ড্যাশবোর্ড, MongoDB, `globalData`, Google Drive/imgbb আপলোড (`utils.drive`, `utils.uploadImgbb`) সাপোর্টেড নয় — কল করলে স্পষ্ট এরর মেসেজ আসে, বট ক্র্যাশ করে না।
- `loadScripts/unloadScripts` (কমান্ড হট-লোড, যেমন Goat-এর `cmd` কমান্ড) নেই — ফাইল কপি করে রিস্টার্ট দিন।
- `onStart`-এ Goat কমান্ড `api.getThreadInfo(id)` ইত্যাদি Promise স্টাইলে ডাকলে সেটা আপনার FCA (`sahu-fca`) Promise সাপোর্ট করার ওপর নির্ভর করে।
- কমান্ড অতিরিক্ত npm প্যাকেজ চাইলে `npm i <package>` দিন (Goat-এর সাধারণ প্যাকেজ — cheerio, lodash, qrcode ইত্যাদি — `package.json`-এ আছে)।

## ভেতরে কী আছে / Internals

| ফাইল | কাজ |
|---|---|
| `Juwel.js` | `Main.js` চালানোর সময় `--require includes/compat/preload.js` যোগ করে |
| `includes/compat/preload.js` | `Script/commands` ও `Script/events` এর ফাইল require হলে Goat → Mirai রূপান্তর |
| `includes/compat/goatRuntime.js` | অ্যাডাপ্টার + `onChat/onReply/onReaction/onEvent` ডিসপ্যাচ + `global.GoatBot` |
| `includes/compat/goatApi.js` | `message`, `usersData`, `threadsData`, `getLang` |
| `includes/compat/goatUtils.js` | Goat-স্টাইল `global.utils` হেল্পার |
| `includes/handle/handle{OnChat,Reply,Reaction,Event}.js` | Goat ডিসপ্যাচ হুক (Mirai লজিক অপরিবর্তিত) |

`Main.js` (এনক্রিপ্টেড) একটুও পরিবর্তন করা হয়নি।

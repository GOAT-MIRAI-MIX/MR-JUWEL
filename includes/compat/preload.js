// 🔧 includes/compat/preload.js
//
// উদ্দেশ্য: Main.js (এনক্রিপ্ট করা, এডিট করা নিষেধ) প্রতিটি কমান্ড/ইভেন্ট ফাইল লোড
// করার সময় চেক করে যে module.exports.run একটা function কিনা — না থাকলে ফাইলটা
// বাতিল (reject) করে দেয়। কিন্তু GodBot / Mirai ধাঁচের কমান্ড ফাইলগুলো সাধারণত
// `run` না লিখে `onStart` লেখে (সাথে message/usersData/threadsData প্যারামিটার)।
//
// এই ফাইলটা Node-এর require() সিস্টেমে hook করে, এবং Script/commands ও
// Script/events ফোল্ডারের প্রতিটা ফাইল require হওয়ার পরে — যদি `run` না থাকে কিন্তু
// `onStart` থাকে — তাহলে একটা সামঞ্জস্যপূর্ণ (compatible) `run` ফাংশন নিজে বানিয়ে
// বসিয়ে দেয়, যেটা ভেতরে ভেতরে `onStart`-কে Goat/Mirai স্টাইলের প্যারামিটার
// (message, usersData, threadsData, role, getLang ইত্যাদি) দিয়ে কল করে।
//
// এই ফাইলে কোনো কিছু ডিলিট/পরিবর্তন করা হয় না, শুধু যা অনুপস্থিত তা যোগ করে দেয়।
// তাই আগের সব `run()` স্টাইলের কমান্ড/ইভেন্ট আগের মতোই চলবে।

const Module = require('module');
const path = require('path');
const { buildMessage, buildUsersData, buildThreadsData } = require('./goatApi');

const COMMANDS_DIR = path.sep + path.join('Script', 'commands') + path.sep;
const EVENTS_DIR = path.sep + path.join('Script', 'events') + path.sep;

const adaptedFiles = new WeakSet();

function adaptCommandModule(mod) {
  if (!mod || typeof mod !== 'object') return;
  if (adaptedFiles.has(mod)) return;
  if (typeof mod.run === 'function') return; // আগের স্টাইল — কিছু করার দরকার নেই
  const entry = mod.onStart || mod.onLaunch || mod.execute;
  if (typeof entry !== 'function') return; // এটা কোনো কমান্ড ফাইলই না, বা দুটোর একটাও নেই

  const cfg = mod.config || (mod.config = {});
  // Goat/Mirai-তে role: 0 (সবাই), 1 (থ্রেড-এডমিন), 2 (বট-এডমিন)
  if (cfg.role !== undefined && cfg.permission === undefined && cfg.hasPermission === undefined && cfg.hasPermssion === undefined) {
    cfg.permission = cfg.role;
  }

  mod.run = async function (Obj) {
    const { api, event, args, models, Users, Threads, Currencies, permssion, getText, commandName, usedName } = Obj;
    const message = buildMessage(api, event);
    const usersData = buildUsersData(Users, Currencies);
    const threadsData = buildThreadsData(Threads);
    const goatObj = {
      api, event, args, message,
      usersData, threadsData,
      globalData: global.data,
      role: permssion,
      permssion,
      commandName, usedName,
      getLang: getText, getText,
      models, Users, Threads, Currencies
    };
    return entry.call(mod, goatObj);
  };

  // onReply / onReaction (GoatBot নাম) → handleReply / handleReaction (এই বটের নাম) ব্রিজ
  if (typeof mod.onReply === 'function' && typeof mod.handleReply !== 'function') {
    mod.handleReply = function (Obj) {
      const { api, event, models, Users, Threads, Currencies, handleReply, getText } = Obj;
      const message = buildMessage(api, event);
      const usersData = buildUsersData(Users, Currencies);
      const threadsData = buildThreadsData(Threads);
      return mod.onReply({
        api, event, message, usersData, threadsData,
        globalData: global.data, Reply: handleReply,
        getLang: getText, getText, models, Users, Threads, Currencies
      });
    };
  }
  if (typeof mod.onReaction === 'function' && typeof mod.handleReaction !== 'function') {
    mod.handleReaction = function (Obj) {
      const { api, event, models, Users, Threads, Currencies, handleReaction, getText } = Obj;
      const message = buildMessage(api, event);
      const usersData = buildUsersData(Users, Currencies);
      const threadsData = buildThreadsData(Threads);
      return mod.onReaction({
        api, event, message, usersData, threadsData,
        globalData: global.data, Reaction: handleReaction,
        getLang: getText, getText, models, Users, Threads, Currencies
      });
    };
  }

  adaptedFiles.add(mod);
}

function adaptEventModule(mod) {
  if (!mod || typeof mod !== 'object') return;
  if (adaptedFiles.has(mod)) return;
  if (typeof mod.run === 'function') return;
  const entry = mod.onStart || mod.onLaunch || mod.execute;
  if (typeof entry !== 'function') return;
  // ইভেন্ট ফাইলের Obj আকৃতি (api, event, models, Users, Threads, Currencies) দুই
  // ফ্রেমওয়ার্কেই প্রায় একই, তাই সরাসরি বাইন্ড করাই যথেষ্ট।
  mod.run = entry.bind(mod);
  adaptedFiles.add(mod);
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  const exported = originalRequire.apply(this, arguments);
  try {
    if (exported && typeof exported === 'object' && exported.config) {
      let resolved = null;
      try { resolved = Module._resolveFilename(request, this); } catch (e) {}
      if (resolved) {
        if (resolved.includes(COMMANDS_DIR)) adaptCommandModule(exported);
        else if (resolved.includes(EVENTS_DIR)) adaptEventModule(exported);
      }
    }
  } catch (e) {
    // কখনোই এই শিম-এর কারণে বট ক্র্যাশ করা উচিত না
    try { console.log('[compat/preload] adapt error:', e && e.message); } catch (e2) {}
  }
  return exported;
};

// অনেক GodBot/Mirai কমান্ড ফাইল সরাসরি global.GoatBot রেফারেন্স করে।
// বট চালু হওয়ার পরে (Main.js যখন global.client বানাবে) সেটার সাথেই
// global.GoatBot-কে লিংক করে দেওয়া হয়, যাতে global.GoatBot.commands,
// global.GoatBot.onReply ইত্যাদি কাজ করে — একদম আসল global.client-এর মতোই।
Object.defineProperty(global, 'GoatBot', {
  configurable: true,
  enumerable: true,
  get() { return global.client; },
  set(v) { /* ignore - keep aliasing to global.client */ }
});

console.log('[compat/preload] GoatBot/Mirai command & event compatibility layer loaded.');

// 🔧 includes/compat/preload.js
//
// মিরাই + গড হাইব্রিড লেয়ার — Juwel.js বটকে `node --require includes/compat/preload.js Main.js`
// দিয়ে চালায়, তাই Main.js (এনক্রিপ্ট করা, এডিট করা যায় না) কোনো ফাইল লোড করার আগেই এটা চালু হয়।
//
// কী করে:
//   • Script/commands ও Script/events থেকে যে ফাইলই require হোক, সেটা GoatBot স্টাইলের
//     (onStart / onChat / onReply / onReaction / onEvent ...) হলে মিরাইয়ের `run` + config
//     ফরম্যাটে রূপান্তর করে দেয়। মিরাই স্টাইলের ফাইলে হাত দেয় না।
//   • global.GoatBot, global.db, global.temp এবং global.utils-এ Goat helper যোগ করে
//     (global.utils-এর মিরাই ফাংশনগুলো আগের মতোই থাকে)।
//
// ফলে: Script/commands বা Script/events ফোল্ডারে মিরাই কোড রাখলেও চলে, গডবটের কোড রাখলেও চলে।

const Module = require("module");
const path = require("path");
const runtime = require("./goatRuntime");

const COMMANDS_DIR = path.sep + path.join("Script", "commands") + path.sep;
const EVENTS_DIR = path.sep + path.join("Script", "events") + path.sep;

runtime.installGlobals();

const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  const exported = originalRequire.apply(this, arguments);
  try {
    if (exported && typeof exported === "object" && exported.config && typeof request === "string" && request.indexOf("Script") !== -1) {
      let resolved = null;
      try { resolved = Module._resolveFilename(request, this); } catch (e) { /* ignore */ }
      if (resolved) {
        if (resolved.includes(COMMANDS_DIR)) runtime.adaptCommandModule(exported);
        else if (resolved.includes(EVENTS_DIR)) runtime.adaptEventModule(exported);
      }
    }
  } catch (e) {
    // এই শিম-এর কারণে বট কখনো ক্র্যাশ করবে না
    try { console.log("[compat/preload] adapt error:", e && e.message); } catch (e2) { /* ignore */ }
  }
  return exported;
};

console.log("[compat/preload] Mirai + GoatBot hybrid layer loaded (Goat commands/events supported in Script/commands & Script/events).");

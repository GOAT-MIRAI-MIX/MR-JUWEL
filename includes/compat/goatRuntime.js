// 🔧 includes/compat/goatRuntime.js
//
// GoatBot ↔ Mirai হাইব্রিড রানটাইম।
//
//  1) installGlobals()      — global.GoatBot, global.db, global.temp, global.utils (Goat helpers যোগ)
//  2) adaptCommandModule()  — Goat কমান্ড (onStart/onChat/onReply/...) → মিরাই `run` + config
//  3) adaptEventModule()    — Goat ইভেন্ট (onStart) → মিরাই `run`
//  4) dispatchXxx()         — মিরাই হ্যান্ডলার (handleOnChat/handleReply/handleReaction/handleEvent)
//                             থেকে ডাকা হয়, Goat-এর onChat/onReply/onReaction/onEvent/onAnyEvent/
//                             onFirstChat চালায়।
//
// মিরাইয়ের Main.js (এনক্রিপ্টেড) বা কোনো মিরাই কমান্ডের আচরণ এখানে বদলানো হয় না।

const path = require("path");
const goatUtils = require("./goatUtils");
const api_ = require("./goatApi");
const { buildMessage, buildParams, computeRole } = api_;

const warnOnce = new Set();
const logErr = (tag, err) => {
  try { console.error(`[goat-compat] ${tag}:`, err && err.stack ? err.stack.split("\n").slice(0, 4).join("\n") : err); } catch (e) { /* ignore */ }
};

/* ============================ 1) GLOBALS ============================ */
let installed = false;

function installGlobals() {
  if (installed) return;
  installed = true;

  /* ---- global.utils : মিরাইয়ের utils + Goat helpers (মিরাই আগে) ---- */
  let miraiUtils;
  const goatExtra = Object.assign({}, goatUtils, { message: (api, event) => buildMessage(api, event) });
  const mergedUtils = new Proxy({}, {
    get(_, k) { if (miraiUtils && miraiUtils[k] !== undefined) return miraiUtils[k]; return goatExtra[k]; },
    set(_, k, v) { if (miraiUtils) miraiUtils[k] = v; else goatExtra[k] = v; return true; },
    has(_, k) { return (miraiUtils && k in miraiUtils) || k in goatExtra; },
    ownKeys() { return Array.from(new Set([...(miraiUtils ? Reflect.ownKeys(miraiUtils) : []), ...Reflect.ownKeys(goatExtra)])); },
    getOwnPropertyDescriptor(_, k) {
      const src = miraiUtils && k in miraiUtils ? miraiUtils : goatExtra;
      if (!(k in src)) return undefined;
      return { configurable: true, enumerable: true, writable: true, value: src[k] };
    }
  });
  Object.defineProperty(global, "utils", {
    configurable: true, enumerable: true,
    get() { return mergedUtils; },
    set(v) { miraiUtils = v; }
  });

  /* ---- global.GoatBot.config : global.config এর Goat-স্টাইল ভিউ ---- */
  const cfgOverrides = {};
  const goatConfig = new Proxy({}, {
    get(_, k) {
      if (k in cfgOverrides) return cfgOverrides[k];
      const c = global.config || {};
      switch (k) {
        case "prefix": return c.PREFIX;
        case "adminBot": return Array.from(new Set([...(c.ADMINBOT || []), ...(c.DEVELOPER || [])].map(String)));
        case "language": return c.language || "en";
        case "timeZone": return c.timeZone || "Asia/Dhaka";
        case "botName": case "nickNameBot": return c.BOTNAME;
        case "adminOnly": return { enable: c.adminOnly === true, ignoreCommand: [], ignoreCommandThreadID: [] };
        case "hideNotiMessage": return {};
        case "antiInbox": return false;
        case "whiteListMode": case "whiteListModeThread": return { enable: false, whiteListIds: [], whiteListThreadIds: [] };
        case "noPrefix": return { enable: false };
        case "reactUnsend": return { enable: false, emojis: c.reactUnsend || [] };
        case "database": return { type: "sqlite", autoRefreshThreadInfoFirstTime: false };
        case "credentials": return { gmailAccount: {}, imgbbApiKey: "" };
        case "dashBoard": return { enable: false };
        case "serverUptime": return { enable: false };
        default: return c[k];
      }
    },
    set(_, k, v) { cfgOverrides[k] = v; return true; },
    has(_, k) { return k in cfgOverrides || (global.config && k in global.config); }
  });

  /* ---- global.GoatBot ---- */
  const state = {
    onReply: new Map(), onReaction: new Map(),
    onChat: [], onEvent: [], onFirstChat: [], onAnyEvent: [],
    eventCommands: new Map(),
    commandFilesPath: [], eventCommandsFilesPath: [],
    config: goatConfig,
    // envCommands/envEvents = মিরাইয়ের global.configModule (config.envConfig থেকে ভরা হয়)
    configCommands: {
      envGlobal: {},
      get envCommands() { return global.configModule || (global.configModule = {}); },
      get envEvents() { return global.configModule || (global.configModule = {}); }
    },
    startTime: Date.now(),
    isHybrid: true
  };
  const GoatBot = new Proxy(state, {
    get(t, k) {
      if (k in t) return t[k];
      const c = global.client;
      if (k === "aliases") return c ? c.commandAliases : new Map();
      if (k === "fcaApi" || k === "api") return c ? c.api : undefined;
      if (k === "botID") { try { return c.api.getCurrentUserID(); } catch (e) { return undefined; } }
      if (c && k in c) return c[k];
      return undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
    has(t, k) { return k in t || (global.client ? k in global.client : false); }
  });
  Object.defineProperty(global, "GoatBot", { configurable: true, enumerable: true, get() { return GoatBot; }, set() { /* ignore */ } });

  /* ---- global.db / global.temp ---- */
  const db = {
    get allUserData() {
      const d = global.data || {};
      return (d.allUserID || []).map(id => ({ userID: String(id), name: (d.userName && d.userName.get(String(id))) || "", money: 0, exp: 0, banned: { status: !!(d.userBanned && d.userBanned.has(String(id))) }, settings: {}, data: {} }));
    },
    get allThreadData() {
      const d = global.data || {};
      return (d.allThreadID || []).map(id => {
        const info = (d.threadInfo && d.threadInfo.get(String(id))) || {};
        return { threadID: String(id), threadName: info.threadName || "", adminIDs: (info.adminIDs || []).map(a => String(a && a.id !== undefined ? a.id : a)), members: [], banned: { status: !!(d.threadBanned && d.threadBanned.has(String(id))) }, settings: {}, data: (d.threadData && d.threadData.get(String(id))) || {} };
      });
    },
    allGlobalData: [], allDashBoardData: [], receivedTheFirstMessage: {},
    globalModel: null, threadModel: null, userModel: null, dashBoardModel: null,
    dashBoardData: null
  };
  if (!global.db) global.db = db;
  if (!global.temp) global.temp = { createThreadDataError: [], isLoading: false };
  if (global.statusAccountBot === undefined) global.statusAccountBot = "good";
}

function ensureClientProps() {
  const c = global.client;
  if (!c) return;
  if (!c.dirConfig) c.dirConfig = path.join(process.cwd(), "config.json");
  if (!c.dirConfigCommands) c.dirConfigCommands = path.join(process.cwd(), "configCommands.json");
  if (!c.cache) c.cache = {};
  if (!c.busyList) c.busyList = [];
}

/* ============================ 2) ADAPTERS ============================ */
const GOAT_HANDLERS = ["onStart", "onChat", "onReply", "onReaction", "onEvent", "onAnyEvent", "onFirstChat"];
const adapted = new WeakSet();

const pickLang = v => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.en || v.bn || v[Object.keys(v)[0]];
  return String(v);
};

// Goat কমান্ড অনেক সময় অন্য কমান্ডের envConfig টপ-লেভেলে পড়ে (যেমন rankup → rank.deltaNext);
// তাই require-এর সময়েই envConfig-এর ডিফল্ট global.configModule-এ বসিয়ে দেওয়া হয়
// (মিরাইয়ের নিজস্ব loader পরে config.json-এর মান দিয়ে ওভাররাইড করে)।
function seedEnvConfig(mod) {
  try {
    const cfg = mod.config;
    if (!cfg || !cfg.name || !cfg.envConfig || typeof cfg.envConfig !== "object") return;
    const store = global.configModule || (global.configModule = {});
    if (!store[cfg.name] || typeof store[cfg.name] !== "object") store[cfg.name] = {};
    for (const k of Object.keys(cfg.envConfig)) if (store[cfg.name][k] === undefined) store[cfg.name][k] = cfg.envConfig[k];
  } catch (e) { /* ignore */ }
}

function normalizeCommandConfig(mod) {
  const cfg = mod.config || (mod.config = {});
  seedEnvConfig(mod);
  const roleVal = (typeof cfg.role === "object" && cfg.role) ? cfg.role.onStart : cfg.role;
  if (cfg.commandCategory === undefined) cfg.commandCategory = String(cfg.category || "goat");
  if (cfg.hasPermssion === undefined && cfg.hasPermission === undefined && cfg.permission === undefined) {
    cfg.hasPermssion = Number(roleVal) || 0;
  }
  if (cfg.cooldowns === undefined) cfg.cooldowns = cfg.countDown !== undefined ? Number(cfg.countDown) || 0 : 1;
  if (cfg.credits === undefined && cfg.author !== undefined) cfg.credits = cfg.author;
  if (cfg.version !== undefined) cfg.version = String(cfg.version);
  if (cfg.description === undefined || typeof cfg.description === "object") {
    cfg.description = pickLang(cfg.description) || pickLang(cfg.shortDescription) || pickLang(cfg.longDescription) || "";
  }
  if (cfg.usages === undefined && cfg.guide !== undefined) {
    const g = pickLang(cfg.guide);
    if (g !== undefined) cfg.usages = String(g).replace(/\{(?:p|prefix)\}/g, global.config.PREFIX || "/").replace(/\{pn\}/g, `${global.config.PREFIX || "/"}${cfg.name}`).replace(/\{(?:n|name)\}/g, cfg.name);
  }
  // usePrefix: Goat-এর false মানে "প্রিফিক্স ছাড়াই চলবে" — মিরাইয়েও একই অর্থ, তাই কিছু করার নেই
}

function makeControllers(api, models) {
  const Users = require("../controllers/users")({ models, api });
  const Threads = require("../controllers/threads")({ models, api });
  const Currencies = require("../controllers/currencies")({ models });
  return { Users, Threads, Currencies };
}

function adaptCommandModule(mod) {
  if (!mod || typeof mod !== "object" || !mod.config || adapted.has(mod)) return;
  const hasGoat = GOAT_HANDLERS.some(h => typeof mod[h] === "function");
  const entry = mod.onStart || mod.onLaunch || mod.execute;
  if (typeof mod.run === "function" && !hasGoat) return; // খাঁটি মিরাই কমান্ড — হাত দেওয়া হয় না
  if (typeof mod.run !== "function" && !hasGoat && typeof entry !== "function") return; // কমান্ড ফাইলই না

  ensureClientProps();
  normalizeCommandConfig(mod);

  if (typeof mod.run !== "function") {
    if (typeof entry === "function") {
      mod.run = async function (Obj) {
        const { api, event, args, models, Users, Threads, Currencies, permssion, commandName } = Obj;
        const params = buildParams({ api, event, args, models, Users, Threads, Currencies, mod, permssion, commandName });
        try {
          return await entry.call(mod, params);
        } catch (err) {
          logErr(`command "${mod.config.name}" failed`, err);
          try { await params.message.err(err); } catch (e) { /* ignore */ }
        }
      };
    } else {
      // শুধু onChat/onReply/... আছে, onStart নেই — Main.js-এর `run` চেক পার করতে খালি run
      mod.run = async function () { /* no prefix-command entry */ };
    }
  }

  // Goat onLoad: ({api, usersData, threadsData, ...}) — মিরাই দেয় ({api, models})
  if (typeof mod.onLoad === "function" && !mod.onLoad.__goatWrapped) {
    const orig = mod.onLoad;
    const wrapped = function (Obj) {
      try {
        const { api, models } = Obj || {};
        const { Users, Threads, Currencies } = makeControllers(api, models);
        const params = Object.assign({}, Obj, buildParams({ api, event: { threadID: "0", senderID: "0" }, models, Users, Threads, Currencies, mod }));
        return orig.call(mod, params);
      } catch (e) { return orig.call(mod, Obj); }
    };
    wrapped.__goatWrapped = true;
    mod.onLoad = wrapped;
  }

  mod.__goat = true;
  adapted.add(mod);
}

function adaptEventModule(mod) {
  if (!mod || typeof mod !== "object" || !mod.config || adapted.has(mod)) return;
  const entry = mod.onStart || mod.onLaunch || mod.execute;
  if (typeof mod.run === "function") return; // মিরাই ইভেন্ট
  if (typeof entry !== "function") return;

  ensureClientProps();
  seedEnvConfig(mod);
  if (mod.config.version !== undefined) mod.config.version = String(mod.config.version);
  if (mod.config.credits === undefined && mod.config.author !== undefined) mod.config.credits = mod.config.author;

  mod.run = async function (Obj) {
    const { api, event, models, Users, Threads, Currencies } = Obj;
    const params = buildParams({ api, event, args: [], models, Users, Threads, Currencies, mod, commandName: mod.config.name });
    // Goat ইভেন্টের ভেতরে role/senderID — ইভেন্টে author ব্যবহার হয়
    try {
      const handler = await entry.call(mod, params);
      if (typeof handler === "function") await handler();
    } catch (err) {
      logErr(`event "${mod.config.name}" failed`, err);
    }
  };

  if (typeof mod.onLoad === "function" && !mod.onLoad.__goatWrapped) {
    const orig = mod.onLoad;
    const wrapped = function (Obj) {
      try {
        const { api, models } = Obj || {};
        const { Users, Threads, Currencies } = makeControllers(api, models);
        const params = Object.assign({}, Obj, buildParams({ api, event: { threadID: "0", senderID: "0" }, models, Users, Threads, Currencies, mod }));
        return orig.call(mod, params);
      } catch (e) { return orig.call(mod, Obj); }
    };
    wrapped.__goatWrapped = true;
    mod.onLoad = wrapped;
  }

  mod.__goat = true;
  mod.__goatEvent = true;
  adapted.add(mod);
}

/* ============================ 3) DISPATCH ============================ */
function needRole(mod, type) {
  const r = mod && mod.config && mod.config.role;
  if (r && typeof r === "object") return Number(r[type] !== undefined ? r[type] : (r.onStart || 0)) || 0;
  if (r !== undefined && !isNaN(r)) return Number(r);
  const p = mod && mod.config && (mod.config.hasPermssion !== undefined ? mod.config.hasPermssion : mod.config.permission);
  return Number(p) || 0;
}

// মিরাইয়ের নিজস্ব ব্যান/অ্যাডমিন-অনলি/ডেভেলপার-অনলি নিয়ম — হ্যান্ডলারগুলোর মতোই
function isBlocked(event) {
  try {
    const senderID = String(event.senderID || event.userID || event.author || "");
    const threadID = String(event.threadID || "");
    const cfg = global.config || {};
    const admins = (cfg.ADMINBOT || []).map(String);
    const devs = (cfg.DEVELOPER || []).map(String);
    const isDev = global.isDeveloper ? global.isDeveloper(senderID) : devs.includes(senderID);
    const isAdmin = admins.includes(senderID);
    const { userBanned, threadBanned } = global.data || {};
    if ((userBanned && userBanned.has(senderID)) || (threadBanned && threadBanned.has(threadID))) { if (!isAdmin && !isDev) return true; }
    if (cfg.allowInbox === false && senderID === threadID && !isAdmin && !isDev) return true;
    if (cfg.developerOnly === true && !isDev) return true;
    if (cfg.adminOnly === true && !isDev && !isAdmin) return true;
  } catch (e) { /* ignore */ }
  return false;
}

async function runHooked(mod, fnName, params, tag) {
  try {
    const res = await mod[fnName](params);
    if (typeof res === "function") await res();
  } catch (err) {
    logErr(`${tag} "${mod.config && mod.config.name}" failed`, err);
  }
}

function eachGoatCommand(fnName, cb) {
  const cmds = global.client && global.client.commands;
  if (!cmds) return;
  for (const [, mod] of cmds) if (mod && typeof mod[fnName] === "function") cb(mod);
}

const seenThreads = new Set();

/** মেসেজ ইভেন্ট: onAnyEvent → onFirstChat → onChat */
function dispatchChat({ api, event, models, Users, Threads, Currencies }) {
  if (!event || isBlocked(event)) return;
  const args = (event.body || "").trim().split(/ +/);
  const ctx = mod => buildParams({ api, event, args, models, Users, Threads, Currencies, mod });

  eachGoatCommand("onAnyEvent", mod => runHooked(mod, "onAnyEvent", ctx(mod), "onAnyEvent"));

  const tid = String(event.threadID);
  if (!seenThreads.has(tid)) {
    seenThreads.add(tid);
    eachGoatCommand("onFirstChat", mod => runHooked(mod, "onFirstChat", Object.assign(ctx(mod), { commandName: mod.config.name }), "onFirstChat"));
  }

  eachGoatCommand("onChat", mod => {
    const p = ctx(mod);
    if (needRole(mod, "onChat") > p.role) return;
    runHooked(mod, "onChat", p, "onChat");
  });
}

/** reply: GoatBot.onReply Map-এ থাকা এন্ট্রি */
function dispatchReply({ api, event, models, Users, Threads, Currencies }) {
  if (!event || !event.messageReply || isBlocked(event)) return;
  const map = global.GoatBot.onReply;
  const Reply = map.get(event.messageReply.messageID);
  if (!Reply) return;
  Reply.delete = () => map.delete(event.messageReply.messageID);
  const cmds = global.client.commands;
  const mod = cmds.get(Reply.commandName) || (global.client.resolveCommand && global.client.resolveCommand(Reply.commandName));
  if (!mod || typeof mod.onReply !== "function") {
    try { api.sendMessage(`❌ Command "${Reply.commandName}" not found or has no onReply.`, event.threadID, event.messageID); } catch (e) { /* ignore */ }
    return;
  }
  const args = (event.body || "").split(/ +/);
  const p = buildParams({ api, event, args, models, Users, Threads, Currencies, mod, commandName: mod.config.name });
  p.Reply = Reply;
  if (needRole(mod, "onReply") > p.role) {
    try { api.sendMessage(`⚠️ Only admins can use the reply of "${mod.config.name}".`, event.threadID, event.messageID); } catch (e) { /* ignore */ }
    return;
  }
  runHooked(mod, "onReply", p, "onReply");
}

/** reaction: GoatBot.onReaction Map-এ থাকা এন্ট্রি */
function dispatchReaction({ api, event, models, Users, Threads, Currencies }) {
  if (!event || isBlocked(Object.assign({}, event, { senderID: event.userID || event.senderID }))) return;
  const map = global.GoatBot.onReaction;
  const Reaction = map.get(event.messageID);
  if (!Reaction) return;
  Reaction.delete = () => map.delete(event.messageID);
  const mod = global.client.commands.get(Reaction.commandName) || (global.client.resolveCommand && global.client.resolveCommand(Reaction.commandName));
  if (!mod || typeof mod.onReaction !== "function") return;
  // Goat-এ reaction ইভেন্টে senderID = যে রিঅ্যাক্ট করেছে → userID
  const ev = Object.assign({}, event, { senderID: event.userID || event.senderID });
  const p = buildParams({ api, event: ev, args: [], models, Users, Threads, Currencies, mod, commandName: mod.config.name });
  p.Reaction = Reaction;
  if (needRole(mod, "onReaction") > p.role) return;
  runHooked(mod, "onReaction", p, "onReaction");
}

/** log:* ইভেন্ট: কমান্ডের onEvent + onAnyEvent */
function dispatchCommandEvents({ api, event, models, Users, Threads, Currencies }) {
  if (!event) return;
  const ctx = mod => buildParams({ api, event, args: [], models, Users, Threads, Currencies, mod, commandName: mod.config.name });
  eachGoatCommand("onAnyEvent", mod => runHooked(mod, "onAnyEvent", ctx(mod), "onAnyEvent"));
  if (isBlocked(event)) return;
  eachGoatCommand("onEvent", mod => runHooked(mod, "onEvent", ctx(mod), "onEvent"));
}

module.exports = {
  installGlobals, ensureClientProps, adaptCommandModule, adaptEventModule,
  dispatchChat, dispatchReply, dispatchReaction, dispatchCommandEvents,
  isBlocked, computeRole
};

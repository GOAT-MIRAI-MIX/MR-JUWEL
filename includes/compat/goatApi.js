// 🔧 includes/compat/goatApi.js
//
// GoatBot স্টাইলের কমান্ড/ইভেন্ট ফাইল (onStart, onChat, onReply, onReaction, onEvent ...) মিরাই
// রানটাইমে চালানোর জন্য অবজেক্ট বিল্ডার:
//   • message     — message.reply / send / unsend / reaction / err  (Promise + callback দুটোই)
//   • usersData   — GoatBot usersData API, মিরাইয়ের Users + Currencies টেবিলের ওপর
//   • threadsData — GoatBot threadsData API, মিরাইয়ের Threads টেবিলের ওপর
//   • getLang     — GoatBot `langs` (সাথে মিরাইয়ের `languages`) থেকে টেক্সট
//   • buildParams — onStart/onChat/... এর জন্য পুরো প্যারামিটার অবজেক্ট
//
// এই ফাইল মিরাইয়ের কোনো ফাংশন পরিবর্তন করে না — শুধু "অনুবাদ" করে।

/* ------------------------------ path helpers ------------------------------ */
function getPath(obj, p, def) {
  if (p === undefined || p === null || p === "") return obj;
  const keys = Array.isArray(p) ? p : String(p).replace(/\[(\w+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (const k of keys) {
    if (cur === null || cur === undefined) return def;
    cur = cur[k];
  }
  return cur === undefined ? def : cur;
}

function setPath(obj, p, value) {
  const keys = Array.isArray(p) ? p : String(p).replace(/\[(\w+)\]/g, ".$1").split(".").filter(Boolean);
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] === null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

/* ------------------------------ message ------------------------------ */
function buildMessage(api, event) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  // api.sendMessage (callback স্টাইল) → Promise। callback দিলে সেটাও কল হয়।
  const sendRaw = (form, tid, replyTo, cb) => new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, info) => {
      if (settled) return;
      settled = true;
      if (typeof cb === "function") { try { cb(err, info); } catch (e) { console.log("[goat message] callback error:", e && e.message); } }
      if (err) reject(err); else resolve(info);
    };
    try {
      const ret = api.sendMessage(form, tid, done, replyTo);
      // কিছু FCA ভার্সন Promise রিটার্ন করে এবং callback কল করে না
      if (ret && typeof ret.then === "function") ret.then(info => done(null, info), err => done(err));
    } catch (e) { done(e); }
  });

  // callback দেওয়া থাকলে Promise-এর rejection নিজেই "handled" — unhandledRejection আটকাতে
  const wrap = (promise, cb) => { if (typeof cb === "function") promise.catch(() => {}); return promise; };

  const message = {
    reply(form, cb) { return wrap(sendRaw(form, threadID, messageID, cb), cb); },
    send(form, tid, cb) {
      // Goat: send(form, callback)   |   Mirai-হাইব্রিড: send(form, threadID, callback)
      if (typeof tid === "function") { cb = tid; tid = undefined; }
      return wrap(sendRaw(form, tid || threadID, undefined, cb), cb);
    },
    unsend(mid, cb) {
      return new Promise((resolve, reject) => {
        try {
          const ret = api.unsendMessage(mid || messageID, (err, res) => {
            if (typeof cb === "function") { try { cb(err, res); } catch (e) { /* ignore */ } }
            if (err) reject(err); else resolve(res);
          });
          if (ret && typeof ret.then === "function") ret.then(resolve, reject);
        } catch (e) { reject(e); }
      });
    },
    reaction(emoji, mid, cb) {
      return new Promise((resolve, reject) => {
        try {
          const ret = api.setMessageReaction(emoji, mid || messageID, (err, res) => {
            if (typeof cb === "function") { try { cb(err, res); } catch (e) { /* ignore */ } }
            if (err) reject(err); else resolve(res);
          }, true);
          if (ret && typeof ret.then === "function") ret.then(resolve, reject);
        } catch (e) { reject(e); }
      });
    },
    typing(cb) {
      if (typeof api.sendTypingIndicator === "function") return api.sendTypingIndicator(threadID, cb);
    },
    err(error) {
      let text;
      if (error && typeof error === "object" && !error.stack) text = JSON.stringify(error, null, 2);
      else text = `${(error && (error.name || error.error)) || "Error"}: ${(error && error.message) || error}`;
      return sendRaw(`❌ An error occurred:\n${text}`, threadID, messageID);
    },
    SyntaxError() {
      return sendRaw("⚠️ Wrong syntax. Please check the command usage (help).", threadID, messageID);
    }
  };
  message.react = message.reaction;
  message.error = message.err;
  message.Reply = message.reply;
  message.Send = message.send;
  return message;
}

/* ------------------------------ usersData ------------------------------ */
const AVATAR = id => `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

function buildUsersData(Users, Currencies, api) {
  async function ensure(id) {
    id = String(id);
    let u = false, c = false;
    try { u = await Users.getData(id); } catch (e) { u = false; }
    try { c = await Currencies.getData(id); } catch (e) { c = false; }
    if (!u) {
      let name = "Facebook user";
      try { name = await Users.getNameUser(id); } catch (e) { /* ignore */ }
      try { await Users.createData(id, { name, data: {} }); } catch (e) { /* ignore */ }
      u = { userID: id, name, data: {} };
      try {
        if (global.data && Array.isArray(global.data.allUserID) && !global.data.allUserID.includes(id)) global.data.allUserID.push(id);
        if (global.data && global.data.userName) global.data.userName.set(id, name);
      } catch (e) { /* ignore */ }
    }
    if (!c) {
      try { await Currencies.createData(id, { data: {} }); } catch (e) { /* ignore */ }
      c = { money: 0, exp: 0, data: {} };
    }
    return { u, c };
  }

  function toGoat(id, u, c) {
    const data = clone((u && u.data) || {}) || {};
    const settings = data.__goatSettings || {};
    delete data.__goatSettings;
    const bannedFlag = data.banned;
    return {
      userID: String(id),
      name: (u && u.name) || "",
      gender: data.__gender !== undefined ? data.__gender : (u && u.gender) || 0,
      exp: Number((c && c.exp) || 0),
      money: Number((c && c.money) || 0),
      avatar: AVATAR(id),
      banned: {
        status: !!bannedFlag,
        reason: data.reason || null,
        date: data.dateAdded || null
      },
      settings,
      data,
      lastUpdated: Date.now()
    };
  }

  async function persist(id, user) {
    id = String(id);
    const data = clone(user.data || {}) || {};
    if (user.settings && Object.keys(user.settings).length) data.__goatSettings = user.settings;
    if (user.gender !== undefined && user.gender !== 0) data.__gender = user.gender;
    if (user.banned && typeof user.banned === "object") {
      if (user.banned.status) { data.banned = 1; data.reason = user.banned.reason || ""; data.dateAdded = user.banned.date || ""; }
      else if (data.banned) { delete data.banned; delete data.reason; delete data.dateAdded; }
    }
    await Users.setData(id, { name: user.name, data });
    await Currencies.setData(id, { money: Number(user.money) || 0, exp: Number(user.exp) || 0 });
    try {
      if (global.data && global.data.userName && user.name) global.data.userName.set(id, user.name);
      if (global.data && global.data.userBanned) {
        if (data.banned) global.data.userBanned.set(id, { reason: data.reason || "", dateAdded: data.dateAdded || "" });
        else global.data.userBanned.delete(id);
      }
    } catch (e) { /* ignore */ }
  }

  const usersData = {
    async get(id, path, defaultValue) {
      const { u, c } = await ensure(id);
      return getPath(toGoat(id, u, c), path, defaultValue);
    },
    async set(id, value, path) {
      const { u, c } = await ensure(id);
      let user = toGoat(id, u, c);
      if (path) setPath(user, path, value);
      else if (value && typeof value === "object") user = Object.assign(user, value);
      await persist(id, user);
      return user;
    },
    async getAll(path, defaultValue) {
      const [us, cs] = await Promise.all([Users.getAll().catch(() => []), Currencies.getAll().catch(() => [])]);
      const cmap = new Map(cs.map(c => [String(c.userID), c]));
      return us.map(u => getPath(toGoat(u.userID, u, cmap.get(String(u.userID))), path, defaultValue));
    },
    async create(id) { const { u, c } = await ensure(id); return toGoat(id, u, c); },
    async delete(id) { try { await Users.delData(id); } catch (e) { /* ignore */ } try { await Currencies.delData(id); } catch (e) { /* ignore */ } return true; },
    async getName(id, checkData = true) {
      id = String(id);
      try {
        if (checkData && global.data && global.data.userName && global.data.userName.has(id)) return global.data.userName.get(id);
        return await Users.getNameUser(id);
      } catch (e) { return "Facebook user"; }
    },
    async getAvatarUrl(id) { return AVATAR(id); },
    async refreshInfo(id) {
      const { u, c } = await ensure(id);
      try {
        const info = await Users.getInfo(id);
        if (info && info.name) await Users.setData(String(id), { name: info.name });
      } catch (e) { /* ignore */ }
      return toGoat(id, u, c);
    },
    async deleteKey(id, path) {
      const { u, c } = await ensure(id);
      const user = toGoat(id, u, c);
      const keys = String(path).split(".");
      const last = keys.pop();
      const parent = keys.length ? getPath(user, keys) : user;
      if (parent && typeof parent === "object") delete parent[last];
      await persist(id, user);
      return user;
    },
    async addMoney(id, amount) { const { c } = await ensure(id); return Currencies.setData(String(id), { money: Number(c.money || 0) + Number(amount) }); },
    async subtractMoney(id, amount) { const { c } = await ensure(id); return Currencies.setData(String(id), { money: Number(c.money || 0) - Number(amount) }); }
  };

  // মিরাই-স্টাইল নামগুলোও রাখা হলো (পুরোনো হাইব্রিড কমান্ডের জন্য)
  usersData.getAllFast = usersData.getAll;
  usersData.increaseMoney = (id, amount) => Currencies.increaseMoney(id, amount);
  usersData.decreaseMoney = (id, amount) => Currencies.decreaseMoney(id, amount);
  return usersData;
}

/* ------------------------------ threadsData ------------------------------ */
const DEFAULT_THREAD_SETTINGS = () => ({ sendWelcomeMessage: true, sendLeaveMessage: true, customCommand: true, hideNotiMessage: {} });

function buildThreadsData(Threads, api) {
  const liveCache = new Map(); // threadID -> { t, info }
  const LIVE_TTL = 60 * 1000;

  async function liveInfo(id) {
    id = String(id);
    const hit = liveCache.get(id);
    if (hit && Date.now() - hit.t < LIVE_TTL) return hit.info;
    let info = null;
    try { info = (global.data && global.data.threadInfo && global.data.threadInfo.get(id)) || null; } catch (e) { /* ignore */ }
    if (!info || !info.participantIDs) {
      try { info = await Threads.getInfo(id); } catch (e) { /* ignore */ }
    }
    if (info) liveCache.set(id, { t: Date.now(), info });
    return info || {};
  }

  async function ensure(id) {
    id = String(id);
    let t = false;
    try { t = await Threads.getData(id); } catch (e) { t = false; }
    if (!t) {
      try { await Threads.createData(id, { threadInfo: {}, data: {} }); } catch (e) { /* ignore */ }
      t = { threadID: id, threadInfo: {}, data: {} };
      try { if (global.data && Array.isArray(global.data.allThreadID) && !global.data.allThreadID.includes(id)) global.data.allThreadID.push(id); } catch (e) { /* ignore */ }
    }
    return t;
  }

  function toGoat(id, t, live) {
    const stored = (t && t.threadInfo) || {};
    const info = Object.assign({}, stored, live || {});
    const data = clone((t && t.data) || {}) || {};
    const settings = Object.assign(DEFAULT_THREAD_SETTINGS(), data.__goatSettings || {});
    delete data.__goatSettings;
    const adminIDs = (info.adminIDs || []).map(a => String(a && a.id !== undefined ? a.id : a));
    const nick = info.nicknames || {};
    const members = (info.userInfo || []).map(u => ({
      userID: String(u.id),
      name: u.name || "",
      gender: u.gender,
      nickname: nick[u.id] || null,
      inGroup: true,
      count: 0
    }));
    const bannedFlag = global.data && global.data.threadBanned && global.data.threadBanned.has(String(id));
    const tb = bannedFlag ? global.data.threadBanned.get(String(id)) || {} : {};
    return {
      threadID: String(id),
      threadName: info.threadName || info.name || "",
      emoji: info.emoji || "",
      adminIDs,
      approvalMode: !!info.approvalMode,
      isGroup: info.isGroup !== undefined ? info.isGroup : true,
      members,
      participantIDs: info.participantIDs || members.map(m => m.userID),
      imageSrc: info.imageSrc || null,
      banned: { status: !!bannedFlag, reason: tb.reason || null, date: tb.dateAdded || null },
      settings,
      data,
      threadInfo: info
    };
  }

  async function persist(id, th) {
    id = String(id);
    const data = clone(th.data || {}) || {};
    if (th.settings) data.__goatSettings = th.settings;
    const patch = { data };
    const ti = clone(th.threadInfo || {}) || {};
    if (th.threadName !== undefined) ti.threadName = th.threadName;
    if (th.emoji !== undefined) ti.emoji = th.emoji;
    patch.threadInfo = ti;
    await Threads.setData(id, patch);
    try {
      if (global.data && global.data.threadData) global.data.threadData.set(id, data);
      if (global.data && global.data.threadInfo) global.data.threadInfo.set(id, Object.assign({}, global.data.threadInfo.get(id) || {}, ti));
    } catch (e) { /* ignore */ }
  }

  const threadsData = {
    async get(id, path, defaultValue) {
      const t = await ensure(id);
      const live = await liveInfo(id);
      return getPath(toGoat(id, t, live), path, defaultValue);
    },
    async set(id, value, path) {
      const t = await ensure(id);
      let th = toGoat(id, t, null);
      if (path) setPath(th, path, value);
      else if (value && typeof value === "object") th = Object.assign(th, value);
      await persist(id, th);
      return th;
    },
    async getAll(path, defaultValue) {
      const all = await Threads.getAll().catch(() => []);
      return all.map(t => getPath(toGoat(t.threadID, t, null), path, defaultValue));
    },
    async create(id) { const t = await ensure(id); return toGoat(id, t, await liveInfo(id)); },
    async delete(id) { try { await Threads.delData(id); } catch (e) { /* ignore */ } return true; },
    async refreshInfo(id) {
      liveCache.delete(String(id));
      const t = await ensure(id);
      const live = await liveInfo(id);
      try {
        await Threads.setData(String(id), { threadInfo: { threadName: live.threadName, adminIDs: live.adminIDs, nicknames: live.nicknames, emoji: live.emoji } });
      } catch (e) { /* ignore */ }
      return toGoat(id, t, live);
    },
    async deleteKey(id, path) {
      const t = await ensure(id);
      const th = toGoat(id, t, null);
      const keys = String(path).split(".");
      const last = keys.pop();
      const parent = keys.length ? getPath(th, keys) : th;
      if (parent && typeof parent === "object") delete parent[last];
      await persist(id, th);
      return th;
    },
    getInfo: id => Threads.getInfo(id)
  };
  return threadsData;
}

/* ------------------------------ getLang ------------------------------ */
function createGetLang(mod, prefix) {
  const name = (mod && mod.config && mod.config.name) || "";
  return function getLang(key, ...args) {
    const code = (global.config && global.config.language) || "en";
    const pick = src => (src && (src[code] || src.en || src[Object.keys(src)[0]])) || null;
    let text;
    const g = pick(mod && mod.langs);
    if (g && g[key] !== undefined) text = g[key];
    if (text === undefined) { const m = pick(mod && mod.languages); if (m && m[key] !== undefined) text = m[key]; }
    if (text === undefined) return `❌ Can't find text on language "${code}" for "${name}" with key "${key}"`;
    text = String(text)
      .replace(/\{(?:p|prefix)\}/g, prefix || (global.config && global.config.PREFIX) || "/")
      .replace(/\{(?:n|name)\}/g, name)
      .replace(/\{pn\}/g, `${prefix || (global.config && global.config.PREFIX) || "/"}${name}`);
    for (let i = args.length - 1; i >= 0; i--) text = text.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
    return text;
  };
}

/* ------------------------------ role ------------------------------ */
// Goat role: 0 = সবাই, 1 = গ্রুপ অ্যাডমিন, 2 = বট অ্যাডমিন
function computeRole(event, permssion) {
  if (typeof permssion === "number") return Math.min(permssion, 2);
  const sid = String(event.senderID || event.userID || event.author || "");
  const admins = ((global.config && global.config.ADMINBOT) || []).map(String);
  const devs = ((global.config && global.config.DEVELOPER) || []).map(String);
  if (admins.includes(sid) || devs.includes(sid)) return 2;
  try {
    const ti = global.data && global.data.threadInfo && global.data.threadInfo.get(String(event.threadID));
    if (ti && (ti.adminIDs || []).some(a => String(a && a.id !== undefined ? a.id : a) === sid)) return 1;
  } catch (e) { /* ignore */ }
  return 0;
}

/* ------------------------------ params ------------------------------ */
function buildParams(base) {
  const { api, event, models, Users, Threads, Currencies, mod, args, permssion, commandName } = base;
  const prefix = (global.utils && typeof global.utils.getPrefix === "function" && event && event.threadID)
    ? (() => { try { return global.utils.getPrefix(event.threadID); } catch (e) { return global.config.PREFIX; } })()
    : (global.config && global.config.PREFIX);
  const message = buildMessage(api, event);
  const usersData = buildUsersData(Users, Currencies, api);
  const threadsData = buildThreadsData(Threads, api);
  const role = computeRole(event, permssion);
  const name = commandName || (mod && mod.config && mod.config.name);
  return {
    api, event, args: args || [], message, usersData, threadsData,
    models, Users, Threads, Currencies,
    globalData: { get: async () => ({}), set: async () => ({}) },
    globalModel: null, userModel: null, threadModel: null, dashBoardModel: null,
    dashBoardData: { get: async () => ({}), set: async () => ({}) },
    envCommands: (global.configModule) || {},
    envEvents: (global.configModule) || {},
    envGlobal: {},
    prefix, role, permssion: role,
    commandName: name,
    getLang: createGetLang(mod, prefix),
    getText: createGetLang(mod, prefix),
    removeCommandNameFromBody: (body_, prefix_, commandName_) => {
      const b = body_ !== undefined ? body_ : (event && event.body) || "";
      const p = prefix_ !== undefined ? prefix_ : prefix;
      const n = commandName_ !== undefined ? commandName_ : name;
      return String(b).replace(new RegExp(`^${String(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s+|)${n}`, "i"), "").trim();
    }
  };
}

module.exports = { buildMessage, buildUsersData, buildThreadsData, createGetLang, computeRole, buildParams, getPath, setPath };

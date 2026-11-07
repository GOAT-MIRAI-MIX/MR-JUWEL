module.exports.config = {
name: "textoff",
version: "3.2.1",
hasPermssion: 1,
credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
description: "গ্রুপ টেক্সট অফ সিস্টেম",
commandCategory: "group",
usages: "textoff | textoff 30m | textoff 2h",
cooldowns: 3
};

// ================== STORAGE ==================
const textOff = {};
const pendingKick = {};

// ================== TIME ==================
function msToHuman(ms) {
if (ms <= 0) return "০ সেকেন্ড";
const total = Math.floor(ms / 1000);
const h = Math.floor(total / 3600);
const m = Math.floor((total % 3600) / 60);
const s = total % 60;
let out = [];
if (h) out.push(h + "ঘ");
if (m) out.push(m + "মি");
if (s && !h) out.push(s + "সে");
return out.join(" ");
}

function clockStr(ts) {
const d = new Date(ts);
return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ================== PARSE ==================
function parseTime(args) {
if (!args[0]) return { perma: true, ms: null, txt: "পার্মানেন্ট" };
let x = args[0].toLowerCase();
let m = x.match(/^(\d+)m$/);
let h = x.match(/^(\d+)h$/);
if (m) return { perma: false, ms: m[1] * 60000, txt: `${m[1]}মি` };
if (h) return { perma: false, ms: h[1] * 3600000, txt: `${h[1]}ঘ` };
return { perma: true, ms: null, txt: "পার্মানেন্ট" };
}

// ================== UI BUILDER ==================
function buildTextOffNotice(end, perma) {
const timeLine = perma ? "🔒 পার্মানেন্ট" : `⏳ ${msToHuman(end - Date.now())}`;
return `╔══════════╗
║ 🔇 টেক্সট অফ ║
╠══════════╣
║ ${timeLine}
╚══════════╝`;
}

function buildWarnNotice(name, time, end) {
return `╔══════════╗
║ ⚠️ সতর্কতা ║
╠══════════╣
║ @${name}
║ ⏳${msToHuman(end - Date.now())}
╚══════════╝`;
}

function buildKickNotice(name, time) {
return `╔══════════╗
║ 🥾 কিক ║
╠══════════╣
║ @${name}
║ কারন: টেক্সট অফ ভঙ্গ
╚══════════╝`;
}

function buildAdminOnly() {
return `╔══════════╗
║ ⛔ এডমিন ║
╚══════════╝`;
}

// ================== RUN ==================
module.exports.run = async function ({ api, event, args }) {
const { threadID, senderID } = event;
let info = await api.getThreadInfo(threadID);
let admins = info.adminIDs.map(i => i.id);
if (!admins.includes(senderID)) return api.sendMessage(buildAdminOnly(), threadID);
let t = parseTime(args);
let end = t.perma ? null : Date.now() + t.ms;
let msg = await api.sendMessage(buildTextOffNotice(end, t.perma), threadID);
textOff[threadID] = { active: true, owner: senderID, end, time: t.txt, noticeMsgID: msg.messageID };
if (!t.perma) {
setTimeout(async () => {
const data = textOff[threadID];
delete textOff[threadID];
if (data?.noticeMsgID) {
try { await api.unsendMessage(data.noticeMsgID); } catch (e) {}
}
let msg2 = await api.sendMessage("✅ চালু", threadID);
setTimeout(() => { api.unsendMessage(msg2.messageID); }, 120000);
}, t.ms);
}
};

// ================== EVENT ==================
module.exports.handleEvent = async function ({ api, event }) {
const { threadID, senderID, messageID } = event;
if (!textOff[threadID]?.active) return;
let info = await api.getThreadInfo(threadID);
let admins = info.adminIDs.map(i => i.id);
let botID = api.getCurrentUserID();
if (admins.includes(senderID) || senderID === botID || senderID === textOff[threadID].owner) return;
let name = (await api.getUserInfo(senderID))[senderID]?.name || "User";
let warn = await api.sendMessage(buildWarnNotice(name, textOff[threadID].time, textOff[threadID].end), threadID, messageID);
if (!pendingKick[threadID]) pendingKick[threadID] = {};
if (pendingKick[threadID][senderID]?.timer) clearTimeout(pendingKick[threadID][senderID].timer);
pendingKick[threadID][senderID] = {
timer: setTimeout(async () => {
try { await api.editMessage(buildKickNotice(name, textOff[threadID].time), warn.messageID); } catch { await api.sendMessage(buildKickNotice(name, textOff[threadID].time), threadID); }
setTimeout(() => { api.removeUserFromGroup(senderID, threadID); }, 2000);
delete pendingKick[threadID][senderID];
}, 10000)
};
};

// ================== UNSEND CLEANUP ==================
module.exports.onMessageUnsend = async function ({ api, event }) {
const { threadID, senderID } = event;
if (!pendingKick[threadID]?.[senderID]) return;
clearTimeout(pendingKick[threadID][senderID].timer);
delete pendingKick[threadID][senderID];
};

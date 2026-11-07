module.exports.config = {
    name: "god",
    eventType: [
        "log:unsubscribe",
        "log:subscribe",
        "log:thread-name",
        "log:thread-icon",
        "log:thread-color",
        "log:thread-emoji",
        "log:user-nickname",
        "log:thread-admins",
        "log:thread-approval-mode",
        "log:thread-call",
        "log:message-unsend",
        "log:message-edit"
    ],
    version: "5.0.0",
    credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
    description: "👑 GOD Event Logger — Premium UI",
    envConfig: {
        enable: true,
        forwardToGroupAdmins: false,
        forwardToBotAdmins: true,
        notifyBotAddRemove: true, // বট এড/রিমুভ নোটিশ (সাধারণ মেম্বার নোটিশ সম্পূর্ণ বন্ধ)
        rateLimit: 1500
    }
};

const logger = require("../../utils/log");

/* ============================================================
 *  🎨 PREMIUM UI
 * ============================================================ */
const UI = {
    top:  "╔═══════════════════════╗",
    mid:  "╠═══════════════════════╣",
    bot:  "╚═══════════════════════╝",
    side: "║",
    sep:  "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
    dot:  "◈"
};

/* ============================================================
 *  🧠 UTILS
 * ============================================================ */
const cooldown = new Map();
const seen = new Map(); // ডুপ্লিকেট ইভেন্ট ফিল্টার

function isDuplicate(event) {
    const key = [
        event.threadID,
        event.logMessageType,
        event.messageID || "",
        event.author || "",
        JSON.stringify(event.logMessageData || {})
    ].join("|");
    const now = Date.now();
    for (const [k, t] of seen) if (now - t > 15000) seen.delete(k);
    if (seen.has(key)) return true;
    seen.set(key, now);
    return false;
}

function dhakaTime() {
    return new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        hour12: true,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }) + " BD";
}

function uptime() {
    const u = process.uptime();
    const d = Math.floor(u / 86400);
    const h = Math.floor((u % 86400) / 3600);
    const m = Math.floor((u % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
}

function ram() {
    return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1) + " MB";
}

async function safeName(api, uid) {
    try {
        const info = await api.getUserInfo(uid);
        return info[uid]?.name || String(uid);
    } catch { return String(uid); }
}

async function getThreadName(api, threadID) {
    try {
        const info = await api.getThreadInfo(threadID);
        return info.threadName || info.name || "Unknown";
    } catch { return "Unknown"; }
}

function getBotAdmins() {
    const c = global.config || {};
    const list = c.ADMINBOT || c.adminBot || c.admins || [];
    return Array.isArray(list) ? list.map(String) : [];
}

async function getGroupAdmins(api, threadID) {
    try {
        const info = await api.getThreadInfo(threadID);
        return (info.adminIDs || []).map(a => String(a.id));
    } catch { return []; }
}

/* ============================================================
 *  🎨 REPORT BUILDER
 * ============================================================ */
function buildReport(icon, tag, task, rows, extra) {
    let msg =
        `${UI.top}\n` +
        `${UI.side}  ✦ 👑 ${tag} 👑 ✦\n` +
        `${UI.mid}\n` +
        `${UI.side} ${icon} ${task}\n` +
        `${UI.side} ${UI.sep}\n`;

    rows.forEach(r => { msg += `${UI.side} ${UI.dot} ${r.label} ➜ ${r.value}\n`; });

    if (extra && extra.length) {
        msg += `${UI.side} ${UI.sep}\n`;
        extra.forEach(l => { msg += `${UI.side} ${l}\n`; });
    }

    msg +=
        `${UI.mid}\n` +
        `${UI.side} ⏰ ${dhakaTime()}\n` +
        `${UI.side} 📊 ${uptime()}  ┃  💾 ${ram()}\n` +
        `${UI.bot}\n` +
        `   ❖ 乛 M𝆠፝֟R JU𝆠፝֟W𝆠፝֟EL ❖`;

    return msg;
}

/* ============================================================
 *  🚀 MAIN RUNNER
 * ============================================================ */
module.exports.run = async function ({ api, event, Threads }) {
    const cfg = Object.assign({}, this.config.envConfig, global.configModule?.[this.config.name] || {});
    if (!cfg.enable) return;

    const type = event.logMessageType;
    const botID = String(api.getCurrentUserID());

    /* ✂️ সাধারণ মেম্বার জয়েন/লিভ/কিক — কোনো নোটিশ নয় */
    if (type === "log:subscribe") {
        const added = event.logMessageData.addedParticipants || [];
        const botAdded = added.some(i => String(i.userFbId) === botID);
        if (!botAdded || !cfg.notifyBotAddRemove) return;
    }
    if (type === "log:unsubscribe") {
        const botLeft = String(event.logMessageData.leftParticipantFbId) === botID;
        if (!botLeft || !cfg.notifyBotAddRemove) return;
    }

    if (isDuplicate(event)) return;

    const limit = cfg.rateLimit || 1500;
    const ck = event.threadID + "|" + type;
    if (cooldown.has(ck) && Date.now() - cooldown.get(ck) < limit) return;
    cooldown.set(ck, Date.now());

    let task = "";
    let icon = "📍";
    let tag = "EVENT";
    let extra = [];

    try {
        switch (type) {

            case "log:thread-name": {
                const newName = event.logMessageData.name || "Unknown";
                const cached = await Threads.getData(event.threadID);
                const oldName = cached?.name || "(not saved)";
                icon = "📝"; tag = "GROUP NAME"; task = "Group name updated";
                extra.push(`${UI.dot} Old ➜ ${oldName}`);
                extra.push(`${UI.dot} New ➜ ${newName}`);
                await Threads.setData(event.threadID, { name: newName });
                break;
            }

            case "log:thread-icon":
                icon = "🖼️"; tag = "GROUP ICON"; task = "Group icon changed";
                break;

            case "log:thread-color":
                icon = "🎨"; tag = "THEME COLOR"; task = "Theme color changed";
                break;

            case "log:thread-emoji":
                icon = "😀"; tag = "EMOJI"; task = "Group emoji changed";
                break;

            case "log:user-nickname": {
                const name = await safeName(api, event.logMessageData.participant_id);
                icon = "🏷️"; tag = "NICKNAME"; task = "Nickname updated";
                extra.push(`${UI.dot} User ➜ ${name}`);
                extra.push(`${UI.dot} Nick ➜ ${event.logMessageData.nickname || "(cleared)"}`);
                break;
            }

            case "log:thread-admins": {
                const name = await safeName(api, event.logMessageData.TARGET_ID);
                const add = event.logMessageData.ADMIN_EVENT === "add_admin";
                icon = add ? "👑" : "🚫";
                tag = add ? "ADMIN ADDED" : "ADMIN REMOVED";
                task = add ? "New admin appointed" : "Admin removed";
                extra.push(`${UI.dot} User ➜ ${name}`);
                break;
            }

            case "log:thread-approval-mode":
                icon = "🔐"; tag = "APPROVAL"; task = `Mode: ${event.logMessageData.APPROVAL_MODE}`;
                break;

            case "log:thread-call": {
                const started = event.logMessageData.event === "group_call_started";
                icon = "📞"; tag = started ? "CALL START" : "CALL END";
                task = started ? "Group call started" : "Group call ended";
                break;
            }

            case "log:message-unsend":
                icon = "🗑️"; tag = "MSG DELETED"; task = "Message deleted";
                break;

            case "log:message-edit":
                icon = "✏️"; tag = "MSG EDITED"; task = "Message edited";
                break;

            case "log:subscribe":
                icon = "🤖"; tag = "BOT ADDED"; task = "Bot added to a new group";
                break;

            case "log:unsubscribe":
                icon = "💀"; tag = "BOT REMOVED"; task = "Bot kicked from group";
                break;

            default: return;
        }

        if (!task) return;

        const threadName = await getThreadName(api, event.threadID);
        const authorName = await safeName(api, event.author);

        const report = buildReport(
            icon, tag, task,
            [
                { label: "👥 Group ", value: threadName },
                { label: "🆔 Thread", value: event.threadID },
                { label: "👤 By    ", value: authorName }
            ],
            extra
        );

        /* ---------- রিসিভার (প্রতিজনকে ঠিক ১ বার) ---------- */
        const receivers = new Set();
        if (cfg.forwardToBotAdmins) getBotAdmins().forEach(id => receivers.add(id));
        if (cfg.forwardToGroupAdmins) (await getGroupAdmins(api, event.threadID)).forEach(id => receivers.add(id));
        receivers.delete(botID);

        for (const uid of receivers) {
            try { await api.sendMessage(report, uid); }
            catch (err) { logger(`Failed to send to ${uid}: ${err.message}`, "[ god ]"); }
        }

        try { api.setMessageReaction("👀", event.messageID, () => {}, true); } catch {}

    } catch (err) {
        logger("GOD ERROR: " + err.message, "[ god ]");
    }
};

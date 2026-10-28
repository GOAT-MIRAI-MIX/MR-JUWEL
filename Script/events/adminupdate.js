/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ⚠️  NOTICE / সতর্কতা                                    ║
 * ║  এই কোডের credits পরিবর্তন করলে কোড কাজ করবে না।         ║
 * ║  Changing the credits will make this command stop        ║
 * ║  working. Do not edit the credits.                       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const LOCKED_CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

module.exports.config = {
    name: "adminUpdate",
    eventType: [
        "log:thread-admins",
        "log:thread-name",
        "log:user-nickname",
        "log:thread-icon",
        "log:thread-call",
        "log:thread-color"
    ],
    version: "6.0.0",
    credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
    description: "Group update notifier with 20+ stylish random themes",
    envConfig: {
        sendNoti: true
    }
};

// ─────────────── Credit lock ───────────────
function creditOK() {
    return module.exports.config.credits === LOCKED_CREDIT;
}

module.exports.onLoad = function () {
    if (!creditOK()) {
        console.log("⛔ [adminUpdate] Credits changed! Command disabled. Please restore the original credits.");
        throw new Error("Credits changed. Restore the original credits to use this command.");
    }
};

// ─────────────── Themes ───────────────
const THEME_EMOJIS = [
    ["rainbow", "🌈"], ["fire", "🔥"], ["blue", "💙"], ["pink", "🌸"], ["gold", "⚡"],
    ["neon", "💡"], ["cyber", "🤖"], ["diamond", "💎"], ["fireworks", "🎆"], ["galaxy", "🌌"],
    ["dragon", "🐉"], ["skull", "💀"], ["samurai", "⚔️"], ["toxic", "☣️"], ["matrix", "🟩"],
    ["space", "🚀"], ["ice", "❄️"], ["rose", "🌹"], ["king", "👑"], ["ninja", "🥷"],
    ["heart", "💖"], ["star", "⭐"]
];

const POWERED_BY = "𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗕𝘆 𝗝𝘂𝘄𝗲𝗹";

function getRandomTheme() {
    const [name, e] = THEME_EMOJIS[Math.floor(Math.random() * THEME_EMOJIS.length)];
    return {
        name,
        icon: e,
        top: `${e}━━━━━━━━━━━━━━━━━━${e}`,
        mid: `${e}┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄${e}`,
        bottom: `${e}━━━━━━━━━━━━━━━━━━${e}`
    };
}

// ─────────────── Message builder ───────────────
function buildMessage(theme, title, lines) {
    return (
`${theme.top}
${theme.icon}  𝗨𝗣𝗗𝗔𝗧𝗘  ┃  ${title}
${theme.mid}
${lines.map(l => `┃ ${l}`).join("\n")}
${theme.mid}
⚡ ${POWERED_BY}
${theme.bottom}`
    );
}

module.exports.run = async function ({ event, api, Threads, Users }) {
    // 🔒 Credit check
    if (!creditOK()) {
        return console.log("⛔ [adminUpdate] Credits changed! Command disabled.");
    }

    const { threadID, logMessageType } = event;
    const logMessageData = event.logMessageData || {};

    // sendNoti config (default: true)
    const cfg = (global.configModule && global.configModule[module.exports.config.name]) || {};
    const sendNoti = cfg.sendNoti !== false;

    // ─── Helpers ───
    const send = (text, mentions) => {
        if (!sendNoti) return;
        try {
            api.sendMessage(mentions ? { body: text, mentions } : text, threadID);
        } catch (err) {
            console.log("[adminUpdate] send error:", err);
        }
    };

    async function getName(id) {
        try {
            const n = await Users.getNameUser(id);
            return n || "Unknown User";
        } catch (e) {
            return "Unknown User";
        }
    }

    // Thread data
    let threadData = {};
    try {
        threadData = (await Threads.getData(threadID)) || {};
    } catch (e) {
        threadData = {};
    }
    const dataThread = (threadData.threadInfo && typeof threadData.threadInfo === "object")
        ? threadData.threadInfo
        : {};
    dataThread.adminIDs = Array.isArray(dataThread.adminIDs) ? dataThread.adminIDs : [];
    dataThread.nicknames = dataThread.nicknames || {};
    dataThread.threadName = dataThread.threadName || "";
    dataThread.threadIcon = dataThread.threadIcon || "";
    dataThread.threadColor = dataThread.threadColor || "";

    try {
        const t = getRandomTheme();

        switch (logMessageType) {

            // 👑 Admin add / remove
            case "log:thread-admins": {
                const targetID = logMessageData.TARGET_ID;
                if (!targetID) break;
                const name = await getName(targetID);
                const tag = `@${name}`;

                if (logMessageData.ADMIN_EVENT === "add_admin") {
                    if (!dataThread.adminIDs.some(a => String(a.id) === String(targetID))) {
                        dataThread.adminIDs.push({ id: targetID });
                    }
                    send(buildMessage(t, "𝗔𝗗𝗠𝗜𝗡", [
                        `👤 ${tag}`,
                        "✅ এখন থেকে গ্রুপের Admin!",
                        "🎉 অভিনন্দন!"
                    ]), [{ tag, id: targetID }]);
                } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                    dataThread.adminIDs = dataThread.adminIDs.filter(a => String(a.id) !== String(targetID));
                    send(buildMessage(t, "𝗔𝗗𝗠𝗜𝗡", [
                        `👤 ${tag}`,
                        "❌ Admin রোল সরিয়ে ফেলা হয়েছে।"
                    ]), [{ tag, id: targetID }]);
                }
                break;
            }

            // 😀 Icon
            case "log:thread-icon": {
                dataThread.threadIcon = logMessageData.thread_icon || "👍";
                send(buildMessage(t, "𝗜𝗖𝗢𝗡", [
                    `🆕 নতুন Icon: ${dataThread.threadIcon}`
                ]));
                break;
            }

            // 📞 Call
            case "log:thread-call": {
                if (logMessageData.event === "group_call_started") {
                    const callerID = logMessageData.caller_id;
                    const name = await getName(callerID);
                    const tag = `@${name}`;
                    send(buildMessage(t, "𝗖𝗔𝗟𝗟", [
                        `👤 ${tag}`,
                        `▶️ ${logMessageData.video ? "ভিডিও " : "অডিও "}কল শুরু করেছেন।`,
                        "📲 সবাই জয়েন করুন!"
                    ]), [{ tag, id: callerID }]);

                } else if (logMessageData.event === "group_call_ended") {
                    const d = Number(logMessageData.call_duration) || 0;
                    const h = Math.floor(d / 3600);
                    const m = Math.floor((d % 3600) / 60);
                    const s = d % 60;
                    send(buildMessage(t, "𝗖𝗔𝗟𝗟", [
                        "📴 কল শেষ হয়েছে।",
                        `⏳ সময়কাল: ${h}h ${m}m ${s}s`
                    ]));

                } else if (logMessageData.joining_user) {
                    const uid = logMessageData.joining_user;
                    const name = await getName(uid);
                    const tag = `@${name}`;
                    send(buildMessage(t, "𝗖𝗔𝗟𝗟", [
                        `👤 ${tag}`,
                        "✨ কলে জয়েন করেছেন। Welcome!"
                    ]), [{ tag, id: uid }]);
                }
                break;
            }

            // 🎨 Color / Theme
            case "log:thread-color": {
                dataThread.threadColor = logMessageData.thread_color || "🌤";
                const body = event.logMessageBody
                    ? String(event.logMessageBody).replace(/Theme/gi, "Color")
                    : "রঙ পরিবর্তন করা হয়েছে।";
                send(buildMessage(t, "𝗖𝗢𝗟𝗢𝗥", [
                    `🎨 ${body}`
                ]));
                break;
            }

            // ✏️ Nickname
            case "log:user-nickname": {
                const uid = logMessageData.participant_id;
                if (!uid) break;
                const nick = logMessageData.nickname || "";
                dataThread.nicknames[uid] = nick;
                const name = await getName(uid);
                const tag = `@${name}`;
                send(buildMessage(t, "𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘", [
                    `👤 ${tag}`,
                    `➡️ নতুন নাম: ${nick.length === 0 ? "Original Name" : nick}`
                ]), [{ tag, id: uid }]);
                break;
            }

            // 📝 Group name
            case "log:thread-name": {
                dataThread.threadName = logMessageData.name || "No name";
                send(buildMessage(t, "𝗡𝗔𝗠𝗘", [
                    `🆕 নতুন গ্রুপ নাম: ${dataThread.threadName}`
                ]));
                break;
            }
        }

        // 💾 Save updated data
        await Threads.setData(threadID, { threadInfo: dataThread });
    } catch (e) {
        console.log("[adminUpdate] error:", e);
    }
};

module.exports.config = {
    name: "autoseen",
    version: "4.0.0",
    hasPermssion: 1,
    credits: "MR JUWEL",
    description: "Auto Seen (বট চালু হলে সবসময় অফ থাকবে)",
    commandCategory: "tools",
    usages: "on / on 10m / off",
    cooldowns: 3
};

// ---------- বট চালু হলে সবসময় OFF ----------
// global ব্যবহার করায় কমান্ড রিলোড করলে স্টেট থাকবে, কিন্তু বট রিস্টার্ট দিলে আবার OFF
if (!global.autoSeenState) {
    global.autoSeenState = { status: false, expiry: null, lastRun: 0 };
}
const state = global.autoSeenState;

function checkExpiry() {
    if (state.status && state.expiry && Date.now() > state.expiry) {
        state.status = false;
        state.expiry = null;
        console.log("⏰ AutoSeen expired, turned OFF");
    }
}

// ---------- ফ্রেম ----------
function buildFrame(title, lines) {
    const width = 44;
    const top = "╔" + "═".repeat(width - 2) + "╗";
    const bottom = "╚" + "═".repeat(width - 2) + "╝";
    const mid = (text) => {
        const pad = Math.max(0, width - 4 - text.length);
        const left = Math.floor(pad / 2);
        const right = pad - left;
        return "║ " + " ".repeat(left) + text + " ".repeat(right) + " ║";
    };
    let msg = top + "\n";
    msg += mid("「 " + title + " 」") + "\n";
    for (const line of lines) msg += mid(line) + "\n";
    msg += bottom;
    return msg;
}

function remainingText() {
    const remaining = Math.max(0, Math.floor((state.expiry - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `⏳ বন্ধ হবে ${mins}মি ${secs}সে পরে`;
}

// ---------- Event handler ----------
module.exports.handleEvent = async ({ api }) => {
    try {
        checkExpiry();
        if (!state.status) return;

        const now = Date.now();
        if (now - state.lastRun < 5000) return;
        state.lastRun = now;

        await api.markAsReadAll();
    } catch (e) {
        console.log("AutoSeen Error:", e);
    }
};

// ---------- Command ----------
module.exports.run = async ({ api, event, args }) => {
    checkExpiry();
    const cmd = (args[0] || "").toLowerCase();

    // ===== ON =====
    if (cmd === "on") {
        let expiry = null;
        const timeArg = args[1];

        if (timeArg) {
            const match = timeArg.match(/^(\d+)([smh])$/);
            if (!match) {
                return api.sendMessage(
                    "❌ ভুল ফরম্যাট। ব্যবহার করুন: on 10s, on 5m, on 2h",
                    event.threadID,
                    event.messageID
                );
            }
            const num = parseInt(match[1]);
            const unit = match[2];
            const mult = unit === "s" ? 1000 : unit === "m" ? 60000 : 3600000;
            expiry = Date.now() + num * mult;
        }

        state.status = true;
        state.expiry = expiry;

        const lines = ["✅ অটোসিন: চালু"];
        lines.push(expiry ? remainingText() : "♾️ বট রিস্টার্ট না হওয়া পর্যন্ত চালু");
        return api.sendMessage(buildFrame("অটোসিন চালু", lines), event.threadID, event.messageID);
    }

    // ===== OFF =====
    if (cmd === "off") {
        state.status = false;
        state.expiry = null;
        return api.sendMessage(
            buildFrame("অটোসিন বন্ধ", ["❌ স্ট্যাটাস: বন্ধ", "অটোসিন নিষ্ক্রিয় করা হয়েছে"]),
            event.threadID,
            event.messageID
        );
    }

    // ===== STATUS =====
    const lines = ["স্ট্যাটাস: " + (state.status ? "চালু ✅" : "বন্ধ ❌")];
    if (state.status && state.expiry) lines.push(remainingText());
    else if (state.status) lines.push("♾️ বট রিস্টার্ট না হওয়া পর্যন্ত চালু");
    lines.push("টাইপ করুন: on (স্থায়ী)");
    lines.push("অথবা: on 10m (নির্দিষ্ট সময়)");
    lines.push("অথবা: off (বন্ধ)");
    return api.sendMessage(buildFrame("অটোসিন স্ট্যাটাস", lines), event.threadID, event.messageID);
};

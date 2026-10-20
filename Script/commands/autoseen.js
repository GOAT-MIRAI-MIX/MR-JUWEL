const fs = require("fs-extra");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
const dataFile = path.join(cacheDir, "autoseen.json");

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

if (!fs.existsSync(dataFile)) {
    fs.writeJsonSync(dataFile, { status: false, expiry: null }, { spaces: 2 });
}

let lastRun = 0;
let dataCache = null;

module.exports.config = {
    name: "autoseen",
    version: "3.0.0",
    hasPermssion: 1,
    credits: "MR JUWEL",
    description: "Auto Seen with timer (Bangla notices)",
    commandCategory: "tools",
    usages: "on / on 10m / off",
    cooldowns: 3
};

// ---------- Data read/write ----------
function getData() {
    try {
        if (dataCache) return dataCache;
        const data = fs.readJsonSync(dataFile);
        if (data.expiry === undefined) data.expiry = null;
        dataCache = data;
        return data;
    } catch {
        return { status: false, expiry: null };
    }
}

function setData(status, expiry) {
    dataCache = { status, expiry };
    fs.writeJsonSync(dataFile, { status, expiry }, { spaces: 2 });
}

function getStatus() {
    return getData().status;
}

// ---------- Expiry checker (every 10 sec) ----------
function checkExpiry() {
    const data = getData();
    if (data.status && data.expiry && Date.now() > data.expiry) {
        setData(false, null);
        console.log("⏰ AutoSeen expired, turned OFF");
    }
}
setInterval(checkExpiry, 10000);

// ---------- Beautiful frame (Bangla text inside) ----------
function buildFrame(title, lines) {
    const width = 44;
    const top = "╔" + "═".repeat(width - 2) + "╗";
    const bottom = "╚" + "═".repeat(width - 2) + "╝";
    const mid = (text) => {
        const pad = width - 4 - text.length;
        const left = Math.floor(pad / 2);
        const right = pad - left;
        return "║ " + " ".repeat(left) + text + " ".repeat(right) + " ║";
    };
    let msg = top + "\n";
    msg += mid("「 " + title + " 」") + "\n";
    for (const line of lines) {
        msg += mid(line) + "\n";
    }
    msg += bottom;
    return msg;
}

// ---------- Event handler (AutoSeen) ----------
module.exports.handleEvent = async ({ api }) => {
    try {
        if (!getStatus()) return;

        const now = Date.now();
        if (now - lastRun < 5000) return;
        lastRun = now;

        await api.markAsReadAll();
    } catch (e) {
        console.log("AutoSeen Error:", e);
    }
};

// ---------- Command handler ----------
module.exports.run = async ({ api, event, args }) => {
    const cmd = (args[0] || "").toLowerCase();

    // ========== ON ==========
    if (cmd === "on") {
        let expiry = null;
        let timeText = "";
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
            let ms = 0;
            if (unit === 's') ms = num * 1000;
            else if (unit === 'm') ms = num * 60 * 1000;
            else if (unit === 'h') ms = num * 60 * 60 * 1000;
            expiry = Date.now() + ms;

            if (unit === 's') timeText = num + " সেকেন্ড";
            else if (unit === 'm') timeText = num + " মিনিট";
            else if (unit === 'h') timeText = num + " ঘণ্টা";
        }

        setData(true, expiry);

        let lines = ["✅ অটোসিন: চালু"];
        if (expiry) {
            const remaining = Math.floor((expiry - Date.now()) / 1000);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            lines.push(`⏳ বন্ধ হবে ${mins}মি ${secs}সে পরে`);
        } else {
            lines.push("♾️ স্থায়ী মোড (যতক্ষণ না অফ করা হয়)");
        }
        const frame = buildFrame("অটোসিন চালু", lines);
        return api.sendMessage(frame, event.threadID, event.messageID);
    }

    // ========== OFF ==========
    if (cmd === "off") {
        setData(false, null);
        const frame = buildFrame("অটোসিন বন্ধ", [
            "❌ স্ট্যাটাস: বন্ধ",
            "অটোসিন নিষ্ক্রিয় করা হয়েছে"
        ]);
        return api.sendMessage(frame, event.threadID, event.messageID);
    }

    // ========== STATUS (default) ==========
    const data = getData();
    const statusText = data.status ? "চালু ✅" : "বন্ধ ❌";
    let lines = ["স্ট্যাটাস: " + statusText];
    if (data.status && data.expiry) {
        const remaining = Math.floor((data.expiry - Date.now()) / 1000);
        if (remaining > 0) {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            lines.push(`⏳ বন্ধ হবে ${mins}মি ${secs}সে পরে`);
        } else {
            lines.push("⏳ সময় শেষ (শীঘ্রই বন্ধ হবে)");
        }
    } else if (data.status && !data.expiry) {
        lines.push("♾️ স্থায়ী মোড");
    }
    lines.push("টাইপ করুন: on (স্থায়ী)");
    lines.push("অথবা: on 10m (নির্দিষ্ট সময়)");
    lines.push("অথবা: off (বন্ধ)");
    const frame = buildFrame("অটোসিন স্ট্যাটাস", lines);
    return api.sendMessage(frame, event.threadID, event.messageID);
};

/**
 * Mirai JS Auto AppState Refresh Bot (Persistent FB Login)
 * Creator: Raj
 * Version: 1.5.0
 */

const express = require("express");
const axios = require("axios");
const login = require("fb-chat-api");
const fs = require("fs");

// ========================
// Configuration
// ========================
const PORT = process.env.PORT || 3000;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 মিনিট
const RETRY_DELAY = 30 * 1000; // 30 সেকেন্ড

const CREDENTIALS = {
    email: "YOUR_FB_EMAIL",
    password: "YOUR_FB_PASSWORD"
};

const APPSTATE_FILE = "appstate.json";
const THREAD_ID = "YOUR_THREAD_ID_HERE";
const REFRESH_API_URL = "http://localhost:3000/refresh"; // Local / Public API URL

// ========================
// Express API
// ========================
const app = express();

app.get("/refresh", (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] 🔄 /refresh API called`);
    res.json({ status: "success", message: "AppState refreshed successfully!" });
});

app.listen(PORT, () => console.log(`✅ Public API running at http://localhost:${PORT}/refresh`));

// ========================
// Messenger Login Function
// ========================
function startBot() {
    let loginOptions = {};

    // যদি saved session থাকে, ব্যবহার করো
    if (fs.existsSync(APPSTATE_FILE)) {
        const savedAppState = JSON.parse(fs.readFileSync(APPSTATE_FILE, "utf8"));
        loginOptions = { appState: savedAppState };
        console.log("🔄 Using saved FB session...");
    } else {
        loginOptions = CREDENTIALS;
        console.log("🔄 Using email/password login...");
    }

    login(loginOptions, (err, api) => {
        if (err) {
            console.error("❌ Messenger login failed:", err);
            console.log(`🔄 Retrying Messenger login in 30 seconds...`);
            return setTimeout(startBot, RETRY_DELAY);
        }

        console.log("✅ Messenger login successful!");

        // Save appState for next time
        const appState = api.getAppState();
        fs.writeFileSync(APPSTATE_FILE, JSON.stringify(appState, null, 2));

        async function refreshAppState() {
            try {
                const response = await axios.get(REFRESH_API_URL);
                console.log(`[${new Date().toLocaleTimeString()}] ✅ AppState refreshed successfully!`);
                api.sendMessage(`✅ AppState refreshed at ${new Date().toLocaleTimeString()}`, THREAD_ID);
            } catch (err) {
                console.error(`[${new Date().toLocaleTimeString()}] ❌ Error refreshing AppState:`, err.message);
                api.sendMessage(`❌ AppState refresh failed at ${new Date().toLocaleTimeString()}\nError: ${err.message}`, THREAD_ID);
                console.log(`🔄 Retrying in 30 seconds...`);
                setTimeout(refreshAppState, RETRY_DELAY); // Retry on failure
            }
        }

        // প্রথমবার Refresh
        refreshAppState();

        // প্রতি interval এ Auto Refresh
        setInterval(refreshAppState, REFRESH_INTERVAL);
    });
}

// Start the bot
startBot();

// ========================
// Module Export
// ========================
module.exports.config = {
    name: "autorefresh",
    version: "1.5.0",
    hasPermssion: 0,
    credits: "Raj",
    description: "Auto AppState Refresh with Persistent FB login & retry mechanism",
    commandCategory: "Utilities",
    usages: "Bot চালু হওয়া মাত্র Auto Refresh শুরু হবে",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    // কোন command দরকার নেই, auto refresh চলবে background-এ
};

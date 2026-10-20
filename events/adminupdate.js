module.exports.config = {
    name: "adminUpdate",
    eventType: [
        "log:thread-admins",
        "log:thread-name",
        "log:user-nickname",
        "log:thread-icon",
        "log:thread-call",
        "log:thread-color",
        "log:thread-image"
    ],
    version: "6.0.1",
    credits: "M R | JUWEL",
    description: "Advanced Stylish Group Update System",
    envConfig: {
        sendNoti: true
    }
};

module.exports.run = async function ({ api, event, Threads, Users }) {

    const fs = require("fs-extra");
    const path = require("path");

    if (!event.logMessageData) return;

    const themePath = path.join(__dirname, "themes.json");

    // ==================== THEMES ====================

    if (!fs.existsSync(themePath)) {
        fs.writeJsonSync(themePath, {

            rainbow: {
                top: "🌈━━━━━━━━━━━━━━━━🌈",
                title: "RAINBOW UPDATE",
                bottom: "🌈━━━━━━━━━━━━━━━━🌈",
                icon: "🌈"
            },

            fire: {
                top: "🔥━━━━━━━━━━━━━━━━🔥",
                title: "FIRE UPDATE",
                bottom: "🔥━━━━━━━━━━━━━━━━🔥",
                icon: "🔥"
            },

            galaxy: {
                top: "🌌━━━━━━━━━━━━━━━━🌌",
                title: "GALAXY UPDATE",
                bottom: "🌌━━━━━━━━━━━━━━━━🌌",
                icon: "🌌"
            },

            cyber: {
                top: "🤖━━━━━━━━━━━━━━━━🤖",
                title: "CYBER UPDATE",
                bottom: "🤖━━━━━━━━━━━━━━━━🤖",
                icon: "🤖"
            },

            king: {
                top: "👑━━━━━━━━━━━━━━━━👑",
                title: "KING UPDATE",
                bottom: "👑━━━━━━━━━━━━━━━━👑",
                icon: "👑"
            },

            neon: {
                top: "🪩━━━━━━━━━━━━━━━━🪩",
                title: "NEON UPDATE",
                bottom: "🪩━━━━━━━━━━━━━━━━🪩",
                icon: "🪩"
            },

            diamond: {
                top: "💎━━━━━━━━━━━━━━━━💎",
                title: "DIAMOND UPDATE",
                bottom: "💎━━━━━━━━━━━━━━━━💎",
                icon: "💎"
            },

            anime: {
                top: "🎌━━━━━━━━━━━━━━━━🎌",
                title: "ANIME UPDATE",
                bottom: "🎌━━━━━━━━━━━━━━━━🎌",
                icon: "🎌"
            },

            hacker: {
                top: "💻━━━━━━━━━━━━━━━━💻",
                title: "HACKER UPDATE",
                bottom: "💻━━━━━━━━━━━━━━━━💻",
                icon: "💻"
            },

            thunder: {
                top: "⚡━━━━━━━━━━━━━━━━⚡",
                title: "THUNDER UPDATE",
                bottom: "⚡━━━━━━━━━━━━━━━━⚡",
                icon: "⚡"
            }

        }, { spaces: 2 });
    }

    const themes = fs.readJsonSync(themePath);

    function randomTheme() {
        const keys = Object.keys(themes);
        return themes[
            keys[Math.floor(Math.random() * keys.length)]
        ];
    }

    const theme = randomTheme();

    // ==================== USER ====================

    async function getUser(uid) {

        if (!uid) {
            return {
                name: "Unknown User",
                mentions: []
            };
        }

        let name = "Unknown User";

        try {
            name = await Users.getNameUser(uid);
        } catch (e) {
            name = "Unknown User";
        }

        if (!name) name = "Unknown User";

        return {
            name,
            mentions: [{
                tag: name,
                id: uid
            }]
        };
    }

    // ==================== THREAD ====================

    const threadID = event.threadID;

    const data =
        await Threads.getData(threadID) || {};

    if (!data.threadInfo)
        data.threadInfo = {};

    const info = data.threadInfo;

    info.adminIDs = info.adminIDs || [];
    info.nicknames = info.nicknames || {};

    // ==================== SEND ====================

    async function send(body, mentions = []) {

        return api.sendMessage({
            body,
            mentions: mentions.filter(Boolean)
        }, threadID);
    }

    // ==================== EVENTS ====================

    try {

        switch (event.logMessageType) {

            // ===================================================
            // ADMIN UPDATE
            // ===================================================

            case "log:thread-admins": {

                // Debug log - check console output to confirm field names if it still fails
                console.log("[ADMIN UPDATE DEBUG]", JSON.stringify(event.logMessageData), "AUTHOR:", event.author, "SENDER:", event.senderID);

                const target =
                    event.logMessageData.TARGET_ID ||
                    event.logMessageData.target_id;

                const author =
                    event.author ||
                    event.logMessageData.ADMINID ||
                    event.logMessageData.MANAGER_FBID ||
                    event.logMessageData.author ||
                    event.senderID;

                const user =
                    await getUser(target);

                const admin =
                    await getUser(author);

                const adminEvent =
                    event.logMessageData.ADMIN_EVENT ||
                    event.logMessageData.admin_event;

                const isAdded =
                    adminEvent === true ||
                    adminEvent === "true" ||
                    adminEvent === "add_admin";

                const isRemoved =
                    adminEvent === false ||
                    adminEvent === "false" ||
                    adminEvent === "remove_admin";

                // ADD ADMIN

                if (isAdded) {

                    if (!info.adminIDs.some(
                        i => i.id == target
                    )) {

                        info.adminIDs.push({
                            id: target
                        });
                    }

                    await send(

`${theme.top}
👑 ${theme.title}
${theme.bottom}

✅ NEW ADMIN ADDED

👤 User :
${user.name}

⚡ Added By :
${admin.name}

🎉 তাকে Admin বানানো হয়েছে
🔥 Team Power Increased

${theme.bottom}`,

[
user.mentions[0],
admin.mentions[0]
]

                    );

                    break;
                }

                // REMOVE ADMIN

                if (isRemoved) {

                    info.adminIDs =
                        info.adminIDs.filter(
                            i => i.id != target
                        );

                    await send(

`${theme.top}
❌ ${theme.title}
${theme.bottom}

🚫 ADMIN REMOVED

👤 User :
${user.name}

⚡ Removed By :
${admin.name}

💀 তার Admin Power Remove করা হয়েছে

${theme.bottom}`,

[
user.mentions[0],
admin.mentions[0]
]

                    );

                    break;
                }

                // Fallback: unknown adminEvent value, still try to guess
                console.log("[ADMIN UPDATE] Unhandled ADMIN_EVENT value:", adminEvent);

                break;
            }

            // ===================================================
            // THREAD NAME
            // ===================================================

            case "log:thread-name": {

                const oldName =
                    info.threadName || "Unknown";

                const newName =
                    event.logMessageData.name ||
                    "No Name";

                info.threadName = newName;

                await send(

`${theme.top}
🏷️ ${theme.title}
${theme.bottom}

✨ GROUP NAME UPDATED

📌 Old Name :
${oldName}

🆕 New Name :
${newName}

⚡ Team Looks Fresh Now

${theme.bottom}`

                );

                break;
            }

            // ===================================================
            // NICKNAME
            // ===================================================

            case "log:user-nickname": {

                const uid =
                    event.logMessageData.participant_id;

                const oldNick =
                    info.nicknames[uid] ||
                    "Original Name";

                const newNick =
                    event.logMessageData.nickname ||
                    "Original Name";

                info.nicknames[uid] = newNick;

                const user =
                    await getUser(uid);

                await send(

`${theme.top}
🏷️ ${theme.title}
${theme.bottom}

✨ NICKNAME UPDATED

👤 User :
${user.name}

📌 Old Nickname :
${oldNick}

🆕 New Nickname :
${newNick}

🔥 Stylish Upgrade Complete

${theme.bottom}`,

[user.mentions[0]]

                );

                break;
            }

            // ===================================================
            // GROUP ICON
            // ===================================================

            case "log:thread-icon": {

                const icon =
                    event.logMessageData.thread_icon ||
                    event.logMessageData.threadIcon ||
                    "👍";

                info.threadIcon = icon;

                await send(

`${theme.top}
🎭 ${theme.title}
${theme.bottom}

✨ GROUP EMOJI UPDATED

🆕 New Emoji :
${icon}

⚡ Team Style Changed Successfully

${theme.bottom}`

                );

                break;
            }

            // ===================================================
            // THREAD COLOR
            // ===================================================

            case "log:thread-color": {

                await send(

`${theme.top}
🎨 ${theme.title}
${theme.bottom}

🌈 GROUP COLOR UPDATED

⚡ New Theme Color Applied
🔥 Chat Now Looks Amazing

${theme.bottom}`

                );

                break;
            }

            // ===================================================
            // THREAD PHOTO
            // ===================================================

            case "log:thread-image": {

                await send(

`${theme.top}
🖼️ ${theme.title}
${theme.bottom}

✨ GROUP PHOTO UPDATED

📸 New Group Photo Set
🔥 Team Profile Looks Awesome

${theme.bottom}`

                );

                break;
            }

            // ===================================================
            // CALL EVENT
            // ===================================================

            case "log:thread-call": {

                // CALL START

                if (
                    event.logMessageData.event ==
                    "group_call_started"
                ) {

                    const caller =
                        await getUser(
                            event.logMessageData.caller_id
                        );

                    await send(

`${theme.top}
📞 ${theme.title}
${theme.bottom}

☎️ GROUP CALL STARTED

👤 Started By :
${caller.name}

⚡ সবাই Call এ Join দাও

${theme.bottom}`,

[caller.mentions[0]]

                    );

                    break;
                }

                // CALL END

                if (
                    event.logMessageData.event ==
                    "group_call_ended"
                ) {

                    const duration =
                        event.logMessageData.call_duration || 0;

                    const h =
                        String(
                            Math.floor(duration / 3600)
                        ).padStart(2, '0');

                    const m =
                        String(
                            Math.floor(
                                (duration % 3600) / 60
                            )
                        ).padStart(2, '0');

                    const s =
                        String(
                            duration % 60
                        ).padStart(2, '0');

                    await send(

`${theme.top}
📴 ${theme.title}
${theme.bottom}

❌ GROUP CALL ENDED

⏳ Duration :
${h}:${m}:${s}

⚡ Call Session Finished

${theme.bottom}`

                    );

                    break;
                }

                // JOIN CALL

                if (
                    event.logMessageData.joining_user
                ) {

                    const user =
                        await getUser(
                            event.logMessageData.joining_user
                        );

                    await send(

`${theme.top}
📞 ${theme.title}
${theme.bottom}

✅ USER JOINED CALL

👤 User :
${user.name}

🎧 এখন Call এ Connected

${theme.bottom}`,

[user.mentions[0]]

                    );

                    break;
                }

                break;
            }

        }

        // ==================== SAVE ====================

        await Threads.setData(threadID, {
            threadInfo: info
        });

    } catch (err) {

        console.error(
            "[ ADMIN UPDATE ERROR ]",
            err
        );

    }

};

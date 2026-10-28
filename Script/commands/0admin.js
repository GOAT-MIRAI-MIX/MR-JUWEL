const { readFileSync, writeFileSync, existsSync } = require("fs-extra");
const { resolve } = require("path");

// Converts A-Z a-z 0-9 to bold math font (𝐀𝐁𝐂𝐃). Skips %1, %2 placeholders.
const B = (s) => String(s).replace(/%\d|[A-Za-z0-9]/g, (c) => {
    if (c[0] === "%") return c;
    const n = c.charCodeAt(0);
    if (n >= 65 && n <= 90) return String.fromCodePoint(0x1D400 + n - 65);
    if (n >= 97 && n <= 122) return String.fromCodePoint(0x1D41A + n - 97);
    return String.fromCodePoint(0x1D7CE + n - 48);
});

module.exports.config = {
    name: "0admin",
    version: "1.0.6",
    hasPermssion: 3,
    credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
    description: "Admin Config",
    commandCategory: "Admin",
    usages: "Admin",
    cooldowns: 2,
    dependencies: {
        "fs-extra": ""
    }
};

const TEXT = {
    listAdmin: B("===「 ADMIN LIST 」===\n━━━━━━━━━━━━━━━\n%1\n\n==「 BOT SUPPORTERS 」==\n━━━━━━━━━━━━━━━\n%2"),
    notHavePermssion: B('MODE - You do not have permission to use "%1"'),
    addedNewAdmin: B("MODE - Successfully added %1 Admin\n\n%2"),
    addedNewNDH: B("MODE - Successfully added %1 Supporter\n\n%2"),
    removedAdmin: B("MODE - Successfully removed %1 Admin\n\n%2"),
    removedNDH: B("MODE - Successfully removed %1 Supporter\n\n%2")
};

module.exports.languages = { vi: TEXT, en: TEXT };

module.exports.onLoad = function () {
    const path = resolve(__dirname, "cache", "data.json");
    let data = { adminbox: {} };
    if (existsSync(path)) {
        try { data = JSON.parse(readFileSync(path, "utf8")); } catch (e) { data = {}; }
        if (!data.adminbox) data.adminbox = {};
    }
    writeFileSync(path, JSON.stringify(data, null, 4));
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
    const { threadID, messageID, mentions, type, messageReply } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    if (args.length == 0) {
        const p = global.config.PREFIX;
        return send(
            B("==== [ ADMIN SETTING ] ====\n━━━━━━━━━━━━━━━\n") +
            B(`MODE - ${p}admin list => View Admin and Supporter list\n`) +
            B(`MODE - ${p}admin add => Add user as Admin\n`) +
            B(`MODE - ${p}admin remove => Remove Admin role\n`) +
            B(`MODE - ${p}admin addndh => Add user as Supporter\n`) +
            B(`MODE - ${p}admin removendh => Remove Supporter role\n`) +
            B(`MODE - ${p}admin qtvonly => Toggle only group admins can use bot\n`) +
            B(`MODE - ${p}admin ndhonly => Toggle only supporters can use bot\n`) +
            B(`MODE - ${p}admin only => Toggle only admins can use bot\n`) +
            B(`MODE - ${p}admin ibonly => Toggle only admins can use bot in inbox\n`) +
            B("━━━━━━━━━━━━━━━\n") +
            B(`Guide => ${p}admin commands to use`)
        );
    }

    const { configPath } = global.client;
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);

    config.ADMINBOT = config.ADMINBOT || [];
    config.NDH = config.NDH || [];
    global.config.ADMINBOT = global.config.ADMINBOT || [];
    global.config.NDH = global.config.NDH || [];

    const save = () => writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");

    const getName = async (id) => {
        try { return (await Users.getData(id)).name || id; } catch (e) { return id; }
    };

    const getTargets = () => {
        if (type == "message_reply" && messageReply) return [String(messageReply.senderID)];
        const ids = Object.keys(mentions || {});
        if (ids.length) return ids.map(String);
        if (args[1] && !isNaN(args[1])) return [String(args[1])];
        return [];
    };

    const modify = async (key, add) => {
        const targets = getTargets();
        if (!targets.length) return null;
        const lines = [];
        for (const id of targets) {
            const name = await getName(id);
            const cIdx = config[key].findIndex((x) => String(x) == id);
            const gIdx = global.config[key].findIndex((x) => String(x) == id);
            if (add) {
                if (cIdx == -1) config[key].push(id);
                if (gIdx == -1) global.config[key].push(id);
            } else {
                if (cIdx != -1) config[key].splice(cIdx, 1);
                if (gIdx != -1) global.config[key].splice(gIdx, 1);
            }
            lines.push(`${id} - ${name}`);
        }
        save();
        return lines;
    };

    const handle = async (key, add, textKey, permName) => {
        if (permssion != 3) return send(getText("notHavePermssion", permName));
        const lines = await modify(key, add);
        if (!lines) return send(B("MODE - Please mention, reply or enter a valid user ID."));
        return send(getText(textKey, lines.length, lines.join("\n").replace(/@/g, "")));
    };

    switch (args[0]) {
        case "list":
        case "all":
        case "-a": {
            const admins = [];
            for (const id of global.config.ADMINBOT || config.ADMINBOT) {
                if (parseInt(id)) admins.push(`${B("Name")}: ${await getName(id)}\n» ${B("FB Link")}: https://www.facebook.com/${id} 💌`);
            }
            const supporters = [];
            for (const id of global.config.NDH || config.NDH) {
                if (parseInt(id)) supporters.push(`${B("Name")}: ${await getName(id)}\n» ${B("FB Link")}: https://www.facebook.com/${id} 🤖`);
            }
            return send(getText("listAdmin", admins.join("\n\n"), supporters.join("\n\n")));
        }

        case "add":
            return handle("ADMINBOT", true, "addedNewAdmin", "add");

        case "addndh":
            return handle("NDH", true, "addedNewNDH", "addndh");

        case "remove":
        case "rm":
        case "delete":
            return handle("ADMINBOT", false, "removedAdmin", "delete");

        case "removendh":
            return handle("NDH", false, "removedNDH", "removendh");

        case "qtvonly": {
            if (permssion < 1) return send(B("MODE - Border cangle rights 🎀"));
            const pathData = resolve(__dirname, "cache", "data.json");
            let database = { adminbox: {} };
            try { database = JSON.parse(readFileSync(pathData, "utf8")); } catch (e) {}
            if (!database.adminbox) database.adminbox = {};
            if (database.adminbox[threadID] == true) {
                database.adminbox[threadID] = false;
                send(B("MODE » Successfully disabled QTV only mode, everyone can use the bot 👀"));
            } else {
                database.adminbox[threadID] = true;
                send(B("MODE » Successfully enabled QTV only mode, only administrators can use the bot 👀"));
            }
            writeFileSync(pathData, JSON.stringify(database, null, 4));
            break;
        }

        case "ndhonly":
        case "-ndh": {
            if (permssion < 2) return send(B("MODE - Border cangle rights 🎀"));
            config.ndhOnly = !config.ndhOnly;
            global.config.ndhOnly = config.ndhOnly;
            send(config.ndhOnly
                ? B("MODE » Successfully enabled NDH Only mode, only bot supporters can use the bot 👾")
                : B("MODE » Successfully disabled NDH Only mode, everyone can use the bot 👾"));
            save();
            break;
        }

        case "ibonly": {
            if (permssion != 3) return send(B("MODE - Border cangle rights 🎀"));
            config.adminPaOnly = !config.adminPaOnly;
            global.config.adminPaOnly = config.adminPaOnly;
            send(config.adminPaOnly
                ? B("MODE » Ib Only mode is successfully enabled, only admins can use the bot in their own inbox 💬")
                : B("MODE » Successfully disabled Ib Only mode, everyone can use the bot in their own inbox 💬"));
            save();
            break;
        }

        case "only":
        case "-o": {
            if (permssion != 3) return send(B("MODE - Border cangle rights 🎀"));
            config.adminOnly = !config.adminOnly;
            global.config.adminOnly = config.adminOnly;
            send(config.adminOnly
                ? B("MODE - Successfully enabled Admin Only mode, only admins can use the bot 👑")
                : B("MODE - Successfully disabled Admin Only mode, everyone can use the bot 👑"));
            save();
            break;
        }

        default:
            return global.utils.throwError(this.config.name, threadID, messageID);
    }
};

const moment = require('moment-timezone');
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require('fs-extra');
const { join, resolve } = require('path');
const { execSync } = require('child_process');

// ───────────── বট/ডেভেলপারের তথ্য ─────────────
const logName = '𝗠𝗥↔𝗝𝗨𝗪𝗘𝗟';
const logNickName = '🅙🅤🅦🅔🅛 🅒🅗🅐🅣 🅑🅞🅣';
const logAnthorName = '𝗠𝗥↔𝗝𝗨𝗪𝗘𝗟';
const anthorUid = '61595409844497';
const anthorId = '61594400795920';
const logconsoleName = '𝗠𝗘𝗦𝗦𝗘𝗡𝗚𝗘𝗥 𝗖𝗛𝗔𝗧 𝗕𝗢𝗧';

const logger = require('./utils/log')(logName, logNickName);
const consoleLogger = require('./utils/console');
const login = require('./includes/login/login');

consoleLogger.init(logconsoleName);

const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require('module').builtinModules;
const chalk = require('chalk');

const colorOptions = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const selectedColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

const BOT_ART = chalk[selectedColor](`
░░░▒█ ▒█░▒█ ▒█░░▒█ ▒█▀▀▀ ▒█░░░ 
░▄░▒█ ▒█░▒█ ▒█▒█▒█ ▒█▀▀▀ ▒█░░░ 
▒█▄▄█ ░▀▄▄▀ ▒█▄▀▄█ ▒█▄▄▄ ▒█▄▄█

       𝐉𝐔𝐖𝐄𝐋↔𝐁𝐎𝐓
         𝗠𝗥↔𝗝𝗨𝗪𝗘𝗟

`);

// ───────────── global.client ─────────────
const TIMEZONE = 'Asia/Kolkata'; // এখানে নিজের টাইমজোন দিতে পারো, যেমন 'Asia/Dhaka'

global.client = new Object({
    commands: new Map(),
    commandAliases: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    mainPath: process.cwd(),
    configPath: new String(),
    getTime: function (option) {
        switch (option) {
            case 'seconds':  return '' + moment.tz(TIMEZONE).format('ss');
            case 'minutes':  return '' + moment.tz(TIMEZONE).format('mm');
            case 'hours':    return '' + moment.tz(TIMEZONE).format('HH');
            case 'date':     return '' + moment.tz(TIMEZONE).format('DD');
            case 'month':    return '' + moment.tz(TIMEZONE).format('MM');
            case 'year':     return '' + moment.tz(TIMEZONE).format('YYYY');
            case 'fullHour': return '' + moment.tz(TIMEZONE).format('HH:mm:ss');
            case 'fullYear': return '' + moment.tz(TIMEZONE).format('DD/MM/YYYY');
            case 'fullTime': return '' + moment.tz(TIMEZONE).format('HH:mm:ss DD/MM/YYYY');
        }
    }
});

global.client.commandAliasIndex = new Map();

// aliases / alias ফিল্ড থেকে ছোট হাতের অ্যালিয়াস লিস্ট বানায়
global.client.normalizeAliases = function (config) {
    const sources = [];
    if (config && config.aliases !== undefined) sources.push(config.aliases);
    if (config && config.alias !== undefined) sources.push(config.alias);

    const result = [];
    for (const source of sources) {
        if (source === null || source === undefined) continue;
        const parts = Array.isArray(source) ? source : String(source).split(/[,\s]+/);
        for (const part of parts) {
            const text = String(part === null || part === undefined ? '' : part).trim();
            if (!text) continue;
            const lower = text.toLowerCase();
            if (!result.includes(lower)) result.push(lower);
        }
    }
    return result;
};

// কমান্ডের নাম বা অ্যালিয়াস থেকে আসল কমান্ডের নাম বের করে
global.client.resolveCommandName = function (input) {
    const key = String(input === null || input === undefined ? '' : input).trim().toLowerCase();
    if (!key) return null;

    for (const name of global.client.commands.keys()) {
        if (String(name).trim().toLowerCase() === key) return name;
    }

    const target = global.client.commandAliases.get(key);
    if (target !== undefined && global.client.commands.has(target)) return target;
    return null;
};

global.client.resolveCommand = function (input) {
    const name = global.client.resolveCommandName(input);
    return name === null ? null : (global.client.commands.get(name) || null);
};

global.client.getAliases = function (input) {
    const name = global.client.resolveCommandName(input);
    if (name === null) return [];
    return (global.client.commandAliasIndex.get(name) || []).slice();
};

global.client.commandCandidates = function () {
    const list = [];
    for (const name of global.client.commands.keys()) list.push(String(name));
    for (const alias of global.client.commandAliases.keys()) list.push(alias);
    return list;
};

// নতুন কমান্ড রেজিস্টার করে
global.client.registerCommand = function (module, fallbackName) {
    const result = { ok: false, reason: null, name: null, conflict: null, aliases: [], skipped: [] };

    if (!module || typeof module !== 'object' || !module.config) {
        result.reason = 'module has no config';
        return result;
    }

    let name = String(module.config.name === null || module.config.name === undefined ? '' : module.config.name).trim();
    if (!name && fallbackName) name = String(fallbackName).trim().replace(/\.js$/i, '');
    if (!name) {
        result.reason = 'module.config.name is empty';
        return result;
    }
    result.name = name;

    const lowerName = name.toLowerCase();

    for (const existing of global.client.commands.keys()) {
        if (String(existing).trim().toLowerCase() === lowerName) {
            result.reason = 'command name collision: "' + name + '" is already loaded (' + existing + ')';
            result.conflict = String(existing);
            return result;
        }
    }

    const aliasOwner = global.client.commandAliases.get(lowerName);
    if (aliasOwner !== undefined) {
        result.reason = 'command name collision: "' + name + '" is already used as an alias of "' + aliasOwner + '"';
        result.conflict = aliasOwner;
        return result;
    }

    const acceptedAliases = [];
    for (const alias of global.client.normalizeAliases(module.config)) {
        if (alias === lowerName) {
            result.skipped.push({ alias, reason: 'it is the same as the command name' });
            continue;
        }

        const owner = global.client.commandAliases.get(alias);
        if (owner !== undefined && owner !== name) {
            result.skipped.push({ alias, reason: 'it is already an alias of "' + owner + '"' });
            continue;
        }

        let clashingCommand = null;
        for (const existing of global.client.commands.keys()) {
            if (String(existing).trim().toLowerCase() === alias) {
                clashingCommand = String(existing);
                break;
            }
        }
        if (clashingCommand !== null) {
            result.skipped.push({ alias, reason: 'it is already a command name ("' + clashingCommand + '")' });
            continue;
        }

        acceptedAliases.push(alias);
    }

    global.client.commands.set(name, module);
    for (const alias of acceptedAliases) global.client.commandAliases.set(alias, name);

    if (acceptedAliases.length) global.client.commandAliasIndex.set(name, acceptedAliases);
    else global.client.commandAliasIndex.delete(name);

    result.ok = true;
    result.aliases = acceptedAliases;
    return result;
};

// কমান্ড রেজিস্ট্রি থেকে মুছে ফেলে
global.client.unregisterCommand = function (input) {
    const name = global.client.resolveCommandName(input);
    if (name === null) return false;

    global.client.commands.delete(name);

    const aliases = global.client.commandAliasIndex.get(name) || [];
    for (const alias of aliases) {
        if (global.client.commandAliases.get(alias) === name) global.client.commandAliases.delete(alias);
    }
    global.client.commandAliasIndex.delete(name);

    if (Array.isArray(global.client.eventRegistered)) {
        global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== name);
    }
    return true;
};

// ───────────── global ডাটা ─────────────
global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});

global.utils = require('./utils');
global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();
global.developers = [anthorUid, anthorId];

global.isDeveloper = function (id) {
    if (!id) return false;
    const uid = String(id);
    const configDevs = global.config && Array.isArray(global.config.DEVELOPER)
        ? global.config.DEVELOPER.map(String)
        : [];
    return configDevs.includes(uid) || global.developers.includes(uid);
};

if (typeof global.handleListen === 'undefined') global.handleListen = null;

// ───────────── config.json লোড ─────────────
var configValue;
try {
    global.client.configPath = join(global.client.mainPath, 'config.json');
    configValue = require(global.client.configPath);
    logger.loader('Found file config: config.json');
} catch {
    const configTempPath = join(global.client.mainPath, 'config.json.temp');
    if (existsSync(configTempPath)) {
        configValue = JSON.parse(readFileSync(configTempPath));
        logger.loader('Found: ' + configTempPath);
    } else {
        return logger.loader('config.json not found!', 'error');
    }
}

try {
    for (const key in configValue) global.config[key] = configValue[key];
    logger.loader('Config Loaded!');
} catch {
    return logger.loader("Can't load file config!", 'error');
}

const { Sequelize, sequelize } = require('./includes/database');

writeFileSync(
    global.client.configPath + '.temp',
    JSON.stringify(global.config, null, 4),
    { encoding: 'utf8', mode: 0o600 }
);

// ───────────── ভাষা ফাইল (languages/xx.lang) লোড ─────────────
const langFile = readFileSync(
    __dirname + '/languages/' + (global.config.language || 'en') + '.lang',
    { encoding: 'utf-8' }
).split(/\r?\n|\r/);

const langData = langFile.filter(line => line.indexOf('#') != 0 && line != '');

for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');

    if (typeof global.language[head] == 'undefined') global.language[head] = new Object();
    global.language[head][key] = value;
}

global.getText = function (...args) {
    const langObj = global.language;
    if (!langObj.hasOwnProperty(args[0])) throw __filename + ' - Not found key language: ' + args[0];

    var text = langObj[args[0]][args[1]];
    for (var i = args.length - 1; i > 0; i--) {
        const regex = RegExp('%' + i, 'g');
        text = text.replace(regex, args[i + 1]);
    }
    return text;
};

// ───────────── appstate লোড ─────────────
try {
    var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || 'appstate.json'));
    if (existsSync(appStateFile)) {
        var appState = require(appStateFile);
        logger.loader(global.getText('shahadat', 'foundPathAppstate'));
    } else {
        var appState = null;
        logger.loader(global.getText('shahadat', 'notFoundPathAppstate'), 'warn');
    }
} catch {
    return logger.loader(global.getText('shahadat', 'errorFormat'), 'error');
}

logger('MESSENGER CHAT BOT', '[ Starting ]');

// ───────────── ওয়েব সার্ভার + একটাই ইনস্ট্যান্স চেক ─────────────
const express = require('express');
const path = require('path');
const http = require('http');
const PID_FILE = join(global.client.mainPath, '.bot.pid');

function checkSingleInstance() {
    try {
        if (existsSync(PID_FILE)) {
            const oldPid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10);
            if (oldPid && oldPid !== process.pid) {
                try {
                    process.kill(oldPid, 0); // প্রসেস চালু থাকলে এরর দেবে না
                    logger('Another bot instance (PID ' + oldPid + ') is already running. Preventing duplicate sessions.', '[ WARNING ]');
                    return false;
                } catch (e) {
                    logger('Removing stale PID file from a previous run.', '[ WARNING ]');
                }
            }
        }
        writeFileSync(PID_FILE, String(process.pid), 'utf8');
    } catch (e) {}
    return true;
}

function removePidFile() {
    try {
        if (existsSync(PID_FILE)) {
            const pid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10);
            if (pid === process.pid) unlinkSync(PID_FILE);
        }
    } catch (e) {}
}

const app = express();
const port = process.env.PORT || 8080;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/index.html', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

const server = http.createServer(app);

let botStartupStarted = false;
let listenerStarted = false;

async function startBot() {
    if (botStartupStarted) return;
    botStartupStarted = true;

    try {
        await sequelize.authenticate();
        const models = require('./includes/database/model')({ Sequelize, sequelize });
        logger(global.getText('shahadat', 'successConnectDatabase'), '[ DATABASE ]');
        onBot({ models });
    } catch (error) {
        logger('Database error: ' + error.message, '[ ERROR ]');
    }
}

if (!checkSingleInstance()) {
    logger('Duplicate bot instance detected - exiting so the running instance keeps its session.', '[ WARNING ]');
    process.exit(1);
}

server
    .listen(port, '0.0.0.0', () => {
        logger('Server running on port ' + port, '[ WEB ]');
        startBot();
    })
    .on('error', err => {
        if (err.code === 'EADDRINUSE') {
            logger('Port ' + port + ' is already in use - this runtime will not open another bot connection', '[ WEB ]');
            process.exit(1);
            return;
        }

        if (err.code === 'EACCES') logger('Port ' + port + ' permission denied', '[ ERROR ]');
        else logger('Web server error: ' + err.message, '[ ERROR ]');

        startBot();
    });

// ───────────── কনসোলে মেসেজ লগ ─────────────
const consoleNameCache = new Map();

function isConsoleEnabled(threadID) {
    const id = String(threadID);
    const data = global.data.threadData.get(id) || global.data.threadData.get(parseInt(id, 10)) || {};
    return data.console !== false;
}

async function getConsoleInfo(api, event) {
    const threadID = String(event.threadID);
    const senderID = String(event.senderID);

    let groupName = (global.data.threadInfo.get(threadID) || {}).threadName;
    if (!groupName && !consoleNameCache.has('thread|' + threadID)) {
        try {
            const info = await api.getThreadInfo(threadID);
            consoleNameCache.set('thread|' + threadID, (info || {}).threadName || '');
        } catch {
            consoleNameCache.set('thread|' + threadID, '');
        }
    }
    if (!groupName) groupName = consoleNameCache.get('thread|' + threadID) || undefined;

    let userName = global.data.userName.get(senderID);
    if (!userName && !consoleNameCache.has('user|' + senderID)) {
        try {
            const info = await api.getUserInfo([senderID]);
            consoleNameCache.set('user|' + senderID, ((info || {})[senderID] || {}).name || '');
        } catch {
            consoleNameCache.set('user|' + senderID, '');
        }
    }
    if (!userName) userName = consoleNameCache.get('user|' + senderID) || undefined;

    return { groupName, userName };
}

function logMessageToConsole(api, event) {
    try {
        if (!event || !['message', 'message_reply'].includes(event.type)) return;

        const threadID = String(event.threadID || '');
        const senderID = String(event.senderID || '');
        if (!threadID || !senderID) return;

        let botID = '';
        try { botID = String(api.getCurrentUserID() || ''); } catch { botID = ''; }
        if (botID && senderID === botID) return; // বটের নিজের মেসেজ লগ হবে না

        if (!isConsoleEnabled(threadID)) return;

        getConsoleInfo(api, event)
            .then(function ({ groupName, userName }) {
                consoleLogger.log({
                    groupName,
                    threadID,
                    userName,
                    senderID,
                    content: event.body ? event.body : undefined
                });
            })
            .catch(function () {});
    } catch (e) {}
}

// ───────────── মূল বট: লগইন, কমান্ড/ইভেন্ট লোড, লিসেনার ─────────────
function onBot({ models }) {
    login({ appState }, async (loginError, api) => {
        if (loginError) {
            logger('Login error: ' + logger.redactSecrets(JSON.stringify(loginError)), 'ERROR');
            return;
        }

        if (listenerStarted) {
            logger('Bot already running - duplicate login callback ignored', '[ LISTENER ]');
            return;
        }

        global.client.api = api;
        global.client.timeStart = new Date().getTime();

        // ── Script/commands লোড ──
        (function loadCommands() {
            const disabledCommands = Array.isArray(global.config.commandDisabled) ? global.config.commandDisabled : [];
            const listCommand = readdirSync(global.client.mainPath + '/Script/commands').filter(
                file => file.endsWith('.js') && !file.includes('example') && !disabledCommands.includes(file)
            );

            for (const file of listCommand) {
                var registered = null;
                try {
                    var module = require(global.client.mainPath + '/Script/commands/' + file);

                    if (!module.config || !module.run || !module.config.commandCategory) {
                        throw new Error(global.getText('shahadat', 'errorFormat'));
                    }

                    registered = global.client.registerCommand(module, file);
                    if (!registered.ok) throw new Error(registered.reason);

                    for (const skipped of registered.skipped) {
                        logger.loader(
                            'Command "' + registered.name + '": alias "' + skipped.alias + '" was ignored because ' + skipped.reason + '.',
                            'warn'
                        );
                    }

                    if (!module.languages || typeof module.languages != 'object' || Object.keys(module.languages).length == 0) {
                        logger.loader(global.getText('shahadat', 'notFoundLanguage', module.config.name), 'warn');
                    }

                    // dependencies ইনস্টল/লোড
                    if (module.config.dependencies && typeof module.config.dependencies == 'object') {
                        for (const dependency in module.config.dependencies) {
                            const moduleDir = join(__dirname, 'nodemodules', 'node_modules', dependency);
                            try {
                                if (!global.nodemodule.hasOwnProperty(dependency)) {
                                    if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) {
                                        global.nodemodule[dependency] = require(dependency);
                                    } else {
                                        global.nodemodule[dependency] = require(moduleDir);
                                    }
                                }
                            } catch {
                                var loaded = false, lastError;
                                logger.loader(global.getText('shahadat', 'notFoundPackage', dependency, module.config.name), 'warn');

                                const version = module.config.dependencies[dependency];
                                execSync(
                                    'npm --package-lock false --save install ' + dependency + (version == '*' || version == '' ? '' : '@' + version),
                                    { stdio: 'inherit', env: process.env, shell: true, cwd: join(__dirname, 'nodemodules') }
                                );

                                for (let attempt = 1; attempt <= 3; attempt++) {
                                    try {
                                        require.cache = {};
                                        if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) {
                                            global.nodemodule[dependency] = require(dependency);
                                        } else {
                                            global.nodemodule[dependency] = require(moduleDir);
                                        }
                                        loaded = true;
                                        break;
                                    } catch (err) {
                                        lastError = err;
                                    }
                                    if (loaded || !lastError) break;
                                }

                                if (!loaded || lastError) {
                                    throw global.getText('shahadat', 'cantInstallPackage', dependency, module.config.name, lastError);
                                }
                            }
                        }
                        logger.loader(global.getText('shahadat', 'loadedPackage', module.config.name));
                    }

                    // envConfig
                    if (module.config.envConfig) {
                        try {
                            for (const envKey in module.config.envConfig) {
                                const name = module.config.name;
                                if (typeof global.configModule[name] == 'undefined') global.configModule[name] = {};
                                if (typeof global.config[name] == 'undefined') global.config[name] = {};

                                if (typeof global.config[name][envKey] !== 'undefined') {
                                    global.configModule[name][envKey] = global.config[name][envKey];
                                } else {
                                    global.configModule[name][envKey] = module.config.envConfig[envKey] || '';
                                }
                                if (typeof global.config[name][envKey] == 'undefined') {
                                    global.config[name][envKey] = module.config.envConfig[envKey] || '';
                                }
                            }
                            logger.loader(global.getText('shahadat', 'loadedConfig', module.config.name));
                        } catch (error) {
                            throw new Error(global.getText('shahadat', 'loadedConfig', module.config.name, JSON.stringify(error)));
                        }
                    }

                    // onLoad
                    if (module.onLoad) {
                        try {
                            module.onLoad({ api: api, models: models });
                        } catch (error) {
                            throw new Error(global.getText('shahadat', 'cantOnload', module.config.name, JSON.stringify(error)), 'error');
                        }
                    }

                    if (module.handleEvent) global.client.eventRegistered.push(registered.name);

                    logger.loader(global.getText('shahadat', 'successLoadModule', module.config.name));
                } catch (error) {
                    if (registered && registered.ok) global.client.unregisterCommand(registered.name);
                    const failName = module && module.config && module.config.name ? module.config.name : file;
                    logger.loader(global.getText('shahadat', 'failLoadModule', failName, error), 'error');
                }
            }
        })();

        // ── Script/events লোড ──
        (function loadEvents() {
            const disabledEvents = Array.isArray(global.config.eventDisabled) ? global.config.eventDisabled : [];
            const listEvent = readdirSync(global.client.mainPath + '/Script/events').filter(
                file => file.endsWith('.js') && !disabledEvents.includes(file)
            );

            for (const file of listEvent) {
                try {
                    var event = require(global.client.mainPath + '/Script/events/' + file);

                    if (!event.config || !event.run) throw new Error(global.getText('shahadat', 'errorFormat'));
                    if (global.client.events.has(event.config.name) || '') throw new Error(global.getText('shahadat', 'nameExist'));

                    // dependencies ইনস্টল/লোড
                    if (event.config.dependencies && typeof event.config.dependencies == 'object') {
                        for (const dependency in event.config.dependencies) {
                            const moduleDir = join(__dirname, 'nodemodules', 'node_modules', dependency);
                            try {
                                if (!global.nodemodule.hasOwnProperty(dependency)) {
                                    if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) {
                                        global.nodemodule[dependency] = require(dependency);
                                    } else {
                                        global.nodemodule[dependency] = require(moduleDir);
                                    }
                                }
                            } catch {
                                let loaded = false, lastError;
                                logger.loader(global.getText('shahadat', 'notFoundPackage', dependency, event.config.name), 'warn');

                                const version = event.config.dependencies[dependency];
                                execSync(
                                    'npm --package-lock false --save install ' + dependency + (version == '*' || version == '' ? '' : '@' + version),
                                    { stdio: 'inherit', env: process.env, shell: true, cwd: join(__dirname, 'nodemodules') }
                                );

                                for (let attempt = 1; attempt <= 3; attempt++) {
                                    try {
                                        require.cache = {};
                                        if (global.nodemodule.includes(dependency)) break;
                                        if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) {
                                            global.nodemodule[dependency] = require(dependency);
                                        } else {
                                            global.nodemodule[dependency] = require(moduleDir);
                                        }
                                        loaded = true;
                                        break;
                                    } catch (err) {
                                        lastError = err;
                                    }
                                    if (loaded || !lastError) break;
                                }

                                if (!loaded || lastError) {
                                    throw global.getText('shahadat', 'cantInstallPackage', dependency, event.config.name);
                                }
                            }
                        }
                        logger.loader(global.getText('shahadat', 'loadedPackage', event.config.name));
                    }

                    // envConfig
                    if (event.config.envConfig) {
                        try {
                            for (const envKey in event.config.envConfig) {
                                const name = event.config.name;
                                if (typeof global.configModule[name] == 'undefined') global.configModule[name] = {};
                                if (typeof global.config[name] == 'undefined') global.config[name] = {};

                                if (typeof global.config[name][envKey] !== 'undefined') {
                                    global.configModule[name][envKey] = global.config[name][envKey];
                                } else {
                                    global.configModule[name][envKey] = event.config.envConfig[envKey] || '';
                                }
                                if (typeof global.config[name][envKey] == 'undefined') {
                                    global.config[name][envKey] = event.config.envConfig[envKey] || '';
                                }
                            }
                            logger.loader(global.getText('shahadat', 'loadedConfig', event.config.name));
                        } catch (error) {
                            throw new Error(global.getText('shahadat', 'loadedConfig', event.config.name, JSON.stringify(error)), 'error');
                        }
                    }

                    // onLoad
                    if (event.onLoad) {
                        try {
                            event.onLoad({ api: api, models: models });
                        } catch (error) {
                            throw new Error(global.getText('shahadat', 'cantOnload', event.config.name, JSON.stringify(error)), 'error');
                        }
                    }

                    global.client.events.set(event.config.name, event);
                    logger.loader(global.getText('shahadat', 'successLoadModule', event.config.name));
                } catch (error) {
                    const failName = event && event.config && event.config.name ? event.config.name : file;
                    logger.loader(global.getText('shahadat', 'failLoadModule', failName, error), 'error');
                }
            }
        })();

        console.log(BOT_ART);

        logger.loader(global.getText('shahadat', 'finishLoadModule', global.client.commands.size, global.client.events.size));
        logger.loader('Startup Time: ' + ((Date.now() - global.client.timeStart) / 1000).toFixed() + 's');
        logger.loader('===== [ ' + (Date.now() - global.client.timeStart) + 'ms ] =====');

        writeFileSync(global.client.configPath, JSON.stringify(global.config, null, 4), 'utf8');
        if (existsSync(global.client.configPath + '.temp')) unlinkSync(global.client.configPath + '.temp');

        const listener = require('./includes/listen')({ api: api, models: models, logAnthorName: logAnthorName });

        // প্রতিটি ইভেন্ট এখানে আসে
        function handleListen(error, event) {
            if (error) {
                return logger(
                    global.getText('shahadat', 'handleListenError', logger.redactSecrets(JSON.stringify(error))),
                    'error'
                );
            }

            if (['presence', 'typ', 'read_receipt'].some(type => type == event.type)) return;
            if (global.config.DeveloperMode == true) console.log(event);

            logMessageToConsole(api, event);
            return listener(event);
        }

        if (typeof api.listenMqtt === 'function') {
            try {
                api.listenMqtt(handleListen);
                listenerStarted = true;
                logger('MQTT listener registered - reconnect / re-listen is managed by includes/login/login.js', '[ LISTENER ]');
            } catch (error) {
                logger('Listen error: ' + error.message, '[ ERROR ]');
                return;
            }
        } else {
            logger('api.listenMqtt is unavailable - MQTT listener was not started', '[ ERROR ]');
        }

        try {
            if (typeof checkBan === 'function') await checkBan(api);
        } catch (e) {}

        if (!global.checkBan) {
            logger(global.getText('shahadat', 'warningSourceCode'), '[ GLOBAL BAN ]');
        }
    });
}

// ───────────── এরর হ্যান্ডলিং ও শাটডাউন ─────────────
process.on('uncaughtException', err => {
    logger('Uncaught Exception: ' + logger.redactSecrets(err && err.message ? err.message : err), '[ ERROR ]');
});

process.on('unhandledRejection', reason => {
    logger('Unhandled Rejection: ' + logger.redactSecrets(reason && reason.message ? reason.message : reason), '[ ERROR ]');
});

let isTerminating = false;

async function handleExitSignal(signal) {
    if (isTerminating) return;
    isTerminating = true;

    logger('Received ' + signal + ', shutting down gracefully...', '[ Shutdown ]');
    removePidFile();

    try {
        if (server && server.listening) server.close();
    } catch (e) {}

    stopListenerBestEffort();

    setTimeout(() => {
        process.exit(0);
    }, 1500);
}

function stopListenerBestEffort() {
    try {
        const listener = global.handleListen;
        global.handleListen = null;
        if (!listener) return;

        if (typeof listener.stopListening === 'function') listener.stopListening();
        else if (typeof listener.stop === 'function') listener.stop();
        else if (typeof listener.end === 'function') listener.end();
        else if (typeof listener === 'function') listener();
    } catch (e) {}
}

process.on('SIGINT', () => handleExitSignal('SIGINT'));
process.on('SIGTERM', () => handleExitSignal('SIGTERM'));
process.on('exit', () => {
    stopListenerBestEffort();
    removePidFile();
});

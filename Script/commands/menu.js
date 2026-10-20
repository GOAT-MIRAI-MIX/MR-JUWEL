const fs = require("fs");
const path = require("path");

const COMMANDS_DIR = path.join(__dirname);
const dbPath = path.join(__dirname, "database.json");
const logPath = path.join(__dirname, "log.json");
const backupDir = path.join(__dirname, "backup");

// ================= FONT (ᴀʙᴄᴅ small caps) =================
const SMALL_CAPS = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
  j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
  s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
};

function mono(str) {
  return String(str).replace(/[A-Za-z]/g, (c) => SMALL_CAPS[c.toLowerCase()] || c);
}

// ================= UI HELPERS (compact) =================
const LINE = "━━━━━━━━━━━━";

function header(icon, title) {
  return `${icon} ${mono(title)}\n${LINE}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function cmdList(cmds) {
  return cmds.map((c, i) => `${pad(i + 1)}. ${c}`).join("\n");
}

function footer(text) {
  return `${LINE}\n↩ ${mono(text)}`;
}

// ================= DATABASE =================
function getDB() {
  try {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");
    return JSON.parse(fs.readFileSync(dbPath, "utf8") || "{}");
  } catch (e) {
    return {};
  }
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ================= LOG SYSTEM =================
function logAction(data) {
  let logs = [];
  try {
    if (fs.existsSync(logPath)) logs = JSON.parse(fs.readFileSync(logPath, "utf8") || "[]");
  } catch (e) {
    logs = [];
  }

  logs.push({
    time: new Date().toLocaleString(),
    action: data.action,
    user: data.user,
    thread: data.thread
  });

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

// ================= COMMAND LIST =================
function listCommands() {
  return fs
    .readdirSync(COMMANDS_DIR)
    .filter((f) => f.endsWith(".js") && f !== path.basename(__filename))
    .map((f) => f.replace(/\.js$/, ""));
}

function getUptime() {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  return `${h}h ${m}m`;
}

function isBanned(threadID, threadData) {
  const db = getDB();
  if (db[threadID] && typeof db[threadID].banned !== "undefined") return !!db[threadID].banned;
  return !!(threadData && threadData.banned);
}

function statusLine(banned, count) {
  return `${banned ? "🔴" : "🟢"} ${mono(banned ? "OFF" : "ON")} • ${mono("CMD")} ${count} • ⏱ ${getUptime()}`;
}

// ================= CONFIG =================
module.exports.config = {
  name: "menu",
  version: "5.1.0",
  hasPermssion: 1,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Pro control panel",
  commandCategory: "system",
  usages: "menu",
  cooldowns: 2
};

// ================= MENU UI =================
module.exports.run = async function ({ api, event, Threads }) {
  let data = {};
  try {
    data = (await Threads.getData(event.threadID))?.data || {};
  } catch (e) {}

  const cmds = listCommands();
  const banned = isBanned(event.threadID, data);

  const menu = [
    header("🤖", "Bot Panel"),
    statusLine(banned, cmds.length),
    LINE,
    `1 📊 ${mono("Status")}`,
    `2 🧩 ${mono("Commands")}`,
    `3 🗑️ ${mono("Delete")}`,
    `4 🔴 ${mono("Turn OFF")}`,
    `5 🟢 ${mono("Turn ON")}`,
    `6 ♻️ ${mono("Restart")}`,
    footer("Reply number")
  ].join("\n");

  return api.sendMessage(menu, event.threadID, (err, info) => {
    if (err) return;

    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: event.senderID,
      type: "menu"
    });
  });
};

// ================= HANDLE REPLY =================
module.exports.handleReply = async function ({ api, event, handleReply, Threads }) {
  if (event.senderID !== handleReply.author) return;

  const reply = (msg, cb) => api.sendMessage(msg, event.threadID, cb);

  let data = {};
  try {
    data = (await Threads.getData(event.threadID))?.data || {};
  } catch (e) {}

  // ================= MENU =================
  if (handleReply.type === "menu") {
    const choice = (event.body || "").trim();

    switch (choice) {
      // 📊 STATUS
      case "1": {
        const cmds = listCommands();
        const banned = isBanned(event.threadID, data);
        return reply([header("📊", "Status"), statusLine(banned, cmds.length)].join("\n"));
      }

      // 🧩 COMMAND LIST
      case "2": {
        const cmds = listCommands();
        return reply([header("🧩", `Commands (${cmds.length})`), cmdList(cmds)].join("\n"));
      }

      // 🗑 DELETE COMMAND
      case "3": {
        const cmds = listCommands();

        return reply(
          [header("🗑️", "Delete"), cmdList(cmds), footer("Reply number")].join("\n"),
          (err, info) => {
            if (err) return;
            global.client.handleReply.push({
              name: module.exports.config.name,
              messageID: info.messageID,
              author: event.senderID,
              type: "deletePick",
              cmds
            });
          }
        );
      }

      // 🚫 BAN
      case "4": {
        const db = getDB();
        db[event.threadID] = db[event.threadID] || {};
        db[event.threadID].banned = 1;
        saveDB(db);

        try {
          const t = (await Threads.getData(event.threadID)) || {};
          const d = t.data || {};
          d.banned = 1;
          await Threads.setData(event.threadID, { data: d });
          if (global.data && global.data.threadBanned) global.data.threadBanned.set(event.threadID, 1);
        } catch (e) {}

        logAction({ action: "Bot turned OFF", user: event.senderID, thread: event.threadID });

        return reply(`🔴 ${mono("Bot turned OFF")}`);
      }

      // 🟢 UNBAN
      case "5": {
        const db = getDB();
        db[event.threadID] = db[event.threadID] || {};
        db[event.threadID].banned = 0;
        saveDB(db);

        try {
          const t = (await Threads.getData(event.threadID)) || {};
          const d = t.data || {};
          d.banned = 0;
          await Threads.setData(event.threadID, { data: d });
          if (global.data && global.data.threadBanned) global.data.threadBanned.delete(event.threadID);
        } catch (e) {}

        logAction({ action: "Bot turned ON", user: event.senderID, thread: event.threadID });

        return reply(`🟢 ${mono("Bot turned ON")}`);
      }

      // ♻️ RESTART
      case "6": {
        return reply(`♻️ ${mono("Restarting...")}`, () => {
          setTimeout(() => process.exit(1), 1200);
        });
      }

      default:
        return reply(`❌ ${mono("Invalid option")}`);
    }
  }

  // ================= DELETE PICK =================
  if (handleReply.type === "deletePick") {
    const idx = parseInt(event.body, 10) - 1;
    const list = handleReply.cmds;

    if (isNaN(idx) || idx < 0 || idx >= list.length)
      return api.sendMessage(`❌ ${mono("Invalid number")}`, event.threadID);

    const name = list[idx];

    return api.sendMessage(
      [header("⚠️", "Confirm"), `${name}.js`, footer("yes / no")].join("\n"),
      event.threadID,
      (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          type: "confirmDelete",
          cmdName: name
        });
      }
    );
  }

  // ================= CONFIRM DELETE =================
  if (handleReply.type === "confirmDelete") {
    const ans = (event.body || "").toLowerCase().trim();
    const name = handleReply.cmdName;

    if (!["yes", "y", "no", "n"].includes(ans))
      return api.sendMessage(`👉 ${mono("Type yes or no")}`, event.threadID);

    if (ans.startsWith("n"))
      return api.sendMessage(`❌ ${mono("Cancelled")}`, event.threadID);

    const safeName = path.basename(name, ".js");

    if (safeName === "menu")
      return api.sendMessage(`❌ ${mono("Cannot delete menu")}`, event.threadID);

    const filePath = path.join(COMMANDS_DIR, `${safeName}.js`);

    if (!fs.existsSync(filePath))
      return api.sendMessage(`❌ ${mono("File not found")}:\n${filePath}`, event.threadID);

    try {
      // BACKUP
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      fs.copyFileSync(filePath, path.join(backupDir, `${safeName}.js`));

      // DELETE
      fs.unlinkSync(filePath);

      // VERIFY
      if (fs.existsSync(filePath))
        return api.sendMessage(
          `❌ ${mono("Not deleted (permission problem)")}`,
          event.threadID
        );

      // REMOVE FROM MEMORY
      try {
        delete require.cache[require.resolve(filePath)];
      } catch (_) {}

      try {
        if (global.client && global.client.commands) {
          global.client.commands.delete(safeName);
          for (const [key, cmd] of global.client.commands) {
            if (cmd && cmd.config && cmd.config.name === safeName) global.client.commands.delete(key);
          }
        }
      } catch (_) {}

      logAction({
        action: `Deleted command: ${safeName}.js`,
        user: event.senderID,
        thread: event.threadID
      });

      return api.sendMessage(
        `✅ ${mono("Deleted")} ${safeName}.js • 💾 ${mono("Backup saved")}`,
        event.threadID
      );
    } catch (e) {
      return api.sendMessage(`❌ ${mono("Error")}: ${e.message}`, event.threadID);
    }
  }
};

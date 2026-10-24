module.exports.config = {
  name: "settings",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Bot settings panel",
  commandCategory: "admin",
  usages: "",
  cooldowns: 10
};

const fs = require("fs-extra");
const path = require("path");

const totalPath = path.join(__dirname, "cache", "totalChat.json");
const dataPath = path.join(__dirname, "cache", "data.json");
const _24hours = 86400000;

// ================== CONFIG ==================
const TIMEZONE = "Asia/Dhaka";
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const URLS = {
  profile: (id) => `https://www.facebook.com/${id}`,
  messenger: (id) => `https://m.me/${id}`
};
// ============================================

// 𝗔𝗕𝗖𝗗 (Math Sans Bold) font converter
function bold(text) {
  return String(text).replace(/[A-Za-z0-9]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + code - 65);
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + code - 97);
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + code - 48);
    return c;
  });
}

// Frame builder
function frame(title, lines) {
  const body = lines.map((l) => `┃ ${l}`).join("\n");
  return (
    `╔═══════════════════╗\n` +
    `   ✦ ${bold(title)} ✦\n` +
    `╚═══════════════════╝\n` +
    `${body}\n` +
    `╔═══════════════════╗\n` +
    `   ${CREDIT}\n` +
    `╚═══════════════════╝`
  );
}

// config.json এর ADMINBOT লিস্ট থেকে চেক করে (কোডে কোনো UID নেই)
function isOwner(id) {
  const admins = (global.config && global.config.ADMINBOT) || [];
  return admins.map(String).includes(String(id));
}

function getPing(start) {
  return `📌 ${bold("Ping")}: ${Date.now() - start}ms`;
}

module.exports.onLoad = function () {
  fs.ensureDirSync(path.dirname(dataPath));
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ adminbox: {} }, null, 4));
  } else {
    const data = JSON.parse(fs.readFileSync(dataPath));
    if (!data.hasOwnProperty("adminbox")) data.adminbox = {};
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  const menu = frame("SETTINGS PANEL", [
    `${bold("【 SYSTEM 】")}`,
    `[1] ♻️ ${bold("Reboot BOT")}`,
    `[2] ⚙️ ${bold("Reload Config")}`,
    `[3] 🗂 ${bold("Update Box Data")}`,
    `[4] 👤 ${bold("Update User Data")}`,
    `[5] 🚪 ${bold("Logout Facebook")}`,
    ``,
    `${bold("【 GROUP CONTROL 】")}`,
    `[6] 🔒 ${bold("Admin Only Mode")}`,
    `[7] 🚫 ${bold("Block New Members")}`,
    `[8] 🛡 ${bold("Anti-Robbery Mode")}`,
    `[9] 🔁 ${bold("Antiout Mode")}`,
    `[10] 🧹 ${bold("Kick Facebook Users")}`,
    ``,
    `${bold("【 INFORMATION 】")}`,
    `[11] 🤖 ${bold("Bot Info")}`,
    `[12] 📊 ${bold("Box Info")}`,
    `[13] 👮 ${bold("Group Admins")}`,
    `[14] 👑 ${bold("Bot Admins")}`,
    `[15] 📋 ${bold("Group List")}`,
    ``,
    `👉 ${bold("Reply with a number to choose")}`
  ]);

  return api.sendMessage(menu, threadID, (error, info) => {
    if (error) return;
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: event.senderID,
      type: "choosee"
    });
  }, messageID);
};

module.exports.handleReply = async function ({ event, Users, Threads, api, handleReply }) {
  const { threadID, messageID, senderID } = event;
  if (handleReply.type !== "choosee") return;
  if (handleReply.author && handleReply.author !== senderID) return;

  const choice = String(event.body || "").trim();
  const ownerOnly = ["1", "2", "3", "4", "5"];

  if (ownerOnly.includes(choice) && !isOwner(senderID)) {
    return api.sendMessage(
      frame("ACCESS DENIED", [`⛔ ${bold("Only the bot owner can use this option")}`]),
      threadID,
      messageID
    );
  }

  const needBotAdmin = async () => {
    const info = await api.getThreadInfo(threadID);
    return info.adminIDs.some((i) => i.id == api.getCurrentUserID());
  };

  switch (choice) {
    // ---------- 1: Reboot ----------
    case "1": {
      return api.sendMessage(
        frame("REBOOT", [`✅ ${bold("Restarted successfully")}`]),
        threadID,
        () => process.exit(1)
      );
    }

    // ---------- 2: Reload config ----------
    case "2": {
      delete require.cache[require.resolve(global.client.configPath)];
      global.config = require(global.client.configPath);
      return api.sendMessage(
        frame("CONFIG", [`✅ ${bold("config.json reloaded successfully")}`]),
        threadID,
        messageID
      );
    }

    // ---------- 3: Update box data ----------
    case "3": {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const list = [...inbox].filter((g) => g.isSubscribed && g.isGroup);
      for (const groupInfo of list) {
        const threadInfo = await api.getThreadInfo(groupInfo.threadID);
        await Threads.setData(groupInfo.threadID, { threadInfo });
        console.log(`Updated box data ID: ${groupInfo.threadID}`);
      }
      return api.sendMessage(
        frame("BOX DATA", [`✅ ${bold("Updated")} ${list.length} ${bold("boxes")}`]),
        threadID
      );
    }

    // ---------- 4: Update user data ----------
    case "4": {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const list = [...inbox].filter((g) => g.isSubscribed && g.isGroup);
      let count = 0;
      for (const groupInfo of list) {
        const { participantIDs } =
          (await Threads.getInfo(groupInfo.threadID)) ||
          (await api.getThreadInfo(groupInfo.threadID));
        for (const id of participantIDs) {
          try {
            const data = await api.getUserInfo(id);
            await Users.setData(id, { name: data[id].name, data: {} });
            count++;
          } catch (e) {}
        }
      }
      return api.sendMessage(
        frame("USER DATA", [`✅ ${bold("Updated")} ${count} ${bold("users")}`]),
        threadID
      );
    }

    // ---------- 5: Logout ----------
    case "5": {
      api.sendMessage(
        frame("LOGOUT", [`🚪 ${bold("Logging out of Facebook...")}`]),
        threadID,
        messageID
      );
      return api.logout();
    }

    // ---------- 6: Admin only mode ----------
    case "6": {
      const database = JSON.parse(fs.readFileSync(dataPath));
      const { adminbox } = database;
      let text;
      if (adminbox[threadID] === true) {
        adminbox[threadID] = false;
        text = `🔓 ${bold("Admin-only mode OFF — everyone can use the bot")}`;
      } else {
        adminbox[threadID] = true;
        text = `🔒 ${bold("Admin-only mode ON — only group admins can use the bot")}`;
      }
      fs.writeFileSync(dataPath, JSON.stringify(database, null, 4));
      return api.sendMessage(frame("ADMIN MODE", [text]), threadID, messageID);
    }

    // ---------- 7: Block new members ----------
    case "7": {
      if (!(await needBotAdmin()))
        return api.sendMessage(
          frame("ERROR", [`❌ ${bold("Bot needs group admin permission")}`]),
          threadID,
          messageID
        );
      const data = (await Threads.getData(threadID)).data || {};
      data.newMember = !data.newMember;
      await Threads.setData(threadID, { data });
      global.data.threadData.set(parseInt(threadID), data);
      return api.sendMessage(
        frame("NEW MEMBER", [
          `${data.newMember ? "🚫" : "✅"} ${bold(
            data.newMember ? "Blocking new members: ON" : "Blocking new members: OFF"
          )}`
        ]),
        threadID,
        messageID
      );
    }

    // ---------- 8: Anti-robbery (guard) ----------
    case "8": {
      if (!(await needBotAdmin()))
        return api.sendMessage(
          frame("ERROR", [`❌ ${bold("Bot needs group admin permission")}`]),
          threadID,
          messageID
        );
      const data = (await Threads.getData(threadID)).data || {};
      data.guard = !data.guard;
      await Threads.setData(threadID, { data });
      global.data.threadData.set(parseInt(threadID), data);
      return api.sendMessage(
        frame("ANTI-ROBBERY", [
          `${data.guard ? "🛡" : "⚪"} ${bold(data.guard ? "Guard mode: ON" : "Guard mode: OFF")}`
        ]),
        threadID,
        messageID
      );
    }

    // ---------- 9: Antiout ----------
    case "9": {
      const data = (await Threads.getData(threadID)).data || {};
      data.antiout = !data.antiout;
      await Threads.setData(threadID, { data });
      global.data.threadData.set(parseInt(threadID), data);
      return api.sendMessage(
        frame("ANTIOUT", [
          `${data.antiout ? "🔁" : "⚪"} ${bold(data.antiout ? "Antiout: ON" : "Antiout: OFF")}`
        ]),
        threadID
      );
    }

    // ---------- 10: Kick Facebook users ----------
    case "10": {
      const { userInfo, adminIDs } = await api.getThreadInfo(threadID);
      const targets = userInfo.filter((u) => u.gender == undefined).map((u) => u.id);
      const botIsAdmin = adminIDs.some((a) => a.id == api.getCurrentUserID());

      if (targets.length === 0)
        return api.sendMessage(
          frame("FILTER", [`✅ ${bold("No 'Facebook users' found in this group")}`]),
          threadID
        );

      await api.sendMessage(
        frame("FILTER", [`🔎 ${bold("Found")} ${targets.length} ${bold("'Facebook users'")}`]),
        threadID
      );
      if (!botIsAdmin)
        return api.sendMessage(
          frame("ERROR", [`❌ ${bold("Bot is not an admin, cannot filter")}`]),
          threadID
        );

      let success = 0, fail = 0;
      for (const id of targets) {
        try {
          await new Promise((r) => setTimeout(r, 1000));
          await api.removeUserFromGroup(parseInt(id), threadID);
          success++;
        } catch (e) {
          fail++;
        }
      }
      const lines = [`✅ ${bold("Removed")}: ${success}`];
      if (fail) lines.push(`❌ ${bold("Failed")}: ${fail}`);
      return api.sendMessage(frame("FILTER RESULT", lines), threadID);
    }

    // ---------- 11: Bot info ----------
    case "11": {
      const moment = require("moment-timezone");
      const start = Date.now();
      const now = moment.tz(TIMEZONE);
      const { commands } = global.client;
      const threadSetting = (await Threads.getData(String(threadID))).data || {};
      const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

      const up = process.uptime();
      const h = Math.floor(up / 3600);
      const m = Math.floor((up % 3600) / 60);
      const s = Math.floor(up % 60);

      return api.sendMessage(
        frame("BOT INFO", [
          `⏰ ${bold("Time")}: ${now.format("HH:mm:ss — DD/MM/YYYY")}`,
          `🤖 ${bold("Bot")}: ${global.config.BOTNAME}`,
          `⏱ ${bold("Uptime")}: ${h}h ${m}m ${s}s`,
          `━━━━━━━━━━━━━━`,
          `👨‍👩‍👧‍👦 ${bold("Groups")}: ${global.data.allThreadID.length}`,
          `👥 ${bold("Users")}: ${global.data.allUserID.length}`,
          `👤 ${bold("Admins")}: ${global.config.ADMINBOT.length}`,
          `📝 ${bold("Commands")}: ${commands.size}`,
          `━━━━━━━━━━━━━━`,
          `🌟 ${bold("System Prefix")}: ${global.config.PREFIX}`,
          `🥀 ${bold("Box Prefix")}: ${prefix}`,
          getPing(start)
        ]),
        threadID
      );
    }

    // ---------- 12: Box info ----------
    case "12": {
      const moment = require("moment-timezone");
      const request = require("request");
      const timeNow = moment.tz(TIMEZONE).format("HH:mm:ss");

      if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
      const totalChat = JSON.parse(fs.readFileSync(totalPath));
      const threadInfo = await api.getThreadInfo(threadID);
      const timeByMS = Date.now();

      const threadMem = threadInfo.participantIDs.length;
      let nam = 0, nu = 0;
      for (const z in threadInfo.userInfo) {
        const g = threadInfo.userInfo[z].gender;
        if (g == "MALE") nam++;
        else if (g == "FEMALE") nu++;
      }
      const qtv = threadInfo.adminIDs.length;
      const sl = threadInfo.messageCount;
      const approval = threadInfo.approvalMode === true ? "ON" : threadInfo.approvalMode === false ? "OFF" : "N/A";

      if (!totalChat[threadID]) {
        totalChat[threadID] = { time: timeByMS, count: sl, ytd: 0 };
        fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
      }

      let mdtt = "No stats yet";
      const preCount = totalChat[threadID].count || 0;
      const ytd = totalChat[threadID].ytd || 0;
      const hnay = ytd != 0 ? sl - preCount : "No stats yet";
      const hqua = ytd != 0 ? ytd : "No stats yet";

      if (timeByMS - totalChat[threadID].time > _24hours) {
        if (timeByMS - totalChat[threadID].time > _24hours * 2) {
          totalChat[threadID].count = sl;
          totalChat[threadID].time = timeByMS - _24hours;
          totalChat[threadID].ytd = sl - preCount;
          fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
        }
        const getHour = Math.ceil((timeByMS - totalChat[threadID].time - _24hours) / 3600000);
        mdtt = ytd == 0 ? "100%" : ((hnay / ((hqua / 24) * getHour)) * 100).toFixed(0) + "%";
      }

      const body = frame("BOX INFO", [
        `📛 ${bold("Name")}: ${threadInfo.threadName}`,
        `🆔 ${bold("ID")}: ${threadInfo.threadID}`,
        `🔗 ${bold("Link")}: https://m.me/${threadInfo.threadID}`,
        `✅ ${bold("Approval")}: ${approval}`,
        `😀 ${bold("Emoji")}: ${threadInfo.emoji || "—"}`,
        `━━━━━━━━━━━━━━`,
        `👥 ${bold("Members")}: ${threadMem}`,
        `👨 ${bold("Male")}: ${nam}   👩 ${bold("Female")}: ${nu}`,
        `🕵️ ${bold("Admins")}: ${qtv}`,
        `💬 ${bold("Messages")}: ${sl}`,
        `📈 ${bold("Activity")}: ${mdtt}`,
        `🌟 ${bold("Yesterday")}: ${hqua}`,
        `🌟 ${bold("Today")}: ${hnay}`,
        `🕒 ${timeNow}`
      ]);

      const imgPath = path.join(__dirname, "cache", "box.png");
      if (!threadInfo.imageSrc) return api.sendMessage(body, threadID);

      return request(encodeURI(threadInfo.imageSrc))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () =>
          api.sendMessage(
            { body, attachment: fs.createReadStream(imgPath) },
            threadID,
            () => fs.unlinkSync(imgPath)
          )
        );
    }

    // ---------- 13: Group admins ----------
    case "13": {
      const threadInfo = await api.getThreadInfo(threadID);
      const lines = [];
      let i = 1;
      for (const ad of threadInfo.adminIDs) {
        const info = await api.getUserInfo(ad.id);
        lines.push(`${i++}. ${info[ad.id].name}`);
        lines.push(`   🔗 ${URLS.profile(ad.id)}`);
      }
      return api.sendMessage(
        frame(`GROUP ADMINS (${threadInfo.adminIDs.length})`, lines),
        threadID,
        messageID
      );
    }

    // ---------- 14: Bot admins ----------
    case "14": {
      const listAdmin = global.config.ADMINBOT || [];
      const lines = [];
      for (const id of listAdmin) {
        if (!parseInt(id)) continue;
        const name = (await Users.getData(id)).name;
        lines.push(`👑 ${name}`);
        lines.push(`   🔗 ${URLS.profile(id)}`);
        lines.push(`   💬 ${URLS.messenger(id)}`);
      }
      return api.sendMessage(frame("BOT ADMINS", lines), threadID, messageID);
    }

    // ---------- 15: Group list ----------
    case "15": {
      const inbox = await api.getThreadList(300, null, ["INBOX"]);
      const list = [...inbox].filter((g) => g.isSubscribed && g.isGroup);
      const lines = [];
      let i = 0;
      for (const g of list) {
        lines.push(`${++i}. ${g.name}`);
        lines.push(`   🆔 ${g.threadID}`);
        lines.push(`   🔗 https://m.me/${g.threadID}`);
      }
      return api.sendMessage(frame(`GROUP LIST (${list.length})`, lines), threadID);
    }

    default:
      return;
  }
};

module.exports.handleEvent = async ({ api, event }) => {
  if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
  const totalChat = JSON.parse(fs.readFileSync(totalPath));
  if (!totalChat[event.threadID]) return;
  if (Date.now() - totalChat[event.threadID].time > _24hours * 2) {
    const sl = (await api.getThreadInfo(event.threadID)).messageCount;
    totalChat[event.threadID] = {
      time: Date.now() - _24hours,
      count: sl,
      ytd: sl - totalChat[event.threadID].count
    };
    fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
  }
};

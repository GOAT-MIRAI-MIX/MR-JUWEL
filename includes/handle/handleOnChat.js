const { buildMessage, buildUsersData, buildThreadsData } = require("../compat/goatApi");

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const { commands } = global.client;
  return function ({ event }) {
    if (!event.body) return;
    const senderID = String(event.senderID);
    const threadID = String(event.threadID);
    const { userBanned, threadBanned } = global.data;
    const { allowInbox } = global.config;
    if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox == false && senderID == threadID)) return;

    for (const [, command] of commands) {
      if (typeof command.onChat !== "function") continue;
      try {
        const message = buildMessage(api, event);
        const usersData = buildUsersData(Users, Currencies);
        const threadsData = buildThreadsData(Threads);
        command.onChat({
          api, event, message, usersData, threadsData,
          globalData: global.data, models, Users, Threads, Currencies,
          args: (event.body || "").trim().split(/ +/)
        });
      } catch (error) {
        try { require("../../utils/log.js")(global.getText("handleCommand", "commandError", command.config && command.config.name, error), "error"); }
        catch (e2) { console.log(error); }
      }
    }
  };
};

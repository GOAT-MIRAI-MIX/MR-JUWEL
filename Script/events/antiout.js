module.exports.config = {
  name: "antiout",
  eventType: ["log:unsubscribe"],
  version: "2.1.0",
  credits: "𝐌𝐑 𝐉𝐔𝐖𝐄𝐋",
  description: "Anti leave funny limit system"
};

const leaveData = {};

function frame(msg) {
  return `
   ╔══════════════════╗   
   ☢️ ANTI OUT SYSTEM⚠️   
   ╠══════════════════╣   
   ${msg}   
   ╚══════════════════╝`;
}

module.exports.run = async function ({ event, api, Threads, Users }) {
  try {
    const { threadID } = event;
    const leftID = event.logMessageData.leftParticipantFbId;

    let data = (await Threads.getData(threadID)).data || {};
    if (data.antiout === false) return;

    if (leftID == api.getCurrentUserID()) return;

    let name =
      global.data.userName.get(String(leftID)) ||
      await Users.getNameUser(leftID.toString());

    if (event.author != leftID) return;

    if (!leaveData[leftID]) {
      leaveData[leftID] = {
        count: 0,
        time: Date.now()
      };
    }

    let user = leaveData[leftID];

    if (Date.now() - user.time > 60 * 60 * 1000) {
      user.count = 0;
      user.time = Date.now();
    }

    user.count++;

    // ❌ 3rd time - permanent ban
    if (user.count >= 3) {

      let msg = frame(`
😆 ${name}!! ৩ বার লিভ দিলি তুই!
🚫 এই গুপে তোর আর ঢুকতে দেওয়া হবে না!🛑
😎 যা যা... সলো লাইফ এনজয় কর!✌️`);

      api.sendMessage(msg, threadID);

      try {
        const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
        let threadInfo = await Threads.getInfo(threadID);
        let threadName = threadInfo.threadName || "Unknown Group";

        let adminMsg = `
🚨 PERMANENT BAN 🚨
👤 ${name} | UID: ${leftID}
📊 Left: ${user.count}/3 | Group: ${threadName}`;

        const adminUIDs = ["61567576882007", "100071528325738"];

        for (let admin of adminUIDs) {
          api.sendMessage(adminMsg, admin);
        }

      } catch (e) {
        console.log("Forward Error:", e);
      }

      return;
    }

    // ✅ 1st and 2nd time - re-add
    api.addUserToGroup(leftID, threadID, async (err) => {
      if (err) {

        let msg = frame(`
😱 ${name}!! তোকে এড করতে পারলাম না!
🔒 বট ব্লক নাকি প্রাইভেসি? 🤔`);

        api.sendMessage(msg, threadID);

        try {
          const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
          let threadInfo = await Threads.getInfo(threadID);
          let threadName = threadInfo.threadName || "Unknown Group";

          let adminMsg = `
🚨 FAILED TO RE-ADD 🚨
👤 ${name} | UID: ${leftID}
🏷️ ${threadName} | 🕒 ${time}`;

          const adminUIDs = ["61591646430352", "61591542717221"];

          for (let admin of adminUIDs) {
            api.sendMessage(adminMsg, admin);
          }

        } catch (e) {
          console.log("Forward Error:", e);
        }

        return;
      }

      // 🎯 Short funny captions
      let msg;
      if (user.count === 1) {
        msg = frame(`
😏 ${name}!! পালানোর চেষ্টা করছিস?
🔄 আবার গুপে এড করা হলো! 🤖
⚠️ আর ২ বার বাকি... সাবধান!`);

      } else if (user.count === 2) {
        msg = frame(`
😆 ${name}!! আবার পালালি?
🔄 আবার গুপে এড করা হলো! 🤖
💀 শেষবার... আর ১ বার বাকি!`);
      }

      api.sendMessage(msg, threadID);

      try {
        const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
        let threadInfo = await Threads.getInfo(threadID);
        let threadName = threadInfo.threadName || "Unknown Group";

        let adminMsg = `
✅ RE-ADDED SUCCESSFULLY
👤 ${name} | UID: ${leftID}
📊 Count: ${user.count}/3 | Group: ${threadName}`;

        const adminUIDs = ["61567576882007", "100071528325738"];

        for (let admin of adminUIDs) {
          api.sendMessage(adminMsg, admin);
        }

      } catch (e) {
        console.log("Forward Error:", e);
      }

    });

  } catch (e) {
    console.log("AntiOut Error:", e);
  }
};

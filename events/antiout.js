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

// 🔧 হেল্পার ফাংশন - গ্রুপের নাম পাওয়া
async function getGroupName(threadID, api) {
  try {
    const info = await api.getThreadInfo(threadID);
    return info.threadName || "Unknown Group";
  } catch (e) {
    return "Unknown Group";
  }
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

    // ❌ limit reached
    if (user.count >= 3) {

      // 📨 ইনবক্স নোটিফিকেশন (লিমিট ক্রস)
      const inboxMsg = `
🔴 গুরুত্বপূর্ণ নোটিফিকেশন!

আপনি "${await getGroupName(threadID, api)}" গ্রুপ থেকে 
১ ঘন্টায় ৩ বার লিভ নিয়েছেন! 😱

🚫 বিধি অনুযায়ী আপনাকে আর গ্রুপে এড করা হবে না।
📌 যোগাযোগ: গ্রুপ অ্যাডমিনের সাথে কথা বলুন।

ধন্যবাদ। 🙏`;

      api.sendMessage(inboxMsg, leftID);

      let msg = frame(`
😂 আরে ${name}!!

🆔 UID: ${leftID}

😴 তুই কি লিভ দেওয়ার কম্পিটিশন করতেছোস নাকি? 🏆
১ ঘন্টায় ৩ বার লিভ = Disqualified!

🚫 তোকে আর গুপে এড করলাম না তুই 🐸
এই গুপে থাকার যোগ্য না🥵💦!
🥵 বিদায় লুচ্চা 🫂🫦

📨 ইনবক্সে নোটিফিকেশন পাঠানো হয়েছে!`);

      api.sendMessage(msg, threadID);

      // ✅ ADMIN FORWARD
      try {
        const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
        let threadInfo = await Threads.getInfo(threadID);
        let threadName = threadInfo.threadName || "Unknown Group";

        let adminMsg = `
🚨 ANTI OUT ALERT 🚨

👤 Name: ${name}
🆔 UID: ${leftID}

🏷️ Group: ${threadName}
🕒 Time: ${time}

⚠️ User reached leave limit!
📨 Inbox notification sent!
`;

        const adminUIDs = ["61593603338850", "100071528325738"];

        for (let admin of adminUIDs) {
          api.sendMessage(adminMsg, admin);
        }

      } catch (e) {
        console.log("Forward Error:", e);
      }

      return;
    }

    // 🔄 রি-এড করার চেষ্টা
    api.addUserToGroup(leftID, threadID, async (err) => {
      if (err) {

        // 📨 ইনবক্স নোটিফিকেশন (এড করতে ব্যর্থ)
        const inboxMsg = `
⚠️ নোটিফিকেশন!

আপনি "${await getGroupName(threadID, api)}" গ্রুপ থেকে লিভ নিয়েছেন।

😵 কিন্তু আপনাকে আবার গ্রুপে এড করা সম্ভব হয়নি!
কারণ:
• বটকে ব্লক করেছেন? 🚫
• প্রাইভেসি সেটিংস টাইট? 🔒
• অথবা অন্য কোনো সমস্যা?

📩 সাহায্যের জন্য: 61593603338850
`;

        api.sendMessage(inboxMsg, leftID);

        let msg = frame(`
😆 ${name} এরে এড করতে গেলাম ও'মা😴

🆔 UID: ${leftID}

সে তো ভয় পাইছে 😵
🤖 Bot ব্লক করছে 📵
বা privacy tight করে রাখছে

📩 রিপোর্ট আইডি: 61593603338850
📨 ইনবক্সে নোটিফিকেশন পাঠানো হয়েছে!`);

        api.sendMessage(msg, threadID);

        // ✅ ADMIN FORWARD
        try {
          const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
          let threadInfo = await Threads.getInfo(threadID);
          let threadName = threadInfo.threadName || "Unknown Group";

          let adminMsg = `
🚨 ANTI OUT ALERT 🚨

👤 Name: ${name}
🆔 UID: ${leftID}

🏷️ Group: ${threadName}
🕒 Time: ${time}

⚠️ Failed to re-add user!
📨 Inbox notification sent!
`;

          const adminUIDs = ["61593603338850", "100071528325738"];

          for (let admin of adminUIDs) {
            api.sendMessage(adminMsg, admin);
          }

        } catch (e) {
          console.log("Forward Error:", e);
        }

        return;
      }

      // ✅ সফলভাবে রি-এড হয়েছে

      // 📨 ইনবক্স নোটিফিকেশন (সফল রি-এড)
      const inboxMsg = `
🟢 নোটিফিকেশন!

আপনি "${await getGroupName(threadID, api)}" গ্রুপ থেকে লিভ নিয়েছিলেন।

🔄 কিন্তু বট আবার আপনাকে গ্রুপে এড করে দিয়েছে! (${user.count}/৩ বার)

😅 এটা কোনো সাধারণ গ্রুপ নয়! এখান থেকে লিভ নিতে 
অ্যাডমিনের অনুমতি লাগবে! 🛡️

🙏 দয়া করে গ্রুপে থাকুন এবং মজা করুন! 🎉
`;

      api.sendMessage(inboxMsg, leftID);

      let msg = frame(`
😏 ওহ ${name} আবার পালাইছোস?

🆔 UID: ${leftID}

😂 (${user.count}/3) বার ধরা পড়ছোস 🔁
তোকে আবার টেনে আনা হইলো

😒🤌 এটা কোনো সাধারণ গ্রুপ নয় লা👻 এ হলো
গ্যাংস্টারদের গুপ লা😝এখান থেকে লিভ নিতে হলে
এডমিন পারমিশন লাগবে লা🤧😂

📨 ইনবক্সে নোটিফিকেশন পাঠানো হয়েছে!`);

      api.sendMessage(msg, threadID);

      // ✅ ADMIN FORWARD
      try {
        const time = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
        let threadInfo = await Threads.getInfo(threadID);
        let threadName = threadInfo.threadName || "Unknown Group";

        let adminMsg = `
🚨 ANTI OUT ALERT 🚨

👤 Name: ${name}
🆔 UID: ${leftID}

🏷️ Group: ${threadName}
🕒 Time: ${time}

✅ User re-added successfully!
📨 Inbox notification sent!
`;

        const adminUIDs = ["61593603338850", "100071528325738"];

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

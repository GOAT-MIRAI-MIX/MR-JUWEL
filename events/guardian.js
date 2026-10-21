module.exports.config = {
  name: "guardian",
  eventType: ["log:thread-admins", "log:unsubscribe", "log:thread-name"],
  version: "4.0.0",
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Owner Protection System"
};

const OWNER_UID = "61593603338850";
const BOT_ADMIN_UID = "61591646430352";

module.exports.run = async function ({ api, event }) {
  try {
    const threadID = event.threadID;

    const getUserName = async (uid) => {
      try {
        const userInfo = await api.getUserInfo(uid);
        return userInfo[uid]?.name || "Unknown User";
      } catch {
        return "Unknown User";
      }
    };

    // ==========================
    // OWNER ADMIN REMOVE
    // ==========================
    if (event.logMessageType === "log:thread-admins") {
      console.log("Admin Event:", JSON.stringify(event, null, 2));
      
      const targetID = event.logMessageData?.TARGET_ID || event.logMessageData?.target_id;
      const actorID = event.author;
      
      const isAdminRemove = event.logMessageData?.ADMIN_EVENT === "remove_admin" || 
                           event.logMessageData?.admin_event === "remove_admin" ||
                           (event.logMessageData?.type === "remove_admin");

      if (targetID == OWNER_UID && isAdminRemove) {
        const name = await getUserName(actorID);
        await api.changeAdminStatus(threadID, OWNER_UID, true).catch(() => {});

        const groupWarn =
`╔══════════════════════╗
║      🛡️ OWNER GUARDIAN
╚══════════════════════╝

⚠️ বিশ্বাসঘাতকতা শনাক্ত করা হয়েছে

👤 নাম : ${name}
🆔 UID : ${actorID}

💔 জুয়েল বস তোমাকে বিশ্বাস করে
এই গ্রুপের Admin বানিয়েছিল।

কিন্তু তুমি সেই বিশ্বাস ভেঙে
তাকে Admin থেকে Remove করেছো।

👑 জুয়েল বসকে আবার Admin
করে দেওয়া হয়েছে।

❌ বেইমানির শাস্তি হিসেবে
তোমাকে Remove করা হচ্ছে...

━━━━━━━━━━━━━━━━━━
⚖️ OWNER PROTECTION SYSTEM
🛡️ GUARDIAN SECURITY ACTIVE
━━━━━━━━━━━━━━━━━━`;

        await api.sendMessage(groupWarn, threadID);

        const report =
`🛡️ GUARDIAN SECURITY REPORT

📢 OWNER ATTACK DETECTED

👤 Offender : ${name}
🆔 UID : ${actorID}

📍 Thread ID : ${threadID}

⚠️ Action : Owner Admin Remove

✅ Owner Re-Admin Success

⏳ Punishment Started`;

        await api.sendMessage(report, BOT_ADMIN_UID).catch(() => {});

        setTimeout(async () => {
          await api.removeUserFromGroup(actorID, threadID).catch(() => {});
        }, 2000);
      }
    }

    // ==========================
    // OWNER KICK OR LEAVE - UPDATED
    // ==========================
    if (event.logMessageType === "log:unsubscribe") {
      const leftID = event.logMessageData?.leftParticipantFbId || event.logMessageData?.participant_id;
      const actorID = event.author;

      // 🔥 NEW: চেক করুন Owner নিজে লিভ নিয়েছে কিনা
      const isOwnerSelfLeave = (leftID == OWNER_UID && actorID == OWNER_UID);
      
      // 🔥 NEW: চেক করুন অন্য কেউ Owner কে কিক করেছে কিনা
      const isOwnerKicked = (leftID == OWNER_UID && actorID != OWNER_UID);

      if (isOwnerSelfLeave) {
        // 🟢 Owner নিজে লিভ নিলে - শুধু নোটিফিকেশন
        console.log(`⚠️ Owner নিজে লিভ নিয়েছে: ${threadID}`);
        
        await api.addUserToGroup(OWNER_UID, threadID).catch(() => {});
        setTimeout(async () => {
          await api.changeAdminStatus(threadID, OWNER_UID, true).catch(() => {});
        }, 1500);

        const selfLeaveMsg =
`╔══════════════════════╗
║      🛡️ OWNER GUARDIAN
╚══════════════════════╝

👑 জুয়েল বস নিজে গ্রুপ ছেড়েছেন!

🔄 কিন্তু বটের নিরাপত্তা ব্যবস্থা
তাকে পুনরায় গ্রুপে যোগ দিয়েছে।

✅ তাকে আবার Admin করা হয়েছে।

💡 মনে রাখবেন: Owner ছাড়া
এই গ্রুপ চলতে পারে না!

━━━━━━━━━━━━━━━━━━
⚖️ OWNER PROTECTION SYSTEM
🛡️ GUARDIAN SECURITY ACTIVE
━━━━━━━━━━━━━━━━━━`;

        await api.sendMessage(selfLeaveMsg, threadID);

        await api.sendMessage(
          `👑 Owner নিজে লিভ নিয়েছে!\n📍 Thread: ${threadID}\n✅ পুনরায় যোগ করেছি`,
          BOT_ADMIN_UID
        ).catch(() => {});

      } else if (isOwnerKicked) {
        // 🔴 কেউ Owner কে কিক করলে - পুরোনো সিস্টেম
        const name = await getUserName(actorID);

        await api.addUserToGroup(OWNER_UID, threadID).catch(() => {});
        setTimeout(async () => {
          await api.changeAdminStatus(threadID, OWNER_UID, true).catch(() => {});
        }, 1500);

        const groupWarn =
`╔══════════════════════╗
║      🛡️ OWNER GUARDIAN
╚══════════════════════╝

⚠️ বিশ্বাসঘাতকতা শনাক্ত করা হয়েছে

👤 নাম : ${name}
🆔 UID : ${actorID}

💔 জুয়েল বস তোমাকে বিশ্বাস করে
এই গ্রুপের Admin বানিয়েছিল।

কিন্তু তুমি সেই বিশ্বাস ভেঙে
তাকে গ্রুপ থেকে Kick করেছো।

👑 জুয়েল বসকে পুনরায় Add
করা হয়েছে।

🔰 তাকে আবার Admin
করে দেওয়া হয়েছে।

❌ বেইমানির শাস্তি হিসেবে
তোমাকে Group থেকে Remove
করা হচ্ছে...

━━━━━━━━━━━━━━━━━━
⚖️ OWNER PROTECTION SYSTEM
🛡️ GUARDIAN SECURITY ACTIVE
━━━━━━━━━━━━━━━━━━`;

        await api.sendMessage(groupWarn, threadID);

        const report =
`🛡️ GUARDIAN SECURITY REPORT

📢 OWNER ATTACK DETECTED

👤 Offender : ${name}
🆔 UID : ${actorID}

📍 Thread ID : ${threadID}

⚠️ Action : Owner Kick

✅ Owner Re-Added
✅ Owner Re-Admin

⏳ Punishment Started`;

        await api.sendMessage(report, BOT_ADMIN_UID).catch(() => {});

        setTimeout(async () => {
          await api.removeUserFromGroup(actorID, threadID).catch(() => {});
        }, 2000);
      }
    }

  } catch (e) {
    console.log("GUARDIAN ERROR:", e);
  }
};

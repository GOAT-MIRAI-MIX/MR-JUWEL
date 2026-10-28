module.exports.config = {
  name: "supportgc",
  aliases: ["sgc"],
  version: "1.8",
  hasPermssion: 0,
  credits: "Loid Butter",
  description: "Add user to admin support group",
  commandCategory: "support",
  usages: "supportgc",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const supportGroupId = "737267832805258"; // 🔒 Support Group Thread ID
  const adminUID = "737267832805258"; // 🔒 Admin UID
  const userID = event.senderID;
  const commandThreadID = event.threadID;

  try {
    // 🔹 User Info
    const userInfo = await api.getUserInfo(userID);
    const userName = userInfo[userID].name || "Unknown User";

    // 🔹 Support group info
    const threadInfo = await api.getThreadInfo(supportGroupId);
    const participantIDs = threadInfo.participantIDs || [];

    // 🔹 Already member
    if (participantIDs.includes(userID)) {
      return api.sendMessage(
        `📌 𝐀ᴅᴍɪɴ Sᴜᴘᴘᴏʀᴛ Gʀᴏᴜᴘ\n\n🤖 ${userName}, তুমি আগেই Support Group এ আছো।\n📩 Message request / spam চেক করো।`,
        commandThreadID
      );
    }

    // 🔹 Add user to support group
    api.addUserToGroup(userID, supportGroupId, async (err) => {
      if (err) {
        return api.sendMessage(
          `📌 𝐀ᴅᴍɪɴ Sᴜᴘᴘᴏʀᴛ Gʀᴏᴜᴘ\n\n⚠️ ${userName} কে যোগ করা যায়নি!\n❗ Account private বা message request off থাকতে পারে।`,
          commandThreadID
        );
      }

      // 🔹 Success message (command group)
      api.sendMessage(
        `✅ ${userName} (ID: ${userID}) কে সফলভাবে Support Group এ যোগ করা হয়েছে।`,
        commandThreadID
      );

      // 🔹 Notification message
      const notifyMsg =
        `📌 𝐀ᴅᴍɪɴ Sᴜᴘᴘᴏʀᴛ Gʀᴏᴜᴘ\n\n` +
        `👤 New User Joined\n` +
        `🔹 Name: ${userName}\n` +
        `🔹 UID: ${userID}\n\n` +
        `✅ Admins, দয়া করে user যাচাই করুন।`;

      // 🔹 Send to support group
      api.sendMessage(notifyMsg, supportGroupId);

      // 🔹 Send to admin inbox
      api.sendMessage(notifyMsg, adminUID);
    });

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ কিছু একটা সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।", commandThreadID);
  }
};

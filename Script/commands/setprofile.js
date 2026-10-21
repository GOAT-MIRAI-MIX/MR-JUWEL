module.exports.config = {
  name: "setprofile",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "rX Abdullah",
  description: "Reply to a photo to set it as bot's profile picture",
  commandCategory: "Admin",
  usages: "[reply to image]",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  try {
    // Check if reply message exists
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
      return api.sendMessage("⚠️ দয়া করে একটি ছবিতে রিপ্লাই করে এই কমান্ড দিন!", event.threadID, event.messageID);

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "photo")
      return api.sendMessage("⚠️ দয়া করে শুধুমাত্র ছবিতে রিপ্লাই করুন!", event.threadID, event.messageID);

    const imageUrl = attachment.url;

    // Inform user
    api.sendMessage("⏳ প্রোফাইল ছবি সেট করা হচ্ছে...", event.threadID, event.messageID);

    // Use FCA's built-in function
    api.changeAvatarV2(imageUrl, "Updated by rX Bot 🤖", (err, res) => {
      if (err) {
        console.error(err);
        return api.sendMessage("❌ প্রোফাইল ছবি পরিবর্তন ব্যর্থ হয়েছে!", event.threadID, event.messageID);
      }
      api.sendMessage("✅ সফলভাবে প্রোফাইল ছবি আপডেট হয়েছে!", event.threadID, event.messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ কোনো একটি সমস্যা ঘটেছে!", event.threadID, event.messageID);
  }
};

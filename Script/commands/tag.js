module.exports.config = {
 name: "tag",
 version: "1.0.0",
 hasPermssion: 2,
 credits: "Shahadat Islam",
 description: "Group এ সবাইকে নির্দিষ্ট সংখ্যায় মেনশন পাঠানো",
 commandCategory: "group",
 usages: "/tag [everyone]",
 cooldowns: 2
};

module.exports.run = async ({ api, event, args }) => {
 const threadID = event.threadID;
 const threadInfo = await api.getThreadInfo(threadID);
 const memberIDs = threadInfo.participantIDs;

 const repeatCount = parseInt(args[0]) || 1;

 const mentions = memberIDs
 .filter(id => id != api.getCurrentUserID())
 .map(id => ({ tag: "@everyone", id }));

 for (let i = 0; i < repeatCount; i++) {
 await api.sendMessage({
 body: `📢 @everyone\nসবাই চিপা থেকে বের হও 🐸`,
 mentions
 }, threadID);

 await new Promise(resolve => setTimeout(resolve, 2000)); 
 }
};
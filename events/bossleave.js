module.exports.config = {
    name: "bossleave",
    eventType: ["log:unsubscribe", "log:subscribe"],
    version: "5.0.0",
    credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
    description: "বস কিক হলে বট গ্রুপ ছাড়বে (পুনরায় এড করলে বাতিল)"
};

module.exports.run = async function ({ api, event, Users }) {
    try {
        const { threadID, logMessageData, logMessageType } = event;
        
        if (!logMessageData) return;
        
        const OWNER_ID = "61593603338850";
        
        // ============= বসকে এড করার ইভেন্ট =============
        if (logMessageType === "log:subscribe") {
            const addedIDs = logMessageData.addedParticipantIds || [];
            
            // চেক করা হচ্ছে বসকে এড করা হয়েছে কিনা
            if (addedIDs.includes(OWNER_ID)) {
                // বসকে এড করা হয়েছে
                const bossName = await Users.getNameUser(OWNER_ID).catch(() => "আমার বস");
                const adderID = logMessageData.author;
                const adderName = await Users.getNameUser(adderID).catch(() => "কেউ");
                
                // বসকে এড করার মেসেজ
                const addMsg = `
╔══════════════════════════╗
║        ✅ 𝐁𝐎𝐒𝐒 𝐀𝐃𝐃𝐄𝐃 ║
╚══════════════════════════╝

👑 বস: ${bossName}
🆔 ইউআইডি: ${OWNER_ID}

━━━━━━━━━━━━━━━━━━

➕ এড করেছেন: ${adderName}
🆔 ইউআইডি: ${adderID}

━━━━━━━━━━━━━━━━━━

😊 বস ফিরে এসেছেন!
🤖 আমি গ্রুপে থাকছি।

━━━━━━━━━━━━━━━━━━
`;
                await api.sendMessage(addMsg, threadID);
                
                // বটের লিভ প্রক্রিয়া বাতিল করার জন্য গ্লোবাল ভেরিয়েবল
                global.bossReAdded = true;
                global.bossAddThread = threadID;
            }
            return;
        }
        
        // ============= বস কিক বা লিভ হওয়ার ইভেন্ট =============
        if (logMessageType === "log:unsubscribe") {
            const leftID = logMessageData.leftParticipantFbId;
            const authorID = logMessageData.author;
            
            // বস না হলে কিছু করবে না
            if (leftID !== OWNER_ID) return;
            
            // ====== বস নিজে লিভ নিলে ======
            if (authorID === OWNER_ID) {
                const bossName = await Users.getNameUser(OWNER_ID).catch(() => "আমার বস");
                const threadInfo = await api.getThreadInfo(threadID).catch(() => null);
                const threadName = threadInfo?.threadName || "অজানা গ্রুপ";
                
                const leaveMsg = `
╔══════════════════════════╗
║        💔 𝐁𝐎𝐒𝐒 𝐋𝐄𝐅𝐓 ║
╚══════════════════════════╝

👑 বস: ${bossName}
🆔 ইউআইডি: ${OWNER_ID}

━━━━━━━━━━━━━━━━━━

🏠 গ্রুপ: ${threadName}

😢 আমার বস নিজেই গ্রুপ ছেড়ে চলে গেছেন...

💔 তিনি হয়তো বিরক্ত হয়েছেন
😿 অথবা এই গুপের কেউ অপমান 
😡 করছে তাই বস লিভ নিছে😭😓
━━━━━━━━━━━━━━━━━━

🤖 আমি কিন্তু এখনও এই গ্রুপে আছি...
যদি বস ফিরে আসতে চান, আমি আছি!

💝 আমি বসকে মিস করবো... 😢

━━━━━━━━━━━━━━━━━━
`;
                
                await api.sendMessage(leaveMsg, threadID);
                return; // বট লিভ নেবে না
            }
            
            // ====== বসকে কিক করলে ======
            if (authorID === api.getCurrentUserID()) return; // বট নিজে কিক করলে
            
            // গ্লোবাল ভেরিয়েবল রিসেট
            global.bossReAdded = false;
            global.bossAddThread = threadID;
            
            const [ownerName, kickerName, threadInfo] = await Promise.all([
                Users.getNameUser(OWNER_ID).catch(() => "আমার বস"),
                Users.getNameUser(authorID).catch(() => "অজানা"),
                api.getThreadInfo(threadID).catch(() => null)
            ]);
            
            const threadName = threadInfo?.threadName || "অজানা গ্রুপ";
            
            const mainMsg = `
╔══════════════════════════╗
║        ⚠️ 𝐁𝐎𝐒𝐒 𝐀𝐋𝐄𝐑𝐓 ⚠️
╚══════════════════════════╝

👑 বস: ${ownerName}
🆔 ইউআইডি: ${OWNER_ID}

━━━━━━━━━━━━━━━━━━

🏠 গ্রুপ: ${threadName}

⚠️ কিক করেছে: ${kickerName}
🆔 ইউআইডি: ${authorID}

━━━━━━━━━━━━━━━━━━

💔 আমার বসকে এই গ্রুপ থেকে অপমান করে বের করা হয়েছে।
😾 বস যেখানে সম্মান পায় না, সেখানে আমার থাকার কোনো মানে হয় না।

🤖 আমি ১০ সেকেন্ডের মধ্যে গ্রুপ ছাড়ছি...
⚠️ যদি বসকে আবার এড করা হয়, আমি থাকব!

━━━━━━━━━━━━━━━━━━
`;
            
            await api.sendMessage(mainMsg, threadID);
            
            // ১০ সেকেন্ড কাউন্টডাউন
            let shouldLeave = true;
            
            for (let i = 10; i > 0; i--) {
                // চেক করা হচ্ছে বসকে এড করা হয়েছে কিনা (গ্লোবাল ভেরিয়েবল থেকে)
                if (global.bossReAdded === true && global.bossAddThread === threadID) {
                    shouldLeave = false;
                    await api.sendMessage(
                        `✅ বসকে আবার গ্রুপে এড করা হয়েছে! আমি থাকছি। 😊`,
                        threadID
                    );
                    return; // লিভ প্রক্রিয়া বন্ধ
                }
                
                await api.sendMessage(`⏳ ${i} সেকেন্ড বাকি...`, threadID);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // শেষবার চেক করা (গ্লোবাল ভেরিয়েবল থেকে)
            if (global.bossReAdded === true && global.bossAddThread === threadID) {
                await api.sendMessage(
                    `✅ বসকে আবার গ্রুপে এড করা হয়েছে! আমি থাকছি। 😊`,
                    threadID
                );
                return;
            }
            
            // বস এখন গ্রুপে আছে কিনা ডাইরেক্ট চেক
            try {
                const currentThreadInfo = await api.getThreadInfo(threadID);
                const isBossInGroup = currentThreadInfo.participantIDs?.includes(OWNER_ID);
                
                if (isBossInGroup) {
                    await api.sendMessage(
                        `✅ বস ইতিমধ্যেই গ্রুপে ফিরে এসেছেন! আমি থাকছি। 😊`,
                        threadID
                    );
                    return;
                }
            } catch (err) {
                console.log("গ্রুপ তথ্য চেক করতে সমস্যা:", err);
            }
            
            // বসকে আবার এড করা হয়নি, তাই গ্রুপ ছাড়া
            const byeMsg = `
╔════════════════════╗
║      👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄
╚════════════════════╝

💔 বস এখনও ফিরেননি
😿 আমি এখন গ্রুপ ছাড়ছি

🤖 ⎯꯭𓆩꯭𝆺𝅥😻⃞𝐑⃞𝐈⃞𝐘⃞𝐀⃞༢࿐ 𝐁𝐎𝐓

━━━━━━━━━━━━━━━━━━
👑 বসকে সম্মান করুন
━━━━━━━━━━━━━━━━━━
`;
            
            await api.sendMessage(byeMsg, threadID);
            await api.removeUserFromGroup(api.getCurrentUserID(), threadID)
                .catch(() => console.log("গ্রুপ ছাড়তে ব্যর্থ"));
        }
        
    } catch (err) {
        console.error("[BOSSLEAVE ERROR]", err);
    }
};

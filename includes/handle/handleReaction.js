/**
 * 📌 ফাইলের নাম: reactionHandler.js
 * 📝 বিবরণ: মেসেজ রিঅ্যাকশন (❌) ও কাস্টম রিঅ্যাকশন হ্যান্ডলার
 * 👤 ক্রেডিট: M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 * ⏰ আপডেট: ২০২৬
 */

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return function ({ event }) {
        const { handleReaction, commands } = global.client;
        const { messageID, threadID, reaction, userID } = event; 

        // ✅ ১. যদি রিঅ্যাকশন '❌' হয়, তাহলে মেসেজ ডিলিট করো
        if (reaction === '❌') {
            // চেক করো যে রিঅ্যাক্ট দেওয়া ইউজার মেসেজের মালিক কিনা (অপশনাল)
            // যদি চাও, শুধু মেসেজের মালিকই ডিলিট করতে পারবে
            // api.getThreadInfo(threadID, (err, info) => {
            //     if (info.participantIDs.includes(userID)) {
            //         return api.unsendMessage(messageID);
            //     }
            // });
            return api.unsendMessage(messageID);
        }

        // ✅ ২. কাস্টম রিঅ্যাকশন হ্যান্ডলার চেক করো
        if (handleReaction.length !== 0) {
            const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);
            if (indexOfHandle < 0) return; // যদি কোনো ম্যাচ না পায়
            
            const indexOfMessage = handleReaction[indexOfHandle];
            const handleNeedExec = commands.get(indexOfMessage.name);

            // যদি কমান্ড না পাওয়া যায়
            if (!handleNeedExec) {
                return api.sendMessage(
                    global.getText('handleReaction', 'missingValue'), 
                    threadID, 
                    messageID
                );
            }

            try {
                // 📍 মাল্টি-ল্যাঙ্গুয়েজ সাপোর্ট
                var getText2;
                if (handleNeedExec.languages && typeof handleNeedExec.languages == 'object') {
                    getText2 = (...value) => {
                        const react = handleNeedExec.languages || {};
                        if (!react.hasOwnProperty(global.config.language)) {
                            return api.sendMessage(
                                global.getText('handleCommand', 'notFoundLanguage', handleNeedExec.config.name), 
                                threadID, 
                                messageID
                            );
                        }
                        var lang = react[global.config.language][value[0]] || '';
                        for (var i = value.length; i > 0; i--) {
                            const expReg = RegExp('%' + i, 'g');
                            lang = lang.replace(expReg, value[i]);
                        }
                        return lang;
                    };
                } else {
                    getText2 = () => {};
                }

                // 📦 অবজেক্ট তৈরি করো যা কমান্ডে পাঠাবে
                const Obj = {
                    api: api,
                    event: event,
                    models: models,
                    Users: Users,
                    Threads: Threads,
                    Currencies: Currencies,
                    handleReaction: indexOfMessage,
                    getText: getText2
                };

                // 🚀 কমান্ডের handleReaction ফাংশন কল করো
                handleNeedExec.handleReaction(Obj);
                return;

            } catch (error) {
                // ❌ এরর হ্যান্ডলিং
                return api.sendMessage(
                    global.getText('handleReaction', 'executeError', error), 
                    threadID, 
                    messageID
                );
            }
        }
    };
};

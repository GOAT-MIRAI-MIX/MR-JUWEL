module.exports = function ({api ,models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
   	const moment = require("moment");
    const goatRuntime = require("../compat/goatRuntime");

    return function ({ event }) {
        const timeStart = Date.now()
        const time = moment.tz("Asia/Dhaka").format("HH:MM:ss L");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;
        var { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
        if (userBanned.has(senderID)|| threadBanned.has(threadID) || allowInbox == ![] && senderID == threadID) return;
        if (event.type == "change_thread_image") event.logMessageType = "change_thread_image";

        // Goat-স্টাইল কমান্ডের onEvent / onAnyEvent
        try { goatRuntime.dispatchCommandEvents({ api, event, models, Users, Threads, Currencies }); }
        catch (e) { console.log("[goat onEvent]", e && e.message); }

        for (const [key, value] of events.entries()) {
            // মিরাই ইভেন্টে config.eventType অ্যারে থাকে; Goat ইভেন্টে থাকে না (সব log ইভেন্টে চলে, ফাইল নিজেই ফিল্টার করে)
            const types = value.config && value.config.eventType;
            const matches = Array.isArray(types)
                ? types.indexOf(event.logMessageType) !== -1
                : (value.__goatEvent === true && !!event.logMessageType);
            if (matches) {
                const eventRun = events.get(key);
                try {
                    const Obj = {};
                    Obj.api = api
                    Obj.event = event
                    Obj.models= models 
                    Obj.Users= Users 
                    Obj.Threads = Threads
                    Obj.Currencies = Currencies
                    eventRun.run(Obj);
                    if (DeveloperMode == !![]) 
                    	logger(global.getText('handleEvent', 'executeEvent', time, eventRun.config.name, threadID, Date.now() - timeStart), '[ Event ]');
                } catch (error) {
                    logger(global.getText('handleEvent', 'eventError', eventRun.config.name, JSON.stringify(error)), "error");
                }
            }
        }
        return;
    };
}

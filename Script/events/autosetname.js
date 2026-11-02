module.exports.config = {
	name: "autoSetName",
	eventType: ["log:subscribe"],
	version: "1.1.0",
	credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
	description: "বট গ্রুপে অ্যাড হলে অটো নিকনেম সেট করবে"
};

module.exports.run = async function ({ api, event }) {
	try {
		const botID = String(api.getCurrentUserID());
		const added = (event.logMessageData && event.logMessageData.addedParticipants) || [];

		// যাকে অ্যাড করা হয়েছে সে বট কিনা
		if (!added.some(u => String(u.userFbId) === botID)) return;

		// config.json থেকে নাম নেওয়া
		const nick = global.config.nickNameBot || global.config.BOTNAME;
		if (!nick) {
			console.log("[autoSetName] BOTNAME পাওয়া যায়নি");
			return;
		}

		// জয়েন করার পর একটু অপেক্ষা
		await new Promise(r => setTimeout(r, 3000));

		// ৩ বার চেষ্টা করবে
		for (let i = 1; i <= 3; i++) {
			try {
				await api.changeNickname(nick, event.threadID, botID);
				console.log("[autoSetName] সফল:", event.threadID);
				return;
			} catch (e) {
				console.log(`[autoSetName] চেষ্টা ${i} ব্যর্থ:`, e.message || e);
				await new Promise(r => setTimeout(r, 2000));
			}
		}
	} catch (err) {
		console.log("[autoSetName] এরর:", err.message || err);
	}
};

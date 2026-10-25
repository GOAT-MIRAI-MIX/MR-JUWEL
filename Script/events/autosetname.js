module.exports = {
	config: {
		name: "autoSetName",
		version: "1.0",
		author: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
		category: "events"
	},

	onStart: async ({ api, event }) => {
		// শুধু নতুন সদস্য অ্যাড হওয়ার ইভেন্টে কাজ করবে
		if (event.logMessageType !== "log:subscribe")
			return;

		return async function () {
			const botID = api.getCurrentUserID();
			const addedParticipants = event.logMessageData.addedParticipants || [];

			// যাকে অ্যাড করা হয়েছে সে বট নিজে কিনা চেক
			if (!addedParticipants.some(user => user.userFbId == botID))
				return;

			// config.json থেকে নাম নেওয়া
			const nickNameBot = global.GoatBot.config.nickNameBot;
			if (!nickNameBot)
				return;

			try {
				await api.changeNickname(nickNameBot, event.threadID, botID);
			}
			catch (e) {
				// কোনো নোটিশ বা মেসেজ পাঠানো হবে না
			}
		};
	}
};

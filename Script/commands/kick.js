module.exports.config = {
	name: "kick",
	version: "1.6.0",
	hasPermssion: 1,
	credits: "MR JUWEL",
	description: "Ultra fast multi kick system",
	commandCategory: "System",
	usages: "[tag/reply]",
	cooldowns: 2,
};

module.exports.run = async function ({ api, event }) {
	try {
		const threadID = event.threadID;
		const botID = api.getCurrentUserID();

		// গ্রুপের তথ্য আনা
		const info = await api.getThreadInfo(threadID);
		const adminIDs = (info.adminIDs || []).map(a => String(a.id || a));

		// বট এডমিন কিনা চেক
		if (!adminIDs.includes(String(botID))) {
			return api.sendMessage(
				"❌ আমি এই গ্রুপের এডমিন না!\nআগে আমাকে এডমিন বানান, তারপর কিক করতে পারবো।",
				threadID,
				event.messageID
			);
		}

		let targetIDs = [];

		if (event.type === "message_reply") {
			targetIDs.push(event.messageReply.senderID);
		}

		if (event.mentions) {
			targetIDs = targetIDs.concat(Object.keys(event.mentions));
		}

		targetIDs = [...new Set(targetIDs.map(String))];

		if (targetIDs.length === 0)
			return api.sendMessage("⚠️ Reply or tag someone!", threadID, event.messageID);

		// বট নিজেকে বা অন্য এডমিনকে কিক করা আটকানো
		const skipped = [];
		const validIDs = targetIDs.filter(id => {
			if (id === String(botID) || adminIDs.includes(id)) {
				skipped.push(id);
				return false;
			}
			return true;
		});

		if (validIDs.length === 0)
			return api.sendMessage("⚠️ এডমিন বা বটকে কিক করা যাবে না!", threadID, event.messageID);

		await api.sendMessage(
			`⚡ KICK STARTED\n👥 Total: ${validIDs.length}\n🚀 Fast mode ON`,
			threadID
		);

		let kicked = 0;
		let failed = 0;

		// কলব্যাক দিয়ে আসল রেজাল্ট ধরা
		await Promise.all(
			validIDs.map(id =>
				new Promise(resolve => {
					api.removeUserFromGroup(id, threadID, (err) => {
						if (err) failed++;
						else kicked++;
						resolve();
					});
				})
			)
		);

		return api.sendMessage(
			`╭──── FAST RESULT ────╮\n` +
			`│ 👥 Total: ${validIDs.length}\n` +
			`│ ✅ Kicked: ${kicked}\n` +
			`│ ❌ Failed: ${failed}\n` +
			`│ ⏭️ Skipped (admin): ${skipped.length}\n` +
			`│ ⚡ Mode: Ultra Fast\n` +
			`╰────────────────────╯`,
			threadID
		);

	} catch (err) {
		console.log(err);
		return api.sendMessage("❌ Kick error!", event.threadID);
	}
};

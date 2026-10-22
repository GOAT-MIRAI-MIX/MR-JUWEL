module.exports.config = {
	name: "offbot",
	version: "1.1.0",
	hasPermssion: 2,
	credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
	description: "turn the bot off and show how long it was running",
	commandCategory: "system",
	cooldowns: 0
};

module.exports.run = ({ event, api }) => {
	// config.json এর ADMINBOT থেকে এডমিন চেক (আলাদা UID লাগবে না)
	const admins = (global.config.ADMINBOT || []).map(String);
	if (!admins.includes(String(event.senderID)))
		return api.sendMessage(
			"[ ERR ] You don't have permission to use this command, This Command Only For BOT ADMIN",
			event.threadID,
			event.messageID
		);

	// বট কতক্ষণ চালু ছিল
	const total = Math.floor(process.uptime());
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;

	return api.sendMessage(
		`[ OK ] ${global.config.BOTNAME} Bot are now turned off.\n⏱️ Bot was online for: ${hours} hour(s) ${minutes} minute(s) ${seconds} second(s)`,
		event.threadID,
		() => process.exit(0)
	);
};

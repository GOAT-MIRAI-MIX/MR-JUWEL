module.exports.config = {
	name: "god",
	eventType: [
		"log:unsubscribe",
		"log:subscribe",
		"log:thread-name",
		"log:thread-admins",
		"log:user-nickname",
		"log:thread-icon",
		"log:thread-image"
	],
	version: "3.0.0",
	credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
	description: "Ultra Pro Group Activity Logger",
	envConfig: {
		enable: true
	}
};

module.exports.run = async function ({ api, event }) {

	if (!global.configModule?.[this.config.name]?.enable) return;

	const time = new Date().toLocaleString("en-GB", {
		timeZone: "Asia/Dhaka"
	});

	let msg = "";

	try {

		const threadInfo = await api.getThreadInfo(event.threadID);
		const groupName = threadInfo.threadName || "Unknown Group";

		// ================= USER INFO FUNCTION =================

		async function getName(uid) {
			try {
				const data = await api.getUserInfo(uid);
				return data[uid]?.name || "Unknown";
			} catch {
				return "Unknown";
			}
		}

		// ================= GROUP NAME CHANGE =================

		if (event.logMessageType == "log:thread-name") {

			const changer = await getName(event.author);

			msg =
`╔════════════════════╗
║ 🏷️ GROUP NAME UPDATE ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ ⚡ Changed By : ${changer}
║ 🆔 TID : ${event.threadID}
╚════════════════════╝
🕒 ${time}`;
		}

		// ================= ADMIN UPDATE =================

		if (event.logMessageType == "log:thread-admins") {

			const targetID = event.logMessageData?.TARGET_ID;
			const action = event.logMessageData?.ADMIN_EVENT;

			const adminName = await getName(event.author);
			const targetName = await getName(targetID);

			if (action == "add_admin") {

				msg =
`╔════════════════════╗
║ 👑 NEW ADMIN ADDED ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ 👤 User : ${targetName}
║ ⚡ Added By : ${adminName}
╚════════════════════╝
🕒 ${time}`;
			}

			if (action == "remove_admin") {

				msg =
`╔══════════════════════╗
║ 🚫 ADMIN REMOVED ║
╠══════════════════════╣
║ 📌 Group : ${groupName}
║ 👤 Removed : ${targetName}
║ ⚡ Removed By : ${adminName}
╚══════════════════════╝
🕒 ${time}`;
			}
		}

		// ================= NICKNAME CHANGE =================

		if (event.logMessageType == "log:user-nickname") {

			const targetID = event.logMessageData?.participant_id;
			const newNick = event.logMessageData?.nickname || "Removed";

			const changer = await getName(event.author);
			const targetName = await getName(targetID);

			msg =
`╔════════════════════╗
║ ✏️ NICKNAME UPDATE ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ 👤 User : ${targetName}
║ 📝 New Nick : ${newNick}
║ ⚡ Changed By : ${changer}
╚════════════════════╝
🕒 ${time}`;
		}

		// ================= EMOJI CHANGE =================

		if (event.logMessageType == "log:thread-icon") {

			const changer = await getName(event.author);

			msg =
`╔════════════════════╗
║ 😆 GROUP EMOJI UPDATE ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ 😀 New Emoji : ${event.logMessageData.thread_icon}
║ ⚡ Changed By : ${changer}
╚════════════════════╝
🕒 ${time}`;
		}

		// ================= GROUP PHOTO CHANGE =================

		if (event.logMessageType == "log:thread-image") {

			const changer = await getName(event.author);

			msg =
`╔════════════════════╗
║ 🖼️ GROUP PHOTO UPDATE ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ ⚡ Changed By : ${changer}
║ 🆔 Thread : ${event.threadID}
╚════════════════════╝
🕒 ${time}`;
		}

		// ================= MEMBER REMOVED =================

		if (event.logMessageType == "log:unsubscribe") {

			const leftID = event.logMessageData.leftParticipantFbId;

			const leftName = await getName(leftID);
			const remover = await getName(event.author);

			if (leftID == api.getCurrentUserID()) {

				msg =
`╔════════════════════╗
║ 🚨 BOT REMOVED ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ ⚡ Removed By : ${remover}
╚════════════════════╝
🕒 ${time}`;

			} else {

				msg =
`╔════════════════════╗
║ 👢 MEMBER REMOVED ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ 👤 User : ${leftName}
║ ⚡ By : ${remover}
╚════════════════════╝
🕒 ${time}`;
			}
		}

		// ================= BOT ADDED =================

		if (event.logMessageType == "log:subscribe") {

			const added = event.logMessageData?.addedParticipants || [];

			if (added.some(i => i.userFbId == api.getCurrentUserID())) {

				msg =
`╔════════════════════╗
║ 🤖 BOT ADDED ║
╠════════════════════╣
║ 📌 Group : ${groupName}
║ 👥 Members : ${threadInfo.participantIDs.length}
╚════════════════════╝
🕒 ${time}`;
			}
		}

		if (!msg) return;

		const inboxes = [
			"61593603338850",
			"61591542717221"
		];

		for (const id of inboxes) {
			await api.sendMessage(msg, id);
		}

	} catch (err) {
		console.log(err);
	}
};

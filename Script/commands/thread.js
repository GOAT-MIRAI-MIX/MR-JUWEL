 module.exports.config = {
	name: "thread",
	version: "1.0.5",
	hasPermssion: 2,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
	description: "Ban or unban a group",
	commandCategory: "system",
	usages: "[unban/ban/search] [ID or text]",
	cooldowns: 5,
	dependencies: {
		"moment-timezone": ""
	}
};

module.exports.languages = {
	"vi": {
		"reason": "Lý do",
		"at": "vào lúc",
		"allCommand": "toàn bộ lệnh",
		"commandList": "những lệnh",
		"banSuccess": "[☠️ 𝐁𝐚𝐧 𝐓𝐡𝐫𝐞𝐚𝐝 ☠️] - 𝐗𝐮̛̉ 𝐥𝐲́ 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐜𝐚̂́𝐦 𝐧𝐡𝐨́𝐦 𝐜𝐨́ 𝐈𝐃 %1",
		"unbanSuccess": "[🌸 𝐔𝐧𝐛𝐚𝐧 𝐓𝐡𝐫𝐞𝐚𝐝 🌸] - 𝐗𝐮̛̉ 𝐥𝐲́ 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐠𝐨̛̃ 𝐜𝐚̂́𝐦 𝐧𝐡𝐨́𝐦 𝐜𝐨́ 𝐈𝐃 %1",
		"banCommandSuccess": "[📌 𝐁𝐚𝐧𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐓𝐡𝐫𝐞𝐚𝐝 🚨] - 𝐗𝐮̛̉ 𝐥𝐲́ 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐜𝐚̂́𝐦 𝐥𝐞̣̂𝐧𝐡 𝐯𝐨̛́𝐢 𝐧𝐡𝐨́𝐦 𝐜𝐨́ 𝐈𝐃 %1",
		"unbanCommandSuccess": "[💎 𝐔𝐧𝐛𝐚𝐧𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐓𝐡𝐫𝐞𝐚𝐝 🌸] - 𝐗𝐮̛̉ 𝐥𝐲́ 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐠𝐨̛̃ 𝐜𝐚̂́𝐦 %1 𝐫𝐢𝐞̂𝐧𝐠 𝐯𝐨̛́𝐢 𝐧𝐡𝐨́𝐦 𝐜𝐨́ 𝐈𝐃 %2",
		"errorReponse": "%1 Không thể hoàn tất công việc bạn yêu cầu đối với nhóm có ID %2",
		"IDNotFound": "%1 ID bạn nhập không tồn tại trong cơ sở dữ liệu",
		"existBan": "[💸 𝐁𝐚𝐧 𝐓𝐡𝐫𝐞𝐚𝐝 💸] - 𝐈𝐃 %1 𝐡𝐢𝐞̣̂𝐧 𝐯𝐚̂̃𝐧 𝐛𝐢̣ 𝐛𝐚𝐧 𝐭𝐮̛̀ 𝐭𝐫𝐮̛𝐨̛́𝐜 %2 %3",
		"notExistBan": "[🚨 𝐔𝐧𝐛𝐚𝐧 𝐓𝐡𝐫𝐞𝐚𝐝 🚨] - 𝐈𝐃 𝐛𝐚̣𝐧 𝐧𝐡𝐚̣̂𝐩 𝐜𝐡𝐮̛𝐚 𝐭𝐮̛̀𝐧𝐠 𝐛𝐢̣ 𝐜𝐚̂́𝐦 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐛𝐨𝐭",
		"missingCommandInput": "%1 Phần command cần cấm không được để trống!",
		"notExistBanCommand": "[🧬 𝐔𝐧𝐛𝐚𝐧𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐓𝐡𝐫𝐞𝐚𝐝 🧬] - 𝐇𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢 𝐈𝐃 𝐧𝐡𝐨́𝐦 𝐛𝐚̣𝐧 𝐧𝐡𝐚̣̂𝐩 𝐜𝐡𝐮̛𝐚 𝐭𝐮̛̀𝐧𝐠 𝐛𝐢̣ 𝐜𝐚̂́𝐦 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐥𝐞̣̂𝐧𝐡",

		"returnBan": "[📌 𝐁𝐚𝐧 𝐓𝐡𝐫𝐞𝐚𝐝 💌] - 𝐇𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢 𝐛𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐜𝐡𝐨 𝐧𝐡𝐨́𝐦 𝐧𝐚̀𝐲 𝐯𝐞̂̀ 𝐜𝐚́𝐭 𝐛𝐮̣𝐢:\n❯ 𝐈𝐃 𝐧𝐡𝐨́𝐦 𝐜𝐚̂̀𝐧 𝐜𝐚̂́𝐦: %1%2\n\n❮💸 𝐑𝐞𝐚𝐜𝐭𝐢𝐨𝐧 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐧𝐞̂́𝐮 𝐱𝐚́𝐜 𝐧𝐡𝐚̣̂𝐧 𝐜𝐚̂́𝐦 🌸❯",
		"returnUnban": "[ 𝐔𝐧𝐛𝐚𝐧 𝐓𝐡𝐫𝐞𝐚𝐝 ] - 𝐇𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢 𝐛𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐲𝐞̂𝐮 𝐜𝐚̂̀𝐮 𝐜𝐡𝐨 𝐧𝐡𝐨́𝐦 𝐧𝐚̀𝐲 𝐦𝐨̣̂𝐭 𝐚̂𝐧 𝐡𝐮𝐞̣̂ 𝐯𝐞̂̀ 𝐡𝐨𝐚̀ 𝐧𝐡𝐚̣̂𝐩 𝐯𝐨̛́𝐢 𝐱𝐚̃ 𝐡𝐨̣̂𝐢:\n❯ 𝐈𝐃 𝐧𝐡𝐨́𝐦 𝐜𝐚̂̀𝐧 𝐠𝐨̛̃ 𝐜𝐚̂́𝐦: %1\n\n❮💌 𝐑𝐞𝐚𝐜𝐭𝐢𝐨𝐧 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐧𝐞̂́𝐮 𝐱𝐚́𝐜 𝐧𝐡𝐚̣̂𝐧 𝐠𝐨̛̃ 𝐜𝐚̂́𝐦 💎❯",
		"returnBanCommand": "[ 𝐁𝐚𝐧𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐓𝐡𝐫𝐞𝐚𝐝 ] - Hiện tại bạn đang yêu cầu cấm sử dụng lệnh đối với nhóm:\n - ID nhóm cần cấm: %1\n- Các lệnh cần cấm: %2\n\n❮ Reaction tin nhắn này để xác thực ❯",
		"returnUnbanCommand": "[ 𝐔𝐧𝐛𝐚𝐧𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐓𝐡𝐫𝐞𝐚𝐝 ] - Hiện tại bạn đang yêu cầu gỡ cấm sử dụng lệnh đối với nhóm:\n - ID nhóm cần gỡ cấm lệnh: %1\n- Các lệnh cần gỡ cấm: %2\n\n❮ Reaction tin nhắn này để xác thực ❯",
	
		"returnResult": "Đây là kết quả phù hợp: \n",
		"returnNull": "Không tìm thấy kết quả dựa vào tìm kiếm của bạn!",
		"returnList": "[ Thread List ]\nHiện tại đang có %1 nhóm bị ban, dưới đây là %2 nhóm\n\n%3",
		"returnInfo": "[ Info Thread ] Đây là một sô thông tin về nhóm bạn cần tìm:\n- ID của nhóm: %1n- Có bị ban?: %2 %3 %4\n- Bị ban lệnh?: %5"
	},
	"en": {
		"reason": "Reason",
		"at": "At",
		"allCommand": "All commands",
		"commandList": "Commands",
		"banSuccess": "[ Ban Thread ] Banned thread has  ID %1",
		"unbanSuccess": "[ Unban Thread ] Unbanned thread has ID %1",
		"banCommandSuccess": "[ banCommand Thread ] Banned command with thread has  ID %1",
		"unbanCommandSuccess": "[ unbanCommand Thread ] Unbanned %1 with thread has ID %2",
		"errorReponse": "%1 Can't do what you request with thread has ID %2",
		"IDNotFound": "%1 ID you import doesn't exist in database",
		"existBan": "[ Ban Thread ] ID %1 has been banned before %2 %3",
		"notExistBan": "[ Unban Thread ] ID you import hasn't been banned before bot",
		"missingCommandInput": "%1 You have to import the command you want to ban!",
		"notExistBanCommand": "[ UnbanCommand Thread ] The thread ID you import hasn't been banned before",

		"returnBan": "[ Ban Thread ] You are requesting to ban thread:\n- Thread ID: %1%2\n\n❮ Reaction this message to complete ❯",
		"returnUnban": "[ Unban Thread ] You are requesting to unban thread:\n- Thread ID: %1\n\n❮ Reaction this message to complete ❯",
		"returnBanCommand": "[ banCommand Thread ] You are requesting to ban command with thread:\n - Thread ID: %1\n- Commands: %2\n\n❮ Reaction this message to complete ❯",
		"returnUnbanCommand": "[ unbanCommand Thread ] You are requesting to unban command with thread:\n - Thread ID: %1\n- Commands: %2\n\n❮ Reaction this message to complete ❯",
	
		"returnResult": "This is your result: \n",
		"returnNull": "There is no result with your input!",
		"returnList": "[ Thread List ]\There are %1 banned thread, here are %2\n\n%3",
		"returnInfo": "[ Info Thread ] Here are some information about your thread which you want to search:\n- Thread ID: %1n- Banned?: %2 %3 %4\n- Command banned?: %5"
	}
}

module.exports.handleReaction = async ({ event, api, Threads, handleReaction, getText }) => {
	if (parseInt(event.userID) !== parseInt(handleReaction.author)) return;
	const moment = require("moment-timezone");
	const { threadID } = event;
	const { messageID, type, targetID, reason, commandNeedBan } = handleReaction;
	
	const time = moment.tz("Asia/Kolkata").format("HH:MM:ss L");
	global.client.handleReaction.splice(global.client.handleReaction.findIndex(item => item.messageID == messageID), 1);

	switch (type) {
		case "ban": {
			try {
				let data = (await Threads.getData(targetID)).data || {};
				data.banned = true;
				data.reason = reason || null;
				data.dateAdded = time;
				await Threads.setData(targetID, { data });
				global.data.threadBanned.set(targetID, { reason: data.reason, dateAdded: data.dateAdded });
				return api.sendMessage(getText("banSuccess", targetID), threadID, () => {
					return api.unsendMessage(messageID);
				});
			} catch { return api.sendMessage(getText("errorReponse", "[ Ban Thread ]", targetID), threadID) };
		}

		case "unban": {
			try {
				let data = (await Threads.getData(targetID)).data || {};
				data.banned = false;
				data.reason = null;
				data.dateAdded = null;
				await Threads.setData(targetID, { data });
				global.data.threadBanned.delete(targetID);
				return api.sendMessage(getText("unbanSuccess", targetID), threadID, () => {
					return api.unsendMessage(messageID);
				});
			} catch { return api.sendMessage(getText("errorReponse", "[ unBan Thread ]", targetID), threadID) };
		}

		case "banCommand": {
			try {	
				let data = (await Threads.getData(targetID)).data || {};
				data.commandBanned = [...data.commandBanned || [], ...commandNeedBan];
				await Threads.setData(targetID, { data });
				global.data.commandBanned.set(targetID, data.commandBanned);
				return api.sendMessage(getText("banCommandSuccess", targetID), threadID, () => {
					return api.unsendMessage(messageID);
				});
			} catch (e) { return api.sendMessage(getText("errorReponse", "[ banCommand Thread ]", targetID), threadID) };
		}
		
		case "unbanCommand": {
			try {
				let data = (await Threads.getData(targetID)).data || {};
				data.commandBanned = [...data.commandBanned.filter(item => !commandNeedBan.includes(item))];
				await Threads.setData(targetID, { data });
				global.data.commandBanned.set(targetID, data.commandBanned);
				if(data.commandBanned.length == 0) global.data.commandBanned.delete(targetID)
				return api.sendMessage(getText("unbanCommandSuccess", ((data.commandBanned.length == 0) ? getText("allCommand") : `${getText("commandList")}: ${commandNeedBan.join(", ")}`), targetID), threadID, () => {
					return api.unsendMessage(messageID);
				});
			} catch (e) { return api.sendMessage(getText("errorReponse", "[ unbanCommand Thread ]", targetID), threadID) };
		}
		default:
			break;
	}
}

module.exports.run = async ({ event, api, args, Threads, getText }) => { 
	const { threadID, messageID } = event;
	var targetID = String(args[1]);
	var reason = (args.slice(2, args.length)).join(" ") || null;

	if (isNaN(targetID)) {
		targetID = String(event.threadID);
		reason = (args.slice(1, args.length)).join(" ") || null;
	}

	switch (args[0]) {
		case "ban":
		case "-b": {
			if (!global.data.allThreadID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "[ Ban Thread ]"), threadID, messageID);
			if (global.data.threadBanned.has(targetID)) {
				const { reason, dateAdded } = global.data.threadBanned.get(targetID) || {};
				return api.sendMessage(getText("existBan", targetID, ((reason) ? `${getText("reason")}: "${reason}"` : ""), ((dateAdded) ? `${getText("at")}: ${dateAdded}` : "")), threadID, messageID);
			}
			return api.sendMessage(getText("returnBan", targetID, ((reason) ? `\n- ${getText("reason")}: ${reason}` : "")), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "ban",
					targetID,
					reason,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID,
					
				});
			}, messageID);
		}

		case "unban":
		case "-ub": {
			if (!global.data.allThreadID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "[ Unban Thread ]"), threadID, messageID);
			if (!global.data.threadBanned.has(targetID)) return api.sendMessage(getText("notExistBan"), threadID, messageID);
			return api.sendMessage(getText("returnUnban", targetID), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "unban",
					targetID,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID,
					
				});
			}, messageID);
		}

		case "banCommand":
		case "-bc": {
			if (!global.data.allThreadID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "[ BanCommand Thread ]"), threadID, messageID);
			if (reason == null || reason.length == 0) return api.sendMessage(getText("missingCommandInput", '[ BanCommand Thread ]'), threadID, messageID);
			if (reason == "all") {
				var allCommandName = [];
				const commandValues = global.client.commands.keys();
				for (const cmd of commandValues) allCommandName.push(cmd);
				reason = allCommandName.join(" ");
			}
			const commandNeedBan = reason.split(" ");
			return api.sendMessage(getText("returnBanCommand", targetID, ((commandNeedBan.length == global.client.commands.size) ? getText("allCommand") : commandNeedBan.join(", "))), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "banCommand",
					targetID,
					commandNeedBan,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID,
					
				});
			}, messageID);
		}

		case "unbanCommand":
		case "-ubc": {
			if (!global.data.allThreadID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "[ UnbanCommand Thread ]"), threadID, messageID);
			if (!global.data.commandBanned.has(targetID)) return api.sendMessage(getText("notExistBanCommand"), threadID, messageID);
			if (reason == null || reason.length == 0) return api.sendMessage(getText("missingCommandInput", "[ UnbanCommand Thread ]"), threadID, messageID);
			if (reason == "all") {
				reason = (global.data.commandBanned.get(targetID)).join(" ");
			}
			const commandNeedBan = reason.split(" ");
			return api.sendMessage(getText("returnUnbanCommand", targetID, ((commandNeedBan.length == global.data.commandBanned.get(targetID).length) ? "toàn bộ lệnh" : commandNeedBan.join(", "))), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "unbanCommand",
					targetID,
					commandNeedBan,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID,
					
				});
			}, messageID);
		}

		case "search":
		case "-s": {
			const contentJoin = reason || "";
			const getThreads =  (await Threads.getAll(['threadID', 'threadInfo'])).filter(item => !!item.threadInfo);
			var matchThreads = [], a = '', b = 0;
			getThreads.forEach(i => {
				if ((i.threadInfo.threadName || "").toLowerCase().includes(contentJoin.toLowerCase())) {
					matchThreads.push({
						name: i.threadInfo.threadName,
						id: i.threadID
					});
				}
			});
			matchThreads.forEach(i => a += `\n${b += 1}. ${i.name} - ${i.id}`);
			(matchThreads.length > 0) ? api.sendMessage(getText("returnResult", a), threadID) : api.sendMessage(getText("returnNull"), threadID, messageID);
			break;
		}

		case "list":
		case "-l": {
			var listBan = [], i = 0;
			const threadData = global.data.threadBanned.keys();
			for (; ;) {
				if (i > global.data.threadBanned.size) break;
				let idThread = String(threadData.next().value);
				if (typeof idThread == "undefined") {
					const nameThread = (await Threads.getData(idThread)).threadInfo.threadName || "unknown";
					listBan.push(`${i+=1}/ ${idThread} - ${nameThread}`)
				}
				if (i == global.data.threadBanned.size || i == (parseInt(reason) || 10)) break;
			}
			return api.sendMessage(getText("returnList",(global.data.threadBanned.size || 0), listBan.length, listBan.join("\n")), threadID, messageID);
		}

		case "info":
		case "-i": {
			if (!global.data.allThreadID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "[ Info Thread ]"), threadID, messageID);
			if (global.data.commandBanned.has(targetID)) { var commandBanned = global.data.commandBanned.get(targetID) || [] };
			if (global.data.threadBanned.has(targetID)) { var { reason, dateAdded } = global.data.threadBanned.get(targetID) || {} };
			return api.sendMessage(getText("returnInfo", targetID, ((!dateAdded) ? "YES" : "NO"), ((reason) ? `${getText("reason")}: "${reason}"` : ""), ((dateAdded) ? `${getText("at")}: ${dateAdded}` : ""), ((commandBanned) ? `YES: ${commandBanned.join(", ")}` : "NO")), threadID, messageID);
		}
	}
}

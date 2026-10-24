module.exports.config = {
	name: "adduser",
	version: "2.5.0",
	hasPermssion: 0,
	credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
	description: "Add user to the group by link or id",
	commandCategory: "group",
	usages: "[uid / profile link]",
	cooldowns: 5
};

// ---------- UI helpers ----------
const LINE = "━━━━━━━━━━━━━━━━━━━━";

function card(icon, title, rows = [], footer = "") {
	let msg = `╭${LINE}╮\n   ${icon} ${title}\n╰${LINE}╯\n`;
	for (const [k, v] of rows) msg += `\n  ▸ ${k}: ${v}`;
	if (footer) msg += `\n\n${LINE}\n  ${footer}`;
	return msg;
}

// ---------- Get UID + name from profile link ----------
async function getUID(url, api) {
	const regexName = /"title":"(.*?)"/s;

	if (!(url.includes("facebook.com") || url.includes("fb.com"))) {
		return ["Please send 1 valid Facebook profile URL.", null, true];
	}

	try {
		if (url.indexOf("http://") === -1 && url.indexOf("https://") === -1) url = "https://" + url;

		let data = await api.httpGet(url);
		const redirect = /for \(;;\);{"redirect":"(.*?)"}/.exec(data);

		if (data.includes('"redirect":"') && redirect) {
			const next = redirect[1].replace(/\\/g, "").replace(/(?<=\?\s*)(.*)/, "").slice(0, -1);
			data = await api.httpGet(next);
		}

		const idMatch = /"userID":"(\d+)"/.exec(data);
		if (!idMatch) return [null, null, true];

		let name = null;
		try {
			const nm = data.match(regexName);
			if (nm) name = JSON.parse(`{"name": "${nm[1]}"}`).name || null;
		} catch (_) {}

		return [+idMatch[1], name, false];
	} catch (_) {
		return [null, null, true];
	}
}

// ---------- Command ----------
module.exports.run = async function ({ api, event, args }) {
	const { threadID, messageID } = event;
	const botID = api.getCurrentUserID();
	const out = msg => api.sendMessage(msg, threadID, messageID);

	if (!args[0]) {
		return out(card("📌", "𝗔𝗗𝗗 𝗨𝗦𝗘𝗥", [
			["Usage", "adduser [uid]"],
			["Or", "adduser [profile link]"]
		], "Please enter 1 id / profile link."));
	}

	const info = await api.getThreadInfo(threadID);
	const participantIDs = info.participantIDs.map(e => parseInt(e));
	const approvalMode = info.approvalMode;
	const adminIDs = (info.adminIDs || []).map(e => parseInt(e.id));
	const botIsAdmin = adminIDs.includes(parseInt(botID));

	async function adduser(id, name) {
		id = parseInt(id);
		const label = name || "Member";

		// Already in group
		if (participantIDs.includes(id)) {
			return out(card("⚠️", "𝗔𝗟𝗥𝗘𝗔𝗗𝗬 𝗜𝗡 𝗚𝗥𝗢𝗨𝗣", [
				["Name", label],
				["UID", id],
				["Status", "Already a member"]
			]));
		}

		// Try adding
		try {
			await api.addUserToGroup(id, threadID);
		} catch (e) {
			return out(card("❌", "𝗔𝗗𝗗 𝗙𝗔𝗜𝗟𝗘𝗗", [
				["Name", label],
				["UID", id],
				["Status", "Could not add"],
				["Reason", "Privacy settings / blocked / invalid ID"]
			], "Please try again or send the invite link."));
		}

		// Approval mode ON and bot is not admin -> join request
		if (approvalMode === true && !botIsAdmin) {
			return out(card("⏳", "𝗝𝗢𝗜𝗡 𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗦𝗘𝗡𝗧", [
				["Name", label],
				["UID", id],
				["Status", "Pending approval"],
				["Note", "Bot is not admin in this group"]
			], "An admin needs to approve the request."));
		}

		// Added successfully
		return out(card("✅", "𝗔𝗗𝗗𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬", [
			["Name", label],
			["UID", id],
			["Status", "Added to group"]
		], "Welcome to the group! 🎉"));
	}

	if (!isNaN(args[0])) return adduser(args[0], undefined);

	try {
		const [id, name, fail] = await getUID(args[0], api);
		if (fail && id != null) return out(card("❌", "𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗟𝗜𝗡𝗞", [["Info", id]]));
		if (fail && id == null) return out(card("❌", "𝗨𝗦𝗘𝗥 𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗", [["Status", "User ID not found"]]));
		return adduser(id, name || "Facebook user");
	} catch (e) {
		return out(card("❌", "𝗘𝗥𝗥𝗢𝗥", [["Error", `${e.name}: ${e.message}`]]));
	}
};

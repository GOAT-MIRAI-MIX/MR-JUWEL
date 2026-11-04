module.exports.config = {
	name: "outall",
	version: "1.1.0",
	hasPermssion: 2,
	credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
	description: "সব গ্রুপে লিভ নোটিশ দিয়ে বট লিভ নেবে",
	commandCategory: "Admin",
	usages: "outall [নোটিশ টেক্সট (ঐচ্ছিক)]",
	cooldowns: 5
};

const sleep = ms => new Promise(res => setTimeout(res, ms));

module.exports.run = async ({ api, event, args }) => {
	const { threadID, messageID } = event;
	const botID = api.getCurrentUserID();

	// কাস্টম নোটিশ দিলে সেটা, না দিলে ডিফল্ট UI
	const customText = args.join(" ").trim();
	const noticeBody = customText || "অ্যাডমিনের নির্দেশে বট এই গ্রুপ থেকে লিভ নিচ্ছে।";

	const notice =
		"╔═══════════════════╗\n" +
		"   ⚠️ 𝐋𝐄𝐀𝐕𝐄 𝐍𝐎𝐓𝐈𝐂𝐄 ⚠️\n" +
		"╚═══════════════════╝\n\n" +
		`📢 ${noticeBody}\n\n` +
		"👋 সবাইকে ধন্যবাদ, ভালো থাকবেন!\n" +
		"━━━━━━━━━━━━━━━━━━━\n" +
		"👑 কেডিট: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

	// গ্রুপ লিস্ট আনা
	let list;
	try {
		list = await new Promise((resolve, reject) => {
			api.getThreadList(100, null, ["INBOX"], (err, data) => err ? reject(err) : resolve(data));
		});
	} catch (e) {
		return api.sendMessage("❌ গ্রুপ লিস্ট আনতে সমস্যা হয়েছে: " + (e.error || e.message || e), threadID, messageID);
	}

	// যে গ্রুপে কমান্ড দেওয়া হয়েছে সেটা বাদে বাকি সব গ্রুপ
	const groups = list.filter(t => t.isGroup === true && t.threadID != threadID);

	if (groups.length === 0) {
		return api.sendMessage("ℹ️ লিভ নেওয়ার মতো অন্য কোনো গ্রুপ পাওয়া যায়নি।", threadID, messageID);
	}

	await api.sendMessage(`⏳ ${groups.length}টি গ্রুপ থেকে লিভ নেওয়া শুরু হচ্ছে...`, threadID);

	let success = 0, failed = 0;

	for (const group of groups) {
		try {
			// ১) আগে লিভ নোটিশ পাঠানো
			await new Promise(resolve => api.sendMessage(notice, group.threadID, () => resolve()));
			await sleep(1500);

			// ২) তারপর গ্রুপ থেকে বের হওয়া
			await new Promise((resolve, reject) => {
				api.removeUserFromGroup(botID, group.threadID, err => err ? reject(err) : resolve());
			});
			success++;
		} catch (e) {
			failed++;
		}
		// রেট লিমিট/ব্যান এড়াতে গ্যাপ
		await sleep(2500);
	}

	return api.sendMessage(
		"╔═══════════════════╗\n" +
		"   ✅ 𝐎𝐔𝐓 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄 ✅\n" +
		"╚═══════════════════╝\n\n" +
		`✔️ সফল: ${success}টি গ্রুপ\n` +
		`❌ ব্যর্থ: ${failed}টি গ্রুপ`,
		threadID
	);
};

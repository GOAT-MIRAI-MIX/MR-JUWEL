module.exports.config = {
	name: "outall",
	version: "1.3.0",
	hasPermssion: 2,
	credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
	description: "সব গ্রুপে লিভ নোটিশ দিয়ে বট লিভ নেবে",
	commandCategory: "Admin",
	usages: "outall [নোটিশ টেক্সট (ঐচ্ছিক)]",
	cooldowns: 5
};

const sleep = ms => new Promise(res => setTimeout(res, ms));

// callback-style ফাংশনকে নিরাপদ প্রমিসে রূপান্তর (টাইমআউটসহ)
const call = (fn, ms) => new Promise(resolve => {
	let done = false;
	const finish = v => { if (!done) { done = true; clearTimeout(t); resolve(v); } };
	const t = setTimeout(() => finish({ ok: true, timeout: true }), ms);
	try {
		fn((err, data) => finish(err ? { ok: false, err } : { ok: true, data }));
	} catch (e) {
		finish({ ok: false, err: e });
	}
});

const errText = e => (e && (e.error || e.message)) || String(e);

module.exports.run = async function ({ api, event, args, Threads }) {
	const { threadID, messageID } = event;
	const say = (msg, cb) => new Promise(r => api.sendMessage(msg, threadID, () => r(), cb));

	try {
		const botID = String(api.getCurrentUserID());
		const customText = (args || []).join(" ").trim();
		const noticeBody = customText || "অ্যাডমিনের নির্দেশে বট এই গ্রুপ থেকে লিভ নিচ্ছে।";

		const notice =
			"╔═══════════════════╗\n" +
			"   ⚠️ 𝐋𝐄𝐀𝐕𝐄 𝐍𝐎𝐓𝐈𝐂𝐄 ⚠️\n" +
			"╚═══════════════════╝\n\n" +
			`📢 ${noticeBody}\n\n` +
			"👋 সবাইকে ধন্যবাদ, ভালো থাকবেন!\n" +
			"━━━━━━━━━━━━━━━━━━━\n" +
			"👑 কেডিট: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

		await say("⏳ গ্রুপ লিস্ট খোঁজা হচ্ছে...");

		// ধাপ ১: বটের নিজস্ব ডাটা থেকে থ্রেড আইডি
		let ids = [];
		try { ids = (global.data && global.data.allThreadID) ? [...global.data.allThreadID] : []; } catch (e) {}

		// ধাপ ২: getThreadList (৮ সেকেন্ড টাইমআউট) — আইডি যোগ করবে
		const r = await call(cb => api.getThreadList(100, null, ["INBOX"], cb), 8000);
		let apiGroups = [];
		if (r.ok && Array.isArray(r.data)) {
			apiGroups = r.data.filter(t => t.isGroup === true || (t.participantIDs && t.participantIDs.length > 2)).map(t => String(t.threadID));
		}

		// ধাপ ৩: ডাটাবেসের আইডিগুলোর মধ্যে কোনগুলো গ্রুপ তা বের করা
		const dbGroups = [];
		const infoMap = (global.data && global.data.threadInfo) || null;
		for (const id of ids) {
			let info = infoMap && infoMap.get ? infoMap.get(id) : null;
			if (!info && Threads && Threads.getInfo) {
				try { info = await Promise.race([Threads.getInfo(id), sleep(3000).then(() => null)]); } catch (e) {}
			}
			if (info && (info.isGroup === true || (info.participantIDs && info.participantIDs.length > 2))) {
				dbGroups.push(String(id));
			}
		}

		const all = [...new Set([...apiGroups, ...dbGroups])].filter(id => id !== String(threadID));

		await say(`🔎 পাওয়া গেছে: ${all.length}টি গ্রুপ\n(getThreadList: ${apiGroups.length}, bot-data: ${dbGroups.length}, ডাটাবেস আইডি: ${ids.length}${r.timeout ? ", getThreadList টাইমআউট" : ""}${r.ok === false ? ", getThreadList এরর: " + errText(r.err) : ""})`);

		if (all.length === 0) return;

		await say(`🚀 ${all.length}টি গ্রুপ থেকে লিভ নেওয়া শুরু হচ্ছে...`);

		let success = 0, failed = 0;
		const errors = [];

		for (const gid of all) {
			await call(cb => api.sendMessage(notice, gid, cb), 8000);
			await sleep(1500);

			const out = await call(cb => api.removeUserFromGroup(botID, gid, cb), 10000);
			if (out.ok) success++;
			else { failed++; errors.push(`${gid}: ${errText(out.err)}`); }
			await sleep(2500);
		}

		let msg =
			"╔═══════════════════╗\n" +
			"   ✅ 𝐎𝐔𝐓 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄 ✅\n" +
			"╚═══════════════════╝\n\n" +
			`✔️ সফল: ${success}টি গ্রুপ\n` +
			`❌ ব্যর্থ: ${failed}টি গ্রুপ`;
		if (errors.length) msg += "\n\n⚠️ এরর:\n" + errors.slice(0, 5).join("\n");
		await say(msg);
	} catch (e) {
		// কোনো এরর হলে সেটা চ্যাটেই দেখাবে
		api.sendMessage("❌ এরর: " + errText(e) + "\n" + String(e && e.stack || "").split("\n").slice(0, 3).join("\n"), threadID, messageID);
	}
};

module.exports.config = {
 name: "fork",
 version: "2.1.0",
 hasPermssion: 0,
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 description: "Stable fork system with live GitHub stats card",
 commandCategory: "other",
 usages: "fork",
 cooldowns: 3,
};

const fs = require("fs-extra");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const OWNER = "GOAT-MIRAI-MIX";
const REPO = "MR-JUWEL";
const repoLink = `https://github.com/${OWNER}/${REPO}`;

// সুরক্ষা: ক্রেডিট বা রিপো লিংক বদলালে কমান্ড কাজ করবে না
const LOCK = {
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 repo: "https://github.com/GOAT-MIRAI-MIX/MR-JUWEL",
};

// ঐচ্ছিক: রেট লিমিট এড়াতে GitHub token দিতে পারেন (না দিলেও চলবে)
const GITHUB_TOKEN = "";
const headers = {
 "User-Agent": "fork-command",
 ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
};

let cache = null; // { time, data }
const CACHE_MS = 10 * 60 * 1000; // ১০ মিনিট

async function getGithubData() {
 if (cache && Date.now() - cache.time < CACHE_MS) return cache.data;

 try {
 const [user, repos] = await Promise.all([
 axios.get(`https://api.github.com/users/${OWNER}`, { headers }),
 axios.get(`https://api.github.com/users/${OWNER}/repos?per_page=100`, { headers }),
 ]);

 const totalStars = repos.data.reduce((sum, r) => sum + r.stargazers_count, 0);
 const thisRepo = repos.data.find(r => r.name === REPO) || {};

 const data = {
 name: user.data.name || user.data.login,
 login: user.data.login,
 avatar: user.data.avatar_url,
 publicRepos: user.data.public_repos,
 followers: user.data.followers,
 totalStars,
 repoStars: thisRepo.stargazers_count || 0,
 repoForks: thisRepo.forks_count || 0,
 };
 cache = { time: Date.now(), data };
 return data;
 } catch (e) {
 // GitHub ব্লক করলে আগের সেভ করা ডাটা দিয়ে চালাবে
 if (cache) return cache.data;
 throw e;
 }
}

function roundRect(ctx, x, y, w, h, r) {
 ctx.beginPath();
 ctx.moveTo(x + r, y);
 ctx.arcTo(x + w, y, x + w, y + h, r);
 ctx.arcTo(x + w, y + h, x, y + h, r);
 ctx.arcTo(x, y + h, x, y, r);
 ctx.arcTo(x, y, x + w, y, r);
 ctx.closePath();
}

async function drawCard(data, outPath) {
 const W = 560, H = 240;
 const canvas = createCanvas(W, H);
 const ctx = canvas.getContext("2d");

 // ব্যাকগ্রাউন্ড
 const bg = ctx.createLinearGradient(0, 0, W, H);
 bg.addColorStop(0, "#0d1117");
 bg.addColorStop(1, "#1b2433");
 ctx.fillStyle = bg;
 roundRect(ctx, 0, 0, W, H, 18);
 ctx.fill();

 ctx.strokeStyle = "#30363d";
 ctx.lineWidth = 2;
 roundRect(ctx, 1, 1, W - 2, H - 2, 18);
 ctx.stroke();

 // প্রোফাইল ফটো (গোল)
 const avatarBuf = (await axios.get(data.avatar + "&s=200", { responseType: "arraybuffer" })).data;
 const avatar = await loadImage(Buffer.from(avatarBuf));
 const cx = 80, cy = 90, r = 50;
 ctx.save();
 ctx.beginPath();
 ctx.arc(cx, cy, r, 0, Math.PI * 2);
 ctx.closePath();
 ctx.clip();
 ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
 ctx.restore();
 ctx.strokeStyle = "#58a6ff";
 ctx.lineWidth = 3;
 ctx.beginPath();
 ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
 ctx.stroke();

 // নাম
 ctx.fillStyle = "#ffffff";
 ctx.font = "bold 26px sans-serif";
 ctx.fillText(data.name, 150, 78);
 ctx.fillStyle = "#8b949e";
 ctx.font = "16px sans-serif";
 ctx.fillText("@" + data.login, 150, 104);

 // স্ট্যাট বক্স
 const stats = [
 ["Repos", data.publicRepos],
 ["Total Stars", data.totalStars],
 ["Followers", data.followers],
 [`${REPO} Stars`, data.repoStars],
 [`${REPO} Forks`, data.repoForks],
 ];

 const boxW = 96, boxH = 70, gap = 10, startX = 20, y = 150;
 stats.forEach(([label, value], i) => {
 const x = startX + i * (boxW + gap);
 ctx.fillStyle = "#161b22";
 roundRect(ctx, x, y, boxW, boxH, 10);
 ctx.fill();
 ctx.strokeStyle = "#30363d";
 ctx.lineWidth = 1;
 roundRect(ctx, x, y, boxW, boxH, 10);
 ctx.stroke();

 ctx.fillStyle = "#58a6ff";
 ctx.font = "bold 24px sans-serif";
 ctx.textAlign = "center";
 ctx.fillText(String(value), x + boxW / 2, y + 33);

 ctx.fillStyle = "#8b949e";
 ctx.font = "11px sans-serif";
 ctx.fillText(label, x + boxW / 2, y + 55);
 ctx.textAlign = "left";
 });

 fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
}

module.exports.run = async function({ api, event }) {

 if (module.exports.config.credits !== LOCK.credits || repoLink !== LOCK.repo) {
 return api.sendMessage(
 "⚠️ ক্রেডিট অথবা রিপো লিংক চেঞ্জ করা হয়েছে, তাই এই কমান্ড কাজ করছে না।",
 event.threadID,
 event.messageID
 );
 }

 const msg = `
🔥 𝗚𝗢𝗔𝗧 𝗠𝗜𝗥𝗔𝗜 𝗠𝗜𝗫 🔥

━━━━━━━━━━━━━━━━━━━━━━
⚡ 𝗚𝗢𝗔𝗧 𝗠𝗜𝗥𝗔𝗜 𝗠𝗜𝗫 𝗘𝗩𝗘𝗡 𝗣𝗟𝗨𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗
✅ 𝗚𝗢𝗔𝗧 𝗕𝗢𝗧 & 𝗠𝗜𝗥𝗔𝗜 𝗩𝗘𝗥𝗦𝗜𝗢𝗡 - 𝗗𝗨𝗜𝗧𝗔𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 𝗞𝗔𝗔𝗝 𝗞𝗢𝗥𝗘
━━━━━━━━━━━━━━━━━━━━━━
`;

 const linkMsg = `📌 𝗥𝗘𝗣𝗢 𝗟𝗜𝗡𝗞:\n${repoLink}`;

 const cacheDir = __dirname + "/cache";
 const path = cacheDir + "/fork.png";

 try {
 fs.ensureDirSync(cacheDir);
 const data = await getGithubData();
 await drawCard(data, path);

 return api.sendMessage({
 body: msg,
 attachment: fs.createReadStream(path)
 }, event.threadID, () => {
 try { fs.unlinkSync(path); } catch (_) {}
 // লিংক আলাদা মেসেজে পাঠানো হচ্ছে, যাতে ট্যাপ করলে খোলে
 api.sendMessage(linkMsg, event.threadID);
 }, event.messageID);

 } catch (e) {
 console.log("[fork] error:", e.message);
 return api.sendMessage(msg + "\n" + linkMsg, event.threadID, event.messageID);
 }
};

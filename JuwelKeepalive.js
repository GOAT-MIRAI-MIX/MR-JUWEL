/**
 * Credit: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 *
 * JuwelKeepalive.js — Juwel.js-এর একদম প্রথম লাইনে শুধু এটা যোগ করুন:
 *
 *     require("./JuwelKeepalive");
 *
 * কাজ (সব অটো):
 *  - Render-এর PORT-এ ছোট health সার্ভার তোলে
 *  - বটের (Main.js) জন্য PORT এক ধাপ সরিয়ে দেয়, যাতে পোর্ট নিয়ে কনফ্লিক্ট না হয়
 *  - RENDER_EXTERNAL_URL থেকে নিজের লিংক নিয়ে প্রতি ৪ মিনিটে পিং করে
 */

const https = require("https");
const http = require("http");

if (!global.__juwelKeepAlive) {
  global.__juwelKeepAlive = true;

  const PORT = Number(process.env.PORT) || 3000;
  const INTERVAL_MS = Number(process.env.KEEPALIVE_INTERVAL_MS) || 4 * 60 * 1000;
  const TARGET = (process.env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL || "").trim();

  // health সার্ভার: Render এই পোর্টই চেক করে
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bot is alive");
  });
  server.on("error", (e) => console.log(`[KEEPALIVE] server error: ${e.message}`));
  server.listen(PORT, "0.0.0.0", () => console.log(`[KEEPALIVE] health সার্ভার চালু, পোর্ট ${PORT}`));

  // Main.js (child) যদি নিজের সার্ভার চালায়, সে যেন অন্য পোর্ট পায়
  process.env.KEEPALIVE_PORT = String(PORT);
  process.env.PORT = String(PORT + 1);

  function ping(url) {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: 20000, headers: { "User-Agent": "self-keepalive" } }, (res) => {
      res.resume();
      console.log(`[KEEPALIVE] ${new Date().toISOString()} -> ${url} (${res.statusCode})`);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => console.log(`[KEEPALIVE] ping failed: ${e.message}`));
  }

  if (!TARGET) {
    console.log("[KEEPALIVE] RENDER_EXTERNAL_URL নেই (লোকাল রান?), পিং বন্ধ।");
  } else {
    console.log(`[KEEPALIVE] চালু: ${TARGET} প্রতি ${Math.round(INTERVAL_MS / 60000)} মিনিটে পিং`);
    setTimeout(() => {
      ping(TARGET);
      setInterval(() => ping(TARGET), INTERVAL_MS);
    }, 30 * 1000);
  }
}

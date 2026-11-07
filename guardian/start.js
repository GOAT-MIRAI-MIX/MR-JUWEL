/**
 * Cookie Guardian — Credit: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 */
'use strict';
/**
 * বট + গার্ডিয়ান একসাথে।  চালান:  node guardian/start.js   (npm start-এর বদলে)
 *
 *  1. বট চালুর আগে একবার কুকি চেক/রিফ্রেশ (ফেল করলেও বট চালু হয়)
 *  2. Juwel.js চালায় — বটের আউটপুট হুবহু আগের মতোই দেখায়
 *  3. পিছনে প্রতি ~15 মিনিটে ব্রাউজার থেকে কুকি সিঙ্ক
 *  4. বটের লগে "সেশন মৃত" ধরা পড়লে সাথে সাথে রিফ্রেশ; তারপরও বট লগইন না করলে বট রিস্টার্ট
 */
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const core = require('./core');
const cfg = core.makeConfig();
const log = cfg.log;

const DEAD_RE =
  /FATAL: Session|Login failed \[FATAL\]|Fresh login failed \[FATAL\]|account_inactive|sessionExpired|not logged in/i;
const OK_RE = /Login complete|Session validated|Fresh login OK/i;
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;

const DISABLED = process.env.GUARDIAN_DISABLE === '1';
const RESTART_AFTER_MS = 180000; // কুকি লেখার পর এত সময়ে বট লগইন না করলে রিস্টার্ট
const SYNC_DEBOUNCE_MS = 120000;

let bot = null;
let shuttingDown = false;
let deliberateRestart = false;
let lastBotOkAt = 0;
let lastWriteAt = 0;
let lastReactiveSync = 0;
let lastRestartAt = 0;
let stopLoop = null;

cfg.onWrite = () => {
  lastWriteAt = Date.now();
  const t = setTimeout(() => {
    if (lastBotOkAt < lastWriteAt && Date.now() - lastRestartAt > 600000) {
      log('নতুন কুকির পরও বট লগইন করেনি — বট রিস্টার্ট করছি', 'warn');
      lastRestartAt = Date.now();
      restartBot();
    }
  }, RESTART_AFTER_MS);
  if (t.unref) t.unref();
};

function scan(line) {
  const text = line.replace(ANSI_RE, '');
  if (OK_RE.test(text)) lastBotOkAt = Date.now();
  if (DEAD_RE.test(text) && !DISABLED && Date.now() - lastReactiveSync > SYNC_DEBOUNCE_MS) {
    lastReactiveSync = Date.now();
    log('বটের লগে সেশন-মৃত সংকেত ধরা পড়েছে — কুকি রিফ্রেশ করছি', 'warn');
    core.syncOnce(cfg, { force: true, reason: 'bot-reported-session-dead' }).catch((e) => log(e.message, 'error'));
  }
}

function pipeLines(stream, sink) {
  let buf = '';
  stream.on('data', (chunk) => {
    sink.write(chunk);
    buf += chunk.toString('utf8');
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      scan(buf.slice(0, i));
      buf = buf.slice(i + 1);
    }
    if (buf.length > 20000) buf = buf.slice(-2000);
  });
}

function startBot() {
  bot = spawn(process.execPath, [path.join(ROOT, 'Juwel.js')], {
    cwd: ROOT,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, ...(process.stdout.isTTY ? { FORCE_COLOR: '1' } : {}) }
  });
  pipeLines(bot.stdout, process.stdout);
  pipeLines(bot.stderr, process.stderr);

  bot.on('close', (code, signal) => {
    bot = null;
    if (shuttingDown) return process.exit(0);
    if (deliberateRestart) {
      deliberateRestart = false;
      return setTimeout(startBot, 2000);
    }
    if (code === 0 && !signal) {
      log('বট স্বাভাবিকভাবে বন্ধ হয়েছে');
      return process.exit(0);
    }
    log(`বট বন্ধ (code=${code} signal=${signal || '-'}), ৫ সেকেন্ডে আবার চালু`, 'warn');
    setTimeout(startBot, 5000);
  });
}

function restartBot() {
  if (!bot) return;
  deliberateRestart = true;
  bot.kill('SIGTERM');
  setTimeout(() => bot && bot.kill('SIGKILL'), 8000).unref();
}

function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (stopLoop) stopLoop();
  if (bot) {
    bot.kill(sig);
    setTimeout(() => process.exit(0), 4000).unref();
  } else {
    process.exit(0);
  }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

(async () => {
  if (!DISABLED) {
    try {
      const res = await Promise.race([
        core.syncOnce(cfg, { reason: 'startup' }),
        new Promise((r) => setTimeout(() => r({ state: 'timeout' }), 180000))
      ]);
      log(`চালুর আগের কুকি চেক: ${res.state}${res.reason ? ' (' + res.reason + ')' : ''}`);
      stopLoop = core.runForever(cfg, { skipFirst: true });
    } catch (e) {
      log('গার্ডিয়ান বন্ধ রেখে বট চালু হচ্ছে: ' + e.message, 'warn');
    }
  }
  startBot();
})();

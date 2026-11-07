/**
 * Cookie Guardian — Credit: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 */
'use strict';
/**
 * Cookie Guardian — core
 *
 * কাজ: একটা আসল ব্রাউজার প্রোফাইল (বা আপনার নিজের চালানো ব্রাউজার, CDP দিয়ে) থেকে
 * Facebook কুকি নিয়ে appstate.json আপডেট রাখা। ফেসবুক লগআউট হলে নিজের দেওয়া
 * ইমেইল/পাসওয়ার্ড (+ ঐচ্ছিক TOTP) দিয়ে আবার লগইন করে নতুন কুকি সেভ করা।
 *
 * যা এটা কখনো করে না: captcha / checkpoint / ID-verification টপকানো। ওসব এলে থেমে গিয়ে
 * "needs_human" স্ট্যাটাস লিখে — আপনাকে নিজে সমাধান করতে হবে।
 */
const fs = require('fs');
const path = require('path');
const { totp } = require('./totp');

const ROOT = path.resolve(__dirname, '..');
const SESSION_KEYS = ['c_user', 'xs'];
const CODE_SELECTOR =
  'input[name="approvals_code"], input[autocomplete="one-time-code"], input[name="code"]';

/* ───────────────────────── config ───────────────────────── */

function stamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
function defaultLog(msg, level = 'info') {
  const tag = level === 'error' ? 'ERR ' : level === 'warn' ? 'WARN' : 'INFO';
  console.log(`[guardian ${stamp()}] ${tag} ${msg}`);
}

// ছোট .env পাঠক (dotenv লাগে না); আগে থেকে সেট করা এনভায়রনমেন্ট ভেরিয়েবল বদলায় না
function loadDotEnv() {
  try {
    const text = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith('#')) continue;
      const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  } catch (_) {}
}

// AUTO_COOKIE.js ফাইল থেকে ইমেইল/পাসওয়ার্ড পড়ে (না থাকলে খালি)
function loadAutoCookie() {
  try {
    return require('./AUTO_COOKIE.js') || {};
  } catch (_) {
    return {};
  }
}

function makeConfig(over = {}) {
  loadDotEnv();
  const AC = loadAutoCookie();
  const env = process.env;
  const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
  const bool = (v, d) => (v === undefined || v === '' ? d : !/^(0|false|no|off)$/i.test(String(v)));

  let appName = 'appstate.json';
  try {
    appName = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).APPSTATEPATH || appName;
  } catch (_) {}

  const base = (env.FB_BASE_URL || 'https://www.facebook.com').replace(/\/+$/, '');
  const stateDir = path.resolve(env.GUARDIAN_DIR || path.join(ROOT, '.guardian'));

  return Object.assign(
    {
      root: ROOT,
      base,
      host: new URL(base).hostname,
      appstatePath: env.APPSTATE_PATH ? path.resolve(env.APPSTATE_PATH) : path.resolve(ROOT, appName),
      stateDir,
      profileDir: path.resolve(env.FB_PROFILE_DIR || path.join(stateDir, 'profile')),
      statusPath: path.join(stateDir, 'status.json'),
      cdpUrl: env.FB_CDP_URL || '',
      headless: bool(env.FB_HEADLESS, true),
      channel: env.FB_BROWSER_CHANNEL || '',
      executablePath: env.FB_EXECUTABLE_PATH || '',
      email: env.FB_EMAIL || AC.EMAIL || '',
      password: env.FB_PASSWORD || AC.PASSWORD || '',
      totpSecret: env.FB_TOTP_SECRET || AC.TOTP_SECRET || '',
      intervalMs: num(env.GUARDIAN_INTERVAL_MIN, 15) * 60000,
      credCooldownMs: num(env.GUARDIAN_LOGIN_COOLDOWN_MIN, 30) * 60000,
      maxCredFailures: num(env.GUARDIAN_MAX_LOGIN_FAILURES, 3),
      navTimeout: 45000,
      log: defaultLog,
      onWrite: null
    },
    over
  );
}

/* ───────────────────────── status file ───────────────────────── */

function ensureStateDir(cfg) {
  fs.mkdirSync(cfg.stateDir, { recursive: true });
  // প্রোফাইলে কুকি থাকে — ভুলেও git-এ যেন না যায়
  const gi = path.join(cfg.stateDir, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, '*\n');
}

function readStatus(cfg) {
  try {
    return JSON.parse(fs.readFileSync(cfg.statusPath, 'utf8'));
  } catch (_) {
    return {};
  }
}

function writeStatus(cfg, patch) {
  ensureStateDir(cfg);
  const next = Object.assign({}, readStatus(cfg), patch, { updatedAt: new Date().toISOString() });
  fs.writeFileSync(cfg.statusPath, JSON.stringify(next, null, 2), { mode: 0o600 });
  return next;
}

/* ───────────────────────── appstate helpers ───────────────────────── */

function domainRelevant(cfg, domain) {
  const d = String(domain || '').replace(/^\./, '');
  return d === cfg.host || cfg.host.endsWith('.' + d) || d.endsWith('.' + cfg.host);
}

function toAppState(cfg, cookies) {
  const now = new Date().toISOString();
  const seen = new Set();
  const out = [];
  for (const c of cookies) {
    if (!domainRelevant(cfg, c.domain)) continue;
    const k = `${c.name}|${c.domain}|${c.path}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      key: c.name,
      value: c.value,
      domain: String(c.domain).replace(/^\./, ''),
      path: c.path || '/',
      hostOnly: !String(c.domain).startsWith('.'),
      creation: now,
      lastAccessed: now
    });
  }
  return out;
}

function toPlaywrightCookies(cfg, appState) {
  const secure = cfg.base.startsWith('https');
  const exp = Math.floor(Date.now() / 1000) + 180 * 86400;
  return appState
    .filter((c) => c && c.key && typeof c.value === 'string')
    .map((c) => ({
      name: c.key,
      value: c.value,
      domain: c.hostOnly ? c.domain : '.' + String(c.domain || cfg.host).replace(/^\./, ''),
      path: c.path || '/',
      secure,
      expires: exp
    }));
}

function getVal(list, key) {
  const hit = (list || []).find((c) => (c.key || c.name) === key);
  return hit ? hit.value : undefined;
}
function hasSession(list) {
  return SESSION_KEYS.every((k) => getVal(list, k));
}

function readAppState(cfg) {
  try {
    const parsed = JSON.parse(fs.readFileSync(cfg.appstatePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function writeAppState(cfg, appState) {
  const file = cfg.appstatePath;
  if (fs.existsSync(file)) {
    try {
      fs.copyFileSync(file, file + '.bak');
    } catch (_) {}
  }
  const tmp = file + '.guardian.tmp';
  fs.writeFileSync(tmp, JSON.stringify(appState, null, '\t'), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

/* ───────────────────────── browser ───────────────────────── */

function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) {
    try {
      return require(name);
    } catch (_) {}
  }
  const e = new Error(
    'playwright ইনস্টল করা নেই। চালান: npm i --no-save playwright && npx playwright install chromium'
  );
  e.code = 'NO_PLAYWRIGHT';
  throw e;
}

async function openBrowser(cfg, { headless } = {}) {
  const pw = loadPlaywright();
  ensureStateDir(cfg);
  if (cfg.cdpUrl) {
    // আপনার নিজের চালানো ব্রাউজারে যুক্ত হওয়া (chrome --remote-debugging-port=9222 ...)
    const browser = await pw.chromium.connectOverCDP(cfg.cdpUrl);
    const context = browser.contexts()[0] || (await browser.newContext());
    return { context, external: true, close: async () => browser.close().catch(() => {}) };
  }
  const context = await pw.chromium.launchPersistentContext(cfg.profileDir, {
    headless: headless === undefined ? cfg.headless : headless,
    channel: cfg.channel || undefined,
    executablePath: cfg.executablePath || undefined,
    viewport: { width: 1280, height: 800 },
    locale: 'en-US'
  });
  return { context, external: false, close: async () => context.close().catch(() => {}) };
}

async function settle(page, ms = 1500) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function go(cfg, page, p) {
  await page.goto(cfg.base + p, { waitUntil: 'domcontentloaded', timeout: cfg.navTimeout });
  await settle(page);
}

async function dismissCookieBanner(page) {
  try {
    await page
      .getByRole('button', { name: /allow all cookies|accept all|allow essential and optional|decline optional cookies/i })
      .first()
      .click({ timeout: 1500 });
    await page.waitForTimeout(500);
  } catch (_) {}
}

/** পেজ এখন কী অবস্থায় আছে তা বলে: loggedIn / 2fa / checkpoint / captcha / logged-out */
async function inspect(cfg, context, page) {
  const cookies = await context.cookies(cfg.base);
  const session = hasSession(cookies);
  let pathname = '/';
  try {
    pathname = new URL(page.url()).pathname;
  } catch (_) {}

  const loginForm = (await page.locator('input[name="pass"]').count().catch(() => 0)) > 0;
  const codeInput = (await page.locator(CODE_SELECTOR).count().catch(() => 0)) > 0;
  const captcha =
    (await page.locator('iframe[src*="recaptcha"], img[src*="captcha"]').count().catch(() => 0)) > 0;

  let kind = null;
  if (codeInput) kind = '2fa';
  else if (/checkpoint|two_step_verification|\/recover|login\/identify/i.test(pathname)) kind = 'checkpoint';
  else if (captcha) kind = 'captcha';

  const loggedIn = session && !loginForm && !kind && !/^\/login/i.test(pathname);
  return { loggedIn, kind, loginForm, session, pathname };
}

async function loginWithCredentials(cfg, context, page) {
  const log = cfg.log;
  // শুধু সেশন কুকি মুছি; datr/sb (ডিভাইস চেনার কুকি) রাখি — নতুন ডিভাইস মনে হলে checkpoint ঝুঁকি বাড়ে
  for (const name of SESSION_KEYS) await context.clearCookies({ name }).catch(() => {});

  await go(cfg, page, '/login');
  await dismissCookieBanner(page);

  const emailBox = page.locator('input[name="email"]').first();
  const passBox = page.locator('input[name="pass"]').first();
  if (!(await emailBox.count()) || !(await passBox.count())) {
    return { ok: false, reason: 'login_form_not_found' };
  }
  await emailBox.fill(cfg.email);
  await passBox.fill(cfg.password);
  await passBox.press('Enter');
  await settle(page, 3000);

  let codeTries = 0;
  for (let step = 0; step < 6; step++) {
    const st = await inspect(cfg, context, page);
    if (st.loggedIn) return { ok: true };

    if (st.kind === '2fa') {
      if (!cfg.totpSecret) return { ok: false, reason: 'needs_human:2fa_no_secret' };
      if (++codeTries > 2) return { ok: false, reason: 'twofa_code_rejected' };
      log('2FA কোড চাইছে — TOTP দিয়ে পূরণ করছি');
      await page.locator(CODE_SELECTOR).first().fill(totp(cfg.totpSecret));
      await page.locator(CODE_SELECTOR).first().press('Enter');
      await settle(page, 2500);
      continue;
    }
    if (st.kind === 'checkpoint' || st.kind === 'captcha') {
      return { ok: false, reason: 'needs_human:' + st.kind };
    }

    // "Trust this device / Save browser" ধরনের নিরীহ ধাপ
    const trust = page
      .getByRole('button', { name: /trust this device|save browser|remember browser|^continue$|^ok$/i })
      .first();
    if (await trust.count().catch(() => 0)) {
      await trust.click({ timeout: 3000 }).catch(() => {});
      await settle(page, 2000);
      continue;
    }

    if (st.loginForm) {
      const text = await page.locator('body').innerText().catch(() => '');
      if (
        /incorrect|wrong password|password.{0,40}(not|n.t) (correct|match)|isn.t connected to an account|doesn.t match any account|not match any account/i.test(
          text
        )
      ) {
        return { ok: false, reason: 'bad_credentials' };
      }
    }
    await page.waitForTimeout(2500);
  }
  return { ok: false, reason: 'login_failed_unknown' };
}

/* ───────────────────────── main sync ───────────────────────── */

let running = false;

/**
 * একবার চেক করে: ব্রাউজার লগইন আছে? → কুকি appstate.json-এ লিখে।
 * লগআউট? → (সম্ভব হলে) ক্রেডেনশিয়াল দিয়ে লগইন → কুকি লিখে।
 * opts.force = true হলে কুকি একই থাকলেও ফাইল নতুন করে লেখে।
 */
async function syncOnce(cfg, opts = {}) {
  if (running) return { state: 'busy' };
  running = true;
  const log = cfg.log;
  let session = null;
  try {
    ensureStateDir(cfg);
    const status = readStatus(cfg);
    session = await openBrowser(cfg);
    const { context } = session;
    const page = context.pages()[0] || (await context.newPage());

    // ব্রাউজারে সেশন না থাকলে বর্তমান appstate.json থেকে বসিয়ে দেই (সার্ভারে প্রথমবার চালুর জন্য)
    const existing = readAppState(cfg);
    if (!hasSession(await context.cookies(cfg.base)) && existing && hasSession(existing)) {
      await context.addCookies(toPlaywrightCookies(cfg, existing));
      log('ব্রাউজার প্রোফাইলে appstate.json-এর কুকি বসানো হলো');
    }

    await go(cfg, page, '/');
    await dismissCookieBanner(page);
    let st = await inspect(cfg, context, page);

    if (!st.loggedIn) {
      log(`ফেসবুক লগইন নেই (${st.kind || (st.loginForm ? 'login-page' : 'no-session')})`, 'warn');

      if (st.kind === 'checkpoint' || st.kind === 'captcha' || st.kind === '2fa') {
        // ব্রাউজারটাই checkpoint-এ আটকে আছে; ক্রেডেনশিয়ালে 2FA হলে নিচের ধাপে সামলাব
        if (st.kind !== '2fa' || !cfg.totpSecret) {
          writeStatus(cfg, { state: 'needs_human', reason: st.kind, blocked: true });
          log(`আপনার হাতে সমাধান দরকার (${st.kind}) — গার্ডিয়ান থেমে আছে`, 'error');
          return { state: 'needs_human', reason: st.kind };
        }
      }

      if (!cfg.email || !cfg.password) {
        writeStatus(cfg, { state: 'logged_out_no_credentials' });
        log('FB_EMAIL / FB_PASSWORD সেট করা নেই, তাই অটো-লগইন করা গেল না', 'warn');
        return { state: 'logged_out_no_credentials' };
      }
      if (status.blocked && !opts.ignoreBlock) {
        log(`অটো-লগইন বন্ধ আছে (${status.reason}). সমাধান করে চালান: node guardian/cli.js unblock`, 'warn');
        return { state: 'blocked', reason: status.reason };
      }
      const since = Date.now() - (status.lastCredAttemptAt || 0);
      if (since < cfg.credCooldownMs && !opts.ignoreBlock) {
        log(`অটো-লগইন cooldown চলছে (আরও ${Math.ceil((cfg.credCooldownMs - since) / 60000)} মিনিট)`, 'warn');
        return { state: 'cooldown' };
      }

      log('ইমেইল/পাসওয়ার্ড দিয়ে অটো-লগইন চেষ্টা করছি…');
      writeStatus(cfg, { lastCredAttemptAt: Date.now() });
      const res = await loginWithCredentials(cfg, context, page);

      if (!res.ok) {
        const fatal = res.reason === 'bad_credentials' || res.reason.startsWith('needs_human');
        const failures = (status.credFailures || 0) + 1;
        const block = fatal || failures >= cfg.maxCredFailures;
        writeStatus(cfg, {
          state: fatal ? 'needs_human' : 'login_failed',
          reason: res.reason,
          credFailures: failures,
          blocked: block
        });
        log(`অটো-লগইন ব্যর্থ: ${res.reason}${block ? ' — আর চেষ্টা করব না, আপনি দেখুন' : ''}`, 'error');
        return { state: 'login_failed', reason: res.reason };
      }
      log('অটো-লগইন সফল');
      st = await inspect(cfg, context, page);
    }

    // এখানে এলে ব্রাউজার লগইন আছে → কুকি এক্সপোর্ট
    const fresh = toAppState(cfg, await context.cookies(cfg.base));
    if (!hasSession(fresh)) {
      writeStatus(cfg, { state: 'error', reason: 'no_session_cookies_after_login' });
      return { state: 'error', reason: 'no_session_cookies_after_login' };
    }
    const current = readAppState(cfg);
    const changed =
      !current ||
      getVal(current, 'c_user') !== getVal(fresh, 'c_user') ||
      getVal(current, 'xs') !== getVal(fresh, 'xs');

    let wrote = false;
    if (changed || opts.force) {
      writeAppState(cfg, fresh);
      wrote = true;
      log(`appstate.json আপডেট হয়েছে (${opts.reason || (changed ? 'কুকি বদলেছে' : 'force')})`);
    }
    writeStatus(cfg, {
      state: 'ok',
      reason: null,
      blocked: false,
      credFailures: 0,
      lastOkAt: new Date().toISOString(),
      uid: getVal(fresh, 'c_user')
    });
    if (wrote && typeof cfg.onWrite === 'function') {
      try {
        cfg.onWrite({ reason: opts.reason });
      } catch (_) {}
    }
    return { state: 'ok', wrote };
  } catch (err) {
    if (err && err.code === 'NO_PLAYWRIGHT') throw err;
    cfg.log('গার্ডিয়ান ত্রুটি: ' + (err && err.message), 'error');
    writeStatus(cfg, { state: 'error', reason: String(err && err.message).slice(0, 300) });
    return { state: 'error', reason: err && err.message };
  } finally {
    running = false;
    if (session) await session.close();
  }
}

function clearBlock(cfg) {
  return writeStatus(cfg, { blocked: false, credFailures: 0, reason: null, lastCredAttemptAt: 0 });
}

/** প্রতি intervalMs পরপর syncOnce। stop() ফেরত দেয়। */
function runForever(cfg, { skipFirst = false } = {}) {
  let stopped = false;
  let timer = null;
  const tick = async () => {
    if (stopped) return;
    try {
      await syncOnce(cfg, { reason: 'periodic' });
    } catch (e) {
      cfg.log(e.message, 'error');
      if (e.code === 'NO_PLAYWRIGHT') return; // আর চেষ্টা করে লাভ নেই
    }
    if (!stopped) timer = setTimeout(tick, cfg.intervalMs * (0.9 + Math.random() * 0.2));
  };
  timer = setTimeout(tick, skipFirst ? cfg.intervalMs : 0);
  if (timer.unref) timer.unref();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/** হেডফুল ব্রাউজার খুলে আপনি নিজে লগইন করবেন; লগইন ধরা পড়লেই কুকি সেভ। */
async function manualLogin(cfg, { timeoutMs = 15 * 60000 } = {}) {
  const session = await openBrowser(cfg, { headless: false });
  try {
    const page = session.context.pages()[0] || (await session.context.newPage());
    await go(cfg, page, '/');
    cfg.log('ব্রাউজারে ফেসবুকে লগইন করুন (checkpoint/2FA হলে সেটাও নিজে শেষ করুন)। লগইন ধরা পড়লে নিজে থেকে সেভ হবে।');
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      await page.waitForTimeout(3000);
      const st = await inspect(cfg, session.context, page).catch(() => ({ loggedIn: false }));
      if (st.loggedIn) {
        const fresh = toAppState(cfg, await session.context.cookies(cfg.base));
        writeAppState(cfg, fresh);
        clearBlock(cfg);
        writeStatus(cfg, { state: 'ok', lastOkAt: new Date().toISOString(), uid: getVal(fresh, 'c_user') });
        cfg.log('লগইন ধরা পড়েছে, appstate.json সেভ হয়েছে ✅');
        return true;
      }
    }
    cfg.log('সময় শেষ — লগইন ধরা পড়েনি', 'error');
    return false;
  } finally {
    await session.close();
  }
}

module.exports = {
  makeConfig,
  syncOnce,
  runForever,
  manualLogin,
  clearBlock,
  readStatus,
  toAppState,
  toPlaywrightCookies
};

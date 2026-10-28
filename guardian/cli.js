#!/usr/bin/env node
/**
 * Cookie Guardian — Credit: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 */
'use strict';
const core = require('./core');

const cmd = process.argv[2] || 'help';
const cfg = core.makeConfig();

const HELP = `
Cookie Guardian

  node guardian/cli.js login     হেডফুল ব্রাউজার খুলে আপনি নিজে লগইন করবেন → কুকি সেভ (ডিসপ্লে লাগবে)
  node guardian/cli.js sync      একবার চেক + দরকারে অটো-লগইন + appstate.json আপডেট
  node guardian/cli.js sync -f   কুকি একই থাকলেও appstate.json নতুন করে লেখে
  node guardian/cli.js watch     প্রতি GUARDIAN_INTERVAL_MIN মিনিটে sync (বটের সাথে আলাদা টার্মিনালে)
  node guardian/cli.js status    শেষ অবস্থা দেখায়
  node guardian/cli.js unblock   needs_human/ব্লক অবস্থা পরিষ্কার করে (নিজে সমাধান করার পর)

বট + গার্ডিয়ান একসাথে চালাতে:  node guardian/start.js
`;

(async () => {
  try {
    if (cmd === 'login') {
      process.exit((await core.manualLogin(cfg)) ? 0 : 1);
    } else if (cmd === 'sync') {
      const res = await core.syncOnce(cfg, {
        reason: 'cli',
        force: process.argv.includes('-f'),
        ignoreBlock: process.argv.includes('--ignore-block')
      });
      console.log(res);
      process.exit(res.state === 'ok' ? 0 : 1);
    } else if (cmd === 'watch') {
      core.runForever(cfg);
      setInterval(() => {}, 1 << 30);
    } else if (cmd === 'status') {
      console.log(core.readStatus(cfg));
    } else if (cmd === 'unblock') {
      console.log(core.clearBlock(cfg));
    } else {
      console.log(HELP);
    }
  } catch (e) {
    console.error('ত্রুটি:', e.message);
    process.exit(1);
  }
})();

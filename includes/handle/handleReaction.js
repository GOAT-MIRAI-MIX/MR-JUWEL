// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════
module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    const { handleReaction, commands } = global.client;
    const { messageID, threadID, reaction, userID } = event;

    // 🦵 সাইলেন্ট কিক: বট অ্যাডমিন 🦵 দিলে
    //   - অন্য কারো মেসেজে  -> বট গ্রুপ অ্যাডমিন হলে তাকে কিক
    //   - বটের নিজের মেসেজে -> বট নিজে গ্রুপ ছেড়ে দিবে
    // কোনো মেসেজ পাঠানো হবে না (সম্পূর্ণ সাইলেন্ট)
    if (reaction && String(reaction).includes('🦵')) {
      try {
        const cfg = global.config || {};
        const adminBot = [...new Set(
          [...(cfg.ADMINBOT || []), ...(cfg.DEVELOPER || [])].map(String)
        )];
        const reactor = String(userID || '');
        if (!reactor || !adminBot.includes(reactor)) return;

        const isGroup = event.isGroup !== undefined
          ? !!event.isGroup
          : String(threadID).length > 16;
        if (!isGroup) return;

        const botID = String(api.getCurrentUserID());

        // মেসেজের মালিক বের করা
        let author = String(event.messageSenderID || event.senderID || '');
        if (!author || author === reactor) {
          author = await new Promise(resolve => {
            let done = false;
            const finish = v => { if (!done) { done = true; resolve(v); } };
            setTimeout(() => finish(''), 8000);
            try {
              if (typeof api.getMessage !== 'function') return finish('');
              const r = api.getMessage(threadID, messageID, (err, data) =>
                finish(err || !data ? '' : String(data.senderID || data.author || ''))
              );
              if (r && typeof r.then === 'function') {
                r.then(d => finish(d ? String(d.senderID || d.author || '') : ''))
                 .catch(() => finish(''));
              }
            } catch (e) { finish(''); }
          });
        }
        if (!author) return;

        // বটের নিজের মেসেজ -> বট গ্রুপ ছাড়বে
        if (author === botID) {
          api.removeUserFromGroup(botID, threadID, err => {
            if (err) console.log('[reactkick] leave error:', err);
          });
          return;
        }

        // বট অ্যাডমিনকে কিক করা যাবে না
        if (adminBot.includes(author)) return;

        // বট গ্রুপ অ্যাডমিন কিনা চেক
        const info = await Threads.getInfo(threadID);
        const botIsAdmin = (info.adminIDs || []).some(a => String(a && a.id !== undefined ? a.id : a) === botID);
        if (!botIsAdmin) return;

        api.removeUserFromGroup(author, threadID, err => {
          if (err) console.log('[reactkick] kick error:', err);
        });
      } catch (e) {
        console.log('[reactkick] error:', e);
      }
      return;
    }

    // ❌ আনসেন্ড
    if (reaction === '❌') {
      return api.unsendMessage(messageID);
    }

    // কাস্টম হ্যান্ডলার (আগের মতোই)
    if (handleReaction.length !== 0) {
      const idx = handleReaction.findIndex(e => e.messageID == messageID);
      if (idx < 0) return;
      const handle = handleReaction[idx];
      const cmd = commands.get(handle.name);
      if (!cmd) {
        return api.sendMessage(global.getText('handleReaction', 'missingValue'), threadID, messageID);
      }
      try {
        let getText2 = () => {};
        if (cmd.languages && typeof cmd.languages == 'object') {
          getText2 = (...value) => {
            const react = cmd.languages || {};
            if (!react.hasOwnProperty(global.config.language)) {
              return api.sendMessage(
                global.getText('handleCommand', 'notFoundLanguage', cmd.config.name),
                threadID, messageID
              );
            }
            let lang = react[global.config.language][value[0]] || '';
            for (let i = value.length; i > 0; i--) {
              lang = lang.replace(RegExp('%' + i, 'g'), value[i]);
            }
            return lang;
          };
        }
        cmd.handleReaction({ api, event, models, Users, Threads, Currencies, handleReaction: handle, getText: getText2 });
      } catch (error) {
        return api.sendMessage(global.getText('handleReaction', 'executeError', error), threadID, messageID);
      }
    }
  };
};

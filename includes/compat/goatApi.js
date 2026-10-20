// 🔧 compat/goatApi.js
// গোট বট (GoatBot) / Mirai স্টাইলের কমান্ড ফাইলগুলো (onStart, message, usersData,
// threadsData ইত্যাদি ব্যবহার করে) এই বটের সাথে চালানোর জন্য হেল্পার।
// এই ফাইলটা শুধু "অবজেক্ট বিল্ডার" — কোনো হ্যান্ডলার লজিক পরিবর্তন করে না।

function buildMessage(api, event) {
  const threadID = event.threadID;
  const messageID = event.messageID;

  const message = {
    reply(msg, replyCb) {
      return api.sendMessage(msg, threadID, replyCb, messageID);
    },
    send(msg, tid, sendCb) {
      return api.sendMessage(msg, tid || threadID, sendCb);
    },
    unsend(mid) {
      return api.unsendMessage(mid || messageID);
    },
    react(emoji, mid) {
      if (typeof api.setMessageReaction === 'function') {
        return api.setMessageReaction(emoji, mid || messageID, () => {}, true);
      }
    },
    typing(cb) {
      if (typeof api.sendTypingIndicator === 'function') return api.sendTypingIndicator(threadID, cb);
    }
  };
  // কিছু ফ্রেমওয়ার্কে Reply বড় হাতের R দিয়ে ব্যবহার হয়
  message.Reply = message.reply;
  message.Send = message.send;
  return message;
}

function buildUsersData(Users, Currencies) {
  return {
    async get(id) {
      let u = {};
      let c = {};
      try { u = (await Users.getData(id)) || {}; } catch (e) {}
      try { c = (await Currencies.getData(id)) || {}; } catch (e) {}
      return Object.assign(
        { userID: String(id), name: u.name || '', exp: c.exp || 0, money: c.money || 0 },
        u.data || {}
      );
    },
    async set(id, value, key) {
      if (key) {
        const cur = (await Users.getData(id)) || {};
        const data = cur.data || {};
        data[key] = value;
        return Users.setData(id, { data });
      }
      return Users.setData(id, value);
    },
    getAll: (...a) => Users.getAll(...a),
    delete: (id) => Users.delData(id),
    create: (id, d) => Users.createData(id, d || {}),
    getName: (id) => Users.getNameUser(id),
    increaseMoney: (id, amount) => Currencies.increaseMoney(id, amount),
    decreaseMoney: (id, amount) => Currencies.decreaseMoney(id, amount)
  };
}

function buildThreadsData(Threads) {
  return {
    async get(id) {
      let t = {};
      try { t = (await Threads.getData(id)) || {}; } catch (e) {}
      return Object.assign({ threadID: String(id) }, t.threadInfo || {}, t.data || {});
    },
    async set(id, value, key) {
      if (key) {
        const cur = (await Threads.getData(id)) || {};
        const data = cur.data || {};
        data[key] = value;
        return Threads.setData(id, { data });
      }
      return Threads.setData(id, value);
    },
    getAll: (...a) => Threads.getAll(...a),
    delete: (id) => Threads.delData(id),
    create: (id, d) => Threads.createData(id, d || {}),
    getInfo: (id) => Threads.getInfo(id)
  };
}

module.exports = { buildMessage, buildUsersData, buildThreadsData };

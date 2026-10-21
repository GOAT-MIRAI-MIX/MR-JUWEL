// 🔧 Goat-স্টাইল onChat / onAnyEvent / onFirstChat ডিসপ্যাচ (মিরাই কমান্ড এতে প্রভাবিত হয় না)
const runtime = require("../compat/goatRuntime");

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return function ({ event }) {
    try {
      // message_unsend-এ body থাকে না, কিন্তু Goat কমান্ড (যেমন resend) সেটা চায়
      if (!event.body && event.type !== "message_unsend" && !(event.attachments && event.attachments.length)) return;
      runtime.dispatchChat({ api, event, models, Users, Threads, Currencies });
    } catch (error) {
      try { require("../../utils/log.js")("onChat dispatch error: " + (error && error.message), "error"); }
      catch (e2) { console.log(error); }
    }
  };
};

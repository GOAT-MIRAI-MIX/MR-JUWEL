// MR JUWEL - FCA diagnostics (v2).
// Logs failures of sendMessage / getThreadInfo / getUserInfo to the console
// and prints a startup self-test. Command: <prefix>fcadiag (bot admin only).
// It never changes what these functions return.

const COOKIE_NEEDED = ["c_user", "xs", "datr"];

function short(v, n) {
  let s;
  try {
    s = typeof v === "string" ? v : (v && (v.error || v.message)) || JSON.stringify(v);
  } catch (e) {
    s = String(v);
  }
  s = String(s || "unknown");
  return s.length > (n || 300) ? s.slice(0, n || 300) + "..." : s;
}

function log(tag, msg) {
  console.log("[JUWEL-DIAG] " + tag + " " + msg);
}

// check(data) returns a problem text, or "" when the data looks fine.
function wrapLogging(api, name, check) {
  const flag = "__juwelLog_" + name;
  if (!api || api[flag] || typeof api[name] !== "function") return;
  const orig = api[name];
  api[name] = function () {
    const args = Array.prototype.slice.call(arguments);
    const target = args[name === "sendMessage" ? 1 : 0];
    const label = name + " target=" + (Array.isArray(target) ? target.join(",") : target);
    let cbIndex = -1;
    for (let i = 1; i < args.length; i++) {
      if (typeof args[i] === "function") {
        cbIndex = i;
        break;
      }
    }
    if (cbIndex > -1) {
      const cb = args[cbIndex];
      args[cbIndex] = function (err, data) {
        if (err) log("FAILED " + label, short(err));
        else if (check) {
          const p = check(data);
          if (p) log("BAD RESULT " + label, p);
        }
        return cb.apply(this, arguments);
      };
      return orig.apply(this, args);
    }
    const result = orig.apply(this, args);
    if (result && typeof result.then === "function") {
      result.then(
        function (data) {
          const p = check ? check(data) : "";
          if (p) log("BAD RESULT " + label, p);
        },
        function (err) {
          log("FAILED " + label, short(err));
        }
      );
    }
    return result;
  };
  api[flag] = true;
}

function wrapAll(api) {
  wrapLogging(api, "sendMessage", null);
  wrapLogging(api, "getThreadInfo", function (d) {
    return d && d.adminIDs ? "" : "no adminIDs in thread info (commands will stop here)";
  });
  wrapLogging(api, "getUserInfo", function (d) {
    return d && Object.keys(d).length ? "" : "empty user info";
  });
}

function cookieReport(api) {
  try {
    const state = typeof api.getAppState === "function" ? api.getAppState() : [];
    const names = (state || []).map(function (c) {
      return c.key || c.name;
    });
    const missing = COOKIE_NEEDED.filter(function (n) {
      return names.indexOf(n) === -1;
    });
    return { count: names.length, missing: missing };
  } catch (e) {
    return { count: 0, missing: COOKIE_NEEDED };
  }
}

function tryCall(fn, validate) {
  return new Promise(function (resolve) {
    const timer = setTimeout(function () {
      resolve("TIMEOUT (no answer in 15s)");
    }, 15000);
    try {
      const out = fn(function (err, data) {
        clearTimeout(timer);
        if (err) return resolve("FAILED: " + short(err));
        const p = validate ? validate(data) : "";
        resolve(p ? "BAD: " + p : "OK");
      });
      if (out && typeof out.then === "function") {
        out.then(
          function (data) {
            clearTimeout(timer);
            const p = validate ? validate(data) : "";
            resolve(p ? "BAD: " + p : "OK");
          },
          function (err) {
            clearTimeout(timer);
            resolve("FAILED: " + short(err));
          }
        );
      }
    } catch (e) {
      clearTimeout(timer);
      resolve("FAILED: " + short(e));
    }
  });
}

async function buildReport(api, threadID) {
  const lines = [];
  let uid = "unknown";
  try {
    uid = api.getCurrentUserID();
  } catch (e) {}
  const ck = cookieReport(api);
  lines.push("Account ID: " + uid);
  lines.push("Cookies: " + ck.count + (ck.missing.length ? " | MISSING: " + ck.missing.join(", ") : " | needed cookies present"));
  lines.push(
    "Read inbox: " +
      (await tryCall(function (done) {
        api.getThreadList(1, null, ["INBOX"], done);
      }))
  );
  if (threadID) {
    lines.push(
      "Thread info: " +
        (await tryCall(
          function (done) {
            api.getThreadInfo(threadID, done);
          },
          function (d) {
            return d && d.adminIDs ? "" : "no adminIDs";
          }
        ))
    );
  }
  return lines.join("\n");
}

module.exports.config = {
  name: "fcadiag",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "FCA health check: shows why commands do not work",
  commandCategory: "system",
  usages: "fcadiag",
  cooldowns: 10
};

module.exports.onLoad = function ({ api }) {
  wrapAll(api);
  setTimeout(async function () {
    try {
      log("STARTUP", "\n" + (await buildReport(api, null)));
    } catch (e) {
      log("STARTUP", "self-test error: " + short(e));
    }
  }, 20000);
};

module.exports.run = async function ({ api, event }) {
  wrapAll(api);
  const report = await buildReport(api, event.threadID);
  log("REPORT", "\n" + report);
  const sendResult = await tryCall(function (done) {
    api.sendMessage("FCA report:\n" + report, event.threadID, done);
  });
  log("REPORT", "send test: " + sendResult);
};

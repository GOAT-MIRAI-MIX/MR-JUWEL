const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

let logName = "";
let logNickName = "";
let loaded = false;

const REDACTED = "[REDACTED]";

const COOKIE_KEYS = "c_user|xs|datr|fr|sb|wd|sid|presence|spin|m_pixel_ratio|noscript|oo|lu|usida";

const APPSTATE_MARKER = new RegExp('"key"\\s*:\\s*"(?:' + COOKIE_KEYS + ')"', "i");
const APPSTATE_VALUE = /"value"\s*:\s*"[^"]*"/gi;
const COOKIE_ASSIGNMENT = new RegExp("\\b(?:" + COOKIE_KEYS + ")\\s*=\\s*([^;\"'\\s,]+)", "gi");
const SECRET_KEY_VALUE = /\b(pass(?:word|wd)?|email|otpkey|otp|secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key|authorization|cookie|session[_-]?id|fb_dtsg|jazoest|lsd)\b(\s*['"]?\s*[:=]\s*)(['"]?)([^\s,"'}\];]+)\3/gi;
const AUTH_HEADER = /\b(bearer|basic)\s+[A-Za-z0-9._\-+/=]{8,}/gi;

function redactSecrets(input) {
  let text;
  if (typeof input === "string") {
    text = input;
  } else if (input === null || typeof input === "undefined") {
    return input;
  } else {
    try {
      text = String(input.message && input.stack ? input.stack : JSON.stringify(input));
    } catch (_) {
      try {
        text = String(input);
      } catch (_) {
        return "";
      }
    }
  }

  if (!text) return text;

  if (APPSTATE_MARKER.test(text)) {
    text = text.replace(APPSTATE_VALUE, '"value":"' + REDACTED + '"');
  }

  text = text.replace(COOKIE_ASSIGNMENT, (match) => match.split("=")[0] + "=" + REDACTED);
  text = text.replace(AUTH_HEADER, (match) => match.split(/\s+/)[0] + " " + REDACTED);
  text = text.replace(SECRET_KEY_VALUE, (match, key, sep, quote) => key + sep + (quote || "") + REDACTED + (quote || ""));

  return text;
}

function randomColor() {
  let color = "";

  for (let i = 0; i < 3; i++) {
    const hex = Math.floor(Math.random() * 256).toString(16);
    color += hex.length === 1 ? "0" + hex : hex;
  }

  return "#" + color;
}

// ───────── সেটিংস ─────────
const STYLES = {
  1: { left: "────〲⪩ ", right: " ⪨🩷ꤪꜛᰔᩚ࿐" },
  2: { left: "━━━⃞⃟😽⪩ ", right: " ⪨🎀⃞⃟࿐" },
};
const STYLE = Number(process.env.LOG_STYLE) || 1;

const LEVELS = {
  info:    { icon: "ℹ️", color: "#00bfff" },
  success: { icon: "✅", color: "#00ff7f" },
  warn:    { icon: "⚠️", color: "#ffa500" },
  error:   { icon: "❌", color: "#ff0000" },
  debug:   { icon: "🐛", color: "#aaaaaa" },
};

const LOG_TO_FILE = true;
const LOG_DIR = path.join(process.cwd(), "logs");
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

// ───────── হেল্পার ─────────
function frame(t) {
  const s = STYLES[STYLE] || STYLES[1];
  return s.left + t + s.right;
}

function writeFile(level, label, text) {
  if (!LOG_TO_FILE) return;
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const now = new Date();
    const file = path.join(LOG_DIR, now.toISOString().slice(0, 10) + ".log");
    const line = "[" + now.toISOString() + "] [" + level.toUpperCase() + "] " + label + ": " + text + "\n";
    fs.appendFile(file, line, () => {});
  } catch (_) {}
}

let lastKey = "";
let repeat = 0;

function flushRepeat() {
  if (repeat > 1) {
    console.log(chalk.gray("   ↳ আগের লগটি আরও " + (repeat - 1) + " বার এসেছে"));
    repeat = 1;
  }
}

setInterval(flushRepeat, 10000).unref();

function emit(level, label, rawMessage, color, icon) {
  const text = String(redactSecrets(rawMessage));
  const key = level + "|" + label + "|" + text;

  if (key === lastKey) {
    repeat++;
    return;
  }

  flushRepeat();
  lastKey = key;
  repeat = 1;

  console.log(
    chalk.bold.hex(color)(frame(label)) + " " + (icon ? icon + " " : "") + text
  );
  writeFile(level, label, text);
}

// ───────── মূল ফাংশন ─────────
function main(message, type) {
  if (
    !loaded &&
    typeof message === "string" &&
    typeof type === "string" &&
    message.length > 0 &&
    type.length > 0 &&
    !LEVELS[type] &&
    !type.startsWith("[")
  ) {
    logName = message;
    logNickName = type;
    loaded = true;
    return main;
  }

  const lv = LEVELS[type];
  if (lv) {
    emit(type, "Log", message, lv.color, lv.icon);
  } else {
    emit("info", String(type), message, randomColor(), "");
  }
}

main.info    = (m) => main(m, "info");
main.success = (m) => main(m, "success");
main.warn    = (m) => main(m, "warn");
main.error   = (m) => main(m, "error");
main.debug   = (m) => main(m, "debug");

main.loader = (message, type) => {
  if (type === "warn") {
    emit("warn", logName, message, LEVELS.warn.color, LEVELS.warn.icon);
  } else if (type === "error") {
    emit("error", logName, message, LEVELS.error.color, LEVELS.error.icon);
  } else {
    emit("success", logNickName + " LOADED", message + "  " + CREDIT, randomColor(), LEVELS.success.icon);
  }
};

main.banner = (name, version, commandCount) => {
  const lines = [
    String(name),
    "Version  : " + version,
    "Commands : " + commandCount,
    "Credit   : " + CREDIT,
  ];
  const w = Math.max(...lines.map((l) => l.length)) + 4;
  const c = chalk.bold.hex(randomColor());
  console.log(c("╔" + "═".repeat(w) + "╗"));
  lines.forEach((l) => console.log(c("║  " + l.padEnd(w - 2) + "║")));
  console.log(c("╚" + "═".repeat(w) + "╝"));
  writeFile("info", "BANNER", lines.join(" | "));
};

main.redactSecrets = redactSecrets;
module.exports = main;

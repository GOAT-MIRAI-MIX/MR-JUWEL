const chalk = require("chalk");
const moment = require("moment-timezone");

let consoleName = "BOT";

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

// আপনার দেওয়া সব ২৬টা রঙ
const colors = [
  "FF9900", "FFFF33", "33FFFF", "FF99FF",
  "FF3366", "FFFF66", "FF00FF", "66FF99",
  "00CCFF", "FF0099", "FF0066", "7900FF",
  "93FFD8", "CFFFDC", "FF5B00", "3B44F6",
  "A6D1E6", "7F5283", "A66CFF", "F05454",
  "FCF8E8", "94B49F", "47B5FF", "B8FFF9",
  "42C2FF", "FF7396"
];

const randomColor = () =>
  "#" + colors[Math.floor(Math.random() * colors.length)];

// প্রতিটা অক্ষরে আলাদা রঙ (শুধু সাধারণ লেখার জন্য)
const rainbow = (text) =>
  Array.from(text)
    .map((ch) => chalk.hex(randomColor()).bold(ch))
    .join("");

function init(name) {
  consoleName = name || consoleName;
}

// প্রতিটা লাইনের বাম বর্ডার আলাদা রঙে
const line = (text) => chalk.hex(randomColor())("│ ") + text;

const field = (icon, label, value) =>
  line(
    chalk.hex(randomColor()).bold(`${icon} ${label.padEnd(11)}`) +
      chalk.gray("➜ ") +
      chalk.hex(randomColor())(value)
  );

const border = (l, r) => {
  const bar = "─".repeat(34);
  return Array.from(`${l}${bar}${r}`)
    .map((ch) => chalk.hex(randomColor())(ch))
    .join("");
};

function log({
  groupName = "Name does not exist",
  threadID = "Unknown",
  userName = "Unknown User",
  senderID = "Unknown",
  content = "Photos, videos or special characters"
} = {}) {
  const time = moment
    .tz("Asia/Dhaka")
    .format("dddd, DD MMMM YYYY • hh:mm:ss A");

  const out = [
    "",
    border("╭", "╮"),
    line("✦ " + rainbow(`${consoleName} LOGGER`) + " ✦"),
    border("├", "┤"),
    field("💬", "Group", groupName),
    field("🆔", "Group ID", threadID),
    field("👤", "User", userName),
    field("🔖", "User ID", senderID),
    field("📩", "Message", content),
    border("├", "┤"),
    line(chalk.hex(randomColor())(`🕒 ${time}`)),
    line(chalk.hex(randomColor()).italic(`✨ Credit: ${CREDIT}`)),
    border("╰", "╯"),
    ""
  ];

  console.log(out.join("\n"));
}

module.exports = { init, log };

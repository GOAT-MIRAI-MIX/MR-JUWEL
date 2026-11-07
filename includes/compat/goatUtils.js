// 🔧 includes/compat/goatUtils.js
//
// Credit: কিছু helper-এর লজিক Goat Bot V2 (NTKhang, MIT License — https://github.com/ntkhang03/Goat-Bot-V2)
// ও GoatBot-Pro (EryXenX) এর utils.js থেকে অনুপ্রাণিত/রূপান্তরিত।
//
// GoatBot-এর global.utils ফাংশনগুলোর (getStreamFromURL, getPrefix, convertTime ...) স্বাধীন
// সংস্করণ। এগুলো GoatBot-এর config/ডাটাবেসের ওপর নির্ভর করে না, মিরাইয়ের global.config /
// global.data দিয়ে কাজ করে। মিরাইয়ের নিজের global.utils-এর কোনো ফাংশন ওভাররাইট করা হয় না —
// শুধু যেগুলো নেই সেগুলো যোগ হয় (দেখুন preload.js)।

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let moment = null;
try { moment = require("moment-timezone"); } catch (e) { /* optional */ }
let mimeDB = {};
try { mimeDB = require("mime-db"); } catch (e) { /* optional */ }

const TIMEZONE = () => (global.config && (global.config.timeZone || global.config.TIMEZONE)) || "Asia/Dhaka";

class CustomError extends Error {
  constructor(obj) {
    if (typeof obj === "string") super(obj);
    else super(obj && obj.message ? obj.message : JSON.stringify(obj));
    if (obj && typeof obj === "object") Object.assign(this, obj);
    this.name = "CustomError";
  }
}

/* ------------------------------ লগার ------------------------------ */
let chalk = null;
try { chalk = require("chalk"); } catch (e) { /* optional */ }
const paint = (fn, text) => (chalk && chalk[fn] ? chalk[fn](text) : text);
function makeLogger(label, color) {
  return (tag, ...rest) => {
    // log.info("TAG", "message") বা log.info("message")
    const msg = rest.length ? rest.map(x => (x instanceof Error ? (x.stack || x.message) : typeof x === "object" ? JSON.stringify(x) : x)).join(" ") : "";
    const head = rest.length ? `[ ${tag} ]` : "";
    console.log(`${paint(color, `[${label}]`)} ${head} ${rest.length ? msg : tag}`);
  };
}
const log = Object.assign(makeLogger("INFO", "cyan"), {
  info: makeLogger("INFO", "cyan"),
  success: makeLogger("OK", "green"),
  warn: makeLogger("WARN", "yellow"),
  err: makeLogger("ERROR", "red"),
  error: makeLogger("ERROR", "red"),
  master: makeLogger("MASTER", "magenta"),
  dev: makeLogger("DEV", "blue")
});

/* ------------------------------ ছোট হেল্পার ------------------------------ */
function getType(value) { return Object.prototype.toString.call(value).slice(8, -1); }
function isNumber(value) { return !isNaN(parseFloat(value)); }

function randomString(max, onlyOnce = false, possible) {
  if (!max || isNaN(max)) max = 10;
  let text = "";
  possible = possible || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < max; i++) {
    let random = Math.floor(Math.random() * possible.length);
    if (onlyOnce) while (text.includes(possible[random])) random = Math.floor(Math.random() * possible.length);
    text += possible[random];
  }
  return text;
}

function randomNumber(min, max) {
  if (!max) { max = min; min = 0; }
  if (min == null || isNaN(min)) throw new Error("The first argument (min) must be a number");
  if (max == null || isNaN(max)) throw new Error("The second argument (max) must be a number");
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function removeHomeDir(fullPath) {
  if (!fullPath || typeof fullPath !== "string") throw new Error("The first argument (fullPath) must be a string");
  while (fullPath.includes(process.cwd())) fullPath = fullPath.replace(process.cwd(), "");
  return fullPath;
}

function splitPage(arr, limit) {
  const allPage = [];
  for (let i = 0; i < arr.length; i += limit) allPage.push(arr.slice(i, i + limit));
  return { totalPage: allPage.length, allPage };
}

function formatNumber(number) {
  if (isNaN(number)) throw new Error("The first argument (number) must be a number");
  return Number(number).toLocaleString((global.config && global.config.language) || "en-US");
}

function convertTime(miliSeconds, replaceSeconds = "s", replaceMinutes = "m", replaceHours = "h", replaceDays = "d", replaceMonths = "M", replaceYears = "y", notShowZero = false) {
  if (typeof replaceSeconds == "boolean") { notShowZero = replaceSeconds; replaceSeconds = "s"; }
  const second = Math.floor(miliSeconds / 1000 % 60);
  const minute = Math.floor(miliSeconds / 1000 / 60 % 60);
  const hour = Math.floor(miliSeconds / 1000 / 60 / 60 % 24);
  const day = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 % 30);
  const month = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 / 30 % 12);
  const year = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 / 30 / 12);
  let formattedDate = "";
  const parts = [
    { value: year, replace: replaceYears }, { value: month, replace: replaceMonths },
    { value: day, replace: replaceDays }, { value: hour, replace: replaceHours },
    { value: minute, replace: replaceMinutes }, { value: second, replace: replaceSeconds }
  ];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.value) formattedDate += p.value + p.replace;
    else if (formattedDate != "") formattedDate += "00" + p.replace;
    else if (i == parts.length - 1) formattedDate += "0" + p.replace;
  }
  if (formattedDate == "") formattedDate = "0" + replaceSeconds;
  if (notShowZero) formattedDate = formattedDate.replace(/00\w+/g, "");
  return formattedDate;
}

function getTime(timestamps, format) {
  if (!format && typeof timestamps == "string") { format = timestamps; timestamps = undefined; }
  if (!moment) return new Date(timestamps || Date.now()).toISOString();
  return moment(timestamps).tz(TIMEZONE()).format(format);
}

function getPrefix(threadID) {
  const fallback = (global.config && global.config.PREFIX) || "/";
  try {
    const t = global.data && global.data.threadData && global.data.threadData.get(String(threadID));
    if (t && t.PREFIX) return t.PREFIX;
    if (t && t.data && t.data.prefix) return t.data.prefix;
  } catch (e) { /* ignore */ }
  return fallback;
}

function getExtFromAttachmentType(type) {
  switch (type) {
    case "photo": return "png";
    case "animated_image": return "gif";
    case "video": return "mp4";
    case "audio": return "mp3";
    default: return "txt";
  }
}

function getExtFromMimeType(mimeType = "") {
  return mimeDB[mimeType] ? (mimeDB[mimeType].extensions || [])[0] || "unknow" : "unknow";
}

function getExtFromUrl(url = "") {
  if (!url || typeof url !== "string") throw new Error("The first argument (url) must be a string");
  const reg = /(?<=https:\/\/cdn.fbsbx.com\/v\/.*?\/|https:\/\/video.xx.fbcdn.net\/v\/.*?\/|https:\/\/scontent.xx.fbcdn.net\/v\/.*?\/).*?(\/|\?)/g;
  const m = url.match(reg);
  if (m && m[0]) {
    const fileName = m[0].slice(0, -1);
    return fileName.slice(fileName.lastIndexOf(".") + 1);
  }
  // fallback: সাধারণ URL থেকে এক্সটেনশন
  try {
    const p = new URL(url).pathname;
    const e = path.extname(p).replace(".", "");
    if (e) return e;
  } catch (e) { /* ignore */ }
  return "noext";
}

/* ------------------------------ নেটওয়ার্ক ------------------------------ */
async function downloadFile(url = "", filePath = "") {
  if (!url || typeof url !== "string") throw new Error("The first argument (url) must be a string");
  if (!filePath || typeof filePath !== "string") throw new Error("The second argument (path) must be a string");
  let res;
  try { res = await axios.get(url, { responseType: "arraybuffer" }); }
  catch (err) { throw new CustomError(err.response ? err.response.data : err); }
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, Buffer.from(res.data));
  return filePath;
}

async function getStreamFromURL(url = "", pathName = "", options = {}) {
  if (!options && typeof pathName === "object") { options = pathName; pathName = ""; }
  if (!url || typeof url !== "string") throw new Error("The first argument (url) must be a string");
  const response = await axios({ url, method: "GET", responseType: "stream", ...options });
  if (!pathName) {
    pathName = randomString(10) + (response.headers["content-type"] ? "." + getExtFromMimeType(String(response.headers["content-type"]).split(";")[0]) : ".noext");
  }
  response.data.path = pathName;
  return response.data;
}

async function getStreamsFromAttachment(attachments) {
  const streams = [];
  for (const attachment of attachments) {
    const url = attachment.url;
    const ext = getExtFromUrl(url);
    streams.push({ pending: axios({ url, method: "GET", responseType: "stream" }), fileName: `${randomString(10)}.${ext}` });
  }
  for (let i = 0; i < streams.length; i++) {
    const stream = await streams[i].pending;
    stream.data.path = streams[i].fileName;
    streams[i] = stream.data;
  }
  return streams;
}

async function translate(text, lang = "en") {
  if (typeof text !== "string") throw new Error("The first argument (text) must be a string");
  try {
    const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
    return (res.data[0] || []).map(x => x[0]).join("");
  } catch (err) { throw new CustomError(err.response ? err.response.data : err); }
}

async function shortenURL(url) {
  const result = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
  return result.data;
}

async function findUid(link) {
  try {
    const response = await axios.post("https://seomagnifier.com/fbid", new URLSearchParams({ facebook: "1", sitelink: link }), {
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }
    });
    const id = response.data;
    if (isNaN(id)) {
      const cheerio = require("cheerio");
      const html = await axios.get(link);
      const $ = cheerio.load(html.data);
      const el = $('meta[property="al:android:url"]').attr("content");
      if (!el) throw new Error("UID not found");
      return el.split("/").pop();
    }
    return id;
  } catch (error) {
    throw new Error("An unexpected error occurred. Please try again.");
  }
}

/* ------------------------------ GoatBot-only ফিচার (স্টাব) ------------------------------ */
// Google Drive / imgbb / কমান্ড হট-লোড: এগুলোর জন্য GoatBot-এর নিজস্ব credentials লাগে।
// এখানে কোড ক্র্যাশ করার বদলে পরিষ্কার এরর দেওয়া হয়।
const notSupported = name => async () => { throw new Error(`global.utils.${name} is not supported in the Mirai+Goat hybrid runtime.`); };
const drive = { getFile: notSupported("drive.getFile"), uploadFile: notSupported("drive.uploadFile"), deleteFile: notSupported("drive.deleteFile") };

module.exports = {
  CustomError, log, getType, isNumber, randomString, randomNumber, removeHomeDir, splitPage,
  formatNumber, convertTime, getTime, getPrefix, getExtFromAttachmentType, getExtFromMimeType,
  getExtFromUrl, downloadFile, getStreamFromURL, getStreamsFromAttachment, translate, translateAPI: translate,
  shortenURL, findUid, drive,
  uploadImgbb: notSupported("uploadImgbb"),
  uploadZippyshare: notSupported("uploadZippyshare"),
  loadScripts: notSupported("loadScripts"),
  unloadScripts: notSupported("unloadScripts"),
  getText: (_opts, key) => String(key)
};

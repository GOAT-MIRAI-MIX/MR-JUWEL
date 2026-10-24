module.exports.config = {
  name: "cot",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Cot banner: ছেলে (মেনশন/রিপ্লাই) + গ্রুপের র‍্যান্ডম মেয়ে",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@ছেলে মেনশন | ছেলের মেসেজে রিপ্লাই]",
  cooldowns: 40,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "canvas": ""
  }
};

// ====== Template settings ======
const TEMPLATE_URL = "https://i.imgur.com/WkcGcyX.jpeg";
const REF_W = 1254;
const REF_H = 1254;
// বাম বৃত্ত = ছেলের মাথার উপরে (মেনশন/রিপ্লাই করা ছেলে)
// ডান বৃত্ত = মেয়ের মাথার উপরে (গ্রুপের র‍্যান্ডম মেয়ে)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
const LEFT  = { x: 487, y: 158, rx: 66, ry: 66 };
const RIGHT = { x: 750, y: 193, rx: 66, ry: 66 };

// true হলে যে কমান্ড দিবে তারও ছেলে হতে হবে
const REQUIRE_MALE_SENDER = true;

// মেসেজে শুধু এই লেখাটা যাবে
const TEXT = "বন্ধু চিপায় কট খাইছে😂";
// ================================

// gender: 1 = মেয়ে, 2 = ছেলে (অথবা "female"/"male")
const isFemale = (g) => g === 1 || g === "1" || String(g).toLowerCase() === "female";
const isMale = (g) => g === 2 || g === "2" || String(g).toLowerCase() === "male";

module.exports.run = async function ({ event, api }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { createCanvas, loadImage } = require("canvas");

  const { threadID, messageID, senderID, mentions, messageReply } = event;

  // কলব্যাক ও প্রমিস দুই ধরনের api-তেই কাজ করে, আর ঝুলে গেলে ২০ সেকেন্ডে এরর দেয়
  const callApi = (fn, arg, label) =>
    new Promise((resolve, reject) => {
      let done = false;
      const finish = (err, data) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        err ? reject(err instanceof Error ? err : new Error(label + " failed: " + JSON.stringify(err))) : resolve(data || {});
      };
      const timer = setTimeout(() => finish(new Error(label + " timeout")), 20000);
      try {
        const ret = fn(arg, (err, data) => finish(err, data));
        if (ret && typeof ret.then === "function") {
          ret.then((data) => finish(null, data)).catch((err) => finish(err || new Error(label + " error")));
        }
      } catch (e) {
        finish(e);
      }
    });

  // প্রতিটা আইডি আলাদা করে আনে; কোনো আইডি invalid হলে শুধু সেটা বাদ যায়, পুরো কাজ থামে না
  const getUserInfo = async (ids) => {
    const list = [...new Set((Array.isArray(ids) ? ids : [ids]).map(String))].filter((x) => /^\d+$/.test(x));
    const result = {};
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(
        chunk.map(async (id) => {
          try {
            const d = await callApi(api.getUserInfo.bind(api), id, "getUserInfo");
            if (d && d[id]) result[id] = d[id];
            else if (d && typeof d === "object" && d.gender !== undefined) result[id] = d;
          } catch (e) {
            console.log("COT getUserInfo skip", id, e.message);
          }
        })
      );
    }
    return result;
  };
  const getThreadInfo = (tid) => callApi(api.getThreadInfo.bind(api), tid, "getThreadInfo");

  // ছেলে কে (মেনশন বা রিপ্লাই)
  let boyID = null;
  if (mentions && Object.keys(mentions).length > 0) {
    boyID = Object.keys(mentions)[0];
  } else if (messageReply && messageReply.senderID) {
    boyID = messageReply.senderID;
  }

  if (!boyID) {
    return api.sendMessage(
      "⚠️ কোনো ছেলেকে মেনশন করো বা তার মেসেজে রিপ্লাই দাও!\n\nউদাহরণ: cot @নাম",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imgPath = path.join(cacheDir, `cot_${senderID}_${boyID}_${Date.now()}.png`);
  const templatePath = path.join(cacheDir, "cot_template.jpg");

  const getTemplate = async () => {
    if (!fs.existsSync(templatePath)) {
      try {
        const res = await axios.get(TEMPLATE_URL, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Referer": "https://imgur.com/"
          }
        });
        fs.writeFileSync(templatePath, Buffer.from(res.data));
      } catch (err) {
        throw new Error("TEMPLATE download failed: " + (err.response?.status || err.message));
      }
    }
    return loadImage(templatePath);
  };

  const getAvatar = async (uid) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    try {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
      return loadImage(Buffer.from(res.data));
    } catch (err) {
      throw new Error("AVATAR download failed: " + (err.response?.status || err.message));
    }
  };

  try {
    // ---- ছেলে কি না চেক ----
    const checkIDs = REQUIRE_MALE_SENDER ? [boyID, senderID] : [boyID];
    const infos = await getUserInfo(checkIDs);

    console.log("COT gender check:", "sender", senderID, infos[senderID]?.gender, "| boy", boyID, infos[boyID]?.gender);

    // শুধু স্পষ্টভাবে "মেয়ে" ধরা পড়লেই আটকাবে; জেন্ডার না পাওয়া গেলে (হাইড/অজানা) চলতে দিবে
    if (REQUIRE_MALE_SENDER && isFemale(infos[senderID]?.gender)) {
      return api.sendMessage(
        "⚠️ এই কমান্ড শুধু ছেলেরা ব্যবহার করতে পারবে!",
        threadID,
        messageID
      );
    }
    if (isFemale(infos[boyID]?.gender)) {
      return api.sendMessage(
        "⚠️ কোনো ছেলেকে মেনশন করো বা রিপ্লাই দাও! (মেয়েকে নয়)",
        threadID,
        messageID
      );
    }

    // ---- গ্রুপ থেকে র‍্যান্ডম মেয়ে খোঁজা ----
    const threadInfo = await getThreadInfo(threadID);
    const botID = api.getCurrentUserID ? api.getCurrentUserID() : null;
    const members = (threadInfo.participantIDs || []).filter(
      (id) => id !== botID && id !== boyID && id !== senderID
    );

    let girlID = null;
    let girlName = null;
    if (members.length > 0) {
      const allInfo = await getUserInfo(members);
      const girls = members.filter((id) => isFemale(allInfo[id]?.gender));
      if (girls.length > 0) {
        girlID = girls[Math.floor(Math.random() * girls.length)];
        girlName = allInfo[girlID]?.name || null;
      }
    }

    if (!girlID) {
      return api.sendMessage(
        "⚠️ এই গ্রুপে কোনো মেয়ে খুঁজে পাওয়া যায়নি!",
        threadID,
        messageID
      );
    }

    const [template, boyAvatar, girlAvatar] = await Promise.all([
      getTemplate(),
      getAvatar(boyID),
      getAvatar(girlID)
    ]);

    const W = template.width;
    const H = template.height;
    const sx = W / REF_W;
    const sy = H / REF_H;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(template, 0, 0, W, H);

    const drawAvatar = (img, c) => {
      const cx = c.x * sx;
      const cy = c.y * sy;
      const rx = c.rx * sx;
      const ry = c.ry * sy;
      const w = rx * 2;
      const h = ry * 2;
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();
    };

    drawAvatar(boyAvatar, LEFT);    // ছেলে → বামে
    drawAvatar(girlAvatar, RIGHT);  // র‍্যান্ডম মেয়ে → ডানে

    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

    // ---- রিয়েল মেনশন (নোটিফিকেশন যাবে) ----
    const cleanName = (n) => String(n || "").replace(/^@/, "").trim();
    const boyName =
      cleanName(infos[boyID]?.name) || cleanName(mentions && mentions[boyID]) || "বন্ধু";
    const girlTag = cleanName(girlName) || "মেয়েটা";

    const boyTag = "@" + boyName;
    const girlTagFull = "@" + girlTag;
    const body = `${boyTag} বন্ধু ${girlTagFull} এর সাথে চিপায় কট খাইছে😂`;
    const bodyMentions = [
      { tag: boyTag, id: boyID, fromIndex: body.indexOf(boyTag) },
      { tag: girlTagFull, id: girlID, fromIndex: body.indexOf(girlTagFull, boyTag.length) }
    ];

    return api.sendMessage(
      {
        body,
        mentions: bodyMentions,
        attachment: fs.createReadStream(imgPath)
      },
      threadID,
      () => fs.unlink(imgPath, () => {}),
      messageID
    );
  } catch (e) {
    console.log("COT CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage(
      "Error: " + (e.response?.status || e.message),
      threadID,
      messageID
    );
  }
};

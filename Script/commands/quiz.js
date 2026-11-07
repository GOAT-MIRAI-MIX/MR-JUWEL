const axios = require("axios");

module.exports.config = {
  name: "quiz",
  version: "2.3.3",
  hasPermssion: 0,
  credits: "RUBISH API + Bangla Version by rX",
  description: "বাংলা কুইজ গেম (ফ্রি + কয়েন সিস্টেম)",
  usePrefix: false,
  commandCategory: "Game",
  usages: "quiz [h]",
  cooldowns: 5,
  dependencies: { "axios": "" }
};

const timeoutDuration = 20 * 1000;

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Help / Guide
  if (args[0]?.toLowerCase() === "h") {
    return api.sendMessage(
      `🧠 কুইজ গাইড\n\n` +
      `➤ কমান্ড: quiz\n` +
      `➤ সঠিক উত্তর: +৫০০ কয়েন 💰\n` +
      `➤ ভুল উত্তর: কোনো কয়েন কাটা যাবে না ❌\n` +
      `➤ ০ কয়েন থাকলেও খেলতে পারবে 🎉\n` +
      `➤ উত্তর দেওয়ার সময়: ২০ সেকেন্ড ⏰\n\n` +
      `⚡ শুভকামনা!`,
      threadID,
      messageID
    );
  }

  try {
    const res = await axios.get(
      "https://rubish-apihub.onrender.com/rubish/quiz-api?category=Bangla&apikey=rubish69"
    );
    const data = res.data;

    if (!data.question || !data.answer) {
      throw new Error("Quiz data invalid");
    }

    const quizText =
`╭──✦ 🧠 বাংলা কুইজ
├ প্রশ্ন: ${data.question}
│
├ 𝗔) ${data.A}
├ 𝗕) ${data.B}
├ 𝗖) ${data.C}
├ 𝗗) ${data.D}
╰──────────────────✦
✍️ রিপ্লাই দাও: A / B / C / D
⏰ সময়: ২০ সেকেন্ড`;

    return api.sendMessage(quizText, threadID, async (err, info) => {
      if (err) return console.error(err);

      const timeout = setTimeout(async () => {
        const index = global.client.handleReply.findIndex(
          e => e.messageID === info.messageID
        );

        if (index !== -1) {
          await api.unsendMessage(info.messageID);
          api.sendMessage(
            `⏰ সময় শেষ!\n✅ সঠিক উত্তর ছিল: ${data.answer}`,
            threadID
          );
          global.client.handleReply.splice(index, 1);
        }
      }, timeoutDuration);

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        answer: data.answer,
        timeout
      });
    });

  } catch (e) {
    console.error(e);
    return api.sendMessage(
      "❌ কুইজ লোড করা যায়নি, পরে আবার চেষ্টা করো!",
      threadID,
      messageID
    );
  }
};

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  Currencies,
  Users
}) {
  const { senderID, threadID, messageID, body } = event;

  if (senderID !== handleReply.author) return;

  const userAnswer = body.trim().toUpperCase();

  if (!["A", "B", "C", "D"].includes(userAnswer)) {
    return api.sendMessage(
      "⚠️ দয়া করে শুধু A / B / C / D লিখে উত্তর দাও",
      threadID,
      messageID
    );
  }

  clearTimeout(handleReply.timeout);

  try {
    const name = await Users.getNameUser(senderID);
    const mention = [{ id: senderID, tag: name }];

    if (userAnswer === handleReply.answer) {
      await api.unsendMessage(handleReply.messageID);
      await Currencies.increaseMoney(senderID, 500);

      const money = (await Currencies.getData(senderID)).money;

      return api.sendMessage(
        {
          body:
            `🎉 অভিনন্দন ${name}!\n` +
            `✅ তোমার উত্তর সঠিক\n` +
            `💰 পেয়েছো: ৫০০ কয়েন\n` +
            `🏦 মোট ব্যালেন্স: ${money} কয়েন`,
          mentions: mention
        },
        threadID,
        messageID
      );
    } else {
      return api.sendMessage(
        {
          body:
            `❌ দুঃখিত ${name}\n` +
            `তোমার উত্তর ভুল\n` +
            `✅ সঠিক উত্তর: ${handleReply.answer}\n` +
            `⚡ কোনো কয়েন কাটা হয়নি`,
          mentions: mention
        },
        threadID,
        messageID
      );
    }
  } catch (err) {
    console.error(err);
  }

  const index = global.client.handleReply.findIndex(
    e => e.messageID === handleReply.messageID
  );
  if (index !== -1) global.client.handleReply.splice(index, 1);
};

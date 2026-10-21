module.exports.config = {
  name: "anemi",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SHAHADAT SAHU",
  description: "Random Anime Videos From SAHU API",
  commandCategory: "video",
  usages: "anemi",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const API_LIST_URL = "https://raw.githubusercontent.com/shahadat-sahu/SAHU-API/refs/heads/main/SAHU-API.json";
  try {
    const listRes = await axios.get(API_LIST_URL);
    const apis = listRes.data;
    const API = apis.anime_video;

    if (!API) {
      return api.sendMessage("API Problem Please try again.......", event.threadID, event.messageID);
    }

    const cacheDir = __dirname + "/cache";
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = `${cacheDir}/anemi_${Date.now()}.mp4`;

    const response = await axios({
      url: API,
      method: "GET",
      responseType: "stream",
      timeout: 120000
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage(
        {
          body: "🎬 𝐉𝐔𝐖𝐄𝐋 𝐀𝐍𝐈𝐌𝐄 𝐕𝐈𝐃𝐄𝐎",
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        event.messageID
      );
    });

    writer.on("error", () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.sendMessage("❌ File Writing Error!", event.threadID, event.messageID);
    });

  } catch (err) {
    console.log("ANEMI ERROR:", err?.response?.data || err.message);
    api.sendMessage("❌ API Problem... Try again later!", event.threadID, event.messageID);
  }
};

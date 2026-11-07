const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "ramadanauto",
  version: "6.1.0",
  hasPermssion: 0,
  credits: "MR JUWEL",
  description: "Auto Ramadan Time Stable & Fast",
  commandCategory: "Islamic",
  usages: "",
  cooldowns: 5
};

// ===== Division List =====
const divisions = {
  "📍 DHAKA": ["Dhaka","Faridpur","Gazipur","Gopalganj","Kishoreganj","Madaripur","Manikganj","Munshiganj","Narsingdi","Rajbari","Shariatpur","Tangail"],
  "📍 CHATTOGRAM": ["Chattogram","Bandarban","Brahmanbaria","Chandpur","Cumilla","Cox's Bazar","Feni","Khagrachari","Lakshmipur","Noakhali","Rangamati"],
  "📍 RAJSHAHI": ["Rajshahi","Bogura","Chapainawabganj","Joypurhat","Naogaon","Natore","Pabna","Sirajganj"],
  "📍 KHULNA": ["Khulna","Bagerhat","Chuadanga","Jashore","Jhenaidah","Kushtia","Magura","Meherpur","Narail","Satkhira"],
  "📍 BARISHAL": ["Barishal","Barguna","Bhola","Jhalokathi","Patuakhali","Pirojpur"],
  "📍 SYLHET": ["Sylhet","Habiganj","Moulvibazar","Sunamganj"],
  "📍 RANGPUR": ["Rangpur","Dinajpur","Gaibandha","Kurigram","Lalmonirhat","Nilphamari","Panchagarh","Thakurgaon"],
  "📍 MYMENSINGH": ["Mymensingh","Jamalpur","Netrokona","Sherpur"]
};

// ===== Time File =====
const TIME_FILE = __dirname + '/last_run_time.txt';

function saveLastRunTime() {
  fs.writeFileSync(TIME_FILE, Date.now().toString(), 'utf-8');
}

function getLastRunTime() {
  if (!fs.existsSync(TIME_FILE)) return 0;
  return parseInt(fs.readFileSync(TIME_FILE, 'utf-8')) || 0;
}

// ===== API CALL =====
async function getRamadanTime(location) {
  try {
    const res = await axios.get(
      `https://mahbub-ullash.cyberbot.top/api/ramadan?location=${encodeURIComponent(location)}`,
      { timeout: 10000 }
    );

    if (!res.data || !res.data.today) return null;

    return res.data.today;
  } catch (err) {
    return null;
  }
}

// ===== SEND FUNCTION =====
async function sendAll(api) {
  try {
    const threads = await api.getThreadList(9999, null, ["INBOX"]);

    // সব ডাটা আগে fetch (FAST)
    let allData = {};

    for (let div in divisions) {
      allData[div] = await Promise.all(
        divisions[div].map(loc => getRamadanTime(loc))
      );
    }

    for (let thread of threads) {
      let msg = `🌙 RAMADAN TIME 🌙\n\n`;

      for (let div in divisions) {
        msg += `━━━━━━━━━━━━━━\n${div}\n━━━━━━━━━━━━━━\n`;

        divisions[div].forEach((district, i) => {
          const data = allData[div][i];

          if (data) {
            msg += `\n📌 ${district}
🌅 Sehri: ${data.sehri_end}
🌇 Iftar: ${data.iftar}\n`;
          } else {
            msg += `\n❌ ${district}: Error\n`;
          }
        });

        msg += `\n`;
      }

      msg += `━━━━━━━━━━━━━━\n⏰ Auto Update: Every 6 Hours`;

      api.sendMessage(msg, thread.threadID);
    }

    saveLastRunTime();

  } catch (err) {
    console.log("RAMADAN AUTO ERROR:", err);
  }
}

// ===== AUTO START =====
module.exports.onLoad = function ({ api }) {
  const lastRun = getLastRunTime();
  const now = Date.now();
  const sixHours = 6 * 60 * 60 * 1000;

  let delay = 0;

  if (now - lastRun < sixHours) {
    delay = sixHours - (now - lastRun);
  }

  setTimeout(() => {
    sendAll(api);

    setInterval(() => {
      sendAll(api);
    }, sixHours);

  }, delay);
};

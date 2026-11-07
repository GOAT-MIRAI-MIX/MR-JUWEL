const tlt = 30; // Winning rate (%)
const min = 100; // Minimum bet ($)

module.exports.config = {
  name: "bc",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Khoa",
  description: "A funny version of the Bầu Cua game!",
  commandCategory: "Game",
  usages: "[bau/cua/tom/ca/nai/ga] money",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args, Currencies }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const { loadImage, createCanvas } = require("canvas");

  if (args.length < 2)
    return api.sendMessage("Please enter your choice and bet amount!", threadID, messageID);

  var allface = ["bau", "cua", "tom", "ca", "nai", "ga"];
  var betChoice = args[0].toLowerCase();

  if (!allface.includes(betChoice))
    return api.sendMessage(`Invalid choice "${betChoice}"!`, threadID, messageID);

  var dataMoney = await Currencies.getData(senderID);
  var money = dataMoney.money;
  var betAmount = parseInt(args[1]);

  if (isNaN(betAmount) || betAmount < 1)
    return api.sendMessage("Invalid bet amount!", threadID, messageID);
  if (betAmount < min)
    return api.sendMessage(`Minimum bet is ${min}$!`, threadID, messageID);
  if (betAmount > money)
    return api.sendMessage(`You don't have enough money to bet ${betAmount}$!`, threadID, messageID);

  var luckynumber = Math.floor(Math.random() * 100) + 1;
  if (luckynumber > tlt) allface.splice(allface.indexOf(betChoice), 1);

  var result = [
    allface[Math.floor(Math.random() * allface.length)],
    allface[Math.floor(Math.random() * allface.length)],
    allface[Math.floor(Math.random() * allface.length)]
  ];

  function getlink(face) {
    let link;
    if (face == "bau") link = "https://i.postimg.cc/SR3qy939/bau.png";
    if (face == "cua") link = "https://i.postimg.cc/0jbPRnWx/cua.png";
    if (face == "tom") link = "https://i.postimg.cc/tCnpBrnN/tom.png";
    if (face == "ca") link = "https://i.postimg.cc/BnWskxx9/ca.png";
    if (face == "nai") link = "https://i.postimg.cc/05B9dgjN/nai.png";
    if (face == "ga") link = "https://i.postimg.cc/Kz9xHw5J/ga.png";
    return link;
  }

  var canvas = createCanvas(1200, 900);
  var ctx = canvas.getContext("2d");
  var background = await loadImage("https://i.postimg.cc/9fcVVWSb/background.png");
  ctx.drawImage(background, 0, 0, 1200, 900);

  var count = 0;
  for (let i = 0; i <= 2; i++) {
    if (result[i] == betChoice) count++;
    var img = await loadImage(getlink(result[i]));
    var x = i == 0 ? 250 : i == 1 ? 612 : 480;
    var y = i == 0 ? 129 : i == 1 ? 134 : 344;
    ctx.drawImage(img, x, y, 370, 370);
  }

  const path = __dirname + "/cache/baucua.png";
  fs.writeFileSync(path, canvas.toBuffer("image/png"));

  var item = count == 0 ? `-${betAmount}$` : `+${betAmount * count}$`;
  if (count == 0) {
    Currencies.decreaseMoney(senderID, betAmount);
  } else {
    Currencies.increaseMoney(senderID, betAmount * count);
  }

  return api.sendMessage({
    body: `🎲 Result: ${result.join(", ")}\n✅ You got ${count} ${betChoice}\n💰 Change: ${item}`,
    attachment: fs.createReadStream(path)
  }, threadID, () => fs.unlinkSync(path), messageID);
};

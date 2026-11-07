/** I am doing this coding with a lot of difficulty, please don't post it yourself¯\_(ツ)_/¯ **/
module.exports.config = {
  name: "islam",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Islamick Chat",
  description: "prefix VEDIO",
  commandCategory: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
  usages: "love10 vedio",
  cooldowns: 5,
  dependencies: {
    "request":"",
    "fs-extra":"",
    "axios":""
  }
};

module.exports.run = async({api,event,args,client,Users,Threads,__GLOBAL,Currencies}) => {
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];
const fs = global.nodemodule["fs-extra"];
   var hi = ["•┄┅════❁🌺❁════┅┄•\n\nআসসালামু আলাইকুম-!!🖤💫প্রিয় ভাই ও বন - তুমাদের জন্য নিয়ে আসলাম আমি ইসলামিক ভিডিও \n\n•┄┅════❁🌺❁════┅┄•"];
  var know = hi[Math.floor(Math.random() * hi.length)];
  var link = [
"https://drive.google.com/uc?id=1Y5O3qRzxt-MFR4vVhz0QsMwHQmr-34iH",
"https://drive.google.com/uc?id=1YDyNrN-rnzsboFmYm8Q5-FhzoJD9WV3O",
"https://drive.google.com/uc?id=1XzgEzopoYBfuDzPsml5-RiRnItXVx4zW",
"https://drive.google.com/uc?id=1YEeal83MYRI9sjHuEhJdjXZo9nVZmfHD",
"https://drive.google.com/uc?id=1YMEDEKVXjnHE0KcCJHbcT2PSbu8uGSk4",
"https://drive.google.com/uc?id=1YRb2k01n4rIdA9Vf69oxIOdv54JyAprD",
"https://drive.google.com/uc?id=1YSQCTVhrHTNl6B9xSBCQ7frBJ3bp_KoA",
"https://drive.google.com/uc?id=1Yc9Rwwdpqha1AWeEb5BXV-goFbag0441",
"https://drive.google.com/uc?id=1YcwtkC5wRbbHsAFuEQYQuwQsH4-ZiBS8",
"https://drive.google.com/uc?id=1YhfyPl8oGmsIAIOjWQyzQYkDdZUPSalo",

];
     var callback = () => api.sendMessage({body:` ${know} `,attachment: fs.createReadStream(__dirname + "/cache/15.mp4")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/15.mp4"));    
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname+"/cache/15.mp4")).on("close",() => callback());
   };
 

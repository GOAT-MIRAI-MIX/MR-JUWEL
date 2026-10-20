const fs = require("fs");
module.exports.config = {
	name: "gali",
    version: "1.0.1",
	hasPermssion: 0,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️", 
	description: "no prefix",
	commandCategory: "no prefix",
	usages: "abal",
    cooldowns: 5, 
};

module.exports.handleEvent = function({ api, event, client, __GLOBAL }) {
	var { threadID, messageID } = event;
	if (event.body.indexOf("Juwel Bokasoda")==0 || event.body.indexOf("Juwel mc")==0 || event.body.indexOf("Juwel ke chod")==0 || event.body.indexOf("Juwel nodir pola")==0 || event.body.indexOf("Juwel akta bc")==0 || event.body.indexOf(" Juwel re chudi")==0 || event.body.indexOf("Juwel re chod")==0 || event.body.indexOf("Juwel Abal")==0 || event.body.indexOf("Shahadat Boakachoda")==0 || event.body.indexOf("Juwel madarchod")==0 || event.body.indexOf("Juwel re chudi")==0 || event.body.indexOf("juwel Bokachoda")==0) {
		var msg = {
			
				body: "তোর মতো বোকাচোদা রে আমার বস জুয়েল চু*দা বাদ দিছে🤣\nজুয়েল এখন আর cude না🥱😈",
			}
			api.sendMessage(msg, threadID, messageID);
		}
	}
	module.exports.run = function({ api, event, client, __GLOBAL }) {

  }

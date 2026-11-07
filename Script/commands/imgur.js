module.exports.config = {
 name: "imgur",
 version: "1.0.2", 
 hasPermssion: 0,
 credits: "Islamick Cyber Chat + Modified by Shahadat Islam",
 description: "Upload image/video/GIF to Imgur and get direct links",
 commandCategory: "other", 
 usages: "[reply with any media file]", 
 cooldowns: 0,
};

module.exports.run = async ({ api, event }) => {
 const axios = global.nodemodule['axios'];

 const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
 const Shaon = apis.data.imgur;

 const reply = event.messageReply;
 if (!reply || !reply.attachments || reply.attachments.length === 0) {
 return api.sendMessage(
 'Please reply to the image or video with the command Imgur...!✅',
 event.threadID,
 event.messageID
 );
 }

 const links = [];

 for (const attachment of reply.attachments) {
 try {
 const url = encodeURIComponent(attachment.url);
 const upload = await axios.get(`${Shaon}/imgur?link=${url}`);
 links.push(upload.data.uploaded.image || "❌ No link received");
 } catch (e) {
 links.push("❌ Failed to upload");
 }
 }

 
 const message = links.length === 1 
 ? links[0] 
 : `✅ Uploaded files Imgur links:\n\n${links.join("\n")}`;

 return api.sendMessage(message, event.threadID, event.messageID);
};
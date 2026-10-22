module.exports.config = {
  name: "acp",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Accept or delete Facebook friend requests",
  commandCategory: "bot id",
  usages: "acp",
  cooldowns: 0
};

const LINE = "━━━━━━━━━━━━━━━━━━━━━━";

module.exports.handleReply = async ({ handleReply, event, api }) => {
  const { author, listRequest } = handleReply;
  if (author != event.senderID) return;
  const args = event.body.replace(/ +/g, " ").trim().toLowerCase().split(" ");

  const form = {
    av: api.getCurrentUserID(),
    fb_api_caller_class: "RelayModern",
    variables: {
      input: {
        source: "friends_tab",
        actor_id: api.getCurrentUserID(),
        client_mutation_id: Math.round(Math.random() * 19).toString()
      },
      scale: 3,
      refresh_num: 0
    }
  };

  const success = [];
  const failed = [];

  if (args[0] == "add") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else if (args[0] == "del") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  } else {
    return api.sendMessage(
      `⚠️ Please reply with:\n» add <number | all>\n» del <number | all>`,
      event.threadID,
      event.messageID
    );
  }

  let targetIDs = args.slice(1);
  if (args[1] == "all") {
    targetIDs = [];
    for (let i = 1; i <= listRequest.length; i++) targetIDs.push(i);
  }

  const newTargetIDs = [];
  const promiseFriends = [];

  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`#${stt} not found in the list`);
      continue;
    }
    form.variables.input.friend_requester_id = u.node.id;
    form.variables = JSON.stringify(form.variables);
    newTargetIDs.push(u);
    promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
    form.variables = JSON.parse(form.variables);
  }

  for (let i = 0; i < newTargetIDs.length; i++) {
    try {
      const res = await promiseFriends[i];
      if (JSON.parse(res).errors) failed.push(newTargetIDs[i].node.name);
      else success.push(newTargetIDs[i].node.name);
    } catch (e) {
      failed.push(newTargetIDs[i].node.name);
    }
  }

  const isAdd = args[0] == "add";
  let msg = `${LINE}\n${isAdd ? "✅ 𝗔𝗖𝗖𝗘𝗣𝗧𝗘𝗗" : "🗑️ 𝗗𝗘𝗟𝗘𝗧𝗘𝗗"} 𝗥𝗘𝗤𝗨𝗘𝗦𝗧𝗦\n${LINE}\n`;
  msg += `» Successful: ${success.length}\n`;
  if (success.length) msg += success.map((n, i) => `   ${i + 1}. ${n}`).join("\n") + "\n";
  if (failed.length) {
    msg += `\n» Failed: ${failed.length}\n`;
    msg += failed.map((n, i) => `   ${i + 1}. ${n}`).join("\n") + "\n";
  }
  msg += `${LINE}\n✦ Credit: ${module.exports.config.credits}`;

  api.sendMessage(msg, event.threadID, event.messageID);
};

module.exports.run = async ({ event, api }) => {
  const moment = require("moment-timezone");
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } })
  };

  let listRequest;
  try {
    listRequest = JSON.parse(
      await api.httpPost("https://www.facebook.com/api/graphql/", form)
    ).data.viewer.friending_possibilities.edges;
  } catch (e) {
    return api.sendMessage("❌ Could not load friend requests. Try again later.", event.threadID, event.messageID);
  }

  if (!listRequest.length)
    return api.sendMessage("📭 No pending friend requests.", event.threadID, event.messageID);

  let msg = `${LINE}\n👥 𝗙𝗥𝗜𝗘𝗡𝗗 𝗥𝗘𝗤𝗨𝗘𝗦𝗧𝗦 (${listRequest.length})\n${LINE}\n`;
  let i = 0;
  for (const user of listRequest) {
    i++;
    msg += `\n【${i}】 ${user.node.name}`
      + `\n   🆔 ID: ${user.node.id}`
      + `\n   🔗 ${user.node.url.replace("www.facebook", "fb")}`
      + `\n   🕒 ${moment(user.time * 1000).tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss")}\n`;
  }
  msg += `\n${LINE}\n💬 Reply with:\n   ✔ add <number | all>\n   ✖ del <number | all>\n${LINE}\n✦ Credit: ${module.exports.config.credits}`;

  api.sendMessage(msg, event.threadID, (e, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      listRequest,
      author: event.senderID
    });
  }, event.messageID);
};

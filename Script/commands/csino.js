module.exports.config = {
    name: "casino",
    version: "0.0.1",
    hasPermssion: 0,
    credits: "tdunguwu",
    description: "Collection of Gambling Games",
    commandCategory: "Games",
    usages: "",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args, Currencies, Users }) {
    const request = require('request');
    const { createReadStream, createWriteStream, existsSync } = require('fs-extra');
    const { threadID, messageID, senderID } = event;
    const dataMoney = await Currencies.getData(senderID);
    const moneyUser = dataMoney.money;
    const choose = args[0];
    const kqua = args[1];
    const betAmount = args[2];

    if (!existsSync(__dirname + '/cache/casino.jpg')) {
        request('https://i.imgur.com/1Y9eup1.jpg').pipe(createWriteStream(__dirname + '/cache/casino.jpg'));
    }

    if (!choose) {
        const msg = {
            body: `🃏─── CASINO ───🃏\n\n❯ 1. Big/Small 🎲\n❯ 2. Even/Odd 🎴\n❯ 3. Lottery 💸\n❯ 4. Difference 🎫\n❯ 5. Slot 🎰\n❯ 6. Rock Paper Scissors ✌️\n\nReply with the number to see instructions for each game.\n\n🃏─── CASINO ───🃏`,
            attachment: [createReadStream(__dirname + "/cache/casino.jpg")]
        };
        return api.sendMessage(msg, threadID, (error, info) => {
            global.client.handleReply.push({
                type: "choosee",
                name: this.config.name,
                author: senderID,
                messageID: info.messageID
            });
        });
    }

    // Random values for games
    const z = Math.floor(Math.random() * 20);
    const y = Math.floor(Math.random() * 20);
    const difference = y - z;
    const x = Math.floor(Math.random() * 100);

    // Even/Odd
    const typeEO = ['even', 'odd'];
    const randomEO = typeEO[Math.floor(Math.random() * typeEO.length)];
    const even = [0, 2, 4, 6, 8];
    const odd = [1, 3, 5, 7, 9];
    const defNumberEO = randomEO === 'even' ? even[Math.floor(Math.random() * even.length)] : odd[Math.floor(Math.random() * odd.length)];

    // Big/Small
    const typeBS = ['big', 'small'];
    const randomBS = typeBS[Math.floor(Math.random() * typeBS.length)];
    const big = [4,5,6,7,8,9,10];
    const small = [11,12,13,14,15,16,17];
    const defNumberBS = randomBS === 'big' ? big[Math.floor(Math.random() * big.length)] : small[Math.floor(Math.random() * small.length)];

    // Big/Small game
    if (choose === 'big' || choose === 'small') {
        if (kqua < 50 || isNaN(kqua)) return api.sendMessage("Your bet amount is invalid or below $50!", threadID, messageID);
        if (moneyUser < kqua) return api.sendMessage(`You don't have enough balance (${kqua}$) to play`, threadID, messageID);
        if (choose === randomBS) {
            await Currencies.increaseMoney(senderID, parseInt(kqua * 2));
            return api.sendMessage(`You won! Bot rolled ${randomBS} (${defNumberBS}) and you received ${kqua * 2}`, threadID, messageID);
        } else {
            await Currencies.decreaseMoney(senderID, parseInt(kqua));
            return api.sendMessage(`You lost. Bot rolled ${randomBS} (${defNumberBS}) and you lost ${kqua}`, threadID, messageID);
        }
    }

    // Even/Odd game
    if (choose === 'even' || choose === 'odd') {
        if (kqua < 50 || isNaN(kqua)) return api.sendMessage("Your bet amount is invalid or below $50!", threadID, messageID);
        if (moneyUser < kqua) return api.sendMessage(`You don't have enough balance (${kqua}$) to play`, threadID, messageID);
        if (choose === randomEO) {
            await Currencies.increaseMoney(senderID, parseInt(kqua * 2));
            return api.sendMessage(`You won! Bot rolled ${randomEO} (${defNumberEO}) and you received ${kqua * 2}`, threadID, messageID);
        } else {
            await Currencies.decreaseMoney(senderID, parseInt(kqua));
            return api.sendMessage(`You lost. Bot rolled ${randomEO} (${defNumberEO}) and you lost ${kqua}`, threadID, messageID);
        }
    }

    // Lottery game
    if (choose === 'lottery') {
        if (kqua < 50 || isNaN(kqua)) return api.sendMessage("Your bet amount is invalid or below $50!", threadID, messageID);
        if (moneyUser < kqua) return api.sendMessage(`You don't have enough balance (${kqua}$) to play`, threadID, messageID);
        api.sendMessage(`Please wait a few minutes for the lottery result...`, threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 120 * 1000));
            api.unsendMessage(info.messageID);
            if (kqua == x) {
                await Currencies.increaseMoney(senderID, parseInt(kqua * 2));
                return api.sendMessage(`You won! Your chosen number ${args[1]} matched. Lottery result is ${x}. You received ${kqua * 2}`, threadID, messageID);
            } else {
                await Currencies.decreaseMoney(senderID, parseInt(kqua));
                return api.sendMessage(`You lost. Your chosen number ${args[1]} did not match. Lottery result is ${x}. You lost ${kqua}`, threadID, messageID);
            }
        });
    }

    // Difference game
    if (choose === 'difference') {
        if (isNaN(kqua)) return api.sendMessage("Invalid number", threadID, messageID);
        if (kqua == difference) {
            await Currencies.increaseMoney(senderID, parseInt(betAmount * 2));
            return api.sendMessage(`You won. Your choice: ${kqua}\nBot numbers: ${z}, ${y}\nDifference: ${difference}\nYou received ${betAmount * 2}`, threadID, messageID);
        } else {
            await Currencies.decreaseMoney(senderID, parseInt(betAmount));
            return api.sendMessage(`You lost. Your choice: ${kqua}\nBot numbers: ${z}, ${y}\nDifference: ${difference}\nYou lost ${betAmount}`, threadID, messageID);
        }
    }

    // Rock Paper Scissors game
    if (args[0] === 'rps') {
        function outMsg(data) { api.sendMessage(data, threadID, messageID); }
        if (!args[1]) return outMsg("Please enter 'scissors', 'rock', or 'paper'");
        const choices = ["scissors", "rock", "paper"];
        const botTurn = choices[Math.floor(Math.random() * choices.length)];
        const userTurn = args[1];

        if (choices.includes(userTurn)) {
            if (userTurn === botTurn) return outMsg(`Draw\nUser: ${userTurn}\nBot: ${botTurn}\nBalance unchanged`);
            if (userTurn === 'scissors') return outMsg(botTurn === 'rock' ? `YOU LOST\nUser: ${userTurn}\nBot: ${botTurn}` : `YOU WON\nUser: ${userTurn}\nBot: ${botTurn}`);
            if (userTurn === 'rock') return outMsg(botTurn === 'paper' ? `YOU LOST\nUser: ${userTurn}\nBot: ${botTurn}` : `YOU WON\nUser: ${userTurn}\nBot: ${botTurn}`);
            if (userTurn === 'paper') return outMsg(botTurn === 'scissors' ? `YOU LOST\nUser: ${userTurn}\nBot: ${botTurn}` : `YOU WON\nUser: ${userTurn}\nBot: ${botTurn}`);
        }
    }

    // Slot game
    if (choose === 'slot') {
        const slotItems = ["🍇","🍉","🍊","🍏","🥭","🍓","🍒","🍌","🥝","🥑","🌽"];
        const number = [];
        let win = false;
        for (let i = 0; i < 3; i++) number[i] = Math.floor(Math.random() * slotItems.length);
        if (number[0] === number[1] && number[1] === number[2]) win = true;
        else if (number[0] === number[1] || number[0] === number[2] || number[1] === number[2]) win = true;
        api.sendMessage(`╭──────────╮\n🎰 » ${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]} 🎰╰──────────╯\n${win ? "🎉 Congratulations! You won!" : "😢 You lost!"}`, threadID, messageID);
    }
};

module.exports.handleReply = async function({ args, event, Users, api, handleReply, Currencies }) {
    const { threadID, messageID } = event;
    const { author } = handleReply;
    if (event.senderID != author) return api.sendMessage("You cannot respond to this menu.", threadID, messageID);

    switch (handleReply.type) {
        case "choosee": {
            switch (event.body) {
                case "1": {
                    return api.sendMessage(`Please enter command: ${global.config.PREFIX}casino [big or small] [amount]`, threadID, messageID);
                }
                case "2": {
                    return api.sendMessage(`Please enter command: ${global.config.PREFIX}casino [even or odd] [amount]`, threadID, messageID);
                }
                case "3": {
                    return api.sendMessage(`Please enter command: ${global.config.PREFIX}casino lottery [your number] [amount]`, threadID, messageID);
                }
                case "4": {
                    return api.sendMessage(`Please enter command: ${global.config.PREFIX}casino difference [your number] [amount]`, threadID, messageID);
                }
                case "5": {
                    return api.sendMessage(`Please enter command: ${global.config.PREFIX}casino slot [amount]`, threadID, messageID);
                }
                case "6": {
                    return api.sendMessage(`Please enter command: ${global.config.PREFIX}casino rps ["scissors", "rock", "paper"]`, threadID, messageID);
                }
                default: {
                    return api.sendMessage("Invalid option selected.", threadID, messageID);
                }
            }
        }
    }
};

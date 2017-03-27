var Discord = require('discord.io');

var bot = new Discord.Client({
  token: "MjgyNzIwNDg0MDYyMzk2NDE2.C7oRxw.GT_8ARievHziqh_q_IyFSh6sWUw",
  autorun: true
});

const previousMessages = [];

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('disconnect', function(errMsg, code) {
  bot.connect();
});

bot.on('message', function(user, userId, channelId, message, event) {
  if (message === "ping") {
    bot.sendMessage({
      to: channelId,
      message: "pong"
    });
  } else if (previousMessages.includes(message)) {
    bot.deleteMessage({
      channelID: channelId,
      messageID: event.d.id
    }, (err) => {
      console.log(err);
    });
  } else {
    previousMessages.push(message);
  }
});

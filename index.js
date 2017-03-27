const Discord = require('discord.io');

const bot = new Discord.Client({
  token: process.env.DISCORD_TOKEN,
  autorun: true,
});

const previousMessages = [];

bot.on('ready', () => {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('disconnect', () => {
  bot.connect();
});

bot.on('message', (user, userId, channelId, message, event) => {
  if (message === 'ping') {
    bot.sendMessage({
      to: channelId,
      message: 'pong',
    });
  } else if (user !== bot.username) {
    if (previousMessages.includes(message)) {
      bot.deleteMessage({
        channelID: channelId,
        messageID: event.d.id,
      }, (err) => {
        console.log(err);
      });
    } else {
      previousMessages.push(message);
    }
  }
});

const Discord = require('discord.io');
const exec = require('child_process').exec;

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
  if (message === '!ping') {
    bot.sendMessage({
      to: channelId,
      message: 'pong',
    });
  } else if (message === '!status') {
    exec('cat /sys/class/power_supply/BAT0/status', (error, stdout) => {
      if (error) {
        bot.sendMessage({
          to: channelId,
          message: 'Error getting status!',
        });
        return;
      }
      bot.sendMessage({
        to: channelId,
        message: `Battery status: ${stdout}`,
      });
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

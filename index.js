const Discord = require('discord.io');
const exec = require('child_process').exec;
const persistence = require('./persistence');

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN not set!');
  process.exit(1);
}

const bot = new Discord.Client({
  token: process.env.DISCORD_TOKEN,
  autorun: true,
});

const isEvents = channel => channel === '262864567695048705';

bot.on('ready', () => {
  persistence.init(() => {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);

    const triggers = [];

    bot.on('disconnect', () => {
      bot.connect();
    });

    const addMessage = (trigger, action, ignoreEvents = true) => {
      if (trigger instanceof Array) {
        for (let i = 0; i < trigger.length; i += 1) {
          triggers.push({ trigger: trigger[i], action });
        }
      } else {
        triggers.push({ trigger, action, ignoreEvents });
      }
    };

    addMessage('!ping', () => 'pong');
    addMessage(/saren/i, () => 'Who is this Saren character??? Hey Scur do you know who Saren is??');
    addMessage(['!status', '!battery'], (opts) => {
      exec('cat /sys/class/power_supply/BAT0/status', (error, stdout) => {
        if (error) {
          opts.bot.sendMessage({
            to: opts.channelId,
            message: 'Error getting status!',
          });
          return;
        }
        opts.bot.sendMessage({
          to: opts.channelId,
          message: `Battery status: ${stdout}`,
        });
      });
    });

    const handleMessage = (user, userId, channelId, message, event) => {
      let wasTrigger = false;
      const doTrigger = (trigger, matches) => {
        wasTrigger = true;
        const result = trigger.action({
          user,
          userId,
          channelId,
          message,
          event,
          bot,
          matches,
        });

        if (result) {
          bot.sendMessage({
            to: channelId,
            message,
          });
        }
      };

      for (let i = 0; i < triggers.length; i += 1) {
        const trigger = triggers[i];

        // ignore events channel
        if (trigger.ignoreEvents && isEvents(channelId)) {
          // Skipping because this is the events channel.
        } else if (trigger.trigger instanceof RegExp) {
          const matches = message.match(trigger.trigger);
          if (matches) {
            doTrigger(trigger, matches);
          }
        } else if (trigger instanceof Function) {
          if (trigger()) {
            doTrigger(trigger);
          }
        } else if (message === trigger.trigger) {
          doTrigger(trigger);
        }
      }

      if (!wasTrigger && user !== bot.username && isEvents(channelId)) {
        persistence.checkMessage(message, () => {
          console.log(`message exists: ${message}`);
          bot.deleteMessage({
            channelID: channelId,
            messageID: event.d.id,
          }, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }, () => console.log(`message is new: ${message}`), err => console.error(err));
      }
    };

    bot.on('message', handleMessage);

    bot.on('any', (event) => {
      if (event.t === 'MESSAGE_UPDATE') {
        handleMessage(event.d.author ? event.d.author.username : null,
            event.d.author ? event.d.author.id : null,
            event.d.channel_id,
            event.d.content,
            event);
      }
    });
  });
});

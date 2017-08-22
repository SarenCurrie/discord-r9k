const Discord = require('discord.io');
const statusUtils = require('./status-utils.js');
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

const triggers = [];

const addMessage = (trigger, action, ignoreEvents = true) => {
  if (trigger instanceof Array) {
    for (let i = 0; i < trigger.length; i += 1) {
      triggers.push({ trigger: trigger[i], action, ignoreEvents });
    }
  } else {
    triggers.push({ trigger, action, ignoreEvents });
  }
};

bot.on('ready', () => {
  persistence.init(() => {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);

    bot.on('disconnect', () => {
      console.log('Disconnected, attempting to reconnect');
      bot.connect();
    });

    const printHelp = () => triggers
        .filter(trigger => typeof trigger.trigger === 'string')
        .map(trigger => trigger.trigger)
        .sort()
        .reduce((a, b) => `${a}\n${b}`);

    addMessage('!help', printHelp);
    addMessage('!ping', () => {
      console.log('pinged');
      return 'pong';
    });
    addMessage(/saren/i, () => (Math.random() < 0.2 ? 'Who is this Saren character??? Hey Scur do you know who Saren is??' : null));

    addMessage('!status', (opts) => {
      let message = '';
      statusUtils.getBattery.then((battery) => {
        // Add battry status to response if available
        message = message.concat(battery).concat('\n');
      }).catch(() => {}) // Ignore errors
      .then(() => {
        // Add uptime information to response, whether battery check was successful or not, then send message
        message = message.concat(statusUtils.getUptime());
        opts.bot.sendMessage({
          to: opts.channelId,
          message,
        });
      });
    });
    addMessage('!battery', (opts) => {
      statusUtils.getBattery.then((battery) => {
        opts.bot.sendMessage({
          to: opts.channelId,
          message: battery,
        });
      }).catch(() => {
        opts.bot.sendMessage({
          to: opts.channelId,
          message: 'Error getting battery data.',
        });
      });
    });
    addMessage('!uptime', statusUtils.getUptime);
    addMessage('!events',
        opts => (isEvents(opts.channelId) ? 'Check out the pinned messages!' : 'Check out the pinned messages in the #Events channel!'),
        false);

    try {
      require('./secret-triggers.js').init(addMessage); // eslint-disable-line global-require
    } catch (e) {
      console.warn('secret-triggers.js does not exist, ignoring.');
    }

    const handleMessage = (user, userId, channelId, message, event) => {
      let wasTrigger = false;

      // Ignore mysertious non-existant messages
      if (!message) {
        return;
      }

      // Ignore own messages
      if (userId === bot.id) {
        return;
      }

      // Ignore messages for the music bot
      if (message.startsWith('pls')) {
        return;
      }

      // Ignore image posts
      if (event.d.attachments.length !== 0) {
        return;
      }

      const doTrigger = (trigger, matches) => {
        console.log('triggered');
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

        console.log('sending this:');
        console.log(result);
        console.log(`to channel: ${channelId}`);

        if (result) {
          bot.sendMessage({
            to: channelId,
            message: result,
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
        } else if (trigger.trigger instanceof Function) {
          if (trigger.trigger()) {
            doTrigger(trigger);
          }
        } else if (message === trigger.trigger) {
          doTrigger(trigger);
        }
      }

      if (!wasTrigger && !isEvents(channelId)) {
        persistence.checkMessage(message, () => {
          console.log(`message exists: ${message}`);

          // TODO: Add support for delete reason in the audit log once discord.io adds support

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

exports.addMessage = addMessage;

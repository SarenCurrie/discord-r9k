const Discord = require('discord.io');
const schedule = require('node-schedule').scheduleJob;
const pkg = require('../package.json');

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN not set!');
  process.exit(1);
}

const bot = new Discord.Client({
  token: process.env.DISCORD_TOKEN,
  autorun: true,
});

const triggers = [];
const interceptors = [];

let initialized = false;

const addMessageTrigger = (trigger, action) => {
  if (trigger instanceof Array) {
    for (let i = 0; i < trigger.length; i += 1) {
      triggers.push({ trigger: trigger[i], action });
    }
  } else {
    triggers.push({ trigger, action });
  }
};

const addRawInterceptor = (eventTypes, ignoreTriggers, action) => {
  interceptors.push({
    eventTypes,
    action,
    ignoreTriggers,
  });
};

const addCronTrigger = (cron, callback) => {
  schedule(cron, () => {
    callback(bot);
  });
};

const addPlugin = (plugin) => {
  if (!initialized) {
    console.console.error('Please call init first.');
  }
  plugin.init({
    addMessageTrigger,  // On submit or edit
    addCronTrigger, // On scheduled
    addRawInterceptor, // Intercept everything
  });
};

const init = () => new Promise((resolve, reject) => {
  bot.on('ready', () => {
    if (initialized) {
      reject(new Error('Already initialized!'));
    } else {
      initialized = true;
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

      const printVersion = () => `I'm currently running version ${pkg.version}`;

      addMessageTrigger('!help', printHelp);
      addMessageTrigger('!version', printVersion);
      addMessageTrigger('!ping', () => 'pong');

      const handleMessage = (user, userId, channelId, message, event) => {
        let wasTrigger = message.startsWith('!');

        const doTrigger = (trigger, matches) => {
          const result = trigger.action({
            user,
            userId,
            channelId,
            message,
            event,
            bot,
            matches,
          });

          if (result && typeof result === 'string') {
            bot.sendMessage({
              to: channelId,
              message: result,
            });
          }
        };

        for (let i = 0; i < triggers.length; i += 1) {
          const trigger = triggers[i];

          if (trigger.trigger instanceof RegExp) {
            const matches = message.match(trigger.trigger);
            if (matches) {
              wasTrigger = true;
              doTrigger(trigger, matches);
            }
          } else if (trigger.trigger instanceof Function) {
            if (trigger.trigger()) {
              wasTrigger = true;
              doTrigger(trigger);
            }
          } else if (message === trigger.trigger) {
            wasTrigger = true;
            doTrigger(trigger);
          }
        }

        return wasTrigger;
      };

      bot.on('any', (event) => {
        const textEvents = ['MESSAGE_CREATE', 'MESSAGE_UPDATE'];
        let wasTrigger = false;

        if (!event.d) {
          console.log('Ignoring event with no data.');
          return;
        }

        // Ignore other bots
        if (event.d.author && event.d.author.bot) {
          console.log('Ignoring bot post.');
          return;
        }

        if (event.d.content && textEvents.some(type => type === event.t) && !event.d.pinned) {
          wasTrigger = handleMessage(event.d.author ? event.d.author.username : null,
              event.d.author ? event.d.author.id : null,
              event.d.channel_id,
              event.d.content,
              event);
        }

        interceptors.forEach((interceptor) => {
          if (wasTrigger && interceptor.ignoreTriggers) {
            return;
          }
          if (interceptor.eventTypes.some(t => t === event.t) && !event.d.pinned) {
            interceptor.action({ event, bot });
          }
        });
      });

      resolve();
    }
  });
});

exports.init = init;
exports.addMessageTrigger = addMessageTrigger;
exports.addPlugin = addPlugin;

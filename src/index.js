const app = require('./app');
const statusUtils = require('./status-utils');
const r9k = require('./plugins/r9k/r9k');
const markets = require('./plugins/markets/markets');
const devNull = require('./plugins/dev-null/dev-null');

app.init().then(() => {
  app.addMessageTrigger('!status', (opts) => {
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
  app.addMessageTrigger('!battery', (opts) => {
    statusUtils.getBattery().then((battery) => {
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

  app.addMessageTrigger('!uptime', statusUtils.getUptime);
  app.addPlugin(r9k);

  app.addPlugin(markets({
    dailyUpdateChannel: '385585269287682048',
    dailyUpdateTime: '30 4 * * *',
  }));
  app.addPlugin(devNull({ channel: '349421970083020801' }));

  try {
    app.addPlugin(require('./secret-triggers.js')); // eslint-disable-line global-require, import/no-unresolved
  } catch (e) {
    console.warn('secret-triggers.js does not exist or is broken, ignoring.');
  }
}).catch((e) => {
  console.error('Error starting up');
  console.error(e);
  process.exit(1);
});

const DEFAULT_CHECK_FREQUENCY = 10;
const DEFAULT_MIN_AGE = 5;

module.exports = (opts) => {
  const init = (app) => {
    app.addCronTrigger(`*/${opts.checkFrequency || DEFAULT_CHECK_FREQUENCY} * * * *`, (bot) => {
      console.log('trying to clear messages.');
      bot.getMessages({ channelID: opts.channel, limit: 100 }, (err, messages) => {
        if (err) {
          console.error(err);
        } else {
          bot.deleteMessages({
            channelID: opts.channel,
            messageIDs: messages.filter(m => Date.now() - new Date(m.timestamp).valueOf() > (opts.minAge || DEFAULT_MIN_AGE) * 60 * 1000).map(m => m.id),
          });
        }
      });
    });
  };

  return { init };
};

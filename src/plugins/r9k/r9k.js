const persistence = require('./persistence');

exports.init = (app) => {
  persistence.init((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    app.addRawInterceptor(['MESSAGE_CREATE', 'MESSAGE_UPDATE'], true, (event) => {
      const message = event.event.d.content;
      const channelId = event.event.d.channel_id;
      const author = event.event.d.author;

      if (!message || !channelId || !author) {
        return;
      }

      const userId = author.id;
      const botPrefixes = ['pls', '?'];

      // Ignore mysertious non-existant messages
      if (!message) {
        return;
      }

      // Ignore own messages
      if (userId === event.bot.id) {
        return;
      }

      // Ignore messages for other bots
      if (botPrefixes.some(p => message.startsWith(p))) {
        return;
      }

      // Ignore other bots
      if (event.event.d.author && event.event.d.author.bot) {
        console.log('Ignoring bot post.');
        return;
      }

      // Ignore image posts
      if (event.event.d.attachments.length !== 0) {
        return;
      }

      persistence.checkMessage(message, () => {
        console.log(`message exists: ${message}`);

        // TODO: Add support for delete reason in the audit log once discord.io adds support

        event.bot.deleteMessage({
          channelID: channelId,
          messageID: event.event.d.id,
        }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }, () => console.log(`message is new: ${message}`), err => console.error(err));
    });
  });
};

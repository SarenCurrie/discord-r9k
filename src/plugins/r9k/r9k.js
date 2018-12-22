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
      const serverId = event.event.d.guild_id;
      const author = event.event.d.author;

      if (!message || !channelId || !author) {
        return;
      }

      const userId = author.id;
      // TODO remove legacy bot triggers
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

      // Ignore bot mentions
      const mention = /^<@!?(\d+)>/g.exec(message);
      if (mention && mention[1]) {
        const mentionedId = mention[1];
        const member = event.bot.servers[serverId].members[mentionedId];
        if (member.roles.some(roleId => event.bot.servers[serverId].roles[roleId].name === 'Bots')) {
          return;
        }
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

      // Ignore karma bot
      if (/<@!?\d+>\s*([+]{2,}|[-]{2,})/g.exec(message)) {
        return;
      }

      persistence.checkMessage(message, () => {
        // TODO: Add support for delete reason in the audit log once discord.io adds support

        event.bot.deleteMessage({
          channelID: channelId,
          messageID: event.event.d.id,
        }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }, () => {}, err => console.error(err));
    });
  });

  app.addCronTrigger('*/2 * * * *', () => {
    persistence.save();
  });
};

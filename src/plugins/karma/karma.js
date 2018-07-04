const persistence = require('./persistence');

exports.init = (app) => {
  persistence.init((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    function parseMod(mod) {
      let sum = 0;
      const translate = { '+': 1, '-': -1 };

      /* Find the total karma modifier by summing postive & negatives.
       * (ignore first character since @person+ doesn't do anything)
       */
      for (let i = 1; i < mod.length; i++) {
        sum += translate[mod.charAt(i)];
      }
      return sum;
    }

    function formatRanking(data, users) {
      let output = 'Karma Summary:\n```';

      data
          .filter(user => users[user.id])
          .forEach((user, index) => {
            const username = users[user.id].username;
            const pos = index + 1;

            output += `\n${pos}. ${username}: ${user.karma} karma`;
          });
      output += '\n```';
      return output;
    }

    const karma = {
      update(id, mod) {
        const diff = parseMod(mod);

        return persistence.addKarma(id, diff, () => {});
      },

      show(users) {
        return formatRanking(persistence.getKarma(), users);
      },
    };

    app.addMessageTrigger(/<@!?(\d+)>\s?(\+{2}|--)/i, (opts) => {
      const id = opts.matches[1];
      const mod = opts.matches[2]; // Karma modifier

      // Check if message was edited (TODO: make this better by tracking which messages have granted karma before)
      if (opts.event.t === 'MESSAGE_UPDATE') { return null; }

      // check if user matches target
      if (opts.userId === id) { return `I'm sorry, <@${id}>. I'm afraid I can't do that.`; }

      return karma.update(id, mod);
    });

    app.addMessageTrigger('!karma', (opts) => {
      const users = opts.bot.users;
      return karma.show(users);
    });
  });
};

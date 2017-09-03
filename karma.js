const persistence = require('./persistence');

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

  for (let i = 0; i < data.length; i++) {
    const user = data[i];
    const username = users[user.id].username;
    const pos = i + 1;

    output += `\n${pos}. ${username} - ${user.karma} karma`;
  }
  output += '\n```';
  return output;
}

module.exports = {
  update(id, mod) {
    const diff = parseMod(mod);

    return persistence.addKarma(id, diff, () => {});
  },

  show(users) {
    return formatRanking(persistence.getKarma(), users);
  },
};

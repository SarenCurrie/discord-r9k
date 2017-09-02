const persistence = require('./persistence');

module.exports = {
  add(userId) {
    return persistence.addKarma(userId, () => {});
  },
  show() {
    return 'Nothing to show';
  },
};

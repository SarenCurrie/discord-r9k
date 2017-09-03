const Loki = require('lokijs');

let db;
let messages;
let initialized = false;

const init = (done) => {
  if (initialized) {
    return;
  }

  initialized = true;
  db = new Loki('loki.json');

  db.loadDatabase({}, (err) => {
    if (err) {
      done(err);
    }

    messages = db.getCollection('messages');
    if (!messages) {
      messages = db.addCollection('messages', {
        indicies: 'message',
      });
    }
    done();
  });
};

exports.init = init;

function userCollection() {
  // Check collection exists, otherwise create it
  let users = db.getCollection('users');
  if (!users) {
    users = db.addCollection('users', { indices: ['id', 'karma'] });
  }
  return users;
}

function getUser(userId) {
  const users = userCollection();
  let user = users.findOne({ id: userId });

  if (!user) {
    console.log(`Creating karma entry for user id ${userId}`);
    users.insert({ id: userId, karma: 0 });
    user = users.findOne({ id: userId });
  }
  return user;
}

exports.addKarma = (userId, diff) => {
  const users = userCollection();
  const user = getUser(userId);
  const oldKarma = user.karma;
  const newKarma = oldKarma + diff;
  const translate = { true: 'increased', false: 'decreased' };

  user.karma = newKarma;
  users.update(user);
  db.saveDatabase();

  console.log(`Karma for ${userId} was ${translate[diff > 0]} to ${user.karma}`);

  return `<@${userId}>'s karma has ${translate[diff > 0]} to ${newKarma}`;
};

exports.getKarma = () => {
  const users = userCollection();
  let ranking = users.getDynamicView('Karma Ranking');

  if (!ranking) {
    ranking = users.addDynamicView('Karma Ranking');
    ranking.applySimpleSort('karma', true);
  }
  return ranking.data();
};

exports.checkMessage = (message, updated, created, error) => {
  const updateMessage = () => {
    let toCall;

    const result = messages.findOne({
      message,
    });

    if (!result) {
      messages.insert({
        message,
        count: 1,
      });

      toCall = created;
    } else {
      result.count += 1;
      messages.update(result);

      toCall = updated;
    }

    db.saveDatabase((err) => {
      if (err) {
        console.error(err);
      } else {
        toCall();
      }
    });
  };

  if (!messages) {
    init((err) => {
      if (err) {
        error(err);
      } else {
        updateMessage();
      }
    });
  } else {
    updateMessage();
  }
};

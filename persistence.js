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

exports.addKarma = (userId) => {
  // Check collection exitst, otherwise create it
  let users = db.getCollection('users');
  if (!users) {
    users = db.addCollection('users', { indices: ['id', 'karma'] });
  }

  // Check user exitst, otherwise create it
  let userExists = users.find({'id': userId}).length > 0;
  if (!userExists) {
    users.insert({ 'id': userId, 'karma': 0 });
  }

  let user = users.find({'id': userId})[0]; // Assume id is unique
  user.karma++;
  users.update(user)

  console.log(`Updated <@${userId}>'s karma to ${user.karma}`);
  return `<@${userId}>'s karma has increased to ${user.karma}`;
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

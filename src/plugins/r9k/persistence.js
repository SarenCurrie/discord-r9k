const Loki = require('lokijs');

let db;
let messages;
let initialized = false;

const init = (done) => {
  if (initialized) {
    return;
  }

  initialized = true;
  db = new Loki('./data/r9k.loki.json');

  db.loadDatabase({}, (err) => {
    if (err) {
      done(err);
    }

    messages = db.getCollection('messages');
    if (!messages) {
      messages = db.addCollection('messages', {
        indices: 'message',
      });
    }
    messages.ensureIndex('message');
    console.log('Done indexing, R9K ready!');
    done();
  });
};

exports.init = init;

exports.checkMessage = (message, updated, created, error) => {
  const updateMessage = () => {
    const result = messages.findOne({
      message,
    });

    if (!result) {
      messages.insert({
        message,
        count: 1,
      });

      created();
    } else {
      result.count += 1;
      messages.update(result);

      updated();
    }
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

exports.save = (cb) => db.saveDatabase((err) => {
  if (err) {
    console.error(err);
  } else {
    cb && cb();
  }
});

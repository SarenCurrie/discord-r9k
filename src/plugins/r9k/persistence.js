const Loki = require('lokijs');

let db;
let messages;
let hashedMessages;
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
        indicies: 'message',
      });
    }
    hashedMessages = db.getCollection('hashedMessages');
    if (!hashedMessages) {
      hashedMessages = db.addCollection('hashedMessages', {
        indicies: 'hash',
      });
    }
    done();
  });
};

exports.init = init;

exports.checkMessage = (message, shouldHash, updated, created, error) => {
  const updateMessage = () => {
    let toCall;

    const result = messages.findOne({
      message,
    });

    const hash = crypto.createHash('sha256');

    hash.update(message);

    const hashedMessage = hash.digest('hex');

    const hashResult = hashedMessages.findOne({
      hash: hashedMessage,
    });

    if (!result && !hashResult) {
      if (shouldHash) {
        hashedMessages.insert({
          hash: hashedMessage,
          count: 1,
        });
      } else {
        messages.insert({
          message,
          count: 1,
        });
      }

      toCall = created;
    } else {
      if (result) {
        result.count += 1;
        messages.update(result);
      } else if (!shouldHash) {
        console.log('Creating new entry as message only exists in hash store');
        messages.insert({
          message,
          count: 1,
        });
      } else {
        console.log('updating hash store');
        hashResult.count += 1;
        hashedMessages.update(hashResult);
      }

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

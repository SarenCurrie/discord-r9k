const Loki = require('lokijs');

let db;
let messages;

const init = (done) => {
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

# discord-r9k

An experimental [Robot 9000](https://blog.xkcd.com/2008/01/14/robot9000-and-xkcd-signal-attacking-noise-in-chat/) for Discord. Currently supports tracking and deleting duplicate messages, clearing specific channels after a given time, and responding to specific trigger phrases.

## Usage

Note: requires node.js v8.

First, go to the [Discord developer documentation](https://discordapp.com/developers/), create an app and get your token.

```
export DISCORD_TOKEN=<token>
npm install
node index.js
```

To add the bot to your server, insert the client ID into this URL https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID_GOES_HERE&scope=bot&permissions=0 and paste it into your browser of choice.

The bot as it is currently has a lot of things tuned to my personal discord server, which I plan to refactor away at some point, in the mean time, you will probably need to head into the code and take these out if they end up annoying you.

## Documentation

### `addMessage(trigger, callback)`

#### `trigger`

A The trigger can be one of the following types:

- `String` The callback will be triggered if the message matches the String exactly
- `RegExp` If the message matches the RegExp, the callback will be triggered, the callback argument will include the list of matches returned by [`String.match()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
- `Array` All array elements are treated as separate triggers

#### `callback`

A function that will be called if the trigger is matched.

The callback has one argument, an object containing the following fields:

- `user` the user that triggered this event
- `userId` that users, id
- `channelId` the id of the channel
- `message` the message that triggered this event
- `matches` any matches if the trigger was a regular expression
- `event` the full [event](https://izy521.gitbooks.io/discord-io/content/Events.html) from discord.io that triggered this event
- `bot` this discord.io [client](https://izy521.gitbooks.io/discord-io/content/Methods/Client.html) object, can be used to respond asynchronously

If the callback returns a String, it will be sent as a message to the channel this event was triggered from. If you want to respond to an event asynchronously, you can use the `bot` object to send a message.

```javascript
addMessage('!someTrigger', (opts) => {
  returnsAPromise().then(result => opts.bot.sendMessage({
    message: result,
    to: opts.channelId,
  }));
});
```

## Further reading

See the [Discord developer docs](https://discordapp.com/developers/), or the docs for [discord.io](https://www.npmjs.com/package/discord.io), the library that powers this bot.

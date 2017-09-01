const yahooFinance = require('yahoo-finance');

const CACHE_TIME = 30 * 60 * 1000;

const groups = {
  tech: {
    heading: 'NZ Tech',
    currency: 'NZD',
    securities: {
      'ERD.NZ': '<:eroad:349675137995374592>',
      'OHE.NZ': '<:orion:330132803243212801>',
      'VGL.NZ': '<:vista:349674926736801805>',
    },
  },
  crypto: {
    heading: 'Trendy Crypto',
    currency: 'USD',
    securities: {
      'BTCUSD=X': '<:BTC:350872732747038721>',
      'ETHUSD=X': '<:ETH:350872707258122241>',
    },
  },
  index: {
    heading: 'Actually Smart Investments',
    currency: 'NZD',
    securities: {
      '^NZ50': ':flag_nz:',
    },
  },
  currency: {
    heading: 'Currencies',
    currency: 'NZD',
    securities: {
      'AUDNZD=X': ':flag_au:',
      'NZD=X': ':flag_us:', // USD
      'GBPNZD=X': ':flag_gb:',
    },
  },
};

const cache = {};

const getFromCache = (symbol) => {
  if (cache[symbol] && cache[symbol].expiry > Date.now()) {
    return Promise.resolve(cache[symbol].value);
  }
  return yahooFinance.quote({ symbol, modules: ['price', 'summaryDetail'] }).then((result) => {
    cache[symbol] = {
      value: result,
      expiry: Date.now() + CACHE_TIME,
    };

    return result;
  });
};

const getTrend = (quote) => {
  if (quote.price - quote.close > 0) {
    return ':chart_with_upwards_trend:';
  } else if (quote.price - quote.close < 0) {
    return ':chart_with_downwards_trend:';
  }
  return ':expressionless:';
};

const getYahooPricesForGroup = securities => new Promise((resolve, reject) => {
  const getLogo = symbol => securities.securities[symbol] || null;
  Promise.all(Object.keys(securities.securities).map(symbol => getFromCache(symbol)))
  .then((quotes) => {
    resolve(quotes.map(q => ({
      symbol: q.price.symbol,
      price: q.price.regularMarketPrice,
      close: q.price.regularMarketPreviousClose,
      cap: q.summaryDetail.marketCap,
    }))
    .sort((a, b) => b.cap - a.cap)
    .map(q =>
        `${getLogo(q.symbol) || q.symbol}: \`$${q.price.toFixed(2)} ${securities.currency}\` ${getTrend(q)} \`${Math.abs(q.price - q.close).toFixed(2)}\``)
    .reduce((a, b) => `${a}\n\t${b}`, `**${securities.heading}**`));
  }).catch(err => reject(err));
});

const getYahooPrices = securities => Promise.all(securities.map(group => getYahooPricesForGroup(group)));

const getPrices = securities => getYahooPrices(securities);

exports.all = () => getPrices(Object.values(groups));
exports.single = name =>
    (groups[name] ? getPrices([groups[name]]) :
    Promise.reject(`Do not have a group called ${name}. try ${Object.keys(groups).reduce((a, b) => `${a}, ${b}`)}`));

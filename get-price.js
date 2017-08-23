const yahooFinance = require('yahoo-finance');

module.exports = () => {
  const securities = {
    'ERD.NZ': '<:eroad:349675137995374592>',
    'OHE.NZ': '<:orion:330132803243212801>',
    'VGL.NZ': '<:vista:349674926736801805>',
  };

  const getLogo = symbol => securities[symbol] || null;
  const getTrend = (quote) => {
    if (quote.price - quote.close > 0) {
      return ':chart_with_upwards_trend:';
    } else if (quote.price - quote.close < 0) {
      return ':chart_with_downwards_trend:';
    }
    return ':expressionless:';
  };

  return new Promise((resolve, reject) => {
    Promise.all(Object.keys(securities).map(symbol => yahooFinance.quote({ symbol, modules: ['price', 'summaryDetail'] })))
    .then((quotes) => {
      resolve(quotes.map(q => ({
        symbol: q.price.symbol,
        price: q.price.regularMarketPrice,
        close: q.price.regularMarketPreviousClose,
        cap: q.summaryDetail.marketCap,
      }))
      .sort((a, b) => b.cap - a.cap)
      .map(quote =>
          `${getLogo(quote.symbol) || quote.symbol}: \`$${quote.price.toFixed(2)}\` ${getTrend(quote)} \`${Math.abs(quote.price - quote.close).toFixed(2)}\``)
      .reduce((a, b) => `${a}\n${b}`));
    }).catch(err => reject(err));
  });
};

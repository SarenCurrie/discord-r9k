const yahooFinance = require('yahoo-finance');

module.exports = () => {
  const logos = {
    'ERD.NZ': ':eroad:',
    'OHE.NZ': ':orion:',
    'VGL.NZ': ':vista:',
  };

  const getLogo = symbol => logos[symbol] || null;
  const getTrend = (quote) => {
    if (quote.price - quote.close > 0) {
      return ':chart_with_upwards_trend:';
    } else if (quote.price - quote.close < 0) {
      return ':chart_with_downwards_trend:';
    }
    return ':expressionless';
  };

  return new Promise((resolve, reject) => {
    Promise.all([
      yahooFinance.quote({
        symbol: 'OHE.NZ',
        modules: ['price', 'summaryDetail'],
      }),
      yahooFinance.quote({
        symbol: 'ERD.NZ',
        modules: ['price', 'summaryDetail'],
      }),
      yahooFinance.quote({
        symbol: 'VGL.NZ',
        modules: ['price', 'summaryDetail'],
      }),
    ]).then((quotes) => {
      resolve(quotes.map(q => ({
        symbol: q.price.symbol,
        price: q.price.regularMarketPrice,
        close: q.price.regularMarketPreviousClose,
        cap: q.summaryDetail.marketCap,
      }))
      .sort((a, b) => b.cap - a.cap)
      .map(quote => `${getLogo(quote.symbol) || quote.symbol}: $${quote.price.toFixed(2)} ${getTrend(quote)} ${Math.abs(quote.price - quote.close).toFixed(2)}`)
      .reduce((a, b) => `${a}\n${b}`));
    }).catch(err => reject(err));
  });
};

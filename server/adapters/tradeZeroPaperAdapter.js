function buildMarketDataProvider() {
  const providerName = (process.env.MARKET_DATA_PROVIDER || 'mock').toLowerCase();

  if (providerName === 'finnhub') {
    return {
      async fetchScan(symbols) {
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) {
          return buildMockMarketSnapshot(symbols);
        }

        const results = await Promise.all(symbols.map(async (symbol) => {
          const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`);
          if (!response.ok) {
            return null;
          }
          const quote = await response.json();
          if (!quote || !quote.c || quote.c === 0) {
            return null;
          }
          return {
            symbol,
            companyName: symbol,
            price: Number(quote.c),
            volume: Number(quote.v || 0)
          };
        }));

        return results.filter(Boolean);
      }
    };
  }

  return {
    async fetchScan(symbols) {
      return buildMockMarketSnapshot(symbols);
    }
  };
}

function buildMockMarketSnapshot(symbols) {
  return symbols.map((symbol, index) => {
    const companyName = [`${symbol.toUpperCase()} Holdings`, `${symbol.toUpperCase()} Labs`, `${symbol.toUpperCase()} Ventures`][index % 3];
    const price = Number((Math.random() * 16 + 2.5).toFixed(2));
    const volume = Math.floor(Math.random() * 18000000 + 6000000);
    return {
      symbol,
      companyName,
      price,
      volume
    };
  });
}

module.exports = { buildMarketDataProvider };

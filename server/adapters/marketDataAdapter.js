require('dotenv').config();
const express = require('express');
const path = require('path');
const { buildMarketDataProvider } = require('./server/adapters/marketDataAdapter');
const { TradeZeroPaperAdapter } = require('./server/adapters/tradeZeroPaperAdapter');

const app = express();
const port = Number(process.env.PORT || 3000);
const marketDataProvider = buildMarketDataProvider();
const tradeZeroPaperAdapter = new TradeZeroPaperAdapter();

const paperState = {
  account: {
    equity: 100000,
    cash: 100000,
    pnl: 0,
    openOrders: 0,
    buyingPower: 100000
  },
  orders: [],
  recentActivity: [],
  scannerStatus: 'stopped'
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function generateCandles(basePrice, drift = 0) {
  const candles = [];
  let price = basePrice;
  for (let i = 0; i < 20; i += 1) {
    price = Math.max(1.5, price * (1 + (Math.random() - 0.45) * 0.04 + drift));
    candles.push(Number(price.toFixed(2)));
  }
  return candles;
}

function computeTechnicalData(symbol, basePrice, volume, companyName) {
  const candles = generateCandles(basePrice, (Math.random() - 0.5) * 0.02);
  const vwap = candles.reduce((sum, value) => sum + value, 0) / candles.length;
  const resistance = Math.max(...candles) * 1.02;
  const rvol = Number((Math.random() * 2.8 + 1.4).toFixed(2));
  const rsi = clamp(Math.round(55 + Math.random() * 14), 50, 70);
  const macdPositive = Math.random() > 0.35;
  const price = Number(basePrice.toFixed(2));
  const entry = Number((price * (0.995 + Math.random() * 0.015)).toFixed(2));
  const stopLoss = Number((entry * 0.95).toFixed(2));
  const target20 = Number((entry * 1.2).toFixed(2));
  const target50 = Number((entry * 1.5).toFixed(2));
  const momentumScore = Math.min(99, Math.max(50, Math.round((rvol / 3) * 100 + (rsi / 70) * 35 + volume / 45000000 * 20)));

  return {
    symbol,
    companyName,
    price,
    volume,
    rvol,
    rsi,
    macdPositive,
    vwap: Number(vwap.toFixed(2)),
    resistance: Number(resistance.toFixed(2)),
    entry,
    stopLoss,
    target20,
    target50,
    momentumScore,
    signal: macdPositive ? 'Bullish' : 'Watch',
    newestCandle: candles[candles.length - 1],
    candles
  };
}

async function runScan() {
  const symbols = (process.env.MARKET_SYMBOLS || 'AAPL,MSFT,NVDA,AMD,PLTR,SMCI,SOFI,LCID,META,AMZN,SHOP,TSLA,RIOT,ROKU,CMCSA,NIO,CRSP,DKNG,INTC').split(',').map((s) => s.trim()).filter(Boolean);
  const scanResults = await marketDataProvider.fetchScan(symbols);

  const qualified = scanResults
    .map((item) => {
      const result = computeTechnicalData(item.symbol, item.price, item.volume, item.companyName || item.symbol);
      return {
        ...result,
        qualifies:
          result.price < 20 &&
          result.volume > 5000000 &&
          result.rvol > 2 &&
          result.rsi >= 50 &&
          result.rsi <= 70 &&
          result.macdPositive &&
          result.price >= result.vwap * 0.995 &&
          result.price >= result.resistance * 0.995
      };
    })
    .filter((stock) => stock.qualifies)
    .sort((a, b) => b.momentumScore - a.momentumScore);

  return qualified;
}

function addActivity(type, text, amount = 0) {
  paperState.recentActivity.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    text,
    amount,
    createdAt: new Date().toISOString()
  });
  paperState.recentActivity = paperState.recentActivity.slice(0, 8);
}

function recalcAccount() {
  const totalOpenValue = paperState.orders.reduce((sum, order) => sum + order.marketValue, 0);
  paperState.account.openOrders = paperState.orders.length;
  paperState.account.equity = paperState.account.cash + totalOpenValue + paperState.account.pnl;
  paperState.account.buyingPower = paperState.account.cash;
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    status: 'PAPER_ONLY',
    time: new Date().toISOString(),
    scannerRunning: paperState.scannerStatus === 'running'
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    paperOnly: true,
    marketProvider: process.env.MARKET_DATA_PROVIDER || 'mock',
    tradezeroEnv: process.env.TRADEZERO_ENV || 'paper',
    autoRefreshMs: 20000,
    filters: {
      maxPrice: 20,
      minVolume: 5000000,
      minRVOL: 2,
      rsiMin: 50,
      rsiMax: 70
    }
  });
});

app.get('/api/scanner', async (req, res) => {
  try {
    const watches = await runScan();
    const summary = {
      scanned: watches.length,
      bullish: watches.filter((item) => item.macdPositive).length,
      volumeLeaders: watches.filter((item) => item.volume > 12000000).length,
      lastUpdated: new Date().toISOString()
    };
    res.json({ summary, results: watches });
  } catch (error) {
    res.status(500).json({
      error: 'Scanner failed',
      message: error.message || 'Unknown scanner error',
      paperOnly: true
    });
  }
});

app.get('/api/paper/account', (req, res) => {
  recalcAccount();
  res.json({
    paperOnly: true,
    account: paperState.account,
    recentActivity: paperState.recentActivity,
    openOrders: paperState.orders
  });
});

app.get('/api/paper/orders', (req, res) => {
  res.json({
    paperOnly: true,
    orders: paperState.orders,
    recentActivity: paperState.recentActivity
  });
});

app.post('/api/paper/orders', (req, res) => {
  const { symbol, companyName, side, quantity, price, entry, stopLoss, target20, target50 } = req.body || {};

  if (!symbol || !side || !quantity || !price) {
    return res.status(400).json({ error: 'symbol, side, quantity, and price are required', paperOnly: true });
  }

  const order = {
    id: `PO-${Date.now()}`,
    symbol,
    companyName: companyName || symbol,
    side,
    quantity: Number(quantity),
    price: Number(price),
    entry: Number(entry || price),
    stopLoss: Number(stopLoss || price * 0.95),
    target20: Number(target20 || price * 1.2),
    target50: Number(target50 || price * 1.5),
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    marketValue: Number(quantity) * Number(price)
  };

  paperState.orders.unshift(order);
  paperState.account.cash = Number((paperState.account.cash - order.marketValue).toFixed(2));
  paperState.account.openOrders = paperState.orders.length;
  addActivity('ORDER', `${side} ${quantity} ${symbol} @ ${formatMoney(order.price)}`, order.marketValue);

  return res.status(201).json({
    success: true,
    paperOnly: true,
    order,
    account: paperState.account
  });
});

const liveTradeReject = (req, res) => {
  res.status(403).json({
    error: 'Live trading rejected',
    message: 'PAPER ONLY: Live trading endpoints are disabled. This application does not execute real orders.',
    paperOnly: true
  });
};

app.post('/api/trading/live', liveTradeReject);
app.post('/api/orders/live', liveTradeReject);
app.post('/api/live/trade', liveTradeReject);
app.post('/api/trade/live', liveTradeReject);

app.get('/api/tradezero/status', async (req, res) => {
  try {
    const status = await tradeZeroPaperAdapter.getPaperStatus();
    res.json({
      paperOnly: true,
      ...status
    });
  } catch (error) {
    res.status(200).json({
      paperOnly: true,
      adapter: 'tradezero-paper',
      connected: false,
      note: 'Adapter configured for future TradeZero paper API integration. No live trading available.'
    });
  }
});

app.post('/api/tradezero/orders', (req, res) => {
  return res.status(403).json({
    error: 'TradeZero paper order submission is disabled in this app',
    message: 'This app is PAPER ONLY and intentionally blocks live or paper broker execution. Use the in-app simulated order flow only.',
    paperOnly: true
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║ PAPER TRADE STOCK SCANNER                       ║');
  console.log('║ Paper-only mode is active                       ║');
  console.log('║ Server running at http://localhost:' + port + '     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log('PAPER ONLY: Real trading is disabled.');
  console.log('Use the in-app paper order flow for simulated entries.');
});

module.exports = { app, server, paperState, runScan };

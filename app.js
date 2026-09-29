const sampleStocks = [
  { symbol: 'AAOI', price: 9.8, volume: 1200000, rvol: 2.7, rsi: 63, macd: 'Bullish', vwap: 9.34, resistance: 10.4 },
  { symbol: 'BPMC', price: 12.6, volume: 940000, rvol: 2.2, rsi: 58, macd: 'Bullish', vwap: 12.1, resistance: 13.1 },
  { symbol: 'CLSK', price: 17.5, volume: 1680000, rvol: 3.4, rsi: 68, macd: 'Bullish', vwap: 16.9, resistance: 18.2 },
  { symbol: 'GME', price: 18.9, volume: 1450000, rvol: 2.9, rsi: 72, macd: 'Bullish', vwap: 17.8, resistance: 19.6 },
  { symbol: 'HBAN', price: 11.1, volume: 780000, rvol: 1.8, rsi: 54, macd: 'Bullish', vwap: 10.8, resistance: 11.6 },
  { symbol: 'MSTR', price: 19.4, volume: 2050000, rvol: 4.1, rsi: 70, macd: 'Bullish', vwap: 18.7, resistance: 20.5 },
  { symbol: 'MU', price: 14.3, volume: 980000, rvol: 2.0, rsi: 61, macd: 'Bullish', vwap: 13.9, resistance: 15.1 },
  { symbol: 'NIO', price: 7.2, volume: 8100000, rvol: 5.8, rsi: 66, macd: 'Bullish', vwap: 6.9, resistance: 7.8 },
  { symbol: 'PLTR', price: 19.8, volume: 5890000, rvol: 3.2, rsi: 64, macd: 'Bullish', vwap: 19.1, resistance: 20.5 },
  { symbol: 'TSLA', price: 18.4, volume: 6610000, rvol: 1.9, rsi: 52, macd: 'Bullish', vwap: 18.0, resistance: 19.2 }
];

const state = {
  running: false,
  timer: null
};

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resultsEl = document.getElementById('scannerResults');
const template = document.getElementById('stockRowTemplate');
const watchlistCount = document.getElementById('watchlistCount');
const longCount = document.getElementById('longCount');
const volumeCount = document.getElementById('volumeCount');

const filters = {
  maxPrice: document.getElementById('maxPrice'),
  minVolume: document.getElementById('minVolume'),
  minRVOL: document.getElementById('minRVOL'),
  rsiBias: document.getElementById('rsiBias')
};

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function buildSignal(stock) {
  const maxPrice = Number(filters.maxPrice.value || 20);
  const minVolume = Number(filters.minVolume.value || 500000);
  const minRVOL = Number(filters.minRVOL.value || 1.5);
  const rsiBias = Number(filters.rsiBias.value || 65);

  const underMaxPrice = stock.price <= maxPrice;
  const volumeOK = stock.volume >= minVolume;
  const rvolOK = stock.rvol >= minRVOL;
  const rsiOK = stock.rsi >= 52 && stock.rsi <= rsiBias;
  const aboveVWAP = stock.price >= stock.vwap;
  const belowResistance = stock.price < stock.resistance;
  const macdOK = stock.macd === 'Bullish';

  const bullish = underMaxPrice && volumeOK && rvolOK && rsiOK && aboveVWAP && belowResistance && macdOK;

  return {
    signal: bullish ? 'Long' : 'Watch',
    entry: stock.price,
    stopLoss: stock.price * 0.93,
    target20: stock.price * 1.2,
    target50: stock.price * 1.5
  };
}

function renderStocks() {
  const stocks = sampleStocks.filter((stock) => stock.price <= Number(filters.maxPrice.value || 20));
  resultsEl.innerHTML = '';

  let longSetups = 0;
  let volumeAlerts = 0;

  stocks.forEach((stock) => {
    const signal = buildSignal(stock);
    const card = template.content.cloneNode(true);

    card.querySelector('.ticker').textContent = 'NASDAQ / OTC';
    card.querySelector('h3').textContent = stock.symbol;
    card.querySelector('.signal-badge').textContent = signal.signal;
    card.querySelector('.signal-badge').classList.toggle('red', signal.signal !== 'Long');
    card.querySelector('.price').textContent = formatMoney(stock.price);
    card.querySelector('.volume').textContent = formatNumber(stock.volume);
    card.querySelector('.rvol').textContent = `${stock.rvol.toFixed(1)}x`;
    card.querySelector('.rsi').textContent = String(stock.rsi);
    card.querySelector('.macd').textContent = stock.macd;
    card.querySelector('.vwap').textContent = formatMoney(stock.vwap);
    card.querySelector('.resistance').textContent = formatMoney(stock.resistance);
    card.querySelector('.entry').textContent = formatMoney(signal.entry);
    card.querySelector('.stop-loss').textContent = formatMoney(signal.stopLoss);
    card.querySelector('.target20').textContent = formatMoney(signal.target20);
    card.querySelector('.target50').textContent = formatMoney(signal.target50);

    const notes = [
      stock.volume >= Number(filters.minVolume.value || 500000) ? 'Volume surge' : 'Volume below threshold',
      stock.rvol >= Number(filters.minRVOL.value || 1.5) ? 'RVOL expansion' : 'RVOL weak',
      stock.price >= stock.vwap ? 'Above VWAP' : 'Below VWAP',
      stock.price < stock.resistance ? 'Below resistance' : 'Near resistance'
    ].join(' • ');

    card.querySelector('.notes').textContent = notes;

    if (signal.signal === 'Long') {
      longSetups += 1;
    }
    if (stock.volume >= Number(filters.minVolume.value || 500000)) {
      volumeAlerts += 1;
    }

    resultsEl.appendChild(card);
  });

  watchlistCount.textContent = String(stocks.length);
  longCount.textContent = String(longSetups);
  volumeCount.textContent = String(volumeAlerts);
}

function startScanner() {
  if (state.running) {
    return;
  }

  state.running = true;
  statusDot.classList.add('running');
  statusText.textContent = 'Running';
  renderStocks();

  state.timer = window.setInterval(() => {
    sampleStocks.forEach((stock) => {
      const drift = (Math.random() - 0.5) * 0.6;
      stock.price = Number((stock.price + drift).toFixed(2));
      stock.volume = Math.round(stock.volume * (0.96 + Math.random() * 0.12));
      stock.rvol = Number((stock.rvol + (Math.random() - 0.5) * 0.7).toFixed(1));
      stock.rsi = Math.max(30, Math.min(75, Math.round(stock.rsi + (Math.random() - 0.5) * 4)));
      stock.vwap = Number((stock.vwap + drift * 0.6).toFixed(2));
      stock.resistance = Number((stock.resistance + drift * 0.7).toFixed(2));
    });

    renderStocks();
  }, 3500);
}

function stopScanner() {
  state.running = false;

  if (state.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }

  statusDot.classList.remove('running');
  statusText.textContent = 'Stopped';
}

function bindEvents() {
  startBtn.addEventListener('click', startScanner);
  stopBtn.addEventListener('click', stopScanner);

  Object.values(filters).forEach((input) => {
    input.addEventListener('input', renderStocks);
  });
}

bindEvents();
renderStocks();

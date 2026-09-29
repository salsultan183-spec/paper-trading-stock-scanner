const state = {
  scannerRunning: false,
  scanTimer: null,
  account: null,
  orders: [],
  activity: [],
  results: []
};

const refs = {
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  startBtn: document.getElementById('startScannerBtn'),
  stopBtn: document.getElementById('stopScannerBtn'),
  accountEquity: document.getElementById('accountEquity'),
  accountCash: document.getElementById('accountCash'),
  accountPnl: document.getElementById('accountPnl'),
  openOrdersCount: document.getElementById('openOrdersCount'),
  watchlistCount: document.getElementById('watchlistCount'),
  momentumCount: document.getElementById('momentumCount'),
  volumeAlertsCount: document.getElementById('volumeAlertsCount'),
  lastScanText: document.getElementById('lastScanText'),
  scannerTableBody: document.getElementById('scannerTableBody'),
  openOrdersList: document.getElementById('openOrdersList'),
  activityList: document.getElementById('activityList'),
  paperTradeForm: document.getElementById('paperTradeForm'),
  tradeSymbol: document.getElementById('tradeSymbol'),
  tradeSide: document.getElementById('tradeSide'),
  tradeQty: document.getElementById('tradeQty'),
  tradePrice: document.getElementById('tradePrice'),
  maxPriceInput: document.getElementById('maxPriceInput'),
  minVolumeInput: document.getElementById('minVolumeInput'),
  minRvolInput: document.getElementById('minRvolInput'),
  rsiRangeInput: document.getElementById('rsiRangeInput')
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const number = new Intl.NumberFormat('en-US');

function setStatus(running) {
  state.scannerRunning = running;
  refs.statusDot.classList.toggle('running', running);
  refs.statusText.textContent = running ? 'Scanning' : 'Stopped';
  refs.startBtn.disabled = running;
  refs.stopBtn.disabled = !running;
}

function renderMoney(value) {
  return money.format(Number(value || 0));
}

function renderVolume(value) {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return number.format(num);
}

function renderTable(results) {
  state.results = results || [];
  const rows = state.results.map((stock) => `
    <tr>
      <td><strong>${stock.symbol}</strong></td>
      <td>${stock.companyName || stock.symbol}</td>
      <td>${renderMoney(stock.price)}</td>
      <td>${renderVolume(stock.volume)}</td>
      <td>${Number(stock.rvol).toFixed(2)}</td>
      <td>${stock.rsi}</td>
      <td class="${stock.macdPositive ? 'positive' : 'negative'}">${stock.macdPositive ? 'Bullish' : 'Bearish'}</td>
      <td>${renderMoney(stock.vwap)}</td>
      <td>${renderMoney(stock.resistance)}</td>
      <td>${renderMoney(stock.entry)}</td>
      <td>${renderMoney(stock.stopLoss)}</td>
      <td>${renderMoney(stock.target20)}</td>
      <td>${renderMoney(stock.target50)}</td>
      <td>${stock.momentumScore}</td>
    </tr>
  `).join('');

  refs.scannerTableBody.innerHTML = rows || `
    <tr>
      <td colspan="14">
        <div class="empty-state">No qualifying stocks match the current filters.</div>
      </td>
    </tr>
  `;

  refs.watchlistCount.textContent = String(state.results.length);
  refs.momentumCount.textContent = String(state.results.filter((stock) => stock.momentumScore >= 80).length);
  refs.volumeAlertsCount.textContent = String(state.results.filter((stock) => stock.volume > 10000000).length);
}

function renderAccount(account) {
  refs.accountEquity.textContent = renderMoney(account?.equity || 0);
  refs.accountCash.textContent = renderMoney(account?.cash || 0);
  refs.accountPnl.textContent = renderMoney(account?.pnl || 0);
  refs.openOrdersCount.textContent = String(account?.openOrders || 0);
}

function renderOrders(orders) {
  state.orders = orders || [];
  if (!state.orders.length) {
    refs.openOrdersList.innerHTML = '<div class="empty-state">No open paper trades.</div>';
    return;
  }

  refs.openOrdersList.innerHTML = state.orders.map((order) => `
    <div class="mini-order">
      <div>
        <strong>${order.side} ${order.symbol}</strong><br />
        <span>${order.quantity} shares @ ${renderMoney(order.price)}</span>
      </div>
      <div>
        <strong>${renderMoney(order.marketValue)}</strong><br />
        <span>${order.status}</span>
      </div>
    </div>
  `).join('');
}

function renderActivity(items) {
  state.activity = items || [];
  if (!state.activity.length) {
    refs.activityList.innerHTML = '<div class="empty-state">No recent activity.</div>';
    return;
  }

  refs.activityList.innerHTML = state.activity.map((item) => `
    <div class="activity-entry">
      <div>
        <strong>${item.type}</strong><br />
        <span>${item.text}</span>
      </div>
      <div>
        <strong>${item.amount ? renderMoney(item.amount) : ''}</strong><br />
        <span>${new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </div>
  `).join('');
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}

async function refreshAccount() {
  try {
    const response = await fetchJson('/api/paper/account');
    renderAccount(response.account);
    renderOrders(response.openOrders);
    renderActivity(response.recentActivity);
  } catch (error) {
    console.error('Failed to refresh account', error);
  }
}

async function fetchScannerResults() {
  try {
    const response = await fetchJson('/api/scanner');
    renderTable(response.results || []);
    refs.lastScanText.textContent = `Last scan: ${new Date(response.summary?.lastUpdated || Date.now()).toLocaleTimeString()}`;
  } catch (error) {
    console.error('Failed to fetch scanner results', error);
  }
}

function startScanner() {
  if (state.scannerRunning) return;
  setStatus(true);
  fetchScannerResults();
  state.scanTimer = setInterval(fetchScannerResults, 20000);
}

function stopScanner() {
  if (!state.scannerRunning) return;
  setStatus(false);
  clearInterval(state.scanTimer);
  state.scanTimer = null;
}

async function submitPaperOrder(event) {
  event.preventDefault();

  const payload = {
    symbol: refs.tradeSymbol.value.trim().toUpperCase(),
    companyName: refs.tradeSymbol.value.trim().toUpperCase(),
    side: refs.tradeSide.value,
    quantity: Number(refs.tradeQty.value),
    price: Number(refs.tradePrice.value),
    entry: Number(refs.tradePrice.value),
    stopLoss: Number(refs.tradePrice.value) * 0.95,
    target20: Number(refs.tradePrice.value) * 1.2,
    target50: Number(refs.tradePrice.value) * 1.5
  };

  try {
    const response = await fetchJson('/api/paper/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    renderAccount(response.account);
    renderOrders(response.account ? state.orders : []);
    await refreshAccount();
    refs.paperTradeForm.reset();
    refs.tradeQty.value = '100';
    refs.tradePrice.value = '10.00';
  } catch (error) {
    alert(error.message || 'Unable to submit paper order');
  }
}

function bindEvents() {
  refs.startBtn.addEventListener('click', startScanner);
  refs.stopBtn.addEventListener('click', stopScanner);
  refs.paperTradeForm.addEventListener('submit', submitPaperOrder);
  refs.maxPriceInput.addEventListener('change', () => fetchScannerResults());
  refs.minVolumeInput.addEventListener('change', () => fetchScannerResults());
  refs.minRvolInput.addEventListener('change', () => fetchScannerResults());
  refs.rsiRangeInput.addEventListener('change', () => fetchScannerResults());
}

async function bootstrap() {
  bindEvents();
  await refreshAccount();
  await fetchScannerResults();
  setStatus(false);
}

bootstrap();

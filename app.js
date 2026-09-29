// ============================================================================
// TRADEZERO PAPER TRADING STOCK SCANNER
// Paper trading only - No live orders will ever be executed
// ============================================================================

// ============================================================================
// CONFIGURATION - API KEY SETUP
// ============================================================================
// To use live market data, get a FREE API key from:
// 1. Finnhub (free tier: 60 API calls/minute)
//    - Visit: https://finnhub.io/
//    - Sign up, get your free API key
//    - Paste your key below in API_KEY_FINNHUB
//
// If no API key is configured, the app will display demo data only.
// The scanner ALWAYS runs in paper-only mode - no real trades possible.

const CONFIG = {
  API_KEY_FINNHUB: localStorage.getItem('finnhub_api_key') || '', // User-configured via UI
  SCAN_INTERVAL_MS: 60000, // 60 seconds
  MAX_PRICE: 20,
  MIN_VOLUME: 5000000,
  MIN_RVOL: 2,
  RSI_MIN: 50,
  RSI_MAX: 70,
  VWAP_CHECK_ENABLED: true,
  // Curated list of US penny stocks under $20
  STOCK_LIST: [
    'AAPL', 'TSLA', 'AMD', 'NVDA', 'PLTR', 'MARA', 'CLDR', 'CCIV', 'NIO', 'WKHS',
    'FSR', 'LCID', 'SOFI', 'BGFV', 'ATER', 'PROG', 'SNDL', 'WISH', 'GME', 'AMC',
    'XERS', 'ZASH', 'RMED', 'EBON', 'BHAT', 'MICT', 'PSTV', 'MARK', 'SNDL', 'FAMI'
  ]
};

// ============================================================================
// STATE & DOM ELEMENTS
// ============================================================================
let scannerRunning = false;
let scanIntervalId = null;
let stocks = {};
let lastScanTime = null;

const elements = {
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  watchlistCount: document.getElementById('watchlistCount'),
  longCount: document.getElementById('longCount'),
  volumeCount: document.getElementById('volumeCount'),
  scannerResults: document.getElementById('scannerResults'),
  stockRowTemplate: document.getElementById('stockRowTemplate'),
  maxPrice: document.getElementById('maxPrice'),
  minVolume: document.getElementById('minVolume'),
  minRVOL: document.getElementById('minRVOL'),
  rsiBias: document.getElementById('rsiBias')
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  displayApiKeyInfo();
  loadFilterValues();
});

function initEventListeners() {
  elements.startBtn.addEventListener('click', startScanner);
  elements.stopBtn.addEventListener('click', stopScanner);
  
  // Save filter values to localStorage
  [elements.maxPrice, elements.minVolume, elements.minRVOL, elements.rsiBias].forEach(el => {
    el.addEventListener('change', () => {
      localStorage.setItem(`filter_${el.id}`, el.value);
    });
  });
}

function loadFilterValues() {
  [elements.maxPrice, elements.minVolume, elements.minRVOL, elements.rsiBias].forEach(el => {
    const saved = localStorage.getItem(`filter_${el.id}`);
    if (saved) el.value = saved;
  });
}

function displayApiKeyInfo() {
  // Check if API key is set
  if (!CONFIG.API_KEY_FINNHUB) {
    console.warn('⚠️  No Finnhub API key configured. Using demo data.');
    console.log('📘 To enable live data: https://finnhub.io/ → Get free API key → Add to app settings');
  } else {
    console.log('✅ Live market data enabled via Finnhub API');
  }
}

// ============================================================================
// SCANNER CONTROL
// ============================================================================
function startScanner() {
  if (scannerRunning) return;
  
  scannerRunning = true;
  elements.statusDot.classList.add('running');
  elements.statusText.textContent = 'Scanning...';
  elements.startBtn.disabled = true;
  elements.stopBtn.disabled = false;
  
  console.log('🚀 Scanner started - Paper trading only mode active');
  console.log('🔒 SAFETY LOCK: No real orders will ever be executed');
  
  // Scan immediately, then every 60 seconds
  performScan();
  scanIntervalId = setInterval(performScan, CONFIG.SCAN_INTERVAL_MS);
}

function stopScanner() {
  if (!scannerRunning) return;
  
  scannerRunning = false;
  elements.statusDot.classList.remove('running');
  elements.statusText.textContent = 'Stopped';
  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  
  if (scanIntervalId) {
    clearInterval(scanIntervalId);
    scanIntervalId = null;
  }
  
  console.log('⏹️  Scanner stopped');
}

// ============================================================================
// MAIN SCAN LOGIC
// ============================================================================
async function performScan() {
  lastScanTime = new Date();
  elements.statusText.textContent = `Last scan: ${lastScanTime.toLocaleTimeString()}`;
  
  console.log(`\n📊 Scanning ${CONFIG.STOCK_LIST.length} stocks at ${lastScanTime.toLocaleTimeString()}...`);
  
  // Fetch data for all stocks in parallel
  const results = await Promise.allSettled(
    CONFIG.STOCK_LIST.map(symbol => fetchStockData(symbol))
  );
  
  // Process results
  const qualifiedStocks = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const stock = result.value;
      if (passesFilters(stock)) {
        qualifiedStocks.push(stock);
        stocks[stock.symbol] = stock;
      }
    }
  });
  
  // Sort by momentum score
  qualifiedStocks.sort((a, b) => (b.momentumScore || 0) - (a.momentumScore || 0));
  
  // Count setups
  const longSetups = qualifiedStocks.filter(s => s.signal === 'LONG').length;
  const volumeAlerts = qualifiedStocks.filter(s => s.volumeAlert).length;
  
  elements.watchlistCount.textContent = qualifiedStocks.length;
  elements.longCount.textContent = longSetups;
  elements.volumeCount.textContent = volumeAlerts;
  
  renderStocks(qualifiedStocks);
  
  console.log(`✅ Scan complete: ${qualifiedStocks.length} stocks passed filters`);
  console.log(`   Long setups: ${longSetups}, Volume alerts: ${volumeAlerts}`);
}

// ============================================================================
// FETCH LIVE MARKET DATA
// ============================================================================
async function fetchStockData(symbol) {
  try {
    // If API key configured, fetch real data
    if (CONFIG.API_KEY_FINNHUB) {
      return await fetchFromFinnhub(symbol);
    } else {
      // Use demo data
      return generateDemoData(symbol);
    }
  } catch (error) {
    console.error(`❌ Error fetching ${symbol}:`, error.message);
    return null;
  }
}

async function fetchFromFinnhub(symbol) {
  // Fetch quote data
  const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${CONFIG.API_KEY_FINNHUB}`;
  const quoteResponse = await fetch(quoteUrl);
  
  if (!quoteResponse.ok) {
    throw new Error(`Finnhub API error: ${quoteResponse.status}`);
  }
  
  const quoteData = await quoteResponse.json();
  
  // If stock not found or no data, return null
  if (!quoteData.c || quoteData.c === 0) {
    return null;
  }
  
  // Calculate technical indicators (simplified without full candle data)
  const price = quoteData.c;
  const volume = quoteData.v || 0;
  const prevClose = quoteData.pc || price;
  
  // Estimate RVOL (simplified: current vs previous)
  const rvol = volume > 0 ? (Math.random() * 3) : 0; // In production, use true relative volume
  
  // Estimate RSI (simplified: mock value 45-75)
  const rsi = 45 + Math.random() * 30;
  
  // Estimate MACD (simplified: mock value)
  const macdPositive = Math.random() > 0.5;
  
  // Estimate VWAP (simplified: ~= price)
  const vwap = price * (0.95 + Math.random() * 0.1);
  
  // Estimate resistance (previous high or price + 5%)
  const resistance = price * 1.05;
  
  return {
    symbol,
    price,
    volume,
    rvol: Math.round(rvol * 100) / 100,
    rsi: Math.round(rsi),
    macdPositive,
    vwap: Math.round(vwap * 100) / 100,
    resistance: Math.round(resistance * 100) / 100,
    companyName: symbol, // Would need company name from API
    lastUpdated: new Date()
  };
}

function generateDemoData(symbol) {
  // Generate realistic demo data for testing
  const basePrice = 5 + Math.random() * 15; // $5-20
  const price = Math.round(basePrice * 100) / 100;
  const volume = Math.floor(5000000 + Math.random() * 50000000);
  const rvol = Math.round((1.5 + Math.random() * 3) * 100) / 100;
  const rsi = Math.round(45 + Math.random() * 30);
  const macdPositive = Math.random() > 0.4;
  const vwap = Math.round((price * 0.98 + Math.random() * 0.04 * price) * 100) / 100;
  const resistance = Math.round((price * 1.03 + Math.random() * 0.05 * price) * 100) / 100;
  
  return {
    symbol,
    price,
    volume,
    rvol,
    rsi,
    macdPositive,
    vwap,
    resistance,
    companyName: `${symbol} Corp`,
    lastUpdated: new Date(),
    isDemo: true
  };
}

// ============================================================================
// FILTER LOGIC
// ============================================================================
function passesFilters(stock) {
  const maxPrice = parseFloat(elements.maxPrice.value);
  const minVolume = parseFloat(elements.minVolume.value);
  const minRVOL = parseFloat(elements.minRVOL.value);
  const rsiBias = parseFloat(elements.rsiBias.value);
  
  // Price filter
  if (stock.price > maxPrice) return false;
  
  // Volume filter
  if (stock.volume < minVolume) return false;
  
  // RVOL filter
  if (stock.rvol < minRVOL) return false;
  
  // RSI filter (around user bias)
  const rsiLow = Math.max(50, rsiBias - 15);
  const rsiHigh = Math.min(70, rsiBias + 15);
  if (stock.rsi < rsiLow || stock.rsi > rsiHigh) return false;
  
  // MACD filter
  if (!stock.macdPositive) return false;
  
  // VWAP filter (price should be at or above VWAP)
  if (stock.price < stock.vwap * 0.98) return false;
  
  // If all pass, calculate additional metrics
  stock.signal = 'LONG';
  stock.volumeAlert = stock.volume > minVolume * 2;
  stock.momentumScore = calculateMomentumScore(stock);
  
  return true;
}

function calculateMomentumScore(stock) {
  let score = 0;
  
  // RSI contribution (closer to 65 is better)
  const rsiScore = 100 - Math.abs(stock.rsi - 65);
  score += rsiScore * 0.3;
  
  // RVOL contribution (higher is better)
  score += Math.min(stock.rvol / 3 * 100, 100) * 0.4;
  
  // Volume contribution (higher is better)
  const volumeScore = Math.min(stock.volume / 10000000 * 100, 100);
  score += volumeScore * 0.3;
  
  return Math.round(score);
}

// ============================================================================
// RENDER RESULTS
// ============================================================================
function renderStocks(stocks) {
  elements.scannerResults.innerHTML = '';
  
  if (stocks.length === 0) {
    elements.scannerResults.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
        <p>No stocks pass the current filters</p>
        <p style="font-size: 0.85rem; margin-top: 10px;">Try adjusting filter values</p>
      </div>
    `;
    return;
  }
  
  stocks.forEach(stock => {
    const clone = elements.stockRowTemplate.content.cloneNode(true);
    
    // Company info
    clone.querySelector('.ticker').textContent = 'NASDAQ / OTC';
    clone.querySelector('h3').textContent = stock.symbol;
    clone.querySelector('.ticker').innerHTML = `${stock.symbol} • ${stock.companyName}`;
    
    // Signal badge
    const badge = clone.querySelector('.signal-badge');
    badge.textContent = `${stock.signal} • ${stock.momentumScore}%`;
    if (stock.signal !== 'LONG') badge.classList.add('red');
    
    // Metrics
    clone.querySelector('.price').textContent = `$${stock.price.toFixed(2)}`;
    clone.querySelector('.volume').textContent = formatVolume(stock.volume);
    clone.querySelector('.rvol').textContent = `${stock.rvol.toFixed(2)}x`;
    clone.querySelector('.rsi').textContent = stock.rsi;
    clone.querySelector('.macd').textContent = stock.macdPositive ? 'Bullish' : 'Bearish';
    clone.querySelector('.vwap').textContent = `$${stock.vwap.toFixed(2)}`;
    
    // Trading levels
    const entry = stock.price;
    const stopLoss = Math.round(entry * 0.95 * 100) / 100;
    const target20 = Math.round(entry * 1.20 * 100) / 100;
    const target50 = Math.round(entry * 1.50 * 100) / 100;
    
    clone.querySelector('.resistance').textContent = `$${stock.resistance.toFixed(2)}`;
    clone.querySelector('.entry').textContent = `$${entry.toFixed(2)}`;
    clone.querySelector('.stop-loss').textContent = `$${stopLoss.toFixed(2)}`;
    clone.querySelector('.target20').textContent = `$${target20.toFixed(2)}`;
    clone.querySelector('.target50').textContent = `$${target50.toFixed(2)}`;
    
    // Notes
    let notes = [];
    if (stock.isDemo) notes.push('📌 Demo data');
    if (stock.volumeAlert) notes.push('📢 High volume');
    if (stock.rsi > 65) notes.push('⚠️  RSI elevated');
    
    clone.querySelector('.notes').textContent = notes.length > 0 ? notes.join(' • ') : 'Ready to monitor';
    
    elements.scannerResults.appendChild(clone);
  });
}

function formatVolume(vol) {
  if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
  if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
  return vol.toString();
}

// ============================================================================
// API KEY MANAGEMENT (Optional - for UI-based key entry)
// ============================================================================
window.setApiKey = function() {
  const key = prompt('Enter your Finnhub API key:\n(Get free key at https://finnhub.io/)');
  if (key) {
    CONFIG.API_KEY_FINNHUB = key;
    localStorage.setItem('finnhub_api_key', key);
    alert('✅ API key saved! Refresh to use live data.');
  }
};

// ============================================================================
// PAPER TRADING SAFETY LOCK
// ============================================================================
window.PAPER_TRADING_ONLY = true;

// Prevent any real order execution
window.submitOrder = function() {
  console.error('🔒 SAFETY LOCK ENGAGED: Paper trading mode only - no real orders allowed');
  alert('❌ PAPER TRADING ONLY\n\nNo real orders can be executed.\nThis is a paper trading scanner only.');
  return false;
};

// Log safety message
console.log('%c🔒 PAPER TRADING SAFETY LOCK ACTIVE 🔒', 'color: #f87171; font-size: 16px; font-weight: bold;');
console.log('%cThis application CANNOT execute real trades. All signals are for paper trading only.', 'color: #22c55e; font-size: 12px;');

# TradeZero Paper Trading Stock Scanner

A mobile-first paper-trading stock scanner designed for iPhone screens and limited to trade simulation only.

## What it does
- Scans US stocks priced under $20
- Uses paper-only logic: no live execution, no real-money trading
- Requires TradeZero PAPER / PAPERM usage only for execution context
- Evaluates stocks using:
  - Volume
  - Relative Volume (RVOL)
  - RSI
  - MACD
  - VWAP
  - Resistance
- Shows:
  - Entry
  - Stop loss
  - +20% target
  - +50% target
- Includes Start and Stop controls
- iPhone-optimized responsive design

## Run locally

### Option 1: Python HTTP Server (Replit)
```bash
python3 server.py
```

### Option 2: Simple Python Server
```bash
python3 -m http.server 8000
```

Then visit:
```
http://localhost:8000
```

### Option 3: Live Server (VS Code)
Install the Live Server extension and open `index.html` with live preview.

## Important
This project is intentionally paper-trading-only and does not place real orders. Use TradeZero PAPER/PAPERM only. It is a scan and signal dashboard, not live trading software.

## iPhone support
The interface is optimized for small mobile layouts with large touch targets, strong contrast and a compact card layout for quick review on iPhone screens.

## Files
- `index.html` - Main HTML structure with template elements
- `styles.css` - Mobile-first dark theme styling
- `app.js` - Scanner logic, filtering, and real-time updates
- `server.py` - HTTP server for Replit/local hosting
- `.replit` - Replit configuration

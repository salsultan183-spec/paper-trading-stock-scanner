# Paper Trade Stock Scanner

This project is a paper-trading-only stock scanner and simulated order dashboard for US stocks.

Important:
- This application is PAPER ONLY.
- It never executes live trading orders.
- All order flows are simulated and stored in memory only.
- Any endpoint that is intended for live trading is blocked with a server-side guard.

## Features
- Professional mobile-first dashboard
- US stock scanner with filters for price, volume, RVOL, RSI, MACD, VWAP, and resistance
- Automatic scan refresh
- Paper Trading panel with simulated order entry and recent activity
- Start/Stop scanner controls
- Responsive design for iPhone and desktop
- Server-side adapters to connect to a real market-data provider and TradeZero paper API later
- API keys and secrets stay on the server, not in browser code

## Safety and compliance
- PAPER ONLY is clearly labeled throughout the UI and backend.
- All live trading endpoints return HTTP 403 and a clear rejection message.
- When external providers are not configured, the app uses an internal mock provider for local testing only.
- Real trading is intentionally impossible in this app.

## Tech stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- Server-side adapters for market data and paper trading

## Local setup
1. Clone the repository.
2. In the project root, install dependencies:
   npm install
3. Copy the environment template:
   cp .env.example .env
4. Start the app:
   npm start
5. Open:
   http://localhost:3000

## Optional environment config
Set any external provider secrets in `.env` on the server only. Example values:
- FINNHUB_API_KEY=
- ALPACA_API_KEY=
- ALPACA_API_SECRET=
- TRADEZERO_API_KEY=
- TRADEZERO_API_SECRET=

The frontend will never receive those secrets.

## Project structure
- `server.js` — Express app and API routes
- `server/adapters/marketDataAdapter.js` — market-data adapter interface and provider wiring
- `server/adapters/tradeZeroPaperAdapter.js` — TradeZero paper API adapter placeholder
- `public/index.html` — dashboard UI
- `public/styles.css` — mobile-first styling
- `public/app.js` — client logic for scanning, dashboard refresh, and simulated orders

## Live trading rejection guard
The app includes a hard reject guard for any live trading endpoint, for example:
- `POST /api/trading/live`
- `POST /api/orders/live`

These return `403` with a clear message explaining that the app is paper trading only.

## Notes
This application is for educational and simulation purposes only. It does not provide financial advice and does not place any real orders.

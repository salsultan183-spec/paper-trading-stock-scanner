:root {
  --bg: #07131d;
  --bg-strong: #020c13;
  --panel: rgba(15, 23, 42, 0.88);
  --panel-alt: rgba(12, 18, 29, 0.9);
  --line: rgba(148, 163, 184, 0.2);
  --text: #ecf3ff;
  --muted: #9fb1c8;
  --green: #34d399;
  --green-deep: #10b981;
  --red: #f87171;
  --amber: #fbbf24;
  --cyan: #7dd3fc;
  --shadow: rgba(2, 6, 23, 0.55);
}

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(34, 197, 94, 0.14), transparent 20%),
    linear-gradient(180deg, var(--bg-strong), var(--bg));
  color: var(--text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(1200px, calc(100% - 22px));
  margin: 0 auto;
  padding: 18px 0 35px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--amber);
  text-transform: uppercase;
}

h1 {
  margin: 7px 0 0;
  font-size: clamp(1.7rem, 5vw, 2.8rem);
  line-height: 1.1;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 600;
  color: var(--muted);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: var(--red);
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.18);
}

.status-dot.running {
  background: var(--green);
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.18);
}

.safety-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.08);
  color: #fef3c7;
  font-weight: 600;
  margin-bottom: 18px;
}

.control-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

button {
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

button:active {
  transform: scale(0.99);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  color: #062514;
  padding: 14px 18px;
}

.secondary {
  background: rgba(148, 163, 184, 0.12);
  color: var(--text);
  border: 1px solid var(--line);
  padding: 14px 18px;
}

.full-width {
  width: 100%;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.stat-card,
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 18px 35px rgba(2, 6, 23, 0.35);
}

.stat-card {
  padding: 16px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-card span {
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.stat-card strong {
  font-size: clamp(1.2rem, 3vw, 1.7rem);
}

.panel {
  padding: 16px;
  margin-bottom: 18px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.08rem;
}

.panel-header.compact {
  margin-bottom: 12px;
}

.scan-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--muted);
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 6px 8px;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: var(--green);
  font-weight: 700;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.76rem;
  color: var(--muted);
  font-weight: 600;
}

input,
select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(15, 23, 42, 0.74);
  color: var(--text);
  padding: 10px 12px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-strip div {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: 12px;
}

.summary-strip span {
  display: block;
  font-size: 0.72rem;
  color: var(--muted);
  margin-bottom: 6px;
}

.summary-strip strong {
  font-size: 1.1rem;
}

.table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--line);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
  background: rgba(8, 15, 23, 0.55);
}

th,
td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  font-size: 0.84rem;
}

th {
  background: rgba(15, 23, 42, 0.9);
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

tbody tr:hover {
  background: rgba(15, 23, 42, 0.5);
}

.positive {
  color: var(--green);
  font-weight: 700;
}

.negative {
  color: var(--red);
  font-weight: 700;
}

.mini-list,
.activity-list {
  display: grid;
  gap: 10px;
}

.mini-order,
.activity-entry {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(15, 23, 42, 0.62);
}

.mini-order strong,
.activity-entry strong {
  font-size: 0.88rem;
}

.mini-order span,
.activity-entry span {
  color: var(--muted);
  font-size: 0.76rem;
}

.trade-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.order-form {
  display: grid;
  gap: 12px;
}

.form-row {
  display: grid;
  gap: 12px;
}

.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.empty-state {
  padding: 30px 12px;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 780px) {
  .summary-grid,
  .filter-grid,
  .trade-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .app-shell {
    width: min(100% - 14px, 100%);
    padding-top: 12px;
  }

  .topbar,
  .panel-header,
  .safety-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-bar,
  .summary-grid,
  .filter-grid,
  .trade-grid,
  .summary-strip,
  .two-col {
    grid-template-columns: 1fr;
  }

  .status-badge {
    align-self: flex-start;
  }

  .panel {
    padding: 12px;
  }

  th,
  td {
    padding: 10px 8px;
  }
}

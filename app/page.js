"use client";

import { useEffect, useState, useCallback } from "react";

const REFRESH_MS = 60000; // polling tiap 60 detik — sesuaikan sesuai kebutuhan & jatah credit Dune

function formatUsd(n) {
  if (n === null || n === undefined) return "-";
  const num = Number(n);
  const sign = num < 0 ? "-" : "+";
  return `${sign}$${Math.abs(num).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function shortAddr(addr) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Home() {
  const [rows, setRows] = useState([]);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [tokenData, setTokenData] = useState({});

  const loadWallets = useCallback(async () => {
    try {
      const res = await fetch("/api/wallets");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat data.");
        return;
      }
      setError(null);
      setRows(data.rows || []);
      setLastRun(data.lastRun);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
    const id = setInterval(loadWallets, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadWallets]);

  async function toggleExpand(wallet) {
    if (expanded === wallet) {
      setExpanded(null);
      return;
    }
    setExpanded(wallet);
    if (!tokenData[wallet]) {
      const res = await fetch(`/api/tokens?wallet=${encodeURIComponent(wallet)}`);
      const data = await res.json();
      setTokenData((prev) => ({ ...prev, [wallet]: data.rows || [] }));
    }
  }

  const topFive = rows.slice(0, 5);

  return (
    <>
      <div className="ticker-wrap">
        <div className="ticker-track">
          {topFive.length === 0 ? (
            <span className="ticker-item">Menunggu data dari Dune...</span>
          ) : (
            [...topFive, ...topFive].map((r, i) => (
              <span className="ticker-item" key={i}>
                {shortAddr(r.wallet_address)} · {r.total_trades} trades ·{" "}
                <span className={r.estimated_pnl_usd >= 0 ? "gain" : "loss"}>
                  {formatUsd(r.estimated_pnl_usd)}
                </span>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="container">
        <div className="header-row">
          <h1 className="title">Wallet Scanner — Robinhood Chain</h1>
          <button className="refresh-btn" onClick={loadWallets}>
            ↻ Refresh sekarang
          </button>
        </div>
        <p className="subtitle status-line">
          <span className="live-dot" />
          {lastRun
            ? `Data terakhir dari Dune: ${new Date(lastRun).toLocaleString("id-ID")}`
            : "Memuat status..."}
          {" · auto-refresh tiap "}
          {REFRESH_MS / 1000}s
        </p>

        {error && (
          <div className="error-box">
            <strong>Ada masalah:</strong> {error}
            <br />
            Cek apakah environment variable DUNE_API_KEY, DUNE_WALLET_SUMMARY_QUERY_ID
            sudah diset di Vercel, dan query-nya sudah pernah dijalankan minimal sekali di Dune.
          </div>
        )}

        {loading ? (
          <p className="empty-state">Memuat data wallet...</p>
        ) : rows.length === 0 && !error ? (
          <p className="empty-state">
            Belum ada wallet yang memenuhi filter (≥5 hari aktif, ≥20 trade).
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Wallet</th>
                <th>Trades</th>
                <th>Hari Aktif</th>
                <th>Rata2 Trade/Hari</th>
                <th>Volume Buy</th>
                <th>Volume Sell</th>
                <th>Est. P&L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <>
                  <tr
                    key={r.wallet_address}
                    onClick={() => toggleExpand(r.wallet_address)}
                    tabIndex={0}
                  >
                    <td className="addr">
                      {shortAddr(r.wallet_address)}{" "}
                      {r.avg_trades_per_day >= 5 && (
                        <span className="badge">HIGH FREQ</span>
                      )}
                    </td>
                    <td>{r.total_trades}</td>
                    <td>{r.active_days}</td>
                    <td>{r.avg_trades_per_day}</td>
                    <td>${Number(r.total_buy_volume_usd).toLocaleString()}</td>
                    <td>${Number(r.total_sell_volume_usd).toLocaleString()}</td>
                    <td className={r.estimated_pnl_usd >= 0 ? "pnl-pos" : "pnl-neg"}>
                      {formatUsd(r.estimated_pnl_usd)}
                    </td>
                  </tr>
                  {expanded === r.wallet_address && (
                    <tr className="token-detail">
                      <td colSpan={7}>
                        {!tokenData[r.wallet_address] ? (
                          "Memuat breakdown token..."
                        ) : tokenData[r.wallet_address].length === 0 ? (
                          "Tidak ada breakdown token tersedia."
                        ) : (
                          tokenData[r.wallet_address].map((t, i) => (
                            <div className="token-row" key={i}>
                              <span>{t.token_symbol}</span>
                              <span>{t.trades_count} trades</span>
                              <span className={t.estimated_pnl_usd >= 0 ? "pnl-pos" : "pnl-neg"}>
                                {formatUsd(t.estimated_pnl_usd)}
                              </span>
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

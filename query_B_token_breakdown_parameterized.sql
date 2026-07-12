-- Wallet Activity Breakdown Per Token on Robinhood Chain (PARAMETERIZED)
-- Cara setup di Dune:
-- 1. Buka query editor Dune, klik ikon parameter (+) di kanan atas
-- 2. Tambahkan parameter baru: type = Text, name = wallet_address, default value = (kosongkan atau isi contoh address)
-- 3. Save & jalankan sekali manual untuk memastikan tidak error

WITH trades AS (
    SELECT
        block_time,
        tx_hash,
        taker AS wallet_address,
        token_bought_symbol,
        token_sold_symbol,
        amount_usd
    FROM dex.trades
    WHERE blockchain = 'robinhood'
      AND block_time >= NOW() - INTERVAL '7' DAY
      AND taker = LOWER('{{wallet_address}}')   -- <- filter langsung di sini, bukan di aplikasi
)

SELECT
    wallet_address,
    CASE
        WHEN token_bought_symbol NOT IN ('USDC','USDT','ETH') THEN token_bought_symbol
        ELSE token_sold_symbol
    END AS token_symbol,
    COUNT(DISTINCT tx_hash) AS trades_count,
    SUM(CASE WHEN token_bought_symbol NOT IN ('USDC','USDT','ETH') THEN amount_usd ELSE 0 END) AS buy_volume_usd,
    SUM(CASE WHEN token_sold_symbol NOT IN ('USDC','USDT','ETH') THEN amount_usd ELSE 0 END) AS sell_volume_usd,
    ROUND(
        SUM(CASE WHEN token_sold_symbol NOT IN ('USDC','USDT','ETH') THEN amount_usd ELSE 0 END)
        - SUM(CASE WHEN token_bought_symbol NOT IN ('USDC','USDT','ETH') THEN amount_usd ELSE 0 END)
    , 2) AS estimated_pnl_usd,
    MIN(block_time) AS first_trade,
    MAX(block_time) AS last_trade
FROM trades
GROUP BY 1, 2
ORDER BY estimated_pnl_usd DESC;

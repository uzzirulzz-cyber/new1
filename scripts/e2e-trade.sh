#!/bin/bash
B=agent-browser

echo "=== 6. TRADE: chart + place BUY UP ==="
$B open http://localhost:3000/trade >/dev/null 2>&1
$B wait 4500 >/dev/null 2>&1
$B snapshot -c 2>/dev/null | rg -i "BUY UP|BUY DOWN|Bollinger|Potential profit|Open trades" | head -5

# fill amount
$B find role textbox fill --name "Amount (USDT)" "25" 2>/dev/null || true
# click BUY UP
$B find text "BUY UP 25" click >/dev/null 2>&1 || $B find text "BUY UP" click >/dev/null 2>&1
$B wait 2500 >/dev/null 2>&1
echo "--- after placing trade ---"
$B snapshot -c 2>/dev/null | rg -i "placed|Open trades|in the money|out of the money|settling" | head -4
$B network requests 2>/dev/null | rg "POST /api/trades" | tail -1

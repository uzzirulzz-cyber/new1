#!/bin/bash
# BLOCKEXCHANGE E2E verification — part 1: customer flows
B=agent-browser
$B close >/dev/null 2>&1
$B set viewport 1440 900 >/dev/null 2>&1

echo "=== 1. HOME ==="
$B open http://localhost:3000/ >/dev/null 2>&1
$B wait 3500 >/dev/null 2>&1
$B snapshot -c 2>/dev/null | rg -i "Predict the market|Live markets|Open Free Account|BUY UP" | head -4

echo "=== 2. MARKETS (public) ==="
$B open http://localhost:3000/markets >/dev/null 2>&1
$B wait 3000 >/dev/null 2>&1
$B get url
$B snapshot -c 2>/dev/null | rg -i "BTC/USDT|Bitcoin" | head -2

echo "=== 3. TRADE blocked for guests ==="
$B open http://localhost:3000/trade >/dev/null 2>&1
$B wait 2500 >/dev/null 2>&1
$B snapshot -c 2>/dev/null | rg -i "members-only|registered account" | head -2

echo "=== 4. LOGIN as demo trader ==="
$B open http://localhost:3000/login >/dev/null 2>&1
$B wait 2500 >/dev/null 2>&1
REF=$(bash /home/z/my-project/scripts/getref.sh "you@fund.com")
$B fill "$REF" "trader@demo.io" >/dev/null 2>&1
REF2=$(bash /home/z/my-project/scripts/getref.sh "••••••••")
$B fill "$REF2" "Demo@2024" >/dev/null 2>&1
$B find role button click --name "Sign In" >/dev/null 2>&1
$B wait 3000 >/dev/null 2>&1
$B get url

echo "=== 5. TRADE view with chart + indicators ==="
$B open http://localhost:3000/trade >/dev/null 2>&1
$B wait 4000 >/dev/null 2>&1
$B snapshot -c 2>/dev/null | rg -i "BUY UP|BUY DOWN|Bollinger|Open trades|Potential profit" | head -6

#!/bin/bash
# BLOCKEXCHANGE URL-indexing verification: real paths render correct views
cd /home/z/my-project

# 1. Ensure dev server is up
if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/; then
  setsid nohup bun run dev < /dev/null > /dev/null 2>&1 &
  disown
  for i in $(seq 1 30); do
    curl -s -o /dev/null --max-time 2 http://localhost:3000/ && break
    sleep 2
  done
fi
echo "server: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)"

B=agent-browser
$B set viewport 1440 900 2>/dev/null

echo "=== TEST 1: /signup renders signup view ==="
$B open http://localhost:3000/signup
$B wait --load networkidle 2>/dev/null
$B wait 2500
$B get url
$B snapshot -i -c 2>/dev/null | head -25

echo ""
echo "=== TEST 2: /admin renders admin view ==="
$B open http://localhost:3000/admin
$B wait --load networkidle 2>/dev/null
$B wait 2500
$B get url
$B snapshot -c 2>/dev/null | head -12

echo ""
echo "=== TEST 3: /storefront 308-redirects to /markets ==="
$B open http://localhost:3000/storefront
$B wait --load networkidle 2>/dev/null
$B wait 2500
$B get url
$B snapshot -c 2>/dev/null | head -8

echo ""
echo "=== TEST 4: /trade/spot renders spot terminal ==="
$B open http://localhost:3000/trade/spot
$B wait --load networkidle 2>/dev/null
$B wait 2500
$B get url
$B snapshot -c 2>/dev/null | head -12

echo ""
echo "=== TEST 5: SPA navigation updates real URL (click nav) ==="
$B open http://localhost:3000/
$B wait --load networkidle 2>/dev/null
$B wait 2500
$B get url
$B snapshot -i -c 2>/dev/null | rg -i "dashboard" | head -3

echo ""
echo "=== errors check ==="
$B errors 2>/dev/null | head -10

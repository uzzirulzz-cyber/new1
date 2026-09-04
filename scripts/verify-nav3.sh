#!/bin/bash
cd /home/z/my-project
if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/; then
  setsid nohup bun run dev < /dev/null > /dev/null 2>&1 & disown
  for i in $(seq 1 30); do curl -s -o /dev/null --max-time 2 http://localhost:3000/ && break; sleep 2; done
fi
B=agent-browser
$B open http://localhost:3000/ >/dev/null 2>&1
$B wait 3500 >/dev/null 2>&1
echo "start: $($B get url 2>/dev/null)"
$B find role button click --name "Enter Dashboard" 2>&1 | head -2
$B wait 2000 >/dev/null 2>&1
echo "after click: $($B get url 2>/dev/null)"
$B snapshot -c 2>/dev/null | rg -i "AI Trading Insight|Economic Calendar|Unrealized|Portfolio Value" | head -3
echo "--- nav to markets via top nav ---"
$B find role button click --name "Markets" 2>&1 | head -1
$B wait 1800 >/dev/null 2>&1
echo "after markets click: $($B get url 2>/dev/null)"

#!/bin/bash
cd /home/z/my-project
if ! curl -s -o /dev/null --max-time 2 http://localhost:3000/; then
  setsid nohup bun run dev < /dev/null > /dev/null 2>&1 & disown
  for i in $(seq 1 30); do curl -s -o /dev/null --max-time 2 http://localhost:3000/ && break; sleep 2; done
fi
B=agent-browser
$B open http://localhost:3000/ >/dev/null 2>&1
$B wait 3000 >/dev/null 2>&1
echo "start: $($B get url 2>/dev/null)"
# Click "Enter Dashboard" -> URL should become /dashboard (not #/dashboard)
$B find text "Enter Dashboard" click >/dev/null 2>&1 || $B click @e3 >/dev/null 2>&1
$B wait 2000 >/dev/null 2>&1
echo "after click: $($B get url 2>/dev/null)"
$B snapshot -c 2>/dev/null | rg -i "Portfolio Value|Total Balance|portfolio" | head -3
# Browser back -> should return to / and render home (popstate)
$B back >/dev/null 2>&1
$B wait 2000 >/dev/null 2>&1
echo "after back: $($B get url 2>/dev/null)"
# Direct deep-link to /copy-trading
$B open http://localhost:3000/copy-trading >/dev/null 2>&1
$B wait 2500 >/dev/null 2>&1
echo "deep-link: $($B get url 2>/dev/null)"
$B snapshot -c 2>/dev/null | rg -i "copy|leaderboard|trader" | head -4
# Page errors?
echo "--- page errors ---"
$B errors 2>/dev/null | head -5

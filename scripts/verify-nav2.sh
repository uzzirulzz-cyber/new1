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
# Fresh snapshot, click the real ref of "Enter Dashboard"
REF=$($B snapshot -i --json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
def walk(n):
    if isinstance(n, dict):
        if 'Enter Dashboard' in str(n.get('name','')):
            return n.get('ref')
        for c in n.get('children', []):
            r = walk(c)
            if r: return r
    if isinstance(n, list):
        for c in n:
            r = walk(c)
            if r: return r
    return None
print(walk(data) or '')")
echo "ref=$REF"
$B click "$REF" 2>&1 | head -2
$B wait 2000 >/dev/null 2>&1
echo "after click: $($B get url 2>/dev/null)"
$B snapshot -c 2>/dev/null | rg -i "AI Trading Insight|Economic Calendar|Unrealized" | head -2
# popstate: browser back should return home
$B back >/dev/null 2>&1
$B wait 2000 >/dev/null 2>&1
echo "after back: $($B get url 2>/dev/null)"
# forward
$B forward >/dev/null 2>&1
$B wait 2000 >/dev/null 2>&1
echo "after forward: $($B get url 2>/dev/null)"

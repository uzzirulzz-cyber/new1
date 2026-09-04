#!/bin/bash
# returns the ref of an interactive element whose name or placeholder matches $1
B=agent-browser
$B snapshot -i --json 2>/dev/null | python3 -c "
import sys, json
needle = sys.argv[1].lower()
data = json.load(sys.stdin)
result = ''
def walk(n):
    global result
    if isinstance(n, dict):
        name = str(n.get('name','')).lower()
        # agent-browser json shapes vary; try common keys
        if not name:
            name = str(n.get('text','')).lower()
        if needle in name and n.get('ref'):
            result = n['ref']
            return
        for c in n.get('children', []) or []:
            walk(c)
    elif isinstance(n, list):
        for c in n:
            walk(c)
walk(data)
print(result)
" "$1"

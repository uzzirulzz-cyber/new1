#!/bin/bash
B=agent-browser
$B open http://localhost:3000/login >/dev/null 2>&1
$B wait 2500 >/dev/null 2>&1
$B snapshot -i -c 2>/dev/null | head -12

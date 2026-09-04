#!/bin/bash
B=agent-browser
echo "=== 7. STAFF LOGIN (forced password change) ==="
$B open http://localhost:3000/staff/login >/dev/null 2>&1
sleep 3
$B eval "(() => { const f=(sel)=>[...document.querySelectorAll('input')]; const i=f().find(x=>x.placeholder.includes('admin@blockexchange.io')); if(!i) return 'nf-input'; const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(i,'admin@blockexchange.io'); i.dispatchEvent(new Event('input',{bubbles:true})); const p=f().find(x=>x.type==='password'); set.call(p,'Admin@2024'); p.dispatchEvent(new Event('input',{bubbles:true})); return 'filled'; })()" 2>/dev/null
$B eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Enter Console'); if(b){b.click(); return 'clicked';} return 'nf-btn'; })()" 2>/dev/null
sleep 3.5
echo "URL: $($B get url)"
$B snapshot -c 2>/dev/null | rg -i "Change your password|temporary password|SUPER ADMIN" | head -3

echo "=== 8. Change password ==="
$B eval "(() => { const p=[...document.querySelectorAll('input[type=password]')]; if(p.length<2) return 'nf'; const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(p[0],'Admin@2024'); p[0].dispatchEvent(new Event('input',{bubbles:true})); set.call(p[1],'SuperAdmin#2026'); p[1].dispatchEvent(new Event('input',{bubbles:true})); return 'filled'; })()" 2>/dev/null
sleep 0.5
$B eval "(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Set new password')); if(b){b.click(); return 'clicked';} return 'nf'; })()" 2>/dev/null
sleep 3
$B snapshot -c 2>/dev/null | rg -i "Revenue|Total users|Pending reviews|welcome" | head -4

/**
 * BLOCKEXCHANGE full regression — all roles + trade settlement + payments + messaging.
 * Run: bun scripts/regression.ts   (dev server must be on :3000)
 */
const BASE = 'http://localhost:3000';
const jars: Record<string, string> = {};
let pass = 0, fail = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  OK  ${name}`); }
  else { fail++; failures.push(name); console.log(`  FAIL ${name} ${extra}`); }
}

async function api(path: string, opts: { method?: string; body?: unknown; as?: string } = {}) {
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(jars[opts.as ?? ''] ? { cookie: jars[opts.as ?? ''] } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  for (const c of res.headers.getSetCookie?.() ?? []) jars[opts.as ?? ''] = c.split(';')[0];
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data: data as Record<string, unknown> };
}

async function main() {
  console.log('--- 1. PUBLIC / GUEST GUARDS ---');
  const mk = await api('/api/markets');
  const markets = (mk.data as { markets?: { symbol: string }[] }).markets ?? [];
  check('public markets list', mk.status === 200 && markets.length >= 15, `n=${markets.length}`);
  const guestCandles = await api(`/api/markets/candles?symbol=${encodeURIComponent('BTC/USDT')}&tf=60`);
  check('guest blocked from candles', guestCandles.status === 401 || guestCandles.status === 403, `s=${guestCandles.status}`);
  const guestWallet = await api('/api/wallet');
  check('guest blocked from wallet', guestWallet.status === 401 || guestWallet.status === 403, `s=${guestWallet.status}`);

  console.log('--- 2. CUSTOMER AUTH (trader@demo.io) ---');
  const badLogin = await api('/api/auth/login', { method: 'POST', body: { email: 'trader@demo.io', password: 'wrong' } });
  check('wrong password rejected 401', badLogin.status === 401, `s=${badLogin.status}`);
  const cLogin = await api('/api/auth/login', { method: 'POST', as: 'c', body: { email: 'trader@demo.io', password: 'Demo@2024' } });
  check('customer login', cLogin.status === 200 && (cLogin.data as { user?: { role?: string } }).user?.role === 'CUSTOMER');
  const me = await api('/api/auth/me', { as: 'c' });
  const uid = (me.data as { user?: { uid?: string; id?: string } }).user;
  check('session me returns BXDEMO01', uid?.uid === 'BXDEMO01', JSON.stringify(uid?.uid));
  const customerId = uid!.id!;

  console.log('--- 3. CHARTS + WALLET ---');
  const candles = await api(`/api/markets/candles?symbol=${encodeURIComponent('BTC/USDT')}&tf=60`, { as: 'c' });
  check('authed candles 200', candles.status === 200);
  const w0 = await api('/api/wallet', { as: 'c' });
  const bal0 = (w0.data as { balance: number }).balance;
  check('wallet summary', w0.status === 200 && typeof bal0 === 'number', `bal=${bal0}`);

  console.log('--- 4. TRADE EXECUTION (30s UP on BTC) ---');
  const t = await api('/api/trades', { method: 'POST', as: 'c', body: { symbol: 'BTC/USDT', direction: 'UP', amount: 50, duration: 30 } });
  check('trade placed 201', t.status === 201 || t.status === 200, `s=${t.status} ${JSON.stringify(t.data).slice(0, 120)}`);
  const w1 = await api('/api/wallet', { as: 'c' });
  const bal1 = (w1.data as { balance: number }).balance;
  check('stake deducted exactly', Math.abs((bal0 - bal1) - 50) < 0.01, `bal0=${bal0} bal1=${bal1}`);

  console.log('--- 5. SETTLEMENT (wait ~38s) ---');
  const settlesAt = Date.now() + 38000;
  process.stdout.write('  waiting');
  while (Date.now() < settlesAt) { await new Promise(r => setTimeout(r, 4000)); process.stdout.write('.'); }
  console.log('');
  const hist = await api('/api/trades', { as: 'c' });
  const list = (hist.data as { trades?: { result: string; amount: number }[] }).trades ?? [];
  const newest = list[0] as { result?: string } | undefined;
  check('trade settled (newest not PENDING)', hist.status === 200 && !!newest && ['WON', 'LOST', 'REFUND'].includes(newest.result ?? ''), `n=${list.length} newest=${JSON.stringify(newest).slice(0, 90)}`);
  const w2 = await api('/api/wallet', { as: 'c' });
  const bal2 = (w2.data as { balance: number }).balance;
  check('balance reflects settlement', bal2 > 0 && bal2 <= bal0 + 500, `bal2=${bal2}`);

  console.log('--- 6. SUPPORT + NOTIFICATIONS ---');
  const th = await api('/api/support', { method: 'POST', as: 'c', body: { body: 'Regression: need help with a withdrawal' } });
  check('support message sent', th.status === 200 || th.status === 201, `s=${th.status}`);
  const notif = await api('/api/notifications', { as: 'c' });
  check('notifications list', notif.status === 200 && Array.isArray((notif.data as { notifications?: unknown[] }).notifications ?? (notif.data as { items?: unknown[] }).items ?? []));

  console.log('--- 7. DEPOSIT -> ADMIN APPROVE -> CREDITED ---');
  const dep = await api('/api/deposits', { method: 'POST', as: 'c', body: { method: 'USDT TRC-20', amount: 250 } });
  check('deposit submitted', dep.status === 200 || dep.status === 201, `s=${dep.status} ${JSON.stringify(dep.data).slice(0, 80)}`);
  const depId = (dep.data as { deposit?: { id?: string }; id?: string }).deposit?.id ?? (dep.data as { id?: string }).id;
  const aLogin = await api('/api/staff/login', { method: 'POST', as: 'a', body: { email: 'admin@blockexchange.io', password: 'SuperAdmin#2026' } });
  check('admin login', aLogin.status === 200 && (aLogin.data as { user?: { role?: string } }).user?.role === 'SUPER_ADMIN');
  const approve = await api('/api/admin/payments', { method: 'POST', as: 'a', body: { kind: 'deposit', id: depId, action: 'APPROVE' } });
  check('admin approves deposit', approve.status === 200, `s=${approve.status} ${JSON.stringify(approve.data).slice(0, 100)}`);
  const w3 = await api('/api/wallet', { as: 'c' });
  const bal3 = (w3.data as { balance: number }).balance;
  check('deposit credited exactly +250', Math.abs(bal3 - (bal2 + 250)) < 0.01, `bal3=${bal3} expected=${bal2 + 250}`);

  console.log('--- 8. WITHDRAW -> HOLD/FROZEN -> APPROVE -> RELEASED ---');
  const wd = await api('/api/withdrawals', { method: 'POST', as: 'c', body: { method: 'USDT TRC-20', address: 'TXregTest1234567890abcdef', amount: 100 } });
  check('withdrawal submitted', wd.status === 200 || wd.status === 201, `s=${wd.status}`);
  const w4 = await api('/api/wallet', { as: 'c' });
  const w4d = w4.data as { balance: number; frozen: number };
  check('withdrawal reserves to frozen', w4d.frozen >= 100 - 0.01 && Math.abs(w4d.balance - bal3) < 0.01, `frozen=${w4d.frozen} bal=${w4d.balance}`);
  const wdId = (wd.data as { withdrawal?: { id?: string }; id?: string }).withdrawal?.id ?? (wd.data as { id?: string }).id;
  const wdApprove = await api('/api/admin/payments', { method: 'POST', as: 'a', body: { kind: 'withdrawal', id: wdId, action: 'APPROVE' } });
  check('admin approves withdrawal', wdApprove.status === 200, `s=${wdApprove.status}`);
  const w5 = await api('/api/wallet', { as: 'c' });
  const w5d = w5.data as { balance: number; frozen: number };
  check('frozen released after payout', w5d.frozen < 0.01, `frozen=${w5d.frozen}`);

  console.log('--- 9. ADMIN MODULES ---');
  const stats = await api('/api/admin/stats', { as: 'a' });
  check('admin stats', stats.status === 200);
  const search = await api('/api/admin/users?q=Ali', { as: 'a' });
  const found = JSON.stringify(search.data).includes('BXDEMO01');
  check('admin user search by name', search.status === 200 && found, JSON.stringify(search.data).slice(0, 100));
  const credit = await api('/api/admin/wallet', { method: 'POST', as: 'a', body: { userId: customerId, action: 'CREDIT', amount: 75, note: 'regression bonus' } });
  check('admin wallet CREDIT', credit.status === 200, `s=${credit.status}`);
  const w6 = await api('/api/wallet', { as: 'c' });
  const bal6 = (w6.data as { balance: number }).balance;
  check('credit reflected +75', Math.abs(bal6 - (w5d.balance + 75)) < 0.01, `bal6=${bal6}`);
  const freeze = await api('/api/admin/wallet', { method: 'POST', as: 'a', body: { userId: customerId, action: 'FREEZE_FUNDS', amount: 25, note: 'regression freeze' } });
  check('admin FREEZE_FUNDS', freeze.status === 200, `s=${freeze.status}`);
  const unfreeze = await api('/api/admin/wallet', { method: 'POST', as: 'a', body: { userId: customerId, action: 'UNFREEZE_FUNDS', amount: 25, note: 'regression unfreeze' } });
  check('admin UNFREEZE_FUNDS', unfreeze.status === 200, `s=${unfreeze.status}`);
  const secLogs = await api('/api/admin/security', { as: 'a' });
  check('admin security logs', secLogs.status === 200);
  const reports = await api('/api/admin/reports', { as: 'a' });
  check('admin reports', reports.status === 200);

  console.log('--- 10. SUB-AGENT ISOLATION (Maya) ---');
  const agLogin = await api('/api/staff/login', { method: 'POST', as: 'g', body: { email: 'agent.maya@blockexchange.io', password: 'Agent@2024' } });
  check('agent login', agLogin.status === 200 && (agLogin.data as { user?: { role?: string } }).user?.role === 'SUB_AGENT');
  const agDash = await api('/api/agent', { as: 'g' });
  const agBody = JSON.stringify(agDash.data);
  check('agent dashboard loads', agDash.status === 200, `s=${agDash.status}`);
  check('isolation: sees Ali Raza', agBody.includes('Ali Raza'));
  check('isolation: NOT Victor customer John', !agBody.toLowerCase().includes('john'), 'leak!');

  console.log('--- 11. STAFF FIRST-LOGIN POLICY ---');
  const stLogin = await api('/api/staff/login', { method: 'POST', body: { email: 'staff@blockexchange.io', password: 'Staff@2024' } });
  check('staff login + mustChangePassword', stLogin.status === 200 && (stLogin.data as { mustChangePassword?: boolean }).mustChangePassword === true);

  console.log('--- 12. LOGOUT ---');
  await api('/api/auth/logout', { method: 'POST', as: 'c' });
  const meAfter = await api('/api/auth/me', { as: 'c' });
  const loggedOut = (meAfter.data as { user?: unknown }).user === null;
  check('logout kills session', loggedOut, `s=${meAfter.status} ${JSON.stringify(meAfter.data).slice(0, 60)}`);

  console.log(`\n===== RESULT: ${pass} passed, ${fail} failed =====`);
  if (failures.length) console.log('Failed:', failures.join(' | '));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('runner crash:', e); process.exit(2); });

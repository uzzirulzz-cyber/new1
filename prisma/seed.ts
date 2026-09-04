/**
 * Seed: super admin, sub-agents + invitation codes, markets, settings, demo customer.
 * Run: bunx tsx prisma/seed.ts   (or bun prisma/seed.ts)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const MARKETS: [string, string, string, number, number, number, number][] = [
  // symbol, name, category, basePrice, volatility, trendBias, sortOrder
  ['BTC/USDT', 'Bitcoin', 'Majors', 67450, 1.1, 0.12, 1],
  ['ETH/USDT', 'Ethereum', 'Majors', 3520, 1.2, 0.05, 2],
  ['BNB/USDT', 'BNB Chain', 'Majors', 588, 0.9, 0.02, 3],
  ['SOL/USDT', 'Solana', 'Majors', 158.4, 1.6, 0.15, 4],
  ['XRP/USDT', 'Ripple', 'Majors', 0.524, 1.3, -0.08, 5],
  ['TON/USDT', 'Toncoin', 'Majors', 7.12, 1.4, 0.1, 6],
  ['ADA/USDT', 'Cardano', 'Altcoin', 0.447, 1.3, -0.05, 7],
  ['AVAX/USDT', 'Avalanche', 'Altcoin', 27.9, 1.7, 0.06, 8],
  ['DOT/USDT', 'Polkadot', 'Altcoin', 6.05, 1.4, -0.03, 9],
  ['NEAR/USDT', 'NEAR Protocol', 'Altcoin', 4.87, 1.8, 0.12, 10],
  ['LINK/USDT', 'Chainlink', 'DeFi', 14.62, 1.5, 0.08, 11],
  ['UNI/USDT', 'Uniswap', 'DeFi', 7.94, 1.6, 0.04, 12],
  ['AAVE/USDT', 'Aave', 'DeFi', 91.5, 1.7, 0.09, 13],
  ['RNDR/USDT', 'Render', 'AI / Compute', 9.83, 2.0, 0.2, 14],
  ['FET/USDT', 'Artificial SuperIntelligence', 'AI / Compute', 1.42, 2.1, 0.18, 15],
  ['DOGE/USDT', 'Dogecoin', 'Meme', 0.129, 2.4, 0.03, 16],
  ['PEPE/USDT', 'Pepe', 'Meme', 0.0000071, 2.8, -0.1, 17],
  ['SHIB/USDT', 'Shiba Inu', 'Meme', 0.0000168, 2.6, 0.02, 18],
];

async function main() {
  console.log('Seeding BLOCKEXCHANGE…');

  // ---- markets ----
  for (const [symbol, name, category, basePrice, volatility, trendBias, sortOrder] of MARKETS) {
    await db.market.upsert({
      where: { symbol },
      update: { name, category, basePrice, volatility, trendBias, sortOrder },
      create: { symbol, name, category, basePrice, volatility, trendBias, sortOrder },
    });
  }
  console.log(`✓ ${MARKETS.length} markets`);

  // ---- settings ----
  const settings: Record<string, string> = {
    min_deposit: '10',
    min_withdraw: '20',
    default_payout: '0.85',
    support_name: 'BlockExchange Support',
    site_title: 'BLOCKEXCHANGE',
    maintenance_mode: 'off',
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log('✓ settings');

  // ---- super admin (forced password change on first login) ----
  const adminHash = await bcrypt.hash('Admin@2024', 10);
  const admin = await db.user.upsert({
    where: { email: 'admin@blockexchange.io' },
    update: {},
    create: {
      uid: 'BXADMIN1', email: 'admin@blockexchange.io', name: 'Super Admin',
      passwordHash: adminHash, role: 'SUPER_ADMIN', vipLevel: 9, kycStatus: 'VERIFIED',
      country: 'AE', mustChangePassword: true, invitationCode: 'ROOT-000001',
    },
  });
  await db.wallet.upsert({ where: { userId: admin.id }, update: {}, create: { userId: admin.id, balance: 0 } });
  console.log('✓ super admin admin@blockexchange.io / Admin@2024 (must change)');

  // ---- admin #2 ----
  const admin2Hash = await bcrypt.hash('Staff@2024', 10);
  const admin2 = await db.user.upsert({
    where: { email: 'staff@blockexchange.io' },
    update: {},
    create: {
      uid: 'BXADMIN2', email: 'staff@blockexchange.io', name: 'Operations Admin',
      passwordHash: admin2Hash, role: 'ADMIN', vipLevel: 8, kycStatus: 'VERIFIED',
      country: 'PK', mustChangePassword: true, invitationCode: 'ROOT-000002',
    },
  });
  await db.wallet.upsert({ where: { userId: admin2.id }, update: {}, create: { userId: admin2.id, balance: 0 } });
  console.log('✓ admin staff@blockexchange.io / Staff@2024 (must change)');

  // ---- sub-agents ----
  const agents: [string, string, string, string][] = [
    ['agent.maya@blockexchange.io', 'Maya Riverside', 'AGT-MAYA24', 'Agent@2024'],
    ['agent.victor@blockexchange.io', 'Victor Chen', 'AGT-VICTR7', 'Agent@2024'],
  ];
  const agentIds: string[] = [];
  for (const [email, name, code, pw] of agents) {
    const hash = await bcrypt.hash(pw, 10);
    const a = await db.user.upsert({
      where: { email },
      update: { invitationCode: code },
      create: {
        uid: 'BX' + code.slice(4, 10), email, name, passwordHash: hash,
        role: 'SUB_AGENT', vipLevel: 5, kycStatus: 'VERIFIED', country: 'PK',
        mustChangePassword: false, invitationCode: code,
      },
    });
    await db.wallet.upsert({ where: { userId: a.id }, update: {}, create: { userId: a.id, balance: 0 } });
    await db.invitationCode.upsert({
      where: { code },
      update: { ownerId: a.id, active: true },
      create: { code, ownerId: a.id },
    });
    agentIds.push(a.id);
  }
  console.log('✓ 2 sub-agents (codes AGT-MAYA24, AGT-VICTR7 / Agent@2024)');

  // ---- demo customers ----
  const demoHash = await bcrypt.hash('Demo@2024', 10);
  const demo = await db.user.upsert({
    where: { email: 'trader@demo.io' },
    update: {},
    create: {
      uid: 'BXDEMO01', email: 'trader@demo.io', name: 'Ali Raza',
      passwordHash: demoHash, role: 'CUSTOMER', vipLevel: 2, kycStatus: 'VERIFIED',
      country: 'PK', phone: '+92 300 1234567', invitedById: agentIds[0],
    },
  });
  await db.wallet.upsert({
    where: { userId: demo.id },
    update: { balance: 15420.5, frozen: 300 },
    create: { userId: demo.id, balance: 15420.5, frozen: 300 },
  });
  const demo2 = await db.user.upsert({
    where: { email: 'sara@demo.io' },
    update: {},
    create: {
      uid: 'BXDEMO02', email: 'sara@demo.io', name: 'Sara Ahmed',
      passwordHash: demoHash, role: 'CUSTOMER', vipLevel: 1, kycStatus: 'PENDING',
      country: 'AE', phone: '+971 50 7654321', invitedById: agentIds[0],
    },
  });
  await db.wallet.upsert({
    where: { userId: demo2.id },
    update: { balance: 3120.75 },
    create: { userId: demo2.id, balance: 3120.75 },
  });
  const demo3 = await db.user.upsert({
    where: { email: 'john@demo.io' },
    update: {},
    create: {
      uid: 'BXDEMO03', email: 'john@demo.io', name: 'John Miller',
      passwordHash: demoHash, role: 'CUSTOMER', vipLevel: 3, kycStatus: 'VERIFIED',
      country: 'GB', phone: '+44 7700 900123', invitedById: agentIds[1],
    },
  });
  await db.wallet.upsert({
    where: { userId: demo3.id },
    update: { balance: 22890.0, frozen: 0 },
    create: { userId: demo3.id, balance: 22890.0 },
  });
  console.log('✓ 3 demo customers (trader@demo.io & sara@demo.io → Maya; john@demo.io → Victor) / Demo@2024');

  // ---- welcome notifications + support threads ----
  for (const u of [demo, demo2, demo3]) {
    const n = await db.notification.count({ where: { userId: u.id } });
    if (n === 0) {
      await db.notification.create({
        data: { userId: u.id, title: 'Welcome to BLOCKEXCHANGE', body: 'Your account is live. Fund your wallet and start trading binary markets with 30s / 60s / 120s expiries.', type: 'SUCCESS' },
      });
    }
    const t = await db.supportThread.findUnique({ where: { userId: u.id } });
    if (!t) {
      await db.supportThread.create({
        data: {
          userId: u.id,
          messages: { create: [{ sender: 'ADMIN', body: 'Welcome to BlockExchange Support. How can we help you today?' }] },
        },
      });
    }
  }
  console.log('✓ notifications + support threads');

  // ---- sample pending payments for admin review ----
  const pd = await db.deposit.count();
  if (pd === 0) {
    await db.deposit.createMany({
      data: [
        { userId: demo.id, method: 'USDT TRC-20', amount: 500, reference: 'TxDemo9f2a...8f2a' },
        { userId: demo2.id, method: 'Bank Transfer', amount: 250, reference: 'HSBC-771209' },
      ],
    });
    await db.withdrawal.createMany({
      data: [
        { userId: demo3.id, method: 'USDT TRC-20', address: 'TXqLdemo33ba...33ba', amount: 800 },
        { userId: demo.id, method: 'USDT ERC-20', address: '0x91c...4e21', amount: 300 },
      ],
    });
    await db.transaction.createMany({
      data: [
        { userId: demo.id, type: 'DEPOSIT', amount: 25000, status: 'COMPLETED', detail: 'TRC-20 initial funding' },
        { userId: demo3.id, type: 'DEPOSIT', amount: 20000, status: 'COMPLETED', detail: 'Bank wire initial funding' },
        { userId: demo2.id, type: 'DEPOSIT', amount: 3500, status: 'COMPLETED', detail: 'Card funding' },
      ],
    });
  }
  console.log('✓ sample payments pending review');
  console.log('Seed complete.');
}

main().finally(() => db.$disconnect());

#!/usr/bin/env python3
"""BLOCKEXCHANGE project explainer — 8 captioned slides (1600x1200, English overlays) -> ZIP pack.
Output slides in scripts/shots/slides/, zip at download/BLOCKEXCHANGE-project-explainer.zip (local-only)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

BG, PANEL, BORDER = (5, 11, 24), (8, 18, 33), (26, 51, 87)
BLUE, GOLD, GREEN, RED = (0, 163, 255), (255, 184, 0), (0, 255, 136), (255, 77, 77)
WHITE, SLATE, DIM = (240, 246, 255), (140, 163, 199), (94, 113, 148)
F = '/usr/share/fonts/truetype/dejavu/'
SHOTS = 'scripts/shots/'
OUT = 'scripts/shots/slides/'
os.makedirs(OUT, exist_ok=True)

def font(sz, bold=False):
    return ImageFont.truetype(F + ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'), sz)

def wrap(draw, text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def base(slide_no, total, title, subtitle, accent):
    """Create 1600x1200 canvas with branded header. Returns canvas, draw."""
    W, H = 1600, 1200
    canvas = Image.new('RGBA', (W, H), BG)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-200, -260, 620, 240), fill=(0, 90, 180, 34))
    gd.ellipse((W-520, H-340, W+240, H+240), fill=(120, 80, 0, 26))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(80)))
    draw = ImageDraw.Draw(canvas)
    for i in range(4):
        draw.line((0, i, W, i), fill=accent if i < 2 else BLUE)
    # number chip
    draw.rounded_rectangle((40, 36, 40+96, 96), 12, outline=accent, width=3)
    nf = font(30, True)
    draw.text((40+48-draw.textlength(f'{slide_no:02d}', font=nf)//2, 48), f'{slide_no:02d}', font=nf, fill=accent)
    draw.text((164, 36), title, font=font(38, True), fill=WHITE)
    draw.text((166, 88), subtitle, font=font(17), fill=SLATE)
    # logo right
    logo = Image.open('public/blockexchange-logo.png').convert('RGBA')
    lh = 62; lw = int(logo.width*lh/logo.height)
    canvas.alpha_composite(logo.resize((lw, lh), Image.LANCZOS), (W-40-lw, 36))
    # footer
    draw.text((40, H-36), 'BLOCKEXCHANGE · Project Explainer', font=font(13, True), fill=DIM)
    dots = f'{slide_no:02d} / {total:02d}'
    draw.text((W-40-draw.textlength(dots, font=font(13, True)), H-36), dots, font=font(13, True), fill=accent)
    return canvas, draw

def screenshot_panel(canvas, draw, img, y=130, h=700):
    """Fit whole screenshot centered, framed. Returns bottom y."""
    W = 1600
    ratio = img.width / img.height
    iw = int(h * ratio)
    x = (W - iw) // 2
    draw.rounded_rectangle((x-3, y-3, x+iw+3, y+h+3), 16, fill=BORDER)
    shot = img.resize((iw, h), Image.LANCZOS)
    mask = Image.new('L', (iw, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, iw-1, h-1), 13, fill=255)
    canvas.paste(shot, (x, y), mask)
    return y + h

def caption_block(draw, x, y, maxw, headline, bullets, accent, hl_size=22, b_size=16, gap=34):
    draw.ellipse((x, y+6, x+12, y+18), fill=accent)
    draw.text((x+22, y-4), headline, font=font(hl_size, True), fill=WHITE)
    cy = y + hl_size + 12
    bf = font(b_size)
    for icon, text in bullets:
        if icon:
            draw.text((x+6, cy), icon, font=font(b_size-2), fill=accent)
            tx = x + 30
        else:
            draw.ellipse((x+8, cy+8, x+15, cy+15), fill=accent)
            tx = x + 30
        lines = wrap(draw, text, bf, maxw - 40)
        for i, ln in enumerate(lines):
            draw.text((tx, cy + i*22), ln, font=bf, fill=SLATE if i else WHITE)
        cy += 22*len(lines) + gap - 22 + 10
    return cy

def chip_row(draw, x, y, chips, accent):
    f = font(14, True)
    for text in chips:
        tw = draw.textlength(text, font=f)
        draw.rounded_rectangle((x, y, x+tw+26, y+30), 8, outline=accent, width=2)
        draw.text((x+13, y+7), text, font=f, fill=WHITE)
        x += tw + 26 + 14
    return x

# ---------- load shots ----------
home = Image.open(SHOTS+'01-home.png').convert('RGBA')
markets = Image.open(SHOTS+'02-markets.png').convert('RGBA')
trade = Image.open(SHOTS+'03-trade.png').convert('RGBA')
wallet = Image.open(SHOTS+'04-wallet.png').convert('RGBA')
admin = Image.open(SHOTS+'05-admin.png').convert('RGBA')
users = Image.open(SHOTS+'06-admin-users.png').convert('RGBA')
deposit = Image.open(SHOTS+'07-deposit.png').convert('RGBA')
support = Image.open(SHOTS+'08-support.png').convert('RGBA')
agent = Image.open(SHOTS+'09-agent.png').convert('RGBA')
signup = Image.open(SHOTS+'10-signup.png').convert('RGBA')

TOTAL = 8

# ---------- 1 · COVER ----------
c, d = base(1, TOTAL, 'BLOCKEXCHANGE — Project Overview', 'Institutional binary-options crypto trading platform · full-stack, database-backed, production-verified', GOLD)
d = ImageDraw.Draw(c)
# left: narrative
d.text((80, 200), 'What is BLOCKEXCHANGE?', font=font(24, True), fill=GOLD)
y = 250
for ln in wrap(d, 'A complete institutional-grade binary trading desk for crypto markets. Customers predict short-term price direction — BUY UP or BUY DOWN — pick an expiry of 30, 60 or 120 seconds, and trades settle automatically at expiry against a deterministic real-time price engine.', font(18), 720):
    d.text((80, y), ln, font=font(18), fill=WHITE); y += 30
y += 14
for ln in wrap(d, 'The platform ships with a full customer storefront, a 10-module super-admin console, a sub-agent (IB) network with strict data isolation, wallet operations, deposits & withdrawals with admin review, notifications, and live support chat — all persisted in Neon PostgreSQL and verified end-to-end by a 36-check regression suite.', font(17), 720):
    d.text((80, y), ln, font=font(17), fill=SLATE); y += 28
# right: live product screenshot frame
shot = home.resize((600, 375), Image.LANCZOS)
frame = Image.new('RGBA', (608, 383), BORDER)
frame.paste(shot, (4, 4))
mask = Image.new('L', frame.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 607, 382), 12, fill=255)
c.paste(frame, (920, 205), mask)
d = ImageDraw.Draw(c)
d.text((920, 600), 'Live product — customer storefront', font=font(14, True), fill=SLATE)
# highlights chips full width
d.text((80, 700), 'Highlights', font=font(20, True), fill=BLUE)
feats = [('18 live markets', BLUE), ('30 / 60 / 120s expiries', GREEN), ('Up to 92% payout', GOLD), ('Real-time auto-settlement', BLUE),
         ('RBAC admin · 10 modules', GOLD), ('Sub-agent network', BLUE), ('Bcrypt + audit-logged auth', GREEN), ('Neon PostgreSQL persistence', RED)]
fx, fy = 80, 748
for i, (t, col) in enumerate(feats):
    if i == 4: fx, fy = 80, 806
    tw = d.textlength(t, font=font(16, True))
    d.rounded_rectangle((fx, fy, fx+tw+40, fy+40), 10, outline=col, width=2)
    d.ellipse((fx+14, fy+15, fx+24, fy+25), fill=col)
    d.text((fx+34, fy+9), t, font=font(16, True), fill=WHITE)
    fx += tw + 40 + 20
# stat band
d.rounded_rectangle((80, 900, 1520, 1000), 14, fill=PANEL, outline=BORDER, width=2)
stats = [('18', 'live markets'), ('3', 'expiry windows'), ('92%', 'max payout'), ('10', 'admin modules'), ('25+', 'API endpoints'), ('36/36', 'regression checks')]
for i, (v, l) in enumerate(stats):
    x = 80 + 60 + i * 240
    d.text((x, 922), v, font=font(30, True), fill=BLUE if i % 2 == 0 else GOLD)
    d.text((x + (d.textlength(v, font=font(30, True)) - d.textlength(l, font=font(13))) // 2 + 4, 962), l, font=font(13), fill=SLATE)
d.text((80, 1030), 'Stack: Next.js 16 · TypeScript · Prisma ORM · Neon PostgreSQL · Tailwind — deployed as a single SPA with 20 real routes', font=font(15), fill=SLATE)
c.convert('RGB').save(OUT+'01-cover.png', 'PNG')

# ---------- 2 · STOREFRONT & MARKETS ----------
c, d = base(2, TOTAL, 'Customer Storefront & Market Browser', 'The public face of the platform — real-time prices, categories, search and watchlists', BLUE)
screenshot_panel(c, d, markets)
caption_block(d, 60, 880, 700, 'Market browser', [
    ('•', '18 trading pairs across Majors, Altcoin, DeFi, AI/Compute and Meme categories with live price ticks every 1.4 seconds.'),
    ('•', '24h change, sparkline charts, sort by price / change / name, and instant search.'),
    ('•', 'Star any pair to pin it to the personal Watchlist view.'),
], BLUE)
caption_block(d, 840, 880, 700, 'Guest protection', [
    ('•', 'Markets are browsable by anyone; candlestick charts and trading are members-only.'),
    ('•', 'Unauthenticated visitors hitting /trade see a members-only gate with a sign-in prompt.'),
], GREEN)
c.convert('RGB').save(OUT+'02-storefront.png', 'PNG')

# ---------- 3 · TRADE ENGINE ----------
c, d = base(3, TOTAL, 'Binary Trade Engine — BUY UP / BUY DOWN', 'Professional terminal with technical analysis and automatic settlement', GREEN)
screenshot_panel(c, d, trade)
caption_block(d, 60, 880, 700, 'Execution', [
    ('•', 'Pick direction (UP / DOWN), stake via quick amounts ($10–$500 or custom), expiry 30s / 60s / 120s.'),
    ('•', 'Stake is deducted atomically; entry price is captured at execution; payout rate up to 92%.'),
    ('•', 'At expiry the engine samples the exit price — WON credits stake + profit, ties are refunded.'),
], GREEN)
caption_block(d, 840, 880, 700, 'Analysis & history', [
    ('•', 'Canvas candlestick chart with Bollinger Bands, SMA 20, EMA 9, support / resistance overlays, 1m–15m timeframes.'),
    ('•', 'Open trades show a live countdown; recent results and full history with cumulative P&L.'),
], BLUE)
c.convert('RGB').save(OUT+'03-trade-engine.png', 'PNG')

# ---------- 4 · WALLET & PAYMENTS ----------
c, d = base(4, TOTAL, 'Wallet, Deposits & Withdrawals', 'Fund management with admin-reviewed payment rails', GOLD)
screenshot_panel(c, d, deposit)
caption_block(d, 60, 880, 700, 'Customer flow', [
    ('•', 'Wallet view shows balance, frozen funds, available funds and a filterable ledger of every movement.'),
    ('•', 'Deposits: 5 payment methods (USDT TRC-20 / ERC-20, BTC, bank, card) with quick amounts — submitted for review.'),
    ('•', 'Withdrawals: destination address + MAX helper; the requested amount is reserved from balance into frozen.'),
], BLUE)
caption_block(d, 840, 880, 700, 'Admin review pipeline', [
    ('•', 'Approve deposit → wallet credited in a database transaction; reject → closed with audit entry.'),
    ('•', 'Approve withdrawal → frozen released and paid out; Hold → kept pending; Reject → funds returned to balance.'),
    ('•', 'Every step is audit-logged and notifies the customer in-app.'),
], GOLD)
c.convert('RGB').save(OUT+'04-wallet-payments.png', 'PNG')

# ---------- 5 · ADMIN CONSOLE ----------
c, d = base(5, TOTAL, 'Super Admin Console — 10 Modules', 'Executive control room with house revenue, risk and operations', GOLD)
screenshot_panel(c, d, admin)
caption_block(d, 60, 880, 700, 'Dashboard & operations', [
    ('•', 'KPIs: house revenue (settled stakes − payouts), total users, trades, pending reviews, deposits, withdrawals, staff, open-trade exposure.'),
    ('•', '14-day revenue series and per-coin trading volume, plus reports with CSV export.'),
    ('•', 'Trade management: inspect every position; market management: tune base price, volatility, trend bias, payout rate.'),
], GOLD)
caption_block(d, 840, 880, 700, 'The 10 modules', [
    ('', 'Dashboard · User Management · Wallet Management · Trade Management · Market Management · Payments · Messages · Reports · Security · Settings.'),
    ('•', 'Separate staff portal at /staff/login — customer credentials are rejected there and vice-versa (auto-redirect).'),
], BLUE)
c.convert('RGB').save(OUT+'05-admin-console.png', 'PNG')

# ---------- 6 · USER MANAGEMENT ----------
c, d = base(6, TOTAL, 'User Management, KYC & Audit', 'Every customer account under full administrative control', BLUE)
screenshot_panel(c, d, users)
caption_block(d, 60, 880, 700, 'User operations', [
    ('•', 'Search by UID, name or email; stats for totals, active, frozen and staff/agents.'),
    ('•', 'Full profile drill-down: personal data, VIP & KYC status, individual trade history and login history.'),
    ('•', 'Wallet controls per user: CREDIT · DEBIT · FREEZE_FUNDS · UNFREEZE_FUNDS · LOCK_WALLET · UNLOCK_WALLET · FREEZE_ACCOUNT · UNFREEZE_ACCOUNT.'),
], BLUE)
caption_block(d, 840, 880, 700, 'Protection', [
    ('•', 'Frozen accounts are blocked at login; frozen funds cannot be traded or withdrawn.'),
    ('•', 'Staff cannot modify a SUPER_ADMIN; every action is written to the audit log with actor + target.'),
    ('•', 'Send announcements directly to any user via in-app notifications.'),
], RED)
c.convert('RGB').save(OUT+'06-user-management.png', 'PNG')

# ---------- 7 · SUB-AGENT NETWORK ----------
c, d = base(7, TOTAL, 'Sub-Agent (IB) Network & Data Isolation', 'Multi-tier distribution with per-agent client visibility', GREEN)
screenshot_panel(c, d, agent)
caption_block(d, 60, 880, 700, 'How it works', [
    ('•', 'Each sub-agent gets a unique invitation code (e.g. AGT-MAYA24); customers registering with it are permanently bound to that agent.'),
    ('•', 'Agent dashboard shows only their own clients — balances and trading activity — with customer drill-down.'),
    ('•', 'Strict server-side isolation: queries filter by invitedById, so no agent can ever see another agent’s clients (verified by regression).'),
], GREEN)
caption_block(d, 840, 880, 700, 'Lifecycle', [
    ('•', 'Invitation codes are created in the admin console and can be deactivated.'),
    ('•', 'Agents log in through the same staff portal; role SUB_AGENT routes to /agent instead of /admin.'),
], BLUE)
c.convert('RGB').save(OUT+'07-sub-agents.png', 'PNG')

# ---------- 8 · ARCHITECTURE & SECURITY ----------
c, d = base(8, TOTAL, 'Architecture, Data Model & Security', 'Single Next.js application · 25+ API routes · Neon PostgreSQL', RED)
# diagram
boxes = [
    (60, 130, 1540, 235, BLUE, 'CLIENT — Next.js 16 + TypeScript + Tailwind SPA', '20 real routes: markets / trade / wallet / deposit / withdraw / history / admin / agent · live session polling · canvas charts'),
    (60, 285, 1540, 390, GREEN, 'API LAYER — 25+ route handlers under /api', 'auth (register w/ invitation · login · staff login · sessions) · trades · wallet · deposits · withdrawals · notifications · support · admin (stats/users/wallet/trades/markets/payments/messages/reports/security/settings) · agent'),
    (60, 440, 760, 570, GOLD, 'PRICE ENGINE — deterministic f(symbol, t)', '6 superposed waves + macro trend + jitter → same price on server & client; identical settlement for all viewers'),
    (840, 440, 1540, 570, BLUE, 'SETTLEMENT — expiry sweeper', 'exit price sampled at expiresAt · WON/LOST/REFUND · credits + notifications + ledger in one transaction'),
    (60, 620, 1540, 740, RED, 'DATA — Prisma ORM → Neon PostgreSQL (serverless, sslmode=require)', 'User · Wallet · Session · Market · Trade · Deposit · Withdrawal · Transaction · Notification · SupportThread · SupportMessage · LoginLog · AuditLog · InvitationCode · Setting · WatchItem'),
]
for x1, y1, x2, y2, col, head, body in boxes:
    d.rounded_rectangle((x1, y1, x2, y2), 14, fill=PANEL, outline=col, width=2)
    d.text((x1+20, y1+14), head, font=font(18, True), fill=col)
    yy = y1 + 50
    for ln in wrap(d, body, font(14), x2-x1-40):
        d.text((x1+20, yy), ln, font=font(14), fill=SLATE); yy += 20
# arrows
for ax in (400, 1200):
    d.line((ax, 240, ax, 280), fill=SLATE, width=3)
    d.polygon([(ax-8, 276), (ax+8, 276), (ax, 288)], fill=SLATE)
    d.line((ax, 395, ax, 435), fill=SLATE, width=3)
    d.polygon([(ax-8, 431), (ax+8, 431), (ax, 443)], fill=SLATE)
d.line((800, 505, 835, 505), fill=SLATE, width=3)
d.line((ax, 575, ax, 615), fill=SLATE, width=3)
d.polygon([(ax-8, 611), (ax+8, 611), (ax, 623)], fill=SLATE)
# security band (2 cols x 4 rows, wide columns — no overlap)
d.rounded_rectangle((60, 775, 1540, 912), 14, fill=PANEL, outline=GREEN, width=2)
d.text((80, 790), 'SECURITY MODEL', font=font(18, True), fill=GREEN)
sec = ['bcrypt password hashing', 'SHA-256-hashed session tokens (httpOnly cookies)',
       'RBAC: CUSTOMER / SUB_AGENT / ADMIN / SUPER_ADMIN', 'Frozen-account & wallet-lock guards on money paths',
       'Login history + action audit logs', 'Forced password change on first staff login',
       'Server-side authz on all admin & agent APIs', 'Atomic DB transactions for every balance movement']
for i, s in enumerate(sec):
    x = 80 + (i % 2) * 720
    y = 828 + (i // 2) * 20
    d.ellipse((x, y+4, x+8, y+12), fill=GREEN)
    d.text((x+16, y), s, font=font(13), fill=WHITE)
caption_block(d, 60, 940, 1480, 'Deployment & verification', [
    ('•', 'Runs as one Next.js app (standalone output). Configure a single env var NEON_DATABASE_URL and run the seed to bootstrap admin, staff, agents, demo customers and 18 markets.'),
    ('•', 'Verified by a 36-check all-roles regression suite (scripts/regression.ts): auth, trading, settlement math, payment approvals, admin controls, sub-agent isolation — all passing, plus browser E2E on every golden path.'),
], RED)
c.convert('RGB').save(OUT+'08-architecture.png', 'PNG')

print('slides written:')
for f in sorted(os.listdir(OUT)):
    print(' ', f, os.path.getsize(OUT+f)//1024, 'KB')

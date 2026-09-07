#!/usr/bin/env python3
"""BLOCKEXCHANGE showcase composer — customer storefront + admin console highlights.
Outputs: download/BLOCKEXCHANGE-showcase-4x3.png (1600x1200) and
         download/BLOCKEXCHANGE-showcase-1x1.png (1440x1440). Not for git push."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BG      = (5, 11, 24)      # #050B18
PANEL_BG= (8, 18, 33)      # #081221
BORDER  = (26, 51, 87)     # #1A3357
BLUE    = (0, 163, 255)    # #00A3FF
GOLD    = (255, 184, 0)    # #FFB800
GREEN   = (0, 255, 136)    # #00FF88
WHITE   = (240, 246, 255)
SLATE   = (140, 163, 199)  # #8CA3C7
DIM     = (94, 113, 148)

F = '/usr/share/fonts/truetype/dejavu/'
def font(sz, bold=False):
    return ImageFont.truetype(F + ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'), sz)

SHOTS = 'scripts/shots/'
LOGO = 'public/blockexchange-logo.png'

def crop_top(im, target_ratio):
    """Top-anchored crop to width/height ratio."""
    w, h = im.size
    th = int(w / target_ratio)
    if th >= h: return im
    return im.crop((0, 0, w, th))

def rounded_mask(size, rad):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size[0]-1, size[1]-1), rad, fill=255)
    return m

def panel(canvas, draw, xy, w, img, label, tag, tag_color, cap, img_h, rad=14):
    x, y = xy
    # frame
    draw.rounded_rectangle((x-1, y-1, x+w+1, y+img_h+45), rad+1, fill=BORDER)
    draw.rounded_rectangle((x, y, x+w, y+img_h+44), rad, fill=PANEL_BG)
    # screenshot
    shot = crop_top(img, w / img_h).resize((w-4, img_h-4), Image.LANCZOS)
    canvas.paste(shot, (x+2, y+2), rounded_mask((w-4, img_h-4), rad-4))
    # label bar
    bx = x + 14
    by = y + img_h + 10
    draw.ellipse((bx, by+9, bx+10, by+19), fill=tag_color)
    draw.text((bx+18, by+3), label, font=font(17, True), fill=WHITE)
    lw = draw.textlength(label, font=font(17, True))
    # tag chip
    chip = f' {tag} '
    cw = draw.textlength(chip, font=font(11, True)) + 10
    cx = x + w - cw - 12
    draw.rounded_rectangle((cx, by+4, cx+cw, by+24), 6, fill=(*tag_color, 40) if len(tag_color)==4 else tag_color)
    draw.text((cx+5, by+7), chip, font=font(11, True), fill=(5, 11, 24))
    # caption
    draw.text((bx+18, by+26), cap, font=font(12), fill=SLATE)

def header(canvas, draw, W, title_sz=46):
    # top neon gradient line
    for i in range(4):
        draw.line((0, i, W, i), fill=BLUE if i < 2 else GOLD)
    logo = Image.open(LOGO).convert('RGBA')
    lh = 64
    lw = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    canvas.alpha_composite(logo, (40, 34))
    tx = 40 + lw + 18
    draw.text((tx, 30), 'BLOCK', font=font(title_sz, True), fill=WHITE)
    bw = draw.textlength('BLOCK', font=font(title_sz, True))
    draw.text((tx+bw, 30), 'EXCHANGE', font=font(title_sz, True), fill=GOLD)
    draw.text((tx+2, 30+title_sz+2), 'TRADE · INVEST · GROW', font=font(13, True), fill=SLATE)
    return 34 + lh + 18

def chip(draw, x, y, text, color, sz=14):
    f = font(sz, True)
    pad = 14
    tw = draw.textlength(text, font=f)
    draw.rounded_rectangle((x, y, x+tw+pad*2, y+30), 8, outline=color, width=2)
    draw.ellipse((x+pad-4, y+11, x+pad+4, y+19), fill=color)
    draw.text((x+pad+10, y+7), text, font=f, fill=WHITE)
    return tw + pad*2 + 12

# ---------------- 4:3 (1600x1200) ----------------
def build_4x3():
    W, H = 1600, 1200
    canvas = Image.new('RGBA', (W, H), BG)
    # subtle glow blobs
    glow = Image.new('RGBA', (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-200, -250, 600, 250), fill=(0, 90, 180, 36))
    gd.ellipse((W-500, H-350, W+250, H+250), fill=(120, 80, 0, 30))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(80)))
    draw = ImageDraw.Draw(canvas)
    header(canvas, draw, W)
    draw.text((W-40-draw.textlength('PLATFORM HIGHLIGHTS', font=font(20, True)), 44), 'PLATFORM HIGHLIGHTS', font=font(20, True), fill=BLUE)
    draw.text((W-40-draw.textlength('Customer Storefront × Admin Console', font=font(14)), 76), 'Customer Storefront × Admin Console', font=font(14), fill=SLATE)

    m, gap = 40, 24
    pw = (W - m*2 - gap) // 2
    ih = 420
    imgs = {
        'home': Image.open(SHOTS+'01-home.png').convert('RGBA'),
        'trade': Image.open(SHOTS+'03-trade.png').convert('RGBA'),
        'admin': Image.open(SHOTS+'05-admin.png').convert('RGBA'),
        'users': Image.open(SHOTS+'06-admin-users.png').convert('RGBA'),
    }
    y1 = 176
    y2 = y1 + ih + 66
    panel(canvas, draw, (m, y1), pw, imgs['home'], 'Storefront — Landing & Live Markets', 'CUSTOMER', BLUE, 'Hero, real-time market strip, instant onboarding', ih)
    panel(canvas, draw, (m+pw+gap, y1), pw, imgs['trade'], 'Binary Trade Terminal — BUY UP / DOWN', 'CUSTOMER', BLUE, 'Candlesticks · Bollinger / SMA / EMA · 30s-120s expiry', ih)
    panel(canvas, draw, (m, y2), pw, imgs['admin'], 'Super Admin Console — Executive Dashboard', 'ADMIN', GOLD, 'House revenue · users · exposure · pending reviews', ih)
    panel(canvas, draw, (m+pw+gap, y2), pw, imgs['users'], 'Admin User Management', 'ADMIN', GOLD, 'Search by UID/name · wallet controls · freeze · audit', ih)

    # footer chips
    fy = y2 + ih + 66
    draw.line((m, fy-14, W-m, fy-14), fill=BORDER, width=1)
    x = m
    for text, c in [('18 live markets', BLUE), ('30 / 60 / 120s binary options', GREEN), ('92% max payout', GOLD),
                    ('Instant settlement', BLUE), ('RBAC admin · 10 modules', GOLD), ('Sub-agent network', BLUE)]:
        x += chip(draw, x, fy, text, c)
    return canvas

# ---------------- 1:1 (1440x1440) ----------------
def build_1x1():
    W, H = 1440, 1440
    canvas = Image.new('RGBA', (W, H), BG)
    glow = Image.new('RGBA', (W, H), (0,0,0,0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-180, -220, 540, 220), fill=(0, 90, 180, 36))
    gd.ellipse((W-460, H-320, W+230, H+230), fill=(120, 80, 0, 30))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(80)))
    draw = ImageDraw.Draw(canvas)
    header(canvas, draw, W, title_sz=42)
    draw.text((W-40-draw.textlength('PLATFORM HIGHLIGHTS', font=font(18, True)), 42), 'PLATFORM HIGHLIGHTS', font=font(18, True), fill=BLUE)
    draw.text((W-40-draw.textlength('Customer Storefront × Admin Console', font=font(13)), 72), 'Customer Storefront × Admin Console', font=font(13), fill=SLATE)

    m, gap = 40, 24
    pw = (W - m*2 - gap) // 2
    ih = int(pw / 1.6)  # native screenshot aspect, no crop
    imgs = {
        'home': Image.open(SHOTS+'01-home.png').convert('RGBA'),
        'trade': Image.open(SHOTS+'03-trade.png').convert('RGBA'),
        'wallet': Image.open(SHOTS+'04-wallet.png').convert('RGBA'),
        'admin': Image.open(SHOTS+'05-admin.png').convert('RGBA'),
    }
    y1 = 158
    y2 = y1 + ih + 62
    panel(canvas, draw, (m, y1), pw, imgs['home'], 'Storefront — Landing & Markets', 'CUSTOMER', BLUE, 'Live prices · sparklines · instant onboarding', ih)
    panel(canvas, draw, (m+pw+gap, y1), pw, imgs['trade'], 'Binary Terminal — BUY UP / DOWN', 'CUSTOMER', BLUE, 'Technical indicators · 30/60/120s expiry', ih)
    panel(canvas, draw, (m, y2), pw, imgs['admin'], 'Admin Console — Dashboard', 'ADMIN', GOLD, 'Revenue · exposure · pending reviews', ih)
    panel(canvas, draw, (m+pw+gap, y2), pw, imgs['wallet'], 'Customer Wallet', 'CUSTOMER', BLUE, 'Balance · frozen funds · full ledger', ih)

    # highlights block
    hy = y2 + ih + 52
    draw.line((m, hy-14, W-m, hy-14), fill=BORDER, width=1)
    draw.text((m, hy+4), 'WHY BLOCKEXCHANGE', font=font(17, True), fill=GOLD)
    bullets = [
        (BLUE,  'Binary options engine', 'UP/DOWN · 30s/60s/120s · auto-settlement at expiry'),
        (GREEN, 'Institutional wallet ops', 'credit / debit / freeze / lock · full audit trail'),
        (GOLD,  'Deposits & withdrawals', '5 payment rails · admin review · hold & release'),
        (BLUE,  'Sub-agent network', 'invitation codes · strict per-agent data isolation'),
        (BLUE,  'RBAC super admin', '10 modules · login & action audit logs'),
        (GREEN, 'Real-time everything', 'live pricing · notifications · support chat'),
    ]
    col_w = (W - m*2 - 40) // 2
    by = hy + 38
    for i, (c, t, d) in enumerate(bullets):
        cx = m + (i % 2) * (col_w + 40)
        cy = by + (i // 2) * 58
        draw.ellipse((cx, cy+8, cx+9, cy+17), fill=c)
        draw.text((cx+18, cy), t, font=font(15, True), fill=WHITE)
        draw.text((cx+18, cy+22), d, font=font(12), fill=SLATE)
    fy = by + 3*58 + 6
    draw.text((W//2 - draw.textlength('BLOCKEXCHANGE · Institutional binary trading desk', font=font(13, True))//2, fy), 'BLOCKEXCHANGE · Institutional binary trading desk', font=font(13, True), fill=DIM)
    return canvas

import os
os.makedirs('download', exist_ok=True)
for name, img in [('BLOCKEXCHANGE-showcase-4x3.png', build_4x3()), ('BLOCKEXCHANGE-showcase-1x1.png', build_1x1())]:
    out = f'download/{name}'
    img.convert('RGB').save(out, 'PNG', optimize=True)
    print(out, img.size, f'{os.path.getsize(out)//1024} KB')

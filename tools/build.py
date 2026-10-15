#!/usr/bin/env python3
"""Build castgames.com.au from the game folders (15 Oct 2026, the owner: every game under one address).

The games stay where they are (their own repos, still live on their own domains until the switch-over); this copies each
one into its folder here and fits it to CAST Games, so there's only ever one version of a game to fix:

    27-0 Game/27-0-nrl  -> 27-0/
    1000TRIES Game      -> 1000tries/   (and six-again/, its Six Again page)
    4000 GOALS Game     -> 4000goals/   (and play-on/, its Play On page)

For each copied page: the CAST Games bar (shared/cg.js, cg.css) at the top, the game's own header hidden, links to the
other games' domains pointed at their folders here, and (until the switch-over) noindex so Google keeps the old domains.
4000 GOALS saves some things under 1000TRIES's names (it began as a copy); on one address they would clash, so its copy
uses its own.

    python3 tools/build.py            build
    python3 tools/build.py --live     the switch-over build: no noindex, robots.txt open
Run it after pushing a game, then push this repo.
"""
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # this repo
GAMES_DIR = os.path.dirname(HERE)  # CAST Games
LIVE = '--live' in sys.argv
SITE = 'https://castgames.com.au/'
# Testers only until the switch-over (16 Oct 2026, the owner): shared/cg-gate.js hides every page until the tester password
GATE = '' if LIVE else '<script src="/shared/cg-gate.js?v=2"></script><!-- CG_GATE -->\n'


def _ver(rel):
    import hashlib
    return hashlib.md5(open(os.path.join(HERE, rel), 'rb').read()).hexdigest()[:8]


CGV = _ver('shared/cg.js') + _ver('shared/cg.css')[:4]  # the bar's version, so a change reaches every game page

GAMES = [
    # (folder here, source repo, id for cg.js, CSS that hides the game's own header, Play's hook)
    ('27-0', '27-0 Game/27-0-nrl', '27-0',
     '.cp-site-header, .screen > .header .header-logo, .screen > .header .cp-new-tab, .screen > .header [data-cast-account],'
     ' .screen > .header [data-cast-friends], .screen > .header .cp-right, .nf-head, .site-header',  # .site-header: its How It Works, Terms and Privacy pages (16 Oct 2026)
     "var b = document.querySelector('.screen.active .cp-new-tab'); if (b && b.offsetParent !== null) { b.click(); return true; } return false;"),
    ('1000tries', '1000TRIES Game', '1000tries', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    # 25000 RUNS (15 Oct 2026, the Big Bash game): developed in ~/cast-dev/bigbash/game, copied to CAST Games/25000 RUNS Game
    ('25000runs', '25000 RUNS Game', '25000runs', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    # 60000 RUNS (16 Oct 2026, the Test cricket game): developed in ~/cast-dev/tests/game, copied to CAST Games/60000 RUNS Game
    ('60000runs', '60000 RUNS Game', '60000runs', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    # G1 WINNER SPINNER (16 Oct 2026, the racing game): developed in ~/cast-dev/racing/game, copied to CAST Games/G1 WINNER Game
    ('g1winner', 'G1 WINNER Game', 'g1winner', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    # 777 TDS (16 Oct 2026, the NFL game; 700 TDS until 17 Oct 2026): developed in ~/cast-dev/nfl/game, copied to CAST Games/777 TDS Game.
    # Its cg.js id stays '700tds' (js/home.js reads it); the old /700tds/ address is a redirect (OLD_PATHS)
    ('777tds', '777 TDS Game', '700tds', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    # 500 GOALS (17 Oct 2026, the Premier League game): developed in ~/cast-dev/epl/game, copied to CAST Games/500 GOALS Game
    ('500goals', '500 GOALS Game', '500goals', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    ('4000goals', '4000 GOALS Game', '4000goals', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
]
# The old domains, and the folder each one is now
DOMAINS = [('https://27-0.thecastpatrol.com.au', '27-0'), ('https://27-0.app', '27-0'), ('https://1000tries.com.au', '1000tries'),
           ('https://1000tries.app', '1000tries'), ('https://4000goals.com.au', '4000goals')]
SPORT_BOARDS = {'nrl': ['1000plus', '270best'], 'afl': ['4000plus'], 'cricket': ['bbplus', 'tsplus'], 'nfl': ['nflplus'], 'racing': ['rcplus'], 'epl': ['eplplus']}
SPORT_PAGES = [('nrl', 'NRL'), ('afl', 'AFL'), ('cricket', 'Cricket'), ('nfl', 'NFL'), ('racing', 'Horse Racing'), ('epl', 'Premier League')]  # each sport with live games gets a See All page (shared/cg.js SPORTS path)
SKIP = ['.git', 'firebase', 'tools', '__', 'node_modules', 'CNAME', 'README.md', '_config.yml', 'brand', 'email', 'sitemap.xml', 'robots.txt', 'ads.txt', '.DS_Store']


def copy_game(folder, src):
    dst = os.path.join(HERE, folder)
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    args = ['rsync', '-a', '--delete'] + [x for s in SKIP for x in ('--exclude', s)] + [os.path.join(GAMES_DIR, src) + '/', dst + '/']
    subprocess.run(args, check=True)
    return dst


def rewrite_links(text, in_js):
    # Data and pictures from another game: from its folder on this site (root-relative, so a phone fetches it from here);
    # anything else (a link, a share): the full CAST Games address
    for dom, folder in DOMAINS:
        text = re.sub(re.escape(dom) + r'/(data|assets)/', ('/' + folder + r'/\1/') if in_js else (SITE + folder + r'/\1/'), text)
        text = text.replace(dom + '/', SITE + folder + '/').replace(dom + "'", SITE + folder + "/'").replace(dom + '"', SITE + folder + '/"')
    return text


# On CAST Games a game's hero says what the game is, not "From the makers of 27-0 and 1000TRIES, The Cast Patrol brings
# you ..." (the owner, 16 Oct 2026: the whole site is CAST's). The games' own sites keep their line
EXPLAIN = {
    '1000tries': 'Roll 3, pick 1 and draft 13 NRL players with their tries hidden. Can you reach <strong>1000 career tries</strong>?',
    '4000goals': 'Draft an AFL 18 with their goals hidden. Can you reach <strong>4000 career goals</strong>?',
    '25000runs': 'Draft a Big Bash XI with their BBL runs hidden. Can you reach <strong>25000 BBL runs</strong>?',
    '60000runs': 'Draft a Test XI from every Test since 1877 with their runs hidden. Can you reach <strong>60000 Test runs</strong>?',
    '777tds': 'Draft an NFL offence with their touchdowns hidden. Can you reach <strong>777 career touchdowns</strong>?',
    '500goals': 'Draft a Premier League XI with their goals hidden. Can you reach <strong>500 Premier League goals</strong>?',
    'g1winner': 'Draft 8 jockeys for a Group 1 card with their wins hidden. Can you reach <strong>550 Group 1 wins</strong>?',
}


# Every title in one pattern on CAST Games, "<GAME> | <short line> | CAST Games" (audit B8, 16 Oct 2026); the games' own
# sites keep theirs. A game whose home title runs long gets a shorter line here
NAMES = {'27-0': '27-0', '1000tries': '1000TRIES', '4000goals': '4000 GOALS', '25000runs': '25000 RUNS', '60000runs': '60000 RUNS',
         '777tds': '777 TDS', 'g1winner': 'G1 WINNER SPINNER', '500goals': '500 GOALS'}
HOME_LINE = {'27-0': 'Build an NRL 13 and Go Undefeated'}
# The games' old homes, written out in their copy (the privacy pages' "available at", 27-0's install steps): their folder
# here instead (audit T4, 16 Oct 2026)
BARE = ['27-0.thecastpatrol.com.au', '27-0.app', '1000tries.com.au', '1000tries.app', '4000goals.com.au', 'castgames.com.au']


def retitle(s, folder, fname):
    name = NAMES.get(folder)
    m = re.search(r'<title>([^<]*)</title>', s)
    if not name or not m:
        return s
    parts = [x.strip() for x in m.group(1).split('|')]
    if parts[-1] == name and len(parts) == 2:  # "How It Works | 1000TRIES"
        line = parts[0]
    elif parts[0] == name:  # "1000TRIES | Draft 1000 NRL Tries"
        line = HOME_LINE.get(folder) if fname == 'index.html' and folder in HOME_LINE else ' | '.join(parts[1:])
    else:
        return s
    title = '%s | %s | CAST Games' % (name, line)
    s = s.replace(m.group(0), '<title>%s</title>' % title, 1)
    if fname == 'index.html':
        s = re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*"', lambda x: x.group(1) + title + '"', s)
    return s


def fit_page(path, folder, gid, hide_css, play_js, base=None):
    s = open(path, encoding='utf-8').read()
    fname = os.path.basename(path)
    if folder in EXPLAIN:
        s = re.sub(r'<p class="hero-pitch">From the makers of.*?</p>', lambda m: '<p class="hero-pitch">' + EXPLAIN[folder] + '</p>', s, count=1, flags=re.S)
    s = retitle(s, folder, fname)
    s = s.replace('<meta property="og:site_name" content="The Cast Patrol">', '<meta property="og:site_name" content="CAST Games">')
    # A bare old address in the copy (not a link: those follow below): this game's folder here
    for dom in BARE:
        s = re.sub(r'(>\s*)' + re.escape(dom) + r'/?(\s*<)', lambda m: m.group(1) + 'castgames.com.au/' + folder + '/' + m.group(2), s)
    s = s.replace(' Play now at 27-0.app.', '')  # 27-0's description: it is played here
    s = rewrite_links(s, False)
    # A 404 page is shown at any address, however deep, so its own files and links go from the site's root (audit X2, X6:
    # every game's 404 came up unstyled, 27-0's wordmark missing)
    if fname == '404.html':
        s = re.sub(r'((?:href|src)=")/(?!/)', lambda m: m.group(1) + '/' + folder + '/', s)
    # Another game is on this site now: open it in the same tab (the point of one address)
    s = re.sub(r'(href="' + re.escape(SITE) + r'[^"]*")\s+target="_blank"(\s+rel="noopener")?', r'\1', s)
    head = GATE
    if base:
        head += '<base href="%s">\n' % base
    if not LIVE:
        head += '<meta name="robots" content="noindex">\n'
    head += '<link rel="stylesheet" href="../shared/cg.css?v=%s">\n<style>html.cg-in-game %s { display: none !important; }</style>\n' % (CGV, hide_css)
    s = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + head, s, count=1)
    body = ('<script>window.CG_GAME = %r; window.CG_PLAY = function () { %s };</script>\n'
            '<script src="../shared/cg.js?v=%s"></script>\n') % (gid, play_js, CGV)
    s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n' + body, s, count=1)
    if fname == '404.html':
        s = s.replace('"../shared/', '"/shared/')
    open(path, 'w', encoding='utf-8').write(s)


def fit_code(dst, folder):
    for root, _, files in os.walk(dst):
        for f in files:
            if not f.endswith(('.js', '.css', '.json')) or f.endswith('.min.js'):
                continue
            p = os.path.join(root, f)
            s = open(p, encoding='utf-8').read()
            t = rewrite_links(s, True) if f.endswith('.js') else s
            if folder in ('4000goals', '25000runs', '60000runs', '500goals') and f.endswith('.js'):
                t = t.replace("'1000tries_", "'" + folder + "_")  # its own saved data here (sound, draft, played...)
                t = t.replace("'1000_daily_'", "'" + folder + "_daily_'")  # and its own Daily goes (1000TRIES keeps '1000_daily_')
            if t != s:
                open(p, 'w', encoding='utf-8').write(t)


# On CAST Games every game logo drops its "created by cast" line (the owner, 15 Oct 2026: the whole site is CAST's). The
# line is cleared rather than cut off, so each picture keeps its size and every page lays out as before
LOGOS = ['assets/img/27-0-logo.png', 'assets/img/1000tries-logo.png', 'assets/img/4000goals-logo.png',
         'assets/logos/27-0.png', 'assets/logos/1000tries.png', 'assets/logos/4000goals.png', 'assets/logos/25000runs.png', 'assets/logos/60000runs.png', 'assets/logos/g1winner.png', 'assets/logos/777tds.png', 'assets/logos/500goals.png']


def clear_byline(path):
    from PIL import Image
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    a = im.split()[3]
    # The byline sits at the top; look for the gap under it across the whole width, then (777 TDS' goalposts rise past
    # it on the right, 16 Oct 2026) across the left three quarters only, clearing just that part
    for right in (w, int(w * 0.72)):
        rows = [y for y in range(h) if a.crop((0, y, right, y + 1)).getbbox()]
        if not rows:
            continue
        prev, cut = rows[0], None
        for y in rows[1:]:
            if y - prev > max(6, h // 60):
                cut = y
                break
            prev = y
        if cut and cut <= h * 0.4:
            im.paste(Image.new('RGBA', (right, cut), (0, 0, 0, 0)), (0, 0))
            im.save(path)
            return


# Each over/under page's own description and share card (audit B6, 16 Oct 2026: they carried their game's). The picture
# stays the game's (no card of their own yet)
OU_META = {
    'six-again': ('NRL', 'Over or under? Call NRL players\' career tries before the clock runs out. A free NRL game from The Cast Patrol.'),
    'play-on': ('AFL', 'Over or under? Call AFL players\' career goals before the clock runs out. A free AFL game from The Cast Patrol.'),
    'free-hit': ('BBL', 'Over or under? Call Big Bash runs and wickets before the clock runs out. A free cricket game from The Cast Patrol.'),
    'follow-on': ('Test', 'Over or under? Call Test runs and wickets before the clock runs out. A free cricket game from The Cast Patrol.'),
    'two-point': ('NFL', 'Over or under? Call NFL career touchdowns before the clock runs out. A free NFL game from The Cast Patrol.'),
    'extra-time': ('Premier League', 'Over or under? Call Premier League goals, assists and appearances before the clock runs out. A free football game from The Cast Patrol.'),
    'photo-finish': ('Racing', 'Over or under? Call jockeys, big races and horses before the clock runs out. A free horse racing game from The Cast Patrol.'),
}


def ou_meta(src, page, title):
    line, desc = OU_META[page]
    full = '%s | %s Over or Under | CAST Games' % (title, line)
    tags = [(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % desc),
            (r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s%s/">' % (SITE, page)),
            (r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s%s/">' % (SITE, page)),
            (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % full),
            (r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % desc),
            (r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="%s">' % full),
            (r'<meta name="twitter:description" content="[^"]*">', '<meta name="twitter:description" content="%s">' % desc)]
    for pat, rep in tags:
        src = re.sub(pat, lambda m: rep, src, count=1)
    return src


# An over/under page before its Launch (audit X7, 16 Oct 2026: /play-on/ showed the whole 4000 GOALS home): an Opens Soon
# card instead, until CastAccount says it is on (the owner's Launch, or his private preview link). page: (the account's
# check, its game's folder, its game, its sport's words)
SOON = {'play-on': ('poOn', '4000goals', '4000 GOALS', 'Call AFL players\' career goals over or under before the clock runs out.')}
SOON_CSS = ('<style>html.cg-soon-on body > *:not(.cg-bar):not(#cgSoon):not(script) { display: none !important; }'
            '#cgSoon { display: grid; place-items: center; min-height: calc(100vh - var(--cg-bar-h, 112px)); min-height: calc(100dvh - var(--cg-bar-h, 112px)); padding: 32px 16px; box-sizing: border-box;'
            ' background: radial-gradient(70% 50% at 50% 20%, rgba(var(--soon-rgb), .35), transparent 70%), #0a0a0f; color: #fff; font-family: Inter, -apple-system, system-ui, sans-serif; }'
            '#cgSoon[hidden] { display: none; }'
            '.cg-soon-box { width: 100%; max-width: 420px; display: grid; gap: 12px; justify-items: center; text-align: center; }'
            '.cg-soon-mark { display: grid; place-items: center; width: 84px; height: 84px; border-radius: 22px; background: linear-gradient(160deg, var(--c1), var(--c2)); border: 1px solid rgba(255, 255, 255, .14); font: 900 30px/1 Inter, sans-serif; }'
            '.cg-soon-k { font: 900 11px/1 Inter, sans-serif; letter-spacing: 1.3px; text-transform: uppercase; color: #a2a2b8; }'
            '#cgSoon h1 { margin: 0; font: 900 28px/1.15 Inter, sans-serif; text-wrap: balance; }'
            '#cgSoon p { margin: 0; color: #c9c9d8; font: 600 15px/1.45 Inter, sans-serif; text-wrap: balance; }'
            '.cg-soon-btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 50px; margin-top: 8px; border-radius: 999px; background: #fff; color: #0a0a0f; font: 900 15px/1 Inter, sans-serif; text-decoration: none; }'
            '.cg-soon-alt { display: inline-flex; align-items: center; min-height: 38px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .18); background: rgba(255, 255, 255, .06); color: #fff; font: 800 13px/1 Inter, sans-serif; text-decoration: none; }'
            '</style>\n')


def soon(src, page, title):
    check, game, gname, pitch = SOON[page]
    g = [x for x in GAMES if x[0] == game]
    head = '<script>document.documentElement.classList.add("cg-soon-on");</script>\n' + SOON_CSS
    src = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + head, src, count=1)
    box = ('<div id="cgSoon" style="--c1:#5a1a1a;--c2:#1c0b10;--soon-rgb:150,40,52"><div class="cg-soon-box"><span class="cg-soon-mark" aria-hidden="true">&#x25B2;&#x25BC;</span>'
           '<span class="cg-soon-k">%s</span><h1>%s Opens Soon</h1><p>%s</p>'
           '<a class="cg-soon-btn" href="/%s/">Play %s</a><a class="cg-soon-alt" href="/">All Games</a></div></div>\n'
           '<script>(function () {\n'
           '  var el = document.getElementById("cgSoon");\n'
           '  function on() { var A = window.CastAccount; try { return !!(A && A.%s && A.%s()); } catch (e) { return false; } }\n'
           '  function check() { var off = !on(); el.hidden = !off; document.documentElement.classList.toggle("cg-soon-on", off); }\n'
           '  check(); document.addEventListener("DOMContentLoaded", check); window.addEventListener("load", check); window.addEventListener("cast:launch", check);\n'
           '})();</script>\n') % ('Over or Under', title, pitch, game, gname, check, check)
    i = src.rfind('</body>')  # the page's own end (an earlier '</body>' can sit inside a script's string)
    return src[:i] + box + src[i:] if g and i > 0 else src


# Old game addresses (17 Oct 2026: 700 TDS became 777 TDS): a tiny page that sends any old link on to the new folder,
# keeping its query (?play=, a challenge) and its hash
OLD_PATHS = {'700tds': '777tds'}
REDIRECT = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<meta name="robots" content="noindex"><title>777 TDS | CAST Games</title><link rel="canonical" href="%s%s/%s">'
            '<script>location.replace("../%s/%s" + location.search + location.hash);</script></head>'
            '<body style="margin:0;background:#0a0a0f;color:#fff;font-family:Inter,system-ui,sans-serif;text-align:center;padding:40px 16px">'
            '<p><a style="display:inline-block;padding:12px 20px;border-radius:999px;background:#36e27e;color:#04120a;font-weight:800;text-decoration:none" href="../%s/%s">Play 777 TDS</a></p>'
            '</body></html>\n')


def old_paths():
    for old, new in OLD_PATHS.items():
        out = os.path.join(HERE, old)
        if os.path.isdir(out):
            shutil.rmtree(out)
        os.makedirs(out)
        # the home page and each other page (How It Works, Terms, Privacy) at its old address
        for f in sorted(os.listdir(os.path.join(HERE, new))):
            if f.endswith('.html') and f != '404.html':
                page = '' if f == 'index.html' else f[:-5]
                open(os.path.join(out, f), 'w', encoding='utf-8').write(REDIRECT % (SITE, new, page, new, page, new, page))
        print('built', old, '->', new)


def main():
    # The home page's own copies of the logos lose the byline too (16 Oct 2026: 777 TDS' home card still said created by cast)
    for rel in LOGOS:
        if os.path.exists(os.path.join(HERE, rel)):
            clear_byline(os.path.join(HERE, rel))
    for folder, src, gid, hide, play in GAMES:
        dst = copy_game(folder, src)
        fit_code(dst, folder)
        for rel in LOGOS:
            if os.path.exists(os.path.join(dst, rel)):
                clear_byline(os.path.join(dst, rel))
        for f in os.listdir(dst):
            if f.endswith('.html'):
                fit_page(os.path.join(dst, f), folder, gid, hide, play)
        print('built', folder)
    old_paths()  # 17 Oct 2026: /700tds/ sends old links on to /777tds/
    # Six Again and Play On: their game's page opened on the mode, each with its own address (the owner's call)
    for page, game, gid, key, title in (('six-again', '1000tries', 'six-again', 'ou', 'Six Again'), ('play-on', '4000goals', 'play-on', 'po', 'Play On'),
                                         # the newer games' over/unders, their own games too (16 Oct 2026, the owner)
                                         ('free-hit', '25000runs', 'free-hit', 'ou', 'Free Hit'), ('follow-on', '60000runs', 'follow-on', 'ou', 'Follow On'),
                                         ('two-point', '777tds', 'two-point', 'ou', 'Two Point'), ('photo-finish', 'g1winner', 'photo-finish', 'ou', 'Photo Finish'),
                                         ('extra-time', '500goals', 'extra-time', 'ou', 'Extra Time')):
        out = os.path.join(HERE, page)
        os.makedirs(out, exist_ok=True)
        src = open(os.path.join(HERE, game, 'index.html'), encoding='utf-8').read()
        src = src.replace("window.CG_GAME = '%s'" % dict((x[0], x[2]) for x in GAMES).get(game, game), "window.CG_GAME = '%s'" % gid)  # its game's cg.js id (777tds keeps '700tds')
        src = src.replace('<script src="../shared/cg.js?v=%s"></script>' % CGV,
                          '<script>if (!/[?&](play=ou|%s=)/.test(location.search)) history.replaceState(null, "", location.pathname + "?play=ou" + location.hash);</script>\n'
                          '<script src="../shared/cg.js?v=%s"></script>\n'
                          # its back arrow goes to the CAST Games home (on its own page there's no game home to go to)
                          '<script>window.addEventListener("load", function () { if (window.T && window.CG) T.ouHome = function () { location.href = CG.url(""); }; });</script>' % (key, CGV), 1)
        src = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n<base href="../%s/">' % game, src, count=1)
        src = re.sub(r'<title>[^<]*</title>', '<title>%s | %s Over or Under | CAST Games</title>' % (title, OU_META[page][0]), src, count=1)
        src = ou_meta(src, page, title)
        if page in SOON:
            src = soon(src, page, title)
        open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(src)
        print('built', page)
    # Files the account code loads next to the page (assets/...): the home and sport pages need their own copy
    for rel in ['assets/cast-pass-logo.png']:
        shutil.copyfile(os.path.join(HERE, '1000tries', rel), os.path.join(HERE, rel))
    # The home page's files from the games' folders (the account, Daily calendars, flags) carry a version from their own
    # contents, so a change reaches everyone at once instead of an old copy kept by the browser (15 Oct 2026)
    idx = os.path.join(HERE, 'index.html')
    hs = open(idx, encoding='utf-8').read()
    hs2 = re.sub(r'((?:1000tries|4000goals|27-0|25000runs|60000runs|777tds|g1winner|500goals)/(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=[\w]*)?"', lambda m: m.group(1) + '?v=' + _ver(m.group(1)) + '"', hs)
    if hs2 != hs:
        open(idx, 'w', encoding='utf-8').write(hs2)
    # Each sport's See All page (the owner, 15 Oct 2026): the home page with <base href="../">, drawing that sport only
    home = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()
    for sid, name in SPORT_PAGES:
        out = os.path.join(HERE, sid)
        os.makedirs(out, exist_ok=True)
        pg = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n<base href="../">', home, count=1)
        pg = re.sub(r'<title>[^<]*</title>', '<title>%s Games | CAST Games</title>' % name, pg, count=1)
        pg = pg.replace('<meta property="og:title" content="CAST Games | Free Sports Draft Games">', '<meta property="og:title" content="%s Games | CAST Games">' % name, 1)  # the share card names the sport
        pg = pg.replace('<script src="js/home.js', '<script>window.CG_SPORT = %r;</script>\n<script src="js/home.js' % sid, 1)
        # its Leaderboards open on that sport's own boards (16 Oct 2026: the cricket page's preview counted tries)
        pg = pg.replace('<script src="shared/cg.js', '<script>window.CAST_ACCOUNT.boards = %s;</script>\n<script src="shared/cg.js' % json.dumps(SPORT_BOARDS[sid]), 1)
        open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(pg)
        print('built', sid)
    # Hidden until the switch-over: Google stays on the old domains
    open(os.path.join(HERE, 'robots.txt'), 'w').write('User-agent: *\n' + ('Allow: /\nSitemap: ' + SITE + 'sitemap.xml\n' if LIVE else 'Disallow: /\n'))
    idx = os.path.join(HERE, 'index.html')
    s = open(idx, encoding='utf-8').read()
    has = '<meta name="robots" content="noindex"><!-- CG_HIDDEN' in s
    s = re.sub(r'<script src="/shared/cg-gate\.js[^"]*"></script><!-- CG_GATE -->\n?', '', s)
    if GATE:
        s = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + GATE.rstrip('\n'), s, count=1)
    if LIVE and has:
        s = re.sub(r'<meta name="robots" content="noindex"><!-- CG_HIDDEN[^>]*-->\n?', '', s)
    open(idx, 'w', encoding='utf-8').write(s)
    # The site's own 404 (16 Oct 2026) sits behind the tester password too, until the switch-over
    nf = os.path.join(HERE, '404.html')
    s = re.sub(r'<script src="/shared/cg-gate\.js[^"]*"></script><!-- CG_GATE -->\n?', '', open(nf, encoding='utf-8').read())
    if GATE:
        s = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + GATE.rstrip('\n'), s, count=1)
    open(nf, 'w', encoding='utf-8').write(s)
    print('done', 'LIVE' if LIVE else 'hidden')



def keep_same_pictures():
    """A logo the build re-saved with the same pixels goes back to its committed bytes (17 Oct 2026: PNG re-encoding
    changed the bytes every build, so the pre-push check saw a changed build each time)."""
    import io
    from PIL import Image, ImageChops
    try:
        changed = subprocess.run(['git', '-C', HERE, 'diff', '--name-only', '--', '*.png'], capture_output=True, text=True).stdout.split()
    except Exception:
        return
    for rel in changed:
        old = subprocess.run(['git', '-C', HERE, 'show', 'HEAD:' + rel], capture_output=True).stdout
        if not old:
            continue
        try:
            a = Image.open(io.BytesIO(old)).convert('RGBA'); b = Image.open(os.path.join(HERE, rel)).convert('RGBA')
        except Exception:
            continue
        if a.size == b.size and ImageChops.difference(a, b).getbbox() is None:
            subprocess.run(['git', '-C', HERE, 'checkout', '--', rel])


if __name__ == '__main__':
    main()
    keep_same_pictures()

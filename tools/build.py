#!/usr/bin/env python3
"""Build castgames.com.au from the game folders (15 Oct 2026, the owner: every game under one address).

The games stay where they are (their own repos, still live on their own domains until the switch-over); this copies each
one into its folder here and fits it to CAST Games, so there's only ever one version of a game to fix:

    27-0 Game/27-0-nrl  -> 27-0/
    1000TRIES Game      -> 1000tries/   (and six-again/, its Six Again page)
    4000 GOALS Game     -> 4000goals/

For each copied page: the CAST Games bar (shared/cg.js, cg.css) at the top, the game's own header hidden, links to the
other games' domains pointed at their folders here, and (until the switch-over) noindex so Google keeps the old domains.
4000 GOALS saves some things under 1000TRIES's names (it began as a copy); on one address they would clash, so its copy
uses its own.

    python3 tools/build.py            build
    python3 tools/build.py --live     the switch-over build: no noindex, robots.txt open
Run it after pushing a game, then push this repo.
"""
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # this repo
GAMES_DIR = os.path.dirname(HERE)  # CAST Games
LIVE = '--live' in sys.argv
SITE = 'https://castgames.com.au/'

GAMES = [
    # (folder here, source repo, id for cg.js, CSS that hides the game's own header, Play's hook)
    ('27-0', '27-0 Game/27-0-nrl', '27-0',
     '.cp-site-header, .screen > .header .header-logo, .screen > .header .cp-new-tab, .screen > .header [data-cast-account],'
     ' .screen > .header [data-cast-friends], .screen > .header .cp-right',
     "var b = document.querySelector('.screen.active .cp-new-tab'); if (b && b.offsetParent !== null) { b.click(); return true; } return false;"),
    ('1000tries', '1000TRIES Game', '1000tries', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
    ('4000goals', '4000 GOALS Game', '4000goals', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { b.click(); return true; } return false;"),
]
# The old domains, and the folder each one is now
DOMAINS = [('https://27-0.thecastpatrol.com.au', '27-0'), ('https://27-0.app', '27-0'), ('https://1000tries.com.au', '1000tries'),
           ('https://1000tries.app', '1000tries'), ('https://4000goals.com.au', '4000goals')]
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


def fit_page(path, folder, gid, hide_css, play_js, base=None):
    s = open(path, encoding='utf-8').read()
    s = rewrite_links(s, False)
    head = ''
    if base:
        head += '<base href="%s">\n' % base
    if not LIVE:
        head += '<meta name="robots" content="noindex">\n'
    head += '<link rel="stylesheet" href="../shared/cg.css">\n<style>html.cg-in-game %s { display: none !important; }</style>\n' % hide_css
    s = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + head, s, count=1)
    body = ('<script>window.CG_GAME = %r; window.CG_PLAY = function () { %s };</script>\n'
            '<script src="../shared/cg.js"></script>\n') % (gid, play_js)
    s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n' + body, s, count=1)
    open(path, 'w', encoding='utf-8').write(s)


def fit_code(dst, folder):
    for root, _, files in os.walk(dst):
        for f in files:
            if not f.endswith(('.js', '.css', '.json')) or f.endswith('.min.js'):
                continue
            p = os.path.join(root, f)
            s = open(p, encoding='utf-8').read()
            t = rewrite_links(s, True) if f.endswith('.js') else s
            if folder == '4000goals' and f.endswith('.js'):
                t = t.replace("'1000tries_", "'4000goals_")  # its own saved data here (sound, draft, played...)
            if t != s:
                open(p, 'w', encoding='utf-8').write(t)


# On CAST Games every game logo drops its "created by cast" line (the owner, 15 Oct 2026: the whole site is CAST's). The
# line is cleared rather than cut off, so each picture keeps its size and every page lays out as before
LOGOS = ['assets/img/27-0-logo.png', 'assets/img/1000tries-logo.png', 'assets/img/4000goals-logo.png',
         'assets/logos/27-0.png', 'assets/logos/1000tries.png', 'assets/logos/4000goals.png']


def clear_byline(path):
    from PIL import Image
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    a = im.split()[3]
    rows = [y for y in range(h) if a.crop((0, y, w, y + 1)).getbbox()]
    if not rows:
        return
    prev, cut = rows[0], None
    for y in rows[1:]:
        if y - prev > max(6, h // 60):
            cut = y
            break
        prev = y
    if not cut or cut > h * 0.4:  # no byline at the top
        return
    clear = Image.new('RGBA', (w, cut), (0, 0, 0, 0))
    im.paste(clear, (0, 0))
    im.save(path)


def main():
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
    # Six Again: 1000TRIES's page opened on Six Again, with its own address (the owner's call)
    six = os.path.join(HERE, 'six-again')
    os.makedirs(six, exist_ok=True)
    src = open(os.path.join(HERE, '1000tries', 'index.html'), encoding='utf-8').read()
    src = src.replace("window.CG_GAME = '1000tries'", "window.CG_GAME = 'six-again'")
    src = src.replace('<script src="../shared/cg.js"></script>',
                      '<script>if (!/[?&](play=ou|ou=)/.test(location.search)) history.replaceState(null, "", location.pathname + "?play=ou" + location.hash);</script>\n'
                      '<script src="../shared/cg.js"></script>', 1)
    src = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n<base href="../1000tries/">', src, count=1)
    open(os.path.join(six, 'index.html'), 'w', encoding='utf-8').write(src)
    print('built six-again')
    # Hidden until the switch-over: Google stays on the old domains
    open(os.path.join(HERE, 'robots.txt'), 'w').write('User-agent: *\n' + ('Allow: /\nSitemap: ' + SITE + 'sitemap.xml\n' if LIVE else 'Disallow: /\n'))
    idx = os.path.join(HERE, 'index.html')
    s = open(idx, encoding='utf-8').read()
    has = '<meta name="robots" content="noindex"><!-- CG_HIDDEN' in s
    if LIVE and has:
        s = re.sub(r'<meta name="robots" content="noindex"><!-- CG_HIDDEN[^>]*-->\n?', '', s)
    open(idx, 'w', encoding='utf-8').write(s)
    print('done', 'LIVE' if LIVE else 'hidden')


if __name__ == '__main__':
    main()

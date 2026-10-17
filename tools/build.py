#!/usr/bin/env python3
"""Build castgames.com.au from the game folders (15 Oct 2026, the owner: every game under one address).

The games stay where they are (their own repos, still live on their own domains until the switch-over); this copies each
one into its folder here and fits it to CAST Games, so there's only ever one version of a game to fix:

    27-0 Game/27-0-nrl  -> 27-0/        (27-0 CLASSIC; 27-0-pack/, 27-0-hard/ and world-cup-8-0/ are its other modes)
    1000TRIES Game      -> 1000tries/   (1000TRIES; 1000tries-team-spin/, nrlw-250/, world-cup-200/, higher-or-lower-nrl/, nrl-bingo/ ...)
    4000 GOALS Game     -> 4000goals/   (4000 GOALS; 4000goals-team-spin/, aflw-750/, higher-or-lower-afl/ ...)

Every mode is its own game with its own page (17 Oct 2026, the owner: "a box of games"): the game's page with <base>, opened
straight into that mode (window.CG_MODE, the game's own boot), with its own title and share card. The list of cards and
pages is shared/cg.js GAMES, read here with node, so a new mode is one entry there.

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
# CAST Games (CG_GAMES_DIR: another folder holding the game folders by the same names, for a build from working copies)
GAMES_DIR = os.environ.get('CG_GAMES_DIR') or os.path.dirname(HERE)
LIVE = '--live' in sys.argv
# --only 1000tries,27-0: copy only these game folders again (the others stay as they are in this repo)
ONLY = next((a.split('=', 1)[1].split(',') for a in sys.argv if a.startswith('--only=')), None)
SITE = 'https://castgames.com.au/'
# Testers only until the switch-over (16 Oct 2026, the owner): shared/cg-gate.js hides every page until the tester password
GATE = '' if LIVE else '<script src="/shared/cg-gate.js?v=2"></script><!-- CG_GATE -->\n'
# Pictures, from the top of every page's head (speed pass, 18 Oct 2026): a card or logo box (ART) is marked .is-in once its
# picture has loaded, which ends its waiting shimmer (shared/cg.css); a browser that can't show WebP (webp_pictures) gets
# the picture's PNG instead; and the footer rule below
ART = '.cg-art, .cg-swr-art, .cg-idle-art, .cgt-gc-art'
IMGFB = ("<script>(function () { function inn(t) { var b = t.closest && t.closest('" + ART + "'); if (b) b.classList.add('is-in'); } "
         "document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG') inn(t); }, true); "
         "document.addEventListener('error', function (e) { var t = e.target; if (!t || t.tagName !== 'IMG') return; "
         "if (/\\.webp(\\?|$)/.test(t.src) && !t.getAttribute('data-png')) { t.setAttribute('data-png', '1'); "
         "t.src = t.src.replace(/\\.webp(\\?v=\\w*)?/, '.png'); return; } inn(t); }, true); })();</script>"
         # and a game's footer waits unseen while its players load ("Loading the players", HIGHER OR LOWER and Bingo), so it
         # never shows at the top and then jumps down when the game draws (a layout shift of 0.2)
         "<style>body:has(.screen.is-active .ou-load) .site-footer { visibility: hidden; }</style><!-- CG_PICS -->\n")


def _ver(rel):
    import hashlib
    return hashlib.md5(open(os.path.join(HERE, rel), 'rb').read()).hexdigest()[:8]


def trim_logos():
    """Every card logo cropped to its own visible pixels plus a thin even margin (18 Oct 2026, the owner: "the logo bigger
    for sure"): the final set comes as 600x380 with a lot of clear space around each logo, so on a card the art sat small.
    Runs on each build, so a new logo dropped into assets/logos is trimmed too; an already trimmed file is left alone"""
    from PIL import Image
    s = open(os.path.join(HERE, 'shared', 'cg.js'), encoding='utf-8').read()
    for name in sorted(set(n + '.png' for n in re.findall(r"L \+ '([\w.-]+)\.(?:png|webp)", s))):  # (a .webp card logo's source is its .png)
        p = os.path.join(HERE, 'assets', 'logos', name)
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGBA')
        b = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        if not b:
            continue
        m = max(3, round((b[2] - b[0]) * 0.02))
        box = (max(0, b[0] - m), max(0, b[1] - m), min(im.width, b[2] + m), min(im.height, b[3] + m))
        if box[0] <= 2 and box[1] <= 2 and box[2] >= im.width - 2 and box[3] >= im.height - 2:
            continue
        im.crop(box).save(p, optimize=True)
        print('trimmed', name, im.size, '->', (box[2] - box[0], box[3] - box[1]))


def version_logos():
    """Every card logo in shared/cg.js (L + 'name.png') carries its own content version (17 Oct 2026: the owner's phone kept
    showing the old logos, because the same address never asked again). Written into cg.js before the bar's version is
    worked out, so a new logo also makes a new cg.js"""
    p = os.path.join(HERE, 'shared', 'cg.js')
    s = open(p, encoding='utf-8').read()
    t = re.sub(r"L \+ '([\w.-]+\.(?:png|webp))(?:\?v=\w*)?'", lambda m: "L + '%s?v=%s'" % (m.group(1), _ver('assets/logos/' + m.group(1))), s)
    t = re.sub(r"TB \+ '([\w.-]+\.(?:png|webp))(?:\?v=\w*)?'", lambda m: "TB + '%s?v=%s'" % (m.group(1), _ver('assets/tabs/' + m.group(1))), t)  # the bar's icons
    t = re.sub(r"IC \+ '([\w.-]+\.(?:png|webp))(?:\?v=\w*)?'", lambda m: "IC + '%s?v=%s'" % (m.group(1), _ver('assets/icons/' + m.group(1))), t)  # the switcher's group icons
    # the bar's own logo (webp_pictures)
    t = re.sub(r"url\('assets/logos/castgames\.webp(?:\?v=\w*)?'\)", lambda m: "url('assets/logos/castgames.webp?v=%s')" % _ver('assets/logos/castgames.webp'), t)
    if t != s:
        open(p, 'w', encoding='utf-8').write(t)
    # the home page's banner art (js/home.js BN + '<slide>/art-phone@2x.webp'), the same way (17 Oct 2026)
    p = os.path.join(HERE, 'js', 'home.js')
    s = open(p, encoding='utf-8').read()
    t = re.sub(r"BN \+ '([\w@./-]+\.webp)(?:\?v=\w*)?'", lambda m: "BN + '%s?v=%s'" % (m.group(1), _ver('assets/banners/' + m.group(1))), s)
    if t != s:
        open(p, 'w', encoding='utf-8').write(t)


# Pictures the bar and the cards show, as WebP (speed pass, 18 Oct 2026): (shared/cg.js prefix, folder, lossless, widest)
# The card logos were 54 to 137 KB PNGs each (about 2.7 MB on the home page); the largest a card shows one is 158 CSS px
# wide, so 480 px covers a 3x phone screen. The bar's icons stay pixel for pixel (lossless). The PNG stays the source
# (what the owner and trim_logos work on) and stays published, so anything else pointing at it still works
WEBP = [('L', 'logos', False, 480), ('TB', 'tabs', True, 0), ('IC', 'icons', False, 0)]
WEBP_LOG = os.path.join(HERE, 'tools', 'webp-sources.json')  # each WebP's source PNG version: made again only when it changes


def webp_pictures():
    from PIL import Image
    try:
        made = json.load(open(WEBP_LOG))
    except Exception:
        made = {}

    def webp(png, lossless, widest):
        out = png[:-4] + '.webp'
        rel = os.path.relpath(out, HERE)
        try:
            im = Image.open(png).convert('RGBA')
        except Exception as e:
            print('webp: kept', os.path.relpath(png, HERE), e)
            return False
        # the source's pixels, not its bytes: a PNG saved again with the same picture (keep_same_pictures) changes nothing
        import hashlib
        src = hashlib.md5(('%dx%d:' % im.size).encode() + im.tobytes()).hexdigest()[:12]
        if made.get(rel) == src and os.path.exists(out):
            return True
        try:
            if widest and im.width > widest:
                im = im.resize((widest, round(im.height * widest / im.width)), Image.LANCZOS)
            if lossless:
                im.save(out, 'WEBP', lossless=True, quality=100, method=6)
            else:
                im.save(out, 'WEBP', quality=90, alpha_quality=100, method=6)
        except Exception as e:  # no WebP in this Pillow: the PNG stays
            print('webp: kept', rel[:-5] + '.png', e)
            return False
        made[rel] = src
        print('webp:', rel, os.path.getsize(png) // 1024, '->', os.path.getsize(out) // 1024, 'KB')
        return True
    p = os.path.join(HERE, 'shared', 'cg.js')
    s = t = open(p, encoding='utf-8').read()
    for pre, folder, lossless, widest in WEBP:
        for base in sorted(set(re.findall(pre + r" \+ '([\w.-]+)\.(?:png|webp)", t))):
            png = os.path.join(HERE, 'assets', folder, base + '.png')
            if os.path.exists(png) and webp(png, lossless, widest):
                t = re.sub(pre + r" \+ '" + re.escape(base) + r"\.png(\?v=\w*)?'", pre + " + '" + base + ".webp'", t)
    # the bar's logo (1301 px wide, shown 59 to 75 px wide): 240 px, 3x its widest (the tester screen keeps the PNG)
    if webp(os.path.join(HERE, 'assets', 'logos', 'castgames.png'), False, 240):
        t = re.sub(r"url\('assets/logos/castgames\.png'\)", "url('assets/logos/castgames.webp')", t)
    if t != s:
        open(p, 'w', encoding='utf-8').write(t)
    json.dump(made, open(WEBP_LOG, 'w'), indent=1, sort_keys=True)


trim_logos()
webp_pictures()
version_logos()
CGV = _ver('shared/cg.js') + _ver('shared/cg.css')[:4]  # the bar's version, so a change reaches every game page

GAMES = [
    # (folder here, source repo, id for cg.js, CSS that hides the game's own header, Play's hook)
    ('27-0', '27-0 Game/27-0-nrl', '27-0',
     '.cp-site-header, .screen > .header .header-logo, .screen > .header .cp-new-tab, .screen > .header [data-cast-account],'
     ' .screen > .header [data-cast-friends], .screen > .header .cp-right, .nf-head, .site-header',  # .site-header: its How It Works, Terms and Privacy pages (16 Oct 2026)
     "var b = document.querySelector('.screen.active .cp-new-tab'); if (b) { if (!dry) b.click(); return true; } return false;"),
    ('1000tries', '1000TRIES Game', '1000tries', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # 25000 RUNS (15 Oct 2026, the Big Bash game): developed in ~/cast-dev/bigbash/game, copied to CAST Games/25000 RUNS Game
    ('25000runs', '25000 RUNS Game', '25000runs', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # 60000 RUNS (16 Oct 2026, the Test cricket game): developed in ~/cast-dev/tests/game, copied to CAST Games/60000 RUNS Game
    ('60000runs', '60000 RUNS Game', '60000runs', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # G1 WINNER SPINNER (16 Oct 2026, the racing game): developed in ~/cast-dev/racing/game, copied to CAST Games/G1 WINNER Game
    ('g1winner', 'G1 WINNER Game', 'g1winner', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # 777 TDS (16 Oct 2026, the NFL game; 700 TDS until 17 Oct 2026): developed in ~/cast-dev/nfl/game, copied to CAST Games/777 TDS Game.
    # Its cg.js id stays '700tds' (js/home.js reads it); the old /700tds/ address is a redirect (OLD_PATHS)
    ('777tds', '777 TDS Game', '777tds', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # 650 GOALS (17 Oct 2026, the Premier League game; 500 GOALS until the same day): developed in ~/cast-dev/epl/game,
    # copied to CAST Games/650 GOALS Game. Its cg.js id stays '500goals'; the old /500goals/ address is a redirect (OLD_PATHS)
    ('650goals', '650 GOALS Game', '650goals', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # SC POINTS KING (17 Oct 2026, the NRL SC spinner): developed in ~/cast-dev/sc/game, copied to CAST Games/SC POINTS KING
    # Game. On castgames only (never the old sites); its card waits for the owner's Launch ('sc', shared/cg.js launch)
    ('scpointsking', 'SC POINTS KING Game', 'scpointsking', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # SC POINTS KING: AFL (17 Oct 2026, the AFL SC spinner): developed in ~/cast-dev/sc-afl/game, copied to CAST Games/SC
    # POINTS KING AFL Game. On castgames only; its card waits for the owner's Launch ('scafl', shared/cg.js launch)
    ('scpointsking-afl', 'SC POINTS KING AFL Game', 'scpointsking-afl', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    # 100000 POINTS (17 Oct 2026, the NBA game): developed in ~/cast-dev/nba/game, copied to CAST Games/100000 POINTS Game.
    # Its accounts open at the owner's Launch ('nba')
    ('100000points', '100000 POINTS Game', '100000points', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
    ('4000goals', '4000 GOALS Game', '4000goals', '.site-header',
     "var b = document.querySelector('[data-action=\"new-game\"]'); if (b && getComputedStyle(b).display !== 'none' && document.body.getAttribute('data-screen') === 'draft') { if (!dry) b.click(); return true; } return false;"),
]
# The old domains, and the folder each one is now
DOMAINS = [('https://27-0.thecastpatrol.com.au', '27-0'), ('https://27-0.app', '27-0'), ('https://1000tries.com.au', '1000tries'),
           ('https://1000tries.app', '1000tries'), ('https://4000goals.com.au', '4000goals')]
SPORT_BOARDS = {'nrl': ['1000plus', '270best'], 'afl': ['4000plus'], 'cricket': ['bbplus', 'tsplus'], 'nfl': ['nflplus'], 'racing': ['rcplus'], 'epl': ['eplplus'], 'nba': ['nbaplus']}
SPORT_PAGES = [('nrl', 'NRL'), ('afl', 'AFL'), ('cricket', 'Cricket'), ('racing', 'Horse Racing'), ('epl', 'Premier League'), ('nfl', 'NFL'), ('nba', 'NBA')]  # each sport with live games gets a See All page (shared/cg.js SPORTS path)
# /shared: 1000TRIES's masters (its own site never publishes them; the game reads its js/ and data/ copies). The repo's
# .gitignore and .gitattributes aren't for the website either (17 Oct 2026, the security review)
SKIP = ['.git', 'firebase', 'tools', '__', 'node_modules', 'shots', 'bingo-reps.json', 'CNAME', 'README.md', '_config.yml', 'brand', 'email', 'sitemap.xml', 'robots.txt', 'ads.txt', '.DS_Store',
        '/shared', '.gitignore', '.gitattributes']


def committed_copy(path):
    """A game whose folder is a git repo is built from what's COMMITTED there, never from edits still in progress
    (17 Oct 2026: an agent's unfinished draft.js reached castgames because the build copied the folder as it was).
    Returns a temporary folder holding HEAD, or the folder itself when it isn't a repo."""
    if not os.path.isdir(os.path.join(path, '.git')):
        return path, None
    import tempfile
    tmp = tempfile.mkdtemp(prefix='cg-build-')
    arc = subprocess.run(['git', '-C', path, 'archive', '--format=tar', 'HEAD'], check=True, capture_output=True).stdout
    subprocess.run(['tar', '-x', '-C', tmp], input=arc, check=True)
    return tmp, tmp


def copy_game(folder, src):
    dst = os.path.join(HERE, folder)
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    from_dir, tmp = committed_copy(os.path.join(GAMES_DIR, src))
    try:
        args = ['rsync', '-a', '--delete'] + [x for s in SKIP for x in ('--exclude', s)] + [from_dir.rstrip('/') + '/', dst + '/']
        subprocess.run(args, check=True)
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
    return dst


def sign_in_pages():
    """Firebase's sign-in helper pages at this site's root, /__/auth/handler and /__/auth/iframe (17 Oct 2026, before the
    launch): with them a phone signs in to Google in the same tab here, from any game's folder, as on the games' own sites
    (cast-account.js SELF_AUTH_HOSTS). The same files as 1000TRIES's /__/auth/ (from the project's firebaseapp.com), as
    committed there. The game folders never get a copy (SKIP): Firebase only ever asks for them at the root"""
    src, dst = os.path.join(GAMES_DIR, '1000TRIES Game'), os.path.join(HERE, '__')
    if os.path.isdir(dst):
        shutil.rmtree(dst)
    if os.path.isdir(os.path.join(src, '.git')):
        arc = subprocess.run(['git', '-C', src, 'archive', '--format=tar', 'HEAD', '__/auth'], check=True, capture_output=True).stdout
        subprocess.run(['tar', '-x', '-C', HERE], input=arc, check=True)
    else:
        shutil.copytree(os.path.join(src, '__'), dst)
    for f in ('handler.html', 'handler.js', 'iframe.html', 'iframe.js', 'experiments.js'):
        if not os.path.isfile(os.path.join(dst, 'auth', f)):
            raise SystemExit('__/auth/%s is missing: sign-in on castgames.com.au would break' % f)
    print('built __/auth')


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
    '650goals': 'Draft a Premier League XI with their goals hidden. Can you reach <strong>650 Premier League goals</strong>?',
    'g1winner': 'Draft 8 jockeys for a Group 1 card with their wins hidden. Can you reach <strong>550 Group 1 wins</strong>?',
    'scpointsking': 'Spin NRL player seasons from 2009 to 2026 and build the biggest SC 13. The top of the board wears the <strong>crown</strong>.',
    'scpointsking-afl': 'Spin AFL player seasons from 2007 to 2026 and build the biggest SC 18. The top of the board wears the <strong>crown</strong>.',
    '100000points': 'Draft an NBA starting five with their points hidden. Can you reach <strong>100000 career points</strong>?',
}


# Every title in one pattern on CAST Games, "<GAME> | <short line> | CAST Games" (audit B8, 16 Oct 2026); the games' own
# sites keep theirs. A game whose home title runs long gets a shorter line here
NAMES = {'27-0': '27-0', '1000tries': '1000TRIES', '4000goals': '4000 GOALS', '25000runs': '25000 RUNS', '60000runs': '60000 RUNS',
         '777tds': '777 TDS', 'g1winner': 'G1 WINNER SPINNER', '650goals': '650 GOALS', 'scpointsking': 'SC POINTS KING', 'scpointsking-afl': 'SC POINTS KING: AFL', '100000points': '100000 POINTS'}
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


def fit_page(path, folder, gid, hide_css, play_js, base=None, card=None):
    s = open(path, encoding='utf-8').read()
    fname = os.path.basename(path)
    if folder in EXPLAIN:
        s = re.sub(r'<p class="hero-pitch">From the makers of.*?</p>', lambda m: '<p class="hero-pitch">' + EXPLAIN[folder] + '</p>', s, count=1, flags=re.S)
    s = retitle(s, folder, fname)
    if card:  # the folder's own page plays its main mode (17 Oct 2026): its card's title and share card
        s = page_meta(s, card)
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
    if card:  # opened straight into its mode, before the game's own head script reads it (the game's index.html play-boot)
        head += '<script>window.CG_MODE = %r;</script>\n' % card['mode']
    if base:
        head += '<base href="%s">\n' % base
    if not LIVE:
        head += '<meta name="robots" content="noindex">\n'
    head += '<link rel="stylesheet" href="../shared/cg.css?v=%s">\n<style>html.cg-in-game %s { display: none !important; }</style>\n' % (CGV, hide_css)
    s = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n' + head, s, count=1)
    body = ('<script>window.CG_GAME = %r; window.CG_PLAY = function (dry) { %s };</script>\n'
            '<script src="../shared/cg.js?v=%s"></script>\n') % (gid, play_js, CGV)
    s = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + '\n' + body, s, count=1)
    if fname == '404.html':
        s = s.replace('"../shared/', '"/shared/')
    open(path, 'w', encoding='utf-8').write(s)


# The address printed on the share pictures (growth, 17 Oct 2026): on CAST Games every picture names CASTGAMES.COM.AU, in
# the capitals the owner's graphics use, never an old address that will only redirect (the games' own sites keep theirs).
# Exact strings from the pictures' drawing code: 1000TRIES and 4000 GOALS share-card.js, 27-0 share-story.js, its season
# card (game-data-sim.js), its 27-0 celebration and World Cup 8-0's pictures (world-cup.js)
SHARE_MARKS = [("'CAN YOU BEAT IT?  1000TRIES.COM.AU'", "'CAN YOU BEAT IT?  CASTGAMES.COM.AU'"), ("'1000TRIES.COM.AU'", "'CASTGAMES.COM.AU'"),
               ("'CAN YOU BEAT IT?  4000GOALS.COM.AU'", "'CAN YOU BEAT IT?  CASTGAMES.COM.AU'"), ("'4000GOALS.COM.AU'", "'CASTGAMES.COM.AU'"),
               ("'CAN YOU GO 27-0?  27-0.APP'", "'CAN YOU GO 27-0?  CASTGAMES.COM.AU'"), ("fillText('27-0.APP'", "fillText('CASTGAMES.COM.AU'"),
               ("tx('27-0.app'", "tx('CASTGAMES.COM.AU'"), ("center('27-0.app'", "center('CASTGAMES.COM.AU'")]


# The account's first Firestore reads (which games are on, config/launch; the home's boards) go to another address, and
# on 4G its connection alone is three round trips. Opened from the top of every page that runs the account (speed pass,
# 18 Oct 2026), it is ready by the time the account asks, so a first visit's Coming Soon cards turn live sooner
LAUNCH_PRE = '<link rel="preconnect" href="https://firestore.googleapis.com" crossorigin><!-- CG_LAUNCH -->\n'


def with_imgfb(s):
    """The page with the pictures script (IMGFB) and the Firestore connection (LAUNCH_PRE) once each, at the top of its
    head (after the tester screen's script)"""
    s = re.sub(r'<(?:script|link)[^\n]*<!-- CG_(?:IMGFB|PICS|LAUNCH) -->\n?', '', s)
    return re.sub(r'(<head[^>]*>\n(?:<script src="/shared/cg-gate\.js[^"]*"></script><!-- CG_GATE -->\n)?)', lambda m: m.group(1) + IMGFB + (LAUNCH_PRE if 'cast-account.js' in s else ''), s, count=1)  # (only where the account runs)


# The games' own header and home logos (speed pass, 18 Oct 2026): on CAST Games the header is hidden and a page opens
# straight into play, yet these pictures still downloaded on every game page (about 130 KB, as much as the game's own
# scripts). Lazy, they load only if they are ever shown (each has its width and height, so nothing moves when it does)
HIDDEN_ART = ('brand-logo', 'brand-game', 'hero-logo', 'cp-brand-cast', 'cp-brand-game', 'cp-hero-logo', 'header-logo')


def lazy_hidden(s):
    def rep(m):
        tag = m.group(0)
        cls = re.search(r'\sclass="([^"]*)"', tag)
        # (not one with a data-fallback: a game swaps that for words when it looks unloaded)
        if not cls or not set(cls.group(1).split()) & set(HIDDEN_ART) or re.search(r'\s(?:loading|data-fallback)=', tag):
            return tag
        return tag[:4] + ' loading="lazy"' + tag[4:]
    return re.sub(r'<img\s[^>]*>', rep, s)


def ou_ahead(s, folder):
    """A HIGHER OR LOWER page asks for its players (data/ou.json, as its js/overunder.js names it) from its head, so they
    are in by the time the game opens (speed pass, 18 Oct 2026). With the page's files now fetched together the game
    opened before its players arrived, drew "Loading the players" and then grew, pushing the footer down the screen"""
    s = re.sub(r'<link rel="preload" href="data/ou\.json[^"]*" as="fetch" crossorigin>\n?', '', s)
    if "window.CG_MODE = 'ou'" not in s:
        return s
    try:
        m = re.search(r"fetch\('(data/ou\.json[^']*)'", open(os.path.join(HERE, folder, 'js', 'overunder.js'), encoding='utf-8').read())
    except OSError:
        return s
    if not m:
        return s
    link = '<link rel="preload" href="%s" as="fetch" crossorigin>\n' % m.group(1)
    return re.sub(r'(<base href="[^"]*">\n)', lambda x: x.group(1) + link, s, count=1)


def csp_by_script(s):
    """The games' <meta http-equiv="Content-Security-Policy"> (upgrade-insecure-requests, object-src, base-uri: the rules a
    meta tag can carry on GitHub Pages) put in by a tiny script at the same spot instead (speed pass, 18 Oct 2026). Chrome
    stops looking ahead for a page's files once its HTML has that meta tag, so every script after it was fetched one at a
    time (1000TRIES took about 24 s to show on a mid-range phone on 4G, about 9 s without it). The same rules from the same
    spot: Chrome, Safari and Firefox apply a policy meta added by a script, before anything after it loads"""
    def rep(m):
        import html
        return ('<script>(function () { var m = document.createElement(\'meta\'); m.httpEquiv = \'Content-Security-Policy\'; '
                'm.content = %s; document.head.appendChild(m); })();</script>') % json.dumps(html.unescape(m.group(1)))
    return re.sub(r'<meta http-equiv="Content-Security-Policy" content="([^"<>]*)"\s*/?>', rep, s)


def fit_code(dst, folder):
    for root, _, files in os.walk(dst):
        for f in files:
            if not f.endswith(('.js', '.css', '.json')) or f.endswith('.min.js'):
                continue
            p = os.path.join(root, f)
            s = open(p, encoding='utf-8').read()
            t = rewrite_links(s, True) if f.endswith('.js') else s
            if f.endswith('.js'):
                for old, new in SHARE_MARKS:
                    t = t.replace(old, new)
            if folder in ('4000goals', '25000runs', '60000runs', '650goals', '100000points') and f.endswith('.js'):
                key = KEEP_KEY.get(folder, folder)  # 650 GOALS keeps 500 GOALS' saved data (17 Oct 2026)
                t = t.replace("'1000tries_", "'" + key + "_")  # its own saved data here (sound, draft, played...)
                t = t.replace("'1000_daily_'", "'" + key + "_daily_'")  # and its own Daily goes (1000TRIES keeps '1000_daily_')
            if t != s:
                open(p, 'w', encoding='utf-8').write(t)


# On CAST Games every game logo drops its "created by cast" line (the owner, 15 Oct 2026: the whole site is CAST's). The
# line is cleared rather than cut off, so each picture keeps its size and every page lays out as before
LOGOS = ['assets/img/27-0-logo.png', 'assets/img/1000tries-logo.png', 'assets/img/4000goals-logo.png',
         'assets/logos/27-0.png', 'assets/logos/1000tries.png', 'assets/logos/4000goals.png', 'assets/logos/25000runs.png', 'assets/logos/60000runs.png', 'assets/logos/g1winner.png', 'assets/logos/777tds.png', 'assets/logos/650goals.png', 'assets/logos/100000points.png', 'assets/logos/sc.png', 'assets/logos/scpointsking.png']


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


def registry():
    """The cards (shared/cg.js GAMES): every mode's page comes from this one list. Read with node, in a pretend page"""
    js = ("global.window = { addEventListener() {} }; global.location = { host: 'castgames.com.au' };"
          "global.document = { currentScript: null, body: null, addEventListener() {}, querySelector() { return null; }, documentElement: { style: { setProperty() {} }, classList: { add() {}, remove() {} } } };"
          "require(%s); process.stdout.write(JSON.stringify({ games: window.CG.GAMES, sports: window.CG.SPORTS }), () => process.exit(0));") % json.dumps(os.path.join(HERE, 'shared', 'cg.js'))
    out = subprocess.run(['node', '-e', js], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


SMALL = {'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'vs', 'with', 'at', 'by'}


def title_case(line):
    words = line.split(' ')
    return ' '.join(w if (i and w.lower() in SMALL) or not w[:1].isalpha() or w[1:2].isupper() else w[:1].upper() + w[1:] for i, w in enumerate(words))


def plain(s):
    """A card's name for a title or a meta tag: the ▲▼ entities as characters, no tags"""
    import html
    return html.unescape(re.sub(r'<[^>]+>', '', s)).replace('\u00a0', ' ')  # no-break spaces only hold card lines together


def page_meta(src, g):
    """A mode's page: its own title, description and share card text ("<NAME> | <line> | CAST Games")"""
    title = '%s | %s | CAST Games' % (plain(g['name']), title_case(plain(g['line'])))
    desc = plain(g.get('long') or g['line'])
    url = SITE + g['path']
    esc = lambda t: t.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')
    src = re.sub(r'<title>[^<]*</title>', lambda m: '<title>%s</title>' % esc(title), src, count=1)
    tags = [(r'<meta name="description" content="[^"]*">', '<meta name="description" content="%s">' % esc(desc)),
            (r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % url),
            (r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % url),
            (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(title)),
            (r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="%s">' % esc(desc)),
            (r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="%s">' % esc(title)),
            (r'<meta name="twitter:description" content="[^"]*">', '<meta name="twitter:description" content="%s">' % esc(desc))]
    for pat, rep in tags:
        src = re.sub(pat, lambda m: rep, src, count=1)
    # its own share picture and icons from the final logo set (17 Oct 2026): assets/og/<art>-og.png, assets/icons/<art>-*.png
    art = g.get('art')
    if art:
        og = SITE + 'assets/og/%s-og.png?v=%s' % (art, _ver('assets/og/%s-og.png' % art))  # a changed picture is fetched again
        src = re.sub(r'<meta property="og:image" content="[^"]*">', lambda m: '<meta property="og:image" content="%s">' % og, src, count=1)
        src = re.sub(r'<meta name="twitter:image" content="[^"]*">', lambda m: '<meta name="twitter:image" content="%s">' % og, src, count=1)
        src = re.sub(r'<meta property="og:image:width" content="[^"]*">', '<meta property="og:image:width" content="1200">', src)
        src = re.sub(r'<meta property="og:image:height" content="[^"]*">', '<meta property="og:image:height" content="630">', src)
        i192, i180 = 'assets/icons/%s-192.png' % art, 'assets/icons/%s-180.png' % art
        icons = ('<link rel="icon" type="image/png" sizes="192x192" href="/%s?v=%s">\n'
                 '<link rel="apple-touch-icon" sizes="180x180" href="/%s?v=%s">\n') % (i192, _ver(i192), i180, _ver(i180))
        src = re.sub(r'[ \t]*<link rel="(?:icon|apple-touch-icon)"[^>]*>\n?', '', src)
        src = re.sub(r'(<meta name="viewport"[^>]*>\n)', lambda m: m.group(1) + icons, src, count=1)
    return src


# Old addresses (17 Oct 2026: 700 TDS became 777 TDS and 500 GOALS became 650 GOALS; the over/unders became HIGHER OR
# LOWER games, and Free Hit and Follow On one cricket game): a tiny page that sends any old link on to the new one,
# keeping its query (?play=, a challenge, a private preview link) and its hash. old folder -> (new page, its name, an
# extra query for the new page or '')
OLD_PATHS = {'700tds': ('777tds', '777 TDS', ''), '500goals': ('650goals', '650 GOALS', ''),
             'six-again': ('higher-or-lower-nrl', 'HIGHER OR LOWER: NRL', ''), 'play-on': ('higher-or-lower-afl', 'HIGHER OR LOWER: AFL', ''),
             'free-hit': ('higher-or-lower-cricket', 'HIGHER OR LOWER: CRICKET', 'cat=bblruns'),
             'follow-on': ('higher-or-lower-cricket', 'HIGHER OR LOWER: CRICKET', 'cat=testruns'),
             'two-point': ('higher-or-lower-nfl', 'HIGHER OR LOWER: NFL', ''), 'photo-finish': ('higher-or-lower-racing', 'HIGHER OR LOWER: RACING', ''),
             'extra-time': ('higher-or-lower-premier-league', 'HIGHER OR LOWER: PREMIER LEAGUE', ''),
             # No EXACTLY modes on CAST Games (17 Oct 2026, the owner): their old pages open the game's main card
             '1000tries-exactly': ('1000tries', '1000TRIES', ''), '4000goals-exactly': ('4000goals', '4000 GOALS', ''),
             '25000runs-exactly': ('25000runs', '25000 RUNS', ''), '60000runs-exactly': ('60000runs', '60000 RUNS', ''),
             '777tds-exactly': ('777tds', '777 TDS', ''), 'g1winner-exactly': ('g1winner', 'G1 WINNER SPINNER', ''),
             '650goals-exactly': ('650goals', '650 GOALS', ''), '100000points-exactly': ('100000points', '100000 POINTS', '')}
KEEP_KEY = {'650goals': '500goals'}  # a renamed game keeps its saved data's old key
REDIRECT = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<meta name="robots" content="noindex"><title>%s | CAST Games</title><link rel="canonical" href="%s%s/%s">'
            '<script>(function () { var q = location.search, x = %s; if (x && !/[?&]cat=/.test(q)) q += (q ? "&" : "?") + x;'
            ' location.replace("../%s/%s" + q + location.hash); })();</script></head>'
            '<body style="margin:0;background:#0a0a0f;color:#fff;font-family:Inter,system-ui,sans-serif;text-align:center;padding:40px 16px">'
            '<p><a style="display:inline-block;padding:12px 20px;border-radius:999px;background:%s;color:%s;font-weight:800;text-decoration:none" href="../%s/%s">Play %s</a></p>'
            '</body></html>\n')


def old_paths(reg):
    sports = dict((x['id'], x) for x in reg['sports'])
    by_path = dict((g['path'].rstrip('/'), g) for g in reg['games'] if g.get('path'))
    for old, (new, name, extra) in OLD_PATHS.items():
        out = os.path.join(HERE, old)
        if os.path.isdir(out):
            shutil.rmtree(out)
        os.makedirs(out)
        sp = sports.get((by_path.get(new) or {}).get('sport'), {})
        bg, ink = sp.get('hex', '#ffffff'), sp.get('ink', '#0a0a0f')
        pages = [f for f in sorted(os.listdir(os.path.join(HERE, new))) if f.endswith('.html') and f != '404.html']
        # the old game folders' other pages (How It Works, Terms, Privacy) at their old addresses too
        for f in pages:
            page = '' if f == 'index.html' else f[:-5]
            open(os.path.join(out, f), 'w', encoding='utf-8').write(REDIRECT % (name, SITE, new, page, json.dumps(extra if f == 'index.html' else ''), new, page, bg, ink, new, page, name))
        print('built', old, '->', new)


def mode_pages(reg):
    """Each mode's own page (every card that isn't its game's folder page): the folder's page with <base>, its own id
    (window.CG_GAME), mode (window.CG_MODE) and title"""
    folders = dict((x[0], x[2]) for x in GAMES)
    for g in reg['games']:
        if g.get('status') != 'live' or not g.get('folder') or not g.get('path') or g['path'] == g['folder'] + '/':
            continue
        slug = g['path'].rstrip('/')
        out = os.path.join(HERE, slug)
        if os.path.isdir(out):
            shutil.rmtree(out)
        os.makedirs(out)
        src = open(os.path.join(HERE, g['folder'], 'index.html'), encoding='utf-8').read()
        n = src.count("window.CG_GAME = '%s'" % folders[g['folder']]) + src.count('window.CG_MODE = ')
        if n != 2:
            raise SystemExit('%s: the folder page has no single CG_GAME and CG_MODE to replace' % slug)
        src = src.replace("window.CG_GAME = '%s'" % folders[g['folder']], "window.CG_GAME = '%s'" % g['id'], 1)
        src = re.sub(r"window\.CG_MODE = '[a-z]+'", "window.CG_MODE = '%s'" % g['mode'], src, count=1)
        src = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + '\n<base href="../%s/">' % g['folder'], src, count=1)
        src = page_meta(src, g)
        open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(src)
        print('built', slug, '(%s %s)' % (g['folder'], g['mode']))


SHARED_FROM = '1000tries'  # the master copy of the shared account code (1000TRIES Game/shared/cast-account)


def strip_games():
    """The comments out of every copied game's scripts and styles (speed pass, 18 Oct 2026: about a quarter of a game's
    code download; tools/strip/strip.cjs, which keeps every line where it was and leaves a file alone unless its code is
    exactly the same without them). The games' own repos keep every comment. Without node it leaves them in"""
    files = []
    for folder, _, _, _, _ in GAMES:
        d = os.path.join(HERE, folder)
        for root, dirs, fs in os.walk(d):
            dirs[:] = [x for x in dirs if x not in ('shared', 'node_modules') and not x.startswith('.')]
            files += [os.path.join(root, f) for f in fs if f.endswith(('.js', '.css')) and not f.endswith(('.min.js', '.min.css'))]
    try:
        for i in range(0, len(files), 200):
            out = subprocess.run(['node', os.path.join(HERE, 'tools', 'strip', 'strip.cjs')] + files[i:i + 200], check=True, capture_output=True, text=True).stdout
            print(out.strip())
    except Exception as e:
        print('strip: comments kept (%s)' % e)


def speed_pages():
    """Two speed fixes on every game page (speed pass, 18 Oct 2026):
    - its CSP meta tag put in by a script (csp_by_script), so the browser fetches the page's files ahead again;
    - one copy of the shared files for the whole site. Every game folder carries the same account code (js/cast-account.js
      is 1.3 MB, css/cast-account.css 450 KB, plus the contact form, prices, flags...) and each page loaded its own folder's
      copy, so the home and every game a phone opened downloaded it all again. A game page's js/ or css/ file that is byte
      for byte 1000TRIES's copy now loads 1000TRIES's (/1000tries/js/...), any other keeps its own. Each ?v= is the built
      file's own content version, so a changed file is always fetched new (some pages carried one from before the build's
      own changes to the file)"""
    folders = set(x[0] for x in GAMES)
    # js/x.js, or (built before) /1000tries/js/x.js or /<game>/js/x.js
    pat = re.compile(r'((?:src|href)=")(?:/[\w.-]+/)?((?:js|css)/[\w.-]+\.(?:js|css))(?:\?v=[\w.]*)?(")')
    vers = {}

    def ver(rel):
        if rel not in vers:
            vers[rel] = _ver(rel)
        return vers[rel]

    sames = {}

    def same(a, b):
        if (a, b) not in sames:
            sames[(a, b)] = ver(a) == ver(b) and open(os.path.join(HERE, a), 'rb').read() == open(os.path.join(HERE, b), 'rb').read()
        return sames[(a, b)]
    n = 0
    for top in sorted(os.listdir(HERE)):
        d = os.path.join(HERE, top)
        if top.startswith('.') or not os.path.isdir(d) or top in ('tools', 'shared', 'assets', 'js', 'css', '__'):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith('.html'):
                continue
            p = os.path.join(d, f)
            s = open(p, encoding='utf-8').read()
            b = re.search(r'<base href="\.\./([\w.-]+)/">', s)
            folder = b.group(1) if b else top
            if folder not in folders or f == '404.html':  # (a 404 page keeps its addresses from the site's root)
                t = with_imgfb(csp_by_script(s))
                if t != s:
                    open(p, 'w', encoding='utf-8').write(t)
                continue

            def rep(m):
                rel, common = folder + '/' + m.group(2), SHARED_FROM + '/' + m.group(2)
                if not os.path.isfile(os.path.join(HERE, rel)):
                    return m.group(0)
                if os.path.isfile(os.path.join(HERE, common)) and same(rel, common):
                    return '%s/%s?v=%s%s' % (m.group(1), common, ver(common), m.group(3))
                return '%s%s?v=%s%s' % (m.group(1), m.group(2), ver(rel), m.group(3))
            t = ou_ahead(with_imgfb(csp_by_script(lazy_hidden(pat.sub(rep, s)))), folder)
            if t != s:
                open(p, 'w', encoding='utf-8').write(t)
                n += 1
    print('speed: %d pages' % n)
    speed_script()


def speed_script():
    """shared/cg-speed.js (speed pass, 18 Oct 2026): its list of each game's files (FILES: the game page's own styles and
    scripts, as the page names them, and its players file), then its own tag on every game page, after shared/cg.js"""
    files = {}
    for folder, _, _, _, _ in GAMES:
        idx = os.path.join(HERE, folder, 'index.html')
        if not os.path.exists(idx):
            continue
        page = open(idx, encoding='utf-8').read()
        out = []
        for m in re.finditer(r'<(?:script[^>]*\ssrc|link[^>]*rel="stylesheet"[^>]*\shref)="([^"]+)"', page):
            u = m.group(1)
            if re.match(r'(?:https?:)?//|\.\./shared/|/shared/|data:', u):
                continue
            out.append(u if u.startswith('/') else '/%s/%s' % (folder, u))
        if os.path.exists(os.path.join(HERE, folder, 'data', 'players.json')):
            out.append('/%s/data/players.json' % folder)
        files[folder] = out
    p = os.path.join(HERE, 'shared', 'cg-speed.js')
    s = open(p, encoding='utf-8').read()
    t = re.sub(r'var FILES = .*?; // CG_FILES', lambda m: 'var FILES = %s; // CG_FILES' % json.dumps(files, separators=(',', ':')), s, count=1, flags=re.S)
    if t != s:
        open(p, 'w', encoding='utf-8').write(t)
    tag = '<script src="/shared/cg-speed.js?v=%s" defer></script>' % _ver('shared/cg-speed.js')
    for top in sorted(os.listdir(HERE)):
        d = os.path.join(HERE, top)
        if top.startswith('.') or not os.path.isdir(d) or top in ('tools', 'shared', 'assets', 'js', 'css', '__'):
            continue
        for f in os.listdir(d):
            if not f.endswith('.html'):
                continue
            q = os.path.join(d, f)
            h = open(q, encoding='utf-8').read()
            h2 = re.sub(r'<script src="/shared/cg-speed\.js[^"]*" defer></script>\n?', '', h)
            h2 = re.sub(r'(<script src="(?:\.\./|/)shared/cg\.js\?v=\w+"></script>\n)', lambda m: m.group(1) + tag + '\n', h2, count=1)
            if h2 != h:
                open(q, 'w', encoding='utf-8').write(h2)


REG = None


def main():
    global REG
    REG = registry()
    # (the home page's own logos are the final set since 17 Oct 2026, with no byline: only the games' own copies are cleared)
    for folder, src, gid, hide, play in GAMES:
        if ONLY and folder not in ONLY:
            continue
        main_card = [g for g in REG['games'] if g.get('path') == folder + '/']
        if len(main_card) != 1:
            raise SystemExit('%s: shared/cg.js has no single card for its folder page' % folder)
        dst = copy_game(folder, src)
        fit_code(dst, folder)
        for rel in LOGOS:
            if os.path.exists(os.path.join(dst, rel)):
                clear_byline(os.path.join(dst, rel))
        for f in os.listdir(dst):
            if f.endswith('.html'):
                fit_page(os.path.join(dst, f), folder, gid, hide, play, card=main_card[0] if f == 'index.html' else None)
        print('built', folder)
    if ONLY:
        # The game folders not copied again keep their pages: only their links to the bar's files take its new version
        for folder, src, gid, hide, play in GAMES:
            if folder in ONLY:
                continue
            for root, _, files in os.walk(os.path.join(HERE, folder)):
                for f in files:
                    if f.endswith('.html'):
                        p = os.path.join(root, f)
                        t = open(p, encoding='utf-8').read()
                        t2 = re.sub(r'(shared/cg\.(?:js|css))\?v=\w+', lambda m: m.group(1) + '?v=' + CGV, t)
                        if t2 != t:
                            open(p, 'w', encoding='utf-8').write(t2)
    # Every other mode's own page, then the old addresses (17 Oct 2026, the owner: every mode is its own game)
    mode_pages(REG)
    old_paths(REG)
    sign_in_pages()  # /__/auth/ at the root, for same-tab sign-in on phones
    strip_games()  # (speed pass, 18 Oct 2026) before the pages take each file's version
    speed_pages()  # every page: files fetched ahead again (csp_by_script) and one copy of the shared account files (speed pass, 18 Oct 2026)
    # Files the account code loads next to the page (assets/...): the home and sport pages need their own copy
    for rel in ['assets/cast-pass-logo.png']:
        shutil.copyfile(os.path.join(HERE, '1000tries', rel), os.path.join(HERE, rel))
    # The home page's files from the games' folders (the account, Daily calendars, flags) carry a version from their own
    # contents, so a change reaches everyone at once instead of an old copy kept by the browser (15 Oct 2026)
    idx = os.path.join(HERE, 'index.html')
    hs = open(idx, encoding='utf-8').read()
    hs2 = re.sub(r'((?:1000tries|4000goals|27-0|25000runs|60000runs|777tds|g1winner|650goals|scpointsking-afl|scpointsking|100000points)/(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=[\w]*)?"', lambda m: m.group(1) + '?v=' + _ver(m.group(1)) + '"', hs)
    # and the bar's own files (17 Oct 2026: the home page kept an old cg.css, so a fix never reached it)
    hs2 = re.sub(r'shared/cg\.(css|js)\?v=[\w]*"', lambda m: 'shared/cg.%s?v=%s"' % (m.group(1), CGV), hs2)
    hs2 = re.sub(r'shared/cg-speed\.js\?v=\w*"', lambda m: 'shared/cg-speed.js?v=%s"' % _ver('shared/cg-speed.js'), hs2)  # (speed pass, 18 Oct 2026)
    # and the home page's own script and styles (17 Oct 2026: they had fixed numbers, so changes waited in old copies)
    hs2 = re.sub(r'((?:js/home\.js|css/home\.css|css/hero-banners\.css))\?v=[\w]*"', lambda m: m.group(1) + '?v=' + _ver(m.group(1)) + '"', hs2)
    # and the How CAST Games Works tour's two files, which the page's hook loads on the first tap of The Sports banner
    hs2 = re.sub(r"((?:shared/cg-tour\.js|css/cg-tour\.css))\?v=\w*(?=['\"])", lambda m: m.group(1) + '?v=' + _ver(m.group(1)), hs2)
    hs2 = with_imgfb(csp_by_script(hs2))  # and the pictures script, before the sport pages are made from it; its CSP by script (csp_by_script)
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
    s = re.sub(r'<script src="/shared/cg-gate\.js[^"]*"></script><!-- CG_GATE -->\n?', '', csp_by_script(open(nf, encoding='utf-8').read()))
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
        # every channel compared (18 Oct 2026: getbbox() on an RGBA difference looks at the alpha alone, so a recoloured
        # icon or a new share picture with the same shape was put back to the old one)
        if a.size == b.size and a.tobytes() == b.tobytes():
            subprocess.run(['git', '-C', HERE, 'checkout', '--', rel])


if __name__ == '__main__':
    main()
    keep_same_pictures()

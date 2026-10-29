"""Google Fonts subsets (OFL) for every character on screen → fonts/*.woff2 + fonts/fonts.css. Run again after changing any text."""
import re, os, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'story.js'), encoding='utf-8').read() + open(os.path.join(HERE, 'main.js'), encoding='utf-8').read()
chars = ''.join(sorted(set(re.sub(r'\s', '', ''.join(re.findall(r"'([^']*)'", src)))))) + '0123456789.,·→'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'}
css_out = []
for fam, wt, fn in [('Gothic A1', 700, 'gothic700'), ('Black Han Sans', 400, 'blackhan')]:
    url = 'https://fonts.googleapis.com/css2?family=' + urllib.parse.quote(fam) + f':wght@{wt}&text=' + urllib.parse.quote(chars)
    css = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read().decode()
    furl = re.search(r'url\((https://[^)]+)\)', css).group(1)
    open(os.path.join(HERE, 'fonts', fn + '.woff2'), 'wb').write(urllib.request.urlopen(urllib.request.Request(furl, headers=UA)).read())
    css_out.append(f"@font-face{{font-family:'{fam}';font-weight:{wt};src:url({fn}.woff2) format('woff2')}}")
open(os.path.join(HERE, 'fonts', 'fonts.css'), 'w').write('\n'.join(css_out) + '\n')
print(len(chars), 'chars')

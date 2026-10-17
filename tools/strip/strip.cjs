// Comments out of the built games' scripts and styles, for CAST Games only (speed pass, 18 Oct 2026). The games' own
// repos keep every comment; the copies tools/build.py makes here lose them, which is about a quarter of what a phone
// downloads for a game's code (cast-account.js alone: 360 KB to 280 KB gzipped).
//
// Scripts: acorn (./acorn.js, MIT, see ./LICENSE) finds each comment exactly, and each becomes the same number of line
// breaks (or a space), so every line keeps its number (an error report still points at the same line in the game's
// repo). The result must give exactly the same tokens on exactly the same lines as the original, or the file is left
// as it was. Styles: comments removed outside strings (in CSS a comment is not even a space). "/*!" comments stay.
//   node strip.cjs <file>...   prints how many files changed and the bytes saved
'use strict';
const fs = require('fs');
const acorn = require('./acorn.js');

const OPTS = { ecmaVersion: 'latest', allowHashBang: true, allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, locations: true };

function tokens(src, sourceType) {
  const out = [];
  for (const t of acorn.tokenizer(src, Object.assign({ sourceType }, OPTS))) out.push(t.type.label + '\u0000' + (t.value === undefined ? '' : String(t.value)) + '\u0000' + t.loc.start.line);
  return out;
}
function stripJs(src) {
  for (const sourceType of ['script', 'module']) {
    const cs = [];
    try { acorn.parse(src, Object.assign({ sourceType, onComment: (block, text, start, end) => cs.push([start, end, block, text]) }, OPTS)); } catch (e) { continue; }
    if (!cs.length) return src;
    let out = '', at = 0;
    for (const [s, e, block, text] of cs) {
      out += src.slice(at, s);
      if (block && text.charAt(0) === '!') out += src.slice(s, e); // a licence note
      else if (block) out += (text.match(/\r\n|\r|\n|\u2028|\u2029/g) || []).map(() => '\n').join('') || ' ';
      at = e;
    }
    out += src.slice(at);
    try {
      const a = tokens(src, sourceType), b = tokens(out, sourceType);
      if (a.length !== b.length || a.some((x, i) => x !== b[i])) return src;
    } catch (e) { return src; }
    return out;
  }
  return src;
}
function stripCss(src) {
  let out = '', i = 0, q = '';
  while (i < src.length) {
    const c = src[i];
    if (q) { out += c; if (c === '\\') { out += src[i + 1] || ''; i += 2; continue; } if (c === q) q = ''; i++; continue; }
    if (c === '"' || c === "'") { q = c; out += c; i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      if (e < 0) return src; // an unclosed comment: leave the file alone
      if (src[i + 2] === '!') out += src.slice(i, e + 2);
      i = e + 2;
      continue;
    }
    out += c; i++;
  }
  return q ? src : out;
}

let n = 0, saved = 0;
for (const f of process.argv.slice(2)) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  const out = f.endsWith('.css') ? stripCss(src) : f.endsWith('.js') ? stripJs(src) : src;
  if (out !== src) { fs.writeFileSync(f, out); n++; saved += src.length - out.length; }
}
console.log('strip: ' + n + ' files, ' + Math.round(saved / 1024) + ' KB of comments');

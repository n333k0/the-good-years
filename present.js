/* The Good Years — Round 5 presentation: Tabloid, Angel, Dial-up (16 options each).
   Rules this file enforces:
   - every mark is SVG in currentColor, fitted to its ink;
   - anything inside a box / ring / screen is centred on measured ink (canvas metrics), with equal padding;
   - mockups map the logo onto the real surface in the photo (perspective quad), then print / light / grain it.
   Keep / reject votes are stored in this browser. */
(function () {
  'use strict';
  let UID = 0; const uid = (p) => p + (++UID);
  const f1 = (n) => Math.round(n * 10) / 10;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const BN = 'Anton', BOD = 'Bodoni Moda', TNR = "'Times New Roman', Times, serif", VER = 'Verdana, Geneva, sans-serif',
    TAH = 'Tahoma, Verdana, sans-serif', CN = "'Courier New', Courier, monospace", HN = "'Helvetica Neue', Helvetica, Arial, sans-serif",
    SCR = 'Mrs Saint Delafield', VT = 'VT';

  /* ---------- primitives ---------- */
  const T = (t, font, size, extra = '') => '<text font-family="' + font + '" font-size="' + size + '" fill="currentColor" ' + extra + '>' + esc(t) + '</text>';
  const M = (id, inner) => '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/>' + inner.replace(/currentColor/g, '#000') + '</mask>';
  const R = (x, y, w, h, extra = '') => '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" ' + (extra || 'fill="currentColor"') + '/>';
  const cursor = (x, y, s) => '<path transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + s + ')" d="M0,0 V16 L4,12.4 L6.6,18.6 L9,17.6 L6.4,11.6 H11.6 Z" fill="currentColor"/>';
  const burst = (cx, cy, r1, r2, n) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? r2 : r1; p.push(f1(cx + Math.cos(a) * r) + ',' + f1(cy + Math.sin(a) * r)); } return p.join(' '); };

  // ink metrics from the real font (fonts must be loaded first)
  const CTX = document.createElement('canvas').getContext('2d');
  const famCss = (f) => (f.includes(',') || f.includes("'") || f.includes('"')) ? f : '"' + f + '"';
  // measure the real ink by drawing the text and scanning its pixels (exact for italics and letter-spacing)
  const INK = {}, MS = 120;
  function ink(t, fam, size, w = 400, st = 'normal', ls = 0) {
    const key = [t, fam, w, st, ls / size].join('|'), k = size / MS;
    if (!INK[key]) {
      const pad = MS * 1.2, cv = document.createElement('canvas');
      cv.width = Math.ceil(t.length * MS * 1.3 + pad * 2); cv.height = Math.ceil(MS * 3);
      const x = cv.getContext('2d', { willReadFrequently: true });
      x.font = st + ' ' + w + ' ' + MS + 'px ' + famCss(fam);
      try { x.letterSpacing = (ls / k) + 'px'; } catch (e) {}
      x.fillStyle = '#000'; x.textBaseline = 'alphabetic'; x.fillText(t, pad, MS * 2);
      const d = x.getImageData(0, 0, cv.width, cv.height).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let yy = 0; yy < cv.height; yy++) for (let xx = 0; xx < cv.width; xx++) if (d[(yy * cv.width + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      INK[key] = x1 < 0 ? { L: 0, R: 0, A: 0, D: 0 } : { L: pad - x0, R: x1 + 1 - pad, A: MS * 2 - y0, D: y1 + 1 - MS * 2 };
    }
    const m = INK[key]; return { L: m.L * k, R: m.R * k, A: m.A * k, D: m.D * k };
  }
  // text placed so its INK is centred on (cx, cy), or left-aligned at lx / top-aligned at top; returns svg + ink box
  function ct(t, fam, size, o = {}) {
    const w = o.w || 400, st = o.st || 'normal', ls = o.ls || 0, m = ink(t, fam, size, w, st, ls);
    const x = o.lx != null ? o.lx + m.L : (o.cx || 0) - (m.R - m.L) / 2;
    const y = o.top != null ? o.top + m.A : (o.cy || 0) + (m.A - m.D) / 2;
    const svg = '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="' + fam + '" font-size="' + size + '" font-weight="' + w + '" font-style="' + st + '"' + (ls ? ' letter-spacing="' + ls + '"' : '') + ' fill="currentColor">' + esc(t) + '</text>';
    return { svg, l: x - m.L, r: x + m.R, t: y - m.A, b: y + m.D, x, y, w: m.L + m.R, h: m.A + m.D };
  }
  // vertical stack of lines, each centred (or left-aligned) on its ink, with ink-to-ink gaps
  function stack(lines, align = 'center') {
    let y = 0, out = '';
    lines.forEach((ln) => {
      if (ln.rule) { out += R(align === 'center' ? -ln.rule / 2 : 0, y, ln.rule, ln.h || 2); y += (ln.h || 2) + (ln.g != null ? ln.g : 20); return; }
      const c = ct(ln.t, ln.f, ln.s, Object.assign({}, ln, { top: y }, align === 'center' ? { cx: 0 } : { lx: 0 }));
      out += c.svg; if (ln.ul) out += R(c.l, c.b + ln.ul, c.w, ln.uh || 10);
      y = c.b + (ln.ul ? ln.ul + (ln.uh || 10) : 0) + (ln.g != null ? ln.g : 20);
    });
    return out;
  }
  // pixel art (rows of 'X') with merged runs, crisp edges
  function bits(rows, x0, y0, s) {
    let out = '<g shape-rendering="crispEdges">';
    rows.forEach((r, y) => { let x = 0; while (x < r.length) { if (r[x] === 'X') { let e = x; while (e < r.length && r[e] === 'X') e++; out += R(x0 + x * s, y0 + y * s, (e - x) * s + 0.4, s + 0.4); x = e; } else x++; } });
    return out + '</g>';
  }
  const ARROW = ['X', 'XX', 'X.X', 'X..X', 'X...X', 'X....X', 'X.....X', 'X......X', 'X.......X', 'X........X', 'X.....XXXXX', 'X..X..X', 'X.X.X..X', 'XX..X..X', 'X....X..X', '.....X..X', '......X..X', '......X..X', '.......XX'];
  const HAND = ['.....XX', '....X..X', '....X..X', '....X..X', '....X..XXX', '....X..X..XXX', '....X..X..X..XX', '.XX.X..X..X..X.X', 'X..XX........X.X', 'X...X..........X', '.X.............X', '..X............X', '..X...........X', '...X..........X', '...X.........X', '....X........X', '....X........X', '....XXXXXXXXXX'];
  const HEART = ['.XXX...XXX.', 'XXXXX.XXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXXXXX..', '...XXXXX...', '....XXX....', '.....X.....'];
  // content to be centred inside a shell is wrapped in <g class="c"> (the alignment test hides it)
  const C = (s) => '<g class="c">' + s + '</g>';
  // centre a group of parts (text box + extras) at 0,0 inside a square shell with equal padding
  function inSquare(parts, box, pad, stroke) {
    const dx = -(box.l + box.r) / 2, dy = -(box.t + box.b) / 2, half = Math.max(box.r - box.l, box.b - box.t) / 2 + pad;
    return R(-half, -half, 2 * half, 2 * half, 'class="sh" fill="none" stroke="currentColor" stroke-width="' + stroke + '"') + C('<g transform="translate(' + f1(dx) + ' ' + f1(dy) + ')">' + parts + '</g>');
  }

  /* ---------- the three routes, 16 options each ---------- */
  const ROUTES = [
    { id: 'TB', name: 'Tabloid', n: '01', open: 'TB1', concept: 'TB1',
      stage: (t) => T(t.toUpperCase(), BN, 200),
      desc: 'A magazine masthead from the paparazzi years. Tall, tight and loud, built to sit across the top of a flash photo the way the covers did.',
      cap: '<b>The Good Years</b> as a cover line. “The” turns on its side and sits in the margin, the rest fills the width.',
      opts: [
        ['Masthead', () => T('GOOD YEARS', BN, 220, 'x="74" y="0"') + T('THE', BN, 70, 'transform="translate(58 0) rotate(-90)"')],
        ['Cover stack', () => stack([{ t: 'THE', f: HN, s: 30, w: 700, ls: 14, g: 26 }, { t: 'GOOD', f: BN, s: 270, g: 14 }, { t: 'YEARS', f: BN, s: 270, g: 28 }, { t: 'ISSUE 01', f: HN, s: 22, w: 700, ls: 10 }])],
        ['Starburst', () => { const g = ct('GOOD YEARS', BN, 220, { lx: 60, cy: 0 }); const cy = g.t - 6; const th = ct('THE', BN, 56, { cx: 20, cy }); const r = Math.max(th.w, th.h) / 2 + 26; const id = uid('m'); return g.svg + M(id, '<g transform="rotate(-12 20 ' + f1(cy) + ')">' + th.svg + '</g>') + '<polygon class="sh" points="' + burst(20, cy, r * 1.28, r, 18) + '" fill="currentColor" mask="url(#' + id + ')"/>'; }],
        ['Solid / outline', () => T('GOOD', BN, 230, 'y="0"') + T('YEARS', BN, 230, 'y="196" fill="none" stroke="currentColor" stroke-width="4"')],
        ['Headline bar', () => { const c = ct('THE GOOD YEARS', BN, 150, { cx: 0, cy: 0 }), p = 26, id = uid('m'); return M(id, c.svg) + R(c.l - p, c.t - p, c.w + 2 * p, c.h + 2 * p, 'class="sh" fill="currentColor" mask="url(#' + id + ')"') + R(c.l - p - 14, c.t - p - 14, c.w + 2 * p + 28, c.h + 2 * p + 28, 'class="sh" fill="none" stroke="currentColor" stroke-width="3"'); }],
        ['Masthead rules', () => R(0, -212, 1100, 3) + T('THE GOOD YEARS', 'Six Caps', 200, 'y="-6" letter-spacing="16" textLength="1100" lengthAdjust="spacing"') + R(0, 16, 1100, 3) + T('RASA PRESENTS', HN, 20, 'y="52" font-weight="700" letter-spacing="8"') + T('A NOSTALGIA FESTIVAL', HN, 20, 'x="1100" y="52" text-anchor="end" font-weight="700" letter-spacing="8"')],
        ['Tight stack', () => stack([{ t: 'THE GOOD', f: BN, s: 200, g: 16 }, { t: 'YEARS', f: BN, s: 200, ul: 18, uh: 12 }], 'left')],
        ['TGY block', () => { const c = ct('TGY', BN, 300, { cx: 0, cy: 0 }), p = 40, id = uid('m'); return M(id, c.svg) + R(c.l - p, c.t - p, c.w + 2 * p, c.h + 2 * p, 'class="sh" fill="currentColor" mask="url(#' + id + ')"'); }],
        ['Underlined', () => stack([{ t: 'THE GOOD', f: BN, s: 190, ul: 14, uh: 12, g: 26 }, { t: 'YEARS', f: BN, s: 190, ul: 14, uh: 12 }], 'left')],
        ['Corners', () => { const W = 1100, H = 560, p = 34; const a = ct('THE GOOD', BN, 170, { lx: p, top: p }); const b0 = ct('YEARS', BN, 170, { lx: 0, top: 0 }); const b = ct('YEARS', BN, 170, { lx: W - p - b0.w, top: H - p - b0.h }); return R(0, 0, W, H, 'fill="none" stroke="currentColor" stroke-width="4"') + a.svg + b.svg; }],
        ['Tall', () => '<g transform="scale(1 1.75)">' + T('THE GOOD YEARS', BN, 150, 'letter-spacing="-1"') + '</g>'],
        ['Sticker', () => { const g = ct('GOOD YEARS', BN, 220, { lx: 70, cy: 0 }); const cy = g.t + 4; const th = ct('THE', BN, 50, { cx: 30, cy }); const r = Math.max(th.w, th.h) / 2 + 22; const id = uid('m'); return g.svg + M(id, th.svg) + '<circle class="sh" cx="30" cy="' + f1(cy) + '" r="' + f1(r) + '" fill="currentColor" mask="url(#' + id + ')"/>'; }],
        ['Lowercase', () => T('the good years', BN, 220, 'letter-spacing="-4"')],
        ['Word boxes', () => { let x = 0, out = ''; ['THE', 'GOOD', 'YEARS'].forEach((wd) => { const p = 18, id = uid('m'); const c = ct(wd, BN, 160, { lx: x + p, top: 0 }); out += M(id, c.svg) + R(x, -p, c.w + 2 * p, c.h + 2 * p, 'fill="currentColor" mask="url(#' + id + ')"'); x += c.w + 2 * p + 14; }); return out; }],
        ['Ticker', () => { const line = 'THE GOOD YEARS · RASA PRESENTS · THE GOOD YEARS · RASA PRESENTS · '; return T(line, HN, 18, 'y="-196" font-weight="700" letter-spacing="4" textLength="1060" lengthAdjust="spacing"') + R(0, -184, 1060, 3) + T('THE GOOD YEARS', BN, 170, 'y="-6" textLength="1060" lengthAdjust="spacing"') + R(0, 14, 1060, 3) + T(line, HN, 18, 'y="44" font-weight="700" letter-spacing="4" textLength="1060" lengthAdjust="spacing"'); }],
        ['TGY sticker', () => { const c = ct('TGY', BN, 170, { cx: 0, cy: 0 }); return '<circle class="sh" r="' + f1(Math.hypot(c.w, c.h) / 2 + 26) + '" fill="none" stroke="currentColor" stroke-width="8"/>' + C(c.svg); }],
      ] },
    { id: 'AN', name: 'Angel', n: '02', open: 'AN1', concept: 'AN4',
      stage: (t) => T(t, BOD, 170, 'font-style="italic" font-weight="800" letter-spacing="-4"'),
      desc: 'A fashion-house signature: razor-thin hairlines and heavy strokes in one italic, the way lingerie and perfume ads were lettered. The quietest route, and the most expensive-looking.',
      cap: '<b>The Good Years</b> set like a perfume label: a whisper of capitals over a heavy italic, nothing else.',
      opts: [
        ['Signature', () => T('THE', BOD, 34, 'x="0" y="-58" font-weight="500" letter-spacing="22"') + T('Good Years', BOD, 190, 'x="150" y="0" font-style="italic" font-weight="800" letter-spacing="-6"')],
        ['Couture caps', () => T('THE GOOD YEARS', BOD, 130, 'font-weight="500" letter-spacing="20"')],
        ['Whisper', () => T('the good years', BOD, 200, 'font-style="italic" font-weight="400" letter-spacing="-6"')],
        ['Perfume label', () => stack([{ t: 'THE', f: BOD, s: 30, w: 500, ls: 24, g: 30 }, { t: 'Good', f: BOD, s: 200, w: 800, st: 'italic', g: 20 }, { t: 'Years', f: BOD, s: 200, w: 800, st: 'italic', g: 34 }, { rule: 120, h: 2 }])],
        ['Long swash', () => T('The Good Years', BOD, 180, 'font-style="italic" font-weight="700" letter-spacing="-4"') + '<path d="M820,40 C700,110 300,120 30,74" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'],
        ['Black italic', () => T('THE', BOD, 34, 'y="-150" font-style="italic" font-weight="700" letter-spacing="10"') + T('GOOD YEARS', BOD, 170, 'font-style="italic" font-weight="900" letter-spacing="-8"')],
        ['House monogram', () => stack([{ t: 'TGY', f: BOD, s: 300, w: 800, st: 'italic', ls: -60, g: 34 }, { t: 'THE GOOD YEARS', f: BOD, s: 26, w: 500, ls: 22 }])],
        ['TGY monogram', () => T('TGY', BOD, 300, 'font-style="italic" font-weight="800" letter-spacing="-60"')],
        ['Script + caps', () => { const c = ct('GOOD YEARS', BOD, 110, { lx: 0, top: 0, w: 500, ls: 18 }); return c.svg + ct('the', SCR, 150, { lx: -70, cy: c.t - 64 }).svg; }],
        ['Monogram ring', () => { const c = ct('TGY', BOD, 220, { cx: 0, cy: 0, w: 800, st: 'italic', ls: -44 }); return '<ellipse class="sh" rx="' + f1(c.w / 2 + 70) + '" ry="' + f1(c.h / 2 + 64) + '" fill="none" stroke="currentColor" stroke-width="3"/>' + C(c.svg); }],
        ['Heavy roman', () => T('THE GOOD YEARS', BOD, 140, 'font-weight="900" letter-spacing="-2"')],
        ['Framed', () => { const c = ct('Good Years', BOD, 170, { cx: 0, cy: 0, w: 800, st: 'italic', ls: -4 }), p = 64; return R(c.l - p, c.t - p, c.w + 2 * p, c.h + 2 * p, 'class="sh" fill="none" stroke="currentColor" stroke-width="2.5"') + C(c.svg); }],
        ['Stacked left', () => stack([{ t: 'THE', f: BOD, s: 32, w: 500, ls: 22, g: 26 }, { t: 'Good', f: BOD, s: 210, w: 800, st: 'italic', g: 16 }, { t: 'Years', f: BOD, s: 210, w: 800, st: 'italic' }], 'left')],
        ['Lowercase heavy', () => T('the good years', BOD, 190, 'font-style="italic" font-weight="900" letter-spacing="-8"')],
        ['Caps over italic', () => stack([{ t: 'THE GOOD', f: BOD, s: 42, w: 500, ls: 26, g: 26 }, { t: 'Years', f: BOD, s: 280, w: 800, st: 'italic' }])],
        ['TGY seal', () => { const c = ct('TGY', BOD, 150, { cx: 0, cy: 0, w: 800, st: 'italic', ls: -30 }); const r = Math.hypot(c.w, c.h) / 2 + 30; return '<circle class="sh" r="' + f1(r) + '" fill="none" stroke="currentColor" stroke-width="4"/><circle class="sh" r="' + f1(r - 14) + '" fill="none" stroke="currentColor" stroke-width="1.5"/>' + C(c.svg); }],
      ] },
    { id: 'DU', name: 'Dial-up', n: '03', open: 'DU1', concept: 'DU1',
      stage: (t) => { const c = ct(t, TNR, 150, { lx: 0, top: 0, w: 700 }); return c.svg + R(c.l, c.b + 16, c.w, 8); },
      desc: 'The name as a link you should not click at three in the morning. Default browser type, underlined, with the cursor already on it: late-night internet as a logo.',
      cap: '<b>The Good Years</b> in the browser’s own default type, underlined like a link, with the arrow already hovering.',
      opts: [
        ['Link + cursor', () => { const c = ct('The Good Years', TNR, 150, { lx: 0, top: 0, w: 700 }); return c.svg + R(c.l, c.b + 14, c.w, 8) + cursor(c.l + c.w * 0.74, c.b - 2, 6.2); }],
        ['Screen name', () => T('~*thegoodyears*~', VER, 120, 'font-weight="700" letter-spacing="-4"')],
        ['Window', () => { const W = 1000, H = 380, bar = 58, id = uid('m'), by = bar / 2; const title = ct('the_good_years.jpg', VER, 26, { lx: 20, cy: by, w: 700 }); const btn = '<g stroke="#000" stroke-width="4" fill="none"><path d="M846,' + (by + 8) + ' h22"/><rect x="890" y="' + (by - 11) + '" width="24" height="22"/><path d="M938,' + (by - 11) + ' l22,22 M960,' + (by - 11) + ' l-22,22"/></g>'; const body = ct('The Good Years', TNR, 132, { cx: W / 2, cy: bar + (H - bar) / 2, w: 700 }); return R(0, 0, W, H, 'class="sh" fill="none" stroke="currentColor" stroke-width="5"') + M(id, title.svg + btn) + R(0, 0, W, bar, 'fill="currentColor" mask="url(#' + id + ')"') + C(body.svg); }],
        ['Loading', () => { const c = ct('The Good Years', TNR, 140, { lx: 0, top: 0, w: 700 }); let s = c.svg + R(c.l, c.b + 30, c.w, 44, 'fill="none" stroke="currentColor" stroke-width="4"'); const n = 12, gap = 10, bw = (c.w - 20 - gap * (n - 1)) / n; for (let i = 0; i < 9; i++) s += R(c.l + 10 + i * (bw + gap), c.b + 40, bw, 24); return s + ct('connecting at 56k…', VT, 44, { lx: c.l, top: c.b + 96 }).svg; }],
        ['Search', () => { const h = 120, p = 34; const t = ct('the good years', VER, 64, { lx: p, cy: h / 2 }); const fw = t.r + p + 60; const id = uid('m'); const b = ct('Search', VER, 52, { cx: fw + 30 + 130, cy: h / 2, w: 700 }); return R(0, 0, fw, h, 'rx="6" fill="none" stroke="currentColor" stroke-width="5"') + t.svg + R(t.r + 14, 18, 5, h - 36) + M(id, b.svg) + R(fw + 30, 0, 260, h, 'rx="6" fill="currentColor" mask="url(#' + id + ')"'); }],
        ['Pixel', () => { const c = ct('THE GOOD YEARS', VT, 190, { lx: 0, top: 0, ls: 2 }); return c.svg + R(c.r + 18, c.t, 62, c.h); }],
        ['Linked stack', () => { const a = ct('The Good', TNR, 170, { lx: 0, top: 0, w: 700 }); const b = ct('Years', TNR, 170, { lx: 0, top: a.b + 54, w: 700 }); return a.svg + R(a.l, a.b + 16, a.w, 9) + b.svg + R(b.l, b.b + 16, b.w, 9) + cursor(b.r - 70, b.b + 4, 6.6); }],
        ['TGY icon', () => { const c = ct('TGY', TNR, 120, { lx: 0, top: 0, w: 700 }); const cx = c.r - 46, cy = c.b + 6, s = 5; const parts = c.svg + R(c.l, c.b + 12, c.w, 7) + cursor(cx, cy, s); return inSquare(parts, { l: c.l, r: Math.max(c.r, cx + 11.6 * s), t: c.t, b: cy + 18.6 * s }, 56, 6); }],
        ['Pixel cursor', () => { const c = ct('The Good Years', TNR, 150, { lx: 0, top: 0, w: 700 }); return c.svg + R(c.l, c.b + 14, c.w, 8) + bits(ARROW, c.l + c.w * 0.72, c.b - 6, 5.4); }],
        ['Hand', () => { const c = ct('The Good Years', TNR, 150, { lx: 0, top: 0, w: 700, st: 'italic' }); return c.svg + R(c.l, c.b + 14, c.w, 8) + bits(HAND, c.l + c.w * 0.66, c.b - 14, 5.6); }],
        ['Status bar', () => { const c = ct('The Good Years', TNR, 150, { lx: 0, top: 0, w: 700 }); const y = c.b + 64, h = 46; const d = ct('Done', TAH, 26, { lx: c.l + 16, cy: y + h / 2 }); return c.svg + R(c.l, c.b + 14, c.w, 8) + R(c.l, y, c.w, h, 'fill="none" stroke="currentColor" stroke-width="3"') + d.svg + R(c.r - 300, y, 3, h) + R(c.r - 150, y, 3, h); }],
        ['Dialog', () => { const body = ct('The Good Years', TNR, 120, { cx: 0, cy: 0, w: 700 }); const p = 60, bar = 50, W = body.w + 2 * p, okW = 200, okH = 64; const top = body.t - p - bar, bottom = body.b + p + okH + 40; const id = uid('m'); const ok = ct('OK', TAH, 30, { cx: 0, cy: body.b + p + okH / 2, w: 700 }); return R(-W / 2, top, W, bottom - top, 'class="sh" fill="none" stroke="currentColor" stroke-width="5"') + M(id, ct('connected', TAH, 24, { lx: -W / 2 + 18, cy: top + bar / 2, w: 700 }).svg) + R(-W / 2, top, W, bar, 'fill="currentColor" mask="url(#' + id + ')"') + C(body.svg) + R(-okW / 2, body.b + p, okW, okH, 'fill="none" stroke="currentColor" stroke-width="4"') + ok.svg; }],
        ['Lowercase link', () => { const c = ct('the good years', TNR, 160, { lx: 0, top: 0, w: 700 }); return c.svg + R(c.l, c.b + 14, c.w, 8) + bits(ARROW, c.l + c.w * 0.8, c.b - 4, 5.2); }],
        ['Typed', () => { const c = ct('THE GOOD YEARS', CN, 120, { lx: 0, top: 0, w: 700 }); return c.svg + R(c.r + 16, c.b - 14, 70, 14); }],
        ['Desktop icon', () => { const s = 22, hw = 11 * s, hh = 9 * s; const lab = ct('The Good Years', TAH, 64, { cx: 0, top: hh + 40 }); const p = 14; return bits(HEART, -hw / 2, 0, s) + C(lab.svg) + R(lab.l - p, lab.t - p, lab.w + 2 * p, lab.h + 2 * p, 'class="sh" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="6 6"'); }],
        ['TGY favicon', () => { const c = ct('TGY', TNR, 120, { lx: 0, top: 0, w: 700 }); const s = 4.6, ax = c.r - 40, ay = c.b - 6; return inSquare(c.svg + bits(ARROW, ax, ay, s), { l: c.l, r: Math.max(c.r, ax + 11 * s), t: c.t, b: ay + 19 * s }, 50, 10); }],
      ] },
  ];
  const R3 = [['D1', 'Ring tag'], ['D5', 'Swash tail'], ['F1', 'Signature'], ['F4', 'Runway'], ['G3', 'Gothic caps'], ['G4', 'Stacked crest'], ['B4', 'Solid over line'], ['A5', 'Stacked console']];

  /* ---------- lookup + fit ---------- */
  const find = (code) => { const r = ROUTES.find((x) => x.id === code.slice(0, 2)); return r && r.opts[+code.slice(2) - 1]; };
  const svgFor = (code) => { const o = find(code); return o ? '<svg class="mk" aria-label="' + esc(code + ' ' + o[0]) + '"><g class="ink">' + o[1]() + '</g></svg>' : ''; };
  function fit(svg, pad) {
    const g = svg.querySelector('.ink'); if (!g) return; let bb;
    try { bb = g.getBBox(); } catch (e) { return; }
    if (!bb.width) return;
    const p = Math.max(bb.width, bb.height) * (pad == null ? 0.04 : pad);
    svg.setAttribute('viewBox', [bb.x - p, bb.y - p, bb.width + 2 * p, bb.height + 2 * p].map(f1).join(' '));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  /* ---------- mockups: photo + surfaces mapped in perspective ---------- */
  // q = surface corners in image pixels (TL TR BR BL); fx = print | light | screen | etch
  const PH = {
    wall: ['g10', 1024, 688], maga: ['g21', 896, 1120], tick: ['g18', 896, 1120], glam: ['g15', 896, 1120], cd: ['g20', 1024, 1024],
    band: ['g17', 896, 1120], phone: ['g4', 896, 1120], tee: ['g19', 896, 1120], crt: ['g24', 896, 1120],
    case: ['g23', 896, 1120], card: ['g26', 896, 1120], tag: ['g28', 896, 1120], hat: ['g34', 896, 1120],
    board: ['g29', 1024, 688], stand: ['g38', 896, 1120], tote: ['g33', 896, 1120], shelter: ['g30', 896, 1120],
    hood: ['g35', 896, 1120], gloss: ['g36', 896, 1120], led: ['g31', 1024, 688], dvd: ['g53', 896, 1120], jewel: ['g37', 1024, 1024],
    held: ['g55', 896, 1120], tote2: ['g54', 896, 1120], shelter2: ['g56', 896, 1120], fish: ['g50', 896, 1120],
  };
  // designed artwork for a surface: a layout (cover, poster, pink, split, band, label, center, case) with a photo, the logo and small type
  const art = (s) => {
    const img = s.img ? '<img src="assets/gen/' + s.img + '.jpg" alt="">' : '';
    const ln = (x, y) => '<div class="ln"><span>' + x + '</span><span>' + y + '</span></div>';
    return '<div class="aw L-' + s.layout + '">' + img + '<div class="lg" data-logo="' + s.code + '"></div>' + (s.lines === false ? '' : ln(s.l1 || 'RASA presents', s.l2 || 'One night only')) + '</div>';
  };
  const frame = (key, surfaces, tag, fx = 0.5) => '<div class="frame" data-ph="' + key + '" data-x="' + fx + '"><img src="assets/gen/' + PH[key][0] + '.jpg" alt="" loading="lazy" style="object-position:' + (fx * 100) + '% 50%">' + surfaces.map((s) => s.layout
      ? '<div class="on art-on fx-' + (s.fx || 'print') + '" data-q="' + s.q.join(',') + '">' + art(s) + '</div>'
      : '<div class="on fx-' + (s.fx || 'print') + '" data-logo="' + s.code + '" data-q="' + s.q.join(',') + '" data-pad="' + (s.pad == null ? 0.08 : s.pad) + '"></div>').join('') + '<span class="tag">' + tag + '</span></div>';
  const rect = (x1, y1, x2, y2) => [x1, y1, x2, y1, x2, y2, x1, y2];
  const MOCK = {
    TB: [
      frame('wall', [[139, 186, 297, 436, { layout: 'pink', code: 'TB9' }], [303, 183, 467, 436, { layout: 'poster', img: 'g39', code: 'TB2' }], [473, 183, 639, 436, { layout: 'pink', code: 'TB9' }], [645, 181, 809, 437, { layout: 'poster', img: 'g43', code: 'TB2' }], [815, 181, 948, 439, { layout: 'pink', code: 'TB9' }]].map(([a, b, c, d, o]) => Object.assign({ q: rect(a, b, c, d) }, o)), 'Wheat-paste run'),
      frame('held', [{ layout: 'cover', img: 'g5', code: 'TB1', q: [174, 366, 738, 358, 734, 1008, 187, 1021], l1: 'Issue 01', l2: 'The paparazzi years' }], 'Magazine'),
      frame('tick', [{ layout: 'pink', code: 'TB1', q: [138, 403, 807, 393, 801, 700, 158, 707], l1: 'Admit one', l2: 'RASA presents' }], 'Ticket'),
    ],
    AN: [
      frame('glam', [{ code: 'AN1', q: rect(110, 930, 786, 1070), fx: 'light', pad: 0.02 }], 'Glamour Shots poster'),
      frame('cd', [{ layout: 'center', img: 'g40', code: 'AN4', q: [52, 425, 508, 423, 528, 897, 42, 931], lines: false }], 'Mix CD', 0.04),
      frame('band', [{ layout: 'fill', code: 'AN1', q: [348, 662, 630, 697, 622, 788, 343, 751], lines: false }], 'Wristband'),
    ],
    DU: [
      frame('crt', [{ code: 'DU1', q: [140, 265, 750, 265, 750, 725, 135, 725], fx: 'screen', pad: 0.16 }], 'CRT'),
      frame('phone', [{ code: 'DU16', q: [187, 210, 392, 205, 418, 418, 216, 454], fx: 'screen', pad: 0.12 }], 'Phone screen'),
      frame('tee', [{ code: 'DU15', q: rect(325, 478, 565, 585), pad: 0.04 }], 'Baby tee'),
    ],
  };
  const OBJECTS = [
    frame('case', [{ layout: 'case', img: 'g16', code: 'TB2', q: [61, 253, 558, 179, 758, 815, 192, 950] }], 'Game case'),
    frame('card', [{ layout: 'center', img: 'g1', code: 'TB16', q: [190, 330, 680, 296, 716, 664, 222, 712], lines: false }], 'Memory card'),
    frame('tag', [{ code: 'TB2', q: [302, 452, 514, 430, 560, 858, 346, 880], fx: 'etch', pad: 0.1 }], 'Dog tag'),
  ];
  const MERCH = [
    frame('hat', [{ code: 'TB1', q: [292, 112, 556, 98, 570, 246, 288, 258], pad: 0.08 }], 'Trucker hat'),
    frame('tote2', [{ code: 'TB2', q: [188, 432, 686, 430, 688, 991, 189, 990], pad: 0.2 }], 'Tote'),
  ];
  const BEST = {
    TB: [
      frame('board', [{ layout: 'split', img: 'g22', code: 'TB2', q: [203, 70, 870, 74, 872, 338, 199, 332], lines: false }], 'Billboard'),
      frame('stand', [{ layout: 'cover', img: 'g12', code: 'TB1', q: [271, 287, 827, 276, 816, 983, 271, 953], l1: 'Issue 02', l2: 'Karaoke queens' }], 'Newsstand', 0.85),
    ],
    AN: [
      frame('shelter2', [{ layout: 'coverb', img: 'g52', code: 'AN1', q: [321, 130, 775, 130, 765, 866, 328, 865], fx: 'lit' }], 'Bus shelter', 0.6),
      frame('fish', [{ code: 'AN1', q: rect(170, 800, 726, 900), fx: 'light', pad: 0.02 }], 'Party poster'),
    ],
    DU: [
      frame('led', [{ code: 'DU1', q: rect(230, 110, 880, 330), fx: 'screen', pad: 0.06 }], 'LED wall'),
      frame('dvd', [{ layout: 'band', img: 'g42', code: 'DU1', q: [155, 88, 785, 87, 762, 1004, 162, 1000], lines: false }], 'DVD'),
      frame('jewel', [{ layout: 'label', img: 'g13', code: 'DU13', q: [100, 428, 583, 367, 675, 874, 150, 906], lines: false }], 'Mix CD', 0.3),
    ],
  };

  /* ---------- deck furniture ---------- */
  const hdr = '<div class="hdr"><div><b>RemotoLabs®</b></div><div class="mid">An independent strategic design studio and creative powerhouse working with like-minded visionaries to create value and meaning through clear and effective visual systems and technology.</div><div class="r">Remoto.xyz<br>©2026</div></div>';
  const ftr = () => '<div class="ftr"><span>The Good Years · Logo exploration · Round 6</span><span class="m" data-logo="AN8"></span></div>';
  const side = '<div class="side l">2026</div><div class="side r">RASA × Remoto</div>';
  const opt = (code, name, art) => '<div class="opt" data-code="' + code + '"><div class="art"' + (art ? '' : ' data-art="' + code + '"') + '>' + (art || '') + '</div><div class="meta"><span><b>' + code + '</b>' + esc(name) + '</span><span class="vote"><button class="k" type="button">Keep</button><button class="r" type="button">Reject</button></span></div></div>';

  /* ---------- slides ---------- */
  const S = [];
  S.push('<section class="s cover">' + hdr + '<div class="ttl"><div><h1>The Good Years</h1><p>Logo exploration for RASA · Round 6 · November 2026</p></div></div></section>');
  S.push('<section class="s stmt">' + hdr + '<h2 class="big">Nostalgia is RASA’s living time machine for the late 80s, 90s and early 2000s. The Good Years is its first festival.</h2><div class="cols"><div><h4>Stages</h4><p>Pop Royalty, MTV Spring Break, The Rave, Studio 54, Alt Nation, Prom Night.</p></div><div><h4>Rooms</h4><p>Polaroid memory wall, Glamour Shots, the Mixtape Lab, a CK One lab, a roller rink.</p></div><div><h4>Audience</h4><p>Women around 30 to 40 who lived these years the first time round.</p></div><div><h4>This round</h4><p>Sixteen options per direction, black and white only, every one checked for alignment.</p></div></div></section>');
  S.push('<section class="s">' + hdr + '<div class="mid-note"><p>The guests were there the first time. So the brand should flirt with them the way the magazine covers did: flash, gloss, a little trouble. Grown-up glamour, worn a little messy.</p></div></section>');
  S.push('<section class="s ph"><div class="photo" style="background-image:url(assets/gen/g45.jpg)"></div><p class="over big">The night everyone still talks about.</p></section>');
  S.push('<section class="s">' + hdr + '<div class="mood m4"><div class="im" style="background-image:url(assets/gen/g11.jpg)"></div><div class="im" style="background-image:url(assets/gen/g14.jpg)"></div><div class="im" style="background-image:url(assets/gen/g9.jpg)"></div><div class="kw">Flash.<br>Photo booths.<br>Lip gloss.<br>The taxi home.<br><span>Dirty glamour, late-night internet, chrome.</span></div></div></section>');
  S.push('<section class="s">' + hdr + '<div class="mid-note"><p>Tabloid, Angel and Dial-up, sixteen options each. Each direction is shown as a concept, two pages of exploration, on black and white, across the stage names, in the world and out at scale. Keep or reject anything as you go.</p></div></section>');
  S.push('<section class="s">' + hdr + '<div class="lets">Let’s see.</div></section>');
  ROUTES.forEach((r) => {
    const half = (a, b) => '<div class="grid">' + r.opts.slice(a, b).map((o, i) => opt(r.id + (a + i + 1), o[0])).join('') + '</div>';
    S.push('<section class="s open">' + hdr + '<div class="name">' + r.n + '<br>' + r.name + '</div><div class="hero" data-logo="' + r.open + '" style="color:#fff"></div><p class="desc">' + r.desc + '</p><div class="num">' + r.n + '</div></section>');
    S.push('<section class="s w concept"><div class="lbl">Logo<br>Concept</div>' + side + '<div class="hero" data-logo="' + r.concept + '"></div><p class="cap">' + r.cap + '</p>' + ftr() + '</section>');
    S.push('<section class="s w xp"><div class="lbl">Logo<br>Exploration 1–8</div>' + side + half(0, 8) + ftr() + '</section>');
    S.push('<section class="s w xp"><div class="lbl">Logo<br>Exploration 9–16 · new</div>' + side + half(8, 16) + ftr() + '</section>');
    S.push('<section class="s pairs"><div class="two"><div class="wh" data-logo="' + r.open + '"></div><div class="bk" data-logo="' + r.open + '"></div></div><div class="lbl">Logo<br>Black and white</div></section>');
    S.push('<section class="s sys">' + hdr + '<div class="lbl">' + r.name + '<br>As a system</div><div class="stages">' + ['Pop Royalty', 'The Rave', 'Studio 54', 'Alt Nation'].map((t) => '<div><div class="st" data-stage="' + r.id + '|' + t + '"></div><span>Stage</span></div>').join('') + '</div></section>');
    S.push('<section class="s">' + hdr + '<div class="lbl">' + r.name + '<br>In the world</div><div class="mk3">' + MOCK[r.id].join('') + '</div></section>');
    S.push('<section class="s">' + hdr + '<div class="lbl">' + r.name + '<br>Out at scale</div><div class="mk3 ' + ({ TB: 'two', AN: 'half', DU: 'wide1' })[r.id] + '">' + BEST[r.id].join('') + '</div></section>');
  });
  S.push('<section class="s">' + hdr + '<div class="lbl">Y2K objects<br>In the world</div><div class="mk3">' + OBJECTS.join('') + '</div></section>');
  S.push('<section class="s">' + hdr + '<div class="lbl">Merch<br>In the world</div><div class="mk3 half">' + MERCH.join('') + '</div></section>');
  S.push('<section class="s w xp"><div class="lbl">Still in play<br>From Round 3</div>' + side + '<div class="grid">' + R3.map(([c, n]) => opt('R3-' + c, n, '<div data-mark="' + c + '" style="width:100%;height:100%;display:grid;place-items:center"></div>')).join('') + '</div>' + ftr() + '</section>');
  S.push('<section class="s picks">' + hdr + '<div class="lists"><div><h4>Kept</h4><ul id="lk"><li>Nothing yet</li></ul></div><div><h4>Rejected</h4><ul id="lr"><li>Nothing yet</li></ul></div><div><h4>Next</h4><ul><li>We redraw what you keep as clean vectors.</li><li>One logo, locked in black and white.</li><li>Then colour, flyers and the full presentation.</li></ul></div></div><div class="act"><button class="btn" type="button" data-act="wa">Send on WhatsApp</button><button class="btn o" type="button" data-act="mail">Send by email</button><button class="btn o" type="button" data-act="copy">Copy</button><button class="btn o" type="button" data-act="short">Shortlist only</button><button class="btn o" type="button" data-act="reset">Reset</button></div></section>');
  S.push('<section class="s shy">' + hdr + '<h2 class="big">Don’t be shy.<br>Tell us what you keep.</h2><p>RemotoLabs® × RASA · The Good Years</p></section>');

  /* ---------- perspective mapping ---------- */
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let c = 0; c < 8; c++) {
      let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    return b.map((v, i) => v / A[i][i]);
  }
  function place(fr) {
    const ph = PH[fr.dataset.ph]; if (!ph) return;
    const fw = fr.clientWidth, fh = fr.clientHeight; if (!fw || !fh) return;
    const s = Math.max(fw / ph[1], fh / ph[2]), ox = (fw - ph[1] * s) * (+fr.dataset.x || 0.5), oy = (fh - ph[2] * s) / 2;
    fr.querySelectorAll('.on').forEach((el) => {
      const q = el.dataset.q.split(',').map(Number);
      const pts = [[q[0], q[1]], [q[2], q[3]], [q[4], q[5]], [q[6], q[7]]].map(([x, y]) => [ox + x * s, oy + y * s]);
      const wAvg = (Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) + Math.hypot(pts[2][0] - pts[3][0], pts[2][1] - pts[3][1])) / 2;
      const hAvg = (Math.hypot(pts[3][0] - pts[0][0], pts[3][1] - pts[0][1]) + Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1])) / 2;
      const W = 1000, H = Math.max(40, Math.round(1000 * hAvg / Math.max(wAvg, 1)));
      el.style.width = W + 'px'; el.style.height = H + 'px';
      const h = homography([[0, 0], [W, 0], [W, H], [0, H]], pts);
      el.style.transform = 'matrix3d(' + [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1].map((v) => +v.toFixed(10)).join(',') + ')';
      const svg = el.querySelector(':scope > svg.mk'); if (svg) fit(svg, +el.dataset.pad);
    });
  }

  /* ---------- votes ---------- */
  const KEY = 'tgy-round5-votes';
  let votes = {}; try { votes = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('tgy-round4-votes') || '{}') || {}; } catch (e) { votes = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(votes)); } catch (e) {} };
  function paint() {
    document.querySelectorAll('.opt').forEach((o) => { const v = votes[o.dataset.code]; o.classList.toggle('keep', v === 'k'); o.classList.toggle('rej', v === 'r'); });
    const name = (c) => { const el = document.querySelector('.opt[data-code="' + c + '"] .meta span'); return el ? el.textContent : c; };
    const ks = Object.keys(votes).filter((c) => votes[c] === 'k'), rs = Object.keys(votes).filter((c) => votes[c] === 'r');
    const li = (a) => a.length ? a.map((c) => '<li>' + esc(name(c).replace(/^(\S+)/, '$1 ·')) + '</li>').join('') : '<li>Nothing yet</li>';
    const lk = document.getElementById('lk'), lr = document.getElementById('lr');
    if (lk) lk.innerHTML = li(ks); if (lr) lr.innerHTML = li(rs);
    const n = document.getElementById('rvn'); if (n) n.textContent = ks.length + ' kept · ' + rs.length + ' rejected';
  }
  const text = () => { const ks = Object.keys(votes).filter((c) => votes[c] === 'k'), rs = Object.keys(votes).filter((c) => votes[c] === 'r'); return 'The Good Years, Round 6\nKeep: ' + (ks.join(', ') || 'none') + '\nReject: ' + (rs.join(', ') || 'none'); };
  function act(a, btn) {
    if (a === 'copy') { const t = text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { const l = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = l), 1400); }).catch(() => window.prompt('Copy your picks:', t)); }
    if (a === 'hide') { document.body.classList.toggle('hide-rej'); document.querySelectorAll('[data-act="hide"]').forEach((b) => (b.textContent = document.body.classList.contains('hide-rej') ? 'Show rejected' : 'Hide rejected')); }
    if (a === 'reset' && window.confirm('Clear all keep / reject marks?')) { votes = {}; save(); paint(); }
    if (a === 'short') { document.body.classList.toggle('short-only'); document.querySelectorAll('[data-act="short"]').forEach((b) => (b.textContent = document.body.classList.contains('short-only') ? 'Show all' : 'Shortlist only')); }
    if (a === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(text() + '\n' + location.href.split('#')[0]), '_blank', 'noopener');
    if (a === 'mail') location.href = 'mailto:?subject=' + encodeURIComponent('The Good Years: our picks') + '&body=' + encodeURIComponent(text() + '\n\n' + location.href.split('#')[0]);
  }

  /* ---------- boot: draw after fonts so ink metrics are real ---------- */
  function render() {
    document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = svgFor(el.dataset.logo); });
    document.querySelectorAll('[data-art]').forEach((el) => { el.innerHTML = svgFor(el.dataset.art); });
    document.querySelectorAll('[data-stage]').forEach((el) => { const [rid, t] = el.dataset.stage.split('|'); const r = ROUTES.find((x) => x.id === rid); el.innerHTML = '<svg class="mk"><g class="ink">' + r.stage(t) + '</g></svg>'; });
    layout();
  }
  function layout() {
    document.querySelectorAll('[data-logo] svg.mk').forEach((s) => { if (!s.parentElement.classList.contains('on')) fit(s, +(s.parentElement.dataset.pad || 0.03)); });
    document.querySelectorAll('.opt .art svg.mk').forEach((s) => fit(s, 0.05));
    document.querySelectorAll('[data-stage] svg.mk').forEach((s) => fit(s, 0.02));
    document.querySelectorAll('.frame[data-ph]').forEach(place);
  }
  const FONTS = ['400 20px "Anton"', 'italic 800 20px "Bodoni Moda"', 'italic 900 20px "Bodoni Moda"', 'italic 400 20px "Bodoni Moda"', 'italic 700 20px "Bodoni Moda"', '500 20px "Bodoni Moda"', '900 20px "Bodoni Moda"', '400 20px "Six Caps"', '400 20px "VT"', '400 20px "Mrs Saint Delafield"'];
  const ready = () => (document.fonts ? document.fonts.ready.then(() => Promise.all(FONTS.map((f) => document.fonts.load(f).catch(() => 0)))) : Promise.resolve());
  function boot() {
    const deck = document.getElementById('deck'); if (!deck) return;
    deck.innerHTML = S.join('');
    const rv = document.createElement('div'); rv.className = 'rv';
    rv.innerHTML = '<span id="rvn" class="n">0 kept · 0 rejected</span><button type="button" class="hide" data-act="short">Shortlist only</button><button type="button" class="hide" data-act="hide">Hide rejected</button><button type="button" class="pri" data-act="wa">Send picks</button>';
    document.body.appendChild(rv);
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act) return act(b.dataset.act, b);
      const o = b.closest('.opt'); if (!o) return;
      const v = b.classList.contains('k') ? 'k' : 'r';
      if (votes[o.dataset.code] === v) delete votes[o.dataset.code]; else votes[o.dataset.code] = v;
      save(); paint();
    });
    paint();
    ready().then(() => { render(); setTimeout(layout, 700); document.documentElement.dataset.ready = '1'; });
    window.addEventListener('resize', () => { clearTimeout(window.__rf); window.__rf = setTimeout(layout, 150); });
  }
  // test hook: render any code into any element (used by work/align-test.html)
  window.TGY5 = { svgFor, fit, ready, ROUTES };
  if (!window.TGY5_NO_BOOT) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot(); }
})();

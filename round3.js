/* The Good Years — Round 3: black-and-white wordmark exploration.
   Every option is drawn as SVG in currentColor, rendered once on white and once on black,
   then fitted to its ink (getBBox) so nothing is cropped or off-centre. */
(function () {
  'use strict';
  let UID = 0;
  const uid = (p) => p + (++UID);
  const f1 = (n) => Math.round(n * 10) / 10;

  /* ---------- stroke alphabet (Console + Sigil) ---------- */
  function roundPoly(pts, r, closed) {
    const n = pts.length; let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const end = !closed && (i === 0 || i === n - 1);
      if (end || r <= 0) { d += (i === 0 ? 'M' : ' L') + f1(p[0]) + ',' + f1(p[1]); continue; }
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      const da = Math.hypot(p[0] - a[0], p[1] - a[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const rr = Math.min(r, da / 2, db / 2);
      const p1 = [p[0] + (a[0] - p[0]) * rr / da, p[1] + (a[1] - p[1]) * rr / da];
      const p2 = [p[0] + (b[0] - p[0]) * rr / db, p[1] + (b[1] - p[1]) * rr / db];
      d += (i === 0 ? 'M' : ' L') + f1(p1[0]) + ',' + f1(p1[1]) + ' Q' + f1(p[0]) + ',' + f1(p[1]) + ' ' + f1(p2[0]) + ',' + f1(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  // letter skeletons on a w × h box (y down). Each: array of {pts, closed}
  function glyph(ch, w, h, set) {
    const O = (pts) => ({ pts, closed: true }), L = (pts) => ({ pts, closed: false });
    const m = h * 0.5, open = set.open, vY = set.vY;
    switch (ch) {
      case 'T': return [L([[0, 0], [w, 0]]), L([[w / 2, 0], [w / 2, h]])];
      case 'H': return [L([[0, 0], [0, h]]), L([[w, 0], [w, h]]), L([[0, m], [w, m]])];
      case 'E': return open ? [L([[w, 0], [0, 0], [0, h], [w, h]]), L([[w * .3, m], [w, m]])]
                            : [L([[w, 0], [0, 0], [0, h], [w, h]]), L([[0, m], [w * .78, m]])];
      case 'G': return [L([[w, 0], [0, 0], [0, h], [w, h], [w, h * .52], [w * .46, h * .52]])];
      case 'O': return open ? [L([[w * .34, h], [0, h], [0, 0], [w, 0], [w, h * .66]])] : [O([[0, 0], [w, 0], [w, h], [0, h]])];
      case 'D': return open ? [L([[0, h * .3], [0, 0], [w * .68, 0], [w, h * .3], [w, h * .7], [w * .68, h], [0, h]])]
                            : [O([[0, 0], [w * .68, 0], [w, h * .32], [w, h * .68], [w * .68, h], [0, h]])];
      case 'Y': return vY ? [L([[0, 0], [w / 2, h * .52], [w, 0]]), L([[w / 2, h * .52], [w / 2, h]])]
                          : [L([[0, 0], [0, m], [w, m]]), L([[w, 0], [w, h], [w * .1, h]])];
      case 'A': return open ? [L([[0, h], [0, 0], [w, 0], [w, h]]), L([[w * .3, h * .54], [w, h * .54]])]
                            : [L([[0, h], [0, 0], [w, 0], [w, h]]), L([[0, h * .54], [w, h * .54]])];
      case 'R': return [L([[0, h], [0, 0], [w, 0], [w, m], [0, m]]), L([[w * .46, m], [w, h]])];
      case 'S': return [L([[w, 0], [0, 0], [0, m], [w, m], [w, h], [0, h]])];
      default: return [];
    }
  }
  // lays out lines of text; returns {polys:[{pts,closed,ch,idx}], width, height}
  function layout(lines, o) {
    const polys = []; let maxW = 0; let ci = 0;
    lines.forEach((line, li) => {
      const h = line.h || o.h, wl = line.w || o.w, tr = line.tr != null ? line.tr : o.tr;
      let x = line.x || 0; const y0 = line.y != null ? line.y : li * (o.h + o.lead);
      [...line.t].forEach((ch) => {
        if (ch === ' ') { x += o.space; return; }
        const w = (o.wide && o.wide[ch]) ? wl * o.wide[ch] : wl;
        glyph(ch, w, h, o).forEach((g, pi) => polys.push({ pts: g.pts.map(([px, py]) => [px + x, py + y0]), closed: g.closed, ch, idx: ci, pi }));
        x += w + tr; ci++;
      });
      maxW = Math.max(maxW, x - tr);
    });
    return { polys, width: maxW };
  }
  function strokeMark(lines, o) {
    const { polys } = layout(lines, o);
    let s = '<g fill="none" stroke="currentColor" stroke-width="' + o.sw + '" stroke-linejoin="' + (o.r ? 'round' : 'miter') + '" stroke-linecap="' + (o.cap || 'square') + '" stroke-miterlimit="10">';
    polys.forEach((p) => { s += '<path d="' + roundPoly(p.pts, o.r || 0, p.closed) + '"/>'; });
    s += '</g>';
    if (o.spike) s += spikes(polys, o);
    if (o.base) { // continuous baseline under everything (PS2-style connector)
      const xs = polys.flatMap((p) => p.pts.map((q) => q[0])), ys = polys.flatMap((p) => p.pts.map((q) => q[1]));
      const y = Math.max(...ys) + o.base;
      s += '<path d="M' + (Math.min(...xs) - o.sw / 2) + ',' + y + ' H' + (Math.max(...xs) + o.baseRun) + '" stroke="currentColor" stroke-width="' + o.sw + '" fill="none"/>';
    }
    return s;
  }
  // tapered spikes on every open end: short = pointed terminals, long on chosen ends
  function spikes(polys, o) {
    let s = '<g fill="currentColor">';
    polys.forEach((p) => {
      if (p.closed) return;
      const n = p.pts.length;
      [[p.pts[1], p.pts[0], 0], [p.pts[n - 2], p.pts[n - 1], 1]].forEach(([a, b, end]) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const L = o.spike(p, end, ux, uy);
        if (!L) return;
        const hw = o.sw / 2, bx = b[0] - ux * 0.5, by = b[1] - uy * 0.5;
        s += '<polygon points="' + [[bx - uy * hw, by + ux * hw], [bx + uy * hw, by - ux * hw], [b[0] + ux * L, b[1] + uy * L]].map((q) => f1(q[0]) + ',' + f1(q[1])).join(' ') + '"/>';
      });
    });
    return s + '</g>';
  }
  const star4 = (x, y, r, k = 0.16) => '<path fill="currentColor" d="M' + x + ',' + (y - r) + ' Q' + (x + r * k) + ',' + (y - r * k) + ' ' + (x + r) + ',' + y + ' Q' + (x + r * k) + ',' + (y + r * k) + ' ' + x + ',' + (y + r) + ' Q' + (x - r * k) + ',' + (y + r * k) + ' ' + (x - r) + ',' + y + ' Q' + (x - r * k) + ',' + (y - r * k) + ' ' + x + ',' + (y - r) + 'Z"/>';

  /* ---------- text helpers ---------- */
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const T = (t, font, size, extra = '') => '<text font-family="' + font + '" font-size="' + size + '" fill="currentColor" ' + extra + '>' + esc(t) + '</text>';

  /* ---------- the exploration ---------- */
  const FAM = [];
  const fam = (id, name, ref, note) => { const f = { id, name, ref, note, opts: [] }; FAM.push(f); return f; };
  const add = (f, name, build, o = {}) => f.opts.push(Object.assign({ name, build }, o));

  // A — CONSOLE (PS2 constructed line)
  const A = fam('console', 'Console', 'assets/r3/ref-console.jpg', 'Thin constructed lines, like the PS2 logo: letters built from one pen on a grid, open corners, nothing decorative.');
  const AO = { w: 92, h: 60, tr: 26, space: 64, lead: 34, sw: 4 };
  add(A, 'Grid line', () => strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, AO)));
  add(A, 'Open corners', () => strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, AO, { open: 1, vY: 1 })));
  add(A, 'Soft corners', () => strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, AO, { r: 14, cap: 'round', sw: 7, vY: 1 })));
  add(A, 'Baseline run', () => strokeMark([{ t: 'GOOD YEARS' }], Object.assign({}, AO, { w: 74, open: 1, vY: 1, base: 22, baseRun: 140, sw: 4 })) + T('THE', 'Michroma', 15, 'x="0" y="-22" letter-spacing="9"'));
  add(A, 'Stacked', () => strokeMark([{ t: 'THE', w: 40, h: 40, tr: 12 }, { t: 'GOOD', y: 70 }, { t: 'YEARS', y: 170 }], Object.assign({}, AO, { w: 84, h: 78, tr: 20, open: 1, sw: 6 })));
  add(A, 'Heavy grid', () => strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, AO, { w: 70, h: 64, sw: 14, tr: 24, r: 4, vY: 1 })));

  // B — SPEED (Y2K wide)
  const B = fam('speed', 'Speed', 'assets/r3/ref-speed.jpg', 'Very wide, very fast. The letters are cut by horizontal lines so they read as motion, like the Y2K layer styles in the refs.');
  const slices = (id, ys, hgt) => '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/>' + ys.map((y) => '<rect x="-5000" y="' + y + '" width="10000" height="' + hgt + '" fill="#000"/>').join('') + '</mask>';
  add(B, 'Three slices', () => { const m = uid('m'); return slices(m, [-52, -40, -28], 5) + '<g mask="url(#' + m + ')">' + T('THE GOOD YEARS', 'BN SuperExpO', 80) + '</g>'; });
  add(B, 'Split shift', () => {
    const a = uid('c'), b = uid('c');
    return '<clipPath id="' + a + '"><rect x="-99" y="-200" width="3000" height="164"/></clipPath><clipPath id="' + b + '"><rect x="-99" y="-31" width="3000" height="200"/></clipPath>' +
      '<g clip-path="url(#' + a + ')" transform="translate(16 0)">' + T('the good years', 'BN ExpO', 92, 'letter-spacing="-4"') + '</g><g clip-path="url(#' + b + ')">' + T('the good years', 'BN ExpO', 92, 'letter-spacing="-4"') + '</g>';
  });
  add(B, 'Trails', () => {
    let s = T('GOOD YEARS', 'Krona One', 70, 'x="0" y="0" transform="skewX(-14)"');
    [-50, -36, -22, -8].forEach((y, i) => { s += '<rect x="' + (-260 + i * 34) + '" y="' + y + '" width="' + (220 - i * 30) + '" height="' + (i % 2 ? 3 : 6) + '" fill="currentColor"/>'; });
    return s + T('THE', 'Michroma', 14, 'x="16" y="24" letter-spacing="10"');
  });
  add(B, 'Solid over line', () => T('GOOD', 'Unbounded', 120, 'font-weight="900" transform="skewX(-12)" letter-spacing="-6"') + T('YEARS', 'Unbounded', 120, 'y="104" font-weight="900" transform="skewX(-12)" letter-spacing="-6" fill="none" stroke="currentColor" stroke-width="3"'));
  add(B, 'Spaced + blade', () => T('THE GOOD YEARS', 'Michroma', 46, 'letter-spacing="14"') + '<polygon fill="currentColor" points="40,22 1060,10 1040,30 40,26"/>');
  add(B, 'Slash cuts', () => { const m = uid('m'); let s = '<mask id="' + m + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/>'; for (let x = -40; x < 1500; x += 118) s += '<polygon fill="#000" points="' + x + ',-30 ' + (x + 64) + ',-90 ' + (x + 70) + ',-90 ' + (x + 6) + ',-30"/>'; return s + '</mask><g mask="url(#' + m + ')">' + T('THE GOOD YEARS', 'BN SuperExp', 78) + '</g>'; });

  // C — SIGIL (sharp spikes)
  const C = fam('sigil', 'Sigil', 'assets/r3/ref-sigil.jpg', 'Tall, sharp and a bit dangerous: every stroke ends in a point and a few shoot far past the letters, like the poster type in the refs.');
  const CO = { w: 42, h: 120, tr: 18, space: 64, lead: 40, sw: 9, vY: 1 };
  const longEnds = (chars, len, dir) => (p, end, ux, uy) => {
    const vertical = Math.abs(uy) > 0.9, horiz = Math.abs(ux) > 0.9;
    if (chars.includes(p.ch) && ((dir === 'down' && vertical && uy > 0) || (dir === 'up' && vertical && uy < 0) || (dir === 'side' && horiz))) return len;
    return 16;
  };
  const sk = (s, k = -10) => '<g transform="skewX(' + k + ')">' + s + '</g>';
  add(C, 'Points', () => sk(strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, CO, { spike: () => 16 }))));
  add(C, 'Falling spikes', () => sk(strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, CO, { spike: longEnds('YT', 120, 'down') }))));
  add(C, 'Flares', () => sk(strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, CO, { sw: 6, spike: longEnds('TGE', 110, 'side') }))) + star4(760, -24, 34));
  add(C, 'Hairline', () => sk(strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, CO, { sw: 3, h: 130, w: 36, spike: longEnds('YGHT', 150, 'down') })), -14) + star4(520, 60, 26));
  add(C, 'Stacked sigil', () => sk(strokeMark([{ t: 'GOOD', y: 0 }, { t: 'YEARS', y: 160, x: 30 }], Object.assign({}, CO, { w: 54, h: 130, sw: 11, spike: longEnds('GY', 130, 'down') }))) + T('THE', 'Michroma', 18, 'x="0" y="-24" letter-spacing="12"'));
  add(C, 'Heavy blade', () => sk(strokeMark([{ t: 'THE GOOD YEARS' }], Object.assign({}, CO, { sw: 15, w: 50, tr: 26, space: 76, spike: longEnds('ETS', 90, 'side') })), -16));

  // D — BADGE (fused letters in an oval)
  const D = fam('badge', 'Badge', 'assets/r3/ref-badge.jpg', 'Letters pushed together until they lock, sitting in an oval like a streetwear tag. The ring is cut wherever it meets the letters.');
  const knock = (id, inner, w) => '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/><g fill="#000" stroke="#000" stroke-width="' + w + '" stroke-linejoin="round">' + inner.replace(/currentColor/g, '#000') + '</g></mask>';
  add(D, 'Ring tag', () => { const m = uid('m'); const txt = T('Good Years', 'Racing Sans One', 110, 'text-anchor="middle" x="0" y="30"'); return knock(m, txt, 22) + '<ellipse cx="0" cy="-8" rx="330" ry="110" fill="none" stroke="currentColor" stroke-width="7" mask="url(#' + m + ')" transform="rotate(-6)"/>' + txt + T('THE', 'Michroma', 16, 'text-anchor="middle" x="0" y="-66" letter-spacing="10"') + star4(282, -84, 30); });
  add(D, 'Solid tag', () => { const m = uid('m'); return '<mask id="' + m + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/>' + T('GOOD YEARS', 'Racing Sans One', 96, 'text-anchor="middle" y="34" fill="#000"').replace('currentColor', '#000') + '</mask><ellipse cx="0" cy="0" rx="340" ry="96" fill="currentColor" mask="url(#' + m + ')"/>' + T('THE', 'Michroma', 15, 'text-anchor="middle" y="-110" letter-spacing="10"'); });
  add(D, 'Locked stack', () => { const m = uid('m'); const g = T('GOOD', 'Racing Sans One', 150, 'x="-40" y="0"'); const y = T('YEARS', 'Racing Sans One', 150, 'x="70" y="104"'); return knock(m, y, 18) + '<g mask="url(#' + m + ')">' + g + '</g>' + y; });
  add(D, 'Double orbit', () => { const m = uid('m'); const txt = T('the good years', 'Kaushan Script', 96, 'text-anchor="middle" y="28"'); return knock(m, txt, 20) + '<g mask="url(#' + m + ')" fill="none" stroke="currentColor" transform="rotate(-8)"><ellipse rx="360" ry="104" stroke-width="6"/><ellipse rx="336" ry="84" stroke-width="2"/></g>' + txt; });
  add(D, 'Swash tail', () => T('Good Years', 'Yellowtail', 130, 'text-anchor="middle"') + '<path d="M236,10 C300,40 150,90 -40,70 C-200,55 -280,40 -300,26" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>' + star4(300, -96, 28));
  add(D, 'Pill', () => { const m = uid('m'); return '<mask id="' + m + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/>' + T('THE GOOD YEARS', 'Racing Sans One', 70, 'text-anchor="middle" y="25"').replace('currentColor', '#000') + '</mask><rect x="-330" y="-56" width="660" height="112" rx="56" fill="currentColor" mask="url(#' + m + ')"/><rect x="-350" y="-74" width="700" height="148" rx="74" fill="none" stroke="currentColor" stroke-width="3"/>'; });

  // E — LIQUID (drips, fused letters, poured shapes) — all vector, no effects
  const E = fam('liquid', 'Liquid', 'assets/r3/ref-liquid.jpg', 'Heavy letters that drip, fuse, or sit as holes inside a poured shape, like Racer Phantom, kept in plain black and white.');
  const goo = (id, blur, k) => '<filter id="' + id + '" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="' + blur + '" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ' + k + ' -' + Math.round(k * 0.45) + '"/></filter>';
  const drip = (x, y, w, L) => { const r = w / 2; return '<path fill="currentColor" d="M' + f1(x - r - 9) + ',' + f1(y - 1) + ' Q' + f1(x - r) + ',' + f1(y) + ' ' + f1(x - r) + ',' + f1(y + 12) + ' L' + f1(x - r) + ',' + f1(y + L) + ' A' + r + ',' + r + ' 0 0 0 ' + f1(x + r) + ',' + f1(y + L) + ' L' + f1(x + r) + ',' + f1(y + 12) + ' Q' + f1(x + r) + ',' + f1(y) + ' ' + f1(x + r + 9) + ',' + f1(y - 1) + 'Z"/>'; };
  function blobPath(cx, cy, rx, ry, seed, lobes) {
    const N = 36, pts = []; let r0 = seed;
    const rnd = () => { r0 = (r0 * 9301 + 49297) % 233280; return r0 / 233280; };
    const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
    for (let i = 0; i < N; i++) {
      const t = i / N * Math.PI * 2;
      let k = 1 + 0.10 * Math.sin(3 * t + ph[0]) + 0.07 * Math.sin(5 * t + ph[1]) + 0.05 * Math.sin(8 * t + ph[2]);
      (lobes || []).forEach(([ang, amp, wid]) => { const d = Math.atan2(Math.sin(t - ang), Math.cos(t - ang)); k += amp * Math.exp(-(d * d) / (2 * wid * wid)); });
      pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
    }
    let d = 'M' + f1(pts[0][0]) + ',' + f1(pts[0][1]);
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      d += ' C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ',' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f1(p2[0] - (p3[0] - p1[0]) / 6) + ',' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f1(p2[0]) + ',' + f1(p2[1]);
    }
    return d + 'Z';
  }
  const DG = (t, L, extra = '') => T(t, 'Dela Gothic One', 110, 'textLength="' + L + '" lengthAdjust="spacingAndGlyphs" ' + extra);
  const LOBES = [[Math.PI * 0.5, 0.55, 0.12], [Math.PI * 0.68, 0.38, 0.09], [Math.PI * 0.3, 0.3, 0.08], [Math.PI * 1.15, 0.25, 0.14], [Math.PI * 1.8, 0.3, 0.12]];
  add(E, 'Drip', () => DG('GOOD YEARS', 820) + [[0.07, 16, 60], [0.2, 12, 110], [0.31, 18, 44], [0.56, 14, 150], [0.7, 18, 70], [0.86, 12, 96], [0.95, 16, 40]].map(([f, w, l]) => drip(820 * f, 0, w, l)).join(''));
  add(E, 'Fused', () => { const f = uid('f'); return goo(f, 7, 22) + '<g filter="url(#' + f + ')">' + T('good years', 'Bagel Fat One', 140, 'letter-spacing="-10"') + '</g>'; }, { pad: 0.12 });
  add(E, 'Poured shape', () => { const m = uid('m'); const txt = DG('GOOD YEARS', 700, 'x="-350" y="38"'); return knock(m, txt, 14) + '<path d="' + blobPath(0, 0, 470, 150, 7, LOBES) + '" fill="currentColor" mask="url(#' + m + ')"/>'; });
  add(E, 'Acid edge', () => { const f = uid('f'); return '<filter id="' + f + '" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter><g filter="url(#' + f + ')">' + T('THE GOOD YEARS', 'Dela Gothic One', 96, 'letter-spacing="-2"') + '</g>'; }, { pad: 0.1 });
  add(E, 'Blob outline', () => { const m = uid('m'); const txt = DG('GOOD YEARS', 700, 'x="-350" y="38"'); return knock(m, txt, 26) + '<path d="' + blobPath(0, 0, 470, 150, 21, LOBES) + '" fill="none" stroke="currentColor" stroke-width="8" mask="url(#' + m + ')"/>' + txt; });
  add(E, 'Drip stack', () => { const f = uid('f'); return goo(f, 6, 22) + '<g filter="url(#' + f + ')">' + T('GOOD', 'Bagel Fat One', 150, 'letter-spacing="-8"') + T('YEARS', 'Bagel Fat One', 150, 'y="120" letter-spacing="-8"') + '</g>' + [[60, 14, 70], [190, 18, 120], [330, 12, 54], [420, 16, 90]].map(([x, w, l]) => drip(x, 124, w, l)).join(''); }, { pad: 0.08 });

  // F — AUTOGRAPH (paparazzi-era signature)
  const F = fam('autograph', 'Autograph', null, 'The name signed like a 2000s it-girl on a photo: fast, glamorous, a little careless. From the brief: Paris Hilton era, celebrity nightlife, flash.');
  const swoosh = (x1, y, x2, w = 5) => '<path d="M' + x1 + ',' + y + ' C' + (x1 + (x2 - x1) * 0.35) + ',' + (y + 26) + ' ' + (x1 + (x2 - x1) * 0.7) + ',' + (y - 6) + ' ' + x2 + ',' + (y - 22) + '" fill="none" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round"/>';
  add(F, 'Signature', () => T('The Good Years', 'Mrs Saint Delafield', 150) + swoosh(30, 46, 760));
  add(F, 'Showgirl', () => T('The Good Years', 'Pinyon Script', 120));
  add(F, 'Fast hand', () => T('The Good Years', 'Herr Von Muellerhoff', 160) + swoosh(-10, 40, 700, 4) + swoosh(60, 56, 560, 2));
  add(F, 'Runway', () => T('THE', 'Michroma', 16, 'x="8" y="-112" letter-spacing="14"') + T('Good Years', 'Ballet', 120));
  add(F, 'Cut script', () => { const m = uid('m'); return '<mask id="' + m + '" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000"><rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/><rect x="-5000" y="-40" width="10000" height="7" fill="#000"/></mask><g mask="url(#' + m + ')">' + T('The Good Years', 'Corinthia', 170, 'font-weight="700"') + '</g><rect x="-30" y="-40" width="860" height="2" fill="currentColor"/>'; });
  add(F, 'Script + caps', () => T('Good Years', 'Mrs Saint Delafield', 170) + T('THE GOOD YEARS', 'Michroma', 13, 'x="130" y="118" letter-spacing="16"'));

  // G — COUTURE (trashy-luxury gothic)
  const G = fam('couture', 'Couture', null, 'Gothic letters from the Juicy, Von Dutch and Ed Hardy years, drawn clean so they feel expensive instead of costume. From the brief: trashy luxury, chains, glamour.');
  add(G, 'Crest arc', () => { const p = uid('p'); return '<path id="' + p + '" d="M-420,40 A520,300 0 0 1 420,40" fill="none"/><text font-family="UnifrakturMaguntia" font-size="104" fill="currentColor" text-anchor="middle"><textPath href="#' + p + '" startOffset="50%">The Good Years</textPath></text>'; });
  add(G, 'Plain gothic', () => T('The Good Years', 'Pirata One', 130, 'letter-spacing="-2"'));
  add(G, 'Gothic caps', () => T('GOOD YEARS', 'Grenze Gotisch', 130, 'font-weight="900" letter-spacing="-3"') + T('THE', 'Michroma', 16, 'x="6" y="-104" letter-spacing="14"'));
  add(G, 'Stacked crest', () => T('Good', 'UnifrakturCook', 150, 'font-weight="700" text-anchor="middle"') + T('Years', 'UnifrakturCook', 150, 'font-weight="700" text-anchor="middle" y="128"') + T('THE', 'Michroma', 16, 'text-anchor="middle" y="-130" letter-spacing="14"'));
  add(G, 'Tattoo banner', () => T('The Good Years', 'New Rocker', 116, 'text-anchor="middle"') + swoosh(-360, 40, 380, 4));
  add(G, 'Chain', () => { let c = ''; for (let i = 0; i < 26; i++) { const x = -20 + i * 32, y = 40 + Math.sin(i / 25 * Math.PI) * 40; c += i % 2 ? '<ellipse cx="' + x + '" cy="' + f1(y) + '" rx="16" ry="7" fill="none" stroke="currentColor" stroke-width="4"/>' : '<ellipse cx="' + x + '" cy="' + f1(y) + '" rx="7" ry="11" fill="none" stroke="currentColor" stroke-width="4"/>'; } return T('The Good Years', 'Pirata One', 130, 'letter-spacing="-2"') + c; });

  /* ---------- render ---------- */
  function card(f, o, i) {
    const code = String.fromCharCode(65 + FAM.indexOf(f)) + (i + 1);
    const el = document.createElement('figure'); el.className = 'x';
    el.innerHTML = '<div class="pair"><div class="pn w"><svg class="mk" aria-label="' + esc(code + ' ' + o.name) + '"><g class="ink">' + o.build() + '</g></svg></div>' +
      '<div class="pn b"><svg class="mk" aria-hidden="true"><g class="ink">' + o.build() + '</g></svg></div></div>' +
      '<figcaption><b>' + code + '</b> ' + esc(o.name) + '</figcaption>';
    el.dataset.pad = o.pad || 0.06;
    return el;
  }
  function fit(svg, pad) {
    const g = svg.querySelector('.ink'); let bb;
    try { bb = g.getBBox(); } catch (e) { return; }
    if (!bb.width) return;
    const p = Math.max(bb.width, bb.height) * pad;
    svg.setAttribute('viewBox', [bb.x - p, bb.y - p, bb.width + 2 * p, bb.height + 2 * p].map(f1).join(' '));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  window.TGY_FAM = FAM; window.TGY_fit = fit;
  const byCode = (code) => { const f = FAM[code.charCodeAt(0) - 65]; return f && f.opts[+code.slice(1) - 1]; };
  function renderCode(el) {
    const o = byCode(el.dataset.mark); if (!o) return;
    el.innerHTML = '<svg class="mk" aria-label="The Good Years"><g class="ink">' + o.build() + '</g></svg>';
    el._pad = o.pad || 0.04;
  }

  /* ---------- TGY marks: centred on the ink, not on the font box ---------- */
  const inkMetrics = (txt, font) => { const c = document.createElement('canvas').getContext('2d'); c.font = font; const m = c.measureText(txt); return { L: m.actualBoundingBoxLeft, R: m.actualBoundingBoxRight, A: m.actualBoundingBoxAscent, D: m.actualBoundingBoxDescent, fA: m.fontBoundingBoxAscent, fD: m.fontBoundingBoxDescent }; };
  const MARKS = [
    { code: 'T1', name: 'Console ring', shell: '<circle r="150" fill="none" stroke="currentColor" stroke-width="5"/>', stroke: () => strokeMark([{ t: 'TGY' }], Object.assign({}, AO, { w: 62, h: 52, tr: 18, sw: 6, vY: 1, open: 1 })) },
    { code: 'T2', name: 'Sigil ring', shell: '<circle r="150" fill="none" stroke="currentColor" stroke-width="3"/>' + star4(106, -106, 18), stroke: () => sk(strokeMark([{ t: 'TGY' }], Object.assign({}, CO, { w: 44, h: 120, sw: 10, spike: () => 16 }))) },
    { code: 'T3', name: 'Speed orbit', shell: '<g transform="rotate(-9)" fill="none" stroke="currentColor"><ellipse rx="210" ry="74" stroke-width="9" stroke-dasharray="980 360" stroke-dashoffset="-160"/></g>', text: 'TGY', family: 'BN SuperExpO', size: 92 },
    { code: 'T4', name: 'Badge oval', shell: 'KNOCK', text: 'TGY', family: 'Racing Sans One', size: 120 },
    { code: 'T5', name: 'Couture seal', shell: '<circle r="150" fill="none" stroke="currentColor" stroke-width="4"/><circle r="136" fill="none" stroke="currentColor" stroke-width="1.5"/>', text: 'TGY', family: 'UnifrakturCook', weight: 700, size: 112 },
    { code: 'T6', name: 'Liquid blob', shell: 'BLOB', text: 'TGY', family: 'Dela Gothic One', size: 110 },
  ];
  function markSvg(mk, colorFix) {
    let inner = '';
    if (mk.stroke) inner = '<g class="lt">' + mk.stroke() + '</g>';
    else {
      const font = (mk.weight || 400) + ' ' + mk.size + 'px "' + mk.family + '"';
      const m = inkMetrics(mk.text, font);
      const x = -(m.R - m.L) / 2, y = (m.A - m.D) / 2;              // ink centre -> 0,0
      const boxY = (m.fA - m.fD) / 2;                                  // where a font-box centring would put it
      mk.was = Math.abs(boxY - y);
      inner = '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="' + mk.family + '" font-size="' + mk.size + '" font-weight="' + (mk.weight || 400) + '" fill="currentColor">' + mk.text + '</text>';
    }
    let shell = mk.shell;
    if (shell === 'KNOCK') { const id = uid('m'); shell = '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-999" y="-999" width="1998" height="1998"><rect x="-999" y="-999" width="1998" height="1998" fill="#fff"/>' + inner.replace(/currentColor/g, '#000') + '</mask><ellipse rx="200" ry="112" fill="currentColor" mask="url(#' + id + ')"/>'; inner = ''; }
    if (shell === 'BLOB') { const id = uid('m'); shell = '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-999" y="-999" width="1998" height="1998"><rect x="-999" y="-999" width="1998" height="1998" fill="#fff"/><g stroke="#000" stroke-width="12" stroke-linejoin="round">' + inner.replace(/currentColor/g, '#000') + '</g></mask><path d="' + blobPath(0, -24, 200, 150, 7, [[Math.PI * 0.5, 0.45, 0.12], [Math.PI * 0.7, 0.3, 0.09], [Math.PI * 1.2, 0.2, 0.14]]) + '" fill="currentColor" mask="url(#' + id + ')"/>'; inner = ''; }
    return '<g class="ink">' + shell + inner + '</g>';
  }
  function centreStroke(svg) { // stroke-built letters: centre their geometric box (strokes are symmetric)
    const g = svg.querySelector('.lt'); if (!g) return;
    // centre on the letter strokes only (spikes and stars would pull the box sideways), mapped through any slant
    const sg = g.querySelector('g[fill="none"]') || g, bb = sg.getBBox();
    const m = g.getCTM().inverse().multiply(sg.getCTM());
    const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    // a slanted box is a parallelogram: use the mid-height row so the slant does not bias the centre
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    g.setAttribute('transform', 'translate(' + f1(-cx) + ' ' + f1(-cy) + ')');
  }
  function buildMarks() {
    const root = document.getElementById('tgy'); if (!root) return;
    MARKS.forEach((mk) => {
      const el = document.createElement('figure'); el.className = 'x';
      el.innerHTML = '<div class="pair"><div class="pn w"><svg class="mk sq">' + markSvg(mk) + '</svg></div><div class="pn b"><svg class="mk sq">' + markSvg(mk) + '</svg></div></div><figcaption><b>' + mk.code + '</b> ' + mk.name + (mk.was ? ' <span class="ok">centred on the ink (a font-box centre would sit ' + (mk.was / 3).toFixed(1) + '% off)</span>' : ' <span class="ok">centred on the ink</span>') + '</figcaption>';
      root.appendChild(el);
      el.querySelectorAll('svg').forEach((s) => { centreStroke(s); fit(s, 0.08); });
    });
  }

  function build() {
    const root = document.getElementById('explore');
    if (root) FAM.forEach((f, fi) => {
      const sec = document.createElement('div'); sec.className = 'fam'; sec.id = 'fam-' + f.id;
      sec.innerHTML = '<div class="famhead"><div><span class="k">' + String.fromCharCode(65 + fi) + ' · ' + f.opts.length + ' options</span><h3>' + f.name + '</h3></div><p>' + f.note + '</p>' + (f.ref ? '<img src="' + f.ref + '" alt="" loading="lazy">' : '') + '</div><div class="xgrid"></div>';
      const grid = sec.querySelector('.xgrid');
      f.opts.forEach((o, i) => grid.appendChild(card(f, o, i)));
      root.appendChild(sec);
    });
    const go = () => document.querySelectorAll('#explore .x').forEach((c) => c.querySelectorAll('svg.mk').forEach((s) => fit(s, +c.dataset.pad)));
    const mocks = () => document.querySelectorAll('[data-mark]').forEach((el) => { renderCode(el); el.querySelectorAll('svg.mk').forEach((s) => fit(s, el._pad)); });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
      const need = ['400 20px "Racing Sans One"', '700 20px "UnifrakturCook"', '400 20px "Dela Gothic One"', '400 20px "BN SuperExpO"', '400 20px "Mrs Saint Delafield"', '400 20px "Pirata One"', '700 20px "Grenze Gotisch"'];
      return Promise.all(need.map((f) => document.fonts.load(f).catch(() => 0)));
    }).then(() => { go(); buildMarks(); mocks(); setTimeout(() => { go(); mocks(); }, 700); document.documentElement.dataset.r3 = 'ready'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

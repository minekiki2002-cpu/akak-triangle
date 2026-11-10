/* 阿角的三角旗節：四年級上學期「三角形」探索繪本
   全部在瀏覽器裡執行，不上傳任何資料。 */
(function () {
'use strict';

/* ---------------- 小工具 ---------------- */
const $ = id => document.getElementById(id);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return e;
}
const NS = 'http://www.w3.org/2000/svg';
function svgEl(vb, cls) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', vb); if (cls) s.setAttribute('class', cls); return s; }
/* 用畫面上的實際大小換算座標：瀏覽器放大縮小（含 Safari）都準確 */
function svgPt(svg, e) {
  const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const k = Math.min(r.width / vb.width, r.height / vb.height); // preserveAspectRatio: xMidYMid meet
  const ox = r.left + (r.width - vb.width * k) / 2, oy = r.top + (r.height - vb.height * k) / 2;
  return { x: vb.x + (e.clientX - ox) / k, y: vb.y + (e.clientY - oy) / k };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const r1 = v => Math.round(v * 10) / 10;
const snap = (v, s) => Math.round(v / s) * s;
function angleAt(pts, i) {
  const n = pts.length, p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
  const v1 = { x: a.x - p.x, y: a.y - p.y }, v2 = { x: b.x - p.x, y: b.y - p.y };
  const c = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
}
function area(p) { let s = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; s += p[i].x * q.y - q.x * p[i].y; } return s / 2; }
function segDist(a, b, p) { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy; let t = l ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); }
function segCross(a, b, c, d) { const o = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; }
function inPoly(p, pts) { let r = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { if ((pts[i].y > p.y) !== (pts[j].y > p.y) && p.x < (pts[j].x - pts[i].x) * (p.y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x) r = !r; } return r; }
function centroid(p) { return { x: (p[0].x + p[1].x + p[2].x) / 3, y: (p[0].y + p[1].y + p[2].y) / 3 }; }
function rot(p, deg) { const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t); return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }; }
/* 由三邊長做出三角形：c 是 AB，b 是 AC，a 是 BC */
function fromSides(a, b, c) { const x = (b * b + c * c - a * a) / (2 * c); return [{ x: 0, y: 0 }, { x: c, y: 0 }, { x, y: -Math.sqrt(Math.max(0, b * b - x * x)) }]; }
/* 由三個角做出三角形（角 A、B、C 分別在三個頂點），最長邊 = L */
function fromAngles(A, B, C, L) { const s = [A, B, C].map(d => Math.sin(d * Math.PI / 180)); const k = L / Math.max(...s); return fromSides(s[0] * k, s[1] * k, s[2] * k); }
/* 旋轉後，讓外框置中在 (cx, cy) */
function place(pts, deg, cx, cy) {
  const c = centroid(pts), q = pts.map(p => rot({ x: p.x - c.x, y: p.y - c.y }, deg));
  const xs = q.map(p => p.x), ys = q.map(p => p.y);
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
  return q.map(p => ({ x: p.x - mx + cx, y: p.y - my + cy }));
}
const P = a => a.map(([x, y]) => ({ x, y }));
const ps = pts => pts.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
const LET = ['A', 'B', 'C'];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* 方格與點 */
function gridSVG(w, hgt, step, x0 = 0, y0 = 0) {
  let s = `<g class="grid" stroke="#d7e3ee" stroke-width="0.03">`;
  for (let x = x0; x <= w + 1e-6; x += step) s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${hgt}"/>`;
  for (let y = y0; y <= hgt + 1e-6; y += step) s += `<line x1="${x0}" y1="${y}" x2="${w}" y2="${y}"/>`;
  return s + '</g>';
}
function dotsSVG(w, hgt) { let s = '<g fill="#c9d6e3">'; for (let x = 0; x <= w; x++) for (let y = 0; y <= hgt; y++) s += `<circle cx="${x}" cy="${y}" r="0.05"/>`; return s + '</g>'; }
/* 角的小弧 */
function arcPath(p, a, b, r) {
  const a1 = Math.atan2(a.y - p.y, a.x - p.x), a2 = Math.atan2(b.y - p.y, b.x - p.x);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const s = { x: p.x + r * Math.cos(a1), y: p.y + r * Math.sin(a1) }, e = { x: p.x + r * Math.cos(a1 + d), y: p.y + r * Math.sin(a1 + d) };
  return `M${p.x},${p.y} L${s.x},${s.y} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${e.x},${e.y} Z`;
}
/* 頂點標籤放在外角平分線上 */
function labelPos(pts, i, off) { const c = centroid(pts), p = pts[i], v = { x: p.x - c.x, y: p.y - c.y }, l = Math.hypot(v.x, v.y) || 1; return { x: p.x + v.x / l * off, y: p.y + v.y / l * off }; }
function sideLabelPos(pts, i, off) { const a = pts[i], b = pts[(i + 1) % 3], m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, c = centroid(pts), v = { x: m.x - c.x, y: m.y - c.y }, l = Math.hypot(v.x, v.y) || 1; return { x: m.x + v.x / l * off, y: m.y + v.y / l * off }; }

/* ---------------- 角色與插圖 ---------================== */
const COL = ['#e8735a', '#2f9c95', '#f2b84b', '#7b8fd6', '#b65fa8', '#6fb35a'];
function flagSVG(color, on) {
  return `<svg viewBox="0 0 30 36" aria-hidden="true"><line x1="3" y1="2" x2="3" y2="35" stroke="#8a7650" stroke-width="2"/>` +
    (on ? `<polygon points="4,4 28,13 4,22" fill="${color}" stroke="#2b3459" stroke-width="1.5" stroke-linejoin="round"/>`
        : `<polygon points="4,4 28,13 4,22" fill="#fff" stroke="#b9ae95" stroke-width="1.5" stroke-dasharray="3 2"/>`) + `</svg>`;
}
/* 阿角：黃色三角形，有眼睛和腳 */
function akak(x, y, s, mood = 'happy', flip = false) {
  const mouth = mood === 'happy' ? `<path d="M-6,8 Q0,14 6,8" fill="none" stroke="#2b3459" stroke-width="2" stroke-linecap="round"/>`
    : mood === 'worry' ? `<path d="M-6,12 Q0,7 6,12" fill="none" stroke="#2b3459" stroke-width="2" stroke-linecap="round"/>`
    : `<ellipse cx="0" cy="10" rx="3.5" ry="4" fill="#2b3459"/>`;
  const brow = mood === 'worry' ? `<path d="M-11,-6 L-5,-8 M11,-6 L5,-8" stroke="#2b3459" stroke-width="2" stroke-linecap="round"/>` : '';
  return `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">
    <line x1="-8" y1="22" x2="-10" y2="32" stroke="#2b3459" stroke-width="3" stroke-linecap="round"/>
    <line x1="8" y1="22" x2="10" y2="32" stroke="#2b3459" stroke-width="3" stroke-linecap="round"/>
    <polygon points="0,-30 26,22 -26,22" fill="#f6c94c" stroke="#2b3459" stroke-width="3" stroke-linejoin="miter"/>
    ${brow}<circle cx="-7" cy="0" r="3.4" fill="#2b3459"/><circle cx="7" cy="0" r="3.4" fill="#2b3459"/>
    <circle cx="-6" cy="-1.2" r="1.1" fill="#fff"/><circle cx="8" cy="-1.2" r="1.1" fill="#fff"/>
    <circle cx="-13" cy="8" r="3" fill="#f39b8a" opacity=".6"/><circle cx="13" cy="8" r="3" fill="#f39b8a" opacity=".6"/>${mouth}</g>`;
}
function roundedTri(pts, r) {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const p = pts[i], a = pts[(i + 2) % 3], b = pts[(i + 1) % 3];
    const ua = { x: (a.x - p.x) / dist(a, p), y: (a.y - p.y) / dist(a, p) }, ub = { x: (b.x - p.x) / dist(b, p), y: (b.y - p.y) / dist(b, p) };
    const s = { x: p.x + ua.x * r, y: p.y + ua.y * r }, e = { x: p.x + ub.x * r, y: p.y + ub.y * r };
    d += (i ? ' L' : 'M') + `${s.x},${s.y} Q${p.x},${p.y} ${e.x},${e.y}`;
  }
  return d + ' Z';
}
/* 圓圓：圓角告示牌 */
function yuan(x, y, s) {
  const pts = P([[0, -28], [26, 20], [-26, 20]]);
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-3" y="20" width="6" height="22" fill="#9aa3b5" stroke="#2b3459" stroke-width="2"/>
    <path d="${roundedTri(pts, 8)}" fill="#fff" stroke="#d2412f" stroke-width="7" stroke-linejoin="round"/>
    <circle cx="-7" cy="4" r="3" fill="#2b3459"/><circle cx="7" cy="4" r="3" fill="#2b3459"/><path d="M-5,11 Q0,15 5,11" fill="none" stroke="#2b3459" stroke-width="2" stroke-linecap="round"/></g>`;
}
/* 方方鎮長 */
function mayor(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})"><line x1="-8" y1="22" x2="-9" y2="32" stroke="#2b3459" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="22" x2="9" y2="32" stroke="#2b3459" stroke-width="3" stroke-linecap="round"/>
    <rect x="-22" y="-20" width="44" height="42" rx="3" fill="#7b8fd6" stroke="#2b3459" stroke-width="3"/>
    <rect x="-14" y="-36" width="28" height="16" fill="#2b3459"/><rect x="-20" y="-22" width="40" height="4" fill="#2b3459"/>
    <circle cx="-8" cy="-4" r="3" fill="#2b3459"/><circle cx="8" cy="-4" r="3" fill="#2b3459"/>
    <path d="M-10,6 Q0,2 10,6" fill="none" stroke="#2b3459" stroke-width="3"/><path d="M-6,11 Q0,15 6,11" fill="none" stroke="#2b3459" stroke-width="2" stroke-linecap="round"/></g>`;
}
function bug(x, y, s) {
  return `<g transform="translate(${x},${y}) scale(${s})"><circle cx="-12" cy="0" r="7" fill="#8fc36b" stroke="#2b3459" stroke-width="2"/><circle cx="0" cy="-2" r="8" fill="#8fc36b" stroke="#2b3459" stroke-width="2"/><circle cx="13" cy="-5" r="8" fill="#a6d67f" stroke="#2b3459" stroke-width="2"/>
    <circle cx="16" cy="-7" r="1.8" fill="#2b3459"/><path d="M15,-13 L18,-20 M11,-13 L10,-20" stroke="#2b3459" stroke-width="1.6"/></g>`;
}
function flowerArt(x, y, s) {
  let p = ''; for (let i = 0; i < 6; i++) { const a = i * 60 * Math.PI / 180; p += `<circle cx="${(Math.cos(a) * 0.45).toFixed(3)}" cy="${(Math.sin(a) * 0.45).toFixed(3)}" r="0.36" fill="#ef6f6c" stroke="#b8403e" stroke-width="0.04"/>`; }
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M0,0.4 Q0.1,1 0,1.3" stroke="#4f8f3a" stroke-width="0.12" fill="none"/>${p}<circle r="0.28" fill="#f6c94c" stroke="#b8862b" stroke-width="0.04"/></g>`;
}
function bunting(x1, x2, y, n) {
  let s = `<path d="M${x1},${y} Q${(x1 + x2) / 2},${y + 18} ${x2},${y}" fill="none" stroke="#8a7650" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x1 + (x2 - x1) * t, yy = y + 18 * 4 * t * (1 - t) * 0.5 + 1; s += `<polygon points="${x - 9},${yy} ${x + 9},${yy} ${x},${yy + 18}" fill="${COL[i % 6]}" stroke="#2b3459" stroke-width="1.5"/>`; }
  return s;
}
function scene(inner, sky = '#bfe3f1') {
  return `<svg viewBox="0 0 400 260" role="img" aria-hidden="true"><rect width="400" height="260" fill="${sky}"/>
    <circle cx="350" cy="46" r="24" fill="#ffe08a"/><ellipse cx="80" cy="50" rx="34" ry="12" fill="#fff" opacity=".8"/><ellipse cx="230" cy="34" rx="28" ry="10" fill="#fff" opacity=".8"/>
    <path d="M0,190 Q100,160 200,185 T400,180 L400,260 L0,260 Z" fill="#9ccf7a"/><path d="M0,220 Q120,200 240,222 T400,215 L400,260 L0,260 Z" fill="#86bf62"/>${inner}</svg>`;
}

/* ---------------- 狀態（只存在這台裝置） ---------------- */
const STORE = 'akak-triangle-v1';
let S = { name: '', flags: {}, cur: -1 };
try { const raw = localStorage.getItem(STORE); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) { }
function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { } }

/* ---------------- 共用元件 ---------------- */
function msgBox() { return h('div', { class: 'msg', role: 'status' }); }
function say(el, text, type = 'info') { el.className = 'msg ' + type; el.innerHTML = text; }
/* 選擇題：答錯可以再選，答對才往下 */
/* fig：答對後出現的圖片說明（見 figs.js） */
function mcq(q, opts, onRight, fig) {
  const box = h('div', { class: 'mcq' }, h('div', { class: 'q' }, q));
  const list = h('div', { class: 'opts' }); const m = msgBox();
  let done = false;
  opts.forEach(o => {
    const b = h('button', { type: 'button' }, o.t);
    b.addEventListener('click', () => {
      if (done) return;
      if (o.ok) {
        done = true; b.classList.add('right'); list.querySelectorAll('button').forEach(x => x.disabled = true);
        say(m, o.why || '答對了！', 'good'); if (fig && window.figBox) box.append(window.figBox(fig)); onRight && onRight();
      } else { b.classList.add('wrong'); say(m, o.why || '再想想看。', 'warn'); }
    });
    list.append(b);
  });
  box.append(list, m);
  return box;
}
function talkBox(lines) {
  return h('div', { class: 'talk' }, h('b', null, '說說看（說給身邊的同伴聽）'), h('ul', null, lines.map(l => h('li', null, l))));
}

/* ======================================================
   章節內容
   ====================================================== */
const CH = [];

/* ---------- 第 1 章：誰是真正的三角形？ ---------- */
CH.push({
  title: '誰是真正的三角形？', color: COL[0],
  illus: () => scene(`${bunting(20, 380, 18, 9)}${mayor(70, 170, 1)}${yuan(160, 160, 1.05)}
    <path d="M220,120 Q250,108 280,120 L250,190 Z" fill="#f6c16b" stroke="#2b3459" stroke-width="3"/><circle cx="244" cy="135" r="5" fill="#d9573f"/><circle cx="258" cy="150" r="4" fill="#d9573f"/>
    <polygon points="300,130 330,200 312,205" fill="#bde0a8" stroke="#2b3459" stroke-width="3"/>${akak(360, 175, 1, 'surprise')}`),
  story: [
    '形狀鎮一年一度的「三角旗節」快到了！鎮長方方貼出公告：找到真正的三角形、學會三角形的祕密，就能領一面三角旗。',
    '報名處擠滿了想領旗子的形狀。告示牌圓圓舉手：<span class="say">「我也是三角形！」</span>披薩片跳出來：<span class="say">「我尖尖的，我也是！」</span>',
    '阿角翻開筆記本：<span class="say">「三角形要有三條直直的邊、三個尖尖的頂點，而且要圍起來。我們一個一個檢查吧！」</span>'
  ],
  parts: [{ title: '幫報名處檢查', how: '點一張卡片，判斷它是不是三角形。如果不是，要說出原因。', mount: mountSort }],
  think: {
    who: 'akak', text: '那個瘦瘦長長、尖端朝下的形狀，看起來怪怪的，一定不是三角形。',
    fig: () => FIG.anyWay(),
    q: '你同意阿角嗎？',
    opts: [
      { t: '同意，三角形的尖端要朝上。', why: '再看看那張卡片：它有沒有三條直直的邊？有沒有三個頂點？有沒有圍起來？方向和胖瘦會影響嗎？' },
      { t: '不同意，它有三條直直的邊、三個頂點，而且圍起來了，所以是三角形。', ok: true, why: '對！判斷三角形只看「三條直線段首尾相接圍成、有三個頂點」，不看方向，也不看胖瘦。' }
    ]
  },
  talk: ['「我認為＿＿不是三角形，因為＿＿。」', '「它雖然看起來像三角形，可是＿＿。」'],
  bridge: '圓圓知道自己的角是圓的，她笑著說：「沒關係，我的圓角不會刮傷人，我來當啦啦隊！」阿角領到第一面旗子，開心地往草地走去……'
});

function mountSort(el, done) {
  const shapes = [
    { cap: '甲', ans: 'yes', svg: `<polygon points="5,1 9,7 1,7"/>` },
    { cap: '乙', ans: 'round', svg: `<path d="${roundedTri(P([[5, 1], [9, 7], [1, 7]]), 1.6)}"/>` },
    { cap: '丙', ans: 'yes', svg: `<polygon points="1.2,1.4 9,2.6 4.2,7.2"/>` },
    { cap: '丁', ans: 'gap', svg: `<polyline points="4.2,2.2 1,7 9,7 5,1" fill="none"/>` },
    { cap: '戊', ans: 'curve', svg: `<path d="M1.6,2.2 Q5,0 8.4,2.2 L5,7.6 Z"/>` },
    { cap: '己', ans: 'four', svg: `<polygon points="2,1.6 8,1 9,7 1,6.4"/>` },
    { cap: '庚', ans: 'yes', svg: `<polygon points="3.5,3 3.5,6.6 7.4,6.6"/>` },
    { cap: '辛', ans: 'over', svg: `<g fill="none"><line x1="0.4" y1="6.4" x2="9.6" y2="6.4"/><line x1="1.6" y1="7.6" x2="5.8" y2="0.5"/><line x1="8.4" y1="7.6" x2="4.2" y2="0.5"/></g>` }
  ];
  const REASON = { round: '角是圓圓的，沒有尖尖的頂點', gap: '有缺口，沒有圍起來', curve: '有一條邊是彎的，不是直線段', four: '不只三條邊（有四個頂點）', over: '線段超出去了，不是首尾相接' };
  const WHY_YES = '它有三條直直的邊，首尾相接圍起來，有三個頂點。不管方向、大小、胖瘦，都是三角形。';
  const grid = h('div', { class: 'cards' }), panel = h('div', { class: 'choice' }), m = msgBox();
  const state = shapes.map(() => false);
  let sel = -1;
  shapes.forEach((s, i) => {
    const c = h('div', { class: 'card', tabindex: '0', role: 'button', 'aria-label': '形狀 ' + s.cap });
    c.innerHTML = `<svg viewBox="0 0 10 8"><g fill="#fde7a8" stroke="#2b3459" stroke-width="0.28" stroke-linejoin="miter" stroke-linecap="round">${s.svg}</g></svg><div class="cap">${s.cap}</div>`;
    const open = () => { if (state[i]) return; sel = i; grid.querySelectorAll('.card').forEach(x => x.classList.remove('sel')); c.classList.add('sel'); ask(); };
    c.addEventListener('click', open); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    grid.append(c);
  });
  function finish(i, text) {
    state[i] = true; const c = grid.children[i]; c.classList.remove('sel'); c.classList.add('right');
    panel.innerHTML = ''; say(m, `<b>${shapes[i].cap}：</b>${text}`, 'good');
    if (state.every(Boolean)) { say(m, `全部檢查完了！甲、丙、庚是三角形，其他的「看起來像」，但嚴格來說不是三角形。`, 'good'); done(); }
  }
  function ask() {
    const s = shapes[sel]; panel.innerHTML = '';
    panel.append(h('div', null, h('b', null, `形狀${s.cap}是三角形嗎？`)));
    const row = h('div', { class: 'row' });
    row.append(h('button', { class: 'btn teal small', type: 'button', onclick: () => s.ans === 'yes' ? finish(sel, WHY_YES) : say(m, '再仔細看看：它的每一個角都是尖尖的嗎？每一條邊都是直的嗎？有沒有圍起來、有沒有多出來？', 'warn') }, '是三角形'));
    row.append(h('button', { class: 'btn small', type: 'button', onclick: () => s.ans === 'yes' ? say(m, '它的三條邊都是直的，首尾相接圍起來，也有三個頂點喔。方向或胖瘦不一樣，有關係嗎？', 'warn') : reasons() }, '不是三角形'));
    panel.append(row);
  }
  function reasons() {
    const s = shapes[sel];
    panel.append(h('div', { class: 'row' }, h('span', null, '為什麼不是？')));
    const row = h('div', { class: 'row' });
    Object.keys(REASON).forEach(k => row.append(h('button', { class: 'btn ghost small', type: 'button', onclick: () => k === s.ans ? finish(sel, '對，' + REASON[k] + '，所以不是三角形。') : say(m, '這個原因好像不是它的問題。再看看它的角、邊，還有有沒有圍起來。', 'warn') }, REASON[k])));
    panel.append(row);
  }
  el.append(grid, panel, m);
}

/* ---------- 第 2 章：用線段圍住花 ---------- */
CH.push({
  title: '用線段圍住花', color: COL[1],
  illus: () => scene(`${flowerArt(200, 170, 34)}${bug(90, 205, 1.6)}${akak(310, 168, 1, 'happy')}<path d="M250,230 l30,-6" stroke="#e8735a" stroke-width="4"/>`),
  story: [
    '草地中間開著一朵要送去節慶的小紅花。小蟲的肚子咕嚕咕嚕叫，一步一步往花爬過去。',
    '阿角拿出彩帶和小木樁：<span class="say">「我要用直直的線段把花圍起來，不讓小蟲進去！可是……最少要幾條？」</span>'
  ],
  parts: [
    { title: '圍住小紅花', how: '在花的旁邊點一下放木樁，再點下一個位置連成線段。最後點回第一根木樁（橘紅色）就圍起來了。線段不能穿過花。', mount: mountFence },
    { title: '頂點、邊、角在哪裡？', how: '先選「頂點」「邊」或「角」，再點三角形上的位置。九個都找到就完成了。', mount: mountParts }
  ],
  think: {
    who: 'akak', text: '如果三根木樁排成一直線，也是三條線段，一樣可以把花圍起來吧？',
    fig: () => FIG.collinear(),
    q: '你同意阿角嗎？',
    opts: [
      { t: '同意，只要有三條線段就能圍起來。', why: '試著想像三個點排在同一條直線上：線段會疊在一起，中間有沒有空間可以放花？' },
      { t: '不同意，三個點在同一條直線上，線段會疊在一起，圍不出一塊地方。', ok: true, why: '對！三角形的三個頂點不能在同一條直線上，這樣三條線段才能首尾相接，圍出一塊封閉的地方。' }
    ]
  },
  talk: ['「我用了＿＿條線段，因為兩條線段＿＿。」', '「頂點是＿＿的地方，邊是＿＿，角是＿＿。」'],
  bridge: '花保住了！小蟲只好去吃旁邊的嫩草。突然，一陣大風吹來，把阿角吹得翻了好幾個跟斗……'
});

const FL = { x: 6, y: 4, r: 1.0 };
let fenceTri = null; // 第 2 章做出的三角形，給「頂點、邊、角」用
function mountFence(el, done) {
  const svg = svgEl('0 0 12 8'); const box = h('div', { class: 'stage' }); box.append(svg);
  const m = msgBox(), info = h('div', { class: 'readout' });
  let pts = [], closed = false, finished = false;
  const row = h('div', { class: 'row' },
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => { pts = []; closed = false; draw(); say(m, '重新開始。', 'info'); } }, '重來'),
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (closed) closed = false; else pts.pop(); draw(); } }, '退一步'));
  function draw() {
    let s = gridSVG(12, 8, 1);
    if (closed) s += `<polygon points="${ps(pts)}" fill="rgba(242,184,75,.35)"/>`;
    s += `<circle cx="${FL.x}" cy="${FL.y}" r="${FL.r}" fill="none" stroke="#ef6f6c" stroke-width="0.04" stroke-dasharray="0.15 0.12"/>` + flowerArt(FL.x, FL.y - 0.25, 1);
    if (pts.length > 1) s += `<polyline points="${ps(closed ? pts.concat([pts[0]]) : pts)}" fill="none" stroke="#e8735a" stroke-width="0.12" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, i) => { s += `<circle cx="${p.x}" cy="${p.y}" r="${i === 0 && !closed && pts.length > 1 ? 0.26 : 0.18}" fill="${i === 0 ? '#e8735a' : '#2b3459'}" stroke="#fff" stroke-width="0.06"/>`; });
    svg.innerHTML = s;
    const n = pts.length; info.innerHTML = `<span>木樁：${n} 根</span><span>線段：${closed ? n : Math.max(0, n - 1)} 條</span><span>${closed ? '已經圍起來' : '還沒圍起來'}</span>`;
  }
  svg.addEventListener('pointerdown', e => {
    if (closed) { say(m, '已經圍起來了。想再試一次，按「重來」。', 'info'); return; }
    const raw = svgPt(svg, e), p = { x: snap(raw.x, 0.5), y: snap(raw.y, 0.5) }; const n = pts.length;
    if (n >= 2 && dist(p, pts[0]) < 0.6) return tryClose();
    if (n && dist(p, pts[n - 1]) < 0.3) return;
    if (dist(p, FL) <= FL.r) { say(m, '木樁不能插在花上，請點在花的外面。', 'warn'); return; }
    if (n) {
      if (segDist(pts[n - 1], p, FL) <= FL.r) { say(m, '這條線段會穿過花，換個位置。', 'warn'); return; }
      for (let i = 0; i < n - 2; i++) if (segCross(pts[i], pts[i + 1], pts[n - 1], p)) { say(m, '線段不要和前面的線段交叉。', 'warn'); return; }
    }
    if (n >= 8) { say(m, '木樁夠多了！試試看能不能用更少的線段。', 'warn'); return; }
    pts.push(p); draw();
    if (pts.length === 1) say(m, '第一根木樁是橘紅色的。繼續放下一根。', 'info');
  });
  function tryClose() {
    const n = pts.length, a = pts[n - 1], b = pts[0];
    if (n === 2) { closed = true; draw(); say(m, '只有兩根木樁，兩條線段會來回疊在一起，中間圍不出地方，花還在外面。', 'warn'); return; }
    if (segDist(a, b, FL) <= FL.r) { say(m, '回到第一根木樁的線段會穿過花，換個位置。', 'warn'); return; }
    for (let i = 1; i < n - 2; i++) if (segCross(pts[i], pts[i + 1], a, b)) { say(m, '回到起點的線段會和別的線段交叉。', 'warn'); return; }
    closed = true; draw();
    const ar = Math.abs(area(pts));
    if (ar < 0.3) { say(m, '這些木樁幾乎排在同一條直線上，線段疊在一起，圍不出地方。', 'warn'); return; }
    if (!inPoly(FL, pts)) { say(m, '圍起來了，可是花不在裡面！換個位置把花圍住。', 'warn'); return; }
    if (n > 3) { say(m, `花被圍住了，你用了 ${n} 條線段。能不能用更少的線段？按「重來」試試看。`, 'info'); return; }
    fenceTri = pts.map(p => ({ x: p.x, y: p.y }));
    say(m, '花被圍住了！三條線段首尾相接，三根木樁不在同一條直線上，圍成了一個<b>三角形</b>。兩條線段做得到嗎？想一想為什麼不行。', 'good');
    if (!finished) { finished = true; done(); }
  }
  el.append(box, info, row, m); draw();
}

function mountParts(el, done) {
  const svg = svgEl('0 0 12 8'); const box = h('div', { class: 'stage' }); box.append(svg);
  const m = msgBox(); let mode = 'v'; const found = new Set(); let last = null;
  let tri = fenceTri ? fenceTri.slice() : P([[3, 6.5], [9.5, 6], [5, 1.5]]);
  if (area(tri) < 0) tri = [tri[0], tri[2], tri[1]];
  const ITEMS = ['頂點A', '頂點B', '頂點C', '邊AB', '邊BC', '邊CA', '角A', '角B', '角C'];
  const list = h('ul', { class: 'check' }, ITEMS.map(t => h('li', { 'data-k': t }, t)));
  const btns = {};
  const row = h('div', { class: 'row' });
  [['v', '頂點'], ['e', '邊'], ['a', '角']].forEach(([k, t]) => { btns[k] = h('button', { class: 'btn ghost small', type: 'button', onclick: () => { mode = k; upd(); say(m, `現在點三角形上的「${t}」。`, 'info'); } }, t); row.append(btns[k]); });
  function upd() { Object.keys(btns).forEach(k => btns[k].classList.toggle('on', k === mode)); }
  function draw() {
    let s = gridSVG(12, 8, 1) + `<polygon points="${ps(tri)}" fill="rgba(242,184,75,.25)" stroke="#2b3459" stroke-width="0.1" stroke-linejoin="round"/>`;
    if (last) {
      if (last.t === 'v') s += `<circle cx="${tri[last.i].x}" cy="${tri[last.i].y}" r="0.4" fill="rgba(232,115,90,.5)" stroke="#c4553d" stroke-width="0.06"/>`;
      if (last.t === 'e') { const a = tri[last.i], b = tri[(last.i + 1) % 3]; s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#f2b84b" stroke-width="0.32" stroke-linecap="round" opacity=".9"/>`; }
      if (last.t === 'a') s += `<path d="${arcPath(tri[last.i], tri[(last.i + 2) % 3], tri[(last.i + 1) % 3], 0.9)}" fill="rgba(47,156,149,.45)" stroke="#22746f" stroke-width="0.05"/>`;
    }
    tri.forEach((p, i) => { const l = labelPos(tri, i, 0.55); s += `<circle cx="${p.x}" cy="${p.y}" r="0.14" fill="#2b3459"/><text x="${l.x}" y="${l.y + 0.18}" font-size="0.55" text-anchor="middle" font-weight="700" fill="#2b3459">${LET[i]}</text>`; });
    svg.innerHTML = s;
    list.querySelectorAll('li').forEach(li => li.classList.toggle('ok', found.has(li.dataset.k)));
  }
  svg.addEventListener('pointerdown', e => {
    const p = svgPt(svg, e);
    const vi = tri.findIndex(q => dist(q, p) < 0.5);
    let hit = null;
    if (vi >= 0) hit = { t: 'v', i: vi };
    else if (inPoly(p, tri)) { const ai = tri.map((q, i) => ({ i, d: dist(q, p) })).sort((a, b) => a.d - b.d)[0]; if (ai.d < 2) hit = { t: 'a', i: ai.i }; }
    if (!hit) { const ei = [0, 1, 2].map(i => ({ i, d: segDist(tri[i], tri[(i + 1) % 3], p) })).sort((a, b) => a.d - b.d)[0]; if (ei.d < 0.45) hit = { t: 'e', i: ei.i }; }
    if (!hit) { say(m, '點在三角形上面試試看：頂點在轉角，邊是直直的線段，角在轉角的裡面。', 'info'); return; }
    if (hit.t !== mode) { const nm = { v: '頂點', e: '邊', a: '角' }; say(m, `你點到的是一個「${nm[hit.t]}」，現在要找的是「${nm[mode]}」。也可以先把上面的按鈕換成「${nm[hit.t]}」。`, 'warn'); last = hit; draw(); return; }
    last = hit; const i = hit.i, n = LET[i], n2 = LET[(i + 1) % 3], n0 = LET[(i + 2) % 3];
    let key, text;
    if (hit.t === 'v') { key = '頂點' + n; text = `這是<b>頂點 ${n}</b>：邊 ${n0}${n} 和邊 ${n}${n2} 相接的地方。`; }
    if (hit.t === 'e') { key = '邊' + n + n2; text = `這是<b>邊 ${n}${n2}</b>：一條直直的線段，兩端是頂點 ${n} 和頂點 ${n2}。`; }
    if (hit.t === 'a') { key = '角' + n; text = `這是<b>角 ${n}</b>：由邊 ${n}${n0} 和邊 ${n}${n2} 張開形成的。`; }
    found.add(key); draw();
    if (found.size === 9) { say(m, text + '<br>九個都找到了！三角形有 <b>3 個頂點、3 條邊、3 個角</b>。', 'good'); done(); }
    else say(m, text + ` 還有 ${9 - found.size} 個要找。`, 'good');
  });
  el.append(box, row, list, m); upd(); draw();
}

/* ---------- 第 3 章：依邊長分隊 ---------- */
CH.push({
  title: '依邊長分隊', color: COL[2],
  illus: () => scene(`${akak(110, 160, 1, 'worry', false).replace('translate(110,160)', 'translate(110,160) rotate(180)')}${mayor(220, 168, 1)}
    <g transform="translate(300,170)"><polygon points="0,-24 21,12 -21,12" fill="#f2b84b" stroke="#2b3459" stroke-width="2.5"/></g><g transform="translate(350,186) rotate(40)"><polygon points="0,-18 10,10 -10,10" fill="#7b8fd6" stroke="#2b3459" stroke-width="2.5"/></g>
    <rect x="160" y="222" width="110" height="12" fill="#f9e3a5" stroke="#2b3459" stroke-width="2"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<line x1="${165 + i * 11}" y1="222" x2="${165 + i * 11}" y2="${i % 5 ? 227 : 230}" stroke="#2b3459" stroke-width="1.2"/>`).join('')}`),
  story: [
    '阿角頭下腳上地翻倒了，尖尖的角朝下。他擔心地問：<span class="say">「我倒過來了，還是三角形嗎？」</span>',
    '鎮長方方把他扶起來：<span class="say">「當然是！轉個方向，你的邊和頂點都沒有變。」</span>',
    '報名處來了六個三角形，有大有小，有的站著、有的躺著。鎮長說：<span class="say">「遊行要依照『邊長』分隊，請拿尺量一量。」</span>'
  ],
  parts: [
    { title: '量一量，分隊伍', how: '點三角形的邊就能用尺量出長度（1 格＝1 公分）。三條邊都量好，再幫它選隊伍。', mount: mountSideSort },
    { title: '等腰三角形的祕密', how: '拖曳上面的頂點 A，讓兩條邊一樣長，觀察下面的兩個角。', mount: mountIso }
  ],
  think: {
    who: 'akak', text: '等腰三角形的「底」一定在最下面，所以 4 號三角形斜斜的，不是等腰三角形。',
    fig: () => FIG.isoSpin(),
    q: '你同意阿角嗎？',
    opts: [
      { t: '同意，底邊要在下面才是等腰三角形。', why: '量一量 4 號的三條邊：有沒有兩條一樣長？轉一個方向，邊長會改變嗎？' },
      { t: '不同意，4 號有兩條邊一樣長，轉個方向還是等腰三角形；底不一定在下面。', ok: true, why: '對！等腰三角形看的是「有兩條邊一樣長」。兩條一樣長的邊叫「腰」，另一條叫「底」，跟擺放的方向沒有關係。' }
    ]
  },
  talk: ['「它是＿＿三角形，因為我量到＿＿。」', '「正三角形也是等腰三角形，因為＿＿。」'],
  bridge: '隊伍分好了！鎮長拍拍手：「明天，還要依照『角』再排一次隊伍喔。」阿角在筆記本上寫下：要帶直角板……'
});

function mountSideSort(el, done) {
  const T = [
    { s: [3, 3, 3], r: 0, k: 'eq' }, { s: [3, 3, 2], r: 0, k: 'iso' }, { s: [5, 3, 4], r: 12, k: 'sca' },
    { s: [3, 4, 4], r: 105, k: 'iso' }, { s: [2, 2, 2], r: 180, k: 'eq' }, { s: [4, 2, 3], r: -25, k: 'sca' }
  ];
  const NAME = { eq: '三條邊都一樣長', iso: '只有兩條邊一樣長', sca: '三條邊都不一樣長' };
  const grid = h('div', { class: 'cards' }), m = msgBox(); const solved = T.map(() => false);
  T.forEach((t, idx) => {
    const pts = place(fromSides(t.s[0], t.s[1], t.s[2]), t.r, 3.5, 3);
    const meas = [false, false, false];
    const svg = svgEl('0 0 7 6');
    const card = h('div', { class: 'card wide' }); const cap = h('div', { class: 'cap' }, `${idx + 1} 號：點邊來量`);
    const btnRow = h('div', { class: 'row', style: 'justify-content:center;gap:4px' });
    const len = i => r1(dist(pts[i], pts[(i + 1) % 3]));
    function draw() {
      let s = dotsSVG(7, 6) + `<polygon points="${ps(pts)}" fill="${solved[idx] ? '#d9f1ec' : '#fde7a8'}" stroke="#2b3459" stroke-width="0.09" stroke-linejoin="round"/>`;
      for (let i = 0; i < 3; i++) {
        const a = pts[i], b = pts[(i + 1) % 3];
        s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="0.7" data-i="${i}" style="cursor:pointer"/>`;
        if (meas[i]) { const l = sideLabelPos(pts, i, 0.5); s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2f9c95" stroke-width="0.14" stroke-linecap="round" pointer-events="none"/><text x="${l.x}" y="${l.y + 0.2}" font-size="0.6" text-anchor="middle" font-weight="700" fill="#22746f" pointer-events="none">${len(i)}</text>`; }
      }
      svg.innerHTML = s;
      cap.textContent = solved[idx] ? `${idx + 1} 號：${({ eq: '正三角形', iso: '等腰三角形', sca: '三邊不等長' })[t.k]}` : `${idx + 1} 號：已量 ${meas.filter(Boolean).length}/3 條邊`;
    }
    svg.addEventListener('pointerdown', e => {
      const p = svgPt(svg, e); const best = [0, 1, 2].map(i => ({ i, d: segDist(pts[i], pts[(i + 1) % 3], p) })).sort((a, b) => a.d - b.d)[0];
      if (best.d < 0.5) { meas[best.i] = true; draw(); }
    });
    ['eq', 'iso', 'sca'].forEach(k => btnRow.append(h('button', { class: 'btn ghost small', type: 'button', onclick: () => pick(k) }, NAME[k])));
    function pick(k) {
      if (solved[idx]) return;
      if (meas.filter(Boolean).length < 3) { say(m, `${idx + 1} 號還有邊沒量。先用尺把三條邊都量好，再決定。`, 'warn'); return; }
      const L = [len(0), len(1), len(2)].join('、');
      if (k === t.k) {
        solved[idx] = true; card.classList.add('right'); btnRow.remove(); draw();
        const extra = t.k === 'eq' ? '三條邊都一樣長的三角形叫做<b>正三角形</b>。' : t.k === 'iso' ? '有兩條邊一樣長的三角形叫做<b>等腰三角形</b>。' : '三條邊都不一樣長。';
        say(m, `${idx + 1} 號的邊長是 ${L} 公分，${extra}`, 'good');
        if (solved.every(Boolean)) { say(m, '六個三角形都分好隊了！1、5 號是正三角形；2、4 號是等腰三角形；3、6 號三條邊都不一樣長。', 'good'); done(); }
      } else say(m, `${idx + 1} 號量到的邊長是 ${L} 公分。比一比，有幾條邊一樣長？`, 'warn');
    }
    card.append(svg, cap, btnRow); grid.append(card); draw();
  });
  el.append(grid, m);
}

function mountIso(el, done) {
  const svg = svgEl('0 0 12 8'); const box = h('div', { class: 'stage' }); box.append(svg);
  const B = { x: 3, y: 7 }, C = { x: 9, y: 7 }; let A = { x: 4.5, y: 2 }; let drag = false;
  const m = msgBox(), info = h('div', { class: 'readout' }); const made = new Set(); let qShown = false;
  const qbox = h('div');
  function tri() { return [A, B, C]; }
  function draw() {
    const t = tri(), ab = r1(dist(A, B)), ac = r1(dist(A, C)), iso = Math.abs(dist(A, B) - dist(A, C)) < 0.02;
    const aB = Math.round(angleAt(t, 1)), aC = Math.round(angleAt(t, 2)), aA = 180 - aB - aC;
    let s = gridSVG(12, 8, 0.5) + `<polygon points="${ps(t)}" fill="${iso ? 'rgba(47,156,149,.18)' : 'rgba(242,184,75,.25)'}" stroke="#2b3459" stroke-width="0.09" stroke-linejoin="round"/>`;
    s += `<path d="${arcPath(B, C, A, 0.8)}" fill="rgba(232,115,90,.35)"/><path d="${arcPath(C, A, B, 0.8)}" fill="rgba(232,115,90,.35)"/>`;
    if (iso) {
      s += `<path d="${arcPath(A, B, C, 0.7)}" fill="rgba(123,143,214,.4)"/>`;
      const l1 = sideLabelPos(t, 0, 0.55), l2 = sideLabelPos(t, 2, 0.55), l3 = sideLabelPos(t, 1, 0.5);
      s += `<text x="${l1.x}" y="${l1.y}" font-size="0.5" text-anchor="middle" fill="#22746f" font-weight="700">腰 ${ab}</text><text x="${l2.x}" y="${l2.y}" font-size="0.5" text-anchor="middle" fill="#22746f" font-weight="700">腰 ${ac}</text><text x="${l3.x}" y="${l3.y + 0.2}" font-size="0.5" text-anchor="middle" fill="#2b3459">底</text>`;
      s += `<text x="${A.x}" y="${A.y + 1.25}" font-size="0.46" text-anchor="middle" fill="#3b4a96">頂角</text><text x="${B.x + 1.1}" y="${B.y - 0.25}" font-size="0.46" text-anchor="middle" fill="#c4553d">底角</text><text x="${C.x - 1.1}" y="${C.y - 0.25}" font-size="0.46" text-anchor="middle" fill="#c4553d">底角</text>`;
    } else {
      const l1 = sideLabelPos(t, 0, 0.5), l2 = sideLabelPos(t, 2, 0.5);
      s += `<text x="${l1.x}" y="${l1.y}" font-size="0.5" text-anchor="middle" fill="#2b3459">${ab}</text><text x="${l2.x}" y="${l2.y}" font-size="0.5" text-anchor="middle" fill="#2b3459">${ac}</text>`;
    }
    s += `<circle cx="${A.x}" cy="${A.y}" r="0.32" fill="#e8735a" stroke="#fff" stroke-width="0.08" style="cursor:grab"/>`;
    [['A', A, 0, -0.5], ['B', B, -0.4, 0.45], ['C', C, 0.4, 0.45]].forEach(([n, p, dx, dy]) => s += `<text x="${p.x + dx}" y="${p.y + dy}" font-size="0.5" text-anchor="middle" font-weight="700" fill="#2b3459">${n}</text>`);
    svg.innerHTML = s;
    info.innerHTML = `<span class="${iso ? 'hit' : ''}">AB＝${ab} 公分</span><span class="${iso ? 'hit' : ''}">AC＝${ac} 公分</span><span class="${aB === aC ? 'hit' : ''}">角 B＝${aB}°</span><span class="${aB === aC ? 'hit' : ''}">角 C＝${aC}°</span><span>角 A＝${aA}°</span>`;
    return iso;
  }
  function check() {
    const iso = draw();
    if (iso) {
      made.add(A.y);
      if (made.size === 1) say(m, '兩條腰一樣長了！看看兩個<b>底角</b>：一樣大嗎？再把 A 拖到別的高度，做出另一個等腰三角形。', 'good');
      else if (!qShown) { qShown = true; say(m, `你做出了 ${made.size} 種不同的等腰三角形，兩個底角每次都一樣大！`, 'good'); showQ(); }
    } else if (!qShown) say(m, '拖曳頂點 A，讓 AB 和 AC 一樣長。', 'info');
  }
  function showQ() {
    qbox.append(mcq('等腰三角形的兩個底角，有什麼關係？', [
      { t: '兩個底角一樣大。', ok: true, why: '對！等腰三角形的兩條腰一樣長，兩個底角也一樣大。' },
      { t: '左邊的底角比較大。', why: '再看看上面的量角結果：兩條腰一樣長時，角 B 和角 C 是幾度？' },
      { t: '沒有關係，每次都不一樣。', why: '拖曳 A 做出等腰三角形時，角 B 和角 C 有一起改變嗎？' }
    ], () => qbox.append(mcq('1 號是正三角形（三條邊都一樣長）。它也是等腰三角形嗎？', [
      { t: '是，因為它有兩條邊一樣長（其實三條都一樣長）。', ok: true, why: '對！等腰三角形只要有兩條邊一樣長；正三角形三條邊都一樣長，所以也是等腰三角形。正三角形的三個角都是 60 度。' },
      { t: '不是，等腰三角形只能有兩條邊一樣長。', why: '等腰三角形的意思是「至少有兩條邊一樣長」。正三角形有沒有兩條邊一樣長？' }
    ], done, () => FIG.eqIsIso())), () => FIG.baseAngles()));
  }
  svg.addEventListener('pointerdown', e => { const p = svgPt(svg, e); if (dist(p, A) < 0.9) { drag = true; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener('pointermove', e => { if (!drag) return; const p = svgPt(svg, e); A = { x: Math.min(11.5, Math.max(0.5, snap(p.x, 0.5))), y: Math.min(5.5, Math.max(0.5, snap(p.y, 0.5))) }; check(); });
  const end = () => { drag = false; }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  el.append(box, info, m, qbox); check();
}

/* ---------- 第 4 章：依角排隊伍 ---------- */
CH.push({
  title: '依角排隊伍', color: COL[3],
  illus: () => scene(`${mayor(90, 168, 1)}<g transform="translate(160,140)"><polygon points="0,0 0,60 60,60" fill="#f9e3a5" stroke="#2b3459" stroke-width="3"/><rect x="0" y="48" width="12" height="12" fill="none" stroke="#c4553d" stroke-width="2.5"/></g>
    <g transform="translate(290,206)"><path d="M-56,0 A56,56 0 0 1 56,0 Z" fill="rgba(255,255,255,.85)" stroke="#2b3459" stroke-width="2.5"/>${[...Array(19)].map((_, i) => { const a = Math.PI - i * Math.PI / 18; return `<line x1="${50 * Math.cos(a)}" y1="${-50 * Math.sin(a)}" x2="${56 * Math.cos(a)}" y2="${-56 * Math.sin(a)}" stroke="#2b3459" stroke-width="1.4"/>`; }).join('')}</g>${akak(345, 120, 0.8, 'surprise')}`),
  story: [
    '第二天，鎮長方方帶來一塊直角板：<span class="say">「每個角都拿直角板比一比，看看是比直角小、一樣大，還是比直角大。」</span>',
    '比直角小的角叫<b>銳角</b>，和直角一樣大的是<b>直角</b>，比直角大的叫<b>鈍角</b>。',
    '阿角看著三角形想：<span class="say">「一個三角形有三個角，要看幾個角，才能決定它排哪一隊呢？」</span>'
  ],
  parts: [
    { title: '用直角板比一比', how: '點三角形裡靠近轉角的地方，直角板就會靠上去比。檢查好角，再幫三角形選隊伍。', mount: mountAngleSort },
    { title: '挑戰：兩個直角的三角形？', how: '拖曳三個頂點，試著做出不同的三角形，看看角會怎麼變。', mount: mountAngleLab }
  ],
  think: {
    who: 'akak', text: '我找到一個銳角，所以這個三角形一定是銳角三角形！',
    fig: () => FIG.biggestAngle(),
    q: '你同意阿角嗎？',
    opts: [
      { t: '同意，有銳角就是銳角三角形。', why: '想一想直角三角形和鈍角三角形：它們有沒有銳角？' },
      { t: '不同意，銳角三角形要三個角都是銳角；每個三角形至少都有兩個銳角。', ok: true, why: '對！直角三角形和鈍角三角形裡也有銳角。要看最大的那個角：有直角是直角三角形，有鈍角是鈍角三角形，三個都是銳角才是銳角三角形。' }
    ]
  },
  talk: ['「它是＿＿三角形，因為最大的角＿＿。」', '「一個三角形最多只有一個直角，因為＿＿。」'],
  bridge: '隊伍排好了，可是倉庫裡的三角旗不夠發！鎮長方方說：「沒關係，請大家自己畫三角旗。」'
});

function mountAngleSort(el, done) {
  const T = [
    { n: '甲', A: [70, 60, 50], r: 10, k: 'acute' }, { n: '乙', A: [90, 50, 40], r: 0, k: 'right' }, { n: '丙', A: [115, 40, 25], r: -8, k: 'obtuse' },
    { n: '丁', A: [45, 90, 45], r: 135, k: 'right' }, { n: '戊', A: [30, 120, 30], r: 0, k: 'obtuse' }, { n: '己', A: [60, 60, 60], r: 20, k: 'acute' }
  ];
  const NAME = { acute: '銳角三角形', right: '直角三角形', obtuse: '鈍角三角形' };
  const grid = h('div', { class: 'cards' }), m = msgBox(); const solved = T.map(() => false);
  const word = a => Math.abs(a - 90) < 0.5 ? '和直角一樣大（直角）' : a < 90 ? '比直角小（銳角）' : '比直角大（鈍角）';
  T.forEach((t, idx) => {
    let pts = place(fromAngles(t.A[0], t.A[1], t.A[2], 5), t.r, 3.5, 3.1);
    const ang = [0, 1, 2].map(i => angleAt(pts, i));
    const chk = [false, false, false]; let cur = -1;
    const svg = svgEl('0 0 7 6'); const card = h('div', { class: 'card wide' }); const cap = h('div', { class: 'cap' });
    const btnRow = h('div', { class: 'row', style: 'justify-content:center;gap:4px' });
    function draw() {
      let s = `<polygon points="${ps(pts)}" fill="${solved[idx] ? '#d9f1ec' : '#fde7a8'}" stroke="#2b3459" stroke-width="0.09" stroke-linejoin="round"/>`;
      for (let i = 0; i < 3; i++) if (chk[i]) {
        const a = Math.round(ang[i]); const col = Math.abs(ang[i] - 90) < 0.5 ? '#c4553d' : ang[i] > 90 ? '#b65fa8' : '#2f9c95';
        s += `<path d="${arcPath(pts[i], pts[(i + 2) % 3], pts[(i + 1) % 3], 0.6)}" fill="${col}" opacity=".45"/>`;
        const l = labelPos(pts, i, 0.5); s += `<text x="${l.x}" y="${l.y + 0.18}" font-size="0.52" text-anchor="middle" font-weight="700" fill="${col}">${a}°</text>`;
      }
      if (cur >= 0) { /* 直角板：沿著一條邊放，另一邊垂直 */
        const p = pts[cur], q = pts[(cur + 1) % 3], o = pts[(cur + 2) % 3]; const u = { x: (q.x - p.x) / dist(p, q), y: (q.y - p.y) / dist(p, q) };
        let v = { x: -u.y, y: u.x }; if ((o.x - p.x) * v.x + (o.y - p.y) * v.y < 0) v = { x: u.y, y: -u.x };
        const L = 1.5, a1 = { x: p.x + u.x * L, y: p.y + u.y * L }, a2 = { x: p.x + v.x * L, y: p.y + v.y * L };
        s += `<polygon points="${ps([p, a1, a2])}" fill="rgba(123,143,214,.28)" stroke="#3b4a96" stroke-width="0.06" stroke-dasharray="0.12 0.08"/>`;
        s += `<polyline points="${ps([{ x: p.x + u.x * 0.3, y: p.y + u.y * 0.3 }, { x: p.x + u.x * 0.3 + v.x * 0.3, y: p.y + u.y * 0.3 + v.y * 0.3 }, { x: p.x + v.x * 0.3, y: p.y + v.y * 0.3 }])}" fill="none" stroke="#3b4a96" stroke-width="0.05"/>`;
      }
      svg.innerHTML = s;
      cap.textContent = solved[idx] ? `${t.n}：${NAME[t.k]}` : `${t.n}：已檢查 ${chk.filter(Boolean).length}/3 個角`;
    }
    svg.addEventListener('pointerdown', e => {
      const p = svgPt(svg, e); const near = [0, 1, 2].map(i => ({ i, d: dist(pts[i], p) })).sort((a, b) => a.d - b.d)[0];
      if (near.d > 2.2) return;
      cur = near.i; chk[cur] = true; draw();
      say(m, `${t.n} 的這個角${word(ang[cur])}。`, 'info');
    });
    Object.keys(NAME).forEach(k => btnRow.append(h('button', { class: 'btn ghost small', type: 'button', onclick: () => pick(k) }, NAME[k])));
    function pick(k) {
      if (solved[idx]) return;
      const done3 = chk.every(Boolean), seen = [0, 1, 2].filter(i => chk[i]);
      const hasR = seen.some(i => Math.abs(ang[i] - 90) < 0.5), hasO = seen.some(i => ang[i] > 90.5);
      let ok = false, text;
      if (k === 'right') { if (hasR && t.k === 'right') { ok = true; text = '你找到一個直角，有一個直角就是<b>直角三角形</b>。'; } else text = seen.length < 3 ? '你檢查過的角裡還沒有直角。先把角都比一比。' : '三個角都比過了，沒有一個和直角一樣大。'; }
      if (k === 'obtuse') { if (hasO && t.k === 'obtuse') { ok = true; text = '你找到一個比直角大的角，有一個鈍角就是<b>鈍角三角形</b>。'; } else text = seen.length < 3 ? '你檢查過的角裡還沒有鈍角。先把角都比一比。' : '三個角都比過了，沒有比直角大的角。'; }
      if (k === 'acute') {
        if (!done3) text = '銳角三角形要「三個角都是銳角」。還有角沒有檢查喔。';
        else if (t.k === 'acute') { ok = true; text = '三個角都比直角小，三個都是銳角，所以是<b>銳角三角形</b>。'; }
        else text = '三個角都檢查過了，有一個角不是銳角，再看看它是直角還是鈍角。';
      }
      if (ok) { solved[idx] = true; card.classList.add('right'); btnRow.remove(); cur = -1; draw(); say(m, `${t.n}：${text}`, 'good'); if (solved.every(Boolean)) { say(m, '六個三角形都排好隊了！丁和戊很特別：丁是直角三角形，也是等腰三角形；戊是鈍角三角形，也是等腰三角形。', 'good'); done(); } }
      else say(m, `${t.n}：${text}`, 'warn');
    }
    card.append(svg, cap, btnRow); grid.append(card); draw();
  });
  el.append(grid, m);
}

function mountAngleLab(el, done) {
  const svg = svgEl('0 0 12 8'); const box = h('div', { class: 'stage' }); box.append(svg);
  let pts = P([[3, 6.5], [9, 6.5], [5, 2]]); let drag = -1; const goal = { right: false, obtuse: false };
  const m = msgBox(), info = h('div', { class: 'readout' }), list = h('ul', { class: 'check' });
  const qbox = h('div'); let qShown = false, tries = 0, closest = 0;
  const TRY_NEED = 4;
  const giveUp = h('button', { class: 'btn small', type: 'button', disabled: true, onclick: () => { if (qShown) return; qShown = true; giveUp.disabled = true; draw(); explain(); } }, '我試過了，做不出兩個直角');
  const angs = () => [0, 1, 2].map(i => angleAt(pts, i));
  const isR = a => Math.abs(a - 90) < 0.5;
  function draw() {
    const a = angs(), nR = a.filter(isR).length, nO = a.filter(x => x > 90.5).length;
    let s = gridSVG(12, 8, 0.5);
    /* 有一個直角時：在另一個底角畫一條「如果它也是直角」的虛線，讓學生看到兩條邊會平行 */
    const ri = a.findIndex(isR);
    if (ri >= 0 && goal.right && goal.obtuse) {
      const others = [0, 1, 2].filter(i => i !== ri).sort((x, y) => a[y] - a[x]); const j = others[0], k = others[1];
      const R = pts[ri], J = pts[j], K = pts[k];
      const u = { x: (J.x - R.x) / dist(R, J), y: (J.y - R.y) / dist(R, J) }; // 底邊方向（直角頂點 → 另一個頂點）
      const up = { x: (K.x - R.x) / dist(R, K), y: (K.y - R.y) / dist(R, K) }; // 直角那條邊的方向
      const far = 14;
      s += `<line x1="${R.x}" y1="${R.y}" x2="${R.x + up.x * far}" y2="${R.y + up.y * far}" stroke="#2b3459" stroke-width="0.06" stroke-dasharray="0.25 0.18" opacity=".7"/>`;
      s += `<line x1="${J.x}" y1="${J.y}" x2="${J.x + up.x * far}" y2="${J.y + up.y * far}" stroke="#e8735a" stroke-width="0.09" stroke-dasharray="0.3 0.2"/>`;
      const q = { x: J.x + up.x * 1.2, y: J.y + up.y * 1.2 };
      s += `<polyline points="${ps([{ x: J.x + up.x * 0.4, y: J.y + up.y * 0.4 }, { x: J.x + up.x * 0.4 - u.x * 0.4, y: J.y + up.y * 0.4 - u.y * 0.4 }, { x: J.x - u.x * 0.4, y: J.y - u.y * 0.4 }])}" fill="none" stroke="#e8735a" stroke-width="0.05"/>`;
      s += `<text x="${q.x + 0.25}" y="${q.y}" font-size="0.38" fill="#c4553d" font-weight="700">如果這裡也是直角……</text>`;
    }
    s += `<polygon points="${ps(pts)}" fill="rgba(242,184,75,.25)" stroke="#2b3459" stroke-width="0.09" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => {
      const col = isR(a[i]) ? '#c4553d' : a[i] > 90 ? '#b65fa8' : '#2f9c95';
      s += `<path d="${arcPath(p, pts[(i + 2) % 3], pts[(i + 1) % 3], 0.7)}" fill="${col}" opacity=".4"/>`;
      const l = labelPos(pts, i, 0.6); s += `<text x="${l.x}" y="${l.y + 0.15}" font-size="0.48" text-anchor="middle" font-weight="700" fill="${col}">${Math.round(a[i])}°</text>`;
      s += `<circle cx="${p.x}" cy="${p.y}" r="0.3" fill="#e8735a" stroke="#fff" stroke-width="0.08"/>`;
    });
    svg.innerHTML = s;
    info.innerHTML = `<span>直角：${nR} 個</span><span>鈍角：${nO} 個</span><span>銳角：${3 - nR - nO} 個</span>`;
    if (nR >= 1) goal.right = true; if (nO >= 1) goal.obtuse = true;
    list.innerHTML = '';
    [['right', '做出一個直角三角形', goal.right], ['obtuse', '做出一個鈍角三角形', goal.obtuse], ['two', `挑戰：讓兩個角都變成直角（試了 ${tries} 次）`, tries >= TRY_NEED]].forEach(([k, t, ok]) => list.append(h('li', { class: ok ? 'ok' : '' }, t)));
    giveUp.disabled = qShown || tries < TRY_NEED;
  }
  function explain() {
    say(m, '你試了好幾次，對不對？想像角 B 已經是直角，再讓角 C 也變成直角：從 B 和 C 往上的兩條邊會變成兩條<b>平行線</b>，延伸多遠都碰不到，第三個頂點就做不出來，三角形圍不起來。', 'info');
    qbox.append(figBox(FIG.twoRight()));
    qbox.append(mcq('一個三角形最多可以有幾個直角？', [{ t: '0 個', why: '直角三角形就有一個直角喔。' }, { t: '1 個', ok: true, why: '對！最多只有一個直角。' }, { t: '2 個', why: '兩個直角的話，兩條邊會平行，圍不起來。' }, { t: '3 個', why: '三個直角，那就圍不出三角形了。' }],
      () => qbox.append(mcq('一個三角形最多可以有幾個鈍角？', [{ t: '1 個', ok: true, why: '對！鈍角比直角還大，兩個鈍角的邊張得更開，更不可能碰在一起。' }, { t: '2 個', why: '兩個直角都做不到了，兩個比直角還大的角呢？' }, { t: '3 個', why: '試著把兩個角都拖成鈍角看看，做得到嗎？' }], done, () => FIG.biggestAngle())), () => FIG.right34()));
  }
  function feedback() {
    if (qShown) return;
    const a = angs(), nR = a.filter(isR).length;
    if (!(goal.right && goal.obtuse)) {
      if (goal.right && !goal.obtuse) say(m, '做出直角三角形了！再試試做出鈍角三角形。', 'good');
      else if (goal.obtuse && !goal.right) say(m, '做出鈍角三角形了！再試試做出直角三角形（可以沿著格線拖）。', 'good');
      return;
    }
    if (tries === 0) { say(m, '直角三角形和鈍角三角形都做出來了。<b>挑戰：</b>能不能讓<b>兩個角</b>都變成直角？先做出一個直角，再拖別的頂點試試看。', 'info'); return; }
    const second = nR >= 1 ? Math.max(...a.filter((x, i) => i !== a.findIndex(isR))) : 0;
    closest = Math.max(closest, second);
    if (nR >= 1 && second >= 75) say(m, `已經有一個直角了，另一個角是 ${Math.round(second)}°，快要變成直角了……看看橘色虛線：第三個頂點要跑到哪裡去？`, 'info');
    else if (nR >= 1) say(m, `有一個直角了。看看橘色虛線：如果另一個角也變成直角，那條邊會怎麼走？（試了 ${tries} 次）`, 'info');
    else say(m, `先做出一個直角，再試著讓另一個角也變成直角。（試了 ${tries} 次）`, 'info');
    if (tries >= TRY_NEED) say(m, m.innerHTML + '<br>試了好幾次都做不到嗎？可以按下面的按鈕。', 'info');
  }
  svg.addEventListener('pointerdown', e => { if (qShown) return; const p = svgPt(svg, e); const n = pts.map((q, i) => ({ i, d: dist(q, p) })).sort((a, b) => a.d - b.d)[0]; if (n.d < 0.9) { drag = n.i; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener('pointermove', e => {
    if (drag < 0) return; const p = svgPt(svg, e); const q = { x: Math.min(11.5, Math.max(0.5, snap(p.x, 0.5))), y: Math.min(7.5, Math.max(0.5, snap(p.y, 0.5))) };
    const np = pts.slice(); np[drag] = q; if (Math.abs(area(np)) < 0.5) return; pts = np; draw();
  });
  const end = () => { if (drag < 0) return; drag = -1; const before = goal.right && goal.obtuse; draw(); if (before && goal.right && goal.obtuse) tries++; draw(); feedback(); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  el.append(box, info, list, h('div', { class: 'row' }, giveUp), m, qbox); draw(); say(m, '拖曳橘紅色的頂點，看看三個角怎麼變化。', 'info');
}

/* ---------- 第 5 章：自己畫三角旗 ---------- */
CH.push({
  title: '自己畫三角旗', color: COL[4],
  illus: () => scene(`<rect x="90" y="120" width="160" height="100" fill="#fff" stroke="#2b3459" stroke-width="3"/>${[...Array(9)].map((_, i) => `<line x1="${90 + i * 20}" y1="120" x2="${90 + i * 20}" y2="220" stroke="#cfe0ee"/>`).join('')}${[...Array(5)].map((_, i) => `<line x1="90" y1="${120 + i * 20}" x2="250" y2="${120 + i * 20}" stroke="#cfe0ee"/>`).join('')}
    <polygon points="110,200 190,200 110,140" fill="none" stroke="#e8735a" stroke-width="4"/><rect x="110" y="188" width="12" height="12" fill="none" stroke="#e8735a" stroke-width="2"/>
    <rect x="80" y="228" width="180" height="12" fill="#f9e3a5" stroke="#2b3459" stroke-width="2"/>${akak(320, 168, 1, 'happy')}`),
  story: [
    '倉庫裡的旗子不夠發，鎮長方方發下方格紙、直尺和量角器。',
    '<span class="say">「每一面旗子都有規定的尺寸。畫的時候，每一步都要想一想：我為什麼這樣畫？」</span>',
    '阿角拿起筆：<span class="say">「依角分，有銳角、直角、鈍角三角形；依邊分，有三邊不等長、等腰、正三角形。每一種我都要畫一面！」</span>'
  ],
  parts: [{ title: '照規定畫七面三角旗', how: '拖曳三個頂點畫出三角旗（1 格＝1 公分）。下面會即時顯示邊長和角度。判斷看的是畫面上顯示的數字：要 5.0 就要剛好顯示 5.0。', mount: mountBuild }],
  think: {
    who: 'akak', text: '兩條腰都是 5 公分的等腰三角形，畫出來一定長得一模一樣。',
    fig: () => FIG.isoAnim(),
    q: '你同意阿角嗎？',
    opts: [
      { t: '同意，腰一樣長，三角形就一樣。', why: '看看你剛才畫的兩面等腰三角旗：腰都是 5 公分，它們長得一樣嗎？' },
      { t: '不同意，兩條腰一樣是 5 公分，但兩腰張開的角度（頂角）不同，畫出來就不一樣。', ok: true, why: '對！只知道兩條腰的長度還不夠，頂角的大小也會影響三角形的樣子。' }
    ]
  },
  talk: ['「我先畫＿＿，是因為＿＿。」', '「我用＿＿確認了＿＿。」'],
  bridge: '三角旗都畫好了！小蟲指著其中兩面說：「這兩面長得一模一樣，一定是雙胞胎！」阿角歪著頭：「看起來一樣，就真的一樣嗎？」'
});

function mountBuild(el, done) {
  const svg = svgEl('0 0 12 8'); const box = h('div', { class: 'stage' }); box.append(svg);
  const m = msgBox(), info = h('div', { class: 'readout' }), taskBox = h('div', { class: 'msg info' }), qbox = h('div');
  const prog = h('ul', { class: 'check' }), gallery = h('div', { class: 'gallery' });
  let pts, drag = -1, task = 0, locked = false, isoApex = null, fails = 0;
  /* 判斷用「畫面上顯示的數字」：顯示 4.9 就是 4.9，不會當成 5 */
  const D = v => r1(v), DA = v => Math.round(v);
  const exactRight = a => Math.abs(a - 90) < 0.5;
  function apexOf(L) { for (let i = 0; i < 3; i++) if (D(L[(i + 2) % 3]) === 5 && D(L[i]) === 5) return i; return -1; }
  const TASKS = [
    { key: '直角', group: '依角', t: '任務 1：畫一面<b>直角三角形</b>旗，夾著直角的兩條邊分別是 <b>3 公分</b>和 <b>4 公分</b>。', start: [[2, 6.5], [8, 6.5], [4, 2.5]],
      ok: (L, A) => [0, 1, 2].some(i => exactRight(A[i]) && [D(L[(i + 2) % 3]), D(L[i])].sort((a, b) => a - b).join() === '3,4'),
      hint: (L, A) => A.some(exactRight) ? '直角有了！再把夾著直角的兩條邊調成 3.0 和 4.0 公分。' : '先做出一個直角：可以讓一條邊沿著橫的格線、一條邊沿著直的格線。',
      q: ['畫直角三角旗時，為什麼要先確定有一個直角？', [{ t: '因為直角三角形一定要有一個直角，先畫直角，再量兩條邊。', ok: true, why: '對！先做出直角，再在兩條邊上量出 3 公分和 4 公分，最後連起來。' }, { t: '因為直角比較好畫。', why: '想想「直角三角形」這個名字，它最重要的條件是什麼？' }, { t: '因為三條邊要一樣長。', why: '直角三角形的三條邊不一定一樣長喔。' }], () => FIG.right34()],
      good: '直角三角旗完成！第三條邊量起來是 5 公分。' },
    { key: '銳角', group: '依角', t: '任務 2：畫一面<b>銳角三角形</b>旗：三個角都要比直角小。', start: [[2, 6.5], [9, 6.5], [1, 4]],
      ok: (L, A) => Math.max(...A) < 89.5,
      hint: (L, A) => `現在最大的角是 ${DA(Math.max(...A))}°，${Math.max(...A) > 90.5 ? '是鈍角' : '是直角'}。讓三個角都小於 90°。`,
      q: null, good: '銳角三角旗完成！三個角都比直角小。' },
    { key: '鈍角', group: '依角', t: '任務 3：畫一面<b>鈍角三角形</b>旗：要有一個角比直角大。', start: [[2, 6.5], [8, 6.5], [5, 2]],
      ok: (L, A) => Math.max(...A) > 90.5,
      hint: (L, A) => `現在最大的角是 ${DA(Math.max(...A))}°。把一個頂點往旁邊拉，讓一個角張得比直角還開。`,
      q: ['怎麼確定它是鈍角三角形？', [{ t: '用直角板比一比，有一個角比直角大。', ok: true, why: '對！有一個角比直角大（鈍角），就是鈍角三角形。' }, { t: '三個角都比直角大。', why: '三角形最多只能有一個鈍角喔。' }, { t: '看起來扁扁的就是。', why: '要用直角板或量角器確認，不能只靠感覺。' }], () => FIG.obtuseCheck()],
      good: '鈍角三角旗完成！' },
    { key: '三邊不等長', group: '依邊', t: '任務 4：畫一面<b>三條邊都不一樣長</b>的三角旗。', start: [[2, 6.5], [8, 6.5], [5, 2]],
      ok: (L) => new Set(L.map(D)).size === 3,
      hint: (L) => `現在的邊長是 ${L.map(D).join('、')} 公分，有兩條一樣長。移動一個頂點，讓三條邊都不一樣長。`,
      q: null, good: '三邊不等長的三角旗完成！' },
    { key: '等腰', group: '依邊', t: '任務 5：畫一面<b>等腰三角形</b>旗，兩條腰都要剛好 <b>5.0 公分</b>。', start: [[2, 6.5], [9, 6.5], [6, 3]],
      ok: (L) => apexOf(L) >= 0,
      hint: (L) => `現在的邊長是 ${L.map(v => D(v).toFixed(1)).join('、')} 公分。兩條腰都要顯示 <b>5.0</b>，4.9 或 5.1 都還不行。` + (fails >= 3 ? '<br>提示：從頂點往旁邊 3 格、往下 4 格，量起來剛好 5 公分！' : ''),
      q: ['兩條腰都要畫 5 公分，是因為？', [{ t: '等腰三角形有兩條邊一樣長，這兩條邊叫做腰。', ok: true, why: '對！兩條腰從同一個頂點出發，都量 5 公分。' }, { t: '因為三條邊都要 5 公分。', why: '三條邊都一樣長，那是正三角形喔。' }, { t: '因為底一定要最長。', why: '底不一定最長，等腰三角形看的是「兩條腰一樣長」。' }], () => FIG.isoLegs()],
      good: '等腰三角旗完成！兩條腰都是 5.0 公分。' },
    { key: '等腰（不一樣）', group: '依邊', t: '任務 6：再畫一面兩條腰<b>也是 5.0 公分</b>，但是<b>長得不一樣</b>的等腰三角旗。', start: [[2, 6.5], [9, 6.5], [6, 3]],
      ok: (L, A) => { const i = apexOf(L); return i >= 0 && Math.abs(A[i] - isoApex) > 5; },
      hint: (L, A) => { const i = apexOf(L); return i >= 0 ? `兩條腰都是 5.0 了，可是頂角 ${DA(A[i])}° 和上一面（${DA(isoApex)}°）差不多。讓兩條腰張開的角度不一樣。` : `兩條腰都要顯示 5.0 公分（現在是 ${L.map(v => D(v).toFixed(1)).join('、')}）。` + (fails >= 3 ? '<br>提示：從頂點往旁邊 4 格、往下 3 格，也剛好 5 公分！' : ''); },
      q: null, good: '兩面等腰三角旗的腰都是 5.0 公分，可是頂角不一樣，形狀就不一樣！' },
    { key: '正三角形', group: '依邊', t: '任務 7（挑戰）：畫一面<b>正三角形</b>旗，每條邊都是 <b>4.0 公分</b>。提示：先畫一條 4 公分的底，再找第三個頂點。', start: [[2, 6.5], [6, 6.5], [7, 3]],
      ok: (L) => L.every(l => D(l) === 4),
      hint: (L) => `現在的邊長是 ${L.map(v => D(v).toFixed(1)).join('、')} 公分，三條都要是 4.0。` + (fails >= 3 ? '<br>提示：第三個頂點放在底邊正中間的上方，大約 3.5 格高。' : ''),
      q: ['畫好正三角旗以後，可以怎麼確認？', [{ t: '量三條邊都一樣長，或量三個角都是 60 度。', ok: true, why: '對！正三角形三條邊一樣長，三個角也都是 60 度。' }, { t: '看起來尖尖的就可以。', why: '看起來的感覺不一定準，要用尺或量角器確認。' }, { t: '只量一條邊就夠了。', why: '一條邊 4 公分，另外兩條呢？' }], () => FIG.equi60()],
      good: '正三角旗完成！三條邊都是 4.0 公分。量角器量起來三個角都差不多是 60 度（方格點上只能畫到很接近，真正的正三角形三個角都是 60 度）。' }
  ];
  function lens() { return [0, 1, 2].map(i => dist(pts[i], pts[(i + 1) % 3])); }
  function angs() { return [0, 1, 2].map(i => angleAt(pts, i)); }
  function load(i) { task = i; locked = false; fails = 0; pts = P(TASKS[i].start); taskBox.innerHTML = TASKS[i].t; say(m, '拖曳橘紅色的頂點。', 'info'); renderProg(); draw(); }
  function renderProg() {
    prog.innerHTML = '';
    TASKS.forEach((t, i) => prog.append(h('li', { class: i < task || (i === task && locked) ? 'ok' : '' }, `${t.group}：${t.key}`)));
  }
  function draw() {
    const L = lens(), A = angs(), T = TASKS[task];
    let s = gridSVG(12, 8, 0.5).replace('stroke="#d7e3ee"', 'stroke="#eef3f8"') + gridSVG(12, 8, 1);
    s += `<polygon points="${ps(pts)}" fill="${locked ? 'rgba(182,95,168,.25)' : 'rgba(242,184,75,.25)'}" stroke="#2b3459" stroke-width="0.09" stroke-linejoin="round"/>`;
    for (let i = 0; i < 3; i++) {
      const l = sideLabelPos(pts, i, 0.48); s += `<text x="${l.x}" y="${l.y + 0.16}" font-size="0.46" text-anchor="middle" fill="#22746f" font-weight="700">${D(L[i]).toFixed(1)}</text>`;
      if (exactRight(A[i])) { const p = pts[i], u = pts[(i + 1) % 3], w = pts[(i + 2) % 3]; const k = 0.35, a1 = { x: p.x + (u.x - p.x) / dist(p, u) * k, y: p.y + (u.y - p.y) / dist(p, u) * k }, a2 = { x: p.x + (w.x - p.x) / dist(p, w) * k, y: p.y + (w.y - p.y) / dist(p, w) * k }; s += `<polyline points="${ps([a1, { x: a1.x + a2.x - p.x, y: a1.y + a2.y - p.y }, a2])}" fill="none" stroke="#c4553d" stroke-width="0.06"/>`; }
      const lp = labelPos(pts, i, 0.58); s += `<text x="${lp.x}" y="${lp.y + 0.16}" font-size="0.46" text-anchor="middle" font-weight="700" fill="#2b3459">${LET[i]}</text>`;
      s += `<circle cx="${pts[i].x}" cy="${pts[i].y}" r="0.28" fill="${locked ? '#b65fa8' : '#e8735a'}" stroke="#fff" stroke-width="0.08"/>`;
    }
    svg.innerHTML = s;
    info.innerHTML = `<span>AB＝${D(L[0]).toFixed(1)}</span><span>BC＝${D(L[1]).toFixed(1)}</span><span>CA＝${D(L[2]).toFixed(1)} 公分</span><span>∠A＝${DA(A[0])}°</span><span>∠B＝${DA(A[1])}°</span><span>∠C＝${DA(A[2])}°</span>`;
  }
  function thumb(name) {
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs) - 0.4, y0 = Math.min(...ys) - 0.4, w = Math.max(...xs) - x0 + 0.4, hh = Math.max(...ys) - y0 + 0.4;
    const d = h('div', { class: 'thumb' }); d.innerHTML = `<svg viewBox="${x0} ${y0} ${w} ${hh}"><polygon points="${ps(pts)}" fill="${COL[gallery.children.length % 6]}" stroke="#2b3459" stroke-width="0.12" stroke-linejoin="round"/></svg><span>${name}</span>`;
    gallery.append(d);
  }
  function check() {
    const L = lens(), A = angs(), T = TASKS[task];
    if (!T.ok(L, A)) { fails++; say(m, T.hint(L, A), 'warn'); return; }
    locked = true; draw(); renderProg(); say(m, T.good, 'good'); thumb(T.key + (T.key.startsWith('等腰') ? `（頂角 ${DA(A[apexOf(L)])}°）` : ''));
    if (task === 4) isoApex = A[apexOf(L)];
    const next = () => { if (task < TASKS.length - 1) qbox.append(h('div', { class: 'row' }, h('button', { class: 'btn teal', type: 'button', onclick: e => { qbox.innerHTML = ''; load(task + 1); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, '下一個任務 →'))); else { say(m, '七面三角旗都畫好了！依邊：三邊不等長、等腰、正三角形；依角：銳角、直角、鈍角。', 'good'); done(); } };
    if (T.q) qbox.append(mcq(T.q[0], T.q[1], next, T.q[2])); else next();
  }
  svg.addEventListener('pointerdown', e => { if (locked) return; const p = svgPt(svg, e); const n = pts.map((q, i) => ({ i, d: dist(q, p) })).sort((a, b) => a.d - b.d)[0]; if (n.d < 0.9) { drag = n.i; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener('pointermove', e => { if (drag < 0 || locked) return; const p = svgPt(svg, e); const q = { x: Math.min(11.5, Math.max(0.5, snap(p.x, 0.5))), y: Math.min(7.5, Math.max(0.5, snap(p.y, 0.5))) }; const np = pts.slice(); np[drag] = q; if (Math.abs(area(np)) < 0.5) return; pts = np; draw(); });
  const end = () => { if (drag >= 0) { drag = -1; check(); } }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  el.append(prog, taskBox, box, info, m, qbox, h('div', { class: 'lbl' }, '我的三角旗收藏'), gallery); load(0);
}

/* ---------- 第 6 章：雙胞胎旗子（全等） ---------- */
CH.push({
  title: '雙胞胎旗子', color: COL[5],
  illus: () => scene(`${bug(70, 210, 1.5)}<g transform="translate(170,150)"><polygon points="0,-40 45,30 -30,30" fill="#7b8fd6" stroke="#2b3459" stroke-width="3"/></g><g transform="translate(260,150) scale(-1,1)"><polygon points="0,-40 45,30 -30,30" fill="#b65fa8" stroke="#2b3459" stroke-width="3"/></g>${akak(345, 172, 0.9, 'surprise')}`),
  story: [
    '兩面三角旗並排放著，好像一對雙胞胎。小蟲說：<span class="say">「它們一定一模一樣！」</span>',
    '阿角說：<span class="say">「我們把它們疊起來看看！只能移動、旋轉、翻面，不能把旗子拉大或縮小喔。」</span>',
    '如果兩個三角形可以完全疊在一起，它們就是<b>全等</b>的三角形。'
  ],
  parts: [{ title: '疊疊看', how: '拖曳紫色的三角形，用「旋轉」滑桿和「翻面」讓它疊到虛線三角形上，再按「檢查疊合」。透明度滑桿可以讓下面的虛線看得更清楚。如果怎麼試都疊不起來，就按「疊不起來」。', mount: mountOverlay }],
  think: {
    who: 'bug', text: '有一條邊重合了，所以這兩個三角形一定全等！',
    fig: () => FIG.oneSide(OV.rawB0, OV.rawOther, OV.lenB0, OV.lenOther),
    q: '你同意小蟲嗎？',
    opts: [
      { t: '同意，一條邊重合就夠了。', why: '想想第 4 組：有一條邊一樣長，可是第三個頂點對得上嗎？' },
      { t: '不同意，三個頂點都要重合、整個三角形完全疊在一起才是全等。', ok: true, why: '對！全等的三角形，對應的邊一樣長、對應的角一樣大，三個頂點都會重合。' }
    ]
  },
  talk: ['「我先＿＿，再＿＿，就疊在一起了。」', '「頂點 A 對到頂點＿＿，所以邊 AB 對到邊＿＿。」'],
  bridge: '六面三角旗都集齊了！遠遠傳來咚咚咚的鼓聲，廣場上的大彩帶飄了起來——三角旗節開始了！'
});

/* 第 6 章的三角形（單位：公分）。第 4 組只有下面那條邊和原本的一樣長，頂點高很多，一眼看得出不同 */
const OV = (() => {
  const norm = q => { const c = centroid(q); return q.map(p => ({ x: p.x - c.x, y: p.y - c.y })); };
  const rawB0 = P([[-2.2, 1.3], [2.4, 1.3], [-1.3, -1.9]]), rawOther = P([[-2.2, 1.3], [2.4, 1.3], [0.9, -3.2]]);
  const B0 = norm(rawB0), other = norm(rawOther);
  const scaled = B0.map(p => ({ x: p.x * 1.3, y: p.y * 1.3 }));
  const lens = t => [0, 1, 2].map(i => r1(dist(t[i], t[(i + 1) % 3])).toFixed(1));
  return { B0, other, scaled, rawB0, rawOther, lenB0: lens(B0), lenOther: lens(other), lenScaled: lens(scaled) };
})();
function mountOverlay(el, done) {
  const B0 = OV.B0, scaled = OV.scaled, other = OV.other;
  const SETS = [
    { n: '第 1 組', target: { shape: B0, rot: 60, flip: false }, cong: true },
    { n: '第 2 組', target: { shape: B0, rot: 30, flip: true }, cong: true },
    { n: '第 3 組', target: { shape: scaled, rot: 0, flip: false }, cong: false, why: '它比較大，三條邊都比較長。不能放大縮小，所以怎麼轉、怎麼翻都疊不起來，<b>不全等</b>。', fig: () => FIG.bigSmall(OV.B0, OV.scaled, OV.lenB0, OV.lenScaled) },
    { n: '第 4 組', target: { shape: other, rot: 0, flip: false }, cong: false, why: '下面那條邊一樣長，可以重合，可是另外兩條邊不一樣長，第三個頂點對不上。只有一條邊重合不夠，<b>不全等</b>。', fig: () => FIG.oneSide(OV.rawB0, OV.rawOther, OV.lenB0, OV.lenOther) }
  ];
  const svg = svgEl('0 0 14 8'); const box = h('div', { class: 'stage' }); box.append(svg);
  const m = msgBox(), qbox = h('div'), setRow = h('div', { class: 'row' }), status = h('ul', { class: 'check' });
  const res = SETS.map(() => false); let si = 0, mv, drag = null, matched = false, showData = false, checks = 0, opacity = 0.55;
  const TC = { x: 9.9, y: 4.1 }; // 留空間給圖上的資料標示
  const rotIn = h('input', { type: 'range', min: '0', max: '359', step: '1', value: '0', 'aria-label': '旋轉角度' });
  const rotVal = h('span', { class: 'rngval' }, '0°');
  const opIn = h('input', { type: 'range', min: '15', max: '90', step: '1', value: '55', 'aria-label': '透明度' });
  function world(shape, pose) { return shape.map(p => { let q = pose.flip ? { x: -p.x, y: p.y } : p; q = rot(q, pose.rot); return { x: q.x + pose.x, y: q.y + pose.y }; }); }
  function tgt() { const t = SETS[si].target; return world(t.shape, { x: TC.x, y: TC.y, rot: t.rot, flip: t.flip }); }
  function cur() { return world(B0, mv); }
  function load(i) {
    si = i; matched = false; showData = false; checks = 0; mv = { x: 3.5, y: 4, rot: 0, flip: false }; rotIn.value = '0'; rotVal.textContent = '0°';
    qbox.innerHTML = ''; setRow.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i)); draw();
    say(m, `${SETS[i].n}：拖曳紫色三角形、用滑桿旋轉或按「翻面」，把它疊到虛線三角形上，再按「檢查疊合」。`, 'info');
  }
  /* 每個頂點最接近的目標頂點（距離小於 tol 才算重合） */
  function pairs(tol) { const T = tgt(), C = cur(), used = new Set(), corr = []; let n = 0;
    C.forEach((p, i) => { let bj = -1, bd = 9; T.forEach((q, j) => { const d = dist(p, q); if (d < bd && !used.has(j)) { bd = d; bj = j; } }); if (bd < tol) { used.add(bj); n++; corr[i] = bj; } else corr[i] = -1; }); return { n, corr }; }
  function draw() {
    const T = tgt(), C = cur();
    let s = gridSVG(14, 8, 1) + `<polygon points="${ps(T)}" fill="rgba(47,156,149,.12)" stroke="#22746f" stroke-width="0.08" stroke-dasharray="0.25 0.15"/>`;
    if (!showData) T.forEach((p, i) => { const l = labelPos(T, i, 1.0); s += `<text x="${l.x}" y="${l.y + 0.15}" font-size="0.5" text-anchor="middle" fill="#22746f" font-weight="700">${'DEF'[i]}</text>`; });
    s += `<polygon points="${ps(C)}" fill="${matched ? 'rgba(47,156,149,' + opacity + ')' : 'rgba(182,95,168,' + opacity + ')'}" stroke="#2b3459" stroke-width="0.08" stroke-linejoin="round" style="cursor:grab"/>`;
    if (matched) C.forEach(p => { s += `<circle cx="${p.x}" cy="${p.y}" r="0.42" fill="none" stroke="#f2b84b" stroke-width="0.12"/>`; });
    if (!showData) C.forEach((p, i) => { const l = labelPos(C, i, 0.5); s += `<circle cx="${p.x}" cy="${p.y}" r="0.1" fill="#2b3459"/><text x="${l.x}" y="${l.y + 0.15}" font-size="0.5" text-anchor="middle" fill="#2b3459" font-weight="700">${LET[i]}</text>`; });
    /* 確認完全疊合、找對對應以後，才把對應邊長、對應角標在圖上 */
    if (showData) {
      const corr = pairs(0.05).corr, g = centroid(C), D3 = 'DEF';
      /* 三角形上：頂點「A（D）」、每條邊的長度、每個角的度數 */
      for (let i = 0; i < 3; i++) {
        const j = (i + 1) % 3, len = r1(dist(C[i], C[j])).toFixed(1), a = Math.round(angleAt(C, i));
        s += `<path d="${arcPath(C[i], C[(i + 2) % 3], C[j], 0.75)}" fill="#e8735a" opacity=".45"/>`;
        const sl = sideLabelPos(C, i, 0.42), nm = labelPos(C, i, 0.62);
        const v = { x: g.x - C[i].x, y: g.y - C[i].y }, vl = Math.hypot(v.x, v.y), ap = { x: C[i].x + v.x / vl * Math.min(1.15, vl * 0.55), y: C[i].y + v.y / vl * Math.min(1.15, vl * 0.55) };
        s += `<text x="${sl.x}" y="${sl.y + 0.14}" font-size="0.4" text-anchor="middle" fill="#22746f" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="0.14">${len}</text>`;
        s += `<text x="${ap.x}" y="${ap.y + 0.13}" font-size="0.36" text-anchor="middle" fill="#c4553d" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="0.12">${a}°</text>`;
        s += `<circle cx="${C[i].x}" cy="${C[i].y}" r="0.1" fill="#2b3459"/><text x="${nm.x}" y="${nm.y + 0.15}" font-size="0.42" text-anchor="middle" fill="#2b3459" font-weight="700">${LET[i]}（${D3[corr[i]]}）</text>`;
      }
      /* 左邊空白處：對應邊、對應角的資料卡 */
      const rows = [0, 1, 2].map(i => { const j = (i + 1) % 3; return [`${LET[i]}${LET[j]} ＝ ${D3[corr[i]]}${D3[corr[j]]}`, `${r1(dist(C[i], C[j])).toFixed(1)} 公分`, '#22746f']; })
        .concat([0, 1, 2].map(i => [`∠${LET[i]} ＝ ∠${D3[corr[i]]}`, `${Math.round(angleAt(C, i))}°`, '#c4553d']));
      s += `<rect x="0.3" y="0.45" width="4.9" height="${1.0 + rows.length * 0.62}" rx="0.2" fill="#fff" stroke="#2f9c95" stroke-width="0.05"/>`;
      s += `<text x="0.65" y="1.0" font-size="0.4" font-weight="700" fill="#2b3459">對應邊・對應角</text>`;
      rows.forEach(([k, v, col], r) => { const y = 1.65 + r * 0.62; s += `<text x="0.65" y="${y}" font-size="0.38" font-weight="700" fill="${col}">${k}</text><text x="4.95" y="${y}" font-size="0.38" font-weight="700" fill="${col}" text-anchor="end">${v}</text>`; });
    }
    svg.innerHTML = s;
    status.innerHTML = ''; SETS.forEach((st, i) => status.append(h('li', { class: res[i] ? 'ok' : '' }, st.n)));
  }
  function check() {
    if (matched || res[si]) return;
    checks++;
    const t = SETS[si].target, d = ((mv.rot - t.rot) % 360 + 360) % 360, rotOK = Math.min(d, 360 - d) <= 4;
    /* 真正疊合：翻面狀態一樣、角度差 4° 以內、位置對準；成功後自動對齊到剛好重合 */
    if (SETS[si].cong && mv.flip === t.flip && rotOK && dist(mv, TC) < 0.5) {
      matched = true; mv = { x: TC.x, y: TC.y, rot: t.rot, flip: t.flip }; rotIn.value = String(t.rot); rotVal.textContent = t.rot + '°'; draw();
      say(m, '三個頂點都重合了，<b>完整疊合</b>！它們是全等三角形。接下來找對應。', 'good');
      askCorr(); return;
    }
    const { n } = pairs(0.35);
    let text = n === 2 ? '有兩個頂點重合了（一條邊重合），可是第三個頂點沒有重合。只有一條邊重合不夠，還要看第三個頂點。'
      : n === 1 ? '目前只有一個頂點重合。再轉一轉、翻面試試，其他頂點和邊也要一起對齊。'
      : n === 3 ? '很接近了，可是還沒有完全重合。看看每條邊有沒有貼齊？要不要先翻面，或再轉一點點？'
      : '目前沒有頂點重合。先把它拖到虛線三角形上，再旋轉或翻面試試。';
    if (!SETS[si].cong && checks >= 2) text += '<br>如果怎麼移動、旋轉、翻面都疊不起來，可以按「疊不起來」。';
    say(m, text, n === 3 ? 'info' : 'warn');
  }
  function askCorr() {
    const corr = pairs(0.05).corr;
    const wrap = h('div', { class: 'corr' }, h('div', { class: 'lbl' }, '疊合後，A、B、C 各對到哪一點？（先自己選，再看結果）'));
    const sels = LET.map(L => { const sl = h('select', { 'aria-label': L + ' 對到哪一點' }, h('option', { value: '' }, `${L} 對到…`), ...'DEF'.split('').map(k => h('option', { value: k }, k + ' 點'))); return sl; });
    const out = h('div', { class: 'corr-out' });
    const go = h('button', { class: 'btn teal small', type: 'button', onclick: () => {
      if (sels.some(sl => !sl.value)) { out.innerHTML = '<p class="warn-t">三個都選好，再看結果。</p>'; return; }
      const ok = sels.map((sl, i) => sl.value === 'DEF'[corr[i]]);
      out.innerHTML = sels.map((sl, i) => ok[i] ? `<p>✓ ${LET[i]} 點對到 ${sl.value} 點：疊合時這兩點重合。</p>` : `<p class="warn-t">✗ ${LET[i]} 點對到 ${sl.value} 點？看看圖上 ${LET[i]} 疊在哪一個字母旁邊（黃色圓圈）。</p>`).join('');
      if (!ok.every(Boolean)) return;
      sels.forEach(sl => sl.disabled = true); go.disabled = true; showData = true; draw();
      const C = cur();
      const lines = [0, 1, 2].map(i => { const j = (i + 1) % 3; return `<p>${LET[i]}${LET[j]} 邊對到 ${'DEF'[corr[i]]}${'DEF'[corr[j]]} 邊，長度都是 ${r1(dist(C[i], C[j])).toFixed(1)} 公分。</p>`; })
        .concat([0, 1, 2].map(i => `<p>角 ${LET[i]} 對到角 ${'DEF'[corr[i]]}，兩個角重合，都是約 ${Math.round(angleAt(C, i))}°。</p>`));
      out.innerHTML += `<div class="corr-data">${lines.join('')}<p class="key-t">全等圖形的形狀、大小相同；對應邊等長，對應角相等。</p><p class="note">圖上也標出了對應邊和對應角，對照看看。</p></div>`;
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      resolve(si);
    } }, '看結果');
    wrap.append(h('div', { class: 'row' }, ...sels, go), out); qbox.innerHTML = ''; qbox.append(wrap);
  }
  function resolve(i) {
    res[i] = true; draw();
    if (res.every(Boolean)) { qbox.append(h('div', { class: 'msg good' }, '四組都判斷完了！第 1、2 組全等；第 3 組大小不同、第 4 組只有一條邊一樣長，都不全等。')); done(); }
    else { const nx = res.findIndex(x => !x); qbox.append(h('div', { class: 'row' }, h('button', { class: 'btn teal', type: 'button', onclick: () => { load(nx); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, `換${SETS[nx].n} →`))); }
  }
  SETS.forEach((st, i) => setRow.append(h('button', { class: 'btn ghost small', type: 'button', onclick: () => load(i) }, st.n)));
  rotIn.addEventListener('input', () => { if (matched) { rotIn.value = String(mv.rot); return; } mv.rot = +rotIn.value; rotVal.textContent = rotIn.value + '°'; draw(); });
  opIn.addEventListener('input', () => { opacity = +opIn.value / 100; draw(); });
  const sliders = h('div', { class: 'sliders' },
    h('label', { class: 'rng' }, h('span', null, '旋轉'), rotIn, rotVal),
    h('label', { class: 'rng' }, h('span', null, '透明度'), opIn));
  const tools = h('div', { class: 'row' },
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (matched) return; mv.flip = !mv.flip; draw(); } }, '⇋ 翻面'),
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => load(si) }, '重來'),
    h('button', { class: 'btn teal small', type: 'button', onclick: check }, '檢查疊合'),
    h('button', { class: 'btn small', type: 'button', onclick: () => {
      if (res[si] || matched) return;
      if (SETS[si].cong) say(m, '這一組其實疊得起來喔！慢慢拉旋轉滑桿，或是先「翻面」再旋轉。', 'warn');
      else { say(m, SETS[si].why, 'good'); qbox.innerHTML = ''; qbox.append(figBox(SETS[si].fig)); resolve(si); }
    } }, '疊不起來'));
  svg.addEventListener('pointerdown', e => { if (matched) return; const p = svgPt(svg, e); if (inPoly(p, cur()) || cur().some(q => dist(q, p) < 0.6)) { drag = { dx: p.x - mv.x, dy: p.y - mv.y }; svg.setPointerCapture(e.pointerId); } });
  svg.addEventListener('pointermove', e => { if (!drag) return; const p = svgPt(svg, e); mv.x = Math.min(13.5, Math.max(0.5, p.x - drag.dx)); mv.y = Math.min(7.5, Math.max(0.5, p.y - drag.dy)); draw(); });
  const end = () => { drag = null; }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  el.append(setRow, sliders, box, tools, status, m, qbox); load(0);
}

/* ---------- 終章：三角旗節 ---------- */
const FINALE = {
  title: '三角旗節', illus: () => scene(`${bunting(10, 390, 20, 12)}${mayor(70, 170, 0.95)}${yuan(150, 160, 0.95)}${akak(220, 150, 1.25, 'happy')}${bug(300, 210, 1.3)}<rect x="170" y="196" width="100" height="30" fill="#c98a4b" stroke="#2b3459" stroke-width="3"/>`),
  story: [
    '廣場上掛滿了三角旗，圓圓在台下揮著彩球，小蟲也吃飽了來看熱鬧。',
    '鎮長方方請阿角上台，阿角卻說：<span class="say">「今天一路幫我的你，才是真正的小老師！」</span>',
    '上台前，先來回答鎮長的六個問題吧！'
  ]
};
function mountQuiz(el, done) {
  const Q = [
    ['下面哪一個說法，是三角形一定要有的？', [{ t: '三條直直的線段首尾相接圍起來，有三個頂點。', ok: true }, { t: '有一個尖尖的角朝上。' }, { t: '看起來像屋頂。' }]],
    ['三條邊都是 5 公分的三角形叫做什麼？', [{ t: '正三角形', ok: true }, { t: '直角三角形' }, { t: '鈍角三角形' }]],
    ['三個角是 30°、60°、90° 的三角形是哪一種？', [{ t: '銳角三角形' }, { t: '直角三角形', ok: true }, { t: '鈍角三角形' }]],
    ['三個角是 100°、40°、40° 的三角形，下面哪個說法最完整？', [{ t: '它是鈍角三角形，也是等腰三角形。', ok: true }, { t: '它只是鈍角三角形。' }, { t: '它是銳角三角形，因為有兩個 40° 的銳角。' }]],
    ['一個三角形最多有幾個直角？', [{ t: '1 個', ok: true }, { t: '2 個' }, { t: '3 個' }]],
    ['怎麼確定兩個三角形全等？', [{ t: '移動、旋轉或翻面以後，可以完全疊在一起。', ok: true }, { t: '有一條邊一樣長就好。' }, { t: '顏色和方向一樣。' }]]
  ];
  let n = 0;
  const FIGS = [() => FIG.triBasic(), () => FIG.equi5(), () => FIG.t306090(), () => FIG.t1004040(), () => FIG.twoRight(), () => FIG.overlayAnim()];
  Q.forEach(([q, o], i) => el.append(mcq(`${i + 1}. ${q}`, o.map(x => Object.assign({}, x, { why: x.ok ? '答對了！看看下面的圖。' : '再想想看，可以回到前面的章節看看。' })), () => { n++; if (n === Q.length) done(); }, FIGS[i])));
}
function mountTeach(el, done) {
  const topics = ['什麼是三角形', '頂點、邊、角', '依邊長分類', '依角分類', '怎麼畫三角形', '全等'];
  let topic = null; const chips = h('div', { class: 'chips' });
  topics.forEach(t => chips.append(h('button', { type: 'button', onclick: e => { topic = t; chips.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.target)); } }, t)));
  const t1 = h('textarea', { placeholder: '我要教大家：……', rows: 2 }), t2 = h('textarea', { placeholder: '我的證據是：……（可以指著哪一章的圖）', rows: 2 }), t3 = h('textarea', { placeholder: '要小心，很多人以為……，其實……', rows: 2 });
  const card = h('div'), m = msgBox(); let finished = false;
  const make = h('button', { class: 'btn teal', type: 'button', onclick: () => {
    if (!topic) { say(m, '先選一個你想教的主題。', 'warn'); return; }
    if (!t1.value.trim()) { say(m, '寫下（或先說出）你想教大家的一件事。', 'warn'); return; }
    card.innerHTML = ''; card.append(h('div', { class: 'tcard' }, h('div', null, h('b', null, `小老師：${S.name || '我'}　主題：${topic}`)), h('p', null, t1.value), t2.value ? h('p', null, '證據：' + t2.value) : null, t3.value ? h('p', null, '小心：' + t3.value) : null));
    say(m, '小老師卡做好了！對著同伴念一次，請同伴說：「我聽懂你說……」或問：「你說的＿＿，可以指給我看嗎？」', 'good');
    if (!finished) { finished = true; done(); }
  } }, '做成小老師卡');
  el.append(h('div', { class: 'how' }, '選一個主題：'), chips, h('div', { style: 'height:8px' }), t1, t2, t3, h('div', { class: 'row' }, make), card, m);
}

/* ======================================================
   頁面
   ====================================================== */
const app = $('app');
function updateBunting(newIdx) {
  const b = $('bunting'); b.innerHTML = '';
  CH.forEach((c, i) => { const f = h('div', { class: 'flag' + (i === newIdx ? ' got' : ''), title: `第 ${i + 1} 章：${c.title}` }); f.innerHTML = flagSVG(c.color, !!S.flags[i]); b.append(f); });
}
function renderMenu() {
  const l = $('menu-list'); l.innerHTML = '';
  CH.forEach((c, i) => l.append(h('li', null, h('button', { type: 'button', class: S.flags[i] ? 'done' : '', onclick: () => { closeMenu(); go(i); } }, h('span', null, `第 ${i + 1} 章　${c.title}`), h('span', null, S.flags[i] ? '🚩' : '')))));
  l.append(h('li', null, h('button', { type: 'button', onclick: () => { closeMenu(); go(CH.length); } }, h('span', null, '終章　三角旗節'), h('span', null, ''))));
}
function openMenu() { renderMenu(); $('menu').hidden = false; }
function closeMenu() { $('menu').hidden = true; }

function storyBlock(tag, title, illus, paras) {
  const wrap = h('section', { class: 'book story' });
  const il = h('div', { class: 'illus' }); il.innerHTML = illus;
  const tx = h('div', { class: 'text' }, h('span', { class: 'chap-tag' }, tag), h('h1', null, title));
  paras.forEach(p => tx.append(h('p', { html: p })));
  wrap.append(il, tx); return wrap;
}
function partBlock(i, part, onDone) {
  const sec = h('section', { class: 'part locked', 'data-part': i });
  const badge = h('span', { class: 'badge todo' }, '進行中');
  sec.append(h('h2', null, `探索 ${i + 1}　${part.title}`, badge), h('p', { class: 'how' }, part.how));
  const body = h('div'); sec.append(body);
  let mounted = false, fin = false;
  sec.unlock = () => { if (mounted) return; mounted = true; sec.classList.remove('locked'); part.mount(body, () => { if (fin) return; fin = true; badge.textContent = '完成'; badge.classList.remove('todo'); onDone(); }); };
  return sec;
}
function whoSVG(who) { return `<svg viewBox="-34 -40 68 80">${who === 'bug' ? bug(0, 4, 1.4) : akak(0, 0, 1.05, 'surprise')}</svg>`; }

function go(i) {
  S.cur = i; save(); window.scrollTo(0, 0); if (i >= 0) S.last = i;
  app.innerHTML = '';
  if (i < 0) return renderCover();
  if (i >= CH.length) return renderFinale();
  const c = CH[i]; const page = h('div', { class: 'page' });
  page.append(storyBlock(`第 ${i + 1} 章`, c.title, c.illus(), c.story));
  const parts = c.parts.map((p, k) => partBlock(k, p, () => { if (parts[k + 1]) { parts[k + 1].unlock(); setTimeout(() => parts[k + 1].scrollIntoView({ behavior: 'smooth', block: 'start' }), 600); } else { thinkSec.classList.remove('locked'); setTimeout(() => thinkSec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600); } }));
  parts.forEach(p => page.append(p));
  const thinkSec = h('section', { class: 'part locked' });
  const who = h('div', { class: 'who' }); who.innerHTML = whoSVG(c.think.who);
  thinkSec.append(h('h2', null, c.think.who === 'bug' ? '小蟲的想法' : '阿角的想法'), h('div', { class: 'think' }, who, h('div', { class: 'bubble' }, c.think.text)));
  const bridgeSlot = h('div');
  thinkSec.append(mcq(c.think.q, c.think.opts, () => {
    thinkSec.append(talkBox(c.talk));
    const first = !S.flags[i]; S.flags[i] = true; save(); updateBunting(first ? i : -1);
    const fl = h('div', { class: 'flagwin' }); fl.innerHTML = flagSVG(c.color, true); fl.append(h('span', null, first ? `你得到第 ${i + 1} 面三角旗！` : `第 ${i + 1} 面三角旗已經收集了。`));
    const br = h('div', { class: 'bridge' }, fl, h('div', null, c.bridge), h('button', { class: 'btn', type: 'button', onclick: () => go(i + 1) }, i + 1 < CH.length ? `翻到第 ${i + 2} 章 →` : '前往三角旗節 →'));
    bridgeSlot.append(br); setTimeout(() => br.scrollIntoView({ behavior: 'smooth', block: 'center' }), 700);
    }, c.think.fig));
  page.append(thinkSec, bridgeSlot);
  app.append(page);
  parts[0].unlock();
}

function renderCover() {
  const page = h('div', { class: 'page' });
  const st = storyBlock('四年級上學期　三角形', '阿角的三角旗節', scene(`${bunting(20, 380, 20, 9)}${mayor(110, 168, 1)}${akak(220, 160, 1.3, 'happy')}${yuan(320, 160, 0.9)}`), [
    '形狀鎮一年一度的「三角旗節」快到了！鎮長方方貼出公告：<span class="say">「學會三角形的祕密，就能領一面三角旗，掛上節慶的大彩帶。」</span>',
    '小三角形阿角背起筆記本：<span class="say">「我要集滿六面旗子！你願意陪我一起去嗎？」</span>'
  ]);
  st.classList.add('cover');
  const inp = h('input', { type: 'text', maxlength: '12', placeholder: '你的名字（可以不寫）', 'aria-label': '你的名字', value: S.name || '' });
  const got = Object.keys(S.flags).filter(k => S.flags[k]).length;
  const startIdx = got && S.last != null ? S.last : 0;
  const start = h('div', { class: 'cover-start' },
    h('div', { class: 'name-row' }, inp, h('button', { class: 'btn', type: 'button', onclick: () => { S.name = inp.value.trim(); save(); go(startIdx); } }, got ? '繼續冒險 →' : '翻開繪本 →')),
    h('div', { class: 'how' }, got ? `你已經收集了 ${got} 面三角旗。` : '一共六章，每完成一章就得到一面三角旗。'));
  st.querySelector('.text').append(start);
  page.append(st); app.append(page);
}

function renderFinale() {
  const page = h('div', { class: 'page' });
  page.append(storyBlock('終章', FINALE.title, FINALE.illus(), FINALE.story));
  const certSlot = h('div');
  const p2 = partBlock(1, { title: '換你當小老師', how: '選一個主題，用自己的話教阿角一件三角形的事。', mount: mountTeach }, () => showCert());
  const p1 = partBlock(0, { title: '鎮長的六個問題', how: '每一題選出最合適的答案，答錯可以再選。', mount: mountQuiz }, () => { p2.unlock(); setTimeout(() => p2.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600); });
  page.append(p1, p2, certSlot); app.append(page); p1.unlock();
  function showCert() {
    const n = Object.keys(S.flags).filter(k => S.flags[k]).length;
    const flags = h('div', { class: 'flags' }); CH.forEach((c, i) => { const d = h('span'); d.innerHTML = flagSVG(c.color, !!S.flags[i]); flags.append(d); });
    certSlot.innerHTML = '';
    certSlot.append(h('section', { class: 'part' }, h('div', { class: 'cert' }, h('div', null, '形狀鎮　三角旗節'), h('h3', null, '三角形小老師'), h('div', { style: 'font-size:22px;font-family:var(--story)' }, S.name || '探索家'), flags,
      h('p', null, n === CH.length ? '集滿六面三角旗，完成了所有探索！' : `收集了 ${n} 面三角旗。還有沒完成的章節，可以從「目錄」回去探索。`),
      h('p', { style: 'font-family:var(--story);font-size:19px' }, '阿角在筆記本的最後一頁寫下：「三角形——三條直直的邊，首尾相接圍起來，有三個頂點、三個角。」'),
      h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => go(-1) }, '回到封面')))));
    setTimeout(() => certSlot.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
  }
}

/* ---------------- 啟動 ---------------- */
$('btn-home').addEventListener('click', () => go(-1));
$('btn-menu').addEventListener('click', openMenu);
$('btn-menu-close').addEventListener('click', closeMenu);
$('menu').addEventListener('click', e => { if (e.target.id === 'menu') closeMenu(); });
$('btn-teacher').addEventListener('click', () => { closeMenu(); const d = $('teacher'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); });
$('btn-teacher-close').addEventListener('click', () => { const d = $('teacher'); if (d.close) d.close(); else d.removeAttribute('open'); });
let resetArm = null;
$('btn-reset').addEventListener('click', () => {
  const b = $('btn-reset');
  if (!resetArm) { b.textContent = '確定清除？再按一次'; resetArm = setTimeout(() => { resetArm = null; b.textContent = '清除進度'; }, 4000); return; }
  clearTimeout(resetArm); resetArm = null; b.textContent = '清除進度';
  S = { name: '', flags: {}, cur: -1, last: null }; save(); closeMenu(); updateBunting(-1); go(-1);
});
updateBunting(-1);
go(-1);
window.__AKAK = { go, CH, S: () => S };
})();

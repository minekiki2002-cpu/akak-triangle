/* 答題後出現的「圖片說明佐證」與動畫。全部用 SVG 畫，不需要外部圖片。
   每個 FIG.xxx 都回傳 { svg: 字串 或 (容器)=>void, cap: 說明文字 } */
(function () {
'use strict';
const C = { ink: '#2b3459', fill: '#fde7a8', teal: '#2f9c95', tealD: '#22746f', coral: '#e8735a', coralD: '#c4553d', berry: '#b65fa8', blue: '#7b8fd6', sun: '#f2b84b' };
const f1 = v => Math.round(v * 10) / 10;
const pt = (x, y) => ({ x, y });
const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const P = arr => arr.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
function cen(t) { return pt((t[0].x + t[1].x + t[2].x) / 3, (t[0].y + t[1].y + t[2].y) / 3); }
function ang(t, i) { const p = t[i], a = t[(i + 2) % 3], b = t[(i + 1) % 3]; const v1 = pt(a.x - p.x, a.y - p.y), v2 = pt(b.x - p.x, b.y - p.y); return Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))))) * 180 / Math.PI; }
function txt(x, y, s, o = {}) { return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${o.size || 13}" text-anchor="${o.anchor || 'middle'}" fill="${o.fill || C.ink}" font-weight="${o.bold === false ? 400 : 700}">${s}</text>`; }
function tri(t, o = {}) { return `<polygon points="${P(t)}" fill="${o.fill || C.fill}" stroke="${o.stroke || C.ink}" stroke-width="${o.sw || 3}" stroke-linejoin="round" ${o.dash ? `stroke-dasharray="${o.dash}"` : ''} ${o.op ? `opacity="${o.op}"` : ''}/>`; }
function arc(p, a, b, r, col, op = 0.55) {
  const a1 = Math.atan2(a.y - p.y, a.x - p.x), a2 = Math.atan2(b.y - p.y, b.x - p.x); let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const s = pt(p.x + r * Math.cos(a1), p.y + r * Math.sin(a1)), e = pt(p.x + r * Math.cos(a1 + d), p.y + r * Math.sin(a1 + d));
  return `<path d="M${p.x},${p.y} L${s.x},${s.y} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${e.x},${e.y} Z" fill="${col}" opacity="${op}"/>`;
}
function angArc(t, i, r, col) { return arc(t[i], t[(i + 2) % 3], t[(i + 1) % 3], r, col); }
function rightMark(t, i, s = 12, col = C.coralD) { const p = t[i], a = t[(i + 2) % 3], b = t[(i + 1) % 3]; const u = pt((a.x - p.x) / d2(a, p), (a.y - p.y) / d2(a, p)), v = pt((b.x - p.x) / d2(b, p), (b.y - p.y) / d2(b, p)); return `<polyline points="${P([pt(p.x + u.x * s, p.y + u.y * s), pt(p.x + u.x * s + v.x * s, p.y + u.y * s + v.y * s), pt(p.x + v.x * s, p.y + v.y * s)])}" fill="none" stroke="${col}" stroke-width="2.5"/>`; }
function ticks(a, b, n, col = C.coralD) { const m = pt((a.x + b.x) / 2, (a.y + b.y) / 2), L = d2(a, b), u = pt((b.x - a.x) / L, (b.y - a.y) / L), v = pt(-u.y, u.x); let s = ''; for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 5; const c = pt(m.x + u.x * o, m.y + u.y * o); s += `<line x1="${c.x - v.x * 7}" y1="${c.y - v.y * 7}" x2="${c.x + v.x * 7}" y2="${c.y + v.y * 7}" stroke="${col}" stroke-width="2.5"/>`; } return s; }
function sideLbl(t, i, s, off = 16, col = C.tealD, size = 13) { const a = t[i], b = t[(i + 1) % 3], m = pt((a.x + b.x) / 2, (a.y + b.y) / 2), c = cen(t), v = pt(m.x - c.x, m.y - c.y), l = Math.hypot(v.x, v.y) || 1; return txt(m.x + v.x / l * off, m.y + v.y / l * off + 5, s, { fill: col, size }); }
function vLbl(t, i, s, off = 16, col = C.ink, size = 13) { const c = cen(t), p = t[i], v = pt(p.x - c.x, p.y - c.y), l = Math.hypot(v.x, v.y) || 1; return txt(p.x + v.x / l * off, p.y + v.y / l * off + 5, s, { fill: col, size }); }
function dots(t, col = C.coral) { return t.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${col}" stroke="#fff" stroke-width="2"/>`).join(''); }
/* 依三個角度做出三角形，最長邊 L 像素，外框置中在 (cx, cy) */
function byAngles(A, B, Cc, L, cx, cy, rotDeg = 0) {
  const s = [A, B, Cc].map(d => Math.sin(d * Math.PI / 180)), k = L / Math.max(...s); const a = s[0] * k, b = s[1] * k, c = s[2] * k;
  const x = (b * b + c * c - a * a) / (2 * c); let t = [pt(0, 0), pt(c, 0), pt(x, -Math.sqrt(Math.max(0, b * b - x * x)))];
  const g = cen(t), r = rotDeg * Math.PI / 180; t = t.map(p => { const q = pt(p.x - g.x, p.y - g.y); return pt(q.x * Math.cos(r) - q.y * Math.sin(r), q.x * Math.sin(r) + q.y * Math.cos(r)); });
  const xs = t.map(p => p.x), ys = t.map(p => p.y), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
  return t.map(p => pt(p.x - mx + cx, p.y - my + cy));
}
const wrap = (inner, h = 180) => `<svg viewBox="0 0 320 ${h}" role="img">${inner}</svg>`;

const FIG = {};

/* 第 1 章：方向、胖瘦不影響 */
FIG.anyWay = () => {
  const t1 = [pt(25, 140), pt(95, 140), pt(60, 60)], t2 = [pt(120, 52), pt(205, 66), pt(150, 140)], t3 = [pt(245, 105), pt(245, 140), pt(292, 140)];
  const c2 = cen(t2);
  return { cap: '尖端朝上、倒過來、細細長長、小小的……只要是「三條直直的邊首尾相接，圍出 3 個頂點」，就是三角形。',
    svg: wrap(`${tri(t1)}${dots(t1)}<g>${tri(t2)}${dots(t2)}<animateTransform attributeName="transform" type="rotate" values="0 ${c2.x} ${c2.y};18 ${c2.x} ${c2.y};-18 ${c2.x} ${c2.y};0 ${c2.x} ${c2.y}" dur="5s" repeatCount="indefinite"/></g>${tri(t3)}${dots(t3)}
      ${txt(60, 165, '3 邊・3 頂點 ✓', { fill: C.tealD })}${txt(160, 165, '3 邊・3 頂點 ✓', { fill: C.tealD })}${txt(268, 165, '3 邊・3 頂點 ✓', { fill: C.tealD })}`) };
};

/* 第 2 章：三點在一直線圍不起來（右邊動畫：C 離開直線才圍成三角形） */
FIG.collinear = () => ({
  cap: '三個點在同一條直線上，三條線段會疊在一起，中間沒有空間，圍不起來；第三個點離開直線，才能圍成三角形。',
  svg: wrap(`<line x1="15" y1="95" x2="145" y2="95" stroke="${C.ink}" stroke-width="4"/><line x1="15" y1="101" x2="145" y2="101" stroke="${C.coral}" stroke-width="3" stroke-dasharray="6 4"/>
    ${dots([pt(15, 95), pt(70, 95), pt(145, 95)])}${txt(15, 80, 'A')}${txt(70, 80, 'B')}${txt(145, 80, 'C')}
    ${txt(80, 135, '線段疊在一起', { fill: C.coralD })}${txt(80, 153, '中間沒有地方 ✗', { fill: C.coralD })}
    <line x1="160" y1="20" x2="160" y2="160" stroke="#e6d8b8" stroke-width="2"/>
    <polygon points="180,130 300,130 240,128" fill="${C.fill}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"><animate attributeName="points" values="180,130 300,130 240,129;180,130 300,130 240,40;180,130 300,130 240,40;180,130 300,130 240,129" keyTimes="0;0.45;0.85;1" dur="4s" repeatCount="indefinite"/></polygon>
    <circle r="6" fill="${C.coral}" stroke="#fff" stroke-width="2" cx="240" cy="129"><animate attributeName="cy" values="129;40;40;129" keyTimes="0;0.45;0.85;1" dur="4s" repeatCount="indefinite"/></circle>
    ${dots([pt(180, 130), pt(300, 130)])}${txt(240, 160, '離開直線 → 圍成三角形 ✓', { fill: C.tealD })}`)
});

/* 第 3 章：等腰三角形對摺，兩個底角疊在一起 */
FIG.baseAngles = () => {
  const t = [pt(160, 22), pt(80, 150), pt(240, 150)];
  return { cap: '等腰三角形沿著中間對摺，左右兩半會完全疊在一起：兩條腰一樣長，兩個底角也一樣大。',
    svg: wrap(`${tri(t)}${ticks(t[0], t[1], 1)}${ticks(t[0], t[2], 1)}${angArc(t, 1, 26, C.coral)}${angArc(t, 2, 26, C.coral)}
      <line x1="160" y1="12" x2="160" y2="160" stroke="${C.blue}" stroke-width="2.5" stroke-dasharray="6 5"/>
      <g transform="translate(160,0)"><g><animateTransform attributeName="transform" type="scale" values="1 1;1 1;-1 1;-1 1;1 1" keyTimes="0;0.2;0.5;0.8;1" dur="5s" repeatCount="indefinite"/>
        <polygon points="0,22 -80,150 0,150" fill="${C.sun}" opacity=".55" stroke="${C.ink}" stroke-width="2"/></g></g>
      ${txt(60, 170, '底角', { fill: C.coralD })}${txt(260, 170, '底角', { fill: C.coralD })}${txt(160, 175, '＝', { fill: C.coralD, size: 16 })}${txt(98, 85, '腰')}${txt(222, 85, '腰')}`) };
};

/* 第 3 章：正三角形也是等腰三角形 */
FIG.eqIsIso = () => {
  const e = [pt(70, 40), pt(25, 118), pt(115, 118)];
  return { cap: '等腰三角形是「至少有兩條邊一樣長」。正三角形三條邊都一樣長，當然也有兩條邊一樣長，所以正三角形也是等腰三角形。',
    svg: wrap(`${tri(e)}${ticks(e[0], e[1], 1)}${ticks(e[0], e[2], 1)}${ticks(e[1], e[2], 1)}${txt(70, 150, '三條邊都一樣長', { fill: C.tealD })}
      <rect x="150" y="14" width="160" height="150" rx="16" fill="#f0f3fb" stroke="${C.blue}" stroke-width="2.5"/>${txt(230, 34, '等腰三角形', { fill: '#3b4a96' })}
      <rect x="168" y="72" width="124" height="80" rx="12" fill="#e8f6f3" stroke="${C.teal}" stroke-width="2.5"/>${txt(230, 92, '正三角形', { fill: C.tealD })}
      ${tri([pt(230, 104), pt(212, 138), pt(248, 138)], { sw: 2 })}${tri([pt(185, 44), pt(170, 64), pt(200, 64)], { sw: 2 })}${tri([pt(282, 42), pt(266, 66), pt(298, 66)], { sw: 2 })}`) };
};

/* 第 3 章：等腰三角形轉一轉，底不一定在下面 */
FIG.isoSpin = () => {
  const t = [pt(160, 30), pt(110, 140), pt(210, 140)], c = cen(t);
  return { cap: '不管轉到哪個方向，兩條腰（有記號的邊）都一樣長，它一直都是等腰三角形；「底」不一定在最下面。',
    svg: wrap(`<g>${tri(t)}${ticks(t[0], t[1], 2)}${ticks(t[0], t[2], 2)}${sideLbl(t, 0, '腰', 18, C.coralD)}${sideLbl(t, 2, '腰', 18, C.coralD)}${sideLbl(t, 1, '底', 18, C.ink)}
      <animateTransform attributeName="transform" type="rotate" values="0 ${c.x} ${c.y};360 ${c.x} ${c.y}" dur="8s" repeatCount="indefinite"/></g>`) };
};

/* 第 4 章：看最大的角 */
FIG.biggestAngle = () => {
  const a = byAngles(70, 60, 50, 85, 55, 82), r = byAngles(90, 50, 40, 85, 160, 82), o = byAngles(120, 35, 25, 92, 265, 88);
  const arcs = (t, kind) => t.map((_, i) => { const d = ang(t, i); const col = Math.abs(d - 90) < 0.6 ? C.coral : d > 90 ? C.berry : C.teal; return angArc(t, i, 15, col) + (Math.abs(d - 90) < 0.6 ? rightMark(t, i, 10) : ''); }).join('');
  return { cap: '每個三角形都至少有兩個銳角（綠色）。所以要看「最大的那個角」：有直角是直角三角形，有鈍角是鈍角三角形，三個都是銳角才是銳角三角形。',
    svg: wrap(`${tri(a)}${arcs(a)}${tri(r)}${arcs(r)}${tri(o)}${arcs(o)}
      ${txt(55, 140, '銳角三角形', { fill: C.tealD })}${txt(55, 158, '3 個銳角', { size: 12, bold: false })}
      ${txt(160, 140, '直角三角形', { fill: C.coralD })}${txt(160, 158, '2 個銳角＋1 個直角', { size: 12, bold: false })}
      ${txt(265, 140, '鈍角三角形', { fill: C.berry })}${txt(265, 158, '2 個銳角＋1 個鈍角', { size: 12, bold: false })}`) };
};

/* 第 4 章：兩個直角、兩個鈍角為什麼做不出來（虛線動畫） */
FIG.twoRight = () => ({
  cap: '左：兩個角都是直角時，兩條邊一樣直直往上，互相平行，延伸多遠都碰不到，第三個頂點不存在。右：兩個鈍角，兩條邊往外張得更開，更不可能碰到。所以三角形最多只有一個直角、一個鈍角。',
  svg: wrap(`<line x1="30" y1="150" x2="130" y2="150" stroke="${C.ink}" stroke-width="4"/>
    <line x1="30" y1="150" x2="30" y2="150" stroke="${C.ink}" stroke-width="4"><animate attributeName="y2" values="150;18;18;150" keyTimes="0;0.5;0.85;1" dur="4s" repeatCount="indefinite"/></line>
    <line x1="130" y1="150" x2="130" y2="150" stroke="${C.coral}" stroke-width="4" stroke-dasharray="7 5"><animate attributeName="y2" values="150;18;18;150" keyTimes="0;0.5;0.85;1" dur="4s" repeatCount="indefinite"/></line>
    <polyline points="30,138 42,138 42,150" fill="none" stroke="${C.coralD}" stroke-width="2.5"/><polyline points="130,138 118,138 118,150" fill="none" stroke="${C.coralD}" stroke-width="2.5"/>
    ${dots([pt(30, 150), pt(130, 150)])}${txt(80, 70, '?', { size: 30, fill: C.coralD })}${txt(80, 95, '碰不到', { fill: C.coralD })}${txt(80, 172, '兩個直角：平行', { fill: C.coralD })}
    <line x1="160" y1="15" x2="160" y2="172" stroke="#e6d8b8" stroke-width="2"/>
    <line x1="200" y1="150" x2="280" y2="150" stroke="${C.ink}" stroke-width="4"/>
    <line x1="200" y1="150" x2="200" y2="150" stroke="${C.ink}" stroke-width="4"><animate attributeName="x2" values="200;172;172;200" keyTimes="0;0.5;0.85;1" dur="4s" repeatCount="indefinite"/><animate attributeName="y2" values="150;25;25;150" keyTimes="0;0.5;0.85;1" dur="4s" repeatCount="indefinite"/></line>
    <line x1="280" y1="150" x2="280" y2="150" stroke="${C.berry}" stroke-width="4" stroke-dasharray="7 5"><animate attributeName="x2" values="280;308;308;280" keyTimes="0;0.5;0.85;1" dur="4s" repeatCount="indefinite"/><animate attributeName="y2" values="150;25;25;150" keyTimes="0;0.5;0.85;1" dur="4s" repeatCount="indefinite"/></line>
    ${dots([pt(200, 150), pt(280, 150)])}${txt(240, 85, '越張越開', { fill: C.berry })}${txt(240, 172, '兩個鈍角：分開', { fill: C.berry })}`)
});

/* 第 5 章：直角三角形畫法 */
FIG.right34 = () => {
  const t = [pt(70, 150), pt(170, 150), pt(70, 75)];
  return { cap: '先用直角板畫出直角，再沿著兩條邊量出 4 公分和 3 公分，最後把兩個端點連起來。第三條邊量起來是 5 公分。',
    svg: wrap(`${tri(t)}${rightMark(t, 0, 14)}${sideLbl(t, 0, '4 公分')}${sideLbl(t, 2, '3 公分', 26)}${sideLbl(t, 1, '5 公分', 18, C.ink)}${dots(t)}
      <g transform="translate(205,40)"><polygon points="0,0 0,90 90,90" fill="#f9e3a5" stroke="${C.ink}" stroke-width="2.5"/><polyline points="0,78 12,78 12,90" fill="none" stroke="${C.coralD}" stroke-width="2.5"/>${txt(30, 110, '直角板', { size: 12 })}</g>`) };
};
/* 第 5 章：等腰三角形兩腰 5 公分 */
FIG.isoLegs = () => {
  const t = [pt(160, 25), pt(90, 150), pt(230, 150)];
  return { cap: '等腰三角形有兩條一樣長的邊，叫做「腰」。兩條腰從同一個頂點出發，都量 5 公分。',
    svg: wrap(`${tri(t)}${ticks(t[0], t[1], 1)}${ticks(t[0], t[2], 1)}${sideLbl(t, 0, '腰 5 公分', 34, C.coralD)}${sideLbl(t, 2, '腰 5 公分', 34, C.coralD)}${sideLbl(t, 1, '底', 16, C.ink)}${dots(t)}`) };
};
/* 第 5 章：正三角形 60 度 */
FIG.equi60 = () => {
  const t = [pt(100, 150), pt(220, 150), pt(160, 46)];
  return { cap: '正三角形三條邊一樣長，三個角也都是 60 度。用尺量三條邊，或用量角器量三個角，都可以確認。',
    svg: wrap(`${tri(t)}${[0, 1, 2].map(i => angArc(t, i, 22, C.teal)).join('')}${vLbl(t, 0, '60°', 30, C.tealD)}${vLbl(t, 1, '60°', 30, C.tealD)}${vLbl(t, 2, '60°', 24, C.tealD)}
      ${sideLbl(t, 0, '4 公分', 18)}${sideLbl(t, 1, '4 公分', 22)}${sideLbl(t, 2, '4 公分', 22)}`) };
};
/* 第 5 章：鈍角比直角大 */
FIG.obtuseCheck = () => {
  const t = [pt(130, 120), pt(285, 120), pt(55, 50)]; /* 鈍角在 (130,120) */
  const p = t[0], u = pt(1, 0), v = pt(0, -1);
  const sq = [p, pt(p.x + u.x * 60, p.y), pt(p.x, p.y + v.y * 60)];
  return { cap: '把直角板靠在這個角上：角張得比直角板還開，所以是鈍角。只要有一個鈍角，就是鈍角三角形。',
    svg: wrap(`${tri(t)}${angArc(t, 0, 26, C.berry)}<polygon points="${P(sq)}" fill="rgba(123,143,214,.3)" stroke="#3b4a96" stroke-width="2" stroke-dasharray="5 4"/>
      <polyline points="${P([pt(p.x + 12, p.y), pt(p.x + 12, p.y - 12), pt(p.x, p.y - 12)])}" fill="none" stroke="#3b4a96" stroke-width="2"/>
      ${txt(130, 142, Math.round(ang(t, 0)) + '°', { fill: C.berry })}${txt(205, 40, '虛線：直角板', { fill: '#3b4a96', size: 12 })}${txt(160, 170, '角比直角板還開 → 鈍角', { fill: C.berry })}`) };
};

/* 第 5 章 阿角：兩腰 5 公分，頂角改變 → 形狀、底邊都改變（動畫） */
FIG.isoAnim = () => ({
  cap: '這句話是錯的。兩條腰都是 5 公分，夾在兩腰之間的「頂角」可以改變（30°、60°、90°、120°……），頂角一變，第三邊（底邊）的長度也跟著改變，所以畫出來不一定一樣。',
  svg: el => {
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 320 150'); svg.setAttribute('role', 'img');
    const info = document.createElement('div'); info.className = 'anim-info';
    const table = document.createElement('div'); table.className = 'anim-table';
    const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'btn ghost small'; replay.textContent = '↻ 再播一次';
    el.append(svg, info, table, replay);
    const A = pt(160, 24), L = 110, STOPS = [30, 60, 90, 120], COLS = [C.teal, C.blue, C.coral, C.berry];
    const tri3 = th => { const h = th * Math.PI / 360; return [A, pt(A.x - L * Math.sin(h), A.y + L * Math.cos(h)), pt(A.x + L * Math.sin(h), A.y + L * Math.cos(h))]; };
    const base = th => 2 * 5 * Math.sin(th * Math.PI / 360);
    let raf = 0, t0 = 0;
    function frame(th, ghosts, shown) {
      let s = ghosts.map(g => tri(tri3(g), { fill: 'none', stroke: COLS[STOPS.indexOf(g)], sw: 2, dash: '5 4' })).join('');
      const t = tri3(th);
      s += tri(t, { fill: 'rgba(242,184,75,.35)' }) + angArc(t, 0, 26, C.coral) + ticks(t[0], t[1], 1) + ticks(t[0], t[2], 1);
      s += sideLbl(t, 0, '5 公分', 30, C.coralD, 12) + sideLbl(t, 2, '5 公分', 30, C.coralD, 12) + sideLbl(t, 1, '底 ' + f1(base(th)).toFixed(1), 16, C.ink, 13);
      s += txt(A.x, A.y - 6, `頂角 ${Math.round(th)}°`, { fill: C.coralD, size: 13 }) + dots(t);
      svg.innerHTML = s;
      info.innerHTML = `兩條腰都是 <b>5 公分</b>，頂角 <b>${Math.round(th)}°</b> → 底邊 <b>${f1(base(th)).toFixed(1)} 公分</b>`;
      table.innerHTML = shown.map(g => `<span style="border-color:${COLS[STOPS.indexOf(g)]}">頂角 ${g}° → 底邊 ${f1(base(g)).toFixed(1)} 公分</span>`).join('');
    }
    /* 時間軸：每一站停 0.9 秒，站與站之間轉 1.2 秒 */
    const HOLD = 900, MOVE = 1200, hs = {}, he = {}; let tt = 0;
    STOPS.forEach((s, i) => { hs[s] = tt; he[s] = tt + HOLD; tt += HOLD + (i < STOPS.length - 1 ? MOVE : 0); });
    function thetaAt(e) {
      for (let i = 0; i < STOPS.length; i++) {
        const s = STOPS[i]; if (e < he[s]) return s;
        if (i < STOPS.length - 1 && e < hs[STOPS[i + 1]]) return s + (STOPS[i + 1] - s) * (e - he[s]) / MOVE;
      }
      return STOPS[STOPS.length - 1];
    }
    function play(now) {
      if (!t0) t0 = now; const e = now - t0;
      frame(thetaAt(e), STOPS.filter(s => e >= he[s]), STOPS.filter(s => e >= hs[s]));
      if (e < tt && svg.isConnected) raf = requestAnimationFrame(play);
    }
    function start() { cancelAnimationFrame(raf); t0 = 0; raf = requestAnimationFrame(play); }
    replay.addEventListener('click', start); frame(30, [], []); start();
  }
});

/* 第 6 章：只有一條邊重合（用實際兩個三角形與邊長比較） */
FIG.oneSide = (a, b, la, lb) => {
  /* a、b：兩個三角形（單位：公分，下面那條邊相同），la、lb：三條邊長 */
  const S = 32, ox = 160 - ((a[0].x + a[1].x) / 2) * S, oy = 140 - a[0].y * S; const tr = t => t.map(p => pt(p.x * S + ox, p.y * S + oy));
  const A = tr(a), B = tr(b);
  return { cap: `下面那條邊一樣長（${la[0]} 公分），所以可以重合；可是另外兩條邊不一樣長（${la[2]}、${la[1]} 和 ${lb[2]}、${lb[1]} 公分），第三個頂點就對不上。只有一條邊重合，不能說全等。`,
    svg: wrap(`${tri(B, { fill: 'rgba(47,156,149,.15)', stroke: C.teal, dash: '7 5' })}${tri(A, { fill: 'rgba(182,95,168,.35)' })}
      <line x1="${A[0].x}" y1="${A[0].y}" x2="${A[1].x}" y2="${A[1].y}" stroke="${C.teal}" stroke-width="7" opacity=".7"/>${sideLbl(A, 0, la[0] + ' ✓', 16, C.tealD)}
      ${sideLbl(A, 1, la[1], 14, C.berry, 12)}${sideLbl(A, 2, la[2], 14, C.berry, 12)}${sideLbl(B, 1, lb[1], 16, C.tealD, 12)}${sideLbl(B, 2, lb[2], 16, C.tealD, 12)}
      <line x1="${A[2].x}" y1="${A[2].y}" x2="${B[2].x}" y2="${B[2].y}" stroke="${C.coralD}" stroke-width="2.5" stroke-dasharray="4 3"/>
      <circle cx="${A[2].x}" cy="${A[2].y}" r="6" fill="${C.berry}" stroke="#fff" stroke-width="2"/><circle cx="${B[2].x}" cy="${B[2].y}" r="6" fill="${C.teal}" stroke="#fff" stroke-width="2"/>
      ${txt((A[2].x + B[2].x) / 2 + 52, (A[2].y + B[2].y) / 2, '對不上 ✗', { fill: C.coralD })}`, 180) };
};
/* 第 6 章：大小不同 */
FIG.bigSmall = (a, b, la, lb) => {
  const S = 22, sh = (t, cx, cy) => { const c = cen(t); return t.map(p => pt((p.x - c.x) * S + cx, (p.y - c.y) * S + cy)); };
  const A = sh(a, 85, 95), B = sh(b, 230, 90);
  return { cap: `形狀很像，可是三條邊都不一樣長（${la.join('、')} 和 ${lb.join('、')} 公分）。不能放大縮小，所以疊不起來，不全等。`,
    svg: wrap(`${tri(A, { fill: 'rgba(182,95,168,.35)' })}${[0, 1, 2].map(i => sideLbl(A, i, la[i], 14, C.berry, 12)).join('')}${tri(B, { fill: 'rgba(47,156,149,.15)', stroke: C.teal, dash: '7 5' })}${[0, 1, 2].map(i => sideLbl(B, i, lb[i], 16, C.tealD, 12)).join('')}
      ${txt(85, 168, '移動的旗子', { fill: C.berry, size: 12 })}${txt(230, 168, '虛線旗子（比較大）', { fill: C.tealD, size: 12 })}`) };
};
/* 第 6 章：全等的確認方式（移動＋旋轉疊上去的動畫） */
FIG.overlayAnim = () => {
  const t = [pt(-40, 25), pt(45, 25), pt(-20, -35)];
  return { cap: '只用移動、旋轉、翻面，把一個三角形疊到另一個上面，三個頂點、三條邊都完全重合，才是全等。',
    svg: wrap(`<g transform="translate(220,90) rotate(40)">${tri(t, { fill: 'rgba(47,156,149,.12)', stroke: C.teal, dash: '7 5' })}</g>
      <g><animateTransform attributeName="transform" type="translate" values="80 95;80 95;220 90;220 90" keyTimes="0;0.15;0.6;1" dur="4s" repeatCount="indefinite"/>
        <g><animateTransform attributeName="transform" type="rotate" values="0;0;40;40" keyTimes="0;0.15;0.6;1" dur="4s" repeatCount="indefinite"/>${tri(t, { fill: 'rgba(182,95,168,.45)' })}</g></g>
      ${txt(160, 172, '移動＋旋轉 → 完全重合 ✓', { fill: C.tealD })}`) };
};

/* 終章用 */
FIG.triBasic = () => { const t = [pt(160, 25), pt(80, 145), pt(245, 145)]; return { cap: '三角形：三條直直的線段首尾相接、圍起來，有三個頂點、三條邊、三個角。',
  svg: wrap(`${tri(t)}${dots(t)}${vLbl(t, 0, '頂點', 16)}${vLbl(t, 1, '頂點', 18)}${vLbl(t, 2, '頂點', 18)}${sideLbl(t, 1, '邊', 16)}${sideLbl(t, 0, '邊', 18)}${sideLbl(t, 2, '邊', 18)}${angArc(t, 1, 22, C.teal)}${txt(112, 136, '角', { fill: C.tealD, size: 12 })}`) }; };
FIG.equi5 = () => { const t = [pt(160, 30), pt(95, 145), pt(225, 145)]; return { cap: '三條邊都一樣長（5、5、5 公分）的三角形叫正三角形，它的三個角都是 60 度。', svg: wrap(`${tri(t)}${[0, 1, 2].map(i => ticks(t[i], t[(i + 1) % 3], 1) + sideLbl(t, i, '5 公分', 22)).join('')}`) }; };
FIG.t306090 = () => {
  const t = [pt(80, 140), pt(240, 140), pt(80, 48)]; /* 直角在左下，30° 在右，60° 在上 */
  return { cap: '30°、60°、90°：有一個角是直角（90°），所以是直角三角形。另外兩個是銳角。',
    svg: wrap(`${tri(t)}${rightMark(t, 0, 14)}${angArc(t, 1, 30, C.teal)}${angArc(t, 2, 22, C.teal)}
      ${txt(64, 158, '90°', { fill: C.coralD })}${txt(258, 158, '30°', { fill: C.tealD })}${txt(80, 38, '60°', { fill: C.tealD })}${txt(205, 70, '直角三角形', { fill: C.coralD })}`) };
};
FIG.t1004040 = () => {
  const t = [pt(160, 140 - 100 * Math.tan(40 * Math.PI / 180)), pt(60, 140), pt(260, 140)]; /* 頂角約 100°，兩個底角約 40° */
  return { cap: '100° 比直角大，是鈍角，所以是鈍角三角形；兩個 40° 的角一樣大，對面的兩條邊也一樣長，所以它同時也是等腰三角形。',
    svg: wrap(`${tri(t)}${angArc(t, 0, 24, C.berry)}${angArc(t, 1, 34, C.teal)}${angArc(t, 2, 34, C.teal)}${ticks(t[0], t[1], 1)}${ticks(t[0], t[2], 1)}
      ${txt(160, 44, Math.round(ang(t, 0)) + '°', { fill: C.berry })}${txt(46, 158, Math.round(ang(t, 1)) + '°', { fill: C.tealD })}${txt(274, 158, Math.round(ang(t, 2)) + '°', { fill: C.tealD })}
      ${txt(160, 170, '鈍角三角形，也是等腰三角形', { fill: C.ink })}`) };
};

window.FIG = FIG;
window.figBox = function (fig) {
  const f = typeof fig === 'function' ? fig() : fig;
  const box = document.createElement('figure'); box.className = 'fig';
  const holder = document.createElement('div'); holder.className = 'fig-art';
  if (typeof f.svg === 'function') f.svg(holder); else holder.innerHTML = f.svg;
  const cap = document.createElement('figcaption'); cap.textContent = f.cap;
  box.append(holder, cap); return box;
};
})();

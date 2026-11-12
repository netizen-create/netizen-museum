// Игровые автоматы в галерее мемов. У каждой игры свой мир: карманная LCD-консоль для змейки, хромовый пинбол 80-х,
// огненный файрвол, антивирус из девяностых и глянцевая загрузка нулевых.
(function () {
  const LCD = ['#0f380f', '#306230', '#8bac0f', '#cadc9f'], PIXEL = '"Pixelify Sans"';
  const CHROME = '#e9edf5', PINK = '#ff2e9a', AMBER = '#ff5a1f';
  const art = {}, waiting = [];
  let left = Object.keys(SKINS).length;
  for (const [k, src] of Object.entries(SKINS)) {
    const im = new Image();
    const done = () => { if (--left === 0) waiting.splice(0).forEach(f => f()); };
    im.crossOrigin = 'anonymous';
    im.onload = () => { art[k] = im; done(); };
    im.onerror = done;
    im.src = Media.url(src);
  }
  const ready = f => { if (left === 0) f(); else waiting.push(f); };
  const text = (g, s, x, y, font, col) => { g.font = font; g.fillStyle = col; g.fillText(s, x, y); };
  function best(id, v) {
    Save.arcade = Save.arcade || {};
    if (v > (Save.arcade[id] || 0)) { Save.arcade[id] = v; persist(); }
    if (v > 0 && window.Net) Net.score(id, v);
    return Save.arcade[id] || 0;
  }
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  function surface(W, H, cls, label) {
    const k = Math.min(devicePixelRatio || 1, 2), cv = el('canvas', cls);
    cv.width = W * k; cv.height = H * k; cv.setAttribute('aria-label', label);
    const g = cv.getContext('2d'); g.scale(k, k);
    return { cv, g };
  }

  // --- змейка: карманная консоль ------------------------------------------------------------------

  const BITMAPS = {
    banana: ['...........', '........33.', '........33.', '.......333.', '.......33..', '......333..', '.....333...', '...3333....', '33333......', '.333.......', '...........'],
    badge: ['...3333....', '..333333...', '.33322333..', '.33332333..', '.33332333..', '.33332333..', '.33322233..', '..333333...', '...3333....', '...........', '...........'],
    wifi: ['...........', '..333333...', '.33....33..', '3..3333..3.', '..33..33...', '.3..33..3..', '...3..3....', '....33.....', '....33.....', '...........', '...........']
  };
  function pixels(g, map, x, y, s) {
    g.fillStyle = LCD[0];
    map.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') { g.fillStyle = LCD[c === '3' ? 0 : 2]; g.fillRect(x + i * s, y + j * s, s, s); } }));
  }

  function snake() {
    const C = 20, N = 16, M = 14, TOP = 20, W = N * C, H = M * C + TOP, id = 'snake';
    const { cv, g } = surface(W, H, 'lcd', 'Змейка');
    g.imageSmoothingEnabled = false;
    const box = el('div', 'pocket'), bezel = el('div', 'pocketBezel'), brand = el('p', 'pocketBrand'), pad = el('div', 'pocketPad'), dpad = el('div', 'dpad');
    brand.textContent = 'NETIZEN POCKET';
    bezel.append(cv, brand);
    const btn = (cls, label, dir) => { const b = el('button', cls); b.type = 'button'; b.setAttribute('aria-label', label); b.onpointerdown = e => { e.preventDefault(); if (dir) press(dir[0], dir[1]); else start(); }; return b; };
    dpad.append(btn('dU', 'Вверх', [0, -1]), btn('dL', 'Влево', [-1, 0]), btn('dR', 'Вправо', [1, 0]), btn('dD', 'Вниз', [0, 1]));
    const go = btn('aBtn', 'Старт'); go.textContent = 'A';
    const grille = el('div', 'grille');
    pad.append(dpad, grille, go); box.append(bezel, pad);

    const ghost = Art.cv(cv.width, cv.height), gg = ghost.getContext('2d');
    const grid = Art.cv(cv.width, cv.height), ng = grid.getContext('2d'), step2 = cv.width / W * 2;
    ng.fillStyle = 'rgba(15,56,15,.09)';
    for (let x = 0; x < grid.width; x += step2) ng.fillRect(x, 0, 1, grid.height);
    for (let y = 0; y < grid.height; y += step2) ng.fillRect(0, y, grid.width, 1);

    let body, dir, turns, food, score, speed, acc, mode = 'title', t = 0, flip = false, overAt = 0, flash = 0;
    const KINDS = Object.keys(BITMAPS);
    function place() {
      do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * M), k: KINDS[Math.floor(Math.random() * KINDS.length)] }; } while (body.some(b => b.x === food.x && b.y === food.y));
    }
    function reset() { body = [{ x: 6, y: 7 }, { x: 5, y: 7 }, { x: 4, y: 7 }, { x: 3, y: 7 }]; dir = { x: 1, y: 0 }; turns = []; score = 0; speed = .17; acc = 0; flip = false; place(); }
    const start = () => { if (mode === 'title') { mode = 'run'; Snd.sfx('tap'); } else if (mode === 'over' && t - overAt > .4) { reset(); mode = 'run'; Snd.sfx('tap'); } };
    function press(x, y) {
      if (mode !== 'run') return start();
      const l = turns[turns.length - 1] || dir;
      if ((l.x === x && l.y === y) || (l.x === -x && l.y === -y) || turns.length > 1) return;
      turns.push({ x, y });
    }
    function move() {
      dir = turns.shift() || dir;
      if (dir.x) flip = dir.x < 0;
      const h = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= M || body.some(b => b.x === h.x && b.y === h.y)) { mode = 'over'; overAt = t; flash = .3; Snd.sfx('deny'); best(id, score); return; }
      body.unshift(h);
      if (h.x === food.x && h.y === food.y) { score++; speed = Math.max(.085, speed * .97); Snd.sfx('plant'); place(); } else body.pop();
    }
    function draw() {
      g.fillStyle = LCD[3]; g.fillRect(0, 0, W, H);
      g.globalAlpha = .3; g.drawImage(ghost, 0, 0, W, H); g.globalAlpha = 1;
      if (mode === 'title') {
        g.drawImage(art.snake_side, 0, 40, 540, 400, 0, 0, W, H);
        g.fillStyle = LCD[3]; g.fillRect(40, H - 54, W - 80, 40); g.fillStyle = LCD[0]; g.fillRect(44, H - 50, W - 88, 32);
        g.textAlign = 'center';
        if (Math.floor(t * 2) % 2 === 0) text(g, 'НАЖМИ СТАРТ', W / 2, H - 28, `24px ${PIXEL}`, LCD[3]);
        g.textAlign = 'left';
      } else {
        g.fillStyle = LCD[0]; g.fillRect(0, 0, W, TOP);
        text(g, `СЧЁТ ${String(score).padStart(3, '0')}`, 6, 15, `16px ${PIXEL}`, LCD[3]);
        g.textAlign = 'right'; text(g, `ЛУЧШИЙ ${String(best(id, 0)).padStart(3, '0')}`, W - 6, 15, `16px ${PIXEL}`, LCD[3]); g.textAlign = 'left';
        pixels(g, BITMAPS[food.k], food.x * C, TOP + food.y * C + (Math.floor(t * 3) % 2), 2);
        for (let i = body.length - 1; i > 0; i--) {
          const b = body[i], x = b.x * C, y = TOP + b.y * C, m = i === body.length - 1 ? 4 : 1;
          g.fillStyle = LCD[0]; g.fillRect(x + m, y + m, C - m * 2, C - m * 2);
          g.fillStyle = (i + b.x + b.y) % 2 ? LCD[2] : LCD[1]; g.fillRect(x + m + 2, y + m + 2, C - m * 2 - 4, C - m * 2 - 4);
          if (m === 1) { g.fillStyle = LCD[3]; g.fillRect(x + 8, y + 8, 4, 4); }
        }
        const h = body[0], S = 40;
        g.save(); g.translate(h.x * C + C / 2, TOP + h.y * C + C / 2); if (flip) g.scale(-1, 1); g.drawImage(art.snake_head, -S / 2, -S / 2, S, S); g.restore();
      }
      if (mode === 'over') {
        g.fillStyle = LCD[3]; g.fillRect(30, 44, W - 60, H - 74); g.fillStyle = LCD[0]; g.fillRect(34, 48, W - 68, H - 82);
        g.drawImage(art.snake_head, W / 2 - 44, 56, 88, 88);
        g.textAlign = 'center';
        text(g, 'ПОРАЖЕНИЕ', W / 2, 172, `30px ${PIXEL}`, LCD[3]);
        text(g, 'Are you winning, son?', W / 2, 196, `16px ${PIXEL}`, LCD[2]);
        text(g, `СЧЁТ ${score}   ЛУЧШИЙ ${best(id, 0)}`, W / 2, 222, `16px ${PIXEL}`, LCD[3]);
        if (Math.floor(t * 2) % 2 === 0) text(g, 'A: ЕЩЁ РАЗ', W / 2, 250, `16px ${PIXEL}`, LCD[2]);
        g.textAlign = 'left';
      }
      if (flash > 0) { g.fillStyle = LCD[0]; g.fillRect(0, 0, W, H); }
      gg.drawImage(cv, 0, 0);
      g.drawImage(grid, 0, 0, W, H);
    }
    const DIRS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    const key = e => {
      const d = DIRS[e.code];
      if (d) { e.preventDefault(); press(d[0], d[1]); } else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); start(); }
    };
    let touch = null;
    cv.onpointerdown = e => { touch = { x: e.clientX, y: e.clientY }; if (mode !== 'run') start(); };
    cv.onpointermove = e => {
      if (!touch) return;
      const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) press(Math.sign(dx), 0); else press(0, Math.sign(dy));
      touch = { x: e.clientX, y: e.clientY };
    };
    cv.onpointerup = cv.onpointercancel = () => { touch = null; };
    addEventListener('keydown', key);
    reset();
    return {
      nodes: [box], cls: 'game pocketWrap',
      tick(dt) { t += dt; flash = Math.max(0, flash - dt); if (mode === 'run') { acc += dt; while (acc > speed && mode === 'run') { acc -= speed; move(); } } draw(); },
      close() { removeEventListener('keydown', key); }
    };
  }

  // --- пинбол: стол и стекло ----------------------------------------------------------------------

  // Сегменты цифр: верх, верх-право, низ-право, низ, низ-лево, верх-лево, середина.
  const SEG = ['1111110', '0110000', '1101101', '1111001', '0110011', '1011011', '1011111', '1110000', '1111111', '1111011'];
  function digit(g, x, y, w, h, d, col) {
    const t = Math.max(2, w * .17), l = w - t * 1.4, v = h / 2 - t * .9, on = SEG[d];
    const bars = [[x + t * .7, y, l, t], [x + w - t, y + t * .7, t, v], [x + w - t, y + h / 2 + t * .2, t, v], [x + t * .7, y + h - t, l, t], [x, y + h / 2 + t * .2, t, v], [x, y + t * .7, t, v], [x + t * .7, y + h / 2 - t / 2, l, t]];
    bars.forEach(([a, b, c, e], i) => { g.fillStyle = on[i] === '1' ? col : 'rgba(255,90,31,.08)'; g.fillRect(a, b, c, e); });
  }
  function number(g, v, x, y, w, h, n, col) {
    const s = String(Math.min(v, 10 ** n - 1)).padStart(n, ' '), dw = w / n, pad = dw * .16;
    g.save(); g.shadowColor = col; g.shadowBlur = 8;
    [...s].forEach((c, i) => digit(g, x + i * dw + pad / 2, y, dw - pad, h, c === ' ' ? -1 : +c, col));
    g.restore();
  }
  SEG[-1] = '0000000';

  function pinball() {
    const W = 360, H = 600, R = 9, id = 'pinball';
    const { cv, g } = surface(W, H, 'table', 'Пинбол');
    const glass = surface(480, 268, 'glass', 'Табло пинбола');
    const room = el('div', 'pinRoom'), tip = el('p', 'arcTip'), left = el('div', 'pinSide');
    tip.textContent = 'Стрелки или половины стола. Пробел запускает шарик';
    left.append(glass.cv, tip); room.append(left, cv);

    const lines = [], line = (pts, bounce = .55) => { for (let i = 1; i < pts.length; i++) lines.push([...pts[i - 1], ...pts[i], bounce]); };
    const RIM = [[14, 600], [14, 90], [40, 40], [100, 16], [260, 16], [320, 40], [346, 90], [346, 600]];
    line(RIM); line([[320, 600], [320, 130]]);
    line([[14, 470], [100, 545]], .9); line([[320, 470], [234, 545]], .9);
    line([[320, 582], [346, 582]], .1);
    const bumps = [
      { id: 'ear', x: 78, y: 243, r: 22, v: 100, say: 'слышу', col: PINK },
      { id: 'eye', x: 200, y: 233, r: 20, v: 200, say: 'база', col: '#35e6ff' },
      { id: 'nose', x: 298, y: 262, r: 13, v: 100, say: 'лол', col: '#ffd23f' },
      { id: 'hair', x: 167, y: 134, r: 18, v: 50, say: 'кринж', col: '#84ff5a' }
    ];
    const flips = [{ x: 104, y: 548, s: 1, a: .5, on: false }, { x: 230, y: 548, s: -1, a: .5, on: false }];
    const LEN = 56, tipOf = f => ({ x: f.x + f.s * Math.cos(f.a) * LEN, y: f.y + Math.sin(f.a) * LEN });
    const ball = { x: 333, y: 571, vx: 0, vy: 0 };
    let score = 0, balls = 3, mode = 'lane', t = 0, overAt = 0, slow = 0, wink = 0, pops = [], hits = {};
    const park = () => { ball.x = 333; ball.y = 571; ball.vx = ball.vy = 0; mode = 'lane'; };
    function reset() { score = 0; balls = 3; hits = {}; pops = []; park(); }
    function launch() { if (mode !== 'lane') return; mode = 'run'; ball.vy = -1020 - Math.random() * 90; Snd.sfx('tap'); }

    const push = (px, py, bounce, sx, sy) => {
      const dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy);
      if (d >= R || d < 1e-4) return false;
      const nx = dx / d, ny = dy / d; ball.x = px + nx * R; ball.y = py + ny * R;
      const vn = (ball.vx - sx) * nx + (ball.vy - sy) * ny;
      if (vn < 0) { ball.vx -= (1 + bounce) * vn * nx; ball.vy -= (1 + bounce) * vn * ny; }
      return true;
    };
    const nearest = (ax, ay, bx, by) => {
      const ux = bx - ax, uy = by - ay, q = Math.max(0, Math.min(1, ((ball.x - ax) * ux + (ball.y - ay) * uy) / (ux * ux + uy * uy)));
      return { x: ax + ux * q, y: ay + uy * q, q };
    };
    function sub(h) {
      for (const f of flips) {
        const old = tipOf(f), to = f.on ? -.5 : .5, step = 17 * h;
        f.a += Math.max(-step, Math.min(step, to - f.a));
        const tip = tipOf(f), p = nearest(f.x, f.y, tip.x, tip.y);
        push(p.x, p.y, .3, (tip.x - old.x) / h * p.q, (tip.y - old.y) / h * p.q);
      }
      ball.vy += 620 * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
      const sp = Math.hypot(ball.vx, ball.vy); if (sp > 1300) { ball.vx *= 1300 / sp; ball.vy *= 1300 / sp; }
      for (const l of lines) { const p = nearest(l[0], l[1], l[2], l[3]); push(p.x, p.y, l[4], 0, 0); }
      for (const b of bumps) {
        const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
        if (d >= b.r + R) continue;
        const nx = dx / d, ny = dy / d; ball.x = b.x + nx * (b.r + R); ball.y = b.y + ny * (b.r + R);
        const out = Math.max(520, Math.hypot(ball.vx, ball.vy) * .8); ball.vx = nx * out; ball.vy = ny * out;
        score += b.v; b.lit = .22; hits[b.id] = 1; pops.push({ s: b.say, x: b.x, y: b.y - b.r, life: .8 }); Snd.sfx('tap');
        if (b.id === 'eye') wink = .4;
        if (hits.ear && hits.eye && hits.nose && hits.hair) { hits = {}; score += 1000; pops.push({ s: 'Are you winning?', x: 170, y: 350, life: 1.6 }); Snd.sfx('find'); }
      }
      if (ball.y > 612) {
        balls--; Snd.sfx('deny');
        if (balls > 0) park(); else { mode = 'over'; overAt = t; best(id, score); }
      } else if (ball.x > 322 && ball.y > 562 && Math.abs(ball.vy) < 90) park();
    }

    // Рама стола не меняется: чёрная заливка за бортом, хромовые рельсы, рисуем один раз.
    const k = 2, rail = Art.cv(W * k, H * k), w = rail.getContext('2d');
    w.scale(k, k); w.lineCap = 'round'; w.lineJoin = 'round';
    w.fillStyle = '#07070c'; w.beginPath(); w.rect(0, 0, W, H);
    RIM.forEach(([x, y], i) => (i ? w.lineTo(x, y) : w.moveTo(x, y))); w.closePath(); w.fill('evenodd');
    w.fillStyle = 'rgba(6,6,14,.74)'; w.fillRect(320, 130, 26, 470);
    const metal = w.createLinearGradient(0, 0, W, H);
    ['#7f8799', '#ffffff', '#8d95a8', '#f1f4fb', '#6f7687'].forEach((c, i) => metal.addColorStop(i / 4, c));
    const stroke = (x0, y0, x1, y1) => { w.beginPath(); w.moveTo(x0, y0); w.lineTo(x1, y1); w.stroke(); };
    for (const [wd, col] of [[6, '#000'], [3.4, metal]]) { w.lineWidth = wd; w.strokeStyle = col; for (const l of lines) stroke(l[0], l[1], l[2], l[3]); }
    w.shadowColor = PINK; w.shadowBlur = 10; w.strokeStyle = PINK; w.lineWidth = 2.4;
    stroke(16, 474, 98, 546); stroke(318, 474, 236, 546);

    function drawGlass() {
      const q = glass.g, S = 480 / 620;
      q.drawImage(art.pin_glass, 0, 0, 480, 268);
      number(q, score, 375 * S, 70 * S, 188 * S, 31 * S, 7, AMBER);
      [127, 167, 207].forEach((y, i) => { const on = i < balls; q.fillStyle = on ? '#ffd23f' : 'rgba(255,255,255,.05)'; q.save(); if (on) { q.shadowColor = '#ffd23f'; q.shadowBlur = 10; } q.beginPath(); q.arc(544.5 * S, (y + 13.5) * S, 8 * S, 0, 7); q.fill(); q.restore(); });
      const n = Object.keys(hits).length;
      number(q, n, 445 * S, 210 * S, 24 * S, 21 * S, 1, '#35e6ff');
      number(q, best(id, 0), 379 * S, 252 * S, 72 * S, 22 * S, 5, PINK);
      number(q, Math.floor(score / 1000), 486 * S, 252 * S, 70 * S, 22 * S, 4, '#84ff5a');
    }
    function bumper(b) {
      const lit = b.lit > 0, rd = b.r;
      const l = g.createRadialGradient(b.x - rd * .35, b.y - rd * .4, rd * .1, b.x, b.y, rd);
      l.addColorStop(0, '#fff'); l.addColorStop(.45, lit ? '#fff' : b.col); l.addColorStop(1, lit ? b.col : '#14141e');
      g.fillStyle = '#000'; g.beginPath(); g.arc(b.x, b.y, rd + 2, 0, 7); g.fill();
      g.fillStyle = l; g.beginPath(); g.arc(b.x, b.y, rd, 0, 7); g.fill();
      g.strokeStyle = hits[b.id] ? '#fff' : CHROME; g.lineWidth = hits[b.id] ? 3 : 1.5; g.beginPath(); g.arc(b.x, b.y, rd - 1, 0, 7); g.stroke();
    }
    function draw() {
      g.drawImage(art.pin_field, 0, 0, W, H);
      if (wink > 0) {
        const e = bumps[1];
        g.fillStyle = '#efc4a2'; g.beginPath(); g.ellipse(e.x, e.y + 1, 30, 22, 0, 0, 7); g.fill();
        g.strokeStyle = '#0a0a0a'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(e.x - 26, e.y); g.quadraticCurveTo(e.x, e.y + 13, e.x + 26, e.y); g.stroke();
      }
      g.drawImage(rail, 0, 0, W, H);
      bumps.forEach(bumper);
      g.lineCap = 'round';
      for (const f of flips) {
        const tip = tipOf(f), m = g.createLinearGradient(f.x, f.y - 8, f.x, f.y + 20);
        m.addColorStop(0, '#fff'); m.addColorStop(.5, '#9aa2b5'); m.addColorStop(1, '#f1f4fb');
        g.strokeStyle = '#000'; g.lineWidth = 17; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(tip.x, tip.y); g.stroke();
        g.strokeStyle = m; g.lineWidth = 12; g.stroke();
        g.strokeStyle = PINK; g.lineWidth = 2.5; g.stroke();
      }
      const bl = g.createRadialGradient(ball.x - 3, ball.y - 4, 1, ball.x, ball.y, R);
      bl.addColorStop(0, '#fff'); bl.addColorStop(.5, '#aeb6c8'); bl.addColorStop(1, '#2b2e3a');
      g.fillStyle = '#000'; g.beginPath(); g.arc(ball.x, ball.y, R + 1.2, 0, 7); g.fill();
      g.fillStyle = bl; g.beginPath(); g.arc(ball.x, ball.y, R, 0, 7); g.fill();
      g.textAlign = 'center';
      for (const p of pops) {
        g.globalAlpha = Math.min(1, p.life * 2); g.font = `italic 800 18px ${Art.SANS}`;
        g.lineWidth = 4; g.strokeStyle = '#120522'; g.strokeText(p.s, p.x, p.y); g.fillStyle = '#fff'; g.fillText(p.s, p.x, p.y);
      }
      g.globalAlpha = 1;
      if (mode === 'lane' && Math.floor(t * 2) % 2 === 0) { g.font = `italic 700 15px ${Art.SANS}`; g.lineWidth = 4; g.strokeStyle = '#120522'; g.strokeText('Пробел или тап: запуск', 170, 440); g.fillStyle = '#fff'; g.fillText('Пробел или тап: запуск', 170, 440); }
      if (mode === 'over') {
        g.fillStyle = 'rgba(10,4,24,.84)'; g.fillRect(0, 0, W, H);
        g.drawImage(art.pin_head, W / 2 - 90, 130, 180, 180);
        const c = g.createLinearGradient(0, 330, 0, 366); c.addColorStop(0, '#fff'); c.addColorStop(.5, '#8d95a8'); c.addColorStop(.55, PINK); c.addColorStop(1, '#ffd23f');
        g.font = `italic 900 38px ${Art.SANS}`; g.fillStyle = c; g.fillText('ПОРАЖЕНИЕ', W / 2, 362);
        text(g, 'Are you winning, son?', W / 2, 394, `400 16px ${Art.SANS}`, CHROME);
        text(g, 'Нажми, чтобы сыграть ещё', W / 2, 432, `400 14px ${Art.SANS}`, '#b9bdcc');
      }
      g.textAlign = 'left';
      drawGlass();
    }
    const flip = (i, on) => { if (on && !flips[i].on) Snd.sfx('tap'); flips[i].on = on; };
    const again = () => { if (mode === 'over' && t - overAt > .4) reset(); };
    const LEFT = ['ArrowLeft', 'KeyA'], RIGHT = ['ArrowRight', 'KeyD'];
    const down = e => {
      if (LEFT.includes(e.code)) { e.preventDefault(); flip(0, true); }
      else if (RIGHT.includes(e.code)) { e.preventDefault(); flip(1, true); }
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'ArrowDown') { e.preventDefault(); launch(); again(); }
    };
    const up = e => { if (LEFT.includes(e.code)) flip(0, false); if (RIGHT.includes(e.code)) flip(1, false); };
    const held = new Map();
    cv.onpointerdown = e => {
      cv.setPointerCapture(e.pointerId);
      if (mode === 'over') return again();
      if (mode === 'lane') return launch();
      const b = cv.getBoundingClientRect(), i = e.clientX < b.left + b.width / 2 ? 0 : 1;
      held.set(e.pointerId, i); flip(i, true);
    };
    cv.onpointerup = cv.onpointercancel = e => { const i = held.get(e.pointerId); held.delete(e.pointerId); if (i != null && ![...held.values()].includes(i)) flip(i, false); };
    addEventListener('keydown', down); addEventListener('keyup', up);
    reset();
    return {
      nodes: [room], cls: 'game pinWrap',
      tick(dt) {
        t += dt; wink = Math.max(0, wink - dt);
        for (const b of bumps) b.lit = Math.max(0, (b.lit || 0) - dt);
        pops = pops.filter(p => { p.life -= dt; p.y -= dt * 24; return p.life > 0; });
        if (mode === 'run') {
          for (let i = 0; i < 8 && mode === 'run'; i++) sub(dt / 8);
          slow = Math.hypot(ball.vx, ball.vy) < 14 ? slow + dt : 0;
          if (slow > 2) { slow = 0; ball.vy = -420; ball.vx = (Math.random() - .5) * 260; }
        }
        draw();
      },
      close() { removeEventListener('keydown', down); removeEventListener('keyup', up); }
    };
  }

  // Скруглённый прямоугольник без roundRect: старые webview его не знают.
  function round(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function pixmap(g, map, x, y, s, pal) { map.forEach((row, j) => [...row].forEach((c, i) => { if (pal[c]) { g.fillStyle = pal[c]; g.fillRect(x + i * s, y + j * s, s, s); } })); }
  // Крупная надпись автомата: градиент сверху вниз и тёмная обводка.
  function shout(g, s, x, y, size, stops, stroke = '#120403') {
    const l = g.createLinearGradient(0, y - size, 0, y);
    stops.forEach((c, i) => l.addColorStop(i / (stops.length - 1), c));
    g.font = `italic 900 ${size}px ${Art.SANS}`; g.lineJoin = 'round'; g.lineWidth = Math.max(4, size * .16); g.strokeStyle = stroke; g.strokeText(s, x, y);
    g.fillStyle = l; g.fillText(s, x, y);
  }
  const tri = v => Math.abs(((v % 2) + 2) % 2 - 1);

  // --- файрвол: ракетка пробивает стену из кирпичей ----------------------------------------------

  const FIRE = ['#ff2d55', '#ff4b1f', '#ff7a12', '#ffa412', '#ffd23f', '#ffe98a'];
  const FIRE_D = ['#7a0620', '#7a1a04', '#7a3300', '#7a4a00', '#7a5e00', '#7a6a2a'];
  const HOT = ['#ffffff', '#ffe98a', '#ff7a12', '#ff2d55'];
  // Стены: 1 кирпич, 2 сталь в два удара, x роняет бонус. Уровни идут по кругу и быстреют.
  const WALLS = [
    ['..........', '1111111111', '1111111111', '11x1111x11', '1111111111', '1111111111'],
    ['2.2.2.2.2.', '1111111111', '.11x11x11.', '..111111..', '...1xx1...', '....11....'],
    ['2222222222', '1x111111x1', '1.1.1.1.1.', '.1.1.1.1.1', '1111x11111', '2222222222'],
    ['1.1.11.1.1', 'x1112211x1', '1122xx2211', '1112222111', '.11x11x11.', '2........2']
  ];
  const PORTS = ['ПОРТ 80', 'ПОРТ 443', 'ПОРТ 8080', 'ПОРТ 22'];
  // Бонусы — летающие аватары музея: курсор расширяет ракетку, дискета даёт жизнь, банан делит шарик на три.
  const GIFTS = { cursor: ['#84ff5a', 'шире'], floppy: ['#35e6ff', '+1 жизнь'], banana: ['#ff2e9a', 'x3'] };
  function gift(g, k, x, y) {
    g.save(); g.translate(x, y);
    g.shadowColor = GIFTS[k][0]; g.shadowBlur = 12; g.fillStyle = '#120403'; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.fill();
    g.shadowBlur = 0; g.lineWidth = 2.5; g.strokeStyle = GIFTS[k][0]; g.stroke();
    if (k === 'cursor') {
      g.beginPath(); [[-4, -8], [-4, 6], [-1, 3], [2, 8], [4, 7], [1, 2], [5, 2]].forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath();
      g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#000'; g.stroke();
    } else if (k === 'floppy') {
      g.fillStyle = '#2b3a8f'; g.fillRect(-7, -7, 14, 14); g.fillStyle = '#c8cedb'; g.fillRect(-4, -7, 8, 5); g.fillStyle = '#fff'; g.fillRect(-5, 1, 10, 5);
    } else {
      g.strokeStyle = '#ffd23f'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(-3, -5, 10, .5, 2.2); g.stroke();
    }
    g.restore();
  }

  function firewall() {
    const W = 360, H = 560, id = 'firewall', COLS = 10, BW = 34, BH = 16, L = 10, RT = 350, TOP = 72, Y0 = 108, PY = 520, R = 6;
    const { cv, g } = surface(W, H, 'fireCv', 'Кирпичи');
    const box = el('div', 'fireBox'), tip = el('p', 'arcTip');
    tip.textContent = 'Води пальцем или мышью, стрелки тоже работают. Тап или пробел запускает шарик';
    box.append(cv);

    // Фон, рамка и табло не меняются: рисуем один раз.
    const k = Math.min(devicePixelRatio || 1, 2), back = Art.cv(W * k, H * k), b = back.getContext('2d');
    b.scale(k, k);
    const sky = b.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1d0805'); sky.addColorStop(.7, '#0b0504'); sky.addColorStop(1, '#2e0d05');
    b.fillStyle = sky; b.fillRect(0, 0, W, H);
    if (art.fw_side) { b.globalAlpha = .17; b.drawImage(art.fw_side, 0, TOP, W, W * 4 / 3); b.globalAlpha = 1; }
    b.fillStyle = 'rgba(255,90,31,.05)';
    for (let x = L; x <= RT; x += BW) b.fillRect(x, TOP, 1, H - TOP);
    for (let y = TOP; y < H; y += BH * 2) b.fillRect(L, y, RT - L, 1);
    b.fillStyle = '#0a0403'; b.fillRect(0, 0, W, TOP);
    const edge = b.createLinearGradient(0, 0, W, 0); FIRE.forEach((c, i) => edge.addColorStop(i / 5, c));
    b.fillStyle = edge; b.fillRect(0, TOP - 3, W, 3);
    const metal = b.createLinearGradient(0, 0, L, 0); ['#6f7687', '#ffffff', '#8d95a8'].forEach((c, i) => metal.addColorStop(i / 2, c));
    b.fillStyle = metal; b.fillRect(0, TOP, L, H - TOP); b.save(); b.translate(RT + L, 0); b.scale(-1, 1); b.fillRect(0, TOP, L, H - TOP); b.restore();
    if (art.fw_head) b.drawImage(art.fw_head, 6, 4, 64, 64);
    b.textAlign = 'left'; shout(b, 'КИРПИЧИ', 74, 36, 26, HOT);

    const tiles = {};
    function tile(kind, j) {
      const key = kind + j;
      if (tiles[key]) return tiles[key];
      const c = Art.cv(BW * k, BH * k), q = c.getContext('2d'); q.scale(k, k);
      q.fillStyle = '#120403'; q.fillRect(0, 0, BW, BH);
      const l = q.createLinearGradient(0, 1, 0, BH - 1);
      if (kind === 'steel' || kind === 'crack') { l.addColorStop(0, '#ffffff'); l.addColorStop(.45, '#8d95a8'); l.addColorStop(1, '#e9edf5'); }
      else if (kind === 'gift') { l.addColorStop(0, '#ffffff'); l.addColorStop(.3, '#ffd23f'); l.addColorStop(1, '#ff7a12'); }
      else { l.addColorStop(0, '#fff3c4'); l.addColorStop(.22, FIRE[j]); l.addColorStop(1, FIRE_D[j]); }
      q.fillStyle = l; q.fillRect(1, 1, BW - 2, BH - 2);
      q.fillStyle = 'rgba(255,255,255,.55)'; q.fillRect(3, 2, BW - 6, 2);
      if (kind === 'steel' || kind === 'crack') { q.fillStyle = '#3b3f4c'; q.fillRect(4, BH / 2 - 1, 2, 2); q.fillRect(BW - 6, BH / 2 - 1, 2, 2); }
      if (kind === 'crack') { q.strokeStyle = '#ff4b1f'; q.lineWidth = 1.5; q.beginPath(); q.moveTo(10, 1); q.lineTo(15, 8); q.lineTo(12, 11); q.lineTo(19, BH - 1); q.stroke(); }
      if (kind === 'gift') { q.fillStyle = '#7a1a04'; q.fillRect(BW / 2 - 4, 4, 8, 8); q.fillStyle = '#fff'; q.fillRect(BW / 2 - 2, 6, 4, 4); }
      if (kind === 'lava') { q.fillStyle = 'rgba(80,10,0,.35)'; q.fillRect(BW / 2, 4, 1, BH - 6); }
      return (tiles[key] = c);
    }

    let bricks, balls, drops = [], sparks = [], pops = [], score = 0, lives = 3, level = 0, mode = 'title', t = 0, overAt = 0, banner = 0, speed = 330, shake = 0, kd = 0;
    const paddle = { x: W / 2, w: 64, wide: 0 };
    let aim = W / 2;
    function serve() { balls = [{ x: paddle.x, y: PY - R - 1, vx: 0, vy: 0, stuck: true }]; drops = []; paddle.wide = 0; }
    function build() {
      bricks = [];
      WALLS[level % WALLS.length].forEach((row, j) => [...row].forEach((c, i) => {
        if (c !== '.') bricks.push({ x: L + i * BW, y: Y0 + j * BH, j, hp: c === '2' ? 2 : 1, steel: c === '2', gift: c === 'x' });
      }));
      speed = Math.min(470, 330 + level * 24);
      serve();
    }
    function reset() { score = 0; lives = 3; level = 0; sparks = []; pops = []; build(); }
    function launch() {
      for (const q of balls) if (q.stuck) { const a = (Math.random() - .5) * .7; q.stuck = false; q.vx = Math.sin(a) * speed; q.vy = -Math.cos(a) * speed; Snd.sfx('tap'); }
    }
    function press() {
      if (mode === 'title') { mode = 'run'; Snd.sfx('tap'); }
      else if (mode === 'over') { if (t - overAt > .5) { reset(); mode = 'run'; Snd.sfx('tap'); } }
      else if (mode === 'run') launch();
    }
    function take(d) {
      Snd.sfx('find'); pops.push({ s: GIFTS[d.k][1], x: d.x, y: PY - 20, life: .9 });
      if (d.k === 'cursor') paddle.wide = 12;
      else if (d.k === 'floppy') lives = Math.min(5, lives + 1);
      else {
        const q = balls.find(o => !o.stuck);
        if (!q) return launch();
        for (const s of [-1, 1]) balls.push({ x: q.x, y: q.y, vx: q.vx * .7 + s * 170, vy: -Math.abs(q.vy), stuck: false });
      }
    }
    function smash(br) {
      br.hp--; score += br.steel ? 30 : 10; Snd.blip(420 + (5 - br.j) * 70);
      if (br.hp > 0) return;
      bricks.splice(bricks.indexOf(br), 1);
      const col = br.steel ? '#e9edf5' : br.gift ? '#ffd23f' : FIRE[br.j];
      for (let i = 0; i < (LOW ? 5 : 10); i++) sparks.push({ x: br.x + BW / 2, y: br.y + BH / 2, vx: (Math.random() - .5) * 280, vy: (Math.random() - .8) * 240, life: .45 + Math.random() * .4, col });
      if (br.gift) { const ks = Object.keys(GIFTS); drops.push({ x: br.x + BW / 2, y: br.y + BH / 2, k: ks[Math.floor(Math.random() * ks.length)] }); }
      if (!bricks.length) { mode = 'clear'; banner = 1.7; score += 500; Snd.sfx('find'); }
    }
    function step(h) {
      paddle.x += Math.max(-1100 * h, Math.min(1100 * h, aim - paddle.x));
      paddle.w += ((paddle.wide > 0 ? 100 : 64) - paddle.w) * Math.min(1, h * 10);
      paddle.x = Math.max(L + paddle.w / 2, Math.min(RT - paddle.w / 2, paddle.x));
      for (const q of balls) {
        if (q.stuck) { q.x = paddle.x; q.y = PY - R - 1; continue; }
        q.x += q.vx * h; q.y += q.vy * h;
        if (q.x < L + R) { q.x = L + R; q.vx = Math.abs(q.vx); }
        if (q.x > RT - R) { q.x = RT - R; q.vx = -Math.abs(q.vx); }
        if (q.y < TOP + R) { q.y = TOP + R; q.vy = Math.abs(q.vy); }
        if (q.vy > 0 && q.y + R > PY && q.y - R < PY + 12 && Math.abs(q.x - paddle.x) < paddle.w / 2 + R) {
          const u = Math.max(-1, Math.min(1, (q.x - paddle.x) / (paddle.w / 2))), sp = Math.min(560, Math.hypot(q.vx, q.vy) + 5);
          q.vx = Math.sin(u * 1.05) * sp; q.vy = -Math.cos(u * 1.05) * sp; q.y = PY - R; Snd.sfx('tap');
        }
        for (const br of bricks) {
          const cx = Math.max(br.x, Math.min(br.x + BW, q.x)), cy = Math.max(br.y, Math.min(br.y + BH, q.y)), dx = q.x - cx, dy = q.y - cy;
          if (dx * dx + dy * dy > R * R) continue;
          const ox = Math.min(q.x + R - br.x, br.x + BW - q.x + R), oy = Math.min(q.y + R - br.y, br.y + BH - q.y + R);
          if (ox < oy) q.vx = q.x < br.x + BW / 2 ? -Math.abs(q.vx) : Math.abs(q.vx);
          else q.vy = q.y < br.y + BH / 2 ? -Math.abs(q.vy) : Math.abs(q.vy);
          smash(br); break;
        }
        if (Math.abs(q.vy) < 90) q.vy = q.vy < 0 ? -90 : 90;
      }
      balls = balls.filter(q => q.y < H + 20);
      if (!balls.length) {
        lives--; shake = .3; Snd.sfx('deny');
        if (lives > 0) serve(); else { mode = 'over'; overAt = t; best(id, score); }
      }
      for (const d of drops) { d.y += 130 * h; if (d.y > PY - 10 && d.y < PY + 16 && Math.abs(d.x - paddle.x) < paddle.w / 2 + 10) { d.got = true; take(d); } }
      drops = drops.filter(d => !d.got && d.y < H + 20);
    }

    function draw() {
      g.save();
      if (shake > 0) g.translate((Math.random() - .5) * 20 * shake, 0);
      g.drawImage(back, 0, 0, W, H);
      g.textAlign = 'left';
      text(g, PORTS[level % PORTS.length] + (level >= PORTS.length ? ` · круг ${Math.floor(level / PORTS.length) + 1}` : ''), 76, 58, `500 12px ${Art.MONO}`, '#ff9a5a');
      number(g, score, 240, 14, 110, 26, 5, AMBER);
      for (let i = 0; i < lives; i++) { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(342 - i * 14, 56, 4.5, 0, 7); g.fill(); }
      for (const br of bricks) g.drawImage(tile(br.steel ? (br.hp > 1 ? 'steel' : 'crack') : br.gift ? 'gift' : 'lava', br.j % FIRE.length), br.x, br.y, BW, BH);
      for (const s of sparks) { g.globalAlpha = Math.min(1, s.life * 2.2); g.fillStyle = s.col; g.fillRect(s.x - 2, s.y - 2, 4, 4); }
      g.globalAlpha = 1;
      for (const d of drops) gift(g, d.k, d.x, d.y);
      const px = paddle.x - paddle.w / 2, m = g.createLinearGradient(0, PY, 0, PY + 12);
      m.addColorStop(0, '#ffffff'); m.addColorStop(.5, '#8d95a8'); m.addColorStop(1, '#e9edf5');
      g.save(); g.shadowColor = '#ff5a1f'; g.shadowBlur = 16; round(g, px, PY, paddle.w, 12, 6); g.fillStyle = m; g.fill(); g.restore();
      g.fillStyle = paddle.wide > 0 ? '#84ff5a' : '#ff5a1f'; g.fillRect(px + 8, PY + 5, paddle.w - 16, 2);
      for (const q of balls) {
        for (let i = 3; i > 0; i--) { g.globalAlpha = .14 * (4 - i); g.fillStyle = '#ff7a12'; g.beginPath(); g.arc(q.x - q.vx * .011 * i, q.y - q.vy * .011 * i, R * (1 - i * .15), 0, 7); g.fill(); }
        g.globalAlpha = 1;
        const l = g.createRadialGradient(q.x - 2, q.y - 2, 1, q.x, q.y, R); l.addColorStop(0, '#fff'); l.addColorStop(.5, '#ffe98a'); l.addColorStop(1, '#ff4b1f');
        g.fillStyle = l; g.beginPath(); g.arc(q.x, q.y, R, 0, 7); g.fill();
      }
      g.textAlign = 'center';
      for (const p of pops) { g.globalAlpha = Math.min(1, p.life * 2); shout(g, p.s, p.x, p.y, 16, ['#fff', '#84ff5a']); }
      g.globalAlpha = 1;
      if (mode === 'run' && balls.some(q => q.stuck) && Math.floor(t * 2) % 2 === 0) shout(g, 'Тап или пробел: запуск', W / 2, 470, 15, ['#fff', '#ffd23f']);
      if (mode === 'clear') {
        g.fillStyle = 'rgba(10,4,3,.62)'; g.fillRect(L, 250, RT - L, 110);
        shout(g, 'ДОСТУП РАЗРЕШЁН', W / 2, 300, 28, ['#fff', '#84ff5a', '#2e8b57']);
        text(g, `дальше ${PORTS[(level + 1) % PORTS.length]}`, W / 2, 334, `500 14px ${Art.MONO}`, '#ffd23f');
      }
      if (mode === 'title' || mode === 'over') {
        g.fillStyle = 'rgba(10,3,2,.82)'; g.fillRect(0, TOP, W, H - TOP);
        g.drawImage(art.fw_head, W / 2 - 90, 110, 180, 180);
        if (mode === 'title') {
          shout(g, 'КИРПИЧИ', W / 2, 344, 50, HOT);
          text(g, 'Пробей стену. Зачем, не спрашивай.', W / 2, 378, `400 15px ${Art.SANS}`, '#ffd9c2');
          text(g, `ЛУЧШИЙ ${best(id, 0)}`, W / 2, 404, `500 13px ${Art.MONO}`, '#ff9a5a');
        } else {
          shout(g, 'ДОСТУП ЗАПРЕЩЁН', W / 2, 340, 30, HOT);
          text(g, 'Are you winning, son?', W / 2, 372, `400 16px ${Art.SANS}`, CHROME);
          text(g, `СЧЁТ ${score} · ЛУЧШИЙ ${best(id, 0)}`, W / 2, 400, `500 13px ${Art.MONO}`, '#ff9a5a');
        }
        if (Math.floor(t * 2) % 2 === 0) text(g, mode === 'title' ? 'Нажми, чтобы начать' : 'Нажми, чтобы сыграть ещё', W / 2, 452, `600 15px ${Art.SANS}`, '#fff');
      }
      g.textAlign = 'left';
      g.restore();
    }

    let drag = null;
    const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
    cv.onpointerdown = e => {
      cv.setPointerCapture(e.pointerId);
      drag = e.pointerType === 'mouse' ? null : { x: toX(e), from: paddle.x };
      if (!drag) aim = toX(e);
      press();
    };
    cv.onpointermove = e => { if (drag) aim = drag.from + (toX(e) - drag.x) * 1.4; else if (e.pointerType === 'mouse') aim = toX(e); };
    cv.onpointerup = cv.onpointercancel = () => { drag = null; };
    const down = e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); if (!kd) aim = paddle.x; kd = -1; }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); if (!kd) aim = paddle.x; kd = 1; }
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { e.preventDefault(); press(); }
    };
    const up = e => { if ((kd < 0 && (e.code === 'ArrowLeft' || e.code === 'KeyA')) || (kd > 0 && (e.code === 'ArrowRight' || e.code === 'KeyD'))) kd = 0; };
    addEventListener('keydown', down); addEventListener('keyup', up);
    reset();
    return {
      nodes: [box, tip], cls: 'game fireWrap',
      tick(dt) {
        dt = Math.min(dt, .05); t += dt;
        if (kd) aim = Math.max(L, Math.min(RT, aim + kd * 560 * dt));
        paddle.wide = Math.max(0, paddle.wide - dt); shake = Math.max(0, shake - dt); banner = Math.max(0, banner - dt);
        if (mode === 'run') for (let i = 0; i < 4 && mode === 'run'; i++) step(dt / 4);
        else if (mode === 'clear' && banner === 0) { level++; build(); mode = 'run'; }
        sparks = sparks.filter(s => { s.life -= dt; s.vy += 600 * dt; s.x += s.vx * dt; s.y += s.vy * dt; return s.life > 0; });
        pops = pops.filter(p => { p.life -= dt; p.y -= 30 * dt; return p.life > 0; });
        draw();
      },
      close() { removeEventListener('keydown', down); removeEventListener('keyup', up); }
    };
  }

  // --- антивирус: найди вирусы под плитками ------------------------------------------------------

  const VIRUS = ['.....3.....', '.3...3...3.', '..3.111.3..', '...11111...', '..1211121..', '33111111133', '..1122211..', '...11111...', '..3.111.3..', '.3...3...3.', '.....3.....'];
  const FLAG = ['...455...', '...45555.', '...455555', '...4555..', '...45....', '...4.....', '...4.....', '..444....', '.44444...'];
  const VPAL = { 1: '#7bd23c', 2: '#14210a', 3: '#8b3fd9', 4: '#2b2a26', 5: '#e0241b' };
  const NUM = ['', '#1f5fa8', '#2e8b57', '#d9332b', '#3b2c8f', '#8b1a1a', '#138a8a', '#111111', '#6b6b6b'];
  function fastest(id, v) {
    Save.arcade = Save.arcade || {};
    const k = id + '_time';
    if (v != null && (!Save.arcade[k] || v < Save.arcade[k])) { Save.arcade[k] = v; persist(); }
    if (v != null && window.Net) Net.score(id, v);
    return Save.arcade[k] || 0;
  }

  function antivirus() {
    const N = 9, MINES = 10, C = 34, FX = 12, FY = 98, W = FX * 2 + N * C, H = FY + N * C + 14, id = 'antivirus';
    const { cv, g } = surface(W, H, 'virusCv', 'Сапёр');
    const box = el('div', 'virusBox'), row = el('div', 'virusRow'), mark = el('button', 'virusFlag'), tip = el('p', 'arcTip');
    mark.type = 'button'; tip.textContent = 'Тап открывает плитку. Долгое нажатие или правая кнопка ставит флажок';
    row.append(mark); box.append(cv, row);
    let cells, state, time, boom, flagMode = false, t = 0, endAt = 0, press = null;
    const paint = () => { mark.textContent = flagMode ? 'Режим: флажок' : 'Режим: открыть'; mark.classList.toggle('on', flagMode); };
    mark.onclick = () => { flagMode = !flagMode; paint(); Snd.sfx('tap'); };
    paint();
    const at = (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? null : cells[j * N + i]);
    const around = c => { const r = []; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (di || dj) { const q = at(c.i + di, c.j + dj); if (q) r.push(q); } return r; };
    function reset() { cells = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) cells.push({ i, j, m: false, open: false, flag: false, n: 0 }); state = 'ready'; time = 0; boom = null; }
    // Первая плитка и соседи всегда чистые.
    function seed(first) {
      const safe = new Set([first, ...around(first)]);
      for (let left = MINES; left;) { const c = cells[Math.floor(Math.random() * cells.length)]; if (!c.m && !safe.has(c)) { c.m = true; left--; } }
      cells.forEach(c => { c.n = around(c).filter(q => q.m).length; });
    }
    function reveal(c) {
      if (state !== 'run' || c.open || c.flag) return;
      if (c.m) { boom = c; state = 'lost'; endAt = t; cells.forEach(q => { if (q.m) q.open = true; }); Snd.sfx('deny'); return; }
      const stack = [c];
      while (stack.length) { const q = stack.pop(); if (q.open || q.flag) continue; q.open = true; if (!q.n) around(q).forEach(r => { if (!r.open && !r.m) stack.push(r); }); }
    }
    function open(c) {
      if (state === 'won' || state === 'lost' || c.flag) return;
      if (state === 'ready') { seed(c); state = 'run'; }
      // Открытая цифра с нужным числом флажков вокруг открывает соседей.
      if (c.open) { if (c.n && around(c).filter(q => q.flag).length === c.n) around(c).forEach(reveal); }
      else reveal(c);
      if (state === 'run') Snd.sfx('tap');
      if (state === 'run' && cells.every(q => q.m || q.open)) { state = 'won'; endAt = t; cells.forEach(q => { if (q.m) q.flag = true; }); fastest(id, Math.max(1, Math.floor(time))); Snd.sfx('find'); }
    }
    function flag(c) { if (state === 'won' || state === 'lost' || c.open) return; c.flag = !c.flag; Snd.sfx(c.flag ? 'candle' : 'tap'); }

    function bevel(x, y, w, h, up, face = '#c3c3c3', d = 3) {
      g.fillStyle = face; g.fillRect(x, y, w, h);
      g.fillStyle = up ? '#ffffff' : '#7b7b7b'; g.fillRect(x, y, w, d); g.fillRect(x, y, d, h);
      g.fillStyle = up ? '#7b7b7b' : '#ffffff'; g.fillRect(x, y + h - d, w, d); g.fillRect(x + w - d, y, d, h);
    }
    function led(x, v) { g.fillStyle = '#000'; g.fillRect(x, 46, 66, 38); number(g, v, x + 4, 50, 58, 30, 3, '#ff2d2d'); }
    function draw() {
      bevel(0, 0, W, H, true);
      const bar = g.createLinearGradient(4, 0, W - 4, 0); bar.addColorStop(0, '#0a246a'); bar.addColorStop(1, '#3a6ea5');
      g.fillStyle = bar; g.fillRect(4, 4, W - 8, 26);
      g.drawImage(art.av_head, 7, 5, 24, 24);
      g.textAlign = 'left'; text(g, 'САПЁР.EXE', 36, 22, `700 13px ${Art.SANS}`, '#fff');
      g.textAlign = 'center';
      ['×', '□', '_'].forEach((s, i) => { const x = W - 26 - i * 20; bevel(x, 8, 18, 18, true, '#c3c3c3', 2); text(g, s, x + 9, 22, `700 13px ${Art.SANS}`, '#111'); });
      bevel(FX - 4, 38, W - (FX - 4) * 2, 54, false);
      led(FX + 2, Math.max(0, MINES - cells.filter(c => c.flag).length));
      led(W - FX - 68, Math.min(999, Math.floor(time)));
      bevel(W / 2 - 24, 42, 48, 46, true);
      g.drawImage(art.av_head, W / 2 - 20, 45, 40, 40);
      if (state === 'lost') { g.fillStyle = 'rgba(224,36,27,.4)'; g.fillRect(W / 2 - 21, 45, 42, 40); }
      if (state === 'won') { g.fillStyle = 'rgba(132,255,90,.35)'; g.fillRect(W / 2 - 21, 45, 42, 40); }
      bevel(FX - 4, FY - 4, N * C + 8, N * C + 8, false, '#bdbdbd');
      for (const c of cells) {
        const x = FX + c.i * C, y = FY + c.j * C;
        if (!c.open) {
          bevel(x, y, C, C, !(press && press.c === c && !press.done && !c.flag));
          if (c.flag) pixmap(g, FLAG, x + 8, y + 8, 2, VPAL);
          if (c.flag && state === 'lost' && !c.m) { g.strokeStyle = '#e0241b'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 7, y + 7); g.lineTo(x + C - 7, y + C - 7); g.moveTo(x + C - 7, y + 7); g.lineTo(x + 7, y + C - 7); g.stroke(); }
        } else {
          g.fillStyle = c === boom ? '#ff5a4f' : '#bdbdbd'; g.fillRect(x, y, C, C);
          g.fillStyle = '#8a8a8a'; g.fillRect(x, y, C, 1); g.fillRect(x, y, 1, C);
          if (c.m) pixmap(g, VIRUS, x + 6, y + 6, 2, VPAL);
          else if (c.n) text(g, c.n, x + C / 2, y + 26, `26px ${PIXEL}`, NUM[c.n]);
        }
      }
      if (state === 'won' || state === 'lost') {
        const bx = FX + 18, by = FY + 96, bw = N * C - 36;
        bevel(bx, by, bw, 116, true);
        g.fillStyle = state === 'lost' ? '#a3150f' : bar; g.fillRect(bx + 4, by + 4, bw - 8, 24);
        text(g, state === 'lost' ? 'ЗАРАЖЕНО' : 'СИСТЕМА ЧИСТА', W / 2, by + 22, `700 14px ${Art.SANS}`, '#fff');
        if (state === 'lost') text(g, 'Are you winning, son?', W / 2, by + 58, `22px ${PIXEL}`, '#111');
        else text(g, `${Math.max(1, Math.floor(time))} с · рекорд ${fastest(id)} с`, W / 2, by + 58, `22px ${PIXEL}`, '#111');
        if (Math.floor(t * 2) % 2 === 0) text(g, 'Нажми, чтобы проверить ещё раз', W / 2, by + 92, `400 13px ${Art.SANS}`, '#333');
      }
      g.textAlign = 'left';
    }

    const spot = e => {
      const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W, y = (e.clientY - b.top) / b.height * H;
      return { x, y, c: x < FX || y < FY ? null : at(Math.floor((x - FX) / C), Math.floor((y - FY) / C)) };
    };
    cv.oncontextmenu = e => e.preventDefault();
    cv.onpointerdown = e => {
      e.preventDefault();
      const p = spot(e);
      if (p.y > 40 && p.y < 90 && Math.abs(p.x - W / 2) < 26) { reset(); Snd.sfx('tap'); return; }
      if (state === 'won' || state === 'lost') { if (t - endAt > .5) reset(); return; }
      if (!p.c) return;
      if (e.button === 2) return flag(p.c);
      press = { c: p.c, at: t, done: false, id: e.pointerId };
    };
    cv.onpointermove = e => { if (press && press.id === e.pointerId && spot(e).c !== press.c) press = null; };
    cv.onpointerup = e => {
      if (!press || press.id !== e.pointerId) return;
      const { c, done } = press; press = null;
      if (!done) { if (flagMode) flag(c); else open(c); }
    };
    cv.onpointercancel = () => { press = null; };
    const key = e => { if (e.code === 'KeyF') { flagMode = !flagMode; paint(); } };
    addEventListener('keydown', key);
    reset();
    return {
      nodes: [box, tip], cls: 'game virusWrap',
      tick(dt) {
        t += dt;
        if (state === 'run') time += dt;
        // Долгое нажатие делает обратное действие: в обычном режиме флажок, в режиме флажка открывает.
        if (press && !press.done && t - press.at > .38) { press.done = true; if (flagMode) open(press.c); else flag(press.c); if (navigator.vibrate) navigator.vibrate(15); }
        draw();
      },
      close() { removeEventListener('keydown', key); }
    };
  }

  // --- загрузка: падающие фигуры собираются в полосу прогресса ------------------------------------

  const PIECES = [['....', '1111', '....', '....'], ['11', '11'], ['.1.', '111', '...'], ['..1', '111', '...'], ['1..', '111', '...'], ['.11', '11.', '...'], ['11.', '.11', '...']];
  const JELLY = ['#35e6ff', '#ffd23f', '#c86bff', '#ff9a3c', '#3c8cff', '#84ff5a', '#ff4f9a'];
  const FILES = ['мем_финал_ФИНАЛ2.jpg', 'курсовая_v7.docx', 'kotik.gif', 'фото_с_дачи.zip', 'обновление 1 из 147', 'весь_интернет.rar'];
  const ETA = ['осталось 3 сек', 'осталось 2 мин', 'осталось 4 часа', 'осталось 1 сек', 'осталось 12 лет', 'осталось ∞', 'почти всё', 'осталось 5 мин'];
  const NAVY = '#0b3a66';
  // Стеклянный кубик с бликом: один спрайт на цвет.
  function jellies(C, k) {
    return JELLY.map(col => {
      const c = Art.cv(C * k, C * k), q = c.getContext('2d'); q.scale(k, k);
      round(q, 1, 1, C - 2, C - 2, 6); q.fillStyle = col; q.fill();
      const l = q.createLinearGradient(0, 0, 0, C); l.addColorStop(0, 'rgba(255,255,255,.75)'); l.addColorStop(.45, 'rgba(255,255,255,.05)'); l.addColorStop(1, 'rgba(0,40,90,.35)');
      q.fillStyle = l; q.fill(); q.lineWidth = 1.5; q.strokeStyle = 'rgba(0,40,90,.45)'; q.stroke();
      q.fillStyle = 'rgba(255,255,255,.85)'; q.beginPath(); q.ellipse(C * .36, C * .26, C * .22, C * .1, -.3, 0, 7); q.fill();
      return c;
    });
  }

  function loading() {
    const COLS = 10, ROWS = 18, C = 24, BX = 12, BY = 48, W = 360, H = BY + ROWS * C + 12, SX = BX + COLS * C + 12, id = 'loading';
    const { cv, g } = surface(W, H, 'loadCv', 'Блоки');
    const box = el('div', 'loadBox'), pad = el('div', 'loadPad');
    let rep = null;
    const key = (label, s, fn, hold) => {
      const b = el('button'); b.type = 'button'; b.textContent = s; b.setAttribute('aria-label', label);
      b.onpointerdown = e => { e.preventDefault(); if (mode !== 'run') return press(); fn(); if (hold) rep = { fn, next: t + .17, id: e.pointerId }; };
      b.onpointerup = b.onpointercancel = b.onpointerleave = () => { rep = null; };
      return b;
    };
    pad.append(key('Влево', '←', () => shift(-1), true), key('Вправо', '→', () => shift(1), true), key('Сбросить вниз', '↓', () => drop()), key('Повернуть', '↻', () => turn()));
    box.append(cv, pad);

    const k = Math.min(devicePixelRatio || 1, 2), sprite = jellies(C, k), back = Art.cv(W * k, H * k), b = back.getContext('2d');
    b.scale(k, k);
    const sky = b.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#effcff'); sky.addColorStop(.5, '#8fdcff'); sky.addColorStop(1, '#2f9be0');
    b.fillStyle = sky; b.fillRect(0, 0, W, H);
    if (art.ld_side) { b.globalAlpha = .3; b.drawImage(art.ld_side, 0, BY - 20, W, W * 4 / 3); b.globalAlpha = 1; }
    round(b, BX - 4, BY - 4, COLS * C + 8, ROWS * C + 8, 12); b.fillStyle = 'rgba(255,255,255,.42)'; b.fill(); b.lineWidth = 2; b.strokeStyle = 'rgba(255,255,255,.95)'; b.stroke();
    b.fillStyle = 'rgba(11,58,102,.06)';
    for (let i = 1; i < COLS; i++) b.fillRect(BX + i * C, BY, 1, ROWS * C);
    for (let j = 1; j < ROWS; j++) b.fillRect(BX, BY + j * C, COLS * C, 1);
    const card = (y, h) => { round(b, SX, y, W - SX - 8, h, 12); b.fillStyle = 'rgba(255,255,255,.55)'; b.fill(); b.lineWidth = 1.5; b.strokeStyle = '#fff'; b.stroke(); };
    card(BY - 4, 86); card(BY + 92, 216); card(BY + 318, 118);
    if (art.ld_head) b.drawImage(art.ld_head, SX + 6, BY + 324, W - SX - 20, W - SX - 20);
    b.textAlign = 'center'; b.font = `700 11px ${Art.MONO}`; b.fillStyle = NAVY;
    const mid = (SX + W - 8) / 2;
    ['ДАЛЕЕ'].forEach(s => b.fillText(s, mid, BY + 12));
    [['ФАЙЛ', 110], ['СКОРОСТЬ', 166], ['ЛИНИИ', 212], ['СЧЁТ', 258]].forEach(([s, y]) => b.fillText(s, mid, BY + y));

    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1)), bag = [];
    let cur, next, score = 0, lines = 0, level = 0, mode = 'title', t = 0, fall = 0, overAt = 0, clearing = null, clearT = 0, banner = 0, eta = 0, etaT = 0, shown = 0, touch = null;
    const bubbles = Array.from({ length: LOW ? 6 : 12 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, r: 3 + Math.random() * 7, v: 14 + Math.random() * 22, p: i }));
    const pull = () => { if (!bag.length) { bag.push(0, 1, 2, 3, 4, 5, 6); for (let i = 6; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return bag.pop(); };
    const make = n => { const m = PIECES[n].map(r => [...r].map(c => c === '1')); return { m, c: n, x: Math.floor((COLS - m[0].length) / 2), y: n === 0 ? -1 : 0 }; };
    const fits = (p, dx = 0, dy = 0, m = p.m) => m.every((r, j) => r.every((on, i) => { if (!on) return true; const x = p.x + i + dx, y = p.y + j + dy; return x >= 0 && x < COLS && y < ROWS && (y < 0 || grid[y][x] < 0); }));
    const speed = () => Math.max(.07, .72 - level * .07);
    function over() { mode = 'over'; overAt = t; best(id, score); Snd.sfx('deny'); }
    function spawn() { cur = next || make(pull()); next = make(pull()); if (!fits(cur)) over(); }
    function reset() { grid.forEach(r => r.fill(-1)); score = 0; lines = 0; level = 0; next = null; clearing = null; banner = 0; spawn(); }
    function press() {
      if (mode === 'title') { mode = 'run'; Snd.sfx('tap'); }
      else if (mode === 'over' && t - overAt > .5) { reset(); mode = 'run'; Snd.sfx('tap'); }
    }
    const live = () => mode === 'run' && !clearing;
    function shift(d) { if (live() && fits(cur, d, 0)) cur.x += d; }
    function turn() {
      if (!live()) return;
      const m = cur.m[0].map((_, i) => cur.m.map(r => r[i]).reverse());
      for (const dx of [0, -1, 1, -2, 2]) if (fits(cur, dx, 0, m)) { cur.m = m; cur.x += dx; Snd.sfx('tap'); return; }
    }
    function lock() {
      let top = false;
      cur.m.forEach((r, j) => r.forEach((on, i) => { if (!on) return; const y = cur.y + j; if (y < 0) top = true; else grid[y][cur.x + i] = cur.c; }));
      if (top) return over();
      const full = grid.map((r, j) => (r.every(v => v >= 0) ? j : -1)).filter(j => j >= 0);
      if (full.length) { clearing = full; clearT = .3; score += [0, 100, 300, 500, 800][full.length] * (level + 1); Snd.sfx(full.length > 3 ? 'find' : 'plant'); }
      else { Snd.blip(260); spawn(); }
    }
    function fall1() { if (fits(cur, 0, 1)) { cur.y++; return true; } lock(); return false; }
    function soft() { if (live()) { if (fall1()) score += 1; fall = 0; } }
    function drop() { if (!live()) return; let n = 0; while (fits(cur, 0, 1)) { cur.y++; n++; } score += n * 2; fall = 0; lock(); }
    // Каждые десять линий файл догружается и начинается следующий, побыстрее.
    function cleared() {
      clearing.forEach(j => { grid.splice(j, 1); grid.unshift(Array(COLS).fill(-1)); });
      lines += clearing.length; clearing = null;
      if (lines >= (level + 1) * 10) { level++; banner = 2; Snd.sfx('find'); }
      spawn();
    }

    function piece(p, x0, y0, s, ghost) {
      p.m.forEach((r, j) => r.forEach((on, i) => {
        if (!on || p.y + j < 0) return;
        const x = x0 + (p.x + i) * s, y = y0 + (p.y + j) * s;
        if (ghost) { round(g, x + 2, y + 2, s - 4, s - 4, 5); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke(); }
        else g.drawImage(sprite[p.c], x, y, s, s);
      }));
    }
    function draw() {
      g.drawImage(back, 0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2;
      for (const q of bubbles) { g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(q.x - q.r * .45, q.y - q.r * .5, q.r * .35, q.r * .35); }
      const goal = Math.min(100, (lines - level * 10) * 10);
      round(g, BX - 4, 8, W - BX * 2 + 8, 30, 15); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke();
      if (shown > .5) {
        const l = g.createLinearGradient(0, 11, 0, 35); l.addColorStop(0, '#d8ffb0'); l.addColorStop(.5, '#6fdc2a'); l.addColorStop(1, '#2e9a12');
        round(g, BX - 1, 11, (W - BX * 2 + 2) * shown / 100, 24, 12); g.fillStyle = l; g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; for (let x = BX + 8 - (t * 30) % 16; x < BX + (W - BX * 2) * shown / 100 - 6; x += 16) g.fillRect(x, 13, 6, 20);
      }
      g.textAlign = 'center'; text(g, `ЗАГРУЗКА ${Math.round(shown)}% · ${ETA[eta]}`, W / 2, 28, `700 13px ${Art.SANS}`, NAVY);
      shown += (goal - shown) * .12;
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (grid[j][i] >= 0) g.drawImage(sprite[grid[j][i]], BX + i * C, BY + j * C, C, C);
      if (clearing) { g.fillStyle = `rgba(255,255,255,${Math.min(1, clearT * 4)})`; clearing.forEach(j => { round(g, BX, BY + j * C, COLS * C, C, 10); g.fill(); }); }
      if (mode === 'run' && !clearing) {
        let gy = 0; while (fits(cur, 0, gy + 1)) gy++;
        piece({ m: cur.m, x: cur.x, y: cur.y + gy }, BX, BY, C, true);
        piece(cur, BX, BY, C);
      }
      const nm = next.m, nw = nm[0].length, nh = nm.length, s = 18;
      piece({ m: nm, c: next.c, x: 0, y: 0 }, (SX + W - 8) / 2 - nw * s / 2, BY + 22 + (4 - nh) * s / 2 - (next.c === 0 ? s / 2 : 0), s);
      const mid = (SX + W - 8) / 2, name = FILES[level % FILES.length];
      text(g, name.length > 11 ? name.slice(0, 10) + '…' : name, mid, BY + 128, `600 11px ${Art.SANS}`, NAVY);
      text(g, String(level + 1), mid, BY + 190, `800 22px ${Art.SANS}`, NAVY);
      text(g, String(lines), mid, BY + 236, `800 22px ${Art.SANS}`, NAVY);
      text(g, String(score), mid, BY + 282, `800 ${score > 99999 ? 15 : 19}px ${Art.SANS}`, NAVY);
      text(g, `рекорд ${best(id, 0)}`, mid, BY + 300, `400 10px ${Art.MONO}`, NAVY);
      if (banner > 0) {
        round(g, BX + 14, BY + 150, COLS * C - 28, 104, 18); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill();
        shout(g, 'ФАЙЛ ЗАГРУЖЕН', BX + COLS * C / 2, BY + 190, 22, ['#fff', '#6fdc2a', '#2e9a12'], NAVY);
        text(g, FILES[(level - 1) % FILES.length], BX + COLS * C / 2, BY + 216, `600 13px ${Art.SANS}`, NAVY);
        text(g, `дальше: ${FILES[level % FILES.length]}`, BX + COLS * C / 2, BY + 238, `400 12px ${Art.SANS}`, '#2f6f9f');
      }
      if (mode === 'title' || mode === 'over') {
        g.fillStyle = 'rgba(236,251,255,.86)'; g.fillRect(0, 0, W, H);
        g.drawImage(art.ld_head, W / 2 - 85, 70, 170, 170);
        if (mode === 'title') {
          shout(g, 'БЛОКИ', W / 2, 296, 44, ['#ffffff', '#7fd8ff', '#1e6fd0'], NAVY);
          text(g, 'Собирай линии. Файл сам себя не скачает.', W / 2, 330, `400 14px ${Art.SANS}`, NAVY);
          text(g, `РЕКОРД ${best(id, 0)}`, W / 2, 356, `500 13px ${Art.MONO}`, '#2f6f9f');
        } else {
          shout(g, 'ИГРА ОКОНЧЕНА', W / 2, 292, 28, ['#ffffff', '#ff9ac4', '#d9332b'], NAVY);
          text(g, 'Are you winning, son?', W / 2, 324, `400 16px ${Art.SANS}`, NAVY);
          text(g, `СЧЁТ ${score} · РЕКОРД ${best(id, 0)}`, W / 2, 352, `500 13px ${Art.MONO}`, '#2f6f9f');
        }
        if (Math.floor(t * 2) % 2 === 0) text(g, mode === 'title' ? 'Нажми, чтобы начать' : 'Нажми, чтобы сыграть ещё', W / 2, 402, `600 15px ${Art.SANS}`, NAVY);
      }
      g.textAlign = 'left';
    }

    cv.onpointerdown = e => {
      cv.setPointerCapture(e.pointerId);
      if (mode !== 'run') return press();
      touch = { x: e.clientX, y: e.clientY, y0: e.clientY, at: t, moved: false };
    };
    cv.onpointermove = e => {
      if (!touch) return;
      const step = cv.getBoundingClientRect().width / W * C;
      while (e.clientX - touch.x > step) { shift(1); touch.x += step; touch.moved = true; }
      while (touch.x - e.clientX > step) { shift(-1); touch.x -= step; touch.moved = true; }
      while (e.clientY - touch.y > step) { soft(); touch.y += step; touch.moved = true; }
    };
    cv.onpointerup = e => {
      if (!touch) return;
      const quick = t - touch.at < .3;
      if (quick && e.clientY - touch.y0 > 70) drop(); else if (quick && !touch.moved) turn();
      touch = null;
    };
    cv.onpointercancel = () => { touch = null; };
    const keys = e => {
      const c = e.code;
      if (mode !== 'run') { if (c === 'Space' || c === 'Enter') { e.preventDefault(); press(); } return; }
      if (c === 'ArrowLeft' || c === 'KeyA') shift(-1);
      else if (c === 'ArrowRight' || c === 'KeyD') shift(1);
      else if (c === 'ArrowDown' || c === 'KeyS') soft();
      else if (c === 'ArrowUp' || c === 'KeyW' || c === 'KeyX') turn();
      else if (c === 'Space') drop();
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', keys);
    reset();
    return {
      nodes: [box], cls: 'game loadWrap',
      tick(dt) {
        dt = Math.min(dt, .05); t += dt; banner = Math.max(0, banner - dt);
        if ((etaT -= dt) <= 0) { eta = Math.floor(Math.random() * ETA.length); etaT = 1.4 + Math.random() * 1.8; }
        if (rep && t > rep.next) { rep.fn(); rep.next = t + .07; }
        if (mode === 'run') {
          if (clearing) { if ((clearT -= dt) <= 0) cleared(); }
          else if ((fall += dt) > speed()) { fall = 0; fall1(); }
        }
        for (const q of bubbles) { q.y -= q.v * dt; q.x += Math.sin(t + q.p) * 6 * dt; if (q.y < -10) { q.y = H + 10; q.x = Math.random() * W; } }
        draw();
      },
      close() { removeEventListener('keydown', keys); }
    };
  }

  // Заставки на экранах автоматов в зале. По умолчанию змейка.
  function fireScreen(g, w, h, t) {
    g.fillStyle = '#120605'; g.fillRect(0, 0, w, h);
    const cols = 8, bw = w / cols, tick = Math.floor(t * 2);
    for (let j = 0; j < 4; j++) for (let i = 0; i < cols; i++) {
      if ((i * 5 + j * 3 + tick) % 6 === 0) continue;
      g.fillStyle = '#120403'; g.fillRect(i * bw, 62 + j * 18, bw, 18);
      g.fillStyle = FIRE[j + 1]; g.fillRect(i * bw + 2, 64 + j * 18, bw - 4, 14);
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(i * bw + 4, 65 + j * 18, bw - 8, 2);
    }
    const bx = 16 + tri(t * .55) * (w - 32), by = 150 + tri(t * .9) * -70 + 60;
    g.save(); g.shadowColor = '#ff7a12'; g.shadowBlur = 18; g.fillStyle = '#ffe98a'; g.beginPath(); g.arc(bx, by, 7, 0, 7); g.fill(); g.restore();
    g.fillStyle = '#e9edf5'; g.fillRect(Math.max(0, Math.min(w - 70, bx - 35)), h - 26, 70, 10);
    g.fillStyle = '#0a0403'; g.fillRect(0, 0, w, 54);
    g.textAlign = 'center'; shout(g, 'КИРПИЧИ', w / 2, 42, 36, HOT);
    if (Math.floor(t * 1.6) % 2) text(g, 'НАЖМИ СТАРТ', w / 2, h - 34, `600 18px ${Art.SANS}`, '#ffd23f');
    g.textAlign = 'left';
  }
  function virusScreen(g, w, h, t) {
    g.fillStyle = '#138a8a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c3c3c3'; g.fillRect(14, 12, w - 28, h - 24);
    const bar = g.createLinearGradient(14, 0, w - 14, 0); bar.addColorStop(0, '#0a246a'); bar.addColorStop(1, '#3a6ea5');
    g.fillStyle = bar; g.fillRect(17, 15, w - 34, 30);
    g.textAlign = 'center'; text(g, 'САПЁР.EXE', w / 2, 37, `700 20px ${Art.SANS}`, '#fff');
    const C = 26, cols = 10, rows = 6, x0 = (w - cols * C) / 2, y0 = 56, phase = Math.floor(t * 3) % 40;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = x0 + i * C, y = y0 + j * C, n = (i * 7 + j * 13) % 40, virus = (i * 3 + j * 5) % 11 === 0;
      if (n < phase) {
        g.fillStyle = '#bdbdbd'; g.fillRect(x, y, C, C); g.fillStyle = '#8a8a8a'; g.fillRect(x, y, C, 1); g.fillRect(x, y, 1, C);
        if (virus) pixmap(g, VIRUS, x + 2, y + 2, 2, VPAL); else if ((i + j) % 4 === 1) text(g, String(1 + (i * j) % 3), x + C / 2, y + 20, `20px ${PIXEL}`, NUM[1 + (i * j) % 3]);
      } else {
        g.fillStyle = '#c3c3c3'; g.fillRect(x, y, C, C); g.fillStyle = '#fff'; g.fillRect(x, y, C, 2); g.fillRect(x, y, 2, C); g.fillStyle = '#7b7b7b'; g.fillRect(x, y + C - 2, C, 2); g.fillRect(x + C - 2, y, 2, C);
        if (virus && n % 3 === 0) pixmap(g, FLAG, x + 4, y + 4, 2, VPAL);
      }
    }
    const cx = x0 + tri(t * .3) * cols * C, cy = y0 + tri(t * .47) * rows * C;
    g.beginPath(); [[0, 0], [0, 18], [5, 13], [9, 21], [12, 20], [8, 12], [15, 12]].forEach(([a, b], i) => (i ? g.lineTo(cx + a, cy + b) : g.moveTo(cx + a, cy + b))); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#000'; g.stroke();
    g.textAlign = 'left';
  }
  let jellyCache = null;
  function loadScreen(g, w, h, t) {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#effcff'); sky.addColorStop(1, '#3fa8ea');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    jellyCache = jellyCache || jellies(24, 1);
    for (let i = 0; i < 9; i++) { const y = ((t * 40 + i * 53) % (h + 40)) - 30, x = 18 + ((i * 37) % 11) * 26; g.drawImage(jellyCache[i % 7], x, y, 24, 24); }
    const pct = Math.floor((t * 9) % 101);
    round(g, 20, h - 56, w - 40, 26, 13); g.fillStyle = 'rgba(255,255,255,.8)'; g.fill();
    round(g, 22, h - 54, (w - 44) * pct / 100 + 1, 22, 11); g.fillStyle = '#6fdc2a'; g.fill();
    g.textAlign = 'center'; text(g, `${pct}%`, w / 2, h - 37, `800 15px ${Art.SANS}`, NAVY);
    shout(g, 'БЛОКИ', w / 2, 52, 38, ['#ffffff', '#7fd8ff', '#1e6fd0'], NAVY);
    if (Math.floor(t * 1.6) % 2) text(g, 'НАЖМИ СТАРТ', w / 2, h - 70, `700 16px ${Art.SANS}`, NAVY);
    g.textAlign = 'left';
  }
  const SCREENS = { firewall: fireScreen, antivirus: virusScreen, loading: loadScreen };
  function screen(g, w, h, t, id) {
    if (left) return;
    if (SCREENS[id]) return SCREENS[id](g, w, h, t);
    g.imageSmoothingEnabled = false;
    g.fillStyle = LCD[3]; g.fillRect(0, 0, w, h);
    const n = 10, X = q => w / 2 + Math.sin(t * 1.3 - q * .5) * (w * .34), Y = q => h * .6 + Math.sin(t * 2 - q * .5) * 26;
    for (let i = n; i > 0; i--) { const x = Math.round(X(i) / 6) * 6, y = Math.round(Y(i) / 6) * 6; g.fillStyle = LCD[0]; g.fillRect(x - 12, y - 12, 24, 24); g.fillStyle = i % 2 ? LCD[2] : LCD[1]; g.fillRect(x - 8, y - 8, 16, 16); }
    g.save(); g.translate(X(0), Y(0)); if (Math.cos(t * 1.3) < 0) g.scale(-1, 1); g.drawImage(art.snake_head, -48, -48, 96, 96); g.restore();
    g.fillStyle = LCD[0]; g.fillRect(0, 0, w, 54);
    g.textAlign = 'center';
    text(g, 'ЗМЕЙКА', w / 2, 40, `40px ${PIXEL}`, LCD[3]);
    if (Math.floor(t * 1.6) % 2) text(g, 'НАЖМИ СТАРТ', w / 2, h - 14, `22px ${PIXEL}`, LCD[0]);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(15,56,15,.1)'; for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 1, h); for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
  }

  const GAMES = { snake, pinball, firewall, antivirus, loading };
  window.Arcade = { make: id => GAMES[id](), screen, ready, art, shout };
})();

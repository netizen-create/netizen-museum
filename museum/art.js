// Тридцать работ-заглушек. Каждая рисуется кодом на canvas; потом сюда встанут файлы художников.
(function () {
  const SANS = '"Geologica",system-ui,sans-serif';
  const MONO = '"JetBrains Mono",ui-monospace,monospace';
  const OS = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

  const rng = s => () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const lerp = (a, b, t) => a + (b - a) * t;

  function wrap(g, str, x, y, maxW, lh) {
    let line = '';
    for (const word of str.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (g.measureText(next).width > maxW && line) { g.fillText(line, x, y); y += lh; line = word; } else line = next;
    }
    g.fillText(line, x, y);
    return y + lh;
  }

  function sunset(g, w, h, seed, pal) {
    const r = rng(seed), hz = h * .62;
    const sky = g.createLinearGradient(0, 0, 0, hz);
    pal.sky.forEach((c, i) => sky.addColorStop(i / (pal.sky.length - 1), c));
    g.fillStyle = sky; g.fillRect(0, 0, w, hz);
    const sx = w * .56, sy = hz * .86, sr = h * .11;
    const halo = g.createRadialGradient(sx, sy, 0, sx, sy, h * .62);
    halo.addColorStop(0, pal.glow); halo.addColorStop(1, 'rgba(255,160,90,0)');
    g.fillStyle = halo; g.fillRect(0, 0, w, hz);
    g.fillStyle = pal.sun; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
    g.globalAlpha = .34;
    for (let i = 0; i < 46; i++) {
      const y = r() * hz * .92, x = r() * w, l = w * (.08 + r() * .4), t = 1 + r() * h * .016;
      g.fillStyle = r() > .5 ? pal.cloudA : pal.cloudB;
      g.beginPath(); g.ellipse(x, y, l, t, 0, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    const sea = g.createLinearGradient(0, hz, 0, h);
    sea.addColorStop(0, pal.sea[0]); sea.addColorStop(1, pal.sea[1]);
    g.fillStyle = sea; g.fillRect(0, hz, w, h - hz);
    for (let y = hz; y < h; y += 1 + (y - hz) * .014) {
      const f = (y - hz) / (h - hz), hw = sr * (.7 + f * 1.9) * (.6 + r() * .8);
      g.globalAlpha = (1 - f * .55) * (.25 + r() * .6);
      g.fillStyle = pal.sun;
      g.fillRect(sx - hw + (r() - .5) * 14 * f, y, hw * 2, 1 + f * 3);
    }
    g.globalAlpha = 1;
  }
  const DUSK = { sky: ['#1a2348', '#51407e', '#c35a6b', '#f39a57'], glow: 'rgba(255,190,120,.85)', sun: '#ffe0a6', cloudA: '#6c3f6b', cloudB: '#f0886a', sea: ['#7b4258', '#141a33'] };
  const TOXIC = { sky: ['#07121d', '#0c3a4a', '#1f8a7c', '#d3d36a'], glow: 'rgba(200,255,170,.8)', sun: '#f6ffc8', cloudA: '#0f4a54', cloudB: '#9ee08a', sea: ['#1c5a56', '#04090f'] };

  function bandDecay(g, src, w, h, bands) {
    const r = rng(9);
    g.imageSmoothingEnabled = false;
    const bw = w / bands;
    for (let i = 0; i < bands; i++) {
      const p = i / (bands - 1), b = Math.round(Math.pow(2, p * p * 6.4));
      const x = Math.floor(i * bw), ww = Math.ceil(bw) + 1;
      const sw = Math.max(1, Math.ceil(ww / b)), sh = Math.max(1, Math.ceil(h / b));
      const t = cv(sw, sh), c = t.getContext('2d');
      c.imageSmoothingEnabled = true;
      c.drawImage(src, x, 0, ww, h, 0, 0, sw, sh);
      g.drawImage(t, 0, 0, sw, sh, x, 0, sw * b, sh * b);
      if (p > .4) {
        const n = 90 * p * p;
        for (let k = 0; k < n; k++) {
          const s = b * (r() > .7 ? 2 : 1), bx = x + Math.floor(r() * ww / s) * s, by = Math.floor(r() * h / s) * s;
          g.globalCompositeOperation = r() > .5 ? 'overlay' : 'soft-light';
          g.fillStyle = ['#0ff', '#f0f', '#ff0', '#0a3', '#f30'][Math.floor(r() * 5)];
          g.globalAlpha = .16 + p * .3;
          g.fillRect(bx, by, s, s);
        }
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      }
    }
  }

  const P = {
    hero(g, w, h) {
      const s = cv(w, h); sunset(s.getContext('2d'), w, h, 11, DUSK);
      bandDecay(g, s, w, h, 26);
    },
    avatar(g, w, h) {
      const bg = g.createRadialGradient(w * .45, h * .34, 10, w * .5, h * .5, h * .8);
      bg.addColorStop(0, '#4a4538'); bg.addColorStop(.6, '#25221b'); bg.addColorStop(1, '#0e0d0a');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const fig = g.createLinearGradient(w * .2, 0, w * .8, h);
      fig.addColorStop(0, '#b8b6ae'); fig.addColorStop(.55, '#8c8a83'); fig.addColorStop(1, '#55534d');
      g.fillStyle = fig;
      g.beginPath(); g.arc(w / 2, h * .4, w * .19, 0, 7); g.fill();
      g.beginPath(); g.ellipse(w / 2, h * 1.02, w * .36, h * .39, 0, 0, 7); g.fill();
      const r = rng(3);
      g.globalAlpha = .05;
      for (let i = 0; i < 9000; i++) { g.fillStyle = r() > .5 ? '#fff' : '#000'; g.fillRect(r() * w, r() * h, 2, 2); }
      g.globalAlpha = 1;
    },
    rothko(g, w, h, _, o) {
      const c = cv(w / 6 | 0, h / 6 | 0), x = c.getContext('2d'), cw = c.width, ch = c.height;
      x.fillStyle = o.bg; x.fillRect(0, 0, cw, ch);
      x.filter = 'blur(2.4px)';
      x.fillStyle = o.a; x.fillRect(cw * .09, ch * .08, cw * .82, ch * .5);
      x.fillStyle = o.b; x.fillRect(cw * .1, ch * .63, cw * .8, ch * .29);
      x.filter = 'none';
      const d = x.getImageData(0, 0, cw, ch), B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = 0; y < ch; y++) for (let i = 0; i < cw; i++) {
        const p = (y * cw + i) * 4, th = (B[(y % 4) * 4 + (i % 4)] + .5) / 16 - .5;
        for (let k = 0; k < 3; k++) d.data[p + k] = Math.max(0, Math.min(255, Math.round((d.data[p + k] + th * 51) / 51) * 51));
      }
      x.putImageData(d, 0, 0);
      g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, w, h);
    },
    spinner(g, w, h, t) {
      g.fillStyle = '#efede7'; g.fillRect(0, 0, w, h);
      const n = 12, a = Math.floor(t * 10) / n * 6.283;
      for (let i = 0; i < n; i++) {
        const q = i / n * 6.283 + a;
        g.strokeStyle = `rgba(22,22,24,${.08 + .92 * (i / n)})`;
        g.lineWidth = w * .05; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(w / 2 + Math.cos(q) * w * .18, h / 2 + Math.sin(q) * w * .18);
        g.lineTo(w / 2 + Math.cos(q) * w * .33, h / 2 + Math.sin(q) * w * .33);
        g.stroke();
      }
    },
    meme(g, w, h) {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#6d675c'); bg.addColorStop(1, '#3b3730');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.textAlign = 'center'; g.lineJoin = 'round'; g.fillStyle = '#fff'; g.strokeStyle = '#000';
      g.font = `900 ${w * .092}px ${SANS}`; g.lineWidth = w * .017;
      g.strokeText('ВЕРХНИЙ ТЕКСТ', w / 2, h * .15); g.fillText('ВЕРХНИЙ ТЕКСТ', w / 2, h * .15);
      g.strokeText('НИЖНИЙ ТЕКСТ', w / 2, h * .93); g.fillText('НИЖНИЙ ТЕКСТ', w / 2, h * .93);
      g.textAlign = 'left';
    },
    wifi(g, w, h) {
      const bg = g.createRadialGradient(w / 2, h * .46, 0, w / 2, h * .46, h * .7);
      bg.addColorStop(0, '#3b2c0d'); bg.addColorStop(1, '#0c0a06');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * .66;
      g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const rad = w * (.16 + i * .13);
        const grad = g.createLinearGradient(cx - rad, 0, cx + rad, 0);
        grad.addColorStop(0, '#8a6519'); grad.addColorStop(.5, '#f4dc8e'); grad.addColorStop(1, '#8a6519');
        g.strokeStyle = grad; g.lineWidth = w * .055;
        g.beginPath(); g.arc(cx, cy, rad, -2.42, -.72); g.stroke();
      }
      g.fillStyle = '#f4dc8e'; g.beginPath(); g.arc(cx, cy, w * .05, 0, 7); g.fill();
      g.textAlign = 'center'; g.fillStyle = '#c9a855'; g.font = `400 ${w * .036}px ${SANS}`;
      g.fillText('Подключено, без интернета', cx, h * .86);
      g.textAlign = 'left';
    },
    cookie(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#2d4e7c'); sky.addColorStop(.55, '#8fa9b8'); sky.addColorStop(1, '#e6d3a8');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const r = rng(21);
      for (let i = 0; i < 70; i++) {
        const x = r() * w, y = h * (.25 + r() * .7), rad = w * (.03 + r() * .12);
        const c = g.createRadialGradient(x, y, 0, x, y, rad);
        c.addColorStop(0, 'rgba(255,240,215,.5)'); c.addColorStop(1, 'rgba(255,240,215,0)');
        g.fillStyle = c; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      g.save(); g.translate(w / 2, h * .34); g.globalCompositeOperation = 'screen';
      for (let i = 0; i < 18; i++) {
        const a = -Math.PI + i / 17 * Math.PI;
        const l = g.createLinearGradient(0, 0, Math.cos(a) * h, Math.sin(a) * h);
        l.addColorStop(0, 'rgba(255,235,180,.3)'); l.addColorStop(1, 'rgba(255,235,180,0)');
        g.fillStyle = l;
        g.beginPath(); g.moveTo(0, 0);
        g.lineTo(Math.cos(a - .05) * h, Math.sin(a - .05) * h); g.lineTo(Math.cos(a + .05) * h, Math.sin(a + .05) * h); g.fill();
      }
      g.restore();
      const bw = w * .72, bh = h * .3, bx = (w - bw) / 2, by = h * .34;
      g.shadowColor = 'rgba(40,30,10,.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
      g.fillStyle = '#fbfaf6'; g.fillRect(bx, by, bw, bh);
      g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.fillStyle = '#1b1b1d'; g.font = `600 ${w * .034}px ${OS}`;
      g.fillText('Мы ценим вашу приватность', bx + bw * .07, by + bh * .24);
      g.fillStyle = '#55555c'; g.font = `400 ${w * .023}px ${OS}`;
      wrap(g, 'Мы и наши 1 842 партнёра навечно храним ваши данные.', bx + bw * .07, by + bh * .42, bw * .86, w * .032);
      g.fillStyle = '#2251ff'; g.fillRect(bx + bw * .07, by + bh * .68, bw * .86, bh * .2);
      g.fillStyle = '#fff'; g.font = `600 ${w * .026}px ${OS}`; g.textAlign = 'center';
      g.fillText('Принять всё', w / 2, by + bh * .81); g.textAlign = 'left';
    },
    unread(g, w, h) {
      g.fillStyle = '#121214'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8352e'; g.beginPath(); g.arc(w / 2, h / 2, Math.min(w, h) * .33, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `700 ${w * .24}px ${OS}`;
      g.fillText('99+', w / 2, h / 2 + w * .085); g.textAlign = 'left';
    },
    // Волны из точек: каждая строка течёт по своей синусоиде, цвет плывёт по строкам.
    waves(g, w, h, t, o) {
      g.fillStyle = '#06060b'; g.fillRect(0, 0, w, h);
      const rows = 24, st = Math.max(6, w / 120), d = Math.max(2, st * .42), hue = o.hue;
      for (let i = 0; i < rows; i++) {
        const k = i / (rows - 1), amp = h * (.05 + .07 * Math.sin(i * .21 + t * .3) ** 2);
        g.fillStyle = `hsl(${hue + k * 70 + Math.sin(t * .2) * 20} 95% ${50 + k * 18}%)`;
        for (let x = 0; x < w; x += st) {
          const y = h * (.16 + .68 * k) + Math.sin(x / w * 7 + t * .9 + i * .38) * amp + Math.sin(x / w * 2.3 - t * .4) * h * .04;
          g.fillRect(x, y, d, d);
        }
      }
    },
    // Пиксельный цветок: квадратики поднимаются по спирали и меняют цвет от синего к розовому.
    pixels(g, w, h, t) {
      g.fillStyle = '#05050c'; g.fillRect(0, 0, w, h);
      const r = rng(4), q = Math.max(4, w / 60);
      for (let i = 0; i < 520; i++) {
        const a = r() * 6.2832, k = r(), ph = (k + t * .05) % 1, y = h * (.92 - ph * .8);
        const rad = w * (.08 + .3 * Math.sin(ph * 3.1416) * (.6 + .4 * Math.sin(a * 5 + t * .6)));
        const x = w / 2 + Math.cos(a + t * .2) * rad;
        g.fillStyle = `hsla(${230 + ph * 110} 95% ${55 + 20 * r()}% / ${.35 + .65 * Math.sin(ph * 3.1416)})`;
        g.fillRect(Math.round(x / q) * q, Math.round(y / q) * q, q - 1, q - 1);
      }
    },
    // Волнистые чёрно-белые полосы, как у оп-арта.
    zebra(g, w, h, _, o) {
      g.fillStyle = o.bg || '#f1f1ee'; g.fillRect(0, 0, w, h); g.fillStyle = o.fg || '#141418';
      const n = o.n || 11, st = h / n;
      for (let i = -1; i < n + 1; i++) {
        g.beginPath();
        for (let x = 0; x <= w; x += w / 60) g.lineTo(x, i * st + Math.sin(x / w * 6.3 + i * .55) * st * .9);
        for (let x = w; x >= 0; x -= w / 60) g.lineTo(x, i * st + st * .5 + Math.sin(x / w * 6.3 + i * .55 + .4) * st * .9);
        g.closePath(); g.fill();
      }
    },
    // Светящиеся орбиты: кольца из света вокруг пустого центра, медленно вращаются.
    orbit(g, w, h, t) {
      const l = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .6);
      l.addColorStop(0, '#2a1d5c'); l.addColorStop(1, '#07071a'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const k = i / 13, rx = w * (.16 + k * .2), ry = h * (.18 + k * .2), rot = t * .15 * (i % 2 ? 1 : -1) + i * .4;
        g.strokeStyle = `hsla(${205 + k * 120} 100% 65% / ${.25 + .35 * (1 - k)})`; g.lineWidth = w * (.004 + .006 * (1 - k));
        g.beginPath(); g.ellipse(w / 2, h / 2, rx, ry, rot, 0, 6.2832); g.stroke();
      }
      const c = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * .12);
      c.addColorStop(0, 'rgba(255,240,255,.5)'); c.addColorStop(1, 'rgba(255,240,255,0)'); g.fillStyle = c; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    },
    // Капля-сердце с переливом розового и синего на тёмном фоне.
    blob(g, w, h) {
      g.fillStyle = '#16151d'; g.fillRect(0, 0, w, h);
      const l = g.createLinearGradient(0, h * .2, 0, h * .85);
      l.addColorStop(0, '#ff5fa8'); l.addColorStop(.5, '#ff8a3d'); l.addColorStop(1, '#4e6bff'); g.fillStyle = l;
      const cx = w / 2, cy = h / 2, s = w * .34;
      g.beginPath(); g.moveTo(cx, cy + s * 1.15);
      g.bezierCurveTo(cx - s * 1.5, cy + s * .2, cx - s * .9, cy - s * 1.25, cx, cy - s * .45);
      g.bezierCurveTo(cx + s * .9, cy - s * 1.25, cx + s * 1.5, cy + s * .2, cx, cy + s * 1.15); g.fill();
    },
    // Шар с градиентом от розового к синему.
    sphere(g, w, h) {
      g.fillStyle = '#121218'; g.fillRect(0, 0, w, h);
      const r = w * .36, l = g.createRadialGradient(w * .42, h * .4, r * .1, w / 2, h / 2, r);
      l.addColorStop(0, '#ffb3e6'); l.addColorStop(.45, '#c04dff'); l.addColorStop(1, '#2638ff');
      g.fillStyle = l; g.beginPath(); g.arc(w / 2, h / 2, r, 0, 6.2832); g.fill();
    },
    // Стопка изометрических кубиков в сером.
    iso(g, w, h) {
      g.fillStyle = '#1a1a20'; g.fillRect(0, 0, w, h);
      const s = w * .1, cx = w / 2, cy = h * .3;
      const cube = (i, j, k) => {
        const x = cx + (i - j) * s * .87, y = cy + (i + j) * s * .5 - k * s;
        for (const [pts, c] of [[[[0, 0], [.87, .5], [0, 1], [-.87, .5]], '#e4e5ea'], [[[-.87, .5], [0, 1], [0, 2], [-.87, 1.5]], '#9a9ca6'], [[[0, 1], [.87, .5], [.87, 1.5], [0, 2]], '#6c6e78']]) {
          g.fillStyle = c; g.beginPath(); pts.forEach(([a, b], n) => (n ? g.lineTo(x + a * s, y + b * s) : g.moveTo(x + a * s, y + b * s))); g.closePath(); g.fill();
        }
      };
      [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 0, 2], [0, 1, 2], [0, 0, 3], [1, 0, 3], [1, 1, 3], [0, 1, 4]].sort((a, b) => a[2] - b[2] || a[0] + a[1] - b[0] - b[1]).forEach(([i, j, k]) => cube(i, j, k));
    },
    // Тестовая UV-сетка: так выглядит предмет, пока ему не нарисовали поверхность.
    uv(g, w, h) {
      const n = 8, cw = w / n, ch = h / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const hue = (j * 45 + i * 6) % 360, on = (i + j) % 2;
        g.fillStyle = `hsl(${hue} 70% ${on ? 58 : 42}%)`; g.fillRect(i * cw, j * ch, cw + 1, ch + 1);
        g.fillStyle = on ? '#fff' : '#111'; g.fillRect(i * cw + cw * .1, j * ch + ch * .1, cw * .18, ch * .18);
        g.fillStyle = 'rgba(255,255,255,.9)'; g.font = `600 ${cw * .2}px ${MONO}`;
        g.fillText('ABCDEFGH'[i] + (n - j), i * cw + cw * .34, j * ch + ch * .62);
      }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(1, w / 400);
      for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(i * cw, 0); g.lineTo(i * cw, h); g.moveTo(0, i * ch); g.lineTo(w, i * ch); g.stroke(); }
    },
    automaton(g, w, h, _, o) {
      g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h);
      const s = 5, cols = Math.ceil(w / s), rows = Math.ceil(h / s);
      let row = new Uint8Array(cols); row[cols >> 1] = 1;
      g.fillStyle = '#17171a';
      for (let y = 0; y < rows; y++) {
        const next = new Uint8Array(cols);
        for (let x = 0; x < cols; x++) {
          if (row[x]) g.fillRect(x * s, y * s, s, s);
          const n = (row[(x + cols - 1) % cols] << 2) | (row[x] << 1) | row[(x + 1) % cols];
          next[x] = (o.rule >> n) & 1;
        }
        row = next;
      }
    },
    captcha(g, w, h) {
      g.fillStyle = '#f7f7f5'; g.fillRect(0, 0, w, h);
      const m = w * .05;
      g.fillStyle = '#2251ff'; g.fillRect(m, m, w - m * 2, h * .2);
      g.fillStyle = '#fff'; g.font = `400 ${w * .034}px ${OS}`;
      g.fillText('Выберите все квадраты,', m * 1.6, m + h * .075);
      g.font = `700 ${w * .056}px ${OS}`;
      g.fillText('где есть будущее', m * 1.6, m + h * .15);
      const top = m + h * .22, gap = w * .012, gw = w - m * 2, gh = h - top - m, cw = (gw - gap * 2) / 3, ch = (gh - gap * 2) / 3;
      const r = rng(77), tile = cv(240, 240), t = tile.getContext('2d');
      for (let i = 0; i < 9; i++) {
        const x = m + (i % 3) * (cw + gap), y = top + Math.floor(i / 3) * (ch + gap);
        const hue = 180 + r() * 60, l = 18 + r() * 34;
        const sky = t.createLinearGradient(0, 0, 0, 240);
        sky.addColorStop(0, `hsl(${hue} 10% ${l + 22}%)`); sky.addColorStop(1, `hsl(${hue - 20} 9% ${l}%)`);
        t.fillStyle = sky; t.fillRect(0, 0, 240, 240);
        t.fillStyle = `hsl(${hue} 6% ${l * .5}%)`;
        for (let k = 0; k < 7; k++) { const bw = 26 + r() * 40, bh = 40 + r() * 150; t.fillRect(r() * 220, 240 - bh, bw, bh); }
        g.imageSmoothingEnabled = false;
        g.drawImage(tile, 0, 0, 80, 80, x, y, cw, ch);
        g.imageSmoothingEnabled = true;
      }
    },

    links(g, w, h) {
      g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#17171a'; g.font = `700 ${w * .05}px "Times New Roman",serif`;
      g.fillText('Мои ссылки', w * .08, h * .11);
      const list = ['Домашняя страница Серёжи', 'Гостевая книга (1 запись)', 'Мои кошки: Муся, Дуся', 'Анекдоты на каждый день', 'Скачать все мелодии', 'Форум нашего двора', 'Рецепты бабушки', 'Сайт ещё строится', 'Лучшая статья про лето', 'Счётчик: вы 12-й гость', 'Напишите мне!', 'Друзья моих друзей'];
      g.font = `400 ${w * .037}px "Times New Roman",serif`;
      list.forEach((s, i) => {
        const y = h * .2 + i * h * .066, vis = i % 3 === 1, tw = g.measureText(s).width;
        g.fillStyle = vis ? '#551a8b' : '#0000ee'; g.fillText(s, w * .08, y); g.fillRect(w * .08, y + 3, tw, 1.6);
        g.fillStyle = '#b12a22'; g.font = `400 ${w * .021}px ${MONO}`; g.fillText('404', w * .1 + tw, y);
        g.font = `400 ${w * .037}px "Times New Roman",serif`;
      });
    },
    tos(g, w, h) {
      g.fillStyle = '#f5f4ef'; g.fillRect(0, 0, w, h);
      const words = 'настоящим пользователь соглашается что сервис вправе в одностороннем порядке изменять хранить передавать обрабатывать сведения включая но не ограничиваясь третьим лицам на территории любого государства бессрочно'.split(' ');
      const r = rng(5), fs = w * .0135, lh = fs * 1.34;
      g.font = `400 ${fs}px ${OS}`; g.fillStyle = '#4a4a50';
      let y = w * .06, mark = 62, n = 0;
      while (y < h - w * .05) {
        let x = w * .06;
        while (x < w * .9) {
          const word = words[Math.floor(r() * words.length)], tw = g.measureText(word + ' ').width;
          if (x + tw > w * .94) break;
          g.fillText(word, x, y); x += tw;
        }
        if (++n === mark) {
          g.fillStyle = '#ffe24a'; g.fillRect(w * .055, y - fs, w * .43, lh);
          g.fillStyle = '#111'; g.font = `600 ${fs}px ${OS}`; g.fillText('а также вашу душу и душу вашего кота', w * .06, y);
          g.fillStyle = '#4a4a50'; g.font = `400 ${fs}px ${OS}`; mark = 1e9;
        }
        y += lh;
      }
    },
    password(g, w, h) {
      g.fillStyle = '#ece9e1'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff'; g.fillRect(w * .08, h * .1, w * .84, h * .12);
      g.strokeStyle = '#d33a2c'; g.lineWidth = 3; g.strokeRect(w * .08, h * .1, w * .84, h * .12);
      g.fillStyle = '#17171a'; g.font = `700 ${w * .07}px ${OS}`; g.fillText('••••••••••', w * .12, h * .184);
      const rules = [['Минимум 8 символов', 1], ['Заглавная буква', 1], ['Цифра', 1], ['Спецсимвол', 1], ['Не менее одного иероглифа', 1], ['Кличка первой собаки', 0], ['Имя, которое вы шептали в 2009-м', 0], ['Детская травма', 0], ['Не совпадает с прежними паролями', 0], ['Вы точно не помните', 0]];
      g.font = `400 ${w * .037}px ${OS}`;
      rules.forEach(([s, ok], i) => {
        const y = h * .31 + i * h * .066;
        g.fillStyle = ok ? '#1f8a4c' : '#d33a2c'; g.fillText(ok ? '✓' : '×', w * .08, y);
        g.fillStyle = '#2b2b30'; g.fillText(s, w * .14, y);
      });
    },
    battery(g, w, h) {
      g.fillStyle = '#0d0d0f'; g.fillRect(0, 0, w, h);
      const bw = w * .62, bh = h * .3, x = (w - bw) / 2, y = h * .3;
      g.strokeStyle = '#d9d7d0'; g.lineWidth = w * .016; g.strokeRect(x, y, bw, bh);
      g.fillStyle = '#d9d7d0'; g.fillRect(x + bw + w * .012, y + bh * .3, w * .03, bh * .4);
      g.fillStyle = '#e8352e'; g.fillRect(x + w * .022, y + w * .022, bw * .045, bh - w * .044);
      g.fillStyle = '#e8352e'; g.font = `700 ${w * .1}px ${OS}`; g.textAlign = 'center';
      g.fillText('1%', w / 2, h * .8); g.textAlign = 'left';
    },
    pin(g, w, h) {
      g.fillStyle = '#d6d4cd'; g.fillRect(0, 0, w, h);
      const s = w / 7;
      g.strokeStyle = '#c3c0b8'; g.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); }
      for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
      const cx = w * .52, cy = h * .47;
      const halo = g.createRadialGradient(cx, cy, 0, cx, cy, w * .22);
      halo.addColorStop(0, 'rgba(40,110,255,.35)'); halo.addColorStop(1, 'rgba(40,110,255,.08)');
      g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, w * .22, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, w * .034, 0, 7); g.fill();
      g.fillStyle = '#2a6cff'; g.beginPath(); g.arc(cx, cy, w * .025, 0, 7); g.fill();
      g.fillStyle = '#6f6c64'; g.textAlign = 'center'; g.font = `400 ${w * .03}px ${OS}`;
      g.fillText('Вы здесь', cx, cy + w * .09); g.textAlign = 'left';
    },
    panorama(g, w, h) {
      const s = cv(w, h), c = s.getContext('2d');
      const sky = c.createLinearGradient(0, 0, 0, h * .6);
      sky.addColorStop(0, '#9fbfd8'); sky.addColorStop(1, '#e7ecec');
      c.fillStyle = sky; c.fillRect(0, 0, w, h);
      c.fillStyle = '#6f7a56'; c.fillRect(0, h * .58, w, h * .1);
      c.fillStyle = '#54565a'; c.beginPath(); c.moveTo(w * .05, h); c.lineTo(w * .44, h * .6); c.lineTo(w * .52, h * .6); c.lineTo(w * .98, h); c.fill();
      c.fillStyle = '#ecebe5'; for (let i = 0; i < 7; i++) c.fillRect(w * .47, h * (.62 + i * i * .009), w * (.006 + i * .002), h * .012 * (1 + i * .5));
      const r = rng(4);
      for (let i = 0; i < 30; i++) { c.fillStyle = `hsl(${90 + r() * 30} 22% ${24 + r() * 16}%)`; c.beginPath(); c.arc(r() * w, h * .58, 8 + r() * 26, 0, 7); c.fill(); }
      g.drawImage(s, 0, 0);
      const x0 = w * .42, x1 = w * .68;
      g.imageSmoothingEnabled = false;
      g.drawImage(s, x0, 0, 2, h, x0, 0, x1 - x0, h);
      g.imageSmoothingEnabled = true;
      g.drawImage(s, x0, 0, w - x0, h, x1, h * .018, w - x0, h);
    },
    signal(g, w, h, t) {
      const c = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'], bw = w / 7;
      c.forEach((v, i) => { g.fillStyle = v; g.fillRect(i * bw, 0, bw + 1, h * .68); });
      g.fillStyle = '#111'; g.fillRect(0, h * .68, w, h * .32);
      const r = rng(Math.floor(t * 10) + 1);
      for (let i = 0; i < 26; i++) {
        const y = r() * h, hh = 1 + r() * 7, dx = (r() - .5) * 60;
        g.drawImage(g.canvas, 0, y, w, hh, dx, y, w, hh);
      }
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `400 ${w * .05}px ${MONO}`;
      g.fillText('НЕТ СИГНАЛА', w / 2, h * .86); g.textAlign = 'left';
    },
    dialogs(g, w, h) {
      g.fillStyle = '#0d6f73'; g.fillRect(0, 0, w, h);
      const bw = w * .44, bh = w * .19;
      for (let i = 0; i < 24; i++) {
        const x = w * .05 + i * w * .021, y = h * .05 + i * h * .033;
        g.fillStyle = '#000'; g.fillRect(x + 3, y + 3, bw, bh);
        g.fillStyle = '#c3c3c3'; g.fillRect(x, y, bw, bh);
        g.fillStyle = '#fff'; g.fillRect(x, y, bw, 2); g.fillRect(x, y, 2, bh);
        g.fillStyle = '#10107a'; g.fillRect(x + 4, y + 4, bw - 8, bh * .16);
        g.fillStyle = '#fff'; g.font = `700 ${w * .017}px ${OS}`; g.fillText('Ошибка', x + 8, y + 4 + bh * .12);
        g.fillStyle = '#000'; g.font = `400 ${w * .019}px ${OS}`;
        g.fillText(i === 23 ? 'Закрыть все окна?' : 'Операция завершена с ошибкой', x + 12, y + bh * .46);
        g.fillStyle = '#c3c3c3'; g.strokeStyle = '#000'; g.lineWidth = 1;
        g.strokeRect(x + bw * .38, y + bh * .64, bw * .24, bh * .24);
        g.fillStyle = '#000'; g.textAlign = 'center'; g.fillText('ОК', x + bw * .5, y + bh * .81); g.textAlign = 'left';
      }
    },
    qr(g, w, h) {
      g.fillStyle = '#f6f5f0'; g.fillRect(0, 0, w, h);
      const r = rng(404), n = 33, m = w * .1, s = (w - m * 2) / n;
      g.fillStyle = '#121214';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const inF = (a, b) => a < 8 && b < 8;
        if (inF(x, y) || inF(n - 1 - x, y) || inF(x, n - 1 - y)) continue;
        if (r() > .52) g.fillRect(m + x * s, m + y * s, s + .5, s + .5);
      }
      [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([a, b]) => {
        g.fillRect(m + a * s, m + b * s, s * 7, s * 7);
        g.fillStyle = '#f6f5f0'; g.fillRect(m + (a + 1) * s, m + (b + 1) * s, s * 5, s * 5);
        g.fillStyle = '#121214'; g.fillRect(m + (a + 2) * s, m + (b + 2) * s, s * 3, s * 3);
      });
    },
    progress(g, w, h, t) {
      g.fillStyle = '#e9e8e2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#17171a'; g.font = `600 ${w * .05}px ${OS}`; g.fillText('Копирование файлов', w * .08, h * .34);
      g.fillStyle = '#d3d1c9'; g.fillRect(w * .08, h * .44, w * .84, h * .13);
      g.fillStyle = '#2a7a3e'; g.fillRect(w * .08, h * .44, w * .84 * .99, h * .13);
      const x = ((t * .4) % 1) * w * .84;
      g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(w * .08 + x, h * .44, Math.min(w * .12, w * .84 * .99 - x), h * .13);
      g.fillStyle = '#55555c'; g.font = `400 ${w * .034}px ${OS}`;
      g.fillText('99%. Осталось примерно 3 минуты', w * .08, h * .68);
    },

    feed(g, w, h, t) {
      g.fillStyle = '#050608'; g.fillRect(0, 0, w, h);
      const cols = 3, gap = w * .012, cw = (w - gap * (cols + 1)) / cols, ch = cw * .78;
      for (let c = 0; c < cols; c++) {
        const speed = 44 + c * 13, off = t * speed + c * 73;
        const start = Math.floor(off / (ch + gap));
        for (let i = start - 1; i < start + Math.ceil(h / ch) + 2; i++) {
          const r = rng(i * 37 + c * 991 + 5), y = i * (ch + gap) - off, x = gap + c * (cw + gap);
          const hue = r() * 360;
          const f = g.createLinearGradient(x, y, x + cw, y + ch);
          f.addColorStop(0, `hsl(${hue} 72% ${18 + r() * 34}%)`);
          f.addColorStop(1, `hsl(${(hue + 50 + r() * 60) % 360} 80% ${8 + r() * 24}%)`);
          g.fillStyle = f; g.fillRect(x, y, cw, ch * .76);
          g.fillStyle = 'rgba(255,255,255,.72)'; g.fillRect(x, y + ch * .81, cw * (.3 + r() * .6), ch * .035);
          g.fillStyle = 'rgba(255,255,255,.26)'; g.fillRect(x, y + ch * .88, cw * (.2 + r() * .5), ch * .03);
        }
      }
    },
    plasma(g, w, h, t) {
      const cw = 96, ch = Math.round(96 * h / w);
      const c = P._pc || (P._pc = cv(cw, ch)), x = c.getContext('2d'), d = x.createImageData(cw, ch);
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
        const u = i / cw * 6, v = j / ch * 4;
        const a = Math.sin(u + t * .5 + Math.sin(v * 1.3 + t * .3) * 1.4) + Math.sin(v * 1.8 - t * .4 + Math.cos(u * .8) * 1.2);
        const q = Math.floor((a + 2) * 2.5) / 5, p = (j * cw + i) * 4;
        d.data[p] = 30 + 225 * q * q; d.data[p + 1] = 16 + 80 * Math.abs(Math.sin(q * 3.1 + t * .1)); d.data[p + 2] = 90 + 150 * (1 - q); d.data[p + 3] = 255;
      }
      x.putImageData(d, 0, 0);
      g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, w, h);
    },
    typing(g, w, h, t) {
      g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ece9e2'; g.font = `600 ${w * .058}px ${OS}`; g.textAlign = 'center';
      g.fillText('Мама', w / 2, h * .34);
      g.fillStyle = '#7f8fff'; g.font = `400 ${w * .036}px ${OS}`; g.fillText('печатает', w / 2, h * .42); g.textAlign = 'left';
      const bw = w * .3, bh = h * .13, x = (w - bw) / 2, y = h * .52;
      g.fillStyle = '#22252e'; g.beginPath(); g.roundRect(x, y, bw, bh, bh * .5); g.fill();
      for (let i = 0; i < 3; i++) {
        const a = .3 + .7 * Math.max(0, Math.sin(t * 3 - i * .8));
        g.fillStyle = `rgba(236,233,226,${a})`;
        g.beginPath(); g.arc(x + bw * (.27 + i * .23), y + bh / 2, bh * .13, 0, 7); g.fill();
      }
    },
    cursors(g, w, h, t) {
      g.fillStyle = '#08090d'; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      g.fillStyle = '#2f5bff'; g.fillRect(cx - w * .13, cy - h * .05, w * .26, h * .1);
      g.fillStyle = '#fff'; g.font = `600 ${w * .03}px ${OS}`; g.textAlign = 'center'; g.fillText('Скачать', cx, cy + w * .01); g.textAlign = 'left';
      const n = 90;
      for (let i = 0; i < n; i++) {
        const r = rng(i * 7 + 1), a = r() * 6.283, d0 = w * (.2 + r() * .8), sp = .03 + r() * .05, ph = r();
        const q = ((t * sp + ph) % 1), d = lerp(d0, w * .06, q * q * (3 - 2 * q));
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .8, s = w * .022;
        g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s * 1.5); g.lineTo(x + s * .36, y + s * 1.14); g.lineTo(x + s * .66, y + s * 1.7);
        g.lineTo(x + s * .9, y + s * 1.58); g.lineTo(x + s * .62, y + s * 1.04); g.lineTo(x + s * 1.06, y + s * 1.04); g.closePath(); g.fill(); g.stroke();
      }
    },
    blue(g, w, h, t) {
      g.fillStyle = '#0a2a9e'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8ecff'; g.font = `300 ${w * .15}px ${OS}`; g.fillText(':(', w * .09, h * .3);
      g.font = `400 ${w * .037}px ${OS}`;
      const y = wrap(g, 'Произошла ошибка. Её никто не увидит, потому что вы уже закрыли вкладку.', w * .09, h * .44, w * .78, w * .052);
      g.font = `400 ${w * .03}px ${MONO}`; g.fillStyle = '#b9c4ff';
      g.fillText(`Сбор сведений: ${Math.floor(t * 1.7) % 100}%`, w * .09, y + h * .05);
    },
    sort(g, w, h, _, o) {
      const s = cv(w, h), c = s.getContext('2d'); sunset(c, w, h, o.seed, o.pal);
      const im = c.getImageData(0, 0, w, h), d = im.data, lum = p => d[p] * .3 + d[p + 1] * .59 + d[p + 2] * .11;
      for (let x = 0; x < w; x++) {
        let y = 0;
        while (y < h) {
          while (y < h && lum((y * w + x) * 4) < o.lo) y++;
          const st = y;
          while (y < h && lum((y * w + x) * 4) >= o.lo) y++;
          const px = [];
          for (let k = st; k < y; k++) { const p = (k * w + x) * 4; px.push([d[p], d[p + 1], d[p + 2]]); }
          px.sort((a, b) => a[0] + a[1] + a[2] - b[0] - b[1] - b[2]);
          px.forEach((v, k) => { const p = ((st + k) * w + x) * 4; d[p] = v[0]; d[p + 1] = v[1]; d[p + 2] = v[2]; });
        }
      }
      g.putImageData(im, 0, 0);
    },
    mosh(g, w, h) {
      sunset(g, w, h, 41, TOXIC);
      const r = rng(8), b = 24;
      for (let f = 0; f < 22; f++) {
        for (let y = 0; y < h; y += b) for (let x = 0; x < w; x += b) {
          const a = Math.sin(x * .007 + f * .1) * 2 + Math.cos(y * .011) * 2;
          if (r() < .56) g.drawImage(g.canvas, x, y, b, b, x + Math.cos(a) * 7, y + Math.sin(a) * 7 + 3, b, b);
        }
      }
    },
    blank(g, w, h, _, o) {
      g.fillStyle = '#f7f6f2'; g.fillRect(0, 0, w, h);
      const r = rng(o.seed || 2); g.globalAlpha = .035;
      for (let i = 0; i < 2600; i++) { g.fillStyle = r() > .5 ? '#fff' : '#000'; g.fillRect(r() * w, r() * h, 2, 2); }
      g.globalAlpha = 1;
      if (o.dot) { const q = Math.round(w * .014); g.fillStyle = '#111'; g.fillRect(Math.round(w / 2 - q / 2), Math.round(h / 2 - q / 2), q, q); }
      g.fillStyle = '#b4b1a8'; g.font = `400 ${w * .026}px ${MONO}`; g.textAlign = 'right';
      g.fillText(o.dot ? '1 × 1 px' : 'untitled.png · 0 КБ', w * .95, h * .94); g.textAlign = 'left';
    },
    grad(g, w, h, _, o) {
      const cs = [o.a, o.b, o.c].filter(Boolean), l = g.createLinearGradient(0, 0, w * .4, h);
      cs.forEach((c, i) => l.addColorStop(i / (cs.length - 1), c));
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      const r = rng(7); g.globalAlpha = .05;
      for (let i = 0; i < 4000; i++) { g.fillStyle = r() > .5 ? '#fff' : '#000'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
      g.globalAlpha = .75; g.fillStyle = '#fff'; g.font = `400 ${Math.min(w, h) * .03}px ${MONO}`;
      g.fillText(`linear-gradient(${cs.join(', ')})`, w * .05, h * .94); g.globalAlpha = 1;
    },
    rings(g, w, h, _, o) {
      g.fillStyle = o.bg; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * .58;
      for (let i = 12; i > 0; i--) { g.strokeStyle = o.fg; g.globalAlpha = .1 + (12 - i) / 12 * .8; g.lineWidth = w * (.004 + (12 - i) * .0012); g.beginPath(); g.arc(cx, cy, i * w * .04, 0, 7); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = o.fg; g.beginPath(); g.arc(cx, cy, w * .018, 0, 7); g.fill();
    },
    dots(g, w, h) {
      g.fillStyle = '#f4f3ee'; g.fillRect(0, 0, w, h);
      const n = 12, m = w * .1, sx = (w - m * 2) / (n - 1), sy = (h - m * 2) / (n - 1);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const red = i === 8 && j === 3;
        g.fillStyle = red ? '#e8352e' : '#1b1b1f'; g.beginPath(); g.arc(m + i * sx, m + j * sy, w * (red ? .016 : .008), 0, 7); g.fill();
      }
    },
    cursor(g, w, h) {
      g.fillStyle = '#f2f1ec'; g.fillRect(0, 0, w, h);
      const pts = [[0, 0], [0, 1.5], [.36, 1.14], [.66, 1.7], [.9, 1.58], [.62, 1.04], [1.06, 1.04]], k = h * .6 / 1.7, x = w / 2 - .53 * k, y = h * .2;
      g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(x + a * k, y + b * k) : g.moveTo(x + a * k, y + b * k))); g.closePath();
      g.save(); g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = w * .04; g.shadowOffsetY = w * .02; g.fillStyle = '#111'; g.fill(); g.restore();
      g.lineWidth = w * .012; g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.stroke();
    },
    steps(g, w, h) {
      const n = 11;
      for (let i = 0; i < n; i++) { const v = Math.round(250 - i * 240 / (n - 1)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i * w / n, 0, w / n + 1, h); }
      const r = rng(12);
      for (let i = 0; i < 18; i++) { const y = r() * h, hh = 2 + r() * h * .03; g.drawImage(g.canvas, 0, y, w, hh, (r() - .5) * w * .12, y, w, hh); }
      g.fillStyle = '#e8352e'; g.fillRect(w * 5 / n, h * .46, w / n, h * .08);
    },
    grid(g, w, h) {
      g.fillStyle = '#f6f5f1'; g.fillRect(0, 0, w, h);
      const n = 16, st = w / n;
      g.fillStyle = '#e8352e'; g.fillRect(st * 11, st * 4, st, st);
      g.strokeStyle = '#cfccc3'; g.lineWidth = 1.5; g.beginPath();
      for (let i = 1; i < n; i++) { g.moveTo(i * st, 0); g.lineTo(i * st, h); g.moveTo(0, i * st); g.lineTo(w, i * st); }
      g.stroke();
    },
    ascii(g, w, h) {
      g.fillStyle = '#07080b'; g.fillRect(0, 0, w, h);
      const fs = w / 46, ramp = ' .:-=+*#%@';
      g.font = `400 ${fs * 1.04}px ${MONO}`; g.fillStyle = '#b6ffcf';
      const cols = 46, rows = Math.floor(h / (fs * 1.28));
      for (let j = 0; j < rows; j++) {
        let line = '';
        for (let i = 0; i < cols; i++) {
          const u = i / cols * 2 - 1, v = (j / rows * 2 - 1) * (h / w);
          const head = 1 - Math.hypot(u / .42, (v + .22 * h / w) / .56);
          const body = 1 - Math.hypot(u / .74, (v - .95 * h / w) / .72);
          const eye = Math.hypot(Math.abs(u) - .17, v + .28 * h / w) < .06;
          let b = Math.max(head, body) * 1.9 + u * -.34;
          if (eye) b = 0;
          b = Math.max(0, Math.min(.99, b));
          line += ramp[Math.floor(b * ramp.length)];
        }
        g.fillText(line, 0, (j + 1) * fs * 1.28);
      }
    }
  };

  // Галерея мемов. Картинки нарочно грубые, как рисовали в Paint в три часа ночи.
  const ink = (g, w) => { g.strokeStyle = '#141414'; g.lineWidth = w * .007; g.lineCap = 'round'; g.lineJoin = 'round'; };
  const scribble = (g, pts, close) => {
    g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath();
  };
  const PICS = {
    winning(g, w, h) {
      g.fillStyle = '#d9cdb3'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b9a98b'; g.fillRect(0, h * .78, w, h * .22);
      ink(g, w);
      g.fillStyle = '#6a5138'; g.fillRect(0, h * .1, w * .32, h * .9); g.strokeRect(0, h * .1, w * .32, h * .9);
      g.fillStyle = '#e3bd97';
      g.beginPath(); g.ellipse(w * .29, h * .36, w * .075, h * .115, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#3d6a9c'; scribble(g, [[w * .16, h], [w * .2, h * .56], [w * .32, h * .5], [w * .4, h * .62], [w * .38, h]], true); g.fill(); g.stroke();
      g.fillStyle = '#e3bd97'; scribble(g, [[w * .38, h * .62], [w * .3, h * .46], [w * .33, h * .42], [w * .43, h * .58]], true); g.fill(); g.stroke();
      g.fillStyle = '#7a5a3c'; g.fillRect(w * .54, h * .62, w * .42, h * .05); g.strokeRect(w * .54, h * .62, w * .42, h * .05);
      g.fillStyle = '#1d1d22'; g.fillRect(w * .68, h * .3, w * .24, h * .26); g.strokeRect(w * .68, h * .3, w * .24, h * .26);
      g.fillStyle = '#74c7ff'; g.fillRect(w * .695, h * .32, w * .21, h * .22);
      g.fillStyle = '#2e2e33'; g.fillRect(w * .78, h * .56, w * .04, h * .06);
      g.fillStyle = '#5a7d4a'; scribble(g, [[w * .5, h * .92], [w * .52, h * .52], [w * .62, h * .48], [w * .68, h * .62], [w * .66, h * .92]], true); g.fill(); g.stroke();
      g.fillStyle = '#4b3423'; g.beginPath(); g.ellipse(w * .585, h * .42, w * .06, h * .09, 0, 0, 7); g.fill(); g.stroke();
    },
    fire(g, w, h, t) {
      g.fillStyle = '#c9752c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        const r = rng(i + 2), x = r() * w, f = h * (.08 + r() * .45) + Math.sin(t * 6 + i) * h * .02;
        g.fillStyle = i % 3 ? '#ff5a1f' : '#ffc53a';
        g.beginPath(); g.moveTo(x - w * .05, h); g.quadraticCurveTo(x + w * .03, h - f * .6, x, h - f); g.quadraticCurveTo(x - w * .02, h - f * .5, x + w * .05, h); g.fill();
      }
      g.fillStyle = '#5a3218'; g.fillRect(w * .18, h * .62, w * .64, h * .05); g.fillRect(w * .24, h * .67, w * .03, h * .33); g.fillRect(w * .73, h * .67, w * .03, h * .33);
      g.fillStyle = '#141414';
      g.beginPath(); g.ellipse(w * .5, h * .54, w * .11, h * .09, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(w * .6, h * .44, w * .06, 0, 7); g.fill();
      scribble(g, [[w * .55, h * .4], [w * .56, h * .32], [w * .6, h * .38]], true); g.fill();
      scribble(g, [[w * .61, h * .38], [w * .65, h * .32], [w * .655, h * .41]], true); g.fill();
    },
    skel(g, w, h) {
      g.fillStyle = '#5e88a8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2d4358'; g.fillRect(0, h * .72, w, h * .28);
      g.fillStyle = '#6e4a2b'; g.fillRect(w * .1, h * .3, w * .34, h * .62);
      g.strokeStyle = '#f0ecdf'; g.lineWidth = w * .016; g.lineCap = 'round';
      g.fillStyle = '#f0ecdf'; g.beginPath(); g.arc(w * .32, h * .3, w * .075, 0, 7); g.fill();
      g.fillStyle = '#141414'; g.beginPath(); g.arc(w * .3, h * .29, w * .018, 0, 7); g.arc(w * .35, h * .29, w * .018, 0, 7); g.fill();
      g.beginPath(); g.moveTo(w * .32, h * .38); g.lineTo(w * .32, h * .68); g.stroke();
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w * .25, h * (.43 + i * .05)); g.lineTo(w * .39, h * (.43 + i * .05)); g.stroke(); }
      g.beginPath(); g.moveTo(w * .32, h * .44); g.lineTo(w * .46, h * .58); g.lineTo(w * .58, h * .54); g.stroke();
      g.fillStyle = '#141414'; g.fillRect(w * .58, h * .3, w * .3, h * .3);
      g.fillStyle = '#27c7bd'; g.fillRect(w * .6, h * .32, w * .26, h * .26);
      g.fillStyle = '#10433f'; [0, 1, 2].forEach(i => { g.beginPath(); g.arc(w * (.68 + i * .05), h * .45, w * .012, 0, 7); g.fill(); });
    },
    buttons(g, w, h) {
      g.fillStyle = '#2a2b33'; g.fillRect(0, 0, w, h);
      [['#d9352c', 'ВЫСПАТЬСЯ', .28], ['#2e9a58', 'ЕЩЁ ОДНО ВИДЕО ПРО ЕНОТА', .72]].forEach(([c, s, x]) => {
        g.fillStyle = '#17171b'; g.beginPath(); g.ellipse(w * x, h * .57, w * .19, h * .17, 0, 0, 7); g.fill();
        g.fillStyle = c; g.beginPath(); g.ellipse(w * x, h * .5, w * .17, h * .16, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `800 ${w * .028}px ${SANS}`;
        wrap(g, s, w * x, h * .49, w * .28, w * .034); g.textAlign = 'left';
      });
      g.fillStyle = '#e3bd97'; ink(g, w);
      scribble(g, [[w * .5, h], [w * .46, h * .78], [w * .58, h * .68], [w * .64, h * .72], [w * .6, h]], true); g.fill(); g.stroke();
    },
    frog(g, w, h) {
      g.fillStyle = '#7fa864'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#39713b'; g.beginPath(); g.ellipse(w * .5, h * .64, w * .3, h * .3, 0, 0, 7); g.fill();
      [.36, .64].forEach(x => {
        g.fillStyle = '#39713b'; g.beginPath(); g.arc(w * x, h * .38, w * .09, 0, 7); g.fill();
        g.fillStyle = '#f6f3df'; g.beginPath(); g.arc(w * x, h * .38, w * .065, 0, 7); g.fill();
        g.fillStyle = '#141414'; g.beginPath(); g.arc(w * x, h * .39, w * .025, 0, 7); g.fill();
      });
      g.strokeStyle = '#102a12'; g.lineWidth = w * .012; g.beginPath(); g.moveTo(w * .36, h * .68); g.lineTo(w * .64, h * .68); g.stroke();
    },
    error(g, w, h) {
      g.fillStyle = '#0d6f73'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c3c3c3'; g.fillRect(w * .14, h * .26, w * .72, h * .46);
      g.fillStyle = '#10107a'; g.fillRect(w * .15, h * .28, w * .7, h * .07);
      g.fillStyle = '#fff'; g.font = `700 ${w * .028}px ${OS}`; g.fillText('Ошибка', w * .17, h * .33);
      g.fillStyle = '#000'; g.font = `400 ${w * .04}px ${OS}`; g.fillText('Успех не найден.', w * .2, h * .47);
      g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(w * .42, h * .56, w * .16, h * .1);
      g.font = `400 ${w * .03}px ${OS}`; g.textAlign = 'center'; g.fillText('ОК', w * .5, h * .625); g.textAlign = 'left';
    },
    banana(g, w, h) {
      for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#d94c82' : '#e6b93a'; g.fillRect(0, i * h / 9, w, h / 9 + 1); }
      g.strokeStyle = '#141414'; g.lineWidth = w * .1; g.lineCap = 'round'; g.beginPath(); g.moveTo(w * .28, h * .34); g.quadraticCurveTo(w * .46, h * .86, w * .74, h * .42); g.stroke();
      g.strokeStyle = '#f2d24a'; g.lineWidth = w * .08; g.beginPath(); g.moveTo(w * .28, h * .34); g.quadraticCurveTo(w * .46, h * .86, w * .74, h * .42); g.stroke();
    },
    tabs(g, w, h) {
      g.fillStyle = '#dad9d4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b4b3ad'; g.fillRect(0, h * .2, w, h * .1);
      for (let i = 0; i < 74; i++) { g.fillStyle = i % 2 ? '#c9c8c2' : '#e8e7e2'; g.fillRect(i * w / 74, h * .22, w / 74 - 1, h * .08); }
      g.fillStyle = '#fff'; g.fillRect(w * .06, h * .36, w * .88, h * .5);
      g.fillStyle = '#9b9a95'; g.font = `400 ${w * .03}px ${OS}`; g.textAlign = 'center'; g.fillText('Какую вкладку вы искали?', w / 2, h * .62); g.textAlign = 'left';
    },
    night(g, w, h) {
      g.fillStyle = '#0c1020'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2b3350'; g.fillRect(w * .08, h * .68, w * .84, h * .2);
      g.fillStyle = '#dfe2ec'; g.fillRect(w * .1, h * .62, w * .24, h * .1);
      g.fillStyle = '#4a5478'; g.fillRect(w * .28, h * .6, w * .6, h * .12);
      g.fillStyle = '#e3bd97'; g.beginPath(); g.arc(w * .23, h * .57, w * .05, 0, 7); g.fill();
      g.fillStyle = '#f4f3ed'; g.beginPath(); g.ellipse(w * .62, h * .3, w * .3, h * .16, 0, 0, 7); g.fill();
      [[.34, .47, .02], [.29, .53, .012]].forEach(([x, y, r]) => { g.beginPath(); g.arc(w * x, h * y, w * r, 0, 7); g.fill(); });
      g.fillStyle = '#141414'; g.font = `500 ${w * .03}px ${SANS}`; g.textAlign = 'center'; g.fillText('а помнишь, что ты сказал', w * .62, h * .28); g.fillText('в 2014 году?', w * .62, h * .34); g.textAlign = 'left';
    },
    gauge(g, w, h) {
      g.fillStyle = '#efeadd'; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * .76, R0 = w * .3;
      ['#3f9a55', '#e6b93a', '#d9352c'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = w * .06; g.beginPath(); g.arc(cx, cy, R0, Math.PI + i * Math.PI / 3, Math.PI + (i + 1) * Math.PI / 3); g.stroke(); });
      g.strokeStyle = '#141414'; g.lineWidth = w * .012; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R0 * 1.02 * Math.cos(-.2), cy + R0 * 1.02 * Math.sin(-.2)); g.stroke();
      g.fillStyle = '#141414'; g.beginPath(); g.arc(cx, cy, w * .02, 0, 7); g.fill();
    }
  };
  P.meme2 = function (g, w, h, t, o) {
    PICS[o.pic](g, w, h, t);
    g.textAlign = 'center'; g.lineJoin = 'round'; g.fillStyle = '#fff'; g.strokeStyle = '#000';
    const fit = (str, y) => {
      if (!str) return;
      let fs = w * .07; g.font = `900 ${fs}px ${SANS}`;
      while (g.measureText(str).width > w * .92 && fs > w * .03) { fs -= 2; g.font = `900 ${fs}px ${SANS}`; }
      g.lineWidth = fs * .17; g.strokeText(str, w / 2, y); g.fillText(str, w / 2, y);
    };
    fit(o.top, h * .125); fit(o.bottom, h * .95);
    g.textAlign = 'left';
  };
  const MEMES = [
    ['fire', 'ДЕДЛАЙН ГОРИТ', 'А Я КОТА ГЛАЖУ'], ['fire', 'ВСЁ ПО ПЛАНУ', 'ПЛАН: 47 ВКЛАДОК'],
    ['skel', '«СЕЙЧАС ОТВЕЧУ»', 'ТРИ ГОДА СПУСТЯ'], ['skel', 'ЖДУ, ПОКА ЗАГРУЗИТСЯ', 'СТРАНИЦА 2004 ГОДА'],
    ['buttons', 'ТЯЖЁЛЫЙ ВЫБОР', ''], ['frog', 'ТЫ: ПОСТ НА 40 АБЗАЦЕВ', 'ЛЯГУШКА: КВА'], ['frog', 'ПОНЕДЕЛЬНИК', 'ЛЯГУШКА НЕ В КУРСЕ'],
    ['error', 'ПЕРЕЗАГРУЗКА ПОМОГЛА', 'СКАЗАЛ НИКТО И НИКОГДА'], ['error', 'ВАШ ЗАПРОС ВАЖЕН ДЛЯ НАС', 'ПОЭТОМУ МЫ ЕГО ПОТЕРЯЛИ'],
    ['banana', 'ИСКУССТВО', 'ЭТО КОГДА БАНАН'], ['banana', 'КУПИЛ NFT БАНАНА', 'ТЕПЕРЬ У МЕНЯ ССЫЛКА НА БАНАН'],
    ['tabs', 'ОТКРЫЛ ОДНУ ВКЛАДКУ', 'ЭТО БЫЛО В МАРТЕ'], ['night', 'ЛЁГ ПОРАНЬШЕ', '03:40'], ['gauge', 'УРОВЕНЬ КРИНЖА', 'МОЙ СТАТУС 2011 ГОДА']
  ];

  const AR = { wide: 1.6, land: 1.3, sq: 1, port: .78 };
  const W = (key, paint, t, a, y, m, d, ar, opts = {}) => ({ key, paint, t, a, y, m, d, ar, o: opts.o, anim: !!opts.anim, frame: opts.frame, big: !!opts.big });

  // Работа-картинка из папки media/halls: полный размер и превью для телефона.
  const IMG = (key, t, a, m, d, ar) => ({ key, paint: 'image', img: Media.url(`halls/${key}.webp`), thumb: Media.url(`halls/${key}_s.webp`), t, a, y: 2026, m, d, ar, anim: false, big: false });

  const HANG = {
    a: [
      W('hero', 'hero', 'Закат, сохранённый тысячу раз', 'Вера Буфер', 2026, 'цифровой файл, 1000 пересохранений', 'Слева оригинал. Справа он же после тысячи пересылок. Никто ничего не портил: все просто делились красотой.', AR.wide, { big: true }),
      W('avatar', 'avatar', 'Портрет неизвестного пользователя', 'Школа Интернета', 2009, 'аватар по умолчанию','Самый часто воспроизводимый портрет столетия. Модель так и не загрузила фото.', AR.port, { big: true }),
      W('r1', 'rothko', 'Ротко в 216 цветах', 'tmp_file_2', 2003, 'веб-безопасная палитра', 'Глубина цвета ограничена браузером 1996 года. Вглядывайтесь сколько угодно: там 216 цветов.', AR.port, { o: { bg: '#3a1420', a: '#c23b22', b: '#e8a33d' } }),
      W('spin', 'spinner', 'Картина загружается', 'Слава Ctrl', 2026, 'анимация, бесконечность', 'Куратор просит подождать. Куратор сам ждёт с 2011 года.', AR.sq, { anim: true }),
      W('meme', 'meme', 'Без названия (шаблон)', 'лена.жпег', 2012, 'шаблон мема', 'Первый мем, который не потребовал ни шутки, ни картинки. Аудитория сделала всё сама.', AR.sq),
      W('wifi', 'wifi', 'Подключено, без интернета', 'Анонимная мастерская', 2019, 'икона, сусальное золото (рендер)', 'Современная форма молитвы: человек смотрит на значок и ждёт.', AR.port),
      W('cookie', 'cookie', 'Благовещение с cookie-баннером', 'Глеб Пиксель', 2021, 'масло, согласие пользователя', 'Небеса разверзлись и попросили принять всё. Кнопки «отклонить» в этой композиции нет.', AR.land),
      W('unread', 'unread', 'Непрочитанное', 'nastya.exe', 2024, 'красный круг', 'Экспонат вызывает тревогу у 83% посетителей. Остальные отключили уведомления.', AR.sq),
      W('rule30', 'automaton', 'Правило 30', 'oldforum', 1983, 'клеточный автомат', 'Одна чёрная клетка и одно правило. Дальше оно всё сделало само, как и большинство тредов.', AR.land, { o: { rule: 30 } }),
      W('captcha', 'captcha', 'Вы не робот', 'Слава Ctrl', 2023, 'капча, 3 × 3', 'Автор честно просмотрел все квадраты. Будущего не нашёл, нажал «Пропустить».', AR.port)
    ],
    j: [
      W('links', 'links', 'Мои ссылки', 'Серёжа', 2004, 'HTML, синий и фиолетовый', 'Всё, что осталось от одного личного сайта. Фиолетовые ссылки кто-то когда-то открывал.', AR.port),
      W('r3', 'rothko', 'Ротко в режиме инкогнито', 'tmp_file_2', 2026, 'веб-безопасная палитра', 'Работа не сохраняется в истории посещений.', AR.port, { o: { bg: '#101215', a: '#3d4249', b: '#b7a58d' } }),
      W('password', 'password', 'Новый пароль', '404_mama', 2022, 'форма регистрации', 'Работа закрыта для всех, включая автора. Авторка забыла пароль на вернисаже.', AR.port),
      W('rule110', 'automaton', 'Правило 110', 'oldforum', 2004, 'клеточный автомат', 'Полная по Тьюрингу работа. В теории на ней можно запустить этот музей.', AR.port, { o: { rule: 110 } }),
      W('sort3', 'sort', 'Полдень, отсортированный по важности', 'Вера Буфер', 2025, 'сортировка пикселей', 'Автор отсортировал день. Важное оказалось внизу, мелким шрифтом.', AR.port, { o: { seed: 33, pal: DUSK, lo: 48 } }),
      W('tos', 'tos', 'Я прочитал и согласен', 'Юридический отдел', 2018, 'мелкий шрифт', 'Ни один посетитель не дочитал работу до конца. Жёлтый маркер поставил охранник.', AR.port),
      W('panorama', 'panorama', 'Панорама порвалась здесь', 'Автомобиль с камерой', 2014, 'склейка, сбой', 'Машина с камерой проехала тут один раз. Этого места больше нигде нет.', AR.wide),
      W('signal', 'signal', 'Нет сигнала', 'Канал 7', 1996, 'анимация, настроечная таблица', 'Передача прервалась. Зрители остались.', AR.land, { anim: true }),
      W('dialogs', 'dialogs', 'Закрыть все окна?', 'oldforum', 2000, 'диалоговые окна, 24 шт.', 'Автор закрывал окна три дня. Экспозиция показывает состояние на второй день.', AR.land),
      W('plasma2', 'plasma', 'Заставка для совещания', 'Корпоративный отдел', 2003, 'анимация, 96 пикселей', 'Включается сама, когда никто не говорит по делу.', AR.land, { anim: true })
    ],
    b: [
      W('pin', 'pin', 'Вы здесь', 'нет данных', 0, 'карта без загруженных тайлов', 'Единственная работа зала, которая говорит правду.', AR.port),
      W('progress', 'progress', 'Девяносто девять', 'user8841', 2001, 'анимация, ожидание', 'Копирование идёт с 2001 года. Смотрители сменяются, полоска остаётся.', AR.land, { anim: true }),
      W('battery', 'battery', 'Последний процент', 'tmp_file_2', 2025, 'значок батареи', 'Написано за секунду до выключения.', AR.sq),
      W('qr', 'qr', 'Этот код никуда не ведёт', 'лена.жпег', 2020, 'похож на QR', 'Камера телефона будет настаивать, что здесь что-то есть. Здесь ничего нет.', AR.sq)
    ],
    c: [
      W('feed', 'feed', 'Бесконечная лента', 'Алгоритм', 2026, 'анимация, без конца', 'Работа никогда не повторяется и никогда не заканчивается. Сядьте, пожалуйста, вы тут надолго.', AR.wide, { anim: true, big: true }),
      W('plasma', 'plasma', 'Скринсейвер для пустой комнаты', 'Вера Буфер', 1998, 'анимация, 96 пикселей', 'Защищает экран от выгорания. Посетителей ни от чего не защищает.', AR.wide, { anim: true, big: true }),
      W('typing', 'typing', 'Мама печатает', 'Глеб Пиксель', 2026, 'анимация, ожидание', 'Сообщение так и не пришло. Автор просил не объяснять эту работу.', AR.land, { anim: true }),
      W('cursors', 'cursors', 'Скачать', 'Толпа', 2015, 'анимация, 90 курсоров', 'Все идут к кнопке. Что именно скачивается, никто не проверял.', AR.land, { anim: true }),
      W('blue', 'blue', 'Сбор сведений', 'Система', 2015, 'анимация, синий экран', 'Счётчик доходит до 99 и начинает заново, как и авторы этой работы.', AR.land, { anim: true }),
      W('sort', 'sort', 'Рассвет, отсортированный по яркости', 'tmp_file_2', 2017, 'сортировка пикселей', 'Те же самые пиксели, что и в рассвете, только наконец по порядку.', AR.port, { o: { seed: 17, pal: DUSK, lo: 60 } }),
      W('mosh', 'mosh', 'Потерянный ключевой кадр', 'nastya.exe', 2019, 'датамош', 'Видео забыло, с чего начиналось, и продолжило двигаться дальше.', AR.land),
      W('ascii', 'ascii', 'Автопортрет в 46 колонок', 'user8841', 1999, 'ASCII', 'Лучше всего смотреть издалека и в моноширинном настроении.', AR.port),
      W('r2', 'rothko', 'Ротко в тёмной теме', 'tmp_file_2', 2024, 'веб-безопасная палитра', 'Та же работа, что в первом зале, но бережёт глаза.', AR.port, { o: { bg: '#07101c', a: '#16366b', b: '#54224f' } }),
      W('sort2', 'sort', 'Вечер, отсортированный по тревоге', 'лена.жпег', 2022, 'сортировка пикселей', 'Самые тёмные пиксели автор оставил на месте и никому о них не сказал.', AR.land, { o: { seed: 91, pal: TOXIC, lo: 34 } })
    ],
    // Рендер, как на концепте: слева экраны, в торце орбиты, справа постеры над автоматами.
    f: [
      W('fwaves', 'waves', 'Шум слушает музыку', 'Вера Буфер', 2026, 'генеративная анимация', 'Волны не повторяются. Автор уверяет, что они танцуют под ту же песню, что и человек на подиуме.', AR.wide, { anim: true, big: true, o: { hue: 230 } }),
      W('fpixels', 'pixels', 'Цветок из пикселей', 'Глеб Пиксель', 2026, 'генеративная анимация', 'Пиксели поднимаются и гаснут. Цветок никогда не собирается целиком, в этом и смысл.', AR.port * .7, { anim: true }),
      W('fzebra', 'zebra', 'Волна в чёрно-белом', 'nastya.exe', 2025, 'оп-арт, векторные полосы', 'Если смотреть дольше минуты, полосы начинают двигаться. Это не работа двигается, это вы.', AR.port * .75, { o: { n: 9 } }),
      W('fuv', 'uv', 'Текстура не найдена', 'tmp_file_2', 2026, 'UV-развёртка, 1024 × 1024', 'Так выглядит любая вещь, пока ей не придумали поверхность. Половина этого зала до сих пор такая.', AR.sq),
      W('forbit', 'orbit', 'Орбиты без планеты', 'Анонимная мастерская', 2026, 'генеративная анимация', 'Кольца вращаются вокруг пустоты. Планету обещали дорендерить к открытию.', AR.wide, { anim: true, big: true }),
      W('fblob', 'blob', 'Сердце в градиенте', 'лена.жпег', 2026, 'векторная капля', 'Самый лайкнутый объект зала. Внутри пусто, но красиво.', AR.port),
      W('fstripes', 'zebra', 'Помехи на мраморе', 'Канал 7', 2024, 'оп-арт, серые полосы', 'Так выглядел сигнал, когда антенну поворачивали всей семьёй.', AR.port, { o: { bg: '#2a2a31', fg: '#c9cad0', n: 12 } }),
      W('fsphere', 'sphere', 'Шар по умолчанию', 'Слава Ctrl', 2026, 'радиальный градиент', 'Первая фигура в любом редакторе. Автор просто не стал её удалять.', AR.port),
      W('fiso', 'iso', 'Склад кубиков', 'user8841', 2026, 'изометрия, двенадцать кубов', 'Каждый кубик лежит на своём месте. Порядок рендера проверен трижды.', AR.port),
      W('frule30', 'automaton', 'Правило 30', 'oldforum', 1983, 'клеточный автомат', 'Три клетки и одно правило дают хаос, которым когда-то считали случайные числа.', AR.sq, { o: { rule: 30 } })
    ],
    // Мемы, что висели в зале f до Рендера. Оставлены про запас.
    memes: [
      W('winning', 'meme2', 'Are you winning, son?', 'Неизвестный отец', 2019, 'Paint, родительская поддержка', 'Отец не понимает игру, но честно интересуется. Сын не выигрывает. Оба это знают.', AR.land, { big: true, o: { pic: 'winning', top: 'ARE YOU WINNING, SON?' } }),
      W('tabs', 'meme2', 'Одна вкладка', 'Коллективный разум', 2016, 'мем, 2 подписи', 'Классика браузерного эпоса: открыл на минутку и живёшь там.', AR.land, { o: { pic: 'tabs', top: 'ОТКРЫЛ ОДНУ ВКЛАДКУ', bottom: 'ЭТО БЫЛО В МАРТЕ' } }),
      W('fire', 'meme2', 'Дедлайн горит', 'Анонимный фрилансер', 2018, 'мем, анимация пламени', 'Кот сохраняет спокойствие. Этому у него учатся менеджеры.', AR.land, { anim: true, o: { pic: 'fire', top: 'ДЕДЛАЙН ГОРИТ', bottom: 'А Я КОТА ГЛАЖУ' } }),
      W('skel', 'meme2', 'Сейчас отвечу', 'Служба поддержки', 2017, 'мем, ожидание', 'Эксперт по долгому ответу. Статус: печатает.', AR.land, { o: { pic: 'skel', top: '«СЕЙЧАС ОТВЕЧУ»', bottom: 'ТРИ ГОДА СПУСТЯ' } }),
      W('buttons', 'meme2', 'Тяжёлый выбор', 'Каждый из нас', 2020, 'мем, две кнопки', 'За всю историю экспозиции левую кнопку нажали один раз. Случайно.', AR.land, { o: { pic: 'buttons', top: 'ТЯЖЁЛЫЙ ВЫБОР' } }),
      W('frog', 'meme2', 'Лягушка не в курсе', 'oldforum', 2016, 'мем, ква', 'Это перевод с английского.', AR.sq, { o: { pic: 'frog', top: 'ПОНЕДЕЛЬНИК', bottom: 'ЛЯГУШКА НЕ В КУРСЕ' } }),
      W('error', 'meme2', 'Успех не найден', 'Система', 2015, 'диалоговое окно', 'Автор нажал «ОК». Ничего не изменилось.', AR.land, { o: { pic: 'error', top: 'ПЕРЕЗАГРУЗКА ПОМОГЛА', bottom: 'СКАЗАЛ НИКТО И НИКОГДА' } }),
      W('nftb', 'meme2', 'Ссылка на банан', 'Инвестор', 2021, 'мем, цепочка блоков', 'Оригинал работы съеден в Атриуме. Токен сохранился.', AR.land, { o: { pic: 'banana', top: 'КУПИЛ NFT БАНАНА', bottom: 'ТЕПЕРЬ У МЕНЯ ССЫЛКА НА БАНАН' } }),
      W('night', 'meme2', 'Лёг пораньше', 'Мозг', 2014, 'мем, бессонница', 'Самая популярная работа галереи после полуночи.', AR.land, { o: { pic: 'night', top: 'ЛЁГ ПОРАНЬШЕ', bottom: '03:40' } }),
      W('gauge', 'meme2', 'Уровень кринжа', 'Твой старый аккаунт', 2011, 'мем, прибор', 'Архив не удаляется. Мы проверяли.', AR.sq, { o: { pic: 'gauge', top: 'УРОВЕНЬ КРИНЖА', bottom: 'МОЙ СТАТУС 2011 ГОДА' } })
    ],
    // Белый куб: светлые и почти пустые работы, сначала восемь на кресте, потом восемь на круглой стене.
    w: [
      W('wgrad', 'grad', 'Градиент по умолчанию', 'Вера Буфер', 2024, 'CSS, два цвета', 'Первое, что делает сайт, когда ему нечего сказать. Здесь ему тоже нечего, но красиво.', AR.land, { o: { a: '#ff5ea8', b: '#2f5bff' } }),
      W('rule90', 'automaton', 'Правило 90', 'oldforum', 1983, 'клеточный автомат', 'Треугольник, который рисует сам себя. Внутри каждого треугольника ещё один, и так до последнего пикселя.', AR.land, { o: { rule: 90 } }),
      W('r4', 'rothko', 'Ротко в светлой теме', 'tmp_file_2', 2026, 'веб-безопасная палитра', 'Та же глубина, только белый фон. Глаза отдыхают, тревога остаётся.', AR.port, { o: { bg: '#ece6da', a: '#e8352e', b: '#f2c94c' } }),
      W('grey', 'steps', 'Шкала серого, сбой', 'Канал 7', 2001, 'одиннадцать оттенков', 'Настройка монитора, которую никто не прошёл. Красный квадрат означает ровно середину.', AR.land),
      W('sort4', 'sort', 'Полдень, отсортированный по белизне', 'Вера Буфер', 2026, 'сортировка пикселей', 'Самые белые пиксели дня собраны наверху. Остальные остались внизу, как обычно.', AR.land, { o: { seed: 52, pal: DUSK, lo: 110 } }),
      W('rings', 'rings', 'Сигнал', 'Канал 7', 2020, 'концентрические круги', 'Сеть ловит тем лучше, чем меньше смотришь на значок.', AR.sq, { o: { bg: '#f3f2ee', fg: '#2f5bff' } }),
      W('blank', 'blank', 'Пустой холст.png', 'nastya.exe', 2026, 'файл, 0 КБ', 'Работа загрузилась полностью. Просто в ней ничего нет, и это заметно только в белом зале.', AR.land),
      W('wgrad2', 'grad', 'Рассвет в тёмной теме', 'tmp_file_2', 2025, 'CSS, три цвета', 'Солнце включается после того, как пользователь согласился на cookie.', AR.port, { o: { a: '#0b1026', b: '#f39a57', c: '#ffe0a6' } }),
      W('dots', 'dots', 'Одно непрочитанное', 'лена.жпег', 2023, 'сетка 12 × 12', 'Сто сорок три точки прочитаны. Одна нет, и смотрят только на неё.', AR.sq),
      W('cursor', 'cursor', 'Курсор в белом кубе', 'Слава Ctrl', 2026, 'векторный курсор', 'Указывает на стену. Стена об этом знает.', AR.port),
      W('r5', 'rothko', 'Ротко на печать', 'tmp_file_2', 2026, 'веб-безопасная палитра', 'Версия для принтера, у которого закончились все цвета, кроме синего.', AR.port, { o: { bg: '#f1efe9', a: '#d9d4c7', b: '#2f5bff' } }),
      W('grid', 'grid', 'Клетка 4 × 4 см', 'user8841', 2026, 'сетка, одна клетка', 'Ровно такая клетка закрашивается, когда посетитель рисует на стене. Автор закрасил одну и ушёл.', AR.sq),
      W('rule150', 'automaton', 'Правило 150', 'oldforum', 1986, 'клеточный автомат', 'Соседка девяностого правила. Ведёт себя так же, только громче.', AR.sq, { o: { rule: 150 } }),
      W('pixel', 'blank', 'Один пиксель', 'Глеб Пиксель', 2026, 'файл 1 × 1', 'Самая маленькая работа музея. Её увеличили ровно настолько, чтобы она перестала быть пикселем.', AR.sq, { o: { dot: true, seed: 5 } }),
      W('radar', 'rings', 'Радар без целей', 'Анонимная мастерская', 2022, 'концентрические круги', 'Круги расходятся. Никто не появляется. Радар считает это хорошим днём.', AR.sq, { o: { bg: '#0f1712', fg: '#7bff8c' } }),
      W('desk', 'grad', 'Обои рабочего стола, 2001', 'user8841', 2001, 'CSS, небо и холм', 'Холм убрали ради минимализма. Небо оставили, чтобы было куда смотреть.', AR.land, { o: { a: '#5aa0ff', b: '#bfe0ff', c: '#9be36b' } })
    ],
    // Новые залы: работы нарисованы в Higgsfield для музея, авторы вымышленные. Порядок совпадает с местами в halls.js.
    n: [
      IMG('n1', 'Житель сети: Монитор', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Спокоен, пока есть питание. Улыбка обновляется шестьдесят раз в секунду.', 1.0),
      IMG('n2', 'Житель сети: Дискета', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Помнит 1,44 мегабайта и ни байтом больше. Этого хватало.', 1.0),
      IMG('n3', 'Житель сети: Банан', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Попал в искусство случайно и остался.', 1.0),
      IMG('n4', 'Житель сети: Курсор', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Всегда указывает. Сам не знает куда.', 1.0),
      IMG('n5', 'Житель сети: Роутер', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Раздаёт всем, себе не оставляет.', 1.0),
      IMG('n6', 'Житель сети: Кот в шлеме', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Видит мышей в высоком разрешении.', 1.0),
      IMG('n7', 'Житель сети: Смайл', 'NETIZEN LAB', 'цифровой портрет, 3D', 'Ответил «ок» и пошёл дальше.', 1.0)
    ],
    s: [
      IMG('s1', 'Туман над хребтом', 'Ася Камень', 'цифровая графика, монохром', 'Горы нарисованы один раз и размыты семь.', 1.787),
      IMG('s2', 'Мазок', 'Лев Пауза', 'цифровая графика, монохром', 'Одно движение, сохранённое без сжатия.', 1.787),
      IMG('s3', 'Слои', 'Нина Шум', 'цифровая графика, монохром', 'Сбой, который решили оставить.', 1.787),
      IMG('s4', 'Затмение', 'Олег Туман', 'цифровая графика, монохром', 'Круг загружается. Облака не возражают.', 1.787),
      IMG('s5', 'Сейсмограмма тишины', 'Ася Камень', 'цифровая графика, монохром', 'Запись комнаты, в которой никто не писал.', 2.333)
    ],
    p: [
      IMG('p1', 'Берег на закате', 'Мира Гамма', 'цифровая живопись', 'Закат выбран из четырёхсот почти одинаковых.', 1.327),
      IMG('p2', 'Сад пятен', 'Тим Палитра', 'цифровая живопись', 'Цветы без контуров: так их запомнил экран.', 1.327),
      IMG('p3', 'Пустыня с примитивами', 'Рома Рендер', 'цифровая живопись', 'Куб, шар и пирамида ждут, когда их поставят в сцену.', 1.327),
      IMG('p4', 'Букет в полном цвете', 'Мира Гамма', 'цифровая живопись', 'Насыщенность выкручена до упора. Автор не жалеет.', 1.327),
      IMG('p5', 'Небо над пиксельным морем', 'Тим Палитра', 'цифровая живопись', 'Сверху градиент, снизу его сжатая копия.', 1.327),
      IMG('p6', 'Город на рассвете', 'Соня Канал', 'цифровая живопись', 'Город, которого нет на картах, но есть в кэше.', 1.327),
      IMG('p7', 'Все цвета по порядку', 'Рома Рендер', 'цифровая живопись', 'Каждая точка одного размера. Споры только о цвете.', 1.0),
      IMG('p8', 'Холмы и красное солнце', 'Соня Канал', 'цифровая живопись', 'Обои рабочего стола, какими они хотели быть.', 1.327),
      IMG('p9', 'Водопад краски', 'Тим Палитра', 'цифровая живопись', 'Полосы текут вниз, пока не кончится холст.', 0.753),
      IMG('p10', 'Окно', 'Мира Гамма', 'цифровая живопись', 'Кто-то ещё не спит.', 0.753),
      IMG('p11', 'Равновесие', 'Соня Канал', 'цифровая живопись', 'Формы держатся друг за друга. Пока держатся.', 0.753)
    ],
    m: [
      IMG('m1', 'Затмение над морем', 'Ян Неон', 'цифровая работа, свечение', 'Солнце ушло в режим энергосбережения.', 0.753),
      IMG('m2', 'Хрустальные горы', 'Лия Спектр', 'цифровая работа, свечение', 'Свет сложился в рельеф и отражается сам в себе.', 0.753),
      IMG('m3', 'Спираль', 'Ян Неон', 'цифровая работа, свечение', 'Галактика размером с вкладку.', 0.753),
      IMG('m4', 'Луч', 'Кир Фотон', 'цифровая работа, свечение', 'Одна вертикаль на всё небо.', 0.753),
      IMG('m5', 'Волна', 'Лия Спектр', 'цифровая работа, свечение', 'Сигнал, который решил побыть тканью.', 0.753),
      IMG('m6', 'Сфера', 'Кир Фотон', 'цифровая работа, свечение', 'Каркас рассыпается на частицы и собирается снова.', 0.753),
      IMG('m7', 'Дверь', 'Ян Неон', 'цифровая работа, свечение', 'Открыта. За ней то же самое, только светлее.', 0.753),
      IMG('m8', 'Сияние над городом', 'Лия Спектр', 'цифровая работа, свечение', 'Огни внизу отвечают огням наверху.', 0.753),
      IMG('m9', 'Горизонт', 'Кир Фотон', 'цифровая работа, свечение', 'Линия, у которой нет конца ни слева, ни справа.', 2.333)
    ]
  };

  // Ротонда: места m-10 и m-11 занимают анимированные работы прежнего Ночного режима. Это копии с другим ключом, оригиналы остаются в HANG.c.
  HANG.m.push({ ...HANG.c.find(w => w.key === 'feed'), key: 'm_feed' }, { ...HANG.c.find(w => w.key === 'plasma'), key: 'm_plasma' },
    IMG('m10', 'Медуза', 'Лия Спектр', 'цифровая работа, свечение', 'Светится, пока на неё смотрят.', .753),
    IMG('m11', 'Лестница', 'Ян Неон', 'цифровая работа, свечение', 'Ступени ведут вверх. Проверено до седьмой.', .753));
  // Работ в ротонде семь, через грань. Порядок совпадает с местами m-01…m-07 (LAYOUT.m в halls.js).
  HANG.m = ['m_plasma', 'm4', 'm5', 'm_feed', 'm3', 'm10', 'm6'].map(k => HANG.m.find(w => w.key === k));
  const ALL = Object.keys(HANG).flatMap(hall => HANG[hall].map(w => { w.hall = hall; w.words = []; return w; }));

  // Работа рисуется, только когда её зал подгружается. Потом сюда встанет загрузка файла художника.
  function make(w) {
    const long = (w.big ? 900 : 640) * (window.LOW ? .8 : 1);
    const cw = Math.round(w.ar >= 1 ? long : long * w.ar), ch = Math.round(w.ar >= 1 ? long / w.ar : long);
    w.canvas = cv(cw, ch);
    w.g = w.canvas.getContext('2d', { willReadFrequently: w.paint === 'sort' });
    w.draw = t => P[w.paint](w.g, cw, ch, t, w.o || {});
    w.draw(3.3);
    if (w.hall === 'c') {
      const s = cv(8, 8), x = s.getContext('2d');
      x.drawImage(w.canvas, 0, 0, 8, 8);
      const d = x.getImageData(0, 0, 8, 8).data;
      let r = 0, gg = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      w.avg = [r / 64, gg / 64, b / 64].map(Math.round);
    }
    return w;
  }
  function memeInto(canvas, m, t) { P.meme2(canvas.getContext('2d'), canvas.width, canvas.height, t || 0, { pic: m[0], top: m[1], bottom: m[2] }); }

  window.Art = { HANG, ALL, make, rng, cv, SANS, MONO, MEMES, memeInto };
})();

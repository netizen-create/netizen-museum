// Общая пиксельная стена на втором этаже главного зала, как wplace: 256 × 64 клетки, палитра из 32 цветов.
// Ставить пиксели может каждый, кто вошёл через Telegram: в запасе до 20, новый пиксель каждые 15 секунд.
// Стена одна на всех и лежит в комнате главного зала на сервере (класс Hall, GET /api/canvas).
// Пиксель уходит через WebSocket живых посетителей ({ px: [x, y, цвет] }), остальные получают его оттуда же.
// Без сервера стена у каждого своя и хранится в браузере.
// Под нарисованным видна заставка из кода: маскот и надпись NETIZEN. Нарисованное её перекрывает.
(function () {
  const W = 256, H = 64, MAX = 20, EVERY = 15, EMPTY = 255;
  const C = window.NETIZEN_CONFIG || {}, ON = !!C.api, STORE = 'netizen.pixels.v1';
  // Палитра r/place 2022.
  const PAL = ['#6d001a', '#be0039', '#ff4500', '#ffa800', '#ffd635', '#fff8b8', '#00a368', '#00cc78', '#7eed56', '#00756f', '#009eaa', '#00ccc0',
    '#2450a4', '#3690ea', '#51e9f4', '#493ac1', '#6a5cff', '#94b3ff', '#811e9f', '#b44ac0', '#e4abff', '#de107f', '#ff3881', '#ff99aa',
    '#6d482f', '#9c6926', '#ffb470', '#000000', '#515252', '#898d90', '#d4d7d9', '#ffffff'];
  const RGB = PAL.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const BG = [244, 244, 241];
  const px = new Uint8Array(W * H).fill(EMPTY), seed = new Uint8Array(W * H).fill(EMPTY), rgba = new Uint8Array(W * H * 4);
  let tex = null, built = null, dirty = false, charge = { n: MAX, t: Date.now() }, loaded = 0;
  const $ = id => document.getElementById(id);

  // --- данные ------------------------------------------------------------------------------------

  // Пустые клетки шахматкой: издалека видно, что стена из клеток.
  const BG2 = [234, 234, 230];
  function color(i) { const c = px[i] !== EMPTY ? px[i] : seed[i]; return c === EMPTY ? ((i % W + (i / W | 0)) & 1 ? BG2 : BG) : RGB[c]; }
  function paintAll() { for (let i = 0; i < W * H; i++) put(i); dirty = true; }
  // Строка 0 в данных текстуры внизу, поэтому y переворачиваем.
  function put(i) { const x = i % W, y = (i / W) | 0, o = ((H - 1 - y) * W + x) * 4, c = color(i); rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; rgba[o + 3] = 255; }
  function set(x, y, c) { const i = y * W + x; px[i] = c; put(i); dirty = true; if (ed.open) ed.draw(); }

  function saveLocal() { try { localStorage.setItem(STORE, JSON.stringify({ px: btoa(String.fromCharCode(...px)), charge })); } catch (e) { /* нет хранилища */ } }
  function loadLocal() {
    try {
      const d = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!d) return;
      const s = atob(d.px); for (let i = 0; i < Math.min(s.length, px.length); i++) px[i] = s.charCodeAt(i);
      if (d.charge) charge = d.charge;
    } catch (e) { /* испорчено: начинаем с чистой стены */ }
  }
  async function refresh() {
    loaded = Date.now();
    if (!ON) { loadLocal(); paintAll(); return; }
    try {
      const r = await fetch(C.api + '/canvas', { cache: 'no-store' });
      if (!r.ok) return;
      const b = new Uint8Array(await r.arrayBuffer());
      if (b.length >= W * H) { px.set(b.subarray(0, W * H)); paintAll(); if (ed.open) ed.draw(); }
    } catch (e) { /* без сети остаётся прежнее */ }
  }

  // Запас пикселей: сколько есть сейчас и через сколько секунд следующий.
  const have = () => Math.min(MAX, charge.n + (Date.now() - charge.t) / 1000 / EVERY);
  const nextIn = () => { const n = have(); return n >= MAX ? 0 : Math.ceil((1 - (n % 1)) * EVERY); };
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Заставка: маскот посередине и надпись NETIZEN слева, цвета приведены к палитре.
  const FONT = { N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], I: ['111', '010', '010', '010', '010', '010', '111'], Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'] };
  const near = ([r, g, b]) => { let best = 0, bd = 1e9; RGB.forEach(([R, G, B], i) => { const d = (r - R) ** 2 * .3 + (g - G) ** 2 * .59 + (b - B) ** 2 * .11; if (d < bd) { bd = d; best = i; } }); return best; };
  function makeSeed() {
    let x = 18;
    for (const ch of 'NETIZEN') {
      const f = FONT[ch];
      f.forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) seed[(25 + j * 2 + b) * W + x + i * 2 + a] = 27; }));
      x += f[0].length * 2 + 3;
    }
    // Значки аватаров музея: сердце, дискета, курсор.
    const SPR = [
      [176, 20, { r: 1 }, ['.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....']],
      [200, 34, { c: 12, w: 31, g: 29 }, ['cccccccc.', 'c.wwww.cc', 'c.wwww.cc', 'ccccccccc', 'cgggggggc', 'cg.....gc', 'cgggggggc', 'ccccccccc']],
      [226, 12, { k: 27, w: 31 }, ['k.......', 'kk......', 'kwk.....', 'kwwk....', 'kwwwk...', 'kwwwwk..', 'kwwwwwk.', 'kwwwkkkk', 'kwkwk...', 'kk.kwk..', 'k...kwk.', '.....kk.']]
    ];
    for (const [x0, y0, map, rows] of SPR) rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch] != null) seed[(y0 + j) * W + x0 + i] = map[ch]; }));
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      const S = 46, c = Art.cv(S, S), g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0, S, S);
      const d = g.getImageData(0, 0, S, S).data, x0 = (W - S) / 2, y0 = (H - S) / 2;
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = (j * S + i) * 4; if (d[o + 3] > 140) seed[(y0 + j) * W + x0 + i] = near([d[o], d[o + 1], d[o + 2]]); }
      paintAll();
    };
    im.src = Media.url('backrooms/chaser.webp');
  }

  // --- стена в зале ------------------------------------------------------------------------------

  function build(r, o) {
    const A = Halls2.api(), T = A.T;
    if (!tex) {
      tex = new T.DataTexture(rgba, W, H, T.RGBAFormat);
      tex.colorSpace = T.SRGBColorSpace; tex.magFilter = T.NearestFilter; tex.minFilter = T.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
      makeSeed(); paintAll();
    }
    // Сетка клеток видна вблизи и тает издалека, чтобы не рябило.
    const mat = new T.ShaderMaterial({
      uniforms: { tM: { value: tex }, uN: { value: new T.Vector2(W, H) } }, extensions: { derivatives: true },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D tM; uniform vec2 uN; varying vec2 vUv;
        void main(){ vec3 c=texture2D(tM,vUv).rgb; vec2 q=vUv*uN, f=abs(fract(q-.5)-.5), w=fwidth(q);
          float k=clamp(1.-max(w.x,w.y)*3.,0.,1.), e=1.-min(min(f.x/w.x,f.y/w.y),1.);
          gl_FragColor=vec4(c*(1.-.12*e*k),1.);
          #include <colorspace_fragment>
        }`
    });
    const L = o.z1 - o.z0, Hh = o.y1 - o.y0;
    const m = new T.Mesh(new T.PlaneGeometry(L, Hh), mat); m.rotation.y = -Math.PI / 2; m.position.set(o.x, (o.y0 + o.y1) / 2, (o.z0 + o.z1) / 2); r.group.add(m);
    const clampZ = z => Math.max(o.z0 + .6, Math.min(o.z1 - .6, z));
    A.thing(r, { id: 'pixels', label: 'Общая стена', verb: 'рисовать', noSpark: true, cap: true, act: open, mesh: m,
      get spot() { return { x: o.x - 1.3, z: clampZ(Museum.P.z), h: o.Y }; },
      get at() { return new T.Vector3(o.x - .2, o.Y + 1.6, clampZ(Museum.P.z)); } });
    built = { r, o, group: r.group };
    refresh();
  }
  function tick() {
    if (built && built.group !== built.r.group) built = null;
    if (dirty && tex) { tex.needsUpdate = true; dirty = false; }
    if (ON && built && Date.now() - loaded > 60000 && Museum.room && Museum.room.id === built.r.id) refresh();
    if (ed.open) ed.info();
  }

  // --- редактор поверх сцены ---------------------------------------------------------------------

  const ed = { open: false, sel: null, col: 31, z: 10, ox: 0, oy: 0, cv: null, g: null, img: null, ptrs: new Map(), pinch: null, moved: 0 };
  function open() {
    if (!built) return;
    ed.open = true; $('px').hidden = false; document.body.classList.add('pxOn');
    ed.cv = $('pxCv'); ed.g = ed.cv.getContext('2d');
    if (!ed.img) { ed.img = Art.cv(W, H); }
    fit();
    // Сразу показываем часть стены напротив посетителя.
    const P = Museum.P, o = built.o, col = Math.round((P.z - o.z0) / (o.z1 - o.z0) * W);
    ed.ox = ed.cv.width / 2 - Math.max(0, Math.min(W, col)) * ed.z; ed.oy = ed.cv.height / 2 - H / 2 * ed.z;
    if (ON && Date.now() - loaded > 5000) refresh();
    palette(); ed.draw(); ed.info();
  }
  function close() { ed.open = false; $('px').hidden = true; document.body.classList.remove('pxOn'); ed.ptrs.clear(); ed.pinch = null; }
  function fit() {
    const r = ed.cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    ed.cv.width = Math.round(r.width * d); ed.cv.height = Math.round(r.height * d); ed.d = d;
    // На телефоне клетка крупная, чтобы попадать пальцем, на компьютере видно больше стены.
    ed.z = Math.max(ed.cv.height / H, ed.cv.width / (matchMedia('(pointer: coarse)').matches ? 34 : 110));
  }
  ed.draw = () => {
    if (!ed.open) return;
    const { g, cv } = ed, ig = ed.img.getContext('2d'), id = ig.createImageData(W, H);
    for (let i = 0; i < W * H; i++) { const c = color(i), o = i * 4; id.data[o] = c[0]; id.data[o + 1] = c[1]; id.data[o + 2] = c[2]; id.data[o + 3] = 255; }
    ig.putImageData(id, 0, 0);
    clampView();
    g.fillStyle = '#101115'; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = false;
    g.drawImage(ed.img, ed.ox, ed.oy, W * ed.z, H * ed.z);
    // Сетка, когда клетки крупные.
    if (ed.z >= 8 * ed.d) {
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; g.beginPath();
      const x0 = Math.max(0, Math.floor(-ed.ox / ed.z)), x1 = Math.min(W, Math.ceil((cv.width - ed.ox) / ed.z)), y0 = Math.max(0, Math.floor(-ed.oy / ed.z)), y1 = Math.min(H, Math.ceil((cv.height - ed.oy) / ed.z));
      for (let x = x0; x <= x1; x++) { const X = Math.round(ed.ox + x * ed.z) + .5; g.moveTo(X, ed.oy + y0 * ed.z); g.lineTo(X, ed.oy + y1 * ed.z); }
      for (let y = y0; y <= y1; y++) { const Y = Math.round(ed.oy + y * ed.z) + .5; g.moveTo(ed.ox + x0 * ed.z, Y); g.lineTo(ed.ox + x1 * ed.z, Y); }
      g.stroke();
    }
    if (ed.sel) {
      const [x, y] = ed.sel, X = ed.ox + x * ed.z, Y = ed.oy + y * ed.z, c = RGB[ed.col];
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.85)`; g.fillRect(X, Y, ed.z, ed.z);
      g.lineWidth = Math.max(2, ed.z * .12); g.strokeStyle = '#111'; g.strokeRect(X - g.lineWidth / 2, Y - g.lineWidth / 2, ed.z + g.lineWidth, ed.z + g.lineWidth);
      g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, ed.z * .05); g.strokeRect(X - 1, Y - 1, ed.z + 2, ed.z + 2);
    }
  };
  function clampView() {
    const { cv } = ed, w = W * ed.z, h = H * ed.z;
    ed.ox = w < cv.width ? (cv.width - w) / 2 : Math.min(cv.width * .3, Math.max(cv.width * .7 - w, ed.ox));
    ed.oy = h < cv.height ? (cv.height - h) / 2 : Math.min(cv.height * .3, Math.max(cv.height * .7 - h, ed.oy));
  }
  function zoomAt(k, cx, cy) {
    const z = Math.max(ed.cv.height / H * .5, Math.min(60 * ed.d, ed.z * k)), q = z / ed.z;
    ed.ox = cx - (cx - ed.ox) * q; ed.oy = cy - (cy - ed.oy) * q; ed.z = z; ed.draw();
  }
  function cellAt(cx, cy) { const x = Math.floor((cx - ed.ox) / ed.z), y = Math.floor((cy - ed.oy) / ed.z); return x >= 0 && x < W && y >= 0 && y < H ? [x, y] : null; }

  function palette() {
    const box = $('pxPal');
    if (!box.children.length) PAL.forEach((h, i) => {
      const b = document.createElement('button'); b.style.setProperty('--c', h); b.setAttribute('aria-label', 'Цвет ' + h);
      b.onclick = () => { ed.col = i; palette(); ed.draw(); };
      box.appendChild(b);
    });
    [...box.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === ed.col)));
  }
  const pxW = n => n % 10 === 1 && n % 100 !== 11 ? 'пиксель' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'пикселя' : 'пикселей';
  // Строка состояния: запас, вход, выбранная клетка.
  let why = '';
  ed.info = () => {
    const n = Math.floor(have()), wait = nextIn(), go = $('pxGo');
    const login = ON && !(window.Net && Net.token());
    $('pxInfo').textContent = login ? 'Чтобы рисовать, войди через Telegram' : `У тебя ${n} ${pxW(n)} из ${MAX}` + (wait ? `, следующий появится через ${mmss(wait)}` : '');
    $('pxHint').textContent = why || (login ? '' : ed.sel ? 'Выбери цвет и нажми «Поставить»' : 'Выбери клетку, цвет и нажми «Поставить»');
    go.disabled = login || !ed.sel || n < 1;
  };
  function say(t) { why = t; ed.info(); clearTimeout(say.t); say.t = setTimeout(() => { why = ''; }, 3500); }

  function place() {
    if (!ed.sel) return;
    if (have() < 1) return say(`Пиксели закончились, следующий появится через ${mmss(nextIn())}`);
    const [x, y] = ed.sel, c = ed.col;
    if (ON) {
      if (!(window.Net && Net.token())) return say('Чтобы рисовать, войди через Telegram');
      if (!(window.Live && Live.ready && Live.ready('n'))) return say('Не получается связаться с сервером, попробуй ещё раз через пару секунд');
      Live.send({ px: [x, y, c] });
    }
    charge = { n: have() - 1, t: Date.now() };
    set(x, y, c);
    if (!ON) saveLocal();
    Snd.sfx && Snd.sfx('spray');
    ed.info();
  }

  // Ответы сервера и пиксели других посетителей (live.js).
  function remote(d) {
    if (Array.isArray(d.px)) { const [x, y, c] = d.px; if (x >= 0 && x < W && y >= 0 && y < H && c >= 0 && c < 32) set(x, y, c); }
    if (typeof d.pc === 'number') charge = { n: d.pc, t: Date.now() };
    if (d.pxno) {
      // Сервер не принял пиксель: стену перечитываем, чтобы убрать то, что поставили заранее.
      say(d.pxno === 'blocked' ? 'Твой аккаунт заблокирован, поэтому рисовать нельзя' : `Пиксели закончились, следующий появится через ${mmss(nextIn())}`);
      refresh();
    }
  }

  function wire() {
    const cv = $('pxCv');
    $('pxX').onclick = close;
    $('pxGo').onclick = place;
    $('pxIn').onclick = () => zoomAt(1.5, cv.width / 2, cv.height / 2);
    $('pxOut').onclick = () => zoomAt(1 / 1.5, cv.width / 2, cv.height / 2);
    addEventListener('keydown', e => { if (ed.open && e.key === 'Escape') close(); if (ed.open && e.key === 'Enter') place(); });
    addEventListener('resize', () => { if (ed.open) { fit(); ed.draw(); } });
    cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) * ed.d, (e.clientY - r.top) * ed.d); }, { passive: false });
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * ed.d, (e.clientY - r.top) * ed.d]; };
    cv.addEventListener('pointerdown', e => {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* указатель уже ушёл */ }
      ed.ptrs.set(e.pointerId, at(e));
      if (ed.ptrs.size === 1) ed.moved = 0;
      if (ed.ptrs.size === 2) { const [a, b] = [...ed.ptrs.values()]; ed.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; ed.moved = 99; }
    });
    cv.addEventListener('pointermove', e => {
      if (!ed.ptrs.has(e.pointerId)) return;
      const p = at(e), q = ed.ptrs.get(e.pointerId); ed.ptrs.set(e.pointerId, p);
      if (ed.ptrs.size === 2 && ed.pinch) {
        const [a, b] = [...ed.ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoomAt(d / ed.pinch.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); ed.pinch.d = d; return;
      }
      ed.moved += Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
      ed.ox += p[0] - q[0]; ed.oy += p[1] - q[1]; ed.draw();
    });
    const up = e => {
      if (!ed.ptrs.has(e.pointerId)) return;
      const p = ed.ptrs.get(e.pointerId); ed.ptrs.delete(e.pointerId);
      if (ed.ptrs.size < 2) ed.pinch = null;
      if (e.type === 'pointerup' && ed.ptrs.size === 0 && ed.moved < 8 * ed.d) { const c = cellAt(p[0], p[1]); if (c) { ed.sel = c; ed.draw(); ed.info(); } }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  if (!ON) loadLocal();

  window.Pixels = { build, tick, open, close, remote, isOpen: () => ed.open, W, H, PAL,
    // Для проверки в превью.
    debug: () => ({ have: have(), painted: px.filter(v => v !== EMPTY).length, built: !!built }) };
})();

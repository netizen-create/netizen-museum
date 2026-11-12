// Четыре зала новой сборки и двери между ними: NETIZEN (n), Сад камней (s), Анфилада (p), Ночной режим (m).
// Файл подключается перед world.js: тот берёт отсюда комнаты, проходы и развеску, а запекание и предметы
// вызывает по стилю зала. Свет, как и везде, нарисован в текстурах: ламп в сцене нет.
// Всё светящееся (линии по рёбрам, арки, кольцо) это плоские полосы одного цвета, собранные в одну геометрию на зал.
(function () {
  const TAU = Math.PI * 2;
  const ROOMS = [
    // Главный зал: ангар в два уровня. Лестница вдоль западной стены, мостики над залом, на восточной стене общая пиксельная стена.
    { id: 'n', v2: true, name: 'NETIZEN', sub: 'Главный зал', x0: 0, x1: 18, z0: -12, z1: 14, h: 12.6, refl: .26, track: 'gallery', light: { x0: 4.5, x1: 13.5, z0: -8, z1: 10, d: .9 } },
    // Сад камней: серый зал, свет идёт линиями по всем рёбрам, на полу плоские камни.
    { id: 's', v2: true, name: 'Сад камней', x0: -18, x1: -1.5, z0: 5, z1: 17, h: 5.5, refl: .3, track: 'gallery' },
    // Анфилада: вдоль южной стены ряд порталов, к северу открытая галерея с небом в потолке.
    { id: 'p', v2: true, name: 'Анфилада', x0: 19.5, x1: 47.5, z0: -5, z1: 9, h: 6.5, refl: .1, track: 'gallery', light: { x0: 22.5, x1: 44.5, z0: -3.4, z1: .6, d: 1.3 } },
    // Ночной режим: круглая ротонда из шестнадцати граней, по стене две светящиеся ленты, в центре скульптура на подиуме.
    { id: 'm', v2: true, name: 'Ночной режим', x0: -26, x1: -2, z0: -19, z1: 5, h: 7, refl: .36, track: 'night', round: { n: 16 } }
  ];
  // Все проходы новой сборки с дверью: door задаёт начальное состояние, look берётся по залу, куда дверь ведёт.
  const PASS = [
    { a: 's', b: 'n', axis: 'x', c: 7.5, w: 2.6, h: 3.4, round: .8, v2: true },
    { a: 'm', b: 'n', axis: 'x', c: -7, w: 2.6, h: 3.4, round: .8, v2: true },
    { a: 'n', b: 'p', axis: 'x', c: 6, w: 2.6, h: 3.4, round: .8, v2: true }
  ];
  // Места на стенах: стена, середина по длине, наибольшие ширина и высота, глубина ниши (нет), высота центра.
  const LAYOUT = {
    // Главный зал: всё на первом уровне. Западная по обе стороны от лестницы, восточная под мостиком, южная у входа. Под мостом игровой угол.
    n: [['E', 22.8, 3, 2.6, 0, 2.05], ['W', 2.6, 2.6, 2.6, 0, 2.05], ['W', 24.2, 2.2, 2.4, 0, 2], ['E', 6, 3, 2.6, 0, 2.05], ['E', 12.4, 3, 2.6, 0, 2.05], ['S', 6, 3.2, 2.8, 0, 2.15], ['S', 12.6, 3.2, 2.8, 0, 2.15]],
    s: [['N', 4.6, 4.8, 2.5, 0, 2.05], ['N', 11.6, 4.8, 2.5, 0, 2.05], ['S', 4.9, 4.8, 2.5, 0, 2.05], ['S', 11.9, 4.8, 2.5, 0, 2.05], ['W', 6, 6.2, 2.7, 0, 2.1]],
    p: [['N', 3.5, 3.2, 2.6, 0, 2.1], ['N', 9, 3.2, 2.6, 0, 2.1], ['N', 14.5, 3.2, 2.6, 0, 2.1], ['N', 20, 3.2, 2.6, 0, 2.1], ['N', 25, 3.2, 2.6, 0, 2.1],
      ['W', 10, 3.2, 2.6, 0, 2.1], ['E', 11, 2.1, 2.1, 0, 2.1], ['E', 4, 3.2, 2.6, 0, 2.1], ['S', 18.75, 1.7, 2, 0, 1.8], ['S', 11.75, 1.7, 2, 0, 1.8], ['S', 4.75, 1.7, 2, 0, 1.8]],
    // Ротонда: грань R0 смотрит на север, номера по часовой стрелке, R4 с дверью. Середина грани в долях её длины.
    // Работы через грань: на чётных гранях, кроме двери (R4). Ширина у всех 3 м, высота по пропорциям.
    // m-01 «Скринсейвер» на севере, m-04 «Бесконечная лента» на юге, m-06 «Медуза» напротив двери за скульптурой.
    m: [0, 2, 6, 8, 10, 12, 14].map(k => ['R' + k, .5, 3, 4.2, 0, 2.75])
  };

  // Порталы анфилады: проём с каждым шагом чуть меньше, от этого коридор кажется длиннее.
  const GATES = [0, 1, 2, 3, 4, 5, 6].map(i => ({ x: 23.5 + i * 3.5, w: 2.8 - i * .12, h: 3.7 - i * .1 }));
  const GATE = { t: .5, z0: 3, z1: 9, zc: 6 };
  for (const q of GATES) ROOMS[2].block = [...(ROOMS[2].block || []), [q.x - GATE.t / 2, q.x + GATE.t / 2, GATE.z0, GATE.zc - q.w / 2], [q.x - GATE.t / 2, q.x + GATE.t / 2, GATE.zc + q.w / 2, GATE.z1]];
  // Камни: середина, полуоси, высота, поворот, тон (1 светлый мрамор, 0 тёмный сланец), число углов.
  const STONES = [
    [-5.4, 13.9, 2.1, 1.45, .44, .3, 1, 11], [-8.1, 7.7, 1.55, 1, .34, -.2, 0, 10], [-10.6, 13.4, 1.5, .8, .3, .15, 0, 9],
    [-13.2, 8.3, 1.15, .72, .3, .5, 1, 9], [-14.4, 11.3, .75, .5, .27, -.4, 0, 8], [-15.4, 14.7, .95, .62, .36, .1, 1, 9]
  ];
  ROOMS[1].block = STONES.map(([x, z, rx, rz]) => [x - rx * .82, x + rx * .82, z - rz * .82, z + rz * .82]);
  // Ротонда: центр и подиум со скульптурой. Автоматы переехали в главный зал, под мост (arcadeCorner).
  const ROT = { x: -14, z: -7, plinth: 2.1 };
  ROOMS[3].block = [[ROT.x - 2.3, ROT.x + 2.3, ROT.z - 2.3, ROT.z + 2.3]];

  let A = null;
  const H = window.Halls2 = { ROOMS, PASS, LAYOUT, HUB: null, bake: {}, floor: {}, ceil: {}, props: {}, res: { hub: 64, stone: 52, enfil: 60, neon: 44 }, init(api) { A = api; setup(); }, api: () => A, pass, setDoor, tick };

  // Цвета проёма со стороны каждого зала: откос, пол проёма, светящийся кант.
  const LOOK = {
    hub: { jamb: '#d4d3cf', sole: '#c4c3bf', rim: '#7af7d6' },
    stone: { jamb: '#8d8e93', sole: '#8b8c90', rim: '#ffffff' },
    enfil: { jamb: '#ececee', sole: '#dcdcde', rim: null },
    // В ротонде канта нет: вертикальная светящаяся полоса у края проёма выглядела как преграда, свет там дают ленты.
    neon: { jamb: '#0c0d12', sole: '#2b2338', rim: null }
  };

  // --- общие приёмы рисования --------------------------------------------------------------------

  function vgrad(g, w, h, stops) { const l = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, c]) => l.addColorStop(o, c)); g.fillStyle = l; g.fillRect(0, 0, w, h); }
  // Полоса света или тени от края внутрь: side это t (верх), b (низ), l, r.
  function band(g, w, h, side, len, c0, c1) {
    const v = side === 't' || side === 'b', l = side === 't' ? g.createLinearGradient(0, 0, 0, len) : side === 'b' ? g.createLinearGradient(0, h, 0, h - len) : side === 'l' ? g.createLinearGradient(0, 0, len, 0) : g.createLinearGradient(w, 0, w - len, 0);
    l.addColorStop(0, c0); l.addColorStop(.35, c1 || mixA(c0, .32)); l.addColorStop(1, mixA(c0, 0));
    g.fillStyle = l;
    if (v) g.fillRect(0, side === 't' ? 0 : h - len, w, len); else g.fillRect(side === 'l' ? 0 : w - len, 0, len, h);
  }
  const mixA = (c, k) => c.replace(/rgba\(([^)]+),\s*([\d.]+)\)/, (m, rgb, a) => `rgba(${rgb},${(+a * k).toFixed(3)})`);
  // Мелкое зерно: без него на плавных переходах видны ступени цвета.
  function dither(g, w, h, a, seed) {
    const r = A.rng(seed), n = Math.round(w * h * .02); g.globalAlpha = a;
    for (let i = 0; i < n; i++) { g.fillStyle = r() > .5 ? '#fff' : '#000'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    g.globalAlpha = 1;
  }
  // Тень рамы на стене и мягкий отсвет вокруг работы.
  function frames(g, wall, s, X, Y, shadow, halo) {
    for (const a of wall.items) {
      const x = X(a.u - a.wid / 2), y = Y(a.v + a.hgt / 2), pw = a.wid * s, ph = a.hgt * s;
      if (halo) { g.save(); g.shadowColor = halo; g.shadowBlur = .5 * s; g.fillStyle = halo; g.fillRect(x, y, pw, ph); g.fillRect(x, y, pw, ph); g.restore(); }
      if (shadow) { g.save(); g.shadowColor = shadow; g.shadowBlur = .16 * s; g.shadowOffsetY = .1 * s; g.fillStyle = '#000'; g.fillRect(x - .03 * s, y - .03 * s, pw + .06 * s, ph + .06 * s); g.restore(); }
    }
  }
  function doorPath(g, d, X, Y, grow = 0) {
    g.beginPath();
    d.pts.forEach(([u, v], i) => { const k = 1 + grow / d.p.w * 2, uu = d.u + (u - d.u) * k, vv = v * (1 + grow / d.p.h); i ? g.lineTo(X(uu), Y(vv)) : g.moveTo(X(uu), Y(vv)); });
  }
  // Свечение по контуру проёма.
  function doorGlow(g, wall, s, X, Y, col, blur, lw) {
    for (const d of wall.doors) {
      g.save(); g.shadowColor = col; g.shadowBlur = blur * s; g.strokeStyle = col; g.lineWidth = lw * s; g.lineJoin = 'round';
      doorPath(g, d, X, Y, .05); g.stroke(); g.stroke(); g.restore();
    }
  }
  // Размытая фигура без ctx.filter (его нет в Safari до 18): рисуем фигуру за краем холста, на холст попадает только её тень.
  function soft(g, blur, color, draw) {
    g.save(); g.shadowColor = color; g.shadowBlur = blur * 2; g.shadowOffsetX = 20000; g.translate(-20000, 0); g.fillStyle = '#000'; draw(); g.restore();
  }
  const FX = (r, s) => x => (x - r.x0) * s, FZ = (r, s) => z => (z - r.z0) * s, CZ = (r, s) => z => (r.z1 - z) * s;
  function blob(g, x, y, rx, ry, col, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const l = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    l.addColorStop(0, `rgba(${col},${a})`); l.addColorStop(.55, `rgba(${col},${a * .38})`); l.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = l; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  }

  // --- полосы света: одна геометрия на зал ---------------------------------------------------------

  function Strips() { const pos = [], mask = []; return { pos, mask,
    // Четырёхугольник по четырём углам; ma и mb это доли двух цветов ночного зала.
    quad(a, b, c, d, ma = 1, mb = 0) { pos.push(...a, ...b, ...c, ...a, ...c, ...d); for (let i = 0; i < 6; i++) mask.push(ma, mb); },
    // Полоса вдоль отрезка a-b шириной wd, сдвиг по направлению n (единичный вектор в плоскости полосы).
    line(a, b, n, wd, ma, mb) { const o = n.map(v => v * wd); this.quad(a, b, [b[0] + o[0], b[1] + o[1], b[2] + o[2]], [a[0] + o[0], a[1] + o[1], a[2] + o[2]], ma, mb); },
    mesh(mat) {
      const geo = new A.T.BufferGeometry();
      geo.setAttribute('position', new A.T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('mask', new A.T.Float32BufferAttribute(mask, 2));
      return new A.T.Mesh(geo, mat);
    } };
  }

  // --- ночной зал: два цвета подсветки -------------------------------------------------------------

  const DUO = { uA: { value: null }, uB: { value: null } };
  let duoLine = null;
  // Свечение на стенах, полу и потолке лежит отдельным слоем: красный канал текстуры это первый цвет, зелёный второй.
  const duoMat = map => new A.T.ShaderMaterial({
    uniforms: { tM: { value: map }, uA: DUO.uA, uB: DUO.uB }, transparent: true, depthWrite: false, blending: A.T.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D tM; uniform vec3 uA,uB; varying vec2 vUv; void main(){ vec4 m=texture2D(tM,vUv); gl_FragColor=vec4(uA*m.r+uB*m.g,1.);\n#include <colorspace_fragment>\n}'
  });
  function maskTex(c) { const t = new A.T.CanvasTexture(c); t.generateMipmaps = false; t.minFilter = t.magFilter = A.T.LinearFilter; t.onUpdate = () => { c.width = c.height = 0; t.onUpdate = null; }; return t; }

  function setup() {
    const T = A.T;
    DUO.uA.value = new T.Color('#19e0d0'); DUO.uB.value = new T.Color('#ff3fd0');
    duoLine = new T.ShaderMaterial({
      uniforms: { uA: DUO.uA, uB: DUO.uB }, side: T.DoubleSide,
      vertexShader: 'attribute vec2 mask; varying vec2 vM; void main(){ vM=mask; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 uA,uB; varying vec2 vM; void main(){ vec3 c=uA*vM.x+uB*vM.y; gl_FragColor=vec4(mix(c,vec3(1.),.35),1.);\n#include <colorspace_fragment>\n}'
    });
  }

  // =================================================================================================
  // NETIZEN: главный зал, ангар в два уровня
  // =================================================================================================
  // Вход с юга. Вдоль западной стены лестница поднимается на север к площадке, оттуда мост вдоль северной стены
  // и мостик вдоль восточной, на которой висит общая пиксельная стена (pixels.js). В крыше фонарь с небом, под ним фермы.
  // Второй уровень работает через levels: app.js спрашивает высоту пола под ногами и путь между уровнями.
  const HUB = H.HUB = {
    Y: 4.6, slab: .35,
    // Лестница: x0…x1 вдоль стены, внизу на юге (zBot), наверху на севере (zTop), n ступеней.
    stair: { x0: 0, x1: 2.2, zTop: -3.4, zBot: 5.2, n: 28 },
    // Где можно ходить наверху. Прямоугольники заходят друг на друга в углах, иначе между ними не пройти.
    deck: { W: { x0: 0, x1: 2.4, z0: -12, z1: -3.4 }, N: { x0: 0, x1: 18, z0: -12, z1: -9.6 }, E: { x0: 15.4, x1: 18, z0: -12, z1: 14 } },
    // Те же перекрытия для отрисовки, без наложений.
    slabs: [[0, 2.4, -12, -3.4], [2.4, 15.4, -12, -9.6], [15.4, 18, -12, 14]],
    // Перила: от точки до точки по краю перекрытия, out смотрит в пустоту.
    rails: [[[2.4, -9.6], [2.4, -3.4], [1, 0]], [[2.4, -9.6], [15.4, -9.6], [0, 1]], [[15.4, -9.6], [15.4, 14], [-1, 0]]],
    // Под мостом колонн нет: они загораживали игровой угол.
    cols: [[2.4, -9.6], [2.4, -3.4], [15.4, -9.6], [15.4, -3.6], [15.4, 2.4], [15.4, 9.2]],
    // Серверные стойки в юго-восточном углу. У северной стены их убрали, там игровой угол.
    racks: [[15.9, 'S'], [16.9, 'S']],
    // Общая стена на восточной стене над мостиком: 24 × 6 м.
    wall: { z0: -11, z1: 13, y0: 5.1, y1: 11.1 },
    ring: { u: 9, v: 8.3, R: 2.3, r: 1.86 },
    truss: { y0: 11.55, y1: 12.45 },
    // Мятные полосы на стенах первого уровня, по стене (u).
    bars: { N: [3.5, 14.5], E: [16, 20], S: [2.5, 15.5] },
    // Сдвиг солнечного пятна на полу от фонаря.
    sun: { dx: -1.6, dz: 3.2 }
  };
  const ST = HUB.stair, R0 = ROOMS[0], MINT = '#7af7d6', mint = a => `rgba(95,245,210,${a})`;
  R0.block = [[ST.x0, ST.x1, ST.zTop, ST.zBot - .4], ...HUB.cols.map(([x, z]) => [x - .15, x + .15, z - .15, z + .15]),
    ...HUB.racks.map(([x, k]) => k === 'N' ? [x - .5, x + .5, R0.z0, R0.z0 + .8] : [x - .5, x + .5, R0.z1 - .8, R0.z1])];
  const stairY = z => HUB.Y * Math.min(1, Math.max(0, (ST.zBot - z) / (ST.zBot - ST.zTop)));
  const decks = Object.values(HUB.deck), inRect = (q, x, z, m) => x > q.x0 + m && x < q.x1 - m && z > q.z0 + m && z < q.z1 - m;
  const inStair = (x, z, m) => x > ST.x0 + m && x < ST.x1 - m && z > ST.zTop - .7 && z < ST.zBot + .7;
  // Уровни главного зала для app.js: высота пола, путь по лестнице и мостикам.
  R0.levels = {
    Y: HUB.Y,
    // Пол в точке (x, z), на который можно шагнуть с высоты h: не дальше полуметра по высоте. Иначе null.
    at(x, z, h, m) {
      let best = null, bd = .5;
      const take = y => { const d = Math.abs(y - h); if (d <= bd) { bd = d; best = y; } };
      if (!R0.block.some(b => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m)) take(0);
      if (inStair(x, z, m)) take(stairY(z));
      if (decks.some(q => inRect(q, x, z, m))) take(HUB.Y);
      return best;
    },
    // Пол под точкой, куда нажали: самый высокий, что не выше точки.
    snap(x, z, y) {
      if (y > HUB.Y - .3 && decks.some(q => inRect(q, x, z, 0))) return HUB.Y;
      if (inStair(x, z, 0)) { const s = stairY(z); if (s < y + .3) return s; }
      return 0;
    },
    up: p => (p.h || 0) > HUB.Y / 2,
    onStair: p => inStair(p.x, p.z, 0) && (p.h || 0) > .15 && (p.h || 0) < HUB.Y - .15,
    foot: { x: 1.1, z: ST.zBot + .8, h: 0 },
    top: { x: 1.1, z: ST.zTop - 1, h: HUB.Y },
    // Путь по мостикам: площадка (0), мост (1), мостик (2) идут подряд, между ними углы.
    deck(a, b) {
      const part = p => p.z < -9.6 ? 1 : p.x < 9 ? 0 : 2, ia = part(a), ib = part(b);
      const C = [{ x: 1.2, z: -10.8, h: HUB.Y }, { x: 16.7, z: -10.8, h: HUB.Y }];
      if (ia === ib) return [];
      return ia < ib ? C.slice(ia, ib) : C.slice(ib, ia).reverse();
    }
  };

  // Глухие коробки и плоскости с запечённым светом: у каждой грани свой цвет, всё в одной геометрии.
  function Solid() {
    const pos = [], col = [], C = {};
    const c3 = c => C[c] || (C[c] = new A.T.Color(c));
    const quad = (a, b, c, d, color) => { const k = c3(color); pos.push(...a, ...b, ...c, ...a, ...c, ...d); for (let i = 0; i < 6; i++) col.push(k.r, k.g, k.b); };
    return { quad,
      // f: цвета граней t (верх), b (низ), px, nx, pz, nz; чего нет, берётся из s. null убирает грань.
      box(x0, x1, y0, y1, z0, z1, f) {
        const c = k => (k in f ? f[k] : f.s);
        if (c('t')) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], c('t'));
        if (c('b')) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c('b'));
        if (c('px')) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], c('px'));
        if (c('nx')) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c('nx'));
        if (c('pz')) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c('pz'));
        if (c('nz')) quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], c('nz'));
      },
      mesh(o = {}) {
        const geo = new A.T.BufferGeometry();
        geo.setAttribute('position', new A.T.Float32BufferAttribute(pos, 3));
        geo.setAttribute('color', new A.T.Float32BufferAttribute(col, 3));
        return new A.T.Mesh(geo, new A.T.MeshBasicMaterial(Object.assign({ vertexColors: true }, o)));
      } };
  }
  // Ореол вокруг светящихся полос: прозрачная полоса, яркая посередине, складывается со сценой.
  let haloTex = null;
  function Halo() {
    const pos = [], uv = [], cols = [];
    return {
      // c: свой цвет полосы, без него цвет всего ореола.
      line(a, b, n, wd, c) {
        const o = n.map(v => v * wd / 2), a0 = a.map((v, i) => v - o[i]), a1 = a.map((v, i) => v + o[i]), b0 = b.map((v, i) => v - o[i]), b1 = b.map((v, i) => v + o[i]);
        pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1); uv.push(0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0); cols.push(c || null);
      },
      mesh(color, k) {
        if (!haloTex) haloTex = A.tex(A.textPanel(64, 4, (g, w, h) => { const l = g.createLinearGradient(0, 0, w, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(.5, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h); }));
        const geo = new A.T.BufferGeometry();
        geo.setAttribute('position', new A.T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new A.T.Float32BufferAttribute(uv, 2));
        const vc = []; for (const c of cols) { const k3 = new A.T.Color(c || color); for (let i = 0; i < 6; i++) vc.push(k3.r, k3.g, k3.b); }
        geo.setAttribute('color', new A.T.Float32BufferAttribute(vc, 3));
        return new A.T.Mesh(geo, new A.T.MeshBasicMaterial({ map: haloTex, vertexColors: true, transparent: true, opacity: k, depthWrite: false, blending: A.T.AdditiveBlending, side: A.T.DoubleSide }));
      }
    };
  }
  // Плоскости с текстурой: одна геометрия на материал.
  function Tiles() {
    const pos = [], uv = [];
    return {
      quad(a, b, c, d, u0 = 0, v0 = 0, u1 = 1, v1 = 1) { pos.push(...a, ...b, ...c, ...a, ...c, ...d); uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); },
      mesh(mat) {
        const geo = new A.T.BufferGeometry();
        geo.setAttribute('position', new A.T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new A.T.Float32BufferAttribute(uv, 2));
        return new A.T.Mesh(geo, mat);
      }
    };
  }

  // Где под перекрытиями висят светильники.
  const LAMPS = [
    ...[-10.8, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5, 13].map(z => [16.7, z]),
    ...[4.5, 7.5, 10.5, 13.5].map(x => [x, -10.8]),
    ...[-7.6, -4.8].map(z => [1.2, z])
  ];
  // Под каким перекрытием лежит стена: участки по длине стены (u).
  const UNDER = { N: [[0, 18]], E: [[0, 26]], W: [[17.4, 26]], S: [[0, 2.6]] };

  H.bake.hub = (wall, g, w, h, s, X, Y) => {
    const k = wall.key, L = wall.L, Yd = HUB.Y;
    vgrad(g, w, h, [[0, '#c6c3bd'], [.4, '#b4b1ab'], [1, '#928f89']]);
    // Свет из фонаря: верх стены светлее, углы темнее.
    band(g, w, h, 't', 4.5 * s, 'rgba(255,255,255,.26)', 'rgba(255,255,255,.08)');
    band(g, w, h, 'b', 1.2 * s, 'rgba(50,46,40,.3)');
    band(g, w, h, 'l', 1.4 * s, 'rgba(50,46,40,.22)'); band(g, w, h, 'r', 1.4 * s, 'rgba(50,46,40,.22)');
    // Швы бетонных панелей совпадают с фермами, по высоте пояс перекрытия и ещё один шов.
    g.fillStyle = 'rgba(70,66,58,.15)';
    const step = k === 'N' || k === 'S' ? 3 : 3.25;
    for (let u = step; u < L - .1; u += step) g.fillRect(X(u) - 1, 0, 2, h);
    g.fillRect(0, Y(8.6), w, 2);
    // Под перекрытием: тень от плиты и пятна светильников.
    for (const [u0, u1] of UNDER[k] || []) {
      g.fillStyle = 'rgba(54,50,44,.12)'; g.fillRect(X(u0), Y(Yd - HUB.slab), (u1 - u0) * s, (Yd - HUB.slab) * s);
      soft(g, .25 * s, 'rgba(40,38,34,.4)', () => g.fillRect(X(u0), Y(Yd - HUB.slab), (u1 - u0) * s, .12 * s));
      for (let u = u0 + 1.5; u < u1 - .5; u += 3) blob(g, X(u), Y(3.3), .95 * s, 1.5 * s, '255,248,230', .34);
      g.fillStyle = 'rgba(70,66,58,.25)'; g.fillRect(X(u0), Y(Yd + .02), (u1 - u0) * s, 2);
    }
    // Вертикальные мятные полосы: ореол здесь, сама полоса отдельной геометрией.
    for (const u of HUB.bars[k] || []) {
      soft(g, .5 * s, mint(1), () => { g.fillRect(X(u - .06), Y(4), .12 * s, 3.85 * s); g.fillRect(X(u - .06), Y(4), .12 * s, 3.85 * s); });
      blob(g, X(u), Y(.3), 1 * s, .6 * s, '95,245,210', .55);
    }
    doorGlow(g, wall, s, X, Y, mint(.95), .35, .07);
    frames(g, wall, s, X, Y, 'rgba(50,46,40,.45)');
    if (k === 'N') {
      // Мятное кольцо над мостом, видно от входа.
      const q = HUB.ring, cx = X(q.u), cy = Y(q.v), R = q.R * s, r = q.r * s;
      g.save(); g.shadowColor = mint(1); g.shadowBlur = .9 * s; g.strokeStyle = mint(.9); g.lineWidth = .1 * s;
      g.beginPath(); g.arc(cx, cy, R + .06 * s, 0, TAU); g.stroke(); g.stroke(); g.restore();
      const m = g.createRadialGradient(cx, cy, r, cx, cy, R);
      m.addColorStop(0, '#11d9b3'); m.addColorStop(.3, '#2af3cb'); m.addColorStop(.8, '#1ee8c0'); m.addColorStop(1, '#0fcaa6');
      g.fillStyle = m; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.arc(cx, cy, r, 0, TAU, true); g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
      blob(g, cx, cy + r * .2, r * 1.2, r * .9, '120,255,226', .22);
      g.shadowColor = 'rgba(30,50,46,.45)'; g.shadowBlur = .3 * s; g.strokeStyle = 'rgba(30,50,46,.4)'; g.lineWidth = .08 * s; g.beginPath(); g.arc(cx, cy, r + .05 * s, 0, TAU); g.stroke();
      g.restore();
    }
    if (k === 'W') {
      // Название над лестницей.
      g.save(); g.font = `800 ${Math.round(1.25 * s)}px ${A.SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = mint(.9); g.shadowBlur = .45 * s; g.fillStyle = '#1fdcb4';
      g.fillText('NETIZEN', X(12), Y(8.5)); g.fillText('NETIZEN', X(12), Y(8.5));
      g.shadowBlur = 0; g.font = `500 ${Math.round(.28 * s)}px ${A.MONO}`; g.fillStyle = 'rgba(20,110,92,.9)';
      g.fillText('ГЛАВНЫЙ ЗАЛ · ВХОД В МУЗЕЙ', X(12), Y(7.45));
      g.restore();
    }
    if (k === 'E') {
      // Под общей стеной тёмная подложка и мятная подсветка снизу.
      const q = HUB.wall, u0 = q.z0 - R0.z0, u1 = q.z1 - R0.z0;
      soft(g, .5 * s, 'rgba(20,22,28,.45)', () => g.fillRect(X(u0), Y(q.y1), (u1 - u0) * s, (q.y1 - q.y0) * s));
      soft(g, .6 * s, mint(.6), () => g.fillRect(X(u0), Y(q.y0 - .05), (u1 - u0) * s, .1 * s));
    }
    dither(g, w, h, .016, wall.id.charCodeAt(1));
  };
  H.floor.hub = (r, g, w, h, s) => {
    const X = FX(r, s), Z = FZ(r, s), q = r.light, sun = HUB.sun;
    g.fillStyle = '#979590'; g.fillRect(0, 0, w, h);
    // Полированный бетон: пятна чуть светлее и темнее.
    const u = A.rng(9); for (let i = 0; i < 70; i++) blob(g, u() * w, u() * h, (1 + u() * 3) * s, (1 + u() * 3) * s, u() > .5 ? '255,255,255' : '90,86,78', .05);
    for (const k of 'tblr') band(g, w, h, k, 1.2 * s, 'rgba(70,66,58,.16)');
    // Швы плит.
    g.fillStyle = 'rgba(80,76,68,.09)';
    for (let x = 3; x < 18; x += 3) g.fillRect(X(x) - 1, 0, 2, h);
    for (let z = r.z0 + 3.25; z < r.z1; z += 3.25) g.fillRect(0, Z(z) - 1, w, 2);
    // Солнце из фонаря: пятно со сдвигом и тени переплёта и ферм.
    const sx = q.x0 + sun.dx, sz = q.z0 + sun.dz, sw = q.x1 - q.x0, sd = q.z1 - q.z0;
    soft(g, .8 * s, 'rgba(255,251,238,.34)', () => g.fillRect(X(sx), Z(sz), sw * s, sd * s));
    g.fillStyle = 'rgba(150,144,132,.13)';
    for (let x = 0; x <= sw + .01; x += 1.5) g.fillRect(X(sx + x) - .035 * s, Z(sz), .07 * s, sd * s);
    for (let z = 0; z <= sd + .01; z += 1.5) g.fillRect(X(sx), Z(sz + z) - .035 * s, sw * s, .07 * s);
    g.fillStyle = 'rgba(140,134,122,.14)';
    for (let k = 1; k < 8; k++) { const z = r.z0 + 3.25 * k + sun.dz * .9; if (z > sz && z < sz + sd) g.fillRect(X(sx), Z(z) - .14 * s, sw * s, .28 * s); }
    // Под перекрытиями и лестницей тень, под светильниками тёплые пятна.
    const dark = (x0, x1, z0, z1) => soft(g, .55 * s, 'rgba(60,56,50,.3)', () => g.fillRect(X(x0), Z(z0), (x1 - x0) * s, (z1 - z0) * s));
    for (const [x0, x1, z0, z1] of HUB.slabs) dark(x0, x1, z0, z1);
    dark(0, 2.6, ST.zTop, ST.zBot);
    for (const [x, z] of LAMPS) blob(g, X(x), Z(z), 1.3 * s, 1.3 * s, '255,246,224', .3);
    // Мятные отсветы: полосы на стенах, стойки, кромки мостиков.
    for (const u of HUB.bars.N) blob(g, X(u), Z(r.z0 + .2), .5 * s, 1.8 * s, '95,245,210', .4);
    for (const u of HUB.bars.E) blob(g, X(r.x1 - .2), Z(r.z0 + u), 1.8 * s, .5 * s, '95,245,210', .4);
    for (const u of HUB.bars.S) blob(g, X(r.x1 - u), Z(r.z1 - .2), .5 * s, 1.8 * s, '95,245,210', .4);
    for (const [x, k] of HUB.racks) blob(g, X(x), Z(k === 'N' ? r.z0 + 1 : r.z1 - 1), .7 * s, .9 * s, '95,245,210', .35);
    soft(g, 1.2 * s, mint(.16), () => { g.fillRect(X(15), Z(-9.2), .5 * s, 23 * s); g.fillRect(X(2.8), Z(-10), 12.2 * s, .5 * s); });
    blob(g, X(2.4), Z(1), .9 * s, 4.8 * s, '95,245,210', .16);
    dither(g, w, h, .02, 5);
  };
  H.ceil.hub = (r, g, w, h, s) => {
    const X = FX(r, s), Z = CZ(r, s), q = r.light;
    g.fillStyle = '#9fa2a6'; g.fillRect(0, 0, w, h);
    // Профнастил кровли и светлая кайма вокруг фонаря.
    g.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 0; x < 18; x += .3) g.fillRect(X(x), 0, Math.max(1, .1 * s), h);
    g.save(); g.shadowColor = 'rgba(255,255,255,1)'; g.shadowBlur = 1.6 * s; g.fillStyle = '#fff'; g.fillRect(X(q.x0), Z(q.z1), (q.x1 - q.x0) * s, (q.z1 - q.z0) * s); g.fillRect(X(q.x0), Z(q.z1), (q.x1 - q.x0) * s, (q.z1 - q.z0) * s); g.restore();
    for (const k of 'tblr') band(g, w, h, k, 2 * s, 'rgba(40,40,44,.22)');
    dither(g, w, h, .016, 6);
  };

  // Фермы под крышей и переплёт фонаря: брусья одного вида, одна отрисовка на грань.
  function steel(r) {
    const { T } = A, list = [], q = HUB.truss, bar = (p, e, t) => list.push([p, e, t]);
    for (let k = 1; k < 8; k++) {
      const z = r.z0 + 3.25 * k;
      bar([0, q.y0, z], [18, q.y0, z], .16); bar([0, q.y1, z], [18, q.y1, z], .16);
      for (let i = 0; i <= 12; i++) bar([i * 1.5, q.y0, z], [i * 1.5, q.y1, z], .07);
      for (let i = 0; i < 12; i++) { const a = i * 1.5, up = i < 6; bar([a, up ? q.y0 : q.y1, z], [a + 1.5, up ? q.y1 : q.y0, z], .06); }
    }
    for (const x of [1.5, 16.5]) bar([x, q.y1 + .14, r.z0], [x, q.y1 + .14, r.z1], .12);
    const l = r.light, y = r.h + .06;
    for (let x = l.x0; x <= l.x1 + .01; x += 1.5) bar([x, y, l.z0], [x, y, l.z1], .1);
    for (let z = l.z0; z <= l.z1 + .01; z += 1.5) bar([l.x0, y, z], [l.x1, y, z], .1);
    const side = A.flat('#a2a6ab'), lit = A.flat('#d0d2d5'), dim = A.flat('#777b81');
    const m = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), [side, side, lit, dim, side, side], list.length), o = new T.Object3D(), X1 = new T.Vector3(1, 0, 0);
    list.forEach(([p, e, t], i) => {
      const a = new T.Vector3(...p), b = new T.Vector3(...e), d = b.clone().sub(a), L = d.length();
      o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(X1, d.normalize()); o.scale.set(L + t, t, t); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    r.group.add(m);
    // Небо над фонарём и белые стенки шахты.
    const W = l.x1 - l.x0, D = l.z1 - l.z0, cx = (l.x0 + l.x1) / 2, cz = (l.z0 + l.z1) / 2;
    const sky = A.textPanel(512, 1024, (g, w, h) => {
      const v = g.createLinearGradient(0, 0, w, h); v.addColorStop(0, '#5b9de6'); v.addColorStop(.55, '#8dc0f2'); v.addColorStop(1, '#b9d9f7'); g.fillStyle = v; g.fillRect(0, 0, w, h);
      const u = A.rng(12); for (let i = 0; i < 26; i++) { const x = u() * w, yy = u() * h; for (let j = 0; j < 5; j++) blob(g, x + (u() - .5) * 90, yy + (u() - .5) * 40, 40 + u() * 60, 24 + u() * 30, '255,255,255', .5); }
    });
    const top = new T.Mesh(new T.PlaneGeometry(W, D), A.basic(sky, { release: true })); top.rotation.x = Math.PI / 2; top.position.set(cx, r.h + l.d, cz); r.group.add(top);
    const shaft = A.basic(A.gradient('#fbfcfd', '#eef1f5', '#dfe3ea'), { side: T.DoubleSide });
    const sh = (w2, x, z, ry) => { const s2 = new T.Mesh(new T.PlaneGeometry(w2, l.d), shaft); s2.position.set(x, r.h + l.d / 2, z); s2.rotation.y = ry; r.group.add(s2); };
    sh(W, cx, l.z0, 0); sh(W, cx, l.z1, 0); sh(D, l.x0, cz, Math.PI / 2); sh(D, l.x1, cz, Math.PI / 2);
  }

  // Игровой угол под мостом у северной стены: пять автоматов, у каждого свой корпус в общем языке зала
  // (светлый металл, светящиеся линии). Концепты в concepts/arcade/cabs: змейка 1, пинбол 2, файрвол 3, антивирус 2, загрузка 3.
  // Корпуса собраны из коробок в общей геометрии зала. Картинки лежат двумя атласами: экраны (живые заставки) и арт (таблички, бока),
  // поэтому пять автоматов стоят четыре отрисовки. Над ними бегущая строка с рекордами из таблиц лидеров.
  const ARC = {
    z0: -12,
    // id, подпись, цвет подсветки, середина по x, ширина, глубина.
    games: [['snake', 'Змейка', '#b6f03a', 4.8, 1, .62], ['pinball', 'Пинбол', '#ff4fd8', 6.9, .85, 1.05], ['firewall', 'Кирпичи', '#ff7a2a', 9, 1, .85],
      ['antivirus', 'Сапёр', '#4fe0ff', 11.1, .95, .8], ['loading', 'Блоки', '#5fb8ff', 13.2, .8, .7]]
  };
  R0.block.push(...ARC.games.map(([, , , x, w, d]) => [x - w / 2, x + w / 2, ARC.z0, ARC.z0 + d + .2]));
  // Как показывать рекорд: у сапёра время в секундах, у остальных очки.
  const scoreText = (id, v) => (id === 'antivirus' ? `${v} с` : String(v));
  // Простая упаковка прямоугольников в атлас полками: возвращает u0, v0, u1, v1 для каждого.
  function pack(list, W, Hh) {
    let x = 0, y = 0, row = 0;
    for (const q of list) {
      if (x + q.w > W) { x = 0; y += row; row = 0; }
      Object.assign(q, { x, y, u0: x / W, u1: (x + q.w) / W, v0: 1 - (y + q.h) / Hh, v1: 1 - y / Hh });
      x += q.w; row = Math.max(row, q.h);
    }
  }
  function arcadeCorner(r, S, st, ha, racks, glass) {
    const { T } = A, metal = { s: '#cfd1d3', t: '#eceeef', pz: '#e3e5e6', b: null, nz: null }, white = { s: '#e2e4e6', t: '#f6f7f8', pz: '#f1f2f3', b: null, nz: null };
    const scr = Tiles(), dec = Tiles();
    // Экраны: прямоугольники в атласе 2048 × 512, каждый своего размера под свой экран. col: колонна с падающими блоками у «Загрузки».
    const SCR = { snake: { w: 240, h: 256 }, pinball: { w: 216, h: 256 }, firewall: { w: 344, h: 256 }, antivirus: { w: 326, h: 256 }, loading: { w: 232, h: 512 }, col: { w: 64, h: 512 } };
    pack(Object.values(SCR), 2048, 512);
    // Арт: таблички, бока, дверцы. Рисуется, когда загрузятся картинки автоматов (skins.js).
    const ART = {
      snakeHead: { w: 200, h: 200, img: 'snake_head' }, snakeSide: { w: 360, h: 480, img: 'snake_side' },
      pinBack: { w: 360, h: 340, img: 'pin_head' }, pinSide: { w: 256, h: 256, img: 'pin_head' },
      fwMq: { w: 512, h: 164, img: 'fw_mq' }, fwHex: { w: 240, h: 640, draw: hexSide },
      avMq: { w: 512, h: 164, img: 'av_mq' }, avSide: { w: 360, h: 480, img: 'av_side' },
      ldMq: { w: 512, h: 164, img: 'ld_mq' }, ldDoor: { w: 300, h: 350, img: 'ld_side' }
    };
    pack(Object.values(ART), 2048, 1024);
    const sq = (m, k, a, b, c, d) => m.quad(a, b, c, d, k.u0, k.v0, k.u1, k.v1);
    // Плоскость лицом к посетителю (+z) от x0 до x1 и от y0 до y1.
    const front = (m, k, x0, x1, y0, y1, z) => sq(m, k, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
    // Рисунок на обоих боках: от z0 до z1 и от y0 до y1.
    const sides = (k, xa, xb, y0, y1, z0, z1) => {
      sq(dec, k, [xa - .003, y0, z0], [xa - .003, y0, z1], [xa - .003, y1, z1], [xa - .003, y1, z0]);
      sq(dec, k, [xb + .003, y0, z1], [xb + .003, y0, z0], [xb + .003, y1, z0], [xb + .003, y1, z1]);
    };
    // Светящиеся рёбра цвета игры: тонкая яркая полоса и ореол.
    const glowV = (x, y0, y1, z, col) => { S.box(x - .012, x + .012, y0, y1, z - .012, z + .012, { s: col }); ha.line([x, y0, z + .02], [x, y1, z + .02], [1, 0, 0], .2, col); };
    const glowH = (x0, x1, y, z, col) => { S.box(x0, x1, y - .012, y + .012, z - .012, z + .012, { s: col }); ha.line([x0, y, z + .02], [x1, y, z + .02], [0, 1, 0], .2, col); };

    for (const [id, label, col, x, W, D] of ARC.games) {
      const x0 = x - W / 2, x1 = x + W / 2, zb = ARC.z0, zf = zb + D;
      if (id === 'snake') {
        // Змейка: огромная карманная консоль. Округлый светлый корпус, большой оливковый экран, крестовина и две кнопки.
        S.box(x0 + .03, x1 - .03, 0, .08, zb, zf - .03, { s: '#9a9c9f' });
        S.box(x0, x1, .08, 2.1, zb, zf, { ...metal, pz: '#e9eaeb' });
        S.box(x0 + .07, x1 - .07, 2.1, 2.17, zb, zf - .05, metal);
        S.box(x0 + .1, x1 - .1, 1, 1.86, zf, zf + .03, { s: '#2a2c30' });
        front(scr, SCR.snake, x0 + .15, x1 - .15, 1.05, 1.81, zf + .032);
        S.box(x - .33, x - .11, .66, .72, zf, zf + .04, { s: '#2b2d31' }); S.box(x - .25, x - .19, .58, .8, zf, zf + .04, { s: '#2b2d31' });
        S.box(x + .08, x + .18, .6, .7, zf, zf + .04, { s: '#8bac0f', t: '#a8c83a' }); S.box(x + .24, x + .34, .68, .78, zf, zf + .04, { s: '#8bac0f', t: '#a8c83a' });
        for (const y of [.26, .31, .36]) S.box(x + .22, x + .38, y, y + .02, zf, zf + .006, { s: '#7c7e82' });
        front(dec, ART.snakeHead, x - .11, x + .11, 1.88, 2.08, zf + .003);
        sides(ART.snakeSide, x0, x1, .45, 1.15, zb + .06, zb + .58);
        glowH(x0 + .03, x1 - .03, .09, zf - .02, '#7af7d6');
        for (const ex of [x0 + .015, x1 - .015]) glowV(ex, .1, 2.08, zf, '#7af7d6');
      } else if (id === 'pinball') {
        // Пинбол: стоячий корпус на ножках, наклонное поле под стеклом, задняя панель с маскотом.
        for (const lx of [x0 + .04, x1 - .04]) for (const lz of [zb + .05, zf - .05]) S.box(lx - .03, lx + .03, 0, .25, lz - .03, lz + .03, { s: '#b8babd' });
        S.box(x0, x1, .25, .95, zb + .25, zf, metal);
        S.box(x - .17, x + .17, .42, .8, zf, zf + .02, { s: '#26282c' });
        S.box(x - .09, x - .02, .66, .73, zf + .02, zf + .03, { s: '#7af7d6' }); S.box(x + .02, x + .09, .66, .73, zf + .02, zf + .03, { s: '#7af7d6' });
        // Поле от передней кромки вниз к задней панели вверх.
        const fy0 = .99, fy1 = 1.44, fz0 = zf - .03, fz1 = zb + .3;
        sq(scr, SCR.pinball, [x0 + .07, fy0, fz0], [x1 - .07, fy0, fz0], [x1 - .07, fy1, fz1], [x0 + .07, fy1, fz1]);
        glass.quad([x0 + .05, fy0 + .05, fz0], [x1 - .05, fy0 + .05, fz0], [x1 - .05, fy1 + .05, fz1], [x0 + .05, fy1 + .05, fz1]);
        // Бортики поля с хромом сверху и розовой линией.
        for (const xa of [x0, x1]) {
          const w4 = [[xa, .95, zf], [xa, .95, fz1], [xa, fy1 + .08, fz1], [xa, fy0 + .08, zf]];
          S.quad(...w4, '#c9cbce'); S.quad(w4[3], w4[2], w4[1], w4[0], '#c9cbce');
          S.quad([xa - .02, fy0 + .08, zf], [xa + .02, fy0 + .08, zf], [xa + .02, fy1 + .08, fz1], [xa - .02, fy1 + .08, fz1], col);
          ha.line([xa, fy0 + .09, zf], [xa, fy1 + .09, fz1], [0, 1, 0], .2, col);
        }
        S.box(x0, x1, .95, fy0 + .08, zf - .04, zf, metal);
        S.box(x0, x1, 1.36, 2.22, zb, zb + .3, metal);
        front(dec, ART.pinBack, x0 + .06, x1 - .06, 1.48, 2.14, zb + .303);
        glowH(x0 + .06, x1 - .06, 1.46, zb + .31, col); glowH(x0 + .06, x1 - .06, 2.16, zb + .31, col);
        sides(ART.pinSide, x0, x1, .4, .86, zb + .5, zf - .1);
      } else if (id === 'firewall' || id === 'antivirus') {
        // Общий силуэт классического автомата для файрвола и антивируса: низ, панель управления, ниша экрана, табличка.
        const m = id === 'antivirus' ? white : metal;
        S.box(x0, x1, 0, 1, zb, zf - .04, m);
        S.box(x0, x1, 1, 1.08, zb, zf + .18, { ...m, t: '#2a2c31', pz: '#b3b5b8' });
        S.box(x0, x1, 1.08, 1.9, zb, zf - .08, { ...m, pz: '#1a1c20' });
        S.box(x0, x1, 1.9, 2.25, zb, zf + .02, { ...m, b: '#9fa1a4' });
        S.box(x - .23, x - .21, 1.08, 1.18, zf + .04, zf + .06, { s: '#1c1d21' });
        S.box(x - .255, x - .185, 1.17, 1.24, zf + .015, zf + .085, { s: col });
        for (const bx of [x + .06, x + .22]) S.box(bx - .035, bx + .035, 1.08, 1.105, zf + .015, zf + .085, { s: col });
        front(scr, SCR[id], x0 + .08, x1 - .08, 1.16, 1.82, zf - .077);
        if (id === 'firewall') {
          // Файрвол: бронированный корпус, на боках соты щита с оранжевым светом, внизу тёмная дверца в мятной рамке.
          front(dec, ART.fwMq, x0 + .03, x1 - .03, 1.925, 2.225, zf + .023);
          sides(ART.fwHex, x0, x1, .05, 2.2, zb + .04, zf - .06);
          S.box(x - .26, x + .26, .14, .86, zf - .04, zf - .02, { s: '#202227' });
          glowH(x - .27, x + .27, .87, zf - .02, '#7af7d6'); glowH(x - .27, x + .27, .13, zf - .02, '#7af7d6');
          glowV(x - .27, .13, .87, zf - .02, '#7af7d6'); glowV(x + .27, .13, .87, zf - .02, '#7af7d6');
          for (const ex of [x0 + .015, x1 - .015]) { glowV(ex, .03, .98, zf - .04, col); glowV(ex, 1.1, 1.88, zf - .08, col); }
        } else {
          // Антивирус: белый «лабораторный» корпус, экран в карантинном стеклянном коробе, голубой крест на дверце.
          front(dec, ART.avMq, x0 + .03, x1 - .03, 1.925, 2.225, zf + .023);
          sides(ART.avSide, x0, x1, .2, .9, zb + .08, zf - .12);
          const gz = zf + .14, gx0 = x0 + .05, gx1 = x1 - .05, gy0 = 1.12, gy1 = 1.88;
          glass.quad([gx0, gy0, gz], [gx1, gy0, gz], [gx1, gy1, gz], [gx0, gy1, gz]);
          glass.quad([gx0, gy0, zf - .08], [gx0, gy0, gz], [gx0, gy1, gz], [gx0, gy1, zf - .08]);
          glass.quad([gx1, gy0, gz], [gx1, gy0, zf - .08], [gx1, gy1, zf - .08], [gx1, gy1, gz]);
          glowV(gx0, gy0, gy1, gz, col); glowV(gx1, gy0, gy1, gz, col); glowH(gx0, gx1, gy1, gz, col);
          S.box(x - .04, x + .04, .28, .66, zf - .04, zf - .02, { s: col }); S.box(x - .17, x + .17, .43, .51, zf - .04, zf - .02, { s: col });
          ha.line([x, .28, zf], [x, .66, zf], [1, 0, 0], .35, col); ha.line([x - .17, .47, zf], [x + .17, .47, zf], [0, 1, 0], .35, col);
          for (const ex of [x0 + .015, x1 - .015]) glowV(ex, .03, .98, zf - .04, '#7af7d6');
        }
      } else {
        // Загрузка: высокая узкая башня, рядом с экраном стеклянная колонна, в которой падают блоки.
        S.box(x0, x1, 0, .9, zb, zf, metal);
        S.box(x0, x1, .9, .98, zb, zf + .15, { ...metal, t: '#2a2c31', pz: '#b3b5b8' });
        S.box(x0, x1, .98, 2.3, zb, zf - .06, { ...metal, pz: '#1a1c20' });
        S.box(x0, x1, 2.3, 2.56, zb, zf + .02, { ...metal, b: '#9fa1a4' });
        S.box(x - .27, x - .25, .98, 1.08, zf + .03, zf + .05, { s: '#1c1d21' });
        S.box(x - .295, x - .225, 1.07, 1.14, zf + .005, zf + .075, { s: col });
        for (const bx of [x - .05, x + .08]) S.box(bx - .03, bx + .03, .98, 1.0, zf + .01, zf + .07, { s: '#7af7d6' });
        front(scr, SCR.loading, x0 + .06, x1 - .25, 1.05, 2.2, zf - .057);
        front(scr, SCR.col, x1 - .21, x1 - .05, 1, 2.28, zf - .057);
        glass.quad([x1 - .22, 1, zf - .02], [x1 - .04, 1, zf - .02], [x1 - .04, 2.28, zf - .02], [x1 - .22, 2.28, zf - .02]);
        front(dec, ART.ldMq, x0 + .03, x1 - .03, 2.32, 2.54, zf + .023);
        front(dec, ART.ldDoor, x0 + .08, x1 - .08, .1, .82, zf + .003);
        for (const ex of [x0 + .015, x1 - .015]) { glowV(ex, .03, .88, zf, col); glowV(ex, 1, 2.28, zf - .06, col); }
        glowV(x1 - .22, 1, 2.28, zf - .02, '#7af7d6');
      }
      const top = id === 'loading' ? 2.56 : 2.25;
      A.thing(r, { id, label, noSpark: true, cap: true, verb: 'играть', mesh: A.hit(r, W, top, D + .3, x, top / 2, zb + D / 2), spot: { x, z: zf + .95 }, at: new T.Vector3(x, 1.6, zf) });
    }
    // Атлас экранов, обновляется в arcadeTick.
    const sc = A.cv(2048, 512), sg = sc.getContext('2d'), stex = A.tex(sc, { aniso: 4 });
    sg.fillStyle = '#0b0c10'; sg.fillRect(0, 0, 2048, 512);
    r.group.add(scr.mesh(new T.MeshBasicMaterial({ map: stex })));
    // Атлас арта: сначала цвет игры, потом картинки, когда загрузятся.
    const ac = A.cv(2048, 1024), ag = ac.getContext('2d'), atex = A.tex(ac, { aniso: 4 });
    const cover = (im, q) => { const k = Math.max(q.w / im.width, q.h / im.height); ag.save(); ag.beginPath(); ag.rect(q.x, q.y, q.w, q.h); ag.clip(); ag.drawImage(im, q.x + (q.w - im.width * k) / 2, q.y + (q.h - im.height * k) / 2, im.width * k, im.height * k); ag.restore(); };
    for (const q of Object.values(ART)) { ag.fillStyle = '#d6d8da'; ag.fillRect(q.x, q.y, q.w, q.h); if (q.draw) q.draw(ag, q); }
    Arcade.ready(() => {
      for (const q of Object.values(ART)) if (q.img && Arcade.art[q.img]) cover(Arcade.art[q.img], q);
      // На боку файрвола поверх сот маскот.
      if (Arcade.art.fw_side) { const q = ART.fwHex, s2 = { x: q.x + 20, y: q.y + 250, w: q.w - 40, h: 260 }; cover(Arcade.art.fw_side, s2); ag.strokeStyle = '#ff7a2a'; ag.lineWidth = 4; ag.strokeRect(s2.x, s2.y, s2.w, s2.h); }
      atex.needsUpdate = true;
    });
    r.group.add(dec.mesh(new T.MeshBasicMaterial({ map: atex })));
    // Бегущая строка рекордов под кромкой моста над автоматами.
    const LW = 4096, LH = 64, lc = A.cv(LW, LH), lg = lc.getContext('2d'), ltex = A.tex(lc, { aniso: 4 });
    ltex.wrapS = T.RepeatWrapping;
    const lx0 = 4.2, lx1 = 13.8, ly = HUB.Y - HUB.slab - .5, lz = -9.6 + .01;
    const strip = new T.Mesh(new T.PlaneGeometry(lx1 - lx0, .36), new T.MeshBasicMaterial({ map: ltex }));
    strip.position.set((lx0 + lx1) / 2, ly, lz); r.group.add(strip);
    S.box(lx0 - .04, lx1 + .04, ly - .22, ly + .22, lz - .1, lz - .005, { s: '#1b1d22', t: null });
    for (const sx of [lx0 + .3, lx1 - .3]) S.box(sx - .01, sx + .01, ly + .22, HUB.Y - HUB.slab, lz - .06, lz - .04, { s: '#55595f' });
    ha.line([lx0, ly - .2, lz + .01], [lx1, ly - .2, lz + .01], [0, 1, 0], .3);
    const paintStrip = list => {
      lg.fillStyle = '#07120f'; lg.fillRect(0, 0, LW, LH);
      lg.font = `500 30px ${A.MONO}`; lg.textBaseline = 'middle';
      let px = 24;
      const put = (s, c) => { lg.fillStyle = c; lg.shadowColor = c; lg.shadowBlur = 8; lg.fillText(s, px, LH / 2 + 2); px += lg.measureText(s).width; };
      put('РЕКОРДЫ   ', '#7af7d6');
      list.forEach(([label, who, c]) => { put(label + ' ', c); put(who + '      ', '#e9fff8'); });
      lg.shadowBlur = 0;
      lg.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < LW; i += 4) lg.fillRect(i, 0, 1, LH); for (let j = 0; j < LH; j += 4) lg.fillRect(0, j, LW, 1);
      ltex.repeat.x = Math.min(1, (lx1 - lx0) / .36 * LH / LW);
      ltex.needsUpdate = true;
    };
    const loadScores = async () => {
      const C = window.NETIZEN_CONFIG || {}, mine = Save.arcade || {};
      const rows = await Promise.all(ARC.games.map(async ([id, label, c]) => {
        if (C.api && window.Net) {
          try { const d = await Net.api('/scores?game=' + id), t = d.top && d.top[0]; return [label, t ? `${t.name} ${scoreText(id, t.value)}` : 'пока никто не играл', c]; } catch (e) { /* сеть пропала */ }
        }
        return [label, mine[id] ? `твой рекорд ${scoreText(id, mine[id])}` : 'пока никто не играл', c];
      }));
      paintStrip(rows);
    };
    paintStrip(ARC.games.map(([, label, c]) => [label, '…', c]));
    loadScores();
    r.arcadeHub = { sg, stex, SCR, ltex, loadScores, at: 0, scoresAt: performance.now() };
  }
  // Соты щита на боку файрвола: серый металл, часть ячеек светится оранжевым.
  function hexSide(g, q) {
    g.save(); g.beginPath(); g.rect(q.x, q.y, q.w, q.h); g.clip();
    g.fillStyle = '#c8cacd'; g.fillRect(q.x, q.y, q.w, q.h);
    const R = 30, u = A.rng(17);
    for (let row = -1; row * R * 1.5 < q.h + R; row++) for (let i = -1; i * R * 1.74 < q.w + R; i++) {
      const cx = q.x + i * R * 1.74 + (row % 2 ? R * .87 : 0), cy = q.y + row * R * 1.5, hot = u() < .45;
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * (R - 3), cy + Math.sin(a) * (R - 3)); } g.closePath();
      if (hot) { const l = g.createRadialGradient(cx, cy, 2, cx, cy, R); l.addColorStop(0, '#ffd27a'); l.addColorStop(.5, '#ff7a2a'); l.addColorStop(1, '#a4300c'); g.fillStyle = l; } else g.fillStyle = '#2a2b30';
      g.fill(); g.strokeStyle = '#e4e6e8'; g.lineWidth = 3; g.stroke();
    }
    g.restore();
  }
  // Заставки на экранах, падающие блоки в колонне «Загрузки», прокрутка строки. На телефоне экраны оживают, только когда посетитель рядом.
  function arcadeTick(r, dt, t, P) {
    const a = r.arcadeHub;
    if (!a) return;
    a.ltex.offset.x = (t * .035) % 1;
    if (performance.now() - a.scoresAt > 60000) { a.scoresAt = performance.now(); a.loadScores(); }
    a.at += dt;
    if (a.at < .1 || (A.LOW && (P.z > -4 || P.h > 1))) return;
    a.at = 0;
    const g = a.sg;
    for (const [id, q] of Object.entries(a.SCR)) {
      g.save(); g.translate(q.x, q.y); g.beginPath(); g.rect(0, 0, q.w, q.h); g.clip();
      if (id === 'col') {
        g.fillStyle = '#0d1a33'; g.fillRect(0, 0, q.w, q.h);
        const C = ['#ff4fd8', '#ffd23f', '#3dff7a', '#5fb8ff', '#ff7a2a'];
        for (let k = 0; k < 9; k++) { const y = ((t * 60 + k * 61) % (q.h + 40)) - 40; g.fillStyle = C[k % 5]; g.shadowColor = C[k % 5]; g.shadowBlur = 10; g.fillRect(10 + (k * 17) % 30, y, 24, 24); }
        g.shadowBlur = 0;
      } else if (id === 'pinball') {
        if (Arcade.art.pin_field) g.drawImage(Arcade.art.pin_field, 0, 0, q.w, q.h); else { g.fillStyle = '#2a0b3d'; g.fillRect(0, 0, q.w, q.h); }
        const bx = q.w / 2 + Math.sin(t * 2.3) * q.w * .3, by = q.h * .55 + Math.cos(t * 1.7) * q.h * .3;
        g.fillStyle = '#f4f4f8'; g.shadowColor = '#fff'; g.shadowBlur = 10; g.beginPath(); g.arc(bx, by, 9, 0, TAU); g.fill(); g.shadowBlur = 0;
      } else Arcade.screen(g, q.w, q.h, t, id);
      g.restore();
    }
    a.stex.needsUpdate = true;
  }

  H.props.n = r => {
    const { T, flat } = A, S = Solid(), st = Strips(), ha = Halo(), glass = Tiles(), Y = HUB.Y, sl = HUB.slab;
    // Перекрытия второго уровня и колонны под ними.
    const slab = { t: '#cdcbc6', s: '#b3b1ac', pz: '#bdbbb6', b: '#8e8f8c' };
    for (const [x0, x1, z0, z1] of HUB.slabs) S.box(x0, x1, Y - sl, Y, z0, z1, slab);
    for (const [x, z] of HUB.cols) S.box(x - .15, x + .15, 0, Y - sl, z - .15, z + .15, { s: '#bcbab5', pz: '#c6c4bf', nz: '#aaa8a3', t: null, b: null });
    // Светильники под перекрытиями.
    for (const [x, z] of LAMPS) S.quad([x - .22, Y - sl - .004, z - .22], [x + .22, Y - sl - .004, z - .22], [x + .22, Y - sl - .004, z + .22], [x - .22, Y - sl - .004, z + .22], '#fffaf0');
    // Лестница: проступь, подступёнок и боковина каждой ступени, внизу на юге, наверху на севере.
    const run = (ST.zBot - ST.zTop) / ST.n, rise = Y / ST.n;
    for (let i = 0; i < ST.n; i++) {
      const za = ST.zBot - i * run, zb = za - run, ya = i * rise, yb = ya + rise;
      S.quad([ST.x0, yb, za], [ST.x1, yb, za], [ST.x1, yb, zb], [ST.x0, yb, zb], i % 2 ? '#dcdad5' : '#d7d5d0');
      S.quad([ST.x0, ya, za], [ST.x1, ya, za], [ST.x1, yb, za], [ST.x0, yb, za], '#b5b3ae');
      S.quad([ST.x1, 0, za], [ST.x1, 0, zb], [ST.x1, yb, zb], [ST.x1, yb, za], '#c6c4bf');
    }
    S.quad([ST.x1, 0, ST.zTop], [ST.x0, 0, ST.zTop], [ST.x0, Y - sl, ST.zTop], [ST.x1, Y - sl, ST.zTop], '#a5a39e');
    // Мятная полоса по боковине лестницы, параллельно ступеням.
    const zLow = ST.zBot - .35 / Y * (ST.zBot - ST.zTop);
    st.line([ST.x1 + .006, .05, zLow], [ST.x1 + .006, Y - .3, ST.zTop], [0, 1, 0], .05);
    ha.line([ST.x1 + .01, .075, zLow], [ST.x1 + .01, Y - .275, ST.zTop], [0, 1, 0], .5);
    // Перила лестницы: стойки, стекло и светящийся поручень.
    const rx = ST.x1 - .05;
    for (let z = ST.zBot - .3; z > ST.zTop + .2; z -= 1.45) { const y0 = stairY(z); S.box(rx - .025, rx + .025, y0, y0 + 1.02, z - .025, z + .025, { s: '#9ca0a5', t: '#c8cbcf' }); }
    const g0 = stairY(ST.zBot - .3);
    glass.quad([rx, g0 + .08, ST.zBot - .3], [rx, Y + .08, ST.zTop], [rx, Y + .98, ST.zTop], [rx, g0 + .98, ST.zBot - .3]);
    st.line([rx - .02, g0 + 1.04, ST.zBot - .3], [rx - .02, Y + 1.04, ST.zTop], [1, 0, 0], .04);
    ha.line([rx, g0 + 1.05, ST.zBot - .3], [rx, Y + 1.05, ST.zTop], [0, 1, 0], .42);
    // Перила наверху: стойки, нижний бортик, стекло, поручень. По кромке перекрытия мятная полоса.
    for (const [[ax, az], [bx, bz], [ox, oz]] of HUB.rails) {
      const len = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / len, dz = (bz - az) / len, ex = ax + ox * -.06, ez = az + oz * -.06, fx = bx + ox * -.06, fz = bz + oz * -.06;
      for (let d = 0; d <= len + .01; d += len / Math.max(1, Math.round(len / 1.5))) { const x = ex + dx * d, z = ez + dz * d; S.box(x - .025, x + .025, Y, Y + 1.05, z - .025, z + .025, { s: '#9ca0a5', t: '#c8cbcf', b: null }); }
      glass.quad([ex, Y + .1, ez], [fx, Y + .1, fz], [fx, Y + 1, fz], [ex, Y + 1, ez]);
      const side = [Math.abs(dz), 0, Math.abs(dx)];
      st.line([ex - side[0] * .02, Y + 1.06, ez - side[2] * .02], [fx - side[0] * .02, Y + 1.06, fz - side[2] * .02], side, .04);
      ha.line([ex, Y + 1.06, ez], [fx, Y + 1.06, fz], [0, 1, 0], .4);
      const kx = ax + ox * .008, kz = az + oz * .008, lx = bx + ox * .008, lz = bz + oz * .008;
      st.line([kx, Y - .2, kz], [lx, Y - .2, lz], [0, 1, 0], .05);
      ha.line([kx + ox * .01, Y - .175, kz + oz * .01], [lx + ox * .01, Y - .175, lz + oz * .01], [0, 1, 0], .55);
    }
    // Вертикальные мятные полосы на стенах первого уровня.
    for (const [k, list] of Object.entries(HUB.bars)) for (const u of list) {
      const wall = r.walls[k], a = wall.at(u, .15, .008), b = wall.at(u, 4, .008), n = wall.uDir.toArray();
      st.line(a.clone().addScaledVector(wall.uDir, -.03).toArray(), b.clone().addScaledVector(wall.uDir, -.03).toArray(), n, .06);
      ha.line(a.toArray(), b.toArray(), n, .55);
    }
    // Серверные стойки: корпус, лицевая панель с картинкой, мятные кромки.
    const racks = Tiles();
    for (const [x, k] of HUB.racks) {
      const n = k === 'N', z0 = n ? r.z0 : r.z1 - .8, z1 = n ? r.z0 + .8 : r.z1, zf = n ? z1 + .004 : z0 - .004;
      S.box(x - .5, x + .5, 0, 1.9, z0, z1, { s: '#b2b4b7', t: '#cdcfd1', pz: n ? null : '#c9cbce', nz: n ? '#c9cbce' : null, b: null });
      if (n) racks.quad([x - .5, 0, zf], [x + .5, 0, zf], [x + .5, 1.9, zf], [x - .5, 1.9, zf]);
      else racks.quad([x + .5, 0, zf], [x - .5, 0, zf], [x - .5, 1.9, zf], [x + .5, 1.9, zf]);
      for (const ex of [x - .42, x + .42]) ha.line([ex, .1, zf + (n ? .01 : -.01)], [ex, 1.8, zf + (n ? .01 : -.01)], [1, 0, 0], .22);
    }
    arcadeCorner(r, S, st, ha, racks, glass);
    const rackTex = new T.Texture(); rackTex.colorSpace = T.SRGBColorSpace; rackTex.anisotropy = 4;
    const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { rackTex.image = im; rackTex.needsUpdate = true; }; im.src = Media.url(A.LOW ? 'hangar/rack_s.webp' : 'hangar/rack.webp');
    r.group.add(racks.mesh(new T.MeshBasicMaterial({ map: rackTex })));
    // Рама общей стены и мятная полоса под ней.
    const q = HUB.wall, fx0 = r.x1 - .1, fr = { s: '#2c2e33', t: '#3a3c42', b: '#202226', nx: '#26282d', px: null };
    S.box(fx0, r.x1, q.y1, q.y1 + .16, q.z0 - .16, q.z1 + .16, fr); S.box(fx0, r.x1, q.y0 - .16, q.y0, q.z0 - .16, q.z1 + .16, fr);
    S.box(fx0, r.x1, q.y0, q.y1, q.z0 - .16, q.z0, fr); S.box(fx0, r.x1, q.y0, q.y1, q.z1, q.z1 + .16, fr);
    st.line([fx0 - .004, q.y0 - .11, q.z0], [fx0 - .004, q.y0 - .11, q.z1], [0, 1, 0], .05);
    ha.line([fx0 - .01, q.y0 - .085, q.z0], [fx0 - .01, q.y0 - .085, q.z1], [0, 1, 0], .7);
    if (window.Pixels) Pixels.build(r, { x: r.x1 - .05, z0: q.z0, z1: q.z1, y0: q.y0, y1: q.y1, Y });

    const solid = S.mesh(); r.group.add(solid); r.pick.floors.push(solid);
    r.group.add(st.mesh(flat('#9dfbe2', { side: T.DoubleSide })));
    const halo = ha.mesh(MINT, .75); halo.renderOrder = 4; r.group.add(halo); r.halo = halo;
    const gl = glass.mesh(new T.MeshBasicMaterial({ color: '#dff3ee', transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide })); gl.renderOrder = 3; r.group.add(gl);
    steel(r);
    A.glowAt(r, '#30f0c8', .32, 8, HUB.ring.u, HUB.ring.v, r.z0 + .6);

    // Табличка у лестницы.
    const sign = A.textPanel(560, 200, (g, w, h) => {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h); g.fillStyle = MINT; g.fillRect(0, 0, 10, h);
      g.font = `700 54px ${A.SANS}`; g.fillStyle = '#f2f4f3'; g.fillText('↑ 2 этаж', 40, 78);
      g.font = `400 26px ${A.MONO}`; g.fillStyle = MINT; g.fillText('Наверху общая стена,', 40, 130); g.fillText('на ней рисует каждый', 40, 166);
    });
    const sm = new T.Mesh(new T.PlaneGeometry(1.26, .45), A.basic(sign, { release: true })); sm.rotation.y = Math.PI / 2; sm.position.set(ST.x1 + .012, 1.05, 1.6); r.group.add(sm);

    // Вентиляционная решётка в юго-западном углу: за ней игра в бэкрумс (backrooms.js).
    const grate = A.textPanel(256, 160, (g, w, h) => {
      g.fillStyle = '#8f8b84'; g.fillRect(0, 0, w, h); g.fillStyle = '#5d5a55'; g.fillRect(6, 6, w - 12, h - 12);
      for (let y = 16; y < h - 12; y += 14) { g.fillStyle = '#1c1b19'; g.fillRect(14, y, w - 28, 7); g.fillStyle = '#a5a19a'; g.fillRect(14, y + 7, w - 28, 2); }
      g.fillStyle = '#c9c4bb'; for (const [x, y] of [[12, 12], [w - 12, 12], [12, h - 12]]) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
    });
    const gm = new T.Mesh(new T.PlaneGeometry(.8, .5), A.basic(grate, { release: true })); gm.position.set(.75, .32, r.z1 - .012); gm.rotation.y = Math.PI; r.group.add(gm);
    // Без блёстки (это секрет), но подпись снизу появляется, когда подходишь.
    A.thing(r, { id: 'grate', label: 'Вентиляция', noSpark: true, cap: true, mesh: A.hit(r, 1, .8, .4, .75, .4, r.z1 - .2), spot: { x: 1.2, z: r.z1 - 1.4 }, at: new T.Vector3(.75, .5, r.z1 - .1) });
    // Ореолы чуть дышат.
    r.hubTick = (dt, t, P) => { arcadeTick(r, dt, t, P); halo.material.opacity = .7 + Math.sin(t * 1.3) * .07; };
  };

  // =================================================================================================
  // Сад камней
  // =================================================================================================

  const EDGE = 'rgba(255,255,255,.92)';
  H.bake.stone = (wall, g, w, h, s, X, Y) => {
    vgrad(g, w, h, [[0, '#94959a'], [.5, '#85868b'], [1, '#909196']]);
    for (const k of 'tblr') band(g, w, h, k, 1.25 * s, EDGE, 'rgba(255,255,255,.3)');
    blob(g, w / 2, h / 2, w * .5, h * .55, '40,42,48', .22);
    frames(g, wall, s, X, Y, 'rgba(20,22,28,.55)');
    doorGlow(g, wall, s, X, Y, 'rgba(255,255,255,.95)', .34, .07);
    dither(g, w, h, .022, wall.id.charCodeAt(1) * 3);
  };
  H.floor.stone = (r, g, w, h, s) => {
    const X = FX(r, s), Z = FZ(r, s);
    g.fillStyle = '#929398'; g.fillRect(0, 0, w, h);
    const u = A.rng(11);
    for (let i = 0; i < 26; i++) blob(g, u() * w, u() * h, (1 + u() * 2.4) * s, (1 + u() * 2) * s, u() > .5 ? '255,255,255' : '30,32,38', .035);
    for (const k of 'tblr') band(g, w, h, k, 1.9 * s, 'rgba(255,255,255,.85)', 'rgba(255,255,255,.26)');
    // Мягкая тень под каждым камнем.
    for (const [x, z, rx, rz, , rot] of STONES) soft(g, .16 * s, 'rgba(18,20,26,.7)', () => { g.beginPath(); g.ellipse(X(x), Z(z), rx * 1.04 * s, rz * 1.04 * s, rot, 0, TAU); g.fill(); });
    dither(g, w, h, .024, 12);
  };
  H.ceil.stone = (r, g, w, h, s) => {
    g.fillStyle = '#7d7e83'; g.fillRect(0, 0, w, h);
    for (const k of 'tblr') band(g, w, h, k, 1.7 * s, 'rgba(255,255,255,.88)', 'rgba(255,255,255,.28)');
    dither(g, w, h, .022, 13);
  };
  // Мрамор для камней: облачные пятна и прожилки.
  function marble() {
    return A.textPanel(256, 256, (g, w, h) => {
      const u = A.rng(77); g.fillStyle = '#b4b5b8'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) blob(g, u() * w, u() * h, 30 + u() * 90, 20 + u() * 70, u() > .5 ? '236,236,238' : '96,98,104', .1 + u() * .1);
      for (let i = 0; i < 34; i++) {
        let x = u() * w, y = u() * h, a = u() * TAU; g.strokeStyle = u() > .45 ? `rgba(70,72,80,${.16 + u() * .3})` : `rgba(245,245,246,${.2 + u() * .3})`; g.lineWidth = .6 + u() * 1.8;
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 40; k++) { a += (u() - .5) * .7; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); }
        g.stroke();
      }
      dither(g, w, h, .05, 78);
    });
  }
  // Камень: неровный многоугольник в плане, три пояса по высоте, грани с собственным тоном вместо света.
  function stoneInto(pos, uv, col, [cx, cz, rx, rz, ht, rot, tone, n], seed) {
    const u = A.rng(seed), ang = Array.from({ length: n }, (_, i) => i / n * TAU + (u() - .5) * .3), ring = (k, y, wob) => { const out = []; for (let i = 0; i < n; i++) { const a = ang[i], q = k * (.9 + u() * .16), lx = Math.cos(a) * rx * q, lz = Math.sin(a) * rz * q; out.push([cx + lx * Math.cos(rot) - lz * Math.sin(rot), y + (u() - .5) * wob, cz + lx * Math.sin(rot) + lz * Math.cos(rot)]); } return out; };
    const base = ring(.9, 0, 0), mid = ring(1, ht * .45, ht * .1), lip = ring(.97, ht * .86, ht * .05), top = ring(.88, ht, ht * .04), L = [.35, .88, .3], ll = Math.hypot(...L), base0 = tone ? .96 : .34;
    const tri = (a, b, c, side) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const lit = .42 + .58 * Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / ll);
      for (const p of [a, b, c]) {
        pos.push(...p);
        // Сверху текстура ложится по плану, на боках по периметру и высоте.
        if (side) uv.push((p[0] * .9 + p[2] * .9) * .5, p[1] * 1.6 + p[0] * .2); else uv.push(p[0] * .5, p[2] * .5);
        const ao = side ? .6 + .4 * Math.min(1, p[1] / ht) : 1, c0 = Math.min(1, base0 * lit * ao * 1.15);
        col.push(c0, c0, c0 * (tone ? 1.01 : 1.05));
      }
    };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      tri(base[i], mid[i], mid[j], 1); tri(base[i], mid[j], base[j], 1);
      tri(mid[i], lip[i], lip[j], 1); tri(mid[i], lip[j], mid[j], 1);
      tri(lip[i], top[i], top[j], 1); tri(lip[i], top[j], lip[j], 1);
    }
    const c = [cx, ht * 1.02, cz];
    for (let i = 0; i < n; i++) tri(c, top[(i + 1) % n], top[i], 0);
  }
  // Линии света по всем рёбрам зала. У двери нижняя линия прерывается.
  function edgeLines(r, st, wd, ma, mb, skipV) {
    const { x0, x1, z0, z1, h } = r, e = .012;
    const runs = { N: [[x0, x1]], S: [[x0, x1]], W: [[z0, z1]], E: [[z0, z1]] };
    for (const l of r.links) {
      const p = l.p, key = p.axis === 'x' ? (p.a === r.id ? 'E' : 'W') : (p.a === r.id ? 'S' : 'N'), a = p.c - p.w / 2 - .06, b = p.c + p.w / 2 + .06;
      runs[key] = runs[key].flatMap(([s0, s1]) => a > s0 && b < s1 ? [[s0, a], [b, s1]] : [[s0, s1]]);
    }
    const P = (key, t, y) => key === 'N' ? [t, y, z0 + e] : key === 'S' ? [t, y, z1 - e] : key === 'W' ? [x0 + e, y, t] : [x1 - e, y, t];
    for (const key of 'NSWE') {
      const full = key === 'N' || key === 'S' ? [x0, x1] : [z0, z1];
      for (const [a, b] of runs[key]) st.line(P(key, a, 0), P(key, b, 0), [0, 1, 0], wd, ma, mb);
      st.line(P(key, full[0], h), P(key, full[1], h), [0, -1, 0], wd, ma, mb);
    }
    if (!skipV) for (const [x, z, nx] of [[x0, z0 + e, 1], [x1, z0 + e, -1], [x0, z1 - e, 1], [x1, z1 - e, -1]]) st.line([x, 0, z], [x, h, z], [nx, 0, 0], wd, ma, mb);
  }
  H.props.s = r => {
    const { T, flat } = A, st = Strips();
    edgeLines(r, st, .055);
    r.group.add(st.mesh(flat('#ffffff', { side: T.DoubleSide })));
    const pos = [], uv = [], col = [];
    STONES.forEach((q, i) => stoneInto(pos, uv, col, q, 31 + i * 7));
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    // Сначала камни покрыты нарисованным мрамором, потом подгружается настоящая текстура.
    const map = A.tex(marble(), { release: true }); map.wrapS = map.wrapT = T.RepeatWrapping;
    const mat = new T.MeshBasicMaterial({ map, vertexColors: true });
    r.group.add(new T.Mesh(geo, mat));
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => { if (!r.group) return; const t = new T.Texture(im); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; t.needsUpdate = true; mat.map.dispose(); mat.map = t; mat.needsUpdate = true; };
    im.src = Media.url('halls/marble.webp');
  };

  // =================================================================================================
  // Анфилада
  // =================================================================================================

  H.bake.enfil = (wall, g, w, h, s, X, Y) => {
    vgrad(g, w, h, [[0, '#f4f4f5'], [.6, '#ececee'], [1, '#dfdfe2']]);
    band(g, w, h, 'b', .45 * s, 'rgba(70,74,90,.2)'); band(g, w, h, 't', .5 * s, 'rgba(70,74,90,.1)');
    band(g, w, h, 'l', .7 * s, 'rgba(70,74,90,.1)'); band(g, w, h, 'r', .7 * s, 'rgba(70,74,90,.1)');
    // Дневной свет из проёма в потолке лежит на северной стене.
    if (wall.key === 'N') soft(g, .3 * s, 'rgba(255,255,255,.8)', () => { g.beginPath(); g.moveTo(X(3), Y(wall.h)); g.lineTo(X(25), Y(wall.h)); g.lineTo(X(24), Y(1.1)); g.lineTo(X(4), Y(1.1)); g.fill(); });
    // На южной стене тени от порталов.
    if (wall.key === 'S') for (const q of GATES) { const u = wall.room.x1 - q.x; soft(g, .2 * s, 'rgba(80,84,100,.22)', () => g.fillRect(X(u - .5), 0, s, h)); }
    frames(g, wall, s, X, Y, 'rgba(40,44,60,.42)');
    for (const d of wall.doors) { g.strokeStyle = 'rgba(70,74,90,.35)'; g.lineWidth = Math.max(1.5, .014 * s); g.lineJoin = 'round'; doorPath(g, d, X, Y, .03); g.stroke(); }
    dither(g, w, h, .014, wall.id.charCodeAt(1) * 5);
  };
  H.floor.enfil = (r, g, w, h, s) => {
    const X = FX(r, s), Z = FZ(r, s), q = r.light;
    g.fillStyle = '#dcdcde'; g.fillRect(0, 0, w, h);
    band(g, w, h, 'b', 3 * s, 'rgba(80,84,100,.12)');
    for (const k of 'tlr') band(g, w, h, k, .9 * s, 'rgba(80,84,100,.14)');
    // Пятно дневного света под проёмом в потолке.
    soft(g, .35 * s, 'rgba(255,255,255,.95)', () => { g.beginPath(); g.moveTo(X(q.x0 + .6), Z(q.z0 + .9)); g.lineTo(X(q.x1 + .6), Z(q.z0 + .9)); g.lineTo(X(q.x1 + 1.4), Z(q.z1 + 1.5)); g.lineTo(X(q.x0 + 1.4), Z(q.z1 + 1.5)); g.fill(); });
    // Тени у основания порталов и полосы света между ними.
    for (const p of GATES) soft(g, .2 * s, 'rgba(70,74,92,.4)', () => { g.fillRect(X(p.x - .42), Z(GATE.z0 - .1), .84 * s, (GATE.zc - p.w / 2 - GATE.z0 + .1) * s); g.fillRect(X(p.x - .42), Z(GATE.zc + p.w / 2), .84 * s, (GATE.z1 - GATE.zc - p.w / 2) * s); });
    for (const p of GATES) blob(g, X(p.x + 1.75), Z(GATE.zc), 1.3 * s, 2.2 * s, '255,255,255', .5);
    dither(g, w, h, .016, 21);
  };
  H.ceil.enfil = (r, g, w, h, s) => {
    const X = FX(r, s), Z = CZ(r, s), q = r.light;
    g.fillStyle = '#e6e6e8'; g.fillRect(0, 0, w, h);
    g.save(); g.shadowColor = 'rgba(255,255,255,1)'; g.shadowBlur = 1.2 * s; g.fillStyle = '#fff'; g.fillRect(X(q.x0), Z(q.z1), (q.x1 - q.x0) * s, (q.z1 - q.z0) * s); g.restore();
    band(g, w, h, 't', 3.5 * s, 'rgba(80,84,100,.16)');
    dither(g, w, h, .014, 22);
  };
  H.props.p = r => {
    const { T, basic, gradient } = A, q = r.light, W = q.x1 - q.x0, D = q.z1 - q.z0, cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2;
    // Небо в проёме потолка и белые стенки шахты.
    const sky = A.textPanel(512, 128, (g, w, h) => {
      const l = g.createLinearGradient(0, 0, w, h); l.addColorStop(0, '#7fb2ec'); l.addColorStop(.6, '#a9cdf3'); l.addColorStop(1, '#cfe3f8'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      const u = A.rng(4); for (let i = 0; i < 16; i++) blob(g, u() * w, u() * h, 30 + u() * 70, 10 + u() * 22, '255,255,255', .5);
    });
    const top = new T.Mesh(new T.PlaneGeometry(W, D), basic(sky, { release: true })); top.rotation.x = Math.PI / 2; top.position.set(cx, r.h + q.d, cz); r.group.add(top);
    const shaft = basic(gradient('#fdfdfe', '#f1f3f7', '#e3e6ee'), { side: T.DoubleSide });
    const wall = (w, x, z, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, q.d), shaft); m.position.set(x, r.h + q.d / 2, z); m.rotation.y = ry; r.group.add(m); };
    wall(W, cx, q.z0, 0); wall(W, cx, q.z1, 0); wall(D, q.x0, cz, Math.PI / 2); wall(D, q.x1, cz, Math.PI / 2);
    // Порталы: по три бруска на каждый, все в одной отрисовке на материал.
    const face = basic(gradient('#f5f5f6', '#e9e9ec', '#cfcfd6')), jamb = basic(gradient('#d9d9de', '#cbcbd2', '#b4b4be')), under = A.flat('#bfbfc8');
    const m = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), [face, face, under, under, jamb, jamb], GATES.length * 3), o = new T.Object3D();
    GATES.forEach((p, i) => {
      const put = (k, y0, y1, z0, z1) => { o.position.set(p.x, (y0 + y1) / 2, (z0 + z1) / 2); o.scale.set(GATE.t, y1 - y0, z1 - z0); o.updateMatrix(); m.setMatrixAt(i * 3 + k, o.matrix); };
      put(0, 0, r.h, GATE.z0, GATE.zc - p.w / 2); put(1, 0, r.h, GATE.zc + p.w / 2, GATE.z1); put(2, p.h, r.h, GATE.zc - p.w / 2, GATE.zc + p.w / 2);
    });
    r.group.add(m);
    // Банан на скотче на северной стене (banana.js).
    if (window.Banana) Banana.build(r);
  };

  // =================================================================================================
  // Ночной режим
  // =================================================================================================

  // Доли двух цветов по углу вокруг центра: на севере первый, на юге второй.
  const mixT = t => { const a = .5 + .5 * Math.cos(t + Math.PI / 2); return [a, 1 - a]; };
  const angOf = (x, z) => Math.atan2(z - ROT.z, x - ROT.x);
  const rgbM = ([a, b], k) => `rgba(${Math.round(255 * a)},${Math.round(255 * b)},0,${k})`;
  const RIB = { lo: [.06, .36], hi: [5.95, 6.25] };
  H.bake.neon = (wall, g, w, h, s, X, Y) => {
    vgrad(g, w, h, [[0, '#0a0b0f'], [.6, '#0d0e13'], [1, '#090a0d']]);
    frames(g, wall, s, X, Y, null, 'rgba(210,220,255,.3)');
    dither(g, w, h, .014, wall.id.charCodeAt(1) * 9);
  };
  H.floor.neon = (r, g, w, h, s) => { g.fillStyle = '#07080b'; g.fillRect(0, 0, w, h); dither(g, w, h, .014, 31); };
  H.ceil.neon = (r, g, w, h, s) => { g.fillStyle = '#060709'; g.fillRect(0, 0, w, h); dither(g, w, h, .012, 32); };
  // Слой свечения грани: отсветы двух лент, цвет меняется вдоль грани по углу.
  function facetGlow(wall) {
    const s = 24, w = Math.max(8, Math.round(wall.L * s)), h = Math.round(wall.h * s), c = A.cv(w, h), g = c.getContext('2d'), Y = v => h - v * s;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'lighter';
    const at = u => { const p = wall.at(u, 0); return mixT(angOf(p.x, p.z)); };
    const [a0, a1] = [at(0), at(wall.L)];
    // Вертикальный профиль яркости рисуем белым, потом красим горизонтальным переходом цвета.
    const t = A.cv(w, h), q = t.getContext('2d'), band = (y0, y1, k0, k1) => { const l = q.createLinearGradient(0, Y(y0), 0, Y(y1)); l.addColorStop(0, `rgba(255,255,255,${k0})`); l.addColorStop(1, `rgba(255,255,255,${k1})`); q.fillStyle = l; q.fillRect(0, Math.min(Y(y0), Y(y1)), w, Math.abs(Y(y1) - Y(y0))); };
    band(RIB.lo[1], RIB.lo[1] + 1.1, .24, 0); band(0, RIB.lo[0], .16, .24);
    band(RIB.hi[0], RIB.hi[0] - 1.3, .2, 0); band(RIB.hi[1], wall.h, .16, .05);
    q.globalCompositeOperation = 'source-in';
    const l = q.createLinearGradient(0, 0, w, 0); l.addColorStop(0, rgbM(a0, 1)); l.addColorStop(1, rgbM(a1, 1)); q.fillStyle = l; q.fillRect(0, 0, w, h);
    g.drawImage(t, 0, 0); t.width = t.height = 0;
    return maskTex(c);
  }
  // Кольцевое свечение на полу или потолке: шестьдесят четыре сектора, у каждого свой цвет.
  function ringGlow(r, ceil) {
    const s = ceil ? 16 : 10, L = r.x1 - r.x0, w = Math.round(L * s), c = A.cv(w, w), g = c.getContext('2d'), cx = (ROT.x - r.x0) * s, cy = ceil ? (r.z1 - ROT.z) * s : (ROT.z - r.z0) * s;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, w); g.globalCompositeOperation = 'lighter';
    const ring = (r0, r1, stops) => {
      const n = 64;
      for (let i = 0; i < n; i++) {
        const t0 = i / n * TAU, t1 = (i + 1.04) / n * TAU, m = mixT((i + .5) / n * TAU);
        g.save(); g.beginPath(); g.moveTo(cx, cy);
        // На потолке строки холста идут с юга на север, поэтому угол зеркальный.
        g.arc(cx, cy, r1 * s + 2, ceil ? -t1 : t0, ceil ? -t0 : t1, false); g.closePath(); g.clip();
        const l = g.createRadialGradient(cx, cy, r0 * s, cx, cy, r1 * s); stops.forEach(([o, k]) => l.addColorStop(o, rgbM(m, k))); g.fillStyle = l; g.fillRect(0, 0, w, w); g.restore();
      }
    };
    const a = r.round.a;
    if (ceil) { ring(a - 2.6, a + .3, [[0, 0], [.85, .26], [1, .32]]); ring(3.4, 5.6, [[0, 0], [.42, .3], [.5, .8], [.58, .3], [1, 0]]); }
    else { ring(a - 2.6, a + .3, [[0, 0], [.9, .24], [1, .3]]); ring(ROT.plinth, ROT.plinth + 1.8, [[0, .34], [.3, .14], [1, 0]]); }
    return maskTex(c);
  }
  // Скульптура: узел, цвет по нормали из тех же двух цветов, края светлее.
  function sculpture() {
    const T = A.T, geo = new T.TorusKnotGeometry(.72, .22, A.LOW ? 96 : 200, A.LOW ? 10 : 20, 2, 3);
    return new T.Mesh(geo, new T.ShaderMaterial({
      uniforms: { uA: DUO.uA, uB: DUO.uB },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 w=modelMatrix*vec4(position,1.); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform vec3 uA,uB; varying vec3 vN; varying vec3 vV; void main(){ vec3 n=normalize(vN); float f=pow(1.-abs(dot(n,normalize(vV))),2.); vec3 c=mix(uA,uB,.5+.5*n.y); gl_FragColor=vec4(c*(.35+.5*f)+vec3(1.)*pow(f,3.)*.7,1.);\n#include <colorspace_fragment>\n}'
    }));
  }
  H.props.m = r => {
    const { T } = A, st = Strips(), e = .02;
    // Две ленты по всем граням. Нижняя прерывается у двери.
    for (const wall of Object.values(r.walls)) {
      if (wall.key[0] !== 'R') continue;
      const P = (u, v) => { const p = wall.at(u, v, e); return [p.x, p.y, p.z]; }, M = u => { const p = wall.at(u, 0); return mixT(angOf(p.x, p.z)); };
      const runs = wall.doors.length ? wall.doors.reduce((acc, d) => acc.flatMap(([u0, u1]) => [[u0, d.u - d.p.w / 2 - .08], [d.u + d.p.w / 2 + .08, u1]]), [[0, wall.L]]) : [[0, wall.L]];
      const quad = (u0, u1, [v0, v1]) => { const m0 = M(u0), m1 = M(u1); st.pos.push(...P(u0, v0), ...P(u1, v0), ...P(u1, v1), ...P(u0, v0), ...P(u1, v1), ...P(u0, v1)); for (const m of [m0, m1, m1, m0, m1, m0]) st.mask.push(...m); };
      for (const [u0, u1] of runs) if (u1 - u0 > .05) quad(u0, u1, RIB.lo);
      quad(0, wall.L, RIB.hi);
      // Свечение лежит на той же форме, что и стена: с вырезом под дверь, иначе в проёме висела цветная пелена.
      // Ближе к стене, чем этикетки (.012): на одной глубине они мерцали.
      const m = new T.Mesh(wall.geometry(), duoMat(facetGlow(wall)));
      m.position.set(0, 0, .004); m.renderOrder = 3;
      const g = new T.Group(); wall.place(g); g.add(m); wall.group.add(g);
    }
    // Кольцо света на потолке и кант подиума.
    const circle = (rad, y, wd, flatRing) => {
      const n = 72;
      for (let i = 0; i < n; i++) {
        const t0 = i / n * TAU, t1 = (i + 1) / n * TAU, m0 = mixT(t0), m1 = mixT(t1), c0 = [Math.cos(t0), Math.sin(t0)], c1 = [Math.cos(t1), Math.sin(t1)];
        const p = (c, rr, yy) => [ROT.x + c[0] * rr, yy, ROT.z + c[1] * rr];
        const a = flatRing ? [p(c0, rad - wd / 2, y), p(c1, rad - wd / 2, y), p(c1, rad + wd / 2, y), p(c0, rad - wd / 2, y), p(c1, rad + wd / 2, y), p(c0, rad + wd / 2, y)]
          : [p(c0, rad, y), p(c1, rad, y), p(c1, rad, y + wd), p(c0, rad, y), p(c1, rad, y + wd), p(c0, rad, y + wd)];
        a.forEach(q => st.pos.push(...q)); for (const m of [m0, m1, m1, m0, m1, m0]) st.mask.push(...m);
      }
    };
    circle(4.5, r.h - .01, .26, true);
    circle(ROT.plinth + .012, .44, .07, false);
    circle(ROT.plinth + 1.1, .004, .05, true);
    r.group.add(st.mesh(duoLine));
    const L = r.x1 - r.x0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const fl = new T.Mesh(new T.PlaneGeometry(L, L), duoMat(ringGlow(r, false))); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, .006, cz); fl.renderOrder = 3; r.group.add(fl);
    const ce = new T.Mesh(new T.PlaneGeometry(L, L), duoMat(ringGlow(r, true))); ce.rotation.x = Math.PI / 2; ce.position.set(cx, r.h - .006, cz); ce.renderOrder = 3; r.group.add(ce);
    // Подиум и скульптура над ним.
    const side = A.basic(A.textPanel(64, 16, (g, w, h) => { const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, '#1a1b22'); l.addColorStop(1, '#060608'); g.fillStyle = l; g.fillRect(0, 0, w, h); }));
    const plinth = new T.Mesh(new T.CylinderGeometry(ROT.plinth, ROT.plinth, .5, 64), [side, A.flat('#0b0c10'), A.flat('#0b0c10')]); plinth.position.set(ROT.x, .25, ROT.z); r.group.add(plinth);
    const knot = sculpture(); knot.position.set(ROT.x, 1.95, ROT.z); r.group.add(knot); r.sculpt = knot;
    A.thing(r, { id: 'knot', label: 'Узел', noSpark: true, mesh: A.hit(r, 2.2, 2.4, 2.2, ROT.x, 1.6, ROT.z), spot: { x: ROT.x + 3.2, z: ROT.z }, at: new T.Vector3(ROT.x, 2, ROT.z),
      lines: ['Узел без начала и конца. Цвет меняется вместе с залом.', 'Скульптура вращается медленнее, чем загружается страница.'] });
  };

  // =================================================================================================
  // Двери
  // =================================================================================================

  // Створки: рисунок на всю дверь, у каждой створки своя половина.
  const DOOR_ART = {
    stone(g, w, h) {
      vgrad(g, w, h, [[0, '#7c7d82'], [.5, '#6e6f74'], [1, '#77787d']]);
      const u = A.rng(3); for (let i = 0; i < 40; i++) blob(g, u() * w, u() * h, 20 + u() * 60, 14 + u() * 50, u() > .5 ? '255,255,255' : '20,22,28', .05);
      for (const x of [w * .5 - w * .07, w * .5 + w * .07]) { g.save(); g.shadowColor = '#fff'; g.shadowBlur = w * .06; g.fillStyle = '#fff'; g.fillRect(x - 1.5, h * .16, 3, h * .72); g.fillRect(x - 1.5, h * .16, 3, h * .72); g.restore(); }
      g.fillStyle = 'rgba(16,18,24,.7)'; g.fillRect(w / 2 - 1.5, 0, 3, h);
      dither(g, w, h, .04, 4);
    },
    enfil(g, w, h) {
      vgrad(g, w, h, [[0, '#f6f6f7'], [1, '#e6e6e9']]);
      g.strokeStyle = 'rgba(90,94,110,.3)'; g.lineWidth = 2;
      for (const k of [0, 1]) g.strokeRect(w * (.07 + k * .5), h * .06, w * .36, h * .86);
      const l = g.createLinearGradient(w * .44, 0, w * .56, 0); l.addColorStop(0, 'rgba(80,84,100,0)'); l.addColorStop(.5, 'rgba(80,84,100,.34)'); l.addColorStop(1, 'rgba(80,84,100,0)'); g.fillStyle = l; g.fillRect(w * .44, 0, w * .12, h);
      g.fillStyle = '#17181c'; for (const x of [w * .455, w * .545]) g.fillRect(x - 3, h * .56, 6, h * .16);
    },
    neon(g, w, h) {
      const l = g.createLinearGradient(0, 0, w, h); l.addColorStop(0, '#08090c'); l.addColorStop(.45, '#191b24'); l.addColorStop(.55, '#0d0e13'); l.addColorStop(1, '#07080a'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      // Тёмное стекло: светящаяся полоса посередине визуально перегораживала проход, поэтому шов тёмный и тонкий.
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, 0, w, 2);
      g.fillStyle = '#040406'; g.fillRect(w / 2 - 1, 0, 2, h);
    }
  };
  const hex = c => new A.T.Color(c);
  function pass(p) {
    const { T, scene, R } = A, len = p.s1 - p.s0, mid = (p.s0 + p.s1) / 2, ra = R[p.a], rb = R[p.b];
    const la = LOOK[ra.style], lb = LOOK[rb.style], look = ra.style === 'hub' ? rb.style : ra.style;
    // Своя система координат прохода: x поперёк, y вверх, z вдоль от зала a к залу b.
    const g = new T.Group();
    if (p.axis === 'x') { g.position.set(mid, 0, p.c); g.rotation.y = Math.PI / 2; } else g.position.set(p.c, 0, mid);
    scene.add(g);
    const pts = A.doorPts(0, p, 99), pos = [], col = [], hl = len / 2;
    // Откосы: у двери темнее, к залу светлее.
    const push = (x, y, z, c, k) => { pos.push(x, y, z); col.push(c.r * k, c.g * k, c.b * k); };
    for (const [z0, z1, c, k0, k1] of [[-hl, 0, hex(la.jamb), 1, .62], [0, hl, hex(lb.jamb), .62, 1]]) for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      push(ax, ay, z0, c, k0); push(bx, by, z0, c, k0); push(bx, by, z1, c, k1); push(ax, ay, z0, c, k0); push(bx, by, z1, c, k1); push(ax, ay, z1, c, k1);
    }
    const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); tg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.add(new T.Mesh(tg, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })));
    const fp = [], fc = [], hw = p.w / 2;
    const fpush = (x, z, c, k) => { fp.push(x, .002, z); fc.push(c.r * k, c.g * k, c.b * k); };
    for (const [z0, z1, c, k0, k1] of [[-hl, 0, hex(la.sole), 1, .6], [0, hl, hex(lb.sole), .6, 1]]) { fpush(-hw, z0, c, k0); fpush(-hw, z1, c, k1); fpush(hw, z1, c, k1); fpush(-hw, z0, c, k0); fpush(hw, z1, c, k1); fpush(hw, z0, c, k0); }
    const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.Float32BufferAttribute(fp, 3)); fg.setAttribute('color', new T.Float32BufferAttribute(fc, 3));
    p.floor = new T.Mesh(fg, new T.MeshBasicMaterial({ vertexColors: true })); p.floor.userData.pass = p; g.add(p.floor);
    // Светящийся кант по контуру проёма со стороны каждого зала.
    for (const [lk, z] of [[la, -hl - .014], [lb, hl + .014]]) {
      if (!lk.rim) continue;
      const st = Strips(), nrm = pts.map((q, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
      for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], na = nrm[i], nb = nrm[i + 1], wd = .06; st.quad([a[0], a[1], z], [b[0], b[1], z], [b[0] + nb[0] * wd, b[1] + nb[1] * wd, z], [a[0] + na[0] * wd, a[1] + na[1] * wd, z], .45, .55); }
      g.add(st.mesh(lk.rim === 'duo' ? duoLine : A.flat(lk.rim, { side: T.DoubleSide })));
    }
    // Две створки разъезжаются в стены.
    const top = Math.max(...pts.map(q => q[1])), art = A.textPanel(384, Math.round(384 * top / p.w), DOOR_ART[look]), mat = A.basic(art, { side: T.DoubleSide, release: true });
    const leaf = sgn => {
      const s = new T.Shape(), half = pts.filter(q => q[0] * sgn >= 0);
      if (sgn < 0) { s.moveTo(-hw, 0); half.forEach(q => s.lineTo(q[0], q[1])); s.lineTo(0, top); s.lineTo(0, 0); } else { s.moveTo(0, 0); s.lineTo(0, top); half.forEach(q => s.lineTo(q[0], q[1])); }
      s.closePath();
      const geo = new T.ShapeGeometry(s, 1), ps = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < ps.count; i++) uv.setXY(i, (ps.getX(i) + hw) / p.w, ps.getY(i) / top);
      const m = new T.Mesh(geo, mat); g.add(m); return m;
    };
    const hit = new T.Mesh(new T.BoxGeometry(p.w, top, .3), new T.MeshBasicMaterial({ visible: false })); hit.position.y = top / 2; g.add(hit);
    p.door = { open: 0, want: 0, warm: false, leaves: [leaf(-1), leaf(1)], hit, look };
    p.closed = true;
  }
  function setDoor(p, open) {
    const d = p.door, e = open * open * (3 - 2 * open), sl = e * (p.w / 2 + .04);
    d.leaves[0].position.x = -sl; d.leaves[1].position.x = sl;
    d.leaves[0].visible = d.leaves[1].visible = open < .995;
  }

  // Движение: цвет ночного зала, скульптура ротонды, мелочи главного зала.
  const tmp = { h: 0 };
  function tick(room, dt, t, P) {
    DUO.uA.value.setHSL(.545 + .075 * Math.sin(t * .13), 1, .52);
    DUO.uB.value.setHSL(.86 + .075 * Math.sin(t * .13 + 2.1), 1, .55);
    if (room.sculpt) { room.sculpt.rotation.y += dt * .25; room.sculpt.rotation.x = Math.sin(t * .2) * .3; room.sculpt.position.y = 1.95 + Math.sin(t * .7) * .06; }
    if (room.hubTick) room.hubTick(dt, t, P);
  }
})();

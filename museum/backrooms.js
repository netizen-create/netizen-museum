// Бэкрумс: игра за вентиляционной решёткой главного зала. Жёлтый лабиринт, дискеты, выход и маскот-картинка,
// который едет за посетителем по коридорам. Лабиринт один на всех в течение дня (рекорды честные),
// дискеты при каждой попытке лежат в новых местах. Живые посетители здесь не видны: зала нет в списке live.js.
// Файл подключается между halls.js и world.js: комнату он добавляет в Halls2.ROOMS, предметы строит через Halls2.props.v,
// игрой управляет app.js через Backrooms.attach, start, tick.
(function () {
  // WT: толщина стен лабиринта. При 16 см они выглядели как бумага, полметра читается как настоящая стена.
  // Лабиринт 22 × 16 клеток по 2,4 м (53 × 38 м): 12 × 10 казался маленьким.
  const CELL = 2.4, GW = 22, GH = 16, X0 = 60, Z0 = 30, H = 2.75, WT = .5;
  const ROOM = { id: 'v', v2: true, secret: true, name: 'Нижний уровень', sub: 'Не оборачивайся', x0: X0, x1: X0 + GW * CELL, z0: Z0, z1: Z0 + GH * CELL, h: H, refl: 0, track: 'back', links: [] };
  Halls2.ROOMS.push(ROOM);
  const START = { x: 0, y: GH >> 1 };
  // Лабиринт один на день для всех режимов. loops: доля лишних стен, которые убираются (кольца),
  // braid: доля пробитых тупиков, halls: сколько пустых залов (в больших стоят колонны).
  const CATCH = .85, MAZE = { loops: .16, braid: .7, halls: 9 }, WAIT = 5;
  // Режим выбирается во всплывающем окне при входе и отличается только числом дискет. Рекорды у каждого режима свои.
  const MODES = { easy: { name: 'Лёгкий', disks: 3, color: '#3dff7a' }, mid: { name: 'Средний', disks: 5, color: '#ffd23f' }, hard: { name: 'Сложный', disks: 7, color: '#ff4b3a' } };
  const MAXD = 7;
  // Скорость маскота растёт от 2,1 до 4,1 м/с по мере сбора дискет. Шаг посетителя 2,8 (3 с клавиатуры), бег 5,2.
  const speedAt = (got, n) => 2.1 + 2 * got / n;
  // Прихожая у входа: клетки x 0…1 вокруг START, без внутренних стен.
  const LOBBY = { x0: 0, x1: 1, y0: START.y - 1, y1: START.y + 1 };
  let mode = null;
  const game = m => 'backrooms_' + m;

  // --- лабиринт ---------------------------------------------------------------------------------

  const cx = x => X0 + (x + .5) * CELL, cz = y => Z0 + (y + .5) * CELL;
  const cellOf = (x, z) => ({ x: Math.max(0, Math.min(GW - 1, Math.floor((x - X0) / CELL))), y: Math.max(0, Math.min(GH - 1, Math.floor((z - Z0) / CELL))) });
  const key = (x, y) => y * GW + x;
  // E[x][y]: стена между (x, y) и (x + 1, y). S[x][y]: между (x, y) и (x, y + 1).
  function generate(seed, C) {
    const r = Art.rng(seed), E = [], S = [], seen = new Set();
    for (let x = 0; x < GW; x++) { E.push(Array(GH).fill(true)); S.push(Array(GH).fill(true)); }
    // Обход с возвратом даёт длинные извилистые коридоры.
    const stack = [[START.x, START.y]]; seen.add(key(START.x, START.y));
    while (stack.length) {
      const [x, y] = stack[stack.length - 1], next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH && !seen.has(key(a, b)));
      if (!next.length) { stack.pop(); continue; }
      const [a, b, dx, dy] = next[Math.floor(r() * next.length)];
      if (dx === 1) E[x][y] = false; else if (dx === -1) E[a][b] = false; else if (dy === 1) S[x][y] = false; else S[a][b] = false;
      seen.add(key(a, b)); stack.push([a, b]);
    }
    // Кольца: без них от маскота некуда уйти, кроме тупика.
    for (let x = 0; x < GW; x++) for (let y = 0; y < GH; y++) {
      if (x < GW - 1 && E[x][y] && r() < C.loops) E[x][y] = false;
      if (y < GH - 1 && S[x][y] && r() < C.loops) S[x][y] = false;
    }
    // Почти все тупики пробиты насквозь: за дискетой не нужно возвращаться тем же коридором навстречу маскоту.
    const deg = (x, y) => (x < GW - 1 && !E[x][y]) + (x > 0 && !E[x - 1][y]) + (y < GH - 1 && !S[x][y]) + (y > 0 && !S[x][y - 1]);
    for (let x = 0; x < GW; x++) for (let y = 0; y < GH; y++) if (deg(x, y) === 1 && r() < C.braid) {
      const walls = [[x < GW - 1 && E[x][y], () => { E[x][y] = false; }], [x > 0 && E[x - 1][y], () => { E[x - 1][y] = false; }], [y < GH - 1 && S[x][y], () => { S[x][y] = false; }], [y > 0 && S[x][y - 1], () => { S[x][y - 1] = false; }]].filter(w => w[0]);
      if (walls.length) walls[Math.floor(r() * walls.length)][1]();
    }
    // Прихожая: в ней нет внутренних стен.
    for (let i = LOBBY.x0; i <= LOBBY.x1; i++) for (let j = LOBBY.y0; j <= LOBBY.y1; j++) { if (i < LOBBY.x1) E[i][j] = false; if (j < LOBBY.y1) S[i][j] = false; }
    // Пустые залы посреди коридоров: в них видно маскота издалека, и это пугает сильнее.
    // В залах стоят колонны в узлах сетки: за ними можно спрятаться, по ним легко потерять направление.
    const halls = [], pillars = [];
    for (let tries = 0; halls.length < C.halls && tries < 300; tries++) {
      const w = 2 + Math.floor(r() * 3), h = 2 + Math.floor(r() * 3), x = 1 + Math.floor(r() * (GW - w - 1)), y = Math.floor(r() * (GH - h));
      if (halls.some(q => x < q.x + q.w + 1 && q.x < x + w + 1 && y < q.y + q.h + 1 && q.y < y + h + 1) || (x <= START.x + 1 && Math.abs(y - START.y) < 3)) continue;
      halls.push({ x, y, w, h });
      for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) { if (i < x + w - 1) E[i][j] = false; if (j < y + h - 1) S[i][j] = false; }
      for (let i = 1; i < w; i++) for (let j = 1; j < h; j++) if ((i % 2 || w === 3) && (j % 2 || h === 3)) pillars.push([x + i, y + j]);
    }
    const open = (x, y, dx, dy) => {
      const a = x + dx, b = y + dy;
      if (a < 0 || b < 0 || a >= GW || b >= GH) return false;
      return dx === 1 ? !E[x][y] : dx === -1 ? !E[a][b] : dy === 1 ? !S[x][y] : !S[a][b];
    };
    const bfs = (sx, sy) => {
      const d = new Array(GW * GH).fill(-1), from = new Array(GW * GH).fill(-1), q = [[sx, sy]]; d[key(sx, sy)] = 0;
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x, y, dx, dy) && d[key(x + dx, y + dy)] < 0) { d[key(x + dx, y + dy)] = d[key(x, y)] + 1; from[key(x + dx, y + dy)] = key(x, y); q.push([x + dx, y + dy]); }
      }
      return { d, from };
    };
    const ds = bfs(START.x, START.y).d;
    // Выход на восточной стене, в самой дальней от входа клетке.
    let exit = 0;
    for (let y = 1; y < GH; y++) if (ds[key(GW - 1, y)] > ds[key(GW - 1, exit)]) exit = y;
    return { E, S, open, bfs, ds, exit: { x: GW - 1, y: exit }, halls, pillars };
  }

  // Дискеты: дальние от входа клетки, тупики в приоритете, все три далеко друг от друга. Каждая попытка своя.
  function placeDisks(M, DISKS) {
    const r = Math.random, maxd = Math.max(...M.ds), deg = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => M.open(x, y, dx, dy)).length;
    const cand = [];
    for (let x = 0; x < GW; x++) for (let y = 0; y < GH; y++) {
      if (M.ds[key(x, y)] < maxd * .25 || (x === M.exit.x && y === M.exit.y)) continue;
      // Дискеты лежат на перекрёстках и в залах, а не в глухих концах.
      const n = deg(x, y); cand.push({ x, y, w: n >= 3 ? 2 : n === 2 ? 1 : .3 });
    }
    const pick = [];
    const total = cand.reduce((s, c) => s + c.w, 0);
    let t = r() * total; for (const c of cand) { t -= c.w; if (t <= 0) { pick.push(c); break; } }
    if (!pick.length) pick.push(cand[0]);
    while (pick.length < Math.min(DISKS, cand.length)) {
      const dists = pick.map(p => M.bfs(p.x, p.y).d);
      const scored = cand.filter(c => !pick.includes(c)).map(c => ({ c, s: Math.min(...dists.map(d => d[key(c.x, c.y)])) * c.w })).sort((a, b) => b.s - a.s);
      pick.push(scored[Math.floor(r() * Math.min(5, scored.length))].c);
    }
    return pick;
  }

  // Путь по клеткам для ходьбы нажатием: середины клеток, в конце точка нажатия.
  function route(M, a, b) {
    const s = cellOf(a.x, a.z), t = cellOf(b.x, b.z), { from } = M.bfs(t.x, t.y), pts = [];
    for (let k = from[key(s.x, s.y)]; k >= 0; k = from[k]) {
      const x = k % GW, y = Math.floor(k / GW);
      if (x === t.x && y === t.y) break;
      pts.push({ x: cx(x), z: cz(y) });
    }
    pts.push({ x: b.x, z: b.z });
    return pts;
  }

  // --- сборка ----------------------------------------------------------------------------------

  let A = null, M = null, built = null;
  // Обои: та же жёлтая полоса с ромбами, что на стенах зала. Текстура на всю высоту, по длине повторяется.
  function wallpaper() {
    return A.textPanel(256, 512, (g, w, h) => {
      g.fillStyle = '#b79f52'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(112,90,30,.2)'; g.lineWidth = 1.4;
      const st = w / 4;
      for (let x = 0; x < w; x += st) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
        for (let y = (x / st % 2) * st * .6; y < h; y += st * 1.2) { g.beginPath(); g.moveTo(x + st * .5, y); g.lineTo(x + st * .7, y + st * .25); g.lineTo(x + st * .5, y + st * .5); g.lineTo(x + st * .3, y + st * .25); g.closePath(); g.stroke(); }
      }
      const l = g.createLinearGradient(0, 0, 0, h * .55); l.addColorStop(0, 'rgba(255,250,190,.4)'); l.addColorStop(1, 'rgba(255,250,190,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h * .55);
      const u = Art.rng(7);
      // Пятна только слабые и крупные: текстура повторяется каждые 1,2 м, и заметные пятна складывались в узор.
      for (let i = 0; i < 2; i++) { const x = u() * w, y = h * (.3 + u() * .5), rad = 90 + u() * 60, q = g.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, 'rgba(70,52,16,.07)'); q.addColorStop(1, 'rgba(70,52,16,0)'); g.fillStyle = q; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      g.fillStyle = '#6d5a2a'; g.fillRect(0, h - h * .035, w, h * .035);
    });
  }
  // Стены лабиринта без наложений. Раньше каждая стена была коробкой, продлённой в углах, и в стыках две коробки
  // занимали один объём: их грани совпадали и мерцали квадратами (z-fighting), а торцы с неверным обходом пропадали.
  // Теперь в каждом внутреннем узле, где сходятся стены, стоит столб WT × WT, а стены идут между столбами.
  // У стен только длинные грани, у столбов только открытые стороны. У внешней стены зала столбов нет: стена упирается в неё.
  function buildWalls(r) {
    const T = A.T, pos = [], uv = [], col = [], h = WT / 2;
    const vE = (i, j) => i > 0 && i < GW && j >= 0 && j < GH && M.E[i - 1][j];   // вертикальная линия i, от узла j до j + 1
    const hE = (i, j) => j > 0 && j < GH && i >= 0 && i < GW && M.S[i][j - 1];   // горизонтальная линия j, от узла i до i + 1
    const inner = (i, j) => i > 0 && i < GW && j > 0 && j < GH, pil = new Set(M.pillars.map(([i, j]) => i * 1000 + j));
    const post = (i, j) => inner(i, j) && (vE(i, j - 1) || vE(i, j) || hE(i - 1, j) || hE(i, j) || pil.has(i * 1000 + j));
    const X = i => X0 + i * CELL, Z = j => Z0 + j * CELL;
    // Вертикальная грань: от точки (ax, az) до (bx, bz) по полу, u по мировой координате, чтобы узор шёл без швов.
    const face = (ax, az, bx, bz, u0, u1, k) => {
      const P = [[ax, 0, az], [bx, 0, bz], [bx, H, bz], [ax, H, az]], U = [[u0, 0], [u1, 0], [u1, 1], [u0, 1]];
      for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(...P[i]); uv.push(...U[i]); const sh = k * (.7 + .3 * P[i][1] / H); col.push(sh, sh, sh); }
    };
    const blocks = [];
    for (let i = 1; i < GW; i++) for (let j = 0; j < GH; j++) if (vE(i, j)) {
      const x = X(i), z0 = Z(j) + (post(i, j) ? h : 0), z1 = Z(j + 1) - (post(i, j + 1) ? h : 0);
      face(x - h, z1, x - h, z0, z1 / 1.2, z0 / 1.2, .9); face(x + h, z0, x + h, z1, z0 / 1.2, z1 / 1.2, .9);
      blocks.push({ x0: x - h, x1: x + h, z0: Z(j) - h, z1: Z(j + 1) + h });
    }
    for (let j = 1; j < GH; j++) for (let i = 0; i < GW; i++) if (hE(i, j)) {
      const z = Z(j), x0 = X(i) + (post(i, j) ? h : 0), x1 = X(i + 1) - (post(i + 1, j) ? h : 0);
      face(x0, z - h, x1, z - h, x0 / 1.2, x1 / 1.2, 1); face(x1, z + h, x0, z + h, x1 / 1.2, x0 / 1.2, 1);
      blocks.push({ x0: X(i) - h, x1: X(i + 1) + h, z0: z - h, z1: z + h });
    }
    for (const [i, j] of M.pillars) blocks.push({ x0: X(i) - h, x1: X(i) + h, z0: Z(j) - h, z1: Z(j) + h });
    // Столбы: открытые стороны темнее, так видна толщина стены.
    for (let i = 1; i < GW; i++) for (let j = 1; j < GH; j++) if (post(i, j)) {
      const x = X(i), z = Z(j), w = WT / 1.2;
      if (!vE(i, j - 1)) face(x - h, z - h, x + h, z - h, 0, w, .68);
      if (!vE(i, j)) face(x + h, z + h, x - h, z + h, 0, w, .68);
      if (!hE(i - 1, j)) face(x - h, z + h, x - h, z - h, 0, w, .62);
      if (!hE(i, j)) face(x + h, z - h, x + h, z + h, 0, w, .62);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    const map = A.tex(wallpaper(), { release: true, aniso: 8 }); map.wrapS = T.RepeatWrapping;
    // Двусторонний материал: замкнутые объёмы изнутри не видны, а ошибка обхода больше не прячет грань.
    const mat = new T.MeshBasicMaterial({ map, vertexColors: true, side: T.DoubleSide });
    r.group.add(new T.Mesh(geo, mat));
    r.mats.push(mat);
    r.block.length = 0; r.block.push(...blocks);
  }
  function floppyTex() {
    return A.textPanel(128, 128, (g, w, h) => {
      g.fillStyle = '#1d2c6b'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c7ccd6'; g.fillRect(w * .28, 0, w * .44, h * .32); g.fillStyle = '#1d2c6b'; g.fillRect(w * .52, h * .05, w * .1, h * .2);
      g.fillStyle = '#f2efe6'; g.fillRect(w * .14, h * .46, w * .72, h * .46);
      g.fillStyle = '#16181d'; g.font = `700 ${h * .13}px ${Art.MONO}`; g.textAlign = 'center'; g.fillText('NETIZEN', w / 2, h * .66); g.font = `400 ${h * .09}px ${Art.MONO}`; g.fillText('1,44 МБ', w / 2, h * .82);
    });
  }
  function exitTex(on) {
    return A.textPanel(256, 512, (g, w, h) => {
      g.fillStyle = '#4a3c18'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5c4b20'; g.fillRect(w * .1, h * .2, w * .8, h * .8);
      g.strokeStyle = '#3a2e12'; g.lineWidth = 4; g.strokeRect(w * .14, h * .26, w * .72, h * .32); g.strokeRect(w * .14, h * .64, w * .72, h * .3);
      g.fillStyle = '#2a2108'; g.fillRect(w * .76, h * .6, w * .06, h * .04);
      const c = on ? '#3dff7a' : '#ff3b30';
      g.fillStyle = '#111'; g.fillRect(w * .2, h * .04, w * .6, h * .1);
      g.shadowColor = c; g.shadowBlur = 18; g.fillStyle = c; g.font = `800 ${h * .07}px ${Art.SANS}`; g.textAlign = 'center';
      g.font = `800 ${h * (on ? .07 : .045)}px ${Art.SANS}`;
      g.fillText(on ? 'ВЫХОД' : 'ЗАКРЫТО', w / 2, h * .115); g.fillText(on ? 'ВЫХОД' : 'ЗАКРЫТО', w / 2, h * .115);
    });
  }
  function build(r) {
    A = Halls2.api();
    const T = A.T;
    buildWalls(r);
    // Дверь выхода: изнутри у восточной стены.
    const ex = M.exit, door = new T.Mesh(new T.PlaneGeometry(1.1, 2.2), new T.MeshBasicMaterial({ map: A.tex(exitTex(false)) }));
    door.position.set(ROOM.x1 - .02, 1.1, cz(ex.y)); door.rotation.y = -Math.PI / 2; r.group.add(door);
    const openTex = A.tex(exitTex(true));
    // Дискеты: семь мешей на самый сложный режим, лишние прячутся.
    const fmat = new T.MeshBasicMaterial({ map: A.tex(floppyTex()) }), side = A.flat('#141a3a');
    const disks = Array.from({ length: MAXD }, () => {
      const g = new T.Group(), m = new T.Mesh(new T.BoxGeometry(.3, .3, .03), [side, side, side, side, fmat, fmat]); g.add(m);
      const glow = new T.Sprite(new T.SpriteMaterial({ map: World.glowTex, color: '#7fdcff', transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(1.3, 1.3, 1); g.add(glow);
      r.group.add(g); return g;
    });
    // Маскот: плоская картинка, всегда повёрнута к посетителю.
    const ctex = new T.Texture(); ctex.colorSpace = T.SRGBColorSpace;
    const im = new Image(); im.onload = () => { ctex.image = im; ctex.needsUpdate = true; }; im.src = Media.url('backrooms/chaser.webp');
    const chaser = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshBasicMaterial({ map: ctex, transparent: true, alphaTest: .4, side: T.DoubleSide }));
    chaser.visible = false; r.group.add(chaser);
    r.maze = { route: (a, b) => route(M, a, b) };
    built = { r, door, openTex, closedTex: door.material.map, disks, chaser };
  }
  Halls2.props.v = build;

  // --- игра ------------------------------------------------------------------------------------

  let ctx = null, G = null;
  const $ = id => document.getElementById(id);
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  // Слово «дискета» в нужной форме.
  const disksW = n => n % 10 === 1 && n % 100 !== 11 ? 'дискету' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'дискеты' : 'дискет';
  function hud() {
    if ($('br')) return;
    const box = document.createElement('div'); box.id = 'br';
    box.innerHTML = '<div id="brTop"><span id="brDisks"></span><span id="brTime"></span></div><button id="brQuit" type="button">Выйти в музей</button>'
      + '<button id="brRun" type="button">Бег</button>'
      + '<div id="brVig"></div>'
      + '<div id="brPick" hidden><div class="brCard"><h2>Нижний уровень</h2><p id="brRules"></p><p id="brKeys"></p><div id="brModes"></div><button id="brBack" type="button" class="alt">Вернуться в музей</button></div></div>'
      + '<div id="brEnd" hidden><img id="brFace" alt=""><div id="brBox"><h2 id="brT"></h2><p id="brD"></p><div id="brAct"></div></div></div>';
    document.body.appendChild(box);
    $('brFace').src = Media.url('backrooms/chaser.webp');
    $('brQuit').onclick = () => stop();
    $('brBack').onclick = () => stop();
    $('brRules').textContent = 'Собери все дискеты и убеги от маскота через зелёную дверь.';
    $('brKeys').textContent = ctx.coarse ? 'Ходи джойстиком, беги с кнопкой «Бег»' : 'Ходи на WASD, беги с Shift';
    const run = $('brRun');
    run.onclick = () => { B.run = !B.run; run.classList.toggle('on', B.run); };
  }
  function paint() {
    $('brTop').hidden = !G.mode;
    if (!G.mode) return;
    $('brDisks').textContent = `Дискеты: ${G.got} из ${G.n}`;
    $('brTime').textContent = mmss(G.t);
  }
  // Окно выбора сложности: по кнопке на режим, под названием число дискет и личный рекорд.
  function pickModes() {
    const box = $('brModes'); box.textContent = '';
    for (const [k, m] of Object.entries(MODES)) {
      const best = (Save.arcade || {})[game(k)], b = document.createElement('button');
      b.type = 'button'; b.style.setProperty('--c', m.color);
      b.innerHTML = '<b></b><span></span>';
      b.firstChild.textContent = m.name;
      b.lastChild.textContent = `${m.disks} ${disksW(m.disks)}` + (best ? `, твой рекорд ${mmss(best)}` : '');
      b.onclick = () => choose(k);
      box.appendChild(b);
    }
    $('brPick').hidden = false;
  }
  // Новая попытка: посетитель в прихожей, время не идёт, маскота нет, пока не выбрана сложность.
  function reset() {
    const b = built;
    G = { mode: null, n: 0, t: 0, got: 0, picks: [], taken: [], cx: 0, cz: 0, path: [], repath: 0, on: false, beat: 0, over: false };
    b.disks.forEach(d => { d.visible = false; });
    b.door.material.map = b.closedTex; b.door.material.needsUpdate = true;
    b.chaser.visible = false;
    ctx.teleport(cx(LOBBY.x1) + .6, cz(START.y), 0);
    $('brEnd').hidden = true; document.body.classList.add('br');
    $('brVig').style.opacity = 0;
    pickModes();
    paint();
  }
  // Сложность выбрана: дискеты раскладываются по лабиринту, время пошло.
  function choose(k) {
    if (!G || G.mode) return;
    const b = built, picks = placeDisks(M, MODES[k].disks);
    mode = k; Object.assign(G, { mode: k, n: picks.length, picks, taken: picks.map(() => false), t: 0 });
    picks.forEach((p, i) => { b.disks[i].visible = true; b.disks[i].position.set(cx(p.x), 1.1, cz(p.y)); });
    $('brPick').hidden = true;
    ctx.sfx('find');
    ctx.toast('Игра началась', `Собери ${G.n} ${disksW(G.n)} и беги к зелёной двери`);
    paint();
  }
  function start() {
    if (!M) M = generate(DAY_N * 7919 + 13, MAZE);
    hud();
    ctx.fade(() => {
      World.focus(ROOM); World.flush();
      reset();
    });
  }
  // Выход из игры в главный зал, к решётке. Без результата, если не дошёл до двери.
  function stop() {
    if (!G) return;
    G = null; document.body.classList.remove('br');
    if ($('brEnd')) $('brEnd').hidden = true;
    if ($('brPick')) $('brPick').hidden = true;
    B.run = false; if ($('brRun')) $('brRun').classList.remove('on');
    ctx.fade(() => ctx.home());
  }
  function finish(win) {
    G.over = true; built.chaser.visible = win ? false : built.chaser.visible;
    const end = $('brEnd'), act = $('brAct');
    end.hidden = false; end.className = win ? 'win' : 'lose';
    act.textContent = '';
    const btn = (label, fn, alt) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (alt) b.className = 'alt'; b.onclick = fn; act.appendChild(b); };
    const level = { easy: 'Лёгкий', mid: 'Средний', hard: 'Сложный' }[mode];
    if (win) {
      const secs = Math.max(1, Math.round(G.t));
      Save.arcade = Save.arcade || {};
      const best = Save.arcade[game(mode)];
      if (!best || secs < best) { Save.arcade[game(mode)] = secs; persist(); }
      if (window.Net && Net.on) Net.score(game(mode), secs);
      $('brT').textContent = 'Ты выбрался';
      $('brD').textContent = `${level} уровень за ${mmss(secs)}` + (best && best < secs ? `, твой рекорд ${mmss(best)}` : ', это твой рекорд');
      ctx.sfx('find'); ctx.found('backrooms');
      btn('Сыграть ещё раз', () => reset()); btn('Вернуться в музей', () => stop(), true);
    } else {
      $('brT').textContent = 'Маскот тебя поймал';
      $('brD').textContent = `Собрано ${G.got} из ${G.n}, время ${mmss(G.t)}`;
      ctx.sfx('deny');
      btn('Попробовать ещё раз', () => reset()); btn('Вернуться в музей', () => stop(), true);
    }
  }
  function tick(dt, t, P) {
    if (!G || !built) return;
    const b = built, r = b.r;
    if (G.over || !G.mode) return;
    G.t += dt;
    if (Math.floor(G.t * 4) !== Math.floor((G.t - dt) * 4)) paint();
    // Дискеты крутятся и подпрыгивают, подбираются в радиусе метра.
    b.disks.forEach((d, i) => {
      if (i >= G.n || G.taken[i]) return;
      d.rotation.y += dt * 1.6; d.position.y = 1.05 + Math.sin(t * 2 + i) * .08;
      if (Math.hypot(d.position.x - P.x, d.position.z - P.z) < .95) {
        G.taken[i] = true; d.visible = false; G.got++; ctx.sfx('find'); paint();
        if (G.got === G.n) { b.door.material.map = b.openTex; b.door.material.needsUpdate = true; ctx.toast('Все дискеты собраны', 'Беги к зелёной двери'); }
      }
    });
    if (G.got === G.n && Math.hypot(ROOM.x1 - .5 - P.x, cz(M.exit.y) - P.z) < 1.1) return finish(true);
    // Маскот появляется в дальней клетке и едет по клеткам к посетителю.
    const ch = b.chaser;
    if (!G.on && G.t > WAIT) {
      const { d } = M.bfs(cellOf(P.x, P.z).x, cellOf(P.x, P.z).y);
      // В большом лабиринте из самого дальнего угла он ехал бы минуту, поэтому берём клетку в 12–18 шагах.
      let far = 0; d.forEach((v, k) => { if (v > d[far]) far = k; });
      const mid = []; d.forEach((v, k) => { if (v >= 12 && v <= 18) mid.push(k); });
      if (mid.length) far = mid[Math.floor(Math.random() * mid.length)];
      G.cx = cx(far % GW); G.cz = cz(Math.floor(far / GW)); G.on = true; ch.visible = true;
    }
    let prox = 0;
    if (G.on) {
      G.repath -= dt;
      const pc = cellOf(P.x, P.z), mc = cellOf(G.cx, G.cz);
      if (G.repath <= 0) { G.repath = .25; G.path = route(M, { x: G.cx, z: G.cz }, { x: P.x, z: P.z }); }
      let tgt = pc.x === mc.x && pc.y === mc.y ? { x: P.x, z: P.z } : G.path[0];
      if (tgt && Math.hypot(tgt.x - G.cx, tgt.z - G.cz) < .1) { G.path.shift(); tgt = G.path[0]; }
      const v = speedAt(G.got, G.n) * (LOW ? .88 : 1);
      if (tgt) { const dx = tgt.x - G.cx, dz = tgt.z - G.cz, l = Math.hypot(dx, dz), s = Math.min(l, v * dt); G.cx += dx / l * s; G.cz += dz / l * s; }
      ch.position.set(G.cx, 1.05 + Math.sin(t * 7) * .05, G.cz);
      ch.rotation.y = Math.atan2(P.x - G.cx, P.z - G.cz);
      const dist = Math.hypot(P.x - G.cx, P.z - G.cz);
      prox = Math.max(0, 1 - dist / 12);
      if (dist < CATCH) { ch.position.set(P.x + Math.cos(P.yaw) * .9, 1.6, P.z + Math.sin(P.yaw) * .9); return finish(false); }
      // Сердце стучит чаще, когда он ближе.
      G.beat -= dt;
      if (prox > .25 && G.beat <= 0 && Snd.ctx && Snd.ctx.state === 'running') { Snd.kick(Snd.ctx.currentTime + .01); G.beat = 1.1 - prox * .75; }
    }
    $('brVig').style.opacity = (prox * prox * .9).toFixed(3);
    Snd.setLevel(.6 + prox * .9, 900 + prox * 9000);
  }

  const B = window.Backrooms = {
    ROOM, MODES, game, mmss, run: false,
    // Открыто окно выбора или экран итога: app.js возвращает курсор, если мышь была захвачена.
    get picking() { return !!G && !G.mode; },
    get ended() { return !!G && G.over; },
    attach(c) { ctx = c; },
    start, stop, tick,
    get active() { return !!G; },
    // Для проверки в превью: где дискеты, выход и маскот.
    debug: () => G && { disks: G.picks.map((p, i) => ({ x: cx(p.x), z: cz(p.y), taken: G.taken[i] })), exit: { x: ROOM.x1 - .6, z: cz(M.exit.y) }, chaser: { x: G.cx, z: G.cz, on: G.on }, halls: M.halls.map(q => ({ x: X0 + (q.x + q.w / 2) * CELL, z: Z0 + (q.y + q.h / 2) * CELL, w: q.w, h: q.h })) },
    // Посетитель ушёл из лабиринта не через игру (например, по карте): просто гасим интерфейс.
    left() { if (G) { G = null; document.body.classList.remove('br'); } }
  };
})();

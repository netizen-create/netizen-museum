// Прогулка от первого лица: ходьба, люди, реплики, находки, сад, свечи, танцпол, рисование.
(function () {
  const { T, scene, ROOMS, R, PASS, gates, reflTarget, reflMatrix, flat, lam } = World;
  const $ = id => document.getElementById(id);
  const PR = .34, TAU = Math.PI * 2;

  const renderer = new T.WebGLRenderer({ canvas: $('view'), antialias: !LOW, powerPreference: 'high-performance' });
  let dpr = Math.min(devicePixelRatio || 1, LOW ? 1.4 : 2);
  const camera = new T.PerspectiveCamera(66, 1, .08, 120);
  const vcam = new T.PerspectiveCamera();
  const rt = new T.WebGLRenderTarget(4, 4);
  reflTarget.value = rt.texture;
  let reflOn = !LOW;

  const P = { x: 1.6, z: -4.2, y: .5, yaw: 0, pitch: .06, path: [], face: null, goal: null, moving: false, heading: 0, bob: 0 };
  let room = R.a;

  // --- люди -------------------------------------------------------------------------------------

  const GEO = {
    torso: new T.CapsuleGeometry(.155, .42, 4, 12), head: new T.SphereGeometry(.115, 16, 12),
    leg: new T.CapsuleGeometry(.06, .66, 3, 8), arm: new T.CapsuleGeometry(.042, .5, 3, 8), hit: new T.CylinderGeometry(.42, .42, 1.9, 8)
  };
  const blobTex = (() => {
    const c = Art.cv(64, 64), g = c.getContext('2d'), l = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    l.addColorStop(0, 'rgba(0,0,0,.5)'); l.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = l; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();
  const blobGeo = new T.PlaneGeometry(.9, .9), blobMat = new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
  const SHARED = new Set([...Object.values(GEO), blobGeo]);

  function person(color, o = {}) {
    const g = new T.Group(), m = lam(color), dark = lam(o.legs || '#26262a');
    const torso = new T.Mesh(GEO.torso, m); torso.position.y = 1.12; torso.scale.z = .68; g.add(torso); g.torso = torso;
    if (o.head) { o.head.position.y = Math.max(o.head.position.y, 1.62); g.add(o.head); g.headMesh = o.head; }
    else { const head = new T.Mesh(GEO.head, o.skin ? lam(o.skin) : m); head.position.y = 1.62; head.scale.y = 1.12; g.add(head); g.headMesh = head; }
    const limb = (z, y, geo, r, l, mat) => {
      const piv = new T.Group(); piv.position.set(0, y, z);
      const q = new T.Mesh(geo, mat); q.position.y = -l / 2 - r; piv.add(q); g.add(piv); return piv;
    };
    g.limbs = { lL: limb(-.09, .86, GEO.leg, .06, .66, dark), lR: limb(.09, .86, GEO.leg, .06, .66, dark), aL: limb(-.2, 1.4, GEO.arm, .042, .5, m), aR: limb(.2, 1.4, GEO.arm, .042, .5, m) };
    if (!o.noBlob) { const b = new T.Mesh(blobGeo, blobMat); b.rotation.x = -Math.PI / 2; b.position.y = .012; g.add(b); }
    g.phase = Math.random() * 6;
    return g;
  }
  function animate(g, moving, dt) {
    g.phase += dt * 8.4 * (moving ? 1 : 0);
    const s = moving ? Math.sin(g.phase) * .55 : 0, k = 1 - Math.exp(-dt * 12), L = g.limbs;
    L.lL.rotation.z += (s - L.lL.rotation.z) * k; L.lR.rotation.z += (-s - L.lR.rotation.z) * k;
    L.aL.rotation.z += (-s * .7 - L.aL.rotation.z) * k; L.aR.rotation.z += (s * .7 - L.aR.rotation.z) * k;
  }

  // Посетители с никнеймами. В будущем сюда придут настоящие люди и их имена из Telegram.
  const CROWD = {
    a: [['monitor', '@crt_dad', 'Сынок, тут картины. Я в них не понимаю, но ты смотри.'], ['cursor', '@click_me', 'Наведись на меня. Ну наведись.']],
    j: [['floppy', '@save_me', 'Во мне 1,44 мегабайта чистого вайба.'], ['banana', '@lot_0001', 'Я был на выставке. Там скучно и скотч.']],
    c: [['cursor', '@lag_404', 'Я не завис. Я созерцаю.']],
    f: [['banana', '@zoomer', 'Это не баг, это инсталляция.'], ['monitor', '@old_admin', 'У меня в 2007-м всё так же рендерилось.']],
    w: [['cursor', '@first_artist', 'Обошёл крест трижды. С каждой стороны он выглядит как начало.']]
  };
  function textSprite(str, color, w = 1.1) {
    const c = Art.cv(256, 44), x = c.getContext('2d');
    x.font = `500 24px ${Art.MONO}`; const tw = Math.min(250, x.measureText(str).width + 26);
    x.fillStyle = 'rgba(8,9,12,.72)'; x.beginPath();
    if (x.roundRect) x.roundRect((256 - tw) / 2, 2, tw, 40, 20); else x.rect((256 - tw) / 2, 2, tw, 40);
    x.fill();
    x.fillStyle = color || '#ece9e2'; x.textAlign = 'center'; x.fillText(str, 128, 31);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(w, w * .172, 1);
    return s;
  }

  const CRITIC = {
    a: ['Эта работа', 'Данный жест', 'Сам факт этого пикселя', 'Пустота в левом углу', 'Авторская оптика'],
    b: ['проблематизирует', 'деконструирует', 'ретвитит', 'аннотирует', 'ставит лайк на', 'мягко отменяет'],
    c: ['телесность', 'постинтернет', 'границу между вкладками', 'саму идею Wi-Fi', 'тревожность кэша', 'капчу внутри нас'],
    d: ['через отказ от рендера.', 'в эпоху лагающего бытия.', 'но не до конца.', 'и это, конечно, про маму.', 'на скорости 56 кбит/с.', 'и куратор это знает.']
  };
  const anyOf = l => l[Math.floor(Math.random() * l.length)];

  const CAST = {
    a: [
      { name: 'Критик', col: '#2c2c30', screen: '#2f5bff', pitch: 480, fn: () => [`${anyOf(CRITIC.a)} ${anyOf(CRITIC.b)} ${anyOf(CRITIC.c)} ${anyOf(CRITIC.d)}`] },
      { name: 'Посетительница', col: '#6b4048', screen: '#ff5ea8', pitch: 640, lines: ['Я сфоткала квадрат, но он не загрузился.', 'На прошлой неделе тут висело другое. Или это я была другая.'] }
    ],
    j: [
      { name: 'Турист', col: '#3d4a5c', screen: '#ffd23f', pitch: 420, lines: ['Простите, а где здесь Мона Лиза в хорошем качестве?', 'Я тут с третьего визита ищу буфет.', 'Говорят, за шкафом есть целая галерея. Врут, наверное.'] },
      { name: 'Курьер', col: '#4a4530', screen: '#35e6dc', pitch: 330, lines: ['Посылка для «Метавселенной». Никого нет дома с 2022-го.', 'Распишитесь вот тут. Нет, это NFT вашей подписи.', 'Вы случайно не адрес доставки?'] },
      { name: 'Anon', col: '#17181c', screen: '#ff4518', pitch: 560, lines: ['Я не отсюда. Я из соседней вкладки.', 'Лагает не зал. Лагаю я.'] }
    ],
    b: [{ name: 'tmp_file_2', col: '#4a4530', pitch: 300, lines: ['Я вышел покурить в 2019-м.', 'Здесь есть выход. Он нарисован.'] }],
    c: [
      { name: 'user8841', col: '#74767f', pitch: 380, lines: ['Я пришёл на пять минут. Какой сейчас год?', 'Лента не кончается. Я проверял руками.'] },
      { name: 'nastya.exe', col: '#85878f', pitch: 620, lines: ['Сбор сведений застрял на 99%. Как и я.'] },
      { name: 'oldforum', col: '#5f6168', pitch: 300, lines: ['Первый нах.', 'Баян.'] }
    ],
    f: [
      { name: 'Старый админ', col: '#59462f', screen: '#7bff8c', pitch: 280, lines: ['Этот мем я видел в 2007-м. Тогда он был смешнее.', 'Правила галереи: не кормить троллей. Они уже сыты.'] },
      { name: 'Зумер', col: '#7a5a8a', screen: '#ff5ea8', pitch: 660, lines: ['Что значит «отсек хранения»? Это контент?', 'Ладно, рофл.'] }
    ]
  };

  // Голова-монитор: у каждого посетителя свой цвет экрана.
  function screenHead(col) {
    const g = new T.Group(), box = new T.Mesh(new T.BoxGeometry(.3, .34, .3), lam(col)); g.add(box);
    const c = Art.cv(64, 64), x = c.getContext('2d');
    x.fillStyle = '#0c0d12'; x.fillRect(0, 0, 64, 64); x.fillStyle = col; x.fillRect(16, 24, 9, 12); x.fillRect(39, 24, 9, 12); x.fillRect(24, 46, 16, 4);
    const f = new T.Mesh(new T.PlaneGeometry(.25, .28), new T.MeshBasicMaterial({ map: World.tex(c, { nearest: true }) })); f.position.x = .153; f.rotation.y = Math.PI / 2; g.add(f);
    return g;
  }

  function addNpc(r, g, o) {
    r.group.add(g);
    const hitBox = new T.Mesh(GEO.hit, new T.MeshBasicMaterial({ visible: false })); hitBox.position.y = .95; g.add(hitBox);
    const n = Object.assign({ g, room: r, x: g.position.x, z: g.position.z, yaw: 0, path: [], wait: 1 + Math.random() * 6, label: o.name, seq: 0 }, o);
    const th = { id: 'npc:' + o.name, label: o.name, mesh: g, npc: n, at: null, room: r, noSpark: true };
    hitBox.userData.thing = th; r.pick.things.push(hitBox);
    r.things.push(th); r.npcs.push(n);
    return n;
  }

  function spawnPeople(r) {
    r.npcs = [];
    if (!World.EXTRAS) {
      const list = (Art.HANG[r.id] || []).filter(w => w.spot);
      if (!list.length) return;
      (CROWD[r.id] || []).slice(0, LOW ? 1 : 2).forEach(([kind, name, line], i) => {
        const g = Avatars.make(kind), w = list[(i * 4 + 2) % list.length];
        g.position.set(w.spot.x, World.floorY(w.spot.x, w.spot.z), w.spot.z);
        const b = new T.Mesh(blobGeo, blobMat); b.rotation.x = -Math.PI / 2; b.position.y = .012; g.add(b);
        const tag = textSprite(name); tag.position.y = 2.02; g.add(tag);
        addNpc(r, g, { name, lines: [line], pitch: 340 + i * 120, walks: true, speed: .9, work: w, floats: true });
      });
      return;
    }
    const spots = (Art.HANG[r.id] || []).filter(w => w.spot);
    (CAST[r.id] || []).forEach((c, i) => {
      const g = person(c.col, c.screen ? { head: screenHead(c.screen) } : {});
      const w = spots[(i * 3 + 1) % spots.length];
      g.position.set(w.spot.x, World.floorY(w.spot.x, w.spot.z), w.spot.z);
      const tag = textSprite(c.name); tag.position.y = 2.02; g.add(tag);
      addNpc(r, g, Object.assign({ walks: true, speed: 1.2, work: w }, c));
    });
    if (r.id === 'a') {
      const g = person('#1c2433'); g.position.set(17.1, -.36, -5.9); g.rotation.y = Math.PI * .85;
      g.limbs.lL.rotation.z = g.limbs.lR.rotation.z = 1.5; g.headMesh.rotation.x = .5; g.headMesh.position.z = .03;
      const n = addNpc(r, g, { name: 'Смотритель', pitch: 260, lines: ['Хррр…', 'Работы руками не трогать. Глазами трогать можно.', 'Я слежу за этим залом с 2003 года. Ни одна работа пока не сбежала.'] }); n.still = true;
    }
    if (r.id === 'b') {
      const e = person('#16140d', { legs: '#16140d', noBlob: true }); e.position.set(51.4, 0, -6.9); e.rotation.y = -.8; e.scale.y = 1.07; r.group.add(e); r.entity = e;
      const dbl = person('#d2c58d', { legs: '#8d8151' }); dbl.visible = false; r.group.add(dbl); r.double = dbl;
    }
    if (r.id === 'd') {
      const dad = person('#4f6c8f', { skin: '#d6ae8e', legs: '#343136' }); dad.position.set(7.2, 0, -12.5); dad.rotation.y = -Math.PI / 2; dad.limbs.aR.rotation.x = .95; dad.limbs.aL.rotation.x = 0; r.group.add(dad); r.dad = dad; r.npcs = [];
    }
    if (r.id === 'e') {
      const hp = new T.Mesh(new T.TorusGeometry(.13, .02, 6, 16, Math.PI), lam('#d8d8e2'));
      const son = person('#3f4f46', { skin: '#d6ae8e', legs: '#262b3a', noBlob: true });
      hp.position.set(0, 1.64, 0); hp.rotation.y = Math.PI / 2; son.add(hp);
      [-.13, .13].forEach(z => { const cup = new T.Mesh(new T.CylinderGeometry(.05, .05, .03, 12), lam('#d8d8e2')); cup.rotation.x = Math.PI / 2; cup.position.set(0, 1.62, z); son.add(cup); });
      const hold = new T.Group(); hold.rotation.x = -Math.PI / 2; hold.position.set(3.7, .72, -16.7); hold.add(son);
      son.limbs.lL.rotation.z = -1; son.limbs.lR.rotation.z = -.75; son.limbs.aL.rotation.z = -1.35; son.limbs.aR.rotation.z = -1.2;
      r.group.add(hold); r.son = son;
      const tearGeo = new T.SphereGeometry(.018, 6, 5), tearMat = flat('#a9d8ff');
      r.tears = [0, 1, 2].map(i => { const t = new T.Mesh(tearGeo, tearMat); t.position.set(3.55, .72, -18.3); r.group.add(t); t.life = i * .5; return t; });
    }
    if (r.id === 'f') {
      r.npcs.forEach(n => { n.speed = 1; });
    }
    if (r.id === 'g') {
      const cap = new T.Group(), c1 = new T.Mesh(new T.SphereGeometry(.32, 14, 8, 0, TAU, 0, Math.PI / 2), lam('#a33d3a')); c1.position.y = 1.72; cap.add(c1);
      const c2 = new T.Mesh(new T.CylinderGeometry(.08, .1, .3, 10), lam('#e4dcc7')); c2.position.y = 1.62; cap.add(c2);
      const gar = person('#2a3d2f', { head: cap }); gar.position.set(-9, 0, 5);
      addNpc(r, gar, { name: 'Садовник', pitch: 240, walks: true, speed: .55, wander: true, fn: () => ['Здесь всё растёт из слов. Напишешь гадость, вырастет борщевик.', 'Каждое слово даёт своё растение. Одинаковые слова дают одинаковые. Это ботаника.'] });
      const bc = World.textPanel(360, 200, (g, w, h) => {
        g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, h); g.fillStyle = '#d91e2c'; g.font = `800 36px ${Art.SANS}`; g.textAlign = 'center'; g.fillText('ПОЗДРАВЛЯЕМ!', w / 2, 70);
        g.fillStyle = '#111'; g.font = `500 22px ${Art.SANS}`; g.fillText('Вы миллионный', w / 2, 112); g.fillText('посетитель', w / 2, 142);
      });
      const bt = new T.CanvasTexture(bc); bt.colorSpace = T.SRGBColorSpace;
      const ghost = new T.Sprite(new T.SpriteMaterial({ map: bt, transparent: true, opacity: .72, depthWrite: false })); ghost.scale.set(1.5, .84, 1); ghost.position.set(-10, 2.2, -1); r.group.add(ghost); r.ghost = ghost;
      const hb = new T.Mesh(new T.BoxGeometry(1.6, 1, .3), new T.MeshBasicMaterial({ visible: false })); ghost.add(hb);
      const th = { id: 'ghost', label: 'Призрак баннера', mesh: hb, room: r, noSpark: true, lines: ['ПОЗДРАВЛЯЕМ! ВЫ МИЛЛИОННЫЙ ПОСЕТИТЕЛЬ!', 'Нажмите, чтобы забрать приз. Приза нет. Я тут с 2003-го.', 'Закрыть меня можно только крестиком размером в один пиксель.'] };
      hb.userData.thing = th; r.pick.things.push(hb); r.things.push(th);
      r.plants = []; plantAll(r); candles(r);
    }
    if (r.id === 'i') {
      const heads = {
        banana: () => { const arc = new T.QuadraticBezierCurve3(new T.Vector3(-.2, .3, 0), new T.Vector3(.16, .05, 0), new T.Vector3(-.12, -.24, 0)); return new T.Mesh(new T.TubeGeometry(arc, 14, .1, 8), lam('#e8c33a')); },
        floppy: () => { const q = new T.Mesh(new T.BoxGeometry(.06, .42, .42), lam('#2a3f7a')); return q; },
        skull: () => { const q = new T.Mesh(new T.SphereGeometry(.14, 12, 10), lam('#e9e5d6')); return q; },
        cursor: () => { const s = new T.Shape(); [[0, .28], [0, -.14], [.1, -.04], [.18, -.22], [.26, -.18], [.18, -.01], [.32, -.01]].forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); const q = new T.Mesh(new T.ExtrudeGeometry(s, { depth: .04, bevelEnabled: false }), lam('#f4f4f4')); q.rotation.y = Math.PI / 2; return q; },
        frog: () => { const q = new T.Group(), b = new T.Mesh(new T.SphereGeometry(.17, 12, 10), lam('#3b7a3c')); q.add(b);[-.08, .08].forEach(z => { const e = new T.Mesh(new T.SphereGeometry(.055, 8, 6), lam('#f6f3df')); e.position.set(-.09, .12, z); q.add(e); }); return q; }
      };
      [['Банан', 'banana', '#2a2318', 33.2, 10.2, ['Я не танцую. Я созреваю ритмично.', 'Я был на выставке. Там скучно и скотч.']],
        ['Скелет', 'skull', '#d8d4c6', 36.2, 16.4, ['Жду ответа от службы поддержки. Заодно потанцую.', 'Открыл эту вкладку в 2009-м.']],
        ['Дискета', 'floppy', '#1d2a55', 37.6, 10.4, ['Дети думают, что я иконка сохранения.', 'Во мне 1,44 мегабайта чистого вайба.']],
        ['Курсор', 'cursor', '#222', 33.4, 16.6, ['Наведись на меня. Ну наведись.', 'Я кликаю. Значит, существую.']],
        ['Лягушка', 'frog', '#27522a', 38.2, 15.6, ['Ква. Это перевод с английского.', 'Это было смешно в 2016-м. И сейчас смешно.']]
      ].forEach(([name, h, col, x, z, lines], i) => {
        const head = heads[h](); head.position.y = 1.66;
        const g = person(col, { head }); g.position.set(x, 0, z); g.rotation.y = -Math.PI * (.2 + i * .3);
        const n = addNpc(r, g, { name, lines, pitch: 500 + i * 90 }); n.dancer = i;
      });
    }
    for (const th of r.things) if (th.at && !th.noSpark && !Save.seen[th.id]) sparkle(r, th);
  }

  const starTex = (() => {
    const c = Art.cv(32, 32), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(15, 3, 2, 26); g.fillRect(3, 15, 26, 2); g.fillRect(13, 13, 6, 6);
    return new T.CanvasTexture(c);
  })();
  const starMat = new T.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, depthTest: true, color: '#fff' });
  function sparkle(r, th) { const s = new T.Sprite(starMat); s.position.copy(th.at); s.scale.setScalar(.16); r.group.add(s); th.spark = s; }
  SHARED.add(starMat);

  // --- сад слов и свечи ------------------------------------------------------------------------

  const SAMPLE = ['мама', 'дедлайн', 'wifi', 'скучаю', 'база', 'кот', 'понедельник', 'лол', 'домой', 'спасибо', 'ctrl+z', 'тревога'];
  function plantSprite(word) {
    const h = hashStr(word), r = seeded(h), kind = h % 5, H = 18 + Math.floor(r() * 16), W = 21;
    const cv = Art.cv(W, H + 8), g = cv.getContext('2d'), base = H + 7, cx = 10, pick = l => l[Math.floor(r() * l.length)];
    const px = (c, x, y, w = 1, hh = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, hh); };
    const leaf = pick(['#55ff8c', '#2fd06a', '#9dff7a']), bloom = pick(['#ffd23f', '#35e6dc', '#ff7ab0', '#e7ffe9', '#ff9a3c']);
    if (kind === 0) {
      for (let y = 0; y < H - 4; y++) px(leaf, cx + Math.round(Math.sin(y * .3)), base - y);
      px(leaf, cx + 1, base - 5, 3, 1); px(leaf, cx - 3, base - 8, 3, 1);
      const ty = base - H + 2;
      [[0, -3], [0, 3], [-3, 0], [3, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([a, b]) => px(bloom, cx + a - 1, ty + b - 1, 3, 3));
      px('#0b1f12', cx - 1, ty - 1, 3, 3);
    } else if (kind === 1) {
      px('#8ae0a0', cx - 1, base - H + 8, 3, H - 8);
      for (let i = 0; i < 26; i++) { const a = r() * TAU, d = r() * 8; px(r() > .8 ? bloom : leaf, cx + Math.cos(a) * d * 1.1, base - H + 7 + Math.sin(a) * d * .8, 2, 2); }
    } else if (kind === 2) {
      px('#e7ffe9', cx - 1, base - H * .6, 3, H * .6);
      px(bloom, cx - 7, base - H * .6 - 4, 15, 4); px(bloom, cx - 5, base - H * .6 - 6, 11, 2);
      px('#0b1f12', cx - 3, base - H * .6 - 3, 2, 1); px('#0b1f12', cx + 3, base - H * .6 - 4, 2, 1);
    } else if (kind === 3) {
      for (let y = 0; y < H - 2; y++) {
        const x = cx + Math.round(y * y / H / 2.2); px(leaf, x, base - y);
        if (y % 2 === 0) { const l = Math.round((H - y) / 3); px(leaf, x - l, base - y, l, 1); px(leaf, x + 1, base - y, l, 1); }
      }
    } else {
      px(leaf, cx - 2, base - H + 3, 5, H - 3); px(leaf, cx - 6, base - H * .6, 2, 7); px(leaf, cx - 5, base - H * .6 + 6, 4, 2);
      px(leaf, cx + 5, base - H * .7, 2, 6); px(leaf, cx + 3, base - H * .7 + 5, 3, 2); px(bloom, cx - 1, base - H + 1, 3, 2);
    }
    return cv;
  }
  function plant(r, word, fresh) {
    const h = hashStr(word + (fresh ? fresh : '')), cv = plantSprite(word), t = World.tex(cv, { nearest: true });
    const k = .075, x = -15.5 + h % 1000 / 1000 * 10, z = 1 + (h >>> 10) % 1000 / 1000 * 7;
    const s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false, alphaTest: .4 }));
    s.center.set(.5, 0); s.scale.set(cv.width * k, cv.height * k, 1); s.position.set(x, 0, z); r.group.add(s);
    const tag = textSprite(word, '#9dffbd', .9); tag.position.set(x, cv.height * k + .16, z); tag.visible = false; r.group.add(tag);
    const p = { s, tag, full: s.scale.clone(), born: fresh ? performance.now() : 0, x, z, word };
    r.plants.push(p);
    return p;
  }
  function plantAll(r) {
    [...SAMPLE, ...Save.words.slice(-28).map(w => w.s)].forEach(w => plant(r, w));
  }
  const flameMat = new T.SpriteMaterial({ map: World.glowTex, color: '#ffb35a', transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  SHARED.add(flameMat);
  function candles(r) {
    r.flames = [];
    const wax = flat('#efe6d8'), geo = new T.CylinderGeometry(.02, .02, .16, 8);
    World.GRAVES.forEach(gr => {
      const n = Math.min(5, (gr.secret ? 0 : hashStr(gr.id) % 3) + (Save.candles[gr.id] ? 1 : 0));
      for (let i = 0; i < n; i++) addCandle(r, gr, i, wax, geo);
    });
  }
  function addCandle(r, gr, i, wax, geo) {
    const x = gr.x - .32 + i * .16, z = gr.z + .2 + (i % 2) * .08;
    const c = new T.Mesh(geo || new T.CylinderGeometry(.02, .02, .16, 8), wax || flat('#efe6d8')); c.position.set(x, .18, z); r.group.add(c);
    const f = new T.Sprite(flameMat); f.position.set(x, .3, z); f.scale.setScalar(.2); r.group.add(f); f.ph = Math.random() * 9;
    r.flames.push(f);
  }

  // --- ходьба -----------------------------------------------------------------------------------

  const roomAt = (x, z) => ROOMS.find(h => x >= h.x0 && x <= h.x1 && z >= h.z0 && z <= h.z1);
  function free(x, z) {
    let ok = ROOMS.some(h => x > h.x0 + PR && x < h.x1 - PR && z > h.z0 + PR && z < h.z1 - PR && (!h.round || Math.hypot(x - h.round.x, z - h.round.z) < h.round.a - PR));
    if (!ok) ok = PASS.some(p => {
      if (p.closed) return false;
      const along = p.axis === 'x' ? x : z, across = p.axis === 'x' ? z : x;
      return along > p.s0 - PR - .6 && along < p.s1 + PR + .6 && Math.abs(across - p.c) < p.w / 2 - PR + .04;
    });
    if (!ok) return false;
    const h = roomAt(x, z);
    return !h || !h.block.some(b => x > b.x0 - PR && x < b.x1 + PR && z > b.z0 - PR && z < b.z1 + PR);
  }
  function crosses(a, b, r) {
    let t0 = 0, t1 = 1;
    for (const [p, d, lo, hi] of [[a.x, b.x - a.x, r.x0 - PR, r.x1 + PR], [a.z, b.z - a.z, r.z0 - PR, r.z1 + PR]]) {
      if (Math.abs(d) < 1e-6) { if (p < lo || p > hi) return false; continue; }
      let q0 = (lo - p) / d, q1 = (hi - p) / d;
      if (q0 > q1) [q0, q1] = [q1, q0];
      t0 = Math.max(t0, q0); t1 = Math.min(t1, q1);
      if (t0 > t1) return false;
    }
    return true;
  }
  function around(a, b, h) {
    const out = [];
    let cur = a;
    const pad = PR + .28, gap = q => Math.hypot((q.x0 + q.x1) / 2 - a.x, (q.z0 + q.z1) / 2 - a.z);
    for (const r of [...h.block].sort((p, q) => gap(p) - gap(q))) {
      if (!crosses(cur, b, r)) continue;
      // Длинная преграда у стены обходится только со свободного конца.
      if (r.x1 - r.x0 > 2 * (r.z1 - r.z0) + 1) {
        const xs = [r.x0 - pad, r.x1 + pad].filter(x => x > h.x0 + .45 && x < h.x1 - .45);
        if (!xs.length) continue;
        const x = xs.sort((p, q) => Math.abs(cur.x - p) + Math.abs(b.x - p) - Math.abs(cur.x - q) - Math.abs(b.x - q))[0];
        const near = cur.z < r.z0 ? r.z0 - pad : r.z1 + pad, far = cur.z < r.z0 ? r.z1 + pad : r.z0 - pad;
        out.push({ x, z: near }, { x, z: far });
        cur = out[out.length - 1];
        continue;
      }
      const zs = [r.z0 - pad, r.z1 + pad].filter(z => z > h.z0 + .45 && z < h.z1 - .45);
      if (!zs.length) continue;
      const z = zs.sort((p, q) => Math.abs(cur.z - p) + Math.abs(b.z - p) - Math.abs(cur.z - q) - Math.abs(b.z - q))[0];
      const near = cur.x < r.x0 ? r.x0 - pad : r.x1 + pad, far = cur.x < r.x0 ? r.x1 + pad : r.x0 - pad;
      out.push({ x: near, z }, { x: far, z });
      cur = out[out.length - 1];
    }
    return out;
  }
  function route(a, b) {
    const from = roomAt(a.x, a.z), to = roomAt(b.x, b.z);
    if (!from || !to) return [{ x: b.x, z: b.z }];
    const prev = { [from.id]: null }, list = [from];
    while (list.length) {
      const q = list.shift();
      if (q === to) break;
      for (const l of q.links) if (!(l.to in prev)) { prev[l.to] = { from: q, p: l.p }; list.push(R[l.to]); }
    }
    const steps = [];
    for (let k = to; prev[k.id]; k = prev[k.id].from) steps.unshift({ room: k, ...prev[k.id] });
    const pts = [];
    let cur = { x: a.x, z: a.z };
    for (const st of steps) {
      const p = st.p, forward = p.a === st.from.id;
      const inS = forward ? p.s0 - .55 : p.s1 + .55, outS = forward ? p.s1 + .55 : p.s0 - .55;
      const inPt = p.axis === 'x' ? { x: inS, z: p.c } : { x: p.c, z: inS }, outPt = p.axis === 'x' ? { x: outS, z: p.c } : { x: p.c, z: outS };
      pts.push(...around(cur, inPt, st.from), inPt, outPt);
      cur = outPt;
    }
    pts.push(...around(cur, b, to), { x: b.x, z: b.z });
    return pts;
  }
  function stepAlong(o, dt, speed) {
    if (!o.path.length) return false;
    const n = o.path[0], dx = n.x - o.x, dz = n.z - o.z, d = Math.hypot(dx, dz);
    if (d < .12) { o.path.shift(); return !!o.path.length; }
    const s = Math.min(d, speed * dt), nx = o.x + dx / d * s, nz = o.z + dz / d * s;
    if (free(nx, nz)) { o.x = nx; o.z = nz; }
    else if (free(nx, o.z)) o.x = nx;
    else if (free(o.x, nz)) o.z = nz;
    else o.path.shift();
    o.heading = Math.atan2(dz, dx);
    return true;
  }
  const fwd = (yaw, pitch) => new T.Vector3(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch));

  // --- реплики, находки, тосты -------------------------------------------------------------------

  let sayT = 0, sayText = '', sayCh = 0, sayPitch = 440, sayHold = 0;
  function say(name, text, pitch = 440, hold) {
    $('sayName').textContent = name; sayText = text; sayCh = 0; sayPitch = pitch;
    sayHold = hold || Math.max(3.2, text.length * .07);
    sayT = 0; $('say').classList.add('on');
  }
  function sayTick(dt) {
    if (!$('say').classList.contains('on')) return;
    if (sayCh < sayText.length) {
      const b = Math.floor(sayCh); sayCh += dt * 42;
      if (Math.floor(sayCh) > b && b % 2 === 0) Snd.blip(sayPitch);
      $('sayLine').textContent = sayText.slice(0, Math.floor(sayCh));
    } else { sayT += dt; if (sayT > sayHold) $('say').classList.remove('on'); }
  }
  let toastT = 0;
  function toast(s, sub) {
    const t = $('toast'); t.textContent = s;
    if (sub) { const e = document.createElement('small'); e.textContent = sub; t.appendChild(e); }
    t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3800);
  }
  const findCount = () => Object.keys(Save.finds).length;
  function paintFinds() { $('mapN').hidden = !World.EXTRAS; $('mapN').textContent = findCount(); if (World.EXTRAS) $('mapBtn').setAttribute('aria-label', `Карта, находки ${findCount()} из ${Object.keys(FINDS).length}`); }
  function find(id) {
    if (!World.EXTRAS || Save.finds[id]) return;
    Save.finds[id] = Date.now(); persist(); paintFinds();
    toast('✦ ' + FINDS[id].t, `Находка ${findCount()} из ${Object.keys(FINDS).length}`);
    Snd.sfx('find');
  }
  function fade(fn) {
    const f = $('fade'); f.classList.add('on');
    setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 90); }, 320);
  }
  function teleport(x, z, yaw) {
    P.x = x; P.z = z; P.y = World.floorY(x, z); P.yaw = yaw; P.pitch = 0; P.path = []; P.face = null; P.goal = null;
    near = null; $('cap').classList.remove('on');
    enterRoom(roomAt(x, z), true);
  }

  // --- действия с предметами ---------------------------------------------------------------------

  let catPets = 0, ventTries = 0, sonLine = 0, dadLine = 0, djMix = 0;
  const Acts = {
    robot() {
      const hour = new Date().getHours(), hello = hour < 6 ? 'Доброй ночи. Смотритель спит, можно шуметь.' : hour < 12 ? 'Доброе утро. Кофе в музее нарисованный.' : hour < 18 ? 'Добрый день. Билет настоящий, не сомневайся.' : 'Добрый вечер. Самое время посмотреть на искусство и лечь спать в три.';
      const lines = [Save.visits > 1 ? `Визит №${Save.visits}. ${hello}` : hello, TODAY.news, 'Нажимай на всё, что блестит. Пока оно блестит, оно не изучено.', 'За маленькой дверью на севере кто-то не выигрывает.'];
      if (findCount() === Object.keys(FINDS).length) lines.unshift('Все находки собраны. Выдаю корону. Она ни на что не влияет.');
      Acts.robotI = ((Acts.robotI == null ? -1 : Acts.robotI) + 1) % lines.length;
      say('Касса-9000', lines[Acts.robotI], 520);
    },
    cat() {
      catPets++;
      say('Кот', catPets === 1 ? 'Мрр.' : catPets === 2 ? 'Кот разрешает погладить его ещё один раз.' : catPets === 3 ? 'Кот признал тебя. Это высшая награда в современном искусстве.' : 'Кот занят. У него встреча с другим котом.', 900);
      if (catPets === 3) find('cat');
    },
    vent() {
      ventTries++;
      if (ventTries === 1 && !Save.finds.vent) { say('Ты', 'Решётка держится на одном винте. Из щели пахнет офисным ковролином.', 420); return; }
      find('vent');
      fade(() => teleport(49.9, 5.4, -2.4));
    },
    banana() {
      if (Save.banana === DAY_N) { say('Этикетка', 'На стене остался только скотч. Смотритель утверждает, что теперь это сильнее.', 500); return; }
      Sheet.choice('Банан на скотче', 'Лот №1. Оценка: один лайк. Этикетка просит не трогать.', 'Съесть', () => {
        Save.banana = DAY_N; persist();
        R.a.banana.children[0].visible = false;
        find('banana');
        say('Смотритель', 'ЭТО БЫЛА ИНСТАЛЛЯЦИЯ! …ладно. До завтра привезут новую.', 260);
      });
    },
    poster() { Sheet.panel('Атриум', 'Открытый опен-колл', ['Три зала по десять работ. Художник загружает работу сам, мы только развешиваем.', 'Дальше колонны, южнее ночь, за шкафом мемы. Планы здесь меняются.'], 'Авторы и работы в прототипе вымышленные. Здесь появятся настоящие независимые художники.'); },
    doorB() { say('Ты', World.level ? 'Дверь нарисована. Совсем недавно: краска ещё пахнет ковром.' : 'Заперто. Изнутри слышно, как кто-то обновляет страницу.', 420); },
    admin() { find('admin'); Sheet.admin(); },
    dad() {
      const l = ['Are you winning, son?', 'Я в компьютерах не понимаю, но ты там давай.', 'В наше время побеждали во дворе.', 'Сынок, мать зовёт есть. Если выиграешь, скажи.'];
      say('Отец', l[dadLine++ % l.length], 240);
      if (dadLine % l.length === 1) Voice.win();
    },
    son() {
      const l = ['Нет, пап.', 'Тут грустная песня. Не мешай.', 'Я не выиграл. Я просто лежу.', 'Минус двадцать пять рейтинга.', '…', 'Закрой дверь, пожалуйста.'];
      say('Сын', l[sonLine++ % l.length], 700);
      if (sonLine === 2) find('son');
    },
    pc() { say('Монитор', 'Поражение. Новая игра через 12 секунд. Сын об этом ещё не знает.', 620); },
    closet() { toast('Шкаф оказался глубже, чем казался.'); P.path = route(P, { x: 12.2, z: -16.2 }); P.goal = null; },
    memes() { Sheet.meme(); },
    dj() {
      djMix = (djMix + 1) % 3;
      const id = ['dance', 'dance2', 'dance3'][djMix];
      Snd.play(id);
      say('DJ Хомяк', 'Следующий трек: «' + ['Хаус для тех, кто не спит', 'Дедлайн-техно', 'Диско на 56 кбит/с'][djMix] + '».', 980);
    },
    kiosk() { Sheet.plant(); },
    snake() { Sheet.game('snake'); },
    pinball() { Sheet.game('pinball'); },
    firewall() { Sheet.game('firewall'); },
    antivirus() { Sheet.game('antivirus'); },
    loading() { Sheet.game('loading'); }
  };
  function act(th) {
    if (th.id && !th.npc && !Save.seen[th.id]) { Save.seen[th.id] = 1; persist(); if (th.spark) { th.spark.visible = false; } }
    if (th.tomb) return Sheet.tomb(th.tomb, th);
    if (th.npc) {
      const n = th.npc;
      n.path = []; n.wait = 6;
      const line = n.fn ? n.fn()[0] : n.lines[n.seq++ % n.lines.length];
      return say(n.label, line, n.pitch);
    }
    if (th.lines) { th.i = (th.i || 0); return say(th.label, th.lines[th.i++ % th.lines.length], 700); }
    (Acts[th.id] || (() => {}))();
  }

  // --- ввод -------------------------------------------------------------------------------------

  const ray = new T.Raycaster(), ndc = new T.Vector2(), view = $('view');
  function pick(cx, cy) {
    ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const list = [];
    for (const r of ROOMS) if (r.state === 'ready' && r.group.visible) {
      list.push(...r.pick.art, ...r.pick.walls, ...r.pick.floors);
      for (const t of r.pick.things) list.push(t);
    }
    for (const p of PASS) list.push(p.floor);
    const vis = o => { for (let q = o; q; q = q.parent) if (!q.visible && !(q.isMesh && q.material.visible === false)) return false; return true; };
    const hits = ray.intersectObjects(list, true).filter(h => vis(h.object) && h.object.visible !== false);
    for (const h of hits) { const t = h.object.userData.thing; if (t && t.when && !t.when()) continue; return h; }
    return null;
  }

  let ptr = null, drawOn = false, colour = '#e8352e', eraser = false, strokes = 0;
  const keys = new Set();
  view.addEventListener('pointerdown', e => {
    if (ptr || Sheet.open_) return;
    Snd.start(); Voice.unlock();
    view.setPointerCapture(e.pointerId);
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, paint: false, last: null };
    if (drawOn) {
      const hit = pick(e.clientX, e.clientY);
      if (hit && hit.object.userData.wall) { ptr.paint = hit.object.userData.wall; dab(ptr, hit); }
    }
  });
  view.addEventListener('pointermove', e => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved += Math.abs(dx) + Math.abs(dy);
    if (ptr.paint) {
      const hit = pick(e.clientX, e.clientY);
      if (hit && hit.object.userData.wall === ptr.paint) dab(ptr, hit); else ptr.last = null;
      return;
    }
    if (ptr.moved < 8) return;
    P.yaw -= dx * .0042; P.pitch = clamp(P.pitch + dy * .0034, -.7, .7); P.face = null;
    hideHint();
  });
  view.addEventListener('pointerup', e => {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (ptr.paint) { World.savePaint(ptr.paint); strokes++; Snd.sfx('spray'); if (strokes === 5) find('wall'); }
    else if (ptr.moved < 10 && performance.now() - ptr.t < 500) tap(e.clientX, e.clientY);
    ptr = null;
  });
  view.addEventListener('pointercancel', () => { ptr = null; });

  let tapAt = 0;
  function tap(cx, cy) {
    const hit = pick(cx, cy);
    if (!hit) return;
    // Два быстрых нажатия дают бег: на телефоне нет клавиши Shift.
    const now = performance.now();
    P.run = now - tapAt < 340; tapAt = now;
    const o = hit.object, th = o.userData.thing;
    hideHint();
    if (th) {
      const sp = th.spot || (th.npc ? { x: th.npc.x, z: th.npc.z } : null), d = sp ? Math.hypot(P.x - sp.x, P.z - sp.z) : 0;
      const direct = hit.distance < 3.4 || !sp || d < 1.2;
      if (direct) return act(th);
      P.path = route(P, th.npc ? nearPoint(sp) : sp); P.goal = th; P.face = null;
      return;
    }
    if (o.userData.work) {
      return Sheet.work(o.userData.work);
    }
    if (o.userData.wall) {
      if (drawOn) return;
      const n = o.userData.wall.normal;
      return walkTo({ x: hit.point.x + n.x * .9, z: hit.point.z + n.z * .9 });
    }
    walkTo({ x: hit.point.x, z: hit.point.z });
  }
  function nearPoint(sp) { const d = Math.hypot(P.x - sp.x, P.z - sp.z) || 1; return { x: sp.x + (P.x - sp.x) / d * 1.2, z: sp.z + (P.z - sp.z) / d * 1.2 }; }
  function walkTo(p, work) { P.path = route(P, p); P.goal = null; P.face = work || null; marker(p); }
  const ring = new T.Mesh(new T.RingGeometry(.2, .24, 32), new T.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; scene.add(ring);
  let ringT = 9;
  function marker(p) { ring.position.x = p.x; ring.position.z = p.z; ringT = 0; }
  function hideHint() { $('hint').classList.add('off'); }

  addEventListener('keydown', e => {
    if (Sheet.isOpen()) { if (e.key === 'Escape') Sheet.close(); return; }
    keys.add(e.code);
    if (e.code === 'KeyE' && near) near.open();
    if (e.code === 'KeyR') toggleDraw();
    if (e.code === 'KeyM') Sheet.map();
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  const shifted = () => keys.has('ShiftLeft') || keys.has('ShiftRight');
  function keyMove(dt) {
    const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const s = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    if (!f && !s) return false;
    P.path = []; P.face = null; P.goal = null; hideHint();
    const hx = Math.cos(P.yaw) * f - Math.sin(P.yaw) * s, hz = Math.sin(P.yaw) * f + Math.cos(P.yaw) * s, l = Math.hypot(hx, hz);
    const v = (shifted() ? 5.4 : 3) * dt / l, nx = P.x + hx * v, nz = P.z + hz * v;
    if (free(nx, nz)) { P.x = nx; P.z = nz; } else if (free(nx, P.z)) P.x = nx; else if (free(P.x, nz)) P.z = nz;
    return true;
  }

  function dab(p, hit) {
    const w = p.paint, x = Math.floor(hit.uv.x * w.paint.width), y = Math.floor((1 - hit.uv.y) * w.paint.height);
    const from = p.last || { x, y }, n = Math.max(Math.abs(x - from.x), Math.abs(y - from.y), 1);
    for (let i = 0; i <= n; i++) {
      const q = Math.round(from.x + (x - from.x) * i / n), r = Math.round(from.y + (y - from.y) * i / n);
      if (eraser) w.pg.clearRect(q - 1, r - 1, 3, 3); else { w.pg.fillStyle = colour; w.pg.fillRect(q, r, 2, 2); }
    }
    p.last = { x, y };
    w.touch();
  }
  function toggleDraw() {
    drawOn = !drawOn;
    $('draw').setAttribute('aria-pressed', drawOn); $('palette').hidden = !drawOn;
    view.classList.toggle('drawing', drawOn);
    if (drawOn) toast('Рисуй на любой стене. Каждая клетка здесь 4 × 4 см.');
  }
  $('draw').onclick = toggleDraw;
  // Экран выбора: модель висит перед камерой и медленно вращается в настоящей сцене.
  let pv = null, pvKind = null;
  function preview(kind) {
    if (pv) scene.remove(pv);
    pvKind = kind; Save.skin = kind; persist();
    pv = Avatars.make(kind); pv.body.position.y = 0; pv.body.rotation.y = 0;
    const tag = textSprite(Avatars.nick(), null, .7); tag.position.y = .5; pv.add(tag);
    scene.add(pv);
    document.querySelectorAll('#pickRow button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === kind));
  }
  function openPick() {
    near = null; $('cap').classList.remove('on');
    $('pick').hidden = false; document.body.classList.add('focusing');
    Sheet.open_ = true; Sheet.live = true;
    preview(Save.skin || 'monitor');
    Sheet.onClose = () => { $('pick').hidden = true; scene.remove(pv); pv = null; };
  }
  Object.entries(Avatars.KINDS).forEach(([k, q]) => {
    const b = document.createElement('button'); b.textContent = q.name; b.type = 'button'; b.dataset.k = k; b.onclick = () => preview(k); $('pickRow').appendChild(b);
  });
  $('pickGo').onclick = () => Sheet.close();
  $('skinBtn').onclick = openPick;
  const paintSound = () => { $('snd').classList.toggle('off', !!Save.muted); $('snd').setAttribute('aria-label', Save.muted ? 'Включить звук' : 'Выключить звук'); $('snd').setAttribute('aria-pressed', !Save.muted); };
  $('snd').onclick = () => { Snd.start(); Snd.setMuted(!Save.muted); paintSound(); };
  $('mapBtn').onclick = () => { Snd.start(); Voice.unlock(); Sheet.map(); };

  // --- листы поверх мира -------------------------------------------------------------------------

  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const Sheet = {
    open_: false, tick: null, onClose: null, live: false,
    isOpen() { return this.open_; },
    show(nodes, cls, onClose) {
      const box = $('sBody'); box.textContent = ''; box.className = cls || '';
      nodes.forEach(n => box.appendChild(n));
      $('sheet').hidden = false; this.open_ = true; this.tick = null; this.onClose = onClose || null;
    },
    close() {
      $('sheet').hidden = true; $('focus').hidden = true; document.body.classList.remove('focusing'); this.open_ = false; this.live = false; this.tick = null;
      const f = this.onClose; this.onClose = null; if (f) f();
    },
    btn(label, cls, fn) { const b = el('button', 'btn ' + (cls || ''), label); b.type = 'button'; b.onclick = fn; return b; },
    // Камера подлетает к работе, сцена продолжает жить под подписью.
    work(w) {
      P.path = []; P.goal = null; P.face = null; hideHint();
      const from = camera.position.clone(), fromD = camera.getWorldDirection(new T.Vector3());
      P.x = w.spot.x; P.z = w.spot.z;
      P.yaw = Math.atan2(w.look.z - P.z, w.look.x - P.x); P.pitch = clamp(Math.atan2(w.look.y - 1.6, Math.hypot(w.look.x - P.x, w.look.z - P.z)), -.3, .3);
      const span = 2 * Math.tan(camera.fov * Math.PI / 360);
      const d = Math.max(w.hgt / (.58 * span), w.wid / (.72 * span * camera.aspect), .9);
      const y = w.v - w.hgt * .18, aim = w.wall.at(w.u, y, w.depth), to = w.wall.at(w.u, y, w.depth + d);
      to.x = clamp(to.x, room.x0 + .2, room.x1 - .2); to.z = clamp(to.z, room.z0 + .2, room.z1 - .2);
      zoom = { a: from, ad: fromD, b: to, bd: aim.clone().sub(to).normalize(), k: 0, dir: 1 };
      near = null; $('cap').classList.remove('on');
      $('fT').textContent = w.t; $('fD').textContent = w.d;
      $('fA').textContent = w.a; $('fH').textContent = R[w.hall].name; $('fM').textContent = w.m + (w.y ? ', ' + w.y : '');
      const log = () => {
        const list = $('fLog'), r = Art.rng(w.key.length * 41 + w.t.length), said = ['база', 'жиза', 'зачем', 'мама?', 'это я', 'плачу', 'кринж', 'хочу домой', 'красиво', 'лол', 'понял', 'не понял'], who = ['user8841', 'oldforum', 'nastya.exe', 'tmp_file_2', 'лена.жпег'];
        list.textContent = '';
        const rows = [0, 1, 2].map(() => [who[Math.floor(r() * who.length)], said[Math.floor(r() * said.length)]]);
        w.words.forEach(s => rows.push(['ты', s]));
        rows.slice(-3).forEach(([a, s]) => { const li = el('li'); li.append(el('b', '', a), el('span', '', `след: ${s}`)); list.appendChild(li); });
      };
      log();
      const form = $('fForm'), inp = $('fIn');
      form.hidden = true; $('fWord').hidden = false; inp.value = '';
      $('fWord').onclick = () => { $('fWord').hidden = true; form.hidden = false; inp.focus(); };
      form.onsubmit = e => { e.preventDefault(); const v = inp.value.trim().split(/\s+/)[0]; if (!v) return; w.words.push(v.slice(0, 16)); inp.value = ''; form.hidden = true; $('fWord').hidden = false; log(); };
      $('focus').hidden = false; document.body.classList.add('focusing'); this.open_ = true; this.live = true;
      this.onClose = () => {
        if (!zoom) return;
        zoom.a = base.clone(); zoom.ad = baseDir.clone(); zoom.dir = -1;
      };
      let stare = 0;
      this.tick = dt => { stare += dt; if (w.key === 'spin' && stare > 12) find('square'); };
    },
    game(id) {
      const g = Arcade.make(id);
      this.sticky = true;
      this.show(g.nodes, g.cls, () => { this.sticky = false; g.close(); });
      this.tick = g.tick;
    },
    panel(eyebrow, title, paras, note, extra) {
      const nodes = [el('p', 'eye', eyebrow), el('h2', '', title), ...paras.map(t => el('p', 'txt', t))];
      if (note) nodes.push(el('p', 'note', note));
      if (extra) nodes.push(...extra);
      this.show(nodes, 'panel');
    },
    choice(title, body, yes, fn) {
      const row = el('div', 'row'); row.append(this.btn(yes, '', () => { this.close(); fn(); }), this.btn('Не сейчас', 'alt', () => this.close()));
      this.panel('Экспонат', title, [body], null, [row]);
    },
    tomb(gr, th) {
      const n = () => (gr.secret ? 0 : hashStr(gr.id) % 3) + (Save.candles[gr.id] ? 1 : 0);
      const lit = () => !!Save.candles[gr.id];
      const b = this.btn('', '', () => {
        if (lit()) return;
        Save.candles[gr.id] = 1; persist();
        if (R.g.state === 'ready') addCandle(R.g, gr, n() - 1);
        Snd.sfx('candle'); paint();
      });
      const paint = () => { b.textContent = lit() ? `Свеча горит · всего ${n()}` : `Зажечь свечу · ${n()}`; b.classList.toggle('on', lit()); };
      paint();
      if (gr.secret) find('grave');
      const row = el('div', 'row'); row.append(b);
      this.panel('Здесь покоится', gr.name, [gr.e], gr.years, [row]);
    },
    meme() {
      const c = el('canvas', 'memeCv'); c.width = 640; c.height = 480;
      let cur = -1, t = 0;
      const next = () => { let i; do { i = Math.floor(Math.random() * Art.MEMES.length); } while (i === cur); cur = i; Art.memeInto(c, Art.MEMES[i], t); Snd.sfx('tap'); };
      next();
      const row = el('div', 'row'); row.append(this.btn('Ещё мем', '', next));
      this.panel('Мем-автомат, 1 жетон = 0 рублей', 'Свежий мем', [], null, [c, row]);
    },
    plant() {
      const inp = el('input'); inp.maxLength = 20; inp.placeholder = 'одно слово'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Слово');
      const form = el('form', 'field'), go = this.btn('Посадить', '', () => {}); go.type = 'submit'; form.append(inp, go);
      form.onsubmit = e => {
        e.preventDefault();
        const w = inp.value.replace(/\s+/g, ' ').trim().slice(0, 20);
        if (!w) return inp.focus();
        const stamp = Date.now();
        Save.words.push({ s: w, t: stamp }); persist();
        find('word'); Snd.sfx('plant'); this.close();
        const p = plant(R.g, w, stamp);
        p.tag.visible = true;
        P.face = { look: new T.Vector3(p.x, 1, p.z) };
        walkTo({ x: p.x + 1.2, z: p.z - 1 }, P.face);
        say('Садовый терминал', 'Проросло. Слово теперь видят все, кто заходит в сад.', 760);
      };
      this.panel('Садовый терминал', 'Посади слово', ['Одно слово вырастет в растение. Вид растения зависит от самого слова.'], null, [form]);
      setTimeout(() => inp.focus(), 60);
    },
    admin() {
      const out = el('p', 'tech', 'root@netizen:~# _'), row = el('div', 'row');
      [['Очистить интернет', 'Отказано: интернет уже очищен в 2006 году.'], ['Вернуть Flash', 'Требуется разрешение. Запросить его можно через Flash.'], ['Выключить понедельники', 'Ошибка: зависимость «работа» не удовлетворена.']]
        .forEach(([l, r]) => row.append(this.btn(l, 'alt', () => { out.textContent = r; Snd.sfx('deny'); })));
      this.panel('Комната администратора', 'Панель управления всем', ['Ты дошёл до пятого уровня. Сюда попадает примерно никто. Все кнопки подключены, просто никогда не срабатывают.'], null, [out, row]);
    },
    map() {
      const c = el('canvas', 'mapCv'), g = c.getContext('2d'), scale = 2, W = 560, H = innerWidth < innerHeight ? 700 : 440;
      c.width = W * scale; c.height = H * scale;
      const x0 = Math.min(...ROOMS.map(r => r.x0)) - 1, x1 = Math.max(...ROOMS.map(r => r.x1)) + 1, z0 = Math.min(...ROOMS.map(r => r.z0)) - 1, z1 = Math.max(...ROOMS.map(r => r.z1)) + 1, s = Math.min(W / (x1 - x0), H / (z1 - z0)) * scale;
      const px = x => (x - x0) * s, pz = z => (z - z0) * s;
      const boxes = [];
      g.font = `500 ${11 * scale}px ${Art.MONO}`; g.textAlign = 'center';
      for (const p of PASS) {
        if (!Save.rooms[p.a] && !Save.rooms[p.b]) continue;
        g.fillStyle = '#6a6862';
        if (p.axis === 'x') g.fillRect(px(p.s0 - .5), pz(p.c - p.w / 2), (p.s1 - p.s0 + 1) * s, p.w * s); else g.fillRect(px(p.c - p.w / 2), pz(p.s0 - .5), p.w * s, (p.s1 - p.s0 + 1) * s);
      }
      for (const r of ROOMS) {
        const seen = Save.rooms[r.id], near = !seen && r.links.some(l => Save.rooms[l.to]);
        if (!seen && !near) continue;
        const x = px(r.x0), y = pz(r.z0), w = (r.x1 - r.x0) * s, h = (r.z1 - r.z0) * s;
        g.beginPath(); if (r.round) g.arc(x + w / 2, y + h / 2, w / 2, 0, 7); else g.rect(x, y, w, h);
        g.fillStyle = r === room ? '#ece9e2' : seen ? '#2a2b31' : '#121317'; g.fill();
        g.strokeStyle = '#6a6862'; g.lineWidth = scale; g.stroke();
        g.fillStyle = r === room ? '#111' : seen ? '#ece9e2' : '#6a6862';
        const nm = seen ? r.name : '?';
        const lines = nm.length > 10 && w < 150 * scale ? nm.split(' ') : [nm];
        lines.forEach((l, i) => g.fillText(l, x + w / 2, y + h / 2 + (i - lines.length / 2 + .7) * 13 * scale));
        if (seen) boxes.push({ r, x, y, w, h });
      }
      g.fillStyle = '#2f5bff'; g.beginPath(); g.arc(px(P.x), pz(P.z), 6 * scale, 0, 7); g.fill();
      c.onclick = e => {
        const b = c.getBoundingClientRect(), mx = (e.clientX - b.left) / b.width * c.width, my = (e.clientY - b.top) / b.height * c.height;
        const hit = boxes.find(q => mx > q.x && mx < q.x + q.w && my > q.y && my < q.y + q.h);
        if (!hit || hit.r === room) return;
        this.close(); travel(hit.r);
      };
      const head = [el('p', 'eye', `Визит №${Save.visits}. Нажми на комнату, чтобы перейти`), c];
      if (!World.EXTRAS) return this.show(head, 'panel wide');
      const finds = el('div', 'finds');
      Object.entries(FINDS).forEach(([k, f]) => { const got = !!Save.finds[k], d = el('div', 'find' + (got ? '' : ' off')); d.append(el('i', '', got ? f.i : '?'), got ? f.t : f.h); finds.appendChild(d); });
      this.show([...head, el('h2', '', `Находки ${findCount()}/${Object.keys(FINDS).length}`), finds], 'panel wide');
    }
  };
  $('sClose').onclick = () => Sheet.close();
  $('fClose').onclick = () => Sheet.close();
  $('sheet').addEventListener('click', e => { if (e.target.id === 'sheet' && !Sheet.sticky) Sheet.close(); });
  $('focus').addEventListener('click', e => { if (e.target.id === 'focus') Sheet.close(); });
  $('hintX').onclick = hideHint;

  const SPAWN = { w: [20, 21.1, 2.25], a: [1.6, -4.2, 0], j: [20.8, .9, 0], b: [37.4, -1.4, 0], c: [14, 9.2, 1.57], d: [8, -8.5, -1.57], e: [6, -14.4, -1.57], f: [22, -9.3, -Math.PI / 2], g: [-2, 0, Math.PI], i: [31.6, 13.5, 0] };
  function travel(r) { fade(() => { World.focus(r); World.flush(); const [x, z, y] = SPAWN[r.id]; teleport(x, z, y); }); }

  // --- подпись поблизости ------------------------------------------------------------------------

  let near = null;
  function nearest() {
    let best = null, bd = 9e9;
    const r = room;
    if (r.state !== 'ready') return;
    for (const w of Art.HANG[r.id] || []) {
      if (!w.look) continue;
      const dx = w.look.x - P.x, dz = w.look.z - P.z, d = Math.hypot(dx, dz);
      if (d > Math.max(3.8, w.wid * 1.5)) continue;
      const nrm = w.wall.normal;
      if ((P.x - w.wall.origin.x) * nrm.x + (P.z - w.wall.origin.z) * nrm.z < 0) continue;
      if ((dx * Math.cos(P.yaw) + dz * Math.sin(P.yaw)) / d < .55) continue;
      if (d < bd) { bd = d; best = { key: w, t: w.t, a: w.a + (w.y ? ', ' + w.y : ''), open: () => Sheet.work(w) }; }
    }
    for (const th of r.things) {
      if (th.noSpark && !th.npc) continue;
      if (th.when && !th.when()) continue;
      const pos = th.npc ? th.npc : th.at;
      if (!pos) continue;
      const dx = pos.x - P.x, dz = pos.z - P.z, d = Math.hypot(dx, dz);
      if (d > 3 || d > bd) continue;
      if ((dx * Math.cos(P.yaw) + dz * Math.sin(P.yaw)) / (d || 1) < .6) continue;
      bd = d; best = { key: th, t: th.label, a: 'нажми', open: () => act(th) };
    }
    if ((best && best.key) !== (near && near.key)) {
      near = best;
      $('cap').classList.toggle('on', !!best);
      if (best) { $('capT').textContent = best.t; $('capA').textContent = best.a; }
    }
  }
  $('cap').onclick = () => near && near.open();

  // --- сцена с отцом -----------------------------------------------------------------------------

  const scn = { t: -1, played: false };
  let gate = null;
  function sonDoor(dt) {
    if (!gate) return;
    const inHall = room.id === 'd';
    if (inHall && !scn.played && P.z < -10.4) { scn.played = true; scn.t = 0; }
    if (room.id === 'e' && Math.hypot(P.x - gate.p.c, P.z - gate.p.s0) < 1.6) gate.want = 1;
    if (room.id === 'a' && scn.played) { scn.played = false; scn.t = -1; gate.want = 0; }
    if (scn.t >= 0) {
      const b = scn.t; scn.t += dt;
      if (b < .15 && scn.t >= .15) { gate.want = 1; Snd.sfx('creak'); if (R.d.dad) R.d.dad.limbs.aR.rotation.x = 1.3; }
      if (b < 1 && scn.t >= 1) { Voice.win(); say('Отец', 'Are you winning, son?', 230, 2.2); }
      if (b < 4.3 && scn.t >= 4.3) { say('Сын', '…', 700, 2); scn.t = -1; }
    }
    const k = 1 - Math.exp(-dt * 2.6);
    gate.open += (gate.want - gate.open) * k;
    gate.pivot.rotation.y = gate.open * 1.75;
    gate.p.closed = gate.open < .55;
  }

  // --- комнаты ----------------------------------------------------------------------------------

  function enterRoom(r, forced) {
    if (!r || r === room && !forced) return;
    room = r;
    World.focus(r);
    if (r.state !== 'ready') World.flush();
    if (!Save.rooms[r.id]) { Save.rooms[r.id] = 1; persist(); }
    $('hallName').textContent = r.sub ? `${r.name}. ${r.sub}` : r.name;
    document.body.dataset.hall = r.id;
    Snd.play(r.id === 'd' ? 'sad' : r.track);
    if (r.id !== 'b') lapA = null;
    audioRoom();
  }
  function audioRoom() {
    if (room.id === 'e') {
      const d = Math.hypot(P.x - 3.6, P.z + 16.8);
      Snd.setLevel(clamp(1.1 - d * .13, .4, 1), clamp(1500 - d * 170, 420, 1400));
    } else if (room.id === 'd') Snd.setLevel(gate.open > .4 ? .34 : .18, gate.open > .4 ? 520 : 240);
    else if (room.id === 'f') Snd.setLevel((M.state === 'wait' ? .3 : 0) * (1 - dancerNear() * .85), 18000);
    else Snd.setLevel(1, 18000);
  }

  World.hooks.loaded = r => {
    spawnPeople(r);
    if (r.banana && Save.banana === DAY_N) r.banana.children[0].visible = false;
    if (r.id === 'b' && (World.level || 0) >= 5) r.adminDoor.visible = true;
  };
  World.hooks.freed = r => {
    if (r.dancer) { danceStop(); r.dancer.video.pause(); r.dancer.video.removeAttribute('src'); r.dancer.video.load(); }
    for (const g of Avatars.shared()) SHARED.add(g);
    r.group.traverse(o => { if (o.geometry && SHARED.has(o.geometry)) o.geometry = new T.BufferGeometry(); if (o.material === starMat || o.material === flameMat || o.material === blobMat || Array.isArray(o.material)) o.material = new T.SpriteMaterial(); });
    near = null;
  };

  // --- кадр -------------------------------------------------------------------------------------

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < h ? 78 : 64; camera.updateProjectionMatrix();
    if (reflOn) rt.setSize(Math.max(2, w * dpr / 2.4 | 0), Math.max(2, h * dpr / 2.4 | 0));
  }
  addEventListener('resize', resize);

  function renderReflection() {
    if (!reflOn || !room.refl) return;
    const f = camera.getWorldDirection(new T.Vector3()), p = camera.position;
    vcam.position.set(p.x, -p.y, p.z);
    vcam.up.set(0, 1, 0).applyQuaternion(camera.quaternion); vcam.up.y *= -1;
    vcam.lookAt(p.x + f.x, -p.y - f.y, p.z + f.z);
    vcam.near = camera.near; vcam.far = camera.far;
    vcam.projectionMatrix.copy(camera.projectionMatrix); vcam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    vcam.updateMatrixWorld();
    reflMatrix.value.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1).multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse);
    const ready = ROOMS.filter(r => r.state === 'ready');
    ready.forEach(r => { r.floor.visible = false; });
    renderer.setRenderTarget(rt); renderer.render(scene, vcam); renderer.setRenderTarget(null);
    ready.forEach(r => { r.floor.visible = true; });
  }

  const base = new T.Vector3(), baseDir = new T.Vector3();
  let zoom = null, last = performance.now(), animT = 0, flick = 1, flickT = 2, frames = 0, tAcc = 0, slow = 0, audioT = 0, lapA = null, lap = 0, danceN = 0, lastBeat = -1, idle = 0, ledT = -1, skip = false;
  const clock0 = last;

  function npcTick(r, dt) {
    for (const n of r.npcs) {
      if (!n.walks) continue;
      let move = false;
      if (n.wait > 0) n.wait -= dt;
      else if (!n.path.length) {
        if (n.wander) n.path = [{ x: -14 + Math.random() * 8, z: 1 + Math.random() * 7 }];
        else { const list = (Art.HANG[r.id] || []).filter(w => w.spot); n.work = list[Math.floor(Math.random() * list.length)]; n.path = route(n, n.work.spot); }
      }
      if (n.wait <= 0) {
        move = stepAlong(n, dt, n.speed);
        if (!move) { n.wait = 7 + Math.random() * 14; n.yaw = n.work && n.work.look ? Math.atan2(n.work.look.z - n.z, n.work.look.x - n.x) : n.yaw; }
        else n.yaw = n.heading;
      }
      n.g.position.set(n.x, World.floorY(n.x, n.z), n.z);
      let dy = -n.yaw - n.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      n.g.rotation.y += dy * (1 - Math.exp(-dt * 6));
      if (n.floats) Avatars.hover(n.g, performance.now() / 1000, move); else animate(n.g, move, dt);
    }
  }

  function danceTick(r, dt, t) {
    const beat = Snd.beat(), f = beat % 1, b = Math.floor(beat);
    for (const n of r.npcs) if (n.dancer != null) {
      const L = n.g.limbs, s = Math.sin(beat * Math.PI), m = n.dancer % 3;
      L.aL.rotation.x = m === 0 ? 2.6 + s * .4 : s * .9; L.aR.rotation.x = m === 1 ? -2.6 - s * .4 : -s * .9;
      L.aL.rotation.z = m === 2 ? s : 0; L.aR.rotation.z = m === 2 ? -s : 0;
      L.lL.rotation.z = s * .24; L.lR.rotation.z = -s * .24;
      n.g.position.y = Math.abs(Math.sin(f * Math.PI)) * .1;
      n.g.rotation.y += dt * (n.dancer % 2 ? .6 : -.5);
    }
    r.ball.rotation.y += dt * .9;
    r.beams.forEach((p, i) => { p.rotation.z = Math.sin(beat * .25 + i * 1.5) * .8; p.rotation.x = Math.cos(beat * .2 + i) * .6; });
    r.hamster.position.y = 1.5 + (b % 2) * .05;
    if (b !== ledT) {
      ledT = b;
      const { g, n, tex: lt } = r.led, pal = ['#ff2e8c', '#7a4dff', '#2fd6ff', '#ffd23f', '#1a1028', '#120b1e'];
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { g.fillStyle = pal[hashStr(i + ':' + j + ':' + (b >> 1)) % 6]; g.fillRect(i, j, 1, 1); }
      lt.needsUpdate = true;
    }
    if (animT === 0) {
      const { g, c } = r.scr, cols = ['#ff2e8c', '#2fd6ff', '#ffd23f', '#7a4dff'], sc = Math.floor(beat / 8) % 4;
      g.fillStyle = '#05040a'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < 30; i++) { const h = Math.abs(Math.sin(i * .9 + beat * .5)) * 150 * (b % 2 ? 1 : .7); g.fillStyle = cols[(sc + (i >> 3)) % 4]; g.fillRect(6 + i * 12, 190 - h, 8, h); }
      g.fillStyle = '#fff'; g.font = `900 64px ${Art.SANS}`; g.textAlign = 'center'; g.fillText(['404', 'NOT FOUND', 'ПИНГ 999', 'LOL'][sc], 180, 112); g.textAlign = 'left';
      r.scr.tex.needsUpdate = true;
    }
    const onFloor = P.x > 32 && P.x < 40 && !P.moving;
    idle = onFloor ? idle + dt : 0;
    if (idle > .5 && b !== lastBeat) { lastBeat = b; danceN++; if (danceN === 32) find('dance'); }
    P.bob = idle > .5 ? Math.abs(Math.sin(f * Math.PI)) * .05 : 0;
  }

  // Сцена «Are you winning, son?»: дверь, голос отца, музыка у сына, пауза 5 секунд и снова.
  // Звук не грузится, пока посетитель не зайдёт в зал. Без звука сцена идёт по тем же таймингам.
  // Кадры отца по таймингу дорожки: удар ногой по двери, реплика, пауза с улыбкой, грусть до конца.
  const KICK_END = 1, TALK_END = 2.7, FROWN_AT = 3.2, VOICE_END = 3.7;
  const M = { state: 'wait', c: 2, buf: null, loading: false, src: null, gain: null, len: 18.9 };
  function memeLoad() {
    if (M.buf || M.loading || !Snd.ctx) return;
    M.loading = true;
    fetch('museum/meme.mp3').then(q => q.arrayBuffer()).then(b => Snd.ctx.decodeAudioData(b)).then(b => { M.buf = b; M.len = b.duration; }).catch(() => {}).finally(() => { M.loading = false; });
  }
  function memeStop() {
    if (M.src) { try { M.src.stop(); } catch (e) { /* уже остановлен */ } M.src.disconnect(); M.gain.disconnect(); }
    M.src = M.gain = null;
  }
  function memePlay(at) {
    memeStop();
    const c = Snd.ctx;
    if (!M.buf || !c || c.state !== 'running' || at >= M.buf.duration) return;
    M.src = c.createBufferSource(); M.src.buffer = M.buf;
    M.gain = c.createGain(); M.gain.gain.value = 0;
    M.src.connect(M.gain); M.gain.connect(Snd.master); M.src.start(0, at);
  }
  function memeTick(dt, t) {
    // Дорожку грузим сразу после первого нажатия в музее, а не при входе в зал: иначе первый цикл шёл бы молча.
    memeLoad();
    const r = R.f, m = r && r.state === 'ready' && r.meme;
    if (!m || room !== r) {
      if (M.state !== 'wait') { memeStop(); M.state = 'wait'; M.c = 2; }
      return;
    }
    M.c += dt;
    // Как в меме: только два кадра. Дверь закрыта или распахнута, отца нет или он уже стоит в проёме.
    let open = false, at = -1;
    if (M.state === 'wait' && M.c > 5) { M.state = 'show'; M.c = 0; }
    if (M.state === 'show') {
      open = true; at = M.c;
      // Если звук догрузился или включился посреди сцены, подхватываем дорожку с нужного места.
      if (!M.src && M.buf && Snd.ctx && Snd.ctx.state === 'running' && at < M.len - .2) memePlay(at);
      if (at >= M.len) { M.state = 'wait'; M.c = 0; memeStop(); open = false; at = -1; }
    }
    const music = at >= VOICE_END;
    m.pivot.rotation.y = open ? 1.55 : 0;
    m.dad.visible = open;
    m.dad.material.map = at < KICK_END ? m.faces.kick : at < TALK_END ? m.faces.talk : at < FROWN_AT ? m.faces.quiet : m.faces.sad;
    m.speech.visible = at >= KICK_END && at < TALK_END;
    m.glow.material.opacity += ((music ? .55 : 0) - m.glow.material.opacity) * Math.min(1, dt * 2);
    if ((M.tearT = (M.tearT || 0) + dt) > .066) { M.tearT = 0; m.drawSon(t); }
    if (M.gain) {
      const d = Math.hypot(P.x - m.sonAt.x, P.z - m.sonAt.z);
      // Танцор ближе сына: его музыка главнее, песня сына уходит на фон.
      const dd = r.dancer ? Math.hypot(P.x - r.dancer.D.x, P.z - r.dancer.D.z) : 99;
      M.gain.gain.setTargetAtTime(!music ? .95 : Math.pow(clamp((8.5 - d) / 6.5, 0, 1), 1.4) * (dd < d ? .25 : 1), Snd.ctx.currentTime, .15);
    }
  }

  // Танцор в Рендере танцует по кругу, пока посетитель рядом. Музыка подтягивается по мере приближения.
  // Часы задаёт звук: видео догоняет его, если разойдутся. Без звука видео просто идёт по кругу.
  const DN = { buf: null, loading: false, src: null, gain: null, t0: 0 };
  function dancerNear() {
    const d = R.f && R.f.dancer;
    if (!d || room !== R.f) return 0;
    return Math.pow(clamp((7 - Math.hypot(P.x - d.D.x, P.z - d.D.z)) / 5, 0, 1), 1.3);
  }
  function danceStop() {
    if (DN.src) { try { DN.src.stop(); } catch (e) { /* уже остановлен */ } DN.src.disconnect(); DN.gain.disconnect(); }
    DN.src = DN.gain = null;
  }
  function dancerTick() {
    const r = R.f, d = r && r.state === 'ready' && r.dancer;
    if (!d) return;
    const v = d.video, far = Math.hypot(P.x - d.D.x, P.z - d.D.z), see = r.group.visible && !document.hidden; // танцор виден со входа, поэтому играет, пока зал на экране
    if (see && v.paused) v.play().catch(() => {});
    if (!see && !v.paused) v.pause();
    d.body.rotation.y = Math.atan2(camera.position.x - d.D.x, camera.position.z - d.D.z);
    const m = r.meme, sonSings = m && M.state === 'show' && M.c >= VOICE_END && Math.hypot(P.x - m.sonAt.x, P.z - m.sonAt.z) < far;
    const k = dancerNear() * (sonSings ? .25 : 1), c = Snd.ctx;
    if (!c || c.state !== 'running') return;
    if (!DN.buf && !DN.loading && see) {
      DN.loading = true;
      fetch(d.D.song).then(q => q.arrayBuffer()).then(b => c.decodeAudioData(b)).then(b => { DN.buf = b; }).catch(() => {}).finally(() => { DN.loading = false; });
    }
    if (k > 0 && DN.buf && !DN.src && v.readyState >= 2) {
      DN.src = c.createBufferSource(); DN.src.buffer = DN.buf; DN.src.loop = true;
      DN.gain = c.createGain(); DN.gain.gain.value = 0;
      DN.src.connect(DN.gain); DN.gain.connect(Snd.master);
      const at = v.currentTime % DN.buf.duration;
      DN.src.start(0, at); DN.t0 = c.currentTime - at;
    }
    if (!DN.src) return;
    DN.gain.gain.setTargetAtTime(k * .9, c.currentTime, .25);
    if (k === 0 && DN.gain.gain.value < .01) { danceStop(); return; }
    const len = DN.buf.duration, pos = (c.currentTime - DN.t0) % len;
    let drift = v.currentTime - pos; drift -= Math.round(drift / len) * len;
    if (Math.abs(drift) > .15 && !v.seeking) v.currentTime = pos;
  }

  function roomTick(dt, t) {
    const r = room;
    if (r.state !== 'ready') return;
    if (r.mascot) {
      const m = r.mascot;
      m.mat.uniforms.uT.value = t;
      m.g.position.y = m.y0 + Math.sin(t * .9) * .12;
      m.g.rotation.y = Math.sin(t * .3) * .4;
    }
    if (r.id === 'a' && animT === 0 && r.robotFace) {
      const { c, tex: ft } = r.robotFace, g = c.getContext('2d');
      g.fillStyle = '#071314'; g.fillRect(0, 0, 128, 96);
      if (Math.floor(t * 1.5) % 7) { g.fillStyle = '#35e6dc'; const lx = clamp(Math.round((P.x - 15.5) * 2), -6, 6); g.fillRect(36 + lx, 34, 14, 14); g.fillRect(78 + lx, 34, 14, 14); }
      g.fillStyle = '#35e6dc'; g.fillRect(50, 66, 28, 4); ft.needsUpdate = true;
      if (r.cat) r.cat.rotation.y = Math.sin(t * .3) * .08;
    }
    if (r.id === 'b') {
      const a = Math.atan2(P.z - r.part.z, P.x - r.part.x);
      if (lapA != null) {
        let d = a - lapA; d = Math.atan2(Math.sin(d), Math.cos(d)); lap += d;
        const lv = Math.floor(Math.abs(lap) / TAU);
        if (lv > (World.level || 0)) {
          World.level = lv;
          const msg = ['', 'Кажется, ты тут уже был.', 'Ты тут был дважды.', 'Это не баг.', 'Почти.', 'В дальней стене появилась дверь.'][Math.min(lv, 5)];
          if (msg) toast(`Уровень ${lv}`, msg);
          if (lv >= 5 && r.adminDoor) { r.adminDoor.visible = true; }
        }
      }
      lapA = a;
      if (r.entity && !r.entitySaid && Math.hypot(P.x - r.entity.position.x, P.z - r.entity.position.z) < 5) { r.entitySaid = true; toast('Он здесь давно. Лучше не спрашивать, к какой работе он пришёл.'); }
      if (r.double) { const on = (World.level || 0) >= 3; r.double.visible = on; if (on) { r.double.position.set(r.part.x * 2 - P.x, 0, r.part.z * 2 - P.z); r.double.rotation.y = -P.yaw + Math.PI; animate(r.double, P.moving, dt); } }
    }
    if (r.id === 'e' && r.son) {
      const s = 1 + Math.max(0, Math.sin(t * 4.2) * Math.sin(t * .9)) * .1;
      r.son.torso.scale.x = s; r.son.torso.scale.z = .68 * s;
      r.tears.forEach(q => { q.life += dt; const k = q.life % 1.5; q.position.y = .74 - k * .22; q.position.z = -18.3 + k * .05; });
      r.rgb.material.color.setHSL((t * .15) % 1, 1, .55);
    }
    if (r.id === 'g') {
      r.flames.forEach(f => { f.scale.setScalar(.19 + Math.sin(t * 11 + f.ph) * .03); });
      if (r.ghost) { r.ghost.position.x = -10 + Math.sin(t * .14) * 5; r.ghost.position.y = 2.2 + Math.sin(t * 1.6) * .12; r.ghost.material.opacity = .55 + Math.sin(t * 2) * .2; }
      r.plants.forEach(p => {
        const d = Math.hypot(p.x - P.x, p.z - P.z);
        p.tag.visible = d < 4.5;
        if (p.born) { const k = clamp((performance.now() - p.born) / 3000, .12, 1); p.s.scale.set(p.full.x, p.full.y * k, 1); }
      });
      if (animT === 0) {
        const { c, tex: mt } = r.moon, g = c.getContext('2d'), n = 10, on = Math.floor(t * 6) % n;
        g.clearRect(0, 0, 64, 64);
        for (let i = 0; i < n; i++) { const a = i / n * TAU, q = (i + n - on) % n; g.fillStyle = q < 3 ? '#f1e9db' : q < 6 ? '#7c7fa8' : '#2f2d58'; g.fillRect(Math.round(32 + Math.cos(a) * 22) - 4, Math.round(32 + Math.sin(a) * 22) - 4, 8, 8); }
        mt.needsUpdate = true;
      }
    }
    // Заставки автоматов. На телефоне оживают только ближние.
    if (r.arcade && animT === 0 && P.x > 18) for (const s of r.arcade) {
      if (LOW && Math.abs(P.z - s.z) > 5) continue;
      Arcade.screen(s.g, s.c.width, s.c.height, t, s.id); s.tex.needsUpdate = true;
      if (s.tick) s.tick(t);
    }
    if (r.id === 'i') danceTick(r, dt, t); else P.bob = 0;
    for (const th of r.things) if (th.spark && th.spark.visible) th.spark.scale.setScalar(.1 + Math.abs(Math.sin(t * 2.4 + th.at.x)) * .1);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (LOW) { skip = !skip; if (skip) return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = (now - clock0) / 1000;
    World.pump(LOW ? 5 : 8);
    sayTick(dt);
    if (Sheet.open_) { if (Sheet.tick) Sheet.tick(dt); if (!Sheet.live) return; }

    if (!Sheet.open_) {
      const keyed = keyMove(dt), walked = stepAlong(P, dt, P.run || shifted() ? 5.2 : 2.8);
      P.moving = keyed || walked;
      if (!P.path.length) P.run = false;
      if (walked) {
        const d = ((P.heading - P.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
        if (!ptr) { P.yaw += d * (1 - Math.exp(-dt * 4.5)); P.pitch *= 1 - dt * 3; }
      }
      if (!P.path.length && P.goal) { const g = P.goal; P.goal = null; const a = g.at || (g.npc && g.npc); if (a) P.face = { look: new T.Vector3(a.x, 1.5, a.z) }; act(g); }
      if (!P.path.length && P.face) {
        const a = Math.atan2(P.face.look.z - P.z, P.face.look.x - P.x), d = ((a - P.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
        P.yaw += d * (1 - Math.exp(-dt * 6));
        const pt = Math.atan2(P.face.look.y - 1.6, Math.hypot(P.face.look.x - P.x, P.face.look.z - P.z));
        P.pitch += (pt - P.pitch) * (1 - Math.exp(-dt * 6));
        if (Math.abs(d) < .01) P.face = null;
      }
      const here = roomAt(P.x, P.z);
      if (here && here !== room) enterRoom(here);
    } else P.moving = false;
    P.y += (World.floorY(P.x, P.z) - P.y) * (1 - Math.exp(-dt * 12));

    animT += dt;
    const tick = animT > .1;
    if (tick) animT = 0;
    sonDoor(dt);
    for (const r of ROOMS) if (r.state === 'ready' && r.group.visible && (!LOW || r === room)) npcTick(r, dt);
    roomTick(dt, t);
    dancerTick();
    memeTick(dt, t);

    flickT -= dt;
    if (flickT < 0) { flick = Math.random() < .5 ? .55 + Math.random() * .3 : 1; flickT = flick < 1 ? .04 + Math.random() * .12 : .8 + Math.random() * 5; }
    if (R.b && R.b.state === 'ready') { R.b.mats.forEach(m => m.color.setScalar(flick)); R.b.floor.material.uniforms.uF.value = flick; }

    if (tick) {
      for (const w of room.animated || []) if (Math.hypot(w.look.x - P.x, w.look.z - P.z) < (LOW ? 7 : 15)) { w.draw(t); w.tex.needsUpdate = true; }
      audioT += .1;
      if (audioT > .3) { audioT = 0; audioRoom(); }
    }
    ringT += dt; ring.material.opacity = Math.max(0, .7 - ringT * 1.2); ring.scale.setScalar(1 + ringT * .7);

    const bob = P.moving ? Math.sin(t * 9) * .012 : 0;
    camera.position.set(P.x, 1.6 + P.y + bob + P.bob, P.z);
    let dir = fwd(P.yaw, P.pitch);
    base.copy(camera.position); baseDir.copy(dir);
    if (zoom) {
      zoom.k = clamp(zoom.k + zoom.dir * dt / .75, 0, 1);
      const e = zoom.k * zoom.k * (3 - 2 * zoom.k);
      camera.position.lerpVectors(zoom.a, zoom.b, e);
      dir = zoom.ad.clone().lerp(zoom.bd, e).normalize();
      if (zoom.k === 0 && zoom.dir < 0) zoom = null;
    }
    camera.lookAt(camera.position.clone().add(dir));
    camera.updateMatrixWorld();
    if (pv) { pv.position.copy(camera.position).addScaledVector(dir, 1.5); pv.position.y -= .1; pv.rotation.y = Math.atan2(dir.z, -dir.x) + Math.sin(t * .8) * .6; pv.body.position.y = Math.sin(t * 1.5) * .03; }
    for (const r of ROOMS) if (r.state === 'ready') for (const w of Object.values(r.walls)) w.group.visible = camera.position.clone().sub(w.origin).dot(w.normal) > 0;

    renderReflection();
    renderer.render(scene, camera);
    if (!Sheet.open_) nearest();

    frames++; tAcc += dt;
    if (tAcc > 2) {
      const fps = frames / tAcc; frames = 0; tAcc = 0;
      if (fps < (LOW ? 22 : 30) && ++slow > 1) { slow = 0; if (reflOn) { reflOn = false; ROOMS.forEach(r => { if (r.floor) r.floor.material.uniforms.uR.value = 0; }); } else if (dpr > 1) { dpr = Math.max(1, dpr - .3); resize(); } }
    }
  }

  function boot() {
    Save.visits++; Save.lastVisit = Date.now(); persist();
    World.buildPasses();
    gate = gates.son;
    World.focus(R.a);
    while (R.a.state !== 'ready') World.pump(200);
    R.a.group.visible = true;
    resize();
    paintFinds(); paintSound();
    $('hintT').textContent = matchMedia('(pointer: coarse)').matches ? 'Нажми, чтобы идти. Дважды, чтобы бежать' : 'Нажми, чтобы идти. Shift, чтобы бежать';
    $('hallName').textContent = 'Атриум. Кэш';
    document.body.dataset.hall = 'a';
    document.body.classList.add('ready');
    if (!Save.skin) openPick();
    requestAnimationFrame(frame);
  }

  window.Museum = { boot, P, teleport, travel, R, get room() { return room; }, walkTo, act, Sheet };
})();

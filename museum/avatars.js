// Летающие аватары посетителей. Одна форма и одна текстура на вид: телефон почти не замечает толпу.
(function () {
  const { T } = World, TEX = 256, BOX = .7;
  const GREEN = '#84bd2c', GREEN_DARK = '#5f8a1e';

  function rounded(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); s.closePath();
    return s;
  }
  function polygon(pts) { const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; }
  function bananaShape() {
    const s = new T.Shape();
    s.moveTo(-.07, .34); s.lineTo(.02, .34);
    s.bezierCurveTo(.05, .12, .27, -.1, .17, -.33);
    s.bezierCurveTo(-.12, -.34, -.3, -.04, -.07, .34);
    return s;
  }
  // Лицо маскота: скучающий взгляд, тяжёлая бровь, ровный рот.
  function face(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
    g.lineWidth = 7; g.beginPath(); g.moveTo(-40, -22); g.quadraticCurveTo(-18, -34, 2, -18); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(22, -20); g.quadraticCurveTo(34, -24, 42, -17); g.stroke();
    g.beginPath(); g.arc(-20, -4, 15, -.12, Math.PI + .12); g.closePath(); g.fill();
    g.beginPath(); g.arc(32, -6, 7, -.1, Math.PI + .1); g.closePath(); g.fill();
    g.lineWidth = 5; g.beginPath(); g.moveTo(-8, 34); g.lineTo(24, 31); g.stroke();
    g.restore();
  }
  const hairline = (g, x0, x1, y, n, h) => {
    const st = (x1 - x0) / n;
    g.moveTo(x0, -20); g.lineTo(x1, -20); g.lineTo(x1, y);
    for (let i = 0; i < n; i++) { g.lineTo(x1 - st * (i + .5), y + h * (i % 2 ? .6 : 1)); g.lineTo(x1 - st * (i + 1), y); }
    g.closePath();
  };

  const KINDS = {
    cursor: {
      name: 'Курсор', depth: .05, bevel: .02, base: '#141418', hair: 9,
      shape: polygon([[-.21, .34], [-.21, -.2], [-.08, -.08], [.02, -.31], [.12, -.26], [.02, -.04], [.21, -.04]]),
      paint(g, S) {
        g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, S, S);
        g.fillStyle = GREEN; g.beginPath(); hairline(g, 20, 190, 58, 5, 18); g.fill();
        face(g, 108, 108, .5, '#141418');
      },
      back: '#f2f2ee', rim: '#141418', rimW: 13
    },
    monitor: {
      name: 'Компьютер', depth: .24, bevel: .03, base: '#d9cfb9', hair: .14,
      shape: rounded(.62, .54, .08),
      paint(g, S) {
        g.fillStyle = '#d9cfb9'; g.fillRect(0, 0, S, S);
        g.fillStyle = GREEN; g.beginPath(); hairline(g, 0, S, 44, 7, 16); g.fill();
        g.fillStyle = '#2a251c'; g.beginPath(); g.roundRect(46, 58, 164, 134, 18); g.fill();
        g.fillStyle = '#05160c'; g.beginPath(); g.roundRect(56, 68, 144, 114, 12); g.fill();
        face(g, 128, 124, .9, '#63ff92');
        g.fillStyle = 'rgba(0,0,0,.3)'; for (let y = 70; y < 182; y += 4) g.fillRect(56, y, 144, 2);
      },
      back: '#c9bfa8'
    },
    floppy: {
      name: 'Дискета', depth: .05, bevel: .018, base: '#2f4f8f', hair: .2,
      shape: rounded(.62, .64, .05),
      paint(g, S) {
        g.fillStyle = '#2f4f8f'; g.fillRect(0, 0, S, S);
        g.fillStyle = '#e8e6df'; g.fillRect(48, 22, 160, 128);
        g.fillStyle = GREEN; g.beginPath(); g.rect(48, 22, 160, 22); g.fill();
        g.beginPath(); hairline(g, 48, 208, 40, 6, 16); g.fill();
        face(g, 128, 98, .78, '#141418');
        g.fillStyle = '#b4b7bd'; g.fillRect(74, 172, 112, 66); g.fillStyle = '#2f4f8f'; g.fillRect(90, 182, 26, 46);
      },
      back: '#2a477f'
    },
    banana: {
      name: 'Банан', tube: true, base: '#e8c33a', hair: 9,
      paint(g, S) {
        g.fillStyle = '#ecc93f'; g.fillRect(0, 0, S, S);
        g.fillStyle = GREEN; g.beginPath(); hairline(g, 0, S, 62, 12, 16); g.fill();
        g.save(); g.translate(0, 176); g.rotate(-.1); g.fillStyle = '#b4b7bd'; g.fillRect(-20, -15, S + 40, 30); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-20, -15, S + 40, 6); g.restore();
        g.fillStyle = '#3a2a12'; g.fillRect(0, S - 7, S, 7);
        face(g, S / 2, 124, .44, '#2e2110');
        const l = g.createLinearGradient(0, 0, S, 0);
        l.addColorStop(0, 'rgba(90,60,0,.5)'); l.addColorStop(.32, 'rgba(90,60,0,.12)'); l.addColorStop(.5, 'rgba(255,255,255,.12)'); l.addColorStop(.68, 'rgba(90,60,0,.12)'); l.addColorStop(1, 'rgba(90,60,0,.5)');
        g.fillStyle = l; g.fillRect(0, 0, S, S);
      }
    }
  };

  // Банан не выдавливается: кольца идут вдоль дуги, поэтому он гладкий и тонкий при малом числе граней.
  function tube() {
    const ROWS = 16, SIDES = 10, pos = [], uv = [], idx = [];
    const A = [.11, .33], B = [-.25, .03], C = [.13, -.33];
    const at = t => [(1 - t) ** 2 * A[0] + 2 * (1 - t) * t * B[0] + t * t * C[0], (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * B[1] + t * t * C[1]];
    const radius = t => (t < .1 ? .034 + t * .2 : .054 + .068 * Math.sin(Math.min(1, (t - .1) / .9) * Math.PI) ** .7);
    for (let j = 0; j <= ROWS; j++) {
      const t = j / ROWS, c = at(t), n = at(Math.min(1, t + .01)), p = at(Math.max(0, t - .01));
      let tx = n[0] - p[0], ty = n[1] - p[1]; const l = Math.hypot(tx, ty); tx /= l; ty /= l;
      for (let i = 0; i <= SIDES; i++) {
        const u = i / SIDES, a = -Math.PI / 2 + u * Math.PI * 2, r = radius(t);
        pos.push(c[0] - ty * Math.cos(a) * r, c[1] + tx * Math.cos(a) * r, Math.sin(a) * r * .9);
        uv.push(u, 1 - t);
      }
    }
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < SIDES; i++) {
      const a = j * (SIDES + 1) + i, b = a + SIDES + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.rotateY(Math.PI / 2);
    return g;
  }

  // Фронт и спина делят один холст: левая половина лицо, правая затылок с той же причёской.
  function atlas(k) {
    const c = Art.cv(TEX * 2, TEX), g = c.getContext('2d');
    g.save(); g.beginPath(); g.rect(0, 0, TEX, TEX); g.clip(); k.paint(g, TEX); g.restore();
    g.fillStyle = k.back; g.fillRect(TEX, 0, TEX, TEX);
    g.fillStyle = GREEN_DARK; g.fillRect(TEX, 0, TEX, 62);
    if (k.rim) {
      const trace = shape => { const pts = shape.getPoints(4); g.beginPath(); pts.forEach((p, i) => { const x = (p.x / BOX + .5) * TEX, y = (.5 - p.y / BOX) * TEX; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
      g.save(); g.beginPath(); g.rect(0, 0, TEX, TEX); g.clip(); trace(k.shape); g.strokeStyle = k.rim; g.lineWidth = k.rimW; g.lineJoin = 'round'; g.stroke(); g.restore();
    }
    return World.tex(c, { aniso: 2 });
  }
  function build(k) {
    const geo = new T.ExtrudeGeometry(k.shape, { depth: k.depth, bevelEnabled: true, bevelSize: k.bevel, bevelThickness: k.bevel, bevelSegments: k.depth > .1 ? 2 : 1, curveSegments: 6 });
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv, col = new Float32Array(p.count * 3), mid = k.depth / 2;
    const base = new T.Color(k.base), hair = new T.Color(GREEN), c = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / BOX + .5, v = p.getY(i) / BOX + .5;
      uv.setXY(i, p.getZ(i) > mid ? u * .5 : .5 + (1 - u) * .5, v);
      c.copy(p.getY(i) > k.hair ? hair : base).multiplyScalar(.74 + .26 * Math.max(0, n.getY(i)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    geo.translate(0, 0, -mid); geo.rotateY(Math.PI / 2);
    return geo;
  }
  const CACHE = {};
  function parts(kind) {
    if (!CACHE[kind]) {
      const k = KINDS[kind];
      if (k.tube) {
        const c = Art.cv(TEX, TEX); k.paint(c.getContext('2d'), TEX);
        CACHE[kind] = { geo: tube(), mats: new T.MeshBasicMaterial({ map: World.tex(c, { aniso: 2 }), side: T.DoubleSide }) };
      } else CACHE[kind] = { geo: build(k), mats: [new T.MeshBasicMaterial({ map: atlas(k) }), new T.MeshBasicMaterial({ vertexColors: true })] };
    }
    return CACHE[kind];
  }

  // body покачивается отдельно от группы: так никнейм и тень стоят ровно.
  function make(kind) {
    const { geo, mats } = parts(kind), g = new T.Group(), body = new T.Mesh(geo, mats);
    body.position.y = 1.55; g.add(body); g.body = body; g.phase = Math.random() * 6;
    return g;
  }
  function hover(g, t, moving) {
    const s = t * 1.5 + g.phase;
    g.body.position.y = 1.55 + Math.sin(s) * .05;
    g.body.rotation.z = (moving ? -.14 : 0) + Math.sin(s * .7) * .05;
    g.body.rotation.x = Math.sin(s * .5) * .05;
  }
  // В Telegram имя придёт из Mini App. В браузере это постоянный гостевой ник.
  function nick() {
    const u = window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
    if (u && (u.username || u.first_name)) return u.username ? '@' + u.username : u.first_name;
    if (!Save.guest) { Save.guest = '@guest_' + (1000 + Math.floor(Math.random() * 9000)); persist(); }
    return Save.guest;
  }
  window.Avatars = { KINDS, make, hover, nick, shared: () => Object.values(CACHE).map(q => q.geo) };
})();

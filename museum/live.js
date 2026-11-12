// Живые посетители: кто сейчас в том же зале. Каждый видит остальных полупрозрачными фигурами с ником из Telegram.
// Музей держит WebSocket с комнатой своего зала (класс Hall в server/src/index.js) и шлёт туда своё место,
// пока идёт. Без сервера (пустой api в config.js) ничего не делает.
(function () {
  const C = window.NETIZEN_CONFIG || {};
  const HALLS = ['n', 's', 'p', 'm', 'a', 'j', 'c', 'f', 'w'];
  const off = { tick() {}, count: () => 0, ready: () => false };
  if (!C.api || !window.WebSocket) { window.Live = off; return; }
  const { T, scene } = World;
  const MAX = LOW ? 6 : 20, SEND_MS = 200, OPACITY = .5;

  const people = new Map();
  let ws = null, hall = null, open = false, stopped = false, retryAt = 0, retries = 0;
  let lastSend = 0, sent = null, sentKind = null, pingT = 0, sortT = 0, hiddenAt = 0;

  // Одна прозрачная копия материалов на вид фигуры: сто посетителей стоят как четыре.
  const mats = {};
  function ghostMats(kind) {
    if (!mats[kind]) {
      const m = Avatars.make(kind).body.material;
      const list = (Array.isArray(m) ? m : [m]).map(x => { const c = x.clone(); c.transparent = true; c.opacity = OPACITY; return c; });
      mats[kind] = Array.isArray(m) ? list : list[0];
    }
    return mats[kind];
  }
  const blobTex = (() => {
    const c = Art.cv(64, 64), g = c.getContext('2d'), l = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    l.addColorStop(0, 'rgba(0,0,0,.32)'); l.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = l; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();
  const blobGeo = new T.PlaneGeometry(.8, .8), blobMat = new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
  function nickSprite(str) {
    const c = Art.cv(256, 44), x = c.getContext('2d');
    x.font = `500 24px ${Art.MONO}`;
    let s = str; while (s.length > 4 && x.measureText(s).width > 222) s = s.slice(0, -2) + '…';
    const tw = Math.min(250, x.measureText(s).width + 26);
    x.fillStyle = 'rgba(8,9,12,.62)'; x.beginPath();
    if (x.roundRect) x.roundRect((256 - tw) / 2, 2, tw, 40, 20); else x.rect((256 - tw) / 2, 2, tw, 40);
    x.fill(); x.fillStyle = '#ece9e2'; x.textAlign = 'center'; x.fillText(s, 128, 31);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    sp.scale.set(1.1, 1.1 * .172, 1); sp.position.y = 2.02;
    return sp;
  }

  function figure(kind) {
    const g = Avatars.make(kind);
    g.body.material = ghostMats(kind);
    const b = new T.Mesh(blobGeo, blobMat); b.rotation.x = -Math.PI / 2; b.position.y = .012; g.add(b);
    return g;
  }
  function add(o) {
    if (!o || !o.p || people.has(o.id)) return;
    const [x, z, yaw, m, h = 0] = o.p, g = figure(o.k);
    const tag = nickSprite(o.n || 'гость'); g.add(tag);
    g.position.set(x, h + World.floorY(x, z), z); g.rotation.y = -yaw;
    scene.add(g);
    people.set(o.id, { id: o.id, g, tag, kind: o.k, x, z, yaw, y: h, tx: x, tz: z, tyaw: yaw, ty: h, m: !!m });
  }
  function drop(id) {
    const q = people.get(id);
    if (!q) return;
    scene.remove(q.g); q.tag.material.map.dispose(); q.tag.material.dispose();
    people.delete(id);
  }
  function clear() { for (const id of [...people.keys()]) drop(id); }
  function reskin(id, kind) {
    const q = people.get(id);
    if (!q || q.kind === kind) return;
    q.kind = kind; q.g.body.geometry = Avatars.make(kind).body.geometry; q.g.body.material = ghostMats(kind);
  }

  function onMessage(e) {
    let d; try { d = JSON.parse(e.data); } catch (err) { return; }
    if (d.all) { clear(); d.all.forEach(add); }
    if (d.j) { drop(d.j.id); add(d.j); }
    if (d.m) { const q = people.get(d.m[0]); if (q) { q.tx = d.m[1]; q.tz = d.m[2]; q.tyaw = d.m[3]; q.m = !!d.m[4]; q.ty = d.m[5] || 0; } }
    if (d.k) reskin(d.k[0], d.k[1]);
    if (d.l) drop(d.l);
    // Кто-то в зале съел банан на скотче.
    if (d.e && window.Banana) Banana.remote(d.e);
    // Общая стена главного зала: чужие пиксели, остаток своего запаса, отказ.
    if ((d.px || d.pc != null || d.pxno) && window.Pixels) Pixels.remote(d);
  }

  function url(id) {
    const u = new URL(C.api.replace(/\/$/, '') + '/live', location.href);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    u.searchParams.set('hall', id); u.searchParams.set('k', Save.skin || 'monitor');
    return u.toString();
  }
  function connect(id) {
    const token = Net.token && Net.token();
    if (!token) return;
    hall = id; open = false; sent = null; sentKind = Save.skin || 'monitor';
    const s = new WebSocket(url(id), ['netizen', token]);
    ws = s;
    s.onopen = () => { if (ws === s) { open = true; retries = 0; } };
    s.onmessage = e => { if (ws === s) onMessage(e); };
    s.onclose = e => {
      if (ws !== s) return;
      ws = null; open = false; clear();
      // Музей открыт в другой вкладке: здесь больше не подключаемся.
      if (e.code === 4000) { stopped = true; return; }
      retries++; retryAt = performance.now() + Math.min(30000, 1000 * 2 ** retries);
      hall = null;
    };
  }
  function disconnect() {
    if (ws) { const s = ws; ws = null; try { s.close(1000); } catch (e) { /* уже закрыт */ } }
    hall = null; open = false; clear();
  }

  // Вкладка спрятана (Telegram свёрнут): через полминуты уходим из зала, чтобы фигура не стояла замершей.
  // Кадры в спрятанной вкладке не идут, поэтому уходим по таймеру, а не в tick.
  let hideT = 0;
  document.addEventListener('visibilitychange', () => {
    clearTimeout(hideT);
    if (document.hidden) { hiddenAt = performance.now(); hideT = setTimeout(() => { if (document.hidden) disconnect(); }, 30000); }
    else hiddenAt = 0;
  });

  function send(P) {
    const now = performance.now();
    const kind = Save.skin || 'monitor';
    if (kind !== sentKind) { sentKind = kind; ws.send(JSON.stringify({ k: kind })); }
    if (now - lastSend < SEND_MS) return;
    // Пятое число: высота пола (второй этаж главного зала).
    const p = [P.x, P.z, P.yaw, P.moving ? 1 : 0, P.h || 0];
    if (sent && Math.abs(p[0] - sent[0]) < .03 && Math.abs(p[1] - sent[1]) < .03 && Math.abs(p[2] - sent[2]) < .04 && p[3] === sent[3] && Math.abs(p[4] - sent[4]) < .05) {
      if (now - pingT > 25000) { pingT = now; ws.send('ping'); }
      return;
    }
    lastSend = now; pingT = now; sent = p;
    ws.send(JSON.stringify({ p: p.map(v => Math.round(v * 100) / 100) }));
  }

  function tick(dt, t, P, room) {
    const now = performance.now();
    const want = !stopped && Net.token && Net.token() && room && HALLS.includes(room.id) && !(hiddenAt && now - hiddenAt > 30000) ? room.id : null;
    if (want !== hall || (!want && ws)) { disconnect(); }
    if (want && !ws && now >= retryAt) connect(want);
    if (ws && open && ws.readyState === 1) send(P);

    const k = 1 - Math.exp(-dt * 9);
    sortT -= dt;
    const resort = sortT <= 0;
    if (resort) sortT = .5;
    const list = resort ? [] : null;
    for (const q of people.values()) {
      const far = Math.hypot(q.tx - q.x, q.tz - q.z) > 5;
      q.x = far ? q.tx : q.x + (q.tx - q.x) * k;
      q.z = far ? q.tz : q.z + (q.tz - q.z) * k;
      let dy = q.tyaw - q.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); q.yaw += dy * k;
      q.y = far ? q.ty : q.y + (q.ty - q.y) * k;
      q.g.position.set(q.x, q.y + World.floorY(q.x, q.z), q.z);
      q.g.rotation.y = -q.yaw;
      if (q.g.visible) Avatars.hover(q.g, t, q.m);
      if (list) list.push(q);
    }
    // Показываем только ближайших: на телефоне шестерых, на компьютере двадцать.
    if (list && list.length > MAX) {
      list.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
      list.forEach((q, i) => { q.g.visible = i < MAX; });
    } else if (list) list.forEach(q => { q.g.visible = true; });
  }

  window.Live = { tick, count: () => people.size, ready: id => !!(ws && open && ws.readyState === 1 && hall === id), send: o => { if (ws && open && ws.readyState === 1) ws.send(JSON.stringify(o)); } };
})();

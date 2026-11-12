// «Банан на скотче» в Анфиладе, повтор работы Маурицио Каттелана «Комедиант» (2019). Один банан на всех; новый каждые две минуты (цикл = floor(время / 120) по часам сервера).
// Первый, кто съел банан цикла, получает скин «Банан», пятый засчитанный банан (не чаще раза в два часа) даёт «Золотой банан».
// Где стоял съевший, остаётся кожура до следующего банана: кто на неё наступит, поскользнётся.
// За десять секунд до нового банана, если прежний съеден, по всему музею приходит тост: так начинается гонка.
// С сервером: кто первый, решает база (POST /api/banana), остальным в зале сообщает комната живых посетителей ({ e }).
// Без сервера банан у каждого свой и скины живут в браузере.
// Предметы строит halls.js (Halls2.props.p зовёт Banana.build), игрой управляет app.js через attach, tick, cam.
(function () {
  const C = window.NETIZEN_CONFIG || {}, ON = !!C.api, PERIOD = 120;
  let ctx = null, built = null, off = 0, st = { cycle: -1, eaten: null, total: 0, last: null }, fetched = 0, warned = -1, slip = null, slipped = -1, mineAt = 0;

  const nowS = () => Date.now() / 1000 + off;
  const cycle = () => Math.floor(nowS() / PERIOD);
  const left = () => PERIOD - (nowS() % PERIOD);
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // Скины: без сервера в Save.skins, с сервером приходят в профиле и тоже кладутся туда.
  const has = k => (Save.skins || []).includes(k);
  function grant(list) {
    const s = new Set(Save.skins || []); list.forEach(k => s.add(k));
    Save.skins = [...s]; persist();
  }
  // Кто выбрал банан до того, как он стал наградой, его не теряет.
  if (Save.skin === 'banana' && !has('banana')) grant(['banana']);

  // --- состояние ---------------------------------------------------------------------------------

  async function refresh() {
    fetched = Date.now();
    if (!ON) {
      const c = cycle(), mine = Save.bananaCycle === c;
      st = { cycle: c, eaten: mine ? { by: 'ты', x: Save.bananaX || 0, z: Save.bananaZ || 0 } : null, total: Save.bananas || 0, last: Save.bananas ? { by: 'ты' } : null };
      return paint();
    }
    try {
      const r = await fetch(C.api + '/banana'), d = await r.json();
      off = d.now - Date.now() / 1000;
      st = { cycle: d.cycle, eaten: d.eaten, total: d.total, last: d.last };
    } catch (e) { /* сеть пропала: останется прежнее */ }
    paint();
  }

  // --- предметы ----------------------------------------------------------------------------------

  // Банан и скотч: фотографии с прозрачным фоном (Higgsfield), висят на стене как работа.
  // Когда банан съеден, вместо него остаётся только кусок скотча.
  const IMG_W = .55, IMG_H = IMG_W / 1.5;
  function photo(T, src) {
    const t = new T.Texture(); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = Media.url(src);
    return new T.Mesh(new T.PlaneGeometry(IMG_W, IMG_H), new T.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .05, depthWrite: false }));
  }
  // Кожура: фото съеденной кожуры сверху (Higgsfield), лежит на полу, где стоял съевший.
  function peelMesh(T) {
    const t = new T.Texture(); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = Media.url('banana/peel.webp');
    const g = new T.Group();
    // Мягкая тень под кожурой.
    const sc = Art.cv(64, 64), sg = sc.getContext('2d'), rg = sg.createRadialGradient(32, 32, 0, 32, 32, 30);
    rg.addColorStop(0, 'rgba(30,30,40,.22)'); rg.addColorStop(1, 'rgba(30,30,40,0)'); sg.fillStyle = rg; sg.fillRect(0, 0, 64, 64);
    const sh = new T.Mesh(new T.PlaneGeometry(.42, .42), new T.MeshBasicMaterial({ map: World.tex(sc), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(.01, .008, .01); g.add(sh);
    const m = new T.Mesh(new T.PlaneGeometry(.36, .36), new T.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .05, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = .7; m.position.y = .012; g.add(m);
    g.visible = false;
    return g;
  }
  // Место: восточная стена Анфилады, посередине между работами «Холмы и красное солнце» (u 4) и «Все цвета по порядку» (u 11),
  // так что промежутки слева и справа одинаковые. Этикетка как у всех работ: того же размера и на той же высоте.
  const LEFT_EDGE = 4 + 3.2 / 2, RIGHT_EDGE = 11 - 2.1 / 2;
  const SPOT = { u: (LEFT_EDGE + RIGHT_EDGE) / 2, v: 1.75 };
  function build(r) {
    const A = Halls2.api(), T = A.T, wall = r.walls.E;
    const put = (m, u, v, d) => { const g = new T.Group(); wall.place(g); m.quaternion.copy(g.quaternion); m.position.copy(wall.at(u, v, d)); r.group.add(m); return m; };
    // Мягкая тень за бананом, как у остальных работ.
    const sc = A.cv(256, 256), sg = sc.getContext('2d'), rg = sg.createRadialGradient(128, 128, 0, 128, 128, 110);
    rg.addColorStop(0, 'rgba(40,40,50,.16)'); rg.addColorStop(1, 'rgba(40,40,50,0)'); sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
    put(new T.Mesh(new T.PlaneGeometry(IMG_W * .7, IMG_H * .7), new T.MeshBasicMaterial({ map: A.tex(sc), transparent: true, depthWrite: false })), SPOT.u + .03, SPOT.v - .06, .006);
    const ban = put(photo(T, 'banana/banana.webp'), SPOT.u, SPOT.v, .02);
    const tape = put(photo(T, 'banana/tape.webp'), SPOT.u, SPOT.v, .018);
    // Этикетка: 0,3 × 0,17 м справа от работы на высоте 1,18 м, как в workMesh (world.js).
    const lc = A.cv(320, 180), lt = A.tex(lc);
    const label = put(new T.Mesh(new T.PlaneGeometry(.3, .17), new T.MeshBasicMaterial({ map: lt })), SPOT.u + IMG_W / 2 + .34, Math.min(SPOT.v, 1.4) - .22, .012);
    const peel = peelMesh(T); r.group.add(peel);
    const pos = wall.at(SPOT.u, SPOT.v, 0);
    A.thing(r, { id: 'banana_tape', label: 'Банан на скотче', verb: 'съесть', noSpark: true, cap: true, act: eat, when: () => ban.visible,
      mesh: A.hit(r, .5, IMG_H + .1, IMG_W + .1, pos.x - .25, SPOT.v, pos.z), spot: { x: pos.x - 1.8, z: pos.z }, at: new T.Vector3(pos.x - .1, SPOT.v, pos.z) });
    built = { r, ban, tape, peel, lc, lt, label, group: r.group };
    refresh();
  }

  // Этикетка того же вида, что у остальных работ: название и автор. Когда банан съеден, между ними строка о новом банане.
  function paint() {
    if (!built) return;
    const { lc, lt, ban, peel } = built, g = lc.getContext('2d'), eaten = st.eaten && st.cycle === cycle();
    g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, 320, 180);
    g.fillStyle = '#1b1a17'; g.font = `600 24px ${Art.SANS}`; g.fillText('Банан на скотче', 20, 42);
    if (eaten) { g.fillStyle = '#c2410c'; g.font = `400 16px ${Art.MONO}`; g.fillText(`Съеден. Новый через ${mmss(left())}`, 20, 100); }
    g.font = `400 16px ${Art.MONO}`; g.fillStyle = '#6a675f'; g.fillText('по мотивам М. Каттелана, 2019', 20, 156);
    lt.needsUpdate = true;
    ban.visible = !eaten;
    peel.visible = !!eaten;
    if (eaten) peel.position.set(st.eaten.x, 0, st.eaten.z);
  }

  // --- съесть ------------------------------------------------------------------------------------

  function eat() {
    if (!built || !built.ban.visible) return;
    if (ON && !(window.Net && Net.token())) return ctx.toast('Чтобы съесть банан, войди через Telegram');
    // Без вопросов: нажал и съел.
    (async () => {
      const c = cycle(), P = ctx.P;
      if (!ON) {
        Object.assign(Save, { bananaCycle: c, bananaX: P.x, bananaZ: P.z, bananas: (Save.bananas || 0) + 1 }); persist();
        const gold = Save.bananas >= 5 && !has('gold');
        grant(gold ? ['banana', 'gold'] : ['banana']);
        return done(gold);
      }
      try {
        const d = await Net.api('/banana', { cycle: c, x: P.x, z: P.z });
        if (!d.ok) { ctx.say('Смотритель', d.by ? `Этот банан уже съел ${d.by}, новый появится через ${mmss(left())}` : `Этот банан уже съели, новый появится через ${mmss(left())}`, 260); return refresh(); }
        grant(d.skins || ['banana']);
        if (window.Live && Live.send) Live.send({ e: [c, Math.round(P.x * 100) / 100, Math.round(P.z * 100) / 100] });
        done(d.gold);
      } catch (e) {
        ctx.say('Смотритель', e.message === 'gone' ? `Этот банан уже убрали, новый появится через ${mmss(left())}` : 'Не получилось съесть банан, проверь интернет и попробуй ещё раз', 260);
        refresh();
      }
    })();
  }
  function done(gold) {
    mineAt = performance.now();
    ctx.sfx('find');
    ctx.say('Смотритель', 'Это был экспонат, зачем вы его съели? Ладно, страховая возместит.', 260, 5);
    // Скин отдельным сообщением, когда смотритель договорил.
    setTimeout(() => ctx.toast(gold ? 'Ты получил новый аватар «Золотой банан» за пять съеденных бананов' : 'Ты получил новый аватар «Банан»', 'Сменить аватар можно кнопкой со стрелкой внизу экрана'), 4500);
    refresh();
  }
  // Кто-то другой в зале съел банан: прячем его и кладём кожуру.
  function remote([c, x, z, by]) {
    if (c !== cycle()) return;
    st.eaten = { by: by || 'другой посетитель', x, z }; st.total++; st.last = { by: by || 'другой посетитель' }; st.cycle = c;
    paint();
  }

  // --- кадр --------------------------------------------------------------------------------------

  let lastSec = -1;
  function tick(dt, t, P, room) {
    if (built && built.group !== built.r.group) built = null;
    const c = cycle();
    // Новый цикл: банан вернулся. Состояние перечитываем раз в 20 секунд, чтобы знать, съеден ли банан.
    if (c !== st.cycle) { st.cycle = c; st.eaten = null; paint(); refresh(); }
    else if (Date.now() - fetched > 20000) refresh();
    // Гонка: за десять секунд до нового банана, если этот уже съеден.
    if (st.eaten && warned !== c && left() < 10 && room.id !== 'v') {
      warned = c;
      ctx.toast('Через 10 секунд в Анфиладе появится новый банан');
    }
    if (built && room.id === 'p') {
      const s = Math.floor(nowS());
      if (s !== lastSec) { lastSec = s; if (st.eaten) paint(); }
      // Кожура: наступил, когда шёл, и это не свой банан в первые три секунды.
      const pe = built.peel;
      if (pe.visible && !slip && slipped !== c && P.moving && Math.hypot(P.x - pe.position.x, P.z - pe.position.z) < .45 && performance.now() - mineAt > 3000) {
        slip = { t: 0 }; slipped = c; ctx.sfx('deny');
      }
    }
    if (slip) {
      slip.t += dt;
      if (slip.t > 1.3) { slip = null; ctx.say('Ты', 'Ой, кто-то оставил на полу банановую кожуру', 420, 2.5); }
    }
  }
  // Кувырок камеры: вниз и вбок, потом обратно.
  function cam(camera) {
    if (!slip) return;
    const k = Math.min(1, slip.t / 1.3), e = Math.sin(k * Math.PI);
    camera.position.y -= e * .9;
    camera.rotateZ(e * 1.1);
    camera.rotateX(-e * .5);
    camera.updateMatrixWorld();
  }

  window.Banana = {
    attach(c) { ctx = c; },
    build, tick, cam, remote, has,
    get slipping() { return !!slip; },
    // Для проверки в превью.
    debug: () => ({ st, cycle: cycle(), left: left(), built: !!built })
  };
})();

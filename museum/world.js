// Геометрия музея. План: сеть комнат с развилками и кольцами. Комнаты подгружаются рядом с посетителем и выгружаются вдали.
(function () {
  const T = THREE, { rng, cv, SANS, MONO } = Art;
  const UP = new T.Vector3(0, 1, 0);
  const CELL = .04, Q = LOW ? .68 : 1, PIER = .85;

  // Сейчас открыты четыре зала из halls.js: n NETIZEN, s Сад камней, p Анфилада, m Ночной режим.
  // Прежние пять залов остались в коде, их возвращает HALLS = 'ajcfw'. EXTRAS = true возвращает секретные комнаты, предметы и людей.
  // v: лабиринт бэкрумс за решёткой главного зала (backrooms.js), на карте и в админке его нет.
  const EXTRAS = false, HALLS = 'nspmv';
  // Надписи на стенах залов (названия, пояснения, подписи стен Рендера). Пока выключены: true возвращает их.
  const WALL_TEXT = false;
  const ALL_ROOMS = [
    { id: 'a', name: 'Атриум', sub: 'Кэш', x0: 0, x1: 18, z0: -7, z1: 7, h: 6, refl: .1, track: 'gallery', part: { x: 9.8, l: 7, z: 2.5 }, block: [[0, 5.65, -1.9, -1.7]], props: [[13.55, 14.05, -5.15, -2.75], [13.4, 16.6, 3.3, 4.7]], niche: { key: 'E', u: 3.05, v: 1, w: 4.7, h: 3.1, d: 1.25 }, light: { x0: 6.6, x1: 13.4, z0: -5.6, z1: -1.4, d: 1.7 } },
    { id: 'j', name: 'Колонный зал', x0: 19.5, x1: 35.5, z0: -7.5, z1: 7, h: 5.2, refl: .24, track: 'gallery', piers: [[23.6, -3.6], [27.5, -3.6], [31.4, -3.6], [23.6, 3.2], [27.5, 3.2], [31.4, 3.2]] },
    { id: 'b', name: 'Нижний уровень', x0: 36, x1: 52, z0: -7.5, z1: 7, h: 2.75, refl: 0, track: 'back', part: { x: 43, l: 5.4 }, block: [[38.65, 39.15, -2.75, -2.25], [38.65, 39.15, 2.05, 2.55], [47.25, 47.75, -2.85, -2.35], [47.25, 47.75, 1.95, 2.45]] },
    { id: 'c', name: 'Ночной режим', x0: 10, x1: 30, z0: 7.5, z1: 19.5, h: 5.2, refl: .4, track: 'night', part: { x: 20.5, l: 8.6 }, props: [[15.75, 16.25, 12.2, 14.8]] },
    { id: 'd', name: 'Коридор', x0: 6.5, x1: 9.5, z0: -13, z1: -7.5, h: 2.6, refl: 0, track: 'sad', block: [[6.9, 7.5, -12.8, -12.2]] },
    { id: 'e', name: 'Комната сына', x0: 2.5, x1: 10.5, z0: -19, z1: -13.5, h: 2.6, refl: 0, track: 'sad', block: [[2.5, 4.75, -18.9, -14.9], [6.1, 9.1, -19, -18.1]] },
    // Рендер: длинный зал по концепту, вход с юга из Колонного зала, по центру подиум с танцором, над ним световой колодец.
    { id: 'f', name: 'Рендер', sub: 'Зал цифрового искусства', x0: 17, x1: 27, z0: -36, z1: -8, h: 4.6, refl: .3, track: 'meme', light: { x0: 19.6, x1: 24.4, z0: -27.6, z1: -18.4, d: .7 }, block: [[24.6, 26.8, -34.45, -33.35], [20.7, 23.3, -24.3, -21.7], [25.72, 27, -12.95, -11.85], [25.2, 27, -16.9, -15.9], [25.7, 27, -14.95, -13.85], [25.72, 27, -18.95, -17.85], [25.72, 27, -20.95, -19.85], [17.9, 19.1, -13.1, -11.9], [18.95, 19.85, -20.65, -19.75], [17.95, 18.65, -31.35, -30.65], [24.75, 25.65, -25.05, -24.15], [17.6, 19.2, -9.95, -8.85], [25.4, 26.4, -9.85, -8.85], [17, 17.42, -9.35, -8.65], [17, 17.42, -17.75, -17.05], [17, 17.42, -24.65, -23.95], [17, 17.42, -32.0, -31.3], [26.58, 27, -9.35, -8.65], [26.58, 27, -22.95, -22.25], [26.58, 27, -29.95, -29.25]], props: [[25.9, 27, -11.2, -10.2]] },
    { id: 'g', name: 'Сад слов', x0: -17.5, x1: -.5, z0: -9, z1: 9, h: 8, refl: 0, track: 'garden', sky: true, block: [[-4.2, -3, 3.2, 4.2]] },
    { id: 'i', name: 'Танцпол 404', x0: 30.5, x1: 42.5, z0: 7.5, z1: 19.5, h: 4.5, refl: .34, track: 'dance', block: [[40.2, 42.5, 10.8, 16.2]] },
    // Белый куб: круглый зал из двадцати граней, крест из двух стен ниже потолка и чёрная колонна на пересечении.
    { id: 'w', name: 'Белый куб', sub: 'Круглый зал', x0: 11, x1: 29, z0: 20, z1: 38, h: 4.2, refl: .14, track: 'gallery', round: { n: 20 }, parts: [{ x: 20, l: 12.8, z: 29, h: 3 }, { x: 20, l: 12.8, z: 29, h: 3, ax: 'x' }], piers: [[20, 29]], pier: .5, rings: [7.4, 3.6] }
  ];
  ALL_ROOMS.push(...Halls2.ROOMS);
  const ROOMS = ALL_ROOMS.filter(r => EXTRAS || HALLS.includes(r.id));
  const R = Object.fromEntries(ROOMS.map(r => [r.id, r]));
  // Ось x: комната a западнее b. Ось z: комната a севернее b.
  const ALL_PASS = [
    { a: 'a', b: 'j', axis: 'x', c: .9, w: 2.6, h: 3.8, jamb: '#d8d2c7', cap: '#ece8e0', sole: '#d9d4ca' },
    { a: 'j', b: 'b', axis: 'x', c: -1.4, w: 1.9, h: 2.35, jag: true },
    { a: 'g', b: 'a', axis: 'x', c: 0, w: 3, h: 3.6, jamb: '#d8d2c7', cap: '#ece8e0', sole: '#d9d4ca' },
    { a: 'd', b: 'a', axis: 'z', c: 8, w: 1.6, h: 2.3, jamb: '#d8d2c7', cap: '#ece8e0', sole: '#d9d4ca' },
    { a: 'e', b: 'd', axis: 'z', c: 8, w: 1.1, h: 2.1, gate: true, closed: true },
    { a: 'e', b: 'f', axis: 'x', c: -16.2, w: 1.1, h: 2.1, closet: true },
    { a: 'f', b: 'j', axis: 'z', c: 22, w: 1.8, h: 2.5 },
    { a: 'a', b: 'c', axis: 'z', c: 14, w: 2.6, h: 3.6, jamb: '#d8d2c7', cap: '#ece8e0', sole: '#d9d4ca' },
    { a: 'j', b: 'c', axis: 'z', c: 26, w: 1.8, h: 2.8 },
    { a: 'c', b: 'i', axis: 'x', c: 13.5, w: 2.2, h: 2.7 },
    { a: 'c', b: 'w', axis: 'z', c: 20, w: 2.2, h: 3, jamb: '#dcdcde', cap: '#ececee', sole: '#cfcfd2' }
  ];
  ALL_PASS.push(...Halls2.PASS);
  const PASS = ALL_PASS.filter(p => R[p.a] && R[p.b]);
  PASS.forEach(p => {
    const a = R[p.a], b = R[p.b];
    if (p.axis === 'x') { p.s0 = a.x1; p.s1 = b.x0; } else { p.s0 = a.z1; p.s1 = b.z0; }
    (a.links = a.links || []).push({ to: p.b, p }); (b.links = b.links || []).push({ to: p.a, p });
  });
  ROOMS.forEach(r => {
    r.block = [...(r.block || []), ...(EXTRAS && r.props || [])].map(([x0, x1, z0, z1]) => ({ x0, x1, z0, z1 }));
    r.parts = r.parts || (r.part ? [r.part] : []);
    for (const q of r.parts) {
      q.z = q.z == null ? (r.z0 + r.z1) / 2 : q.z;
      r.block.push(q.ax === 'x' ? { x0: q.x - q.l / 2, x1: q.x + q.l / 2, z0: q.z - .16, z1: q.z + .16 } : { x0: q.x - .16, x1: q.x + .16, z0: q.z - q.l / 2, z1: q.z + q.l / 2 });
    }
    // Круглый зал вписан в свой прямоугольник: a это расстояние от центра до каждой грани.
    if (r.round) Object.assign(r.round, { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, a: (r.x1 - r.x0) / 2 });
    // Светодиодные кольца разорваны над стенами креста, как отдельные полосы.
    r.arcs = (r.rings || []).flatMap(rad => { const gap = Math.asin(.6 / rad); return [0, 1, 2, 3].map(i => ({ rad, a0: i * Math.PI / 2 + gap, a1: (i + 1) * Math.PI / 2 - gap })); });
    const ps = r.pier || PIER;
    for (const [x, z] of r.piers || []) r.block.push({ x0: x - ps, x1: x + ps, z0: z - ps, z1: z + ps });
  });
  // Деревянный подиум в углу атриума: единственное место музея, где пол выше нуля.
  const STAGE = { x1: 4.6, x2: 5.6, z0: -7, z1: -1.8, y: .5 };
  function floorY(x, z) {
    if (!R.a || x < 0 || x >= STAGE.x2 || z < STAGE.z0 || z > STAGE.z1) return 0;
    return x <= STAGE.x1 ? STAGE.y : STAGE.y * (STAGE.x2 - x) / (STAGE.x2 - STAGE.x1);
  }

  const scene = new T.Scene();
  scene.background = new T.Color('#050608');
  scene.add(new T.HemisphereLight('#fff', '#6e6a60', 2.3));
  const sun = new T.DirectionalLight('#fff', 1.1); sun.position.set(2, 5, 3); scene.add(sun);

  const reflTarget = { value: null }, reflMatrix = { value: new T.Matrix4() };
  const FloorMat = (map, refl) => new T.ShaderMaterial({
    uniforms: { tBase: { value: map }, tRefl: reflTarget, uTM: reflMatrix, uR: { value: refl }, uF: { value: 1 } },
    vertexShader: `uniform mat4 uTM; varying vec2 vUv; varying vec4 vP; varying vec3 vW;
      void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vP=uTM*w; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform sampler2D tBase,tRefl; uniform float uR,uF; varying vec2 vUv; varying vec4 vP; varying vec3 vW;
      void main(){
        vec3 b=texture2D(tBase,vUv).rgb*uF;
        if(uR>0.){
          vec2 p=vP.xy/vP.w; vec3 r=vec3(0.); float s=.0028;
          for(int i=-2;i<=2;i++) for(int j=-1;j<=1;j++) r+=texture2D(tRefl,p+vec2(float(i)*s,float(j)*s*2.)).rgb;
          r/=15.;
          vec3 v=normalize(cameraPosition-vW);
          float f=mix(.42,1.,pow(1.-clamp(v.y,0.,1.),2.5));
          r=r*.7/(1.+r*.6); b=mix(b,r+b*.5,uR*f);
        }
        gl_FragColor=vec4(b,1.);
        #include <colorspace_fragment>
      }`
  });

  // Тяжёлые копии холстов освобождаем сразу после загрузки в видеопамять.
  function tex(c, o = {}) {
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.generateMipmaps = !o.nearest;
    t.minFilter = o.nearest ? T.NearestFilter : T.LinearMipmapLinearFilter;
    t.magFilter = o.nearest ? T.NearestFilter : T.LinearFilter;
    t.anisotropy = o.aniso || 4;
    if (o.release) t.onUpdate = () => { c.width = c.height = 0; t.onUpdate = null; };
    return t;
  }
  const basic = (c, o = {}) => new T.MeshBasicMaterial({ map: tex(c, o), side: o.side || T.FrontSide, transparent: !!o.transparent, depthWrite: !o.transparent });
  const flat = (color, o = {}) => new T.MeshBasicMaterial(Object.assign({ color }, o));
  const lam = color => new T.MeshLambertMaterial({ color });
  const gradient = (c0, c1, c2) => { const c = cv(4, 64), g = c.getContext('2d'), l = g.createLinearGradient(0, 0, 0, 64); l.addColorStop(0, c0); l.addColorStop(.7, c1); l.addColorStop(1, c2 || c1); g.fillStyle = l; g.fillRect(0, 0, 4, 64); return c; };

  class Wall {
    constructor(room, key, origin, normal, L) {
      Object.assign(this, { room, key, origin, normal, L, h: room.h, id: room.id + key, doors: [], items: [] });
      this.uDir = new T.Vector3().crossVectors(UP, normal);
    }
    at(u, v, d = 0) { return this.origin.clone().addScaledVector(this.uDir, u).addScaledVector(UP, v).addScaledVector(this.normal, d); }
    place(o, d = 0) {
      o.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(this.uDir, UP, this.normal));
      o.position.copy(this.origin).addScaledVector(this.normal, d);
      return o;
    }
    geometry() {
      const { L, h } = this, s = new T.Shape();
      s.moveTo(0, 0);
      for (const d of this.doors) for (const [u, v] of d.pts) s.lineTo(u, v);
      s.lineTo(L, 0); s.lineTo(L, h); s.lineTo(0, h); s.closePath();
      if (this.hole) {
        const n = this.hole, a = n.u - n.w / 2, b = n.u + n.w / 2, q = new T.Path();
        q.moveTo(a, n.v); q.lineTo(a, n.v + n.h); q.lineTo(b, n.v + n.h); q.lineTo(b, n.v); q.closePath();
        s.holes.push(q);
      }
      // Юбка ниже пола: в зеркальном полу лучи проходили под стеной в соседний зал, и по низу стен шла светлая полоса.
      // Обычная камера юбку не видит, а в отражении она берёт цвет нижнего ряда текстуры (UV ниже нуля прижимаются к краю).
      const skirt = new T.Shape(); skirt.moveTo(0, -2); skirt.lineTo(L, -2); skirt.lineTo(L, 0); skirt.lineTo(0, 0); skirt.closePath();
      const g = new T.ShapeGeometry([s, skirt], 1), p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / L, Math.max(p.getY(i) / h, .002));
      return g;
    }
  }

  function doorPts(u, p, h) {
    const a = u - p.w / 2, b = u + p.w / 2, top = Math.min(p.h, h);
    if (p.round) {
      // Проём со скруглёнными верхними углами, как арки главного зала.
      const q = Math.min(p.round, p.w / 2 - .01), pts = [[a, 0], [a, top - q]], n = 8;
      for (let i = 1; i <= n; i++) { const t = i / n * Math.PI / 2; pts.push([a + q - Math.cos(t) * q, top - q + Math.sin(t) * q]); }
      for (let i = 0; i < n; i++) { const t = i / n * Math.PI / 2; pts.push([b - q + Math.sin(t) * q, top - q + Math.cos(t) * q]); }
      pts.push([b, top - q], [b, 0]);
      return pts;
    }
    if (!p.jag) return [[a, 0], [a, top], [b, top], [b, 0]];
    const r = rng(2024), pts = [[a + .12, 0]];
    for (let v = .3; v < top; v += .22 + r() * .2) pts.push([a + .08 + r() * .18, v]);
    for (let q = a + .3; q < b - .2; q += .2 + r() * .22) pts.push([q, top - .22 + r() * .2]);
    for (let v = top - .3; v > .2; v -= .22 + r() * .2) pts.push([b - .08 - r() * .18, v]);
    pts.push([b - .12, 0]);
    return pts;
  }

  // Круглая стена из плоских граней: R0 смотрит на север, номера идут по часовой стрелке на плане.
  function roundWalls(r) {
    const { n, a, x, z } = r.round, L = 2 * a * Math.tan(Math.PI / n), W = {};
    for (let k = 0; k < n; k++) {
      const t = -Math.PI / 2 + k * Math.PI * 2 / n, d = new T.Vector3(Math.cos(t), 0, Math.sin(t)), nrm = d.clone().negate();
      const u = new T.Vector3().crossVectors(UP, nrm), o = new T.Vector3(x, 0, z).addScaledVector(d, a).addScaledVector(u, -L / 2);
      W['R' + k] = new Wall(r, 'R' + k, o, nrm, L);
    }
    return W;
  }

  function makeWalls(r) {
    const Lx = r.x1 - r.x0, Lz = r.z1 - r.z0;
    const W = r.round ? roundWalls(r) : {
      N: new Wall(r, 'N', new T.Vector3(r.x0, 0, r.z0), new T.Vector3(0, 0, 1), Lx),
      S: new Wall(r, 'S', new T.Vector3(r.x1, 0, r.z1), new T.Vector3(0, 0, -1), Lx),
      W: new Wall(r, 'W', new T.Vector3(r.x0, 0, r.z1), new T.Vector3(1, 0, 0), Lz),
      E: new Wall(r, 'E', new T.Vector3(r.x1, 0, r.z0), new T.Vector3(-1, 0, 0), Lz)
    };
    // Перегородки идут парами граней: P1 и P2 у первой, P3 и P4 у второй. ax: 'x' кладёт перегородку вдоль оси x.
    r.parts.forEach(({ x, l, z, h, ax }, i) => {
      const a = `P${i * 2 + 1}`, b = `P${i * 2 + 2}`;
      if (ax === 'x') {
        W[a] = new Wall(r, a, new T.Vector3(x + l / 2, 0, z - .16), new T.Vector3(0, 0, -1), l);
        W[b] = new Wall(r, b, new T.Vector3(x - l / 2, 0, z + .16), new T.Vector3(0, 0, 1), l);
      } else {
        W[a] = new Wall(r, a, new T.Vector3(x - .16, 0, z - l / 2), new T.Vector3(-1, 0, 0), l);
        W[b] = new Wall(r, b, new T.Vector3(x + .16, 0, z + l / 2), new T.Vector3(1, 0, 0), l);
      }
      if (h) W[a].h = W[b].h = h;
    });
    (r.piers || []).forEach(([x, z], i) => {
      const s = r.pier || PIER, L = s * 2;
      W[`C${i}N`] = new Wall(r, `C${i}N`, new T.Vector3(x + s, 0, z - s), new T.Vector3(0, 0, -1), L);
      W[`C${i}S`] = new Wall(r, `C${i}S`, new T.Vector3(x - s, 0, z + s), new T.Vector3(0, 0, 1), L);
      W[`C${i}W`] = new Wall(r, `C${i}W`, new T.Vector3(x - s, 0, z - s), new T.Vector3(-1, 0, 0), L);
      W[`C${i}E`] = new Wall(r, `C${i}E`, new T.Vector3(x + s, 0, z + s), new T.Vector3(1, 0, 0), L);
    });
    if (r.niche) W[r.niche.key].hole = r.niche;
    for (const l of r.links) {
      const p = l.p, first = p.a === r.id;
      let key, u;
      if (r.round) {
        // Дверь попадает в ту грань круга, напротив которой стоит проход.
        const { n, x, z } = r.round, pt = p.axis === 'x' ? new T.Vector3(first ? r.x1 : r.x0, 0, p.c) : new T.Vector3(p.c, 0, first ? r.z1 : r.z0);
        key = 'R' + ((Math.round((Math.atan2(pt.z - z, pt.x - x) + Math.PI / 2) / (Math.PI * 2 / n)) % n + n) % n);
        u = pt.clone().sub(W[key].origin).dot(W[key].uDir);
      } else if (p.axis === 'x') { key = first ? 'E' : 'W'; u = first ? p.c - r.z0 : r.z1 - p.c; }
      else { key = first ? 'S' : 'N'; u = first ? r.x1 - p.c : p.c - r.x0; }
      W[key].doors.push({ u, p, pts: doorPts(u, first ? p : { ...p, jag: false }, r.h) });
    }
    for (const w of Object.values(W)) w.doors.sort((a, b) => a.u - b.u);
    return W;
  }

  // Десять слотов на зал. Пятое значение задаёт глубину ниши за плоскостью стены.
  const LAYOUT = {
    a: [['P1', .5, 5.4, 3.5], ['P2', .5, 2.4, 3], ['N', 5.9, 1.9, 2.4], ['N', 10.6, 1.7, 1.8], ['N', 13.3, 1.7, 1.8], ['N', 15.9, 1.5, 2], ['E', 3.05, 3, 2.2, -1.2], ['S', 10.1, 1.8, 1.9], ['S', 13.1, 2.4, 1.95], ['S', 16.2, 1.7, 2.3]],
    b: [['N', 2.5, 1, 1.3], ['N', 8.3, 1.3, 1], ['N', 11, 1, 1.3], ['N', 13.9, 1.4, 1.1]],
    j: [['C0S', .85, 1.4, 1.9], ['C1S', .85, 1.4, 1.9], ['C2S', .85, 1.4, 1.9], ['C3N', .85, 1.4, 1.9], ['C4N', .85, 1.4, 1.9], ['C5N', .85, 1.4, 1.9], ['N', 8.4, 3.2, 2.5], ['N', 12.7, 3.2, 2.5], ['S', 3.4, 3.2, 2.5], ['S', 13.3, 3.2, 2.5]],
    c: [['P1', .5, 7, 4.2], ['P2', .5, 6, 3.7], ['N', 1.2, 1.9, 1.9], ['N', 7.2, 2.5, 1.9], ['N', 11.8, 2.5, 1.9], ['N', 18.6, 1.8, 2.3], ['S', 3.2, 2.5, 1.9], ['S', 7.8, 1.8, 2.3], ['S', 12.2, 1.8, 2.3], ['S', 16.6, 2.5, 1.9]],
    // Рендер: слева экраны, в торце большой экран, справа постеры над автоматами. Шестое значение задаёт высоту центра.
    f: [['W', 5.5, 5, 2.8, 0, 1.85], ['W', 12.9, 1.3, 2.3, 0, 1.75], ['W', 19, 1.1, 1.9, 0, 1.65], ['W', 25.6, 1, 1, 0, 1.6], ['N', 5, 3.7, 2.1, 0, 2.05],
      ['E', 24.4, 1.15, 1.6, 0, 3.25], ['E', 21.6, 1.15, 1.6, 0, 3.25], ['E', 18.8, 1.15, 1.6, 0, 3.25], ['E', 16, 1.15, 1.6, 0, 3.25], ['E', 9.9, 1.2, 1.2, 0, 1.7]],
    // Белый куб: по две работы на каждой грани креста, по одной на восьми гранях круга. P и R считаются в долях грани.
    w: [
      ...['P1', 'P2', 'P3', 'P4'].flatMap(k => [[k, .23, 2, 1.4], [k, .77, 2, 1.4]]),
      ...[2, 3, 7, 8, 12, 13, 17, 18].map(k => ['R' + k, .5, 1.5, 1.15])
    ]
  };
  Object.assign(LAYOUT, Halls2.LAYOUT);

  // --- запекание стен, полов и потолков ----------------------------------------------------------

  function grain(g, w, h, a, seed) {
    const r = rng(seed); g.globalAlpha = a;
    for (let i = 0; i < w * h * .012; i++) { g.fillStyle = r() > .5 ? '#fff' : '#000'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    g.globalAlpha = 1;
  }
  function edges(g, w, h, s, c) {
    const band = (x0, y0, x1, y1, rx, ry, rw, rh) => { const l = g.createLinearGradient(x0, y0, x1, y1); l.addColorStop(0, c); l.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = l; g.fillRect(rx, ry, rw, rh); };
    band(0, h, 0, h - .55 * s, 0, h - .55 * s, w, .55 * s);
    band(0, 0, 0, .42 * s, 0, 0, w, .42 * s);
    band(0, 0, .7 * s, 0, 0, 0, .7 * s, h);
    band(w, 0, w - .7 * s, 0, w - .7 * s, 0, .7 * s, h);
  }
  // Каменная кладка: блоки вразбежку, слои травертина идут по горизонтали.
  function blocks(g, w, h, s, o) {
    const r = rng(o.seed), bw = o.bw * s, bh = o.bh * s;
    for (let j = 0, y = h; y > -bh; j++, y -= bh) for (let x = -(j % 2) * bw / 2; x < w; x += bw) {
      g.fillStyle = `hsl(${o.hue + (r() - .5) * 6} ${o.sat}% ${o.lum + (r() - .5) * o.vary}%)`;
      g.fillRect(x, y - bh, bw + 1, bh + 1);
      for (let i = 0; i < o.vein; i++) {
        g.fillStyle = r() > .5 ? `rgba(255,248,232,${.04 + r() * .1})` : `rgba(48,36,24,${.05 + r() * .12})`;
        g.fillRect(x + r() * bw * .8, y - bh + r() * bh, (.1 + r() * .7) * bw, Math.max(1, .012 * s * (.5 + r())));
      }
      g.fillStyle = 'rgba(36,28,20,.3)'; g.fillRect(x, y - bh, 1, bh); g.fillRect(x, y - 1, bw, 1);
    }
  }
  function pool(g, x, y, rx, ry, col, a) {
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.globalCompositeOperation = 'lighter';
    const l = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    l.addColorStop(0, `rgba(${col},${a})`); l.addColorStop(.6, `rgba(${col},${a * .3})`); l.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = l; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  }
  // Голубая подсветка вдоль пола, как плинтус из света.
  function ledBase(g, w, h, s) {
    const l = g.createLinearGradient(0, h, 0, h - .62 * s);
    l.addColorStop(0, 'rgba(96,176,255,.62)'); l.addColorStop(.4, 'rgba(96,176,255,.14)'); l.addColorStop(1, 'rgba(96,176,255,0)');
    g.fillStyle = l; g.fillRect(0, h - .62 * s, w, .62 * s);
    g.fillStyle = '#d4ecff'; g.fillRect(0, h - .026 * s, w, .026 * s);
  }
  function wallpaper(a, b, st) {
    const c = cv(st, st), g = c.getContext('2d');
    g.fillStyle = a; g.fillRect(0, 0, st, st); g.strokeStyle = b; g.lineWidth = 1.5;
    g.beginPath(); g.arc(st / 2, st / 2, st * .22, 0, 7); g.moveTo(st / 2, 0); g.lineTo(st / 2, st * .28); g.moveTo(st / 2, st * .72); g.lineTo(st / 2, st); g.stroke();
    return c;
  }
  const RENDER_NAMES = { N: 'Стена_Север', S: 'Стена_Юг', W: 'Стена_Запад', E: 'Стена_Восток', P1: 'Перегородка', P2: 'Перегородка' };
  const BAKE = {
    // Рендер: светлый зал из концепта. Ровные стены, отсветы светильников, подписи объектов как в редакторе.
    render(wall, g, w, h, s, X, Y) {
      const l = g.createLinearGradient(0, 0, 0, h);
      l.addColorStop(0, '#c9cad3'); l.addColorStop(.6, '#bdbec8'); l.addColorStop(1, '#b1b2bd'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      // Мягкий отсвет трековых светильников по верху стены.
      for (let u = .9; u < wall.L; u += 1.6) pool(g, X(u), Y(wall.h - .35), .55 * s, 1.1 * s, '255,250,240', .16);
      for (const a of wall.items) pool(g, X(a.u), Y(a.v), (a.wid * .6 + .6) * s, (a.hgt * .6 + .5) * s, a.v > 2.5 ? '200,160,255' : '150,120,255', .12);
      g.fillStyle = '#b4b7bf'; g.fillRect(0, h - .05 * s, w, .05 * s);
      g.font = `500 ${.06 * s}px ${MONO}`; g.fillStyle = 'rgba(30,34,40,.45)';
      if (WALL_TEXT) g.fillText(`${RENDER_NAMES[wall.key] || 'Объект'}.00${'NSWE'.indexOf(wall.key) + 1}  ·  4 вершины, 1 грань`, X(.18), Y(.14));
    },
    atrium(wall, g, w, h, s, X, Y) {
      const pier = wall.key[0] === 'P', seed = wall.id.charCodeAt(1) * 17 + 3;
      blocks(g, w, h, s, pier ? { hue: 33, sat: 13, lum: 63, vary: 6, bw: 1.7, bh: .64, vein: 16, seed } : { hue: 38, sat: 11, lum: 85, vary: 3, bw: .92, bh: .31, vein: 4, seed });
      const l = g.createLinearGradient(0, 0, 0, h);
      l.addColorStop(0, 'rgba(255,255,255,.5)'); l.addColorStop(.45, 'rgba(255,255,255,.08)'); l.addColorStop(1, 'rgba(112,90,64,.16)');
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      for (const a of wall.items) if (!a.depth) pool(g, X(a.u), Y(a.v + a.hgt * .45), (a.wid * .7 + .9) * s, (a.hgt * .6 + .9) * s, '255,226,186', pier ? .3 : .16);
      edges(g, w, h, s * .7, 'rgba(84,68,50,.14)');
      for (const d of wall.doors) { g.strokeStyle = 'rgba(70,58,44,.3)'; g.lineWidth = .025 * s; g.strokeRect(X(d.u - d.p.w / 2 - .02), Y(d.p.h + .02), (d.p.w + .04) * s, (d.p.h + .1) * s); }
    },
    travertine(wall, g, w, h, s, X, Y) {
      blocks(g, w, h, s, { hue: 34, sat: 15, lum: 45, vary: 6, bw: 1.9, bh: .78, vein: 26, seed: wall.id.charCodeAt(1) * 13 + wall.id.charCodeAt(2 % wall.id.length) });
      const l = g.createLinearGradient(0, 0, 0, h);
      l.addColorStop(0, 'rgba(14,10,6,.5)'); l.addColorStop(.42, 'rgba(14,10,6,.06)'); l.addColorStop(1, 'rgba(14,10,6,.3)');
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      const step = wall.L > 4 ? 3.9 : wall.L;
      for (let u = step / 2; u < wall.L; u += step) pool(g, X(u), Y(3.1), 1.5 * s, 2.4 * s, '255,214,160', .34);
      for (const a of wall.items) pool(g, X(a.u), Y(a.v + a.hgt * .4), (a.wid * .7 + .7) * s, (a.hgt * .55 + .8) * s, '255,226,186', .3);
      ledBase(g, w, h, s);
      for (const d of wall.doors) if (!d.p.jag) { g.fillStyle = 'rgba(10,8,6,.5)'; g.fillRect(X(d.u - d.p.w / 2 - .1), Y(d.p.h + .1), (d.p.w + .2) * s, (d.p.h + .1) * s); }
      if (wall.id === 'jE') {
        for (const [u, q] of [[2.6, 2.5], [11.5, 2.5]]) {
          g.fillStyle = '#16120f'; g.beginPath(); g.moveTo(X(u - q / 2), h); g.lineTo(X(u - q / 2), Y(2.4)); g.arc(X(u), Y(2.4), q / 2 * s, Math.PI, 0); g.lineTo(X(u + q / 2), h); g.fill();
          pool(g, X(u), Y(.1), q * .7 * s, 1 * s, '96,176,255', .46);
        }
      }
    },
    scifi(wall, g, w, h, s, X, Y) {
      g.fillStyle = '#2b2c31'; g.fillRect(0, 0, w, h);
      const r = rng(wall.id.charCodeAt(1) * 7);
      for (let u = 0; u < wall.L; u += 2.7) { g.fillStyle = `hsl(228 5% ${17 + r() * 3}%)`; g.fillRect(X(u) + 2, 0, 2.7 * s - 4, h); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(X(u), 0, .03 * s, h); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(X(u) + .03 * s, 0, .012 * s, h); }
      const plate = (x, y, pw, ph, c) => {
        const k = Math.min(pw, ph) * .12;
        g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + pw - k, y); g.lineTo(x + pw, y + k); g.lineTo(x + pw, y + ph - k); g.lineTo(x + pw - k, y + ph); g.lineTo(x + k, y + ph); g.lineTo(x, y + ph - k); g.lineTo(x, y + k); g.closePath();
        g.fillStyle = c; g.fill();
      };
      for (const a of wall.items) {
        const pw = (a.wid + .5) * s, ph = (a.hgt + .62) * s, x = X(a.u) - pw / 2, y = Y(a.v + a.hgt / 2 + .24);
        plate(x - .03 * s, y - .03 * s, pw + .06 * s, ph + .06 * s, '#3b3c42'); plate(x, y, pw, ph, '#1e1f23');
        g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = .012 * s;
        g.beginPath(); g.moveTo(x, y + ph * .2); g.lineTo(x + pw * .2, y); g.moveTo(x + pw, y + ph * .8); g.lineTo(x + pw * .8, y + ph); g.stroke();
        const ix = X(a.u) - .19 * s, iy = Y(a.v - a.hgt / 2 - .2);
        g.shadowColor = '#ff4a18'; g.shadowBlur = .16 * s; g.fillStyle = '#ff4518'; g.fillRect(ix, iy, .38 * s, .085 * s); g.shadowBlur = 0;
      }
      g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, Y(.5), w, .028 * s); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, Y(.5) + .028 * s, w, .012 * s);
      const t = g.createLinearGradient(0, 0, 0, 1.1 * s);
      t.addColorStop(0, 'rgba(240,245,255,.34)'); t.addColorStop(1, 'rgba(240,245,255,0)');
      g.fillStyle = t; g.fillRect(0, 0, w, 1.1 * s);
      g.fillStyle = '#e6ebf2'; g.fillRect(0, 0, w, .15 * s);
      g.fillStyle = '#50535c'; g.fillRect(0, .15 * s, w, .08 * s);
      g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = .1 * s;
      for (let u = .25; u < wall.L - .3; u += .78) g.fillRect(X(u), .17 * s, .46 * s, .04 * s);
      g.shadowBlur = 0;
      ledBase(g, w, h, s * .8);
      for (const d of wall.doors) { g.strokeStyle = '#59e1ff'; g.lineWidth = .02 * s; g.strokeRect(X(d.u - d.p.w / 2 - .03), Y(d.p.h + .03), (d.p.w + .06) * s, (d.p.h + .1) * s); }
    },
    back(wall, g, w, h, s, X, Y) {
      g.fillStyle = '#b79f52'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(112,90,30,.2)'; g.lineWidth = 1.4;
      const st = .32 * s;
      for (let x = 0; x < w; x += st) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
        for (let y = (x / st % 2) * st * .6; y < h; y += st * 1.2) { g.beginPath(); g.moveTo(x + st * .5, y); g.lineTo(x + st * .7, y + st * .25); g.lineTo(x + st * .5, y + st * .5); g.lineTo(x + st * .3, y + st * .25); g.closePath(); g.stroke(); }
      }
      const r = rng(wall.id.charCodeAt(1) * 31);
      for (let u = 1.2; u < wall.L; u += 2.4) {
        const x = X(u), l = g.createRadialGradient(x, 0, 0, x, 0, 2.3 * s);
        l.addColorStop(0, 'rgba(255,250,190,.58)'); l.addColorStop(1, 'rgba(255,250,190,0)');
        g.fillStyle = l; g.fillRect(x - 2.4 * s, 0, 4.8 * s, h);
      }
      for (let i = 0; i < 9; i++) {
        const x = r() * w, y = r() * h, rad = (.3 + r() * 1.1) * s, l = g.createRadialGradient(x, y, 0, x, y, rad);
        l.addColorStop(0, 'rgba(70,52,16,.26)'); l.addColorStop(1, 'rgba(70,52,16,0)');
        g.fillStyle = l; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      g.fillStyle = '#6d5a2a'; g.fillRect(0, h - .1 * s, w, .1 * s);
      edges(g, w, h, s * .7, 'rgba(60,44,12,.46)');
      for (const d of wall.doors) if (!d.p.jag) {
        g.shadowColor = '#ff3020'; g.shadowBlur = .2 * s; g.fillStyle = '#ff5a48'; g.font = `700 ${.14 * s}px ${SANS}`; g.textAlign = 'center';
        g.fillText('ВЫХОД', X(d.u), Y(2.3)); g.fillText('ВЫХОД', X(d.u), Y(2.3)); g.textAlign = 'left'; g.shadowBlur = 0;
      }
    },
    night(wall, g, w, h, s, X, Y) {
      g.fillStyle = '#090a0e'; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'lighter';
      for (const a of wall.items) {
        const x = X(a.u), y = Y(a.v), rad = (Math.max(a.wid, a.hgt) * .9 + 1.1) * s, [r, gg, b] = a.avg;
        const l = g.createRadialGradient(x, y, a.hgt * .3 * s, x, y, rad);
        l.addColorStop(0, `rgba(${r},${gg},${b},.62)`); l.addColorStop(.5, `rgba(${r},${gg},${b},.16)`); l.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        g.fillStyle = l; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      g.globalCompositeOperation = 'source-over';
      edges(g, w, h, s, 'rgba(0,0,0,.4)');
      for (const d of wall.doors) { g.strokeStyle = '#23262e'; g.lineWidth = .025 * s; g.strokeRect(X(d.u - d.p.w / 2 - .03), Y(d.p.h + .03), (d.p.w + .06) * s, (d.p.h + .03) * s); }
    },
    flat(wall, g, w, h, s, X, Y) {
      g.fillStyle = g.createPattern(wallpaper('#8d8469', '#7b725a', Math.round(.42 * s)), 'repeat'); g.fillRect(0, 0, w, h);
      g.fillStyle = '#4e4436'; g.fillRect(0, h - .12 * s, w, .12 * s);
      const l = g.createRadialGradient(X(wall.L / 2), 0, 0, X(wall.L / 2), 0, 3.4 * s);
      l.addColorStop(0, 'rgba(255,226,160,.42)'); l.addColorStop(1, 'rgba(30,20,6,.42)');
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      edges(g, w, h, s * .6, 'rgba(20,14,6,.6)');
      if (wall.id === 'dW') {
        g.fillStyle = '#3b3126'; g.fillRect(X(2), Y(1.85), .9 * s, .05 * s);
        [['#6a4a30', 2.15, 1.1], ['#37404e', 2.5, .95]].forEach(([c, u, ln]) => { g.fillStyle = c; g.beginPath(); g.moveTo(X(u - .13), Y(1.8)); g.lineTo(X(u + .13), Y(1.8)); g.lineTo(X(u + .21), Y(1.8 - ln)); g.lineTo(X(u - .21), Y(1.8 - ln)); g.fill(); });
      }
      for (const d of wall.doors) if (d.p.gate || d.p.b === 'a') { g.fillStyle = '#d7d0bd'; g.fillRect(X(d.u - d.p.w / 2 - .09), Y(d.p.h + .09), (d.p.w + .18) * s, (d.p.h + .09) * s); }
    },
    bedroom(wall, g, w, h, s, X, Y) {
      g.fillStyle = g.createPattern(wallpaper('#2d3248', '#343a54', Math.round(.42 * s)), 'repeat'); g.fillRect(0, 0, w, h);
      if (wall.key === 'N') {
        const l = g.createRadialGradient(X(3.6 + 4.1 - 3.6), Y(1.2), 0, X(4.1), Y(1.2), 4 * s);
        l.addColorStop(0, 'rgba(70,160,255,.62)'); l.addColorStop(1, 'rgba(70,160,255,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      }
      const st = g.createLinearGradient(0, 0, w, 0);
      ['#ff2e8c', '#7a4dff', '#2fd6ff', '#ff2e8c'].forEach((c, i) => st.addColorStop(i / 3, c));
      g.fillStyle = st; g.globalAlpha = .9; g.fillRect(0, .06 * s, w, .03 * s); g.globalAlpha = .18; g.fillRect(0, 0, w, .5 * s); g.globalAlpha = 1;
      g.fillStyle = '#1b1c26'; g.fillRect(0, h - .1 * s, w, .1 * s);
      edges(g, w, h, s * .6, 'rgba(4,4,12,.6)');
      if (wall.id === 'eW') {
        g.fillStyle = '#10121d'; g.fillRect(X(1.4), Y(1.95), 1.5 * s, 1 * s);
        g.fillStyle = '#d5d9ee'; g.font = `800 ${.2 * s}px ${SANS}`; g.fillText('ТЫ НЕ', X(1.55), Y(1.6)); g.fillText('ОДИН?', X(1.55), Y(1.32));
      }
      if (wall.id === 'eE') { g.fillStyle = '#433326'; const u = wall.doors[0].u; g.fillRect(X(u - .85), Y(2.3), 1.7 * s, 2.3 * s); g.fillStyle = '#30241b'; g.fillRect(X(u - .03), Y(2.3), .06 * s, .2 * s); }
    },
    outdoor(wall, g, w, h, s, X, Y) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#070b1e'); sky.addColorStop(.72, '#23224a'); sky.addColorStop(.88, '#6d3a5d');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      if (wall.key === 'E') {
        g.fillStyle = '#26262f'; g.fillRect(0, Y(6.2), w, 6.2 * s);
        g.fillStyle = '#31313c'; for (let u = .6; u < wall.L; u += 2) g.fillRect(X(u), Y(6.2), .7 * s, 6.2 * s);
        g.fillStyle = '#5a5a68'; g.fillRect(0, Y(6.3), w, .2 * s);
        for (const d of wall.doors) { g.fillStyle = '#b89a5c'; g.fillRect(X(d.u - d.p.w / 2 - .12), Y(d.p.h + .12), (d.p.w + .24) * s, (d.p.h + .12) * s); }
        return;
      }
      const r = rng(wall.id.charCodeAt(1));
      g.fillStyle = '#d7dcf0';
      for (let i = 0; i < 90; i++) g.fillRect(r() * w, r() * h * .7, 1.6, 1.6);
      for (let k = 0; k < 4; k++) {
        const c = ['#0d1420', '#0b1a1a', '#0a1616', '#071210'][k], base = 2.6 - k * .46;
        g.fillStyle = c; g.beginPath(); g.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) g.lineTo(x, Y(base + Math.sin(x * .013 + k) * .35 + Math.sin(x * .05 + k * 3) * .12));
        g.lineTo(w, h); g.fill();
      }
      for (let u = .4; u < wall.L; u += 1.3 + r() * 1.6) {
        const hh = 1.1 + r() * 1.2, ww = .28 + r() * .24;
        g.fillStyle = '#050d0c'; g.fillRect(X(u) - 2, Y(hh), 4, hh * s);
        g.beginPath(); g.moveTo(X(u - ww), Y(.4)); g.lineTo(X(u), Y(hh + 1)); g.lineTo(X(u + ww), Y(.4)); g.fill();
      }
    },
    // Светлый минимализм: свет от линий на потолке уже лежит в текстуре, рамы оставляют мягкую тень.
    white(wall, g, w, h, s, X, Y) {
      const k = wall.key[0];
      if (k === 'C') {
        const l = g.createLinearGradient(0, 0, 0, h);
        l.addColorStop(0, '#1d1e21'); l.addColorStop(.5, '#0e0f11'); l.addColorStop(1, '#16171a');
        g.fillStyle = l; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(235,236,240,.55)'; g.fillRect(0, 0, Math.max(1.5, .012 * s), h); g.fillRect(w - Math.max(1.5, .012 * s), 0, Math.max(1.5, .012 * s), h);
        for (const a of wall.items) { g.strokeStyle = '#3a3b40'; g.lineWidth = Math.max(1.5, .012 * s); g.strokeRect(X(a.u - a.wid / 2 - .04), Y(a.v + a.hgt / 2 + .04), (a.wid + .08) * s, (a.hgt + .08) * s); }
        return;
      }
      const part = k === 'P', l = g.createLinearGradient(0, 0, 0, h), lw = Math.max(1.5, .012 * s);
      if (part) { l.addColorStop(0, '#f7f7f8'); l.addColorStop(.7, '#efeff1'); l.addColorStop(1, '#dcdcdf'); }
      else { l.addColorStop(0, '#f4f4f6'); l.addColorStop(.1, '#e9e9ec'); l.addColorStop(.75, '#e4e4e7'); l.addColorStop(1, '#d2d2d6'); }
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      // Тонкая тёмная обводка по краям перегородки, как на чертеже. У круглой стены только швы с полом и потолком,
      // вертикальных линий нет: так грани читаются как одна гладкая стена.
      g.strokeStyle = '#3c3d42'; g.lineWidth = lw;
      if (part) g.strokeRect(lw / 2, lw / 2, w - lw, h + lw);
      else { g.globalAlpha = .35; g.fillStyle = '#3c3d42'; g.fillRect(0, 0, w, lw); g.fillRect(0, h - lw, w, lw); g.globalAlpha = 1; }
      for (const d of wall.doors) { g.strokeStyle = 'rgba(60,62,70,.4)'; g.lineWidth = Math.max(1.5, .012 * s); g.strokeRect(X(d.u - d.p.w / 2 - .02), Y(d.p.h + .02), (d.p.w + .04) * s, (d.p.h + .1) * s); }
    },
    club(wall, g, w, h, s, X, Y) {
      g.fillStyle = '#100a18'; g.fillRect(0, 0, w, h);
      const n = 20;
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const x = (i + .5) / n * w, c = ['#ff2e8c', '#7a4dff', '#2fd6ff'][i % 3], l = g.createLinearGradient(0, h, 0, 0);
        l.addColorStop(0, c); l.addColorStop(.5, 'rgba(0,0,0,0)');
        g.fillStyle = l; g.globalAlpha = .28; g.fillRect(x - w / n * .4, 0, w / n * .8, h); g.globalAlpha = 1;
      }
      g.globalCompositeOperation = 'source-over';
      edges(g, w, h, s, 'rgba(0,0,0,.5)');
    }
  };

  function bakeWall(wall) {
    const r = wall.room, wantText = /^(aN|aW|bN|cN|fN|eW|jN|wR15)$/.test(wall.id) ? 118 : 76;
    const s = Math.min(2048 / wall.L, (Halls2.res[r.style] || wantText) * Q), w = Math.round(wall.L * s), h = Math.round(wall.h * s);
    const c = cv(w, h), g = c.getContext('2d');
    const X = u => u * s, Y = v => h - v * s;
    (BAKE[r.style] || Halls2.bake[r.style])(wall, g, w, h, s, X, Y);
    if (/atrium|travertine|back|white|render/.test(r.style) && wall.key[0] !== 'C') for (const a of wall.items) if (!a.depth) {
      g.save();
      g.shadowColor = r.style === 'atrium' ? 'rgba(40,30,20,.42)' : r.style === 'back' ? 'rgba(40,28,6,.6)' : r.style === 'white' ? 'rgba(30,32,40,.34)' : r.style === 'render' ? 'rgba(20,22,30,.4)' : 'rgba(8,6,4,.6)';
      g.shadowBlur = .13 * s; g.shadowOffsetY = .09 * s; g.fillStyle = '#000';
      g.fillRect(X(a.u - a.wid / 2 - .05), Y(a.v + a.hgt / 2 + .05), (a.wid + .1) * s, (a.hgt + .1) * s);
      g.restore();
    }
    wallText(wall, g, s, X, Y);
    return c;
  }

  function wallText(wall, g, s, X, Y) {
    if (!WALL_TEXT) return;
    const id = wall.id;
    if (id === 'aN') {
      g.fillStyle = '#26221d';
      g.font = `700 ${.46 * s}px ${SANS}`; g.fillText('NETIZEN LAB', X(.75), Y(4.22));
      g.font = `300 ${.2 * s}px ${SANS}`; g.fillText('Атриум. Кэш', X(.75), Y(3.86));
      g.font = `400 ${.11 * s}px ${SANS}`; g.fillStyle = '#4a4238';
      ['Здесь хранится то, что интернет', 'обещал не забыть. Работы сюда', 'привозят сами авторы.', '', 'Картины трогать нельзя.', 'Стены можно. Вообще все.']
        .forEach((l, i) => g.fillText(l, X(.77), Y(3.48 - i * .175)));
    }
    if (id === 'aW' && EXTRAS) {
      g.fillStyle = '#26221d'; g.font = `400 ${.095 * s}px ${SANS}`; g.fillText('Банан. Инв. № 0001.', X(11.2), Y(1.42));
      g.fillStyle = '#5c5347'; g.fillText('Предыдущий съел смотритель.', X(11.2), Y(1.28));
    }
    if (id === 'jN') { g.fillStyle = '#f0e6d6'; g.font = `300 ${.3 * s}px ${SANS}`; g.fillText('Колонный зал', X(6.8), Y(4.3)); }
    if (id === 'bN') { g.fillStyle = '#5b4a1e'; g.font = `600 ${.17 * s}px ${SANS}`; g.fillText('Нижний уровень', X(.4), Y(2.4)); }
    if (id === 'cN') { g.fillStyle = '#c7c8d4'; g.font = `300 ${.3 * s}px ${SANS}`; g.fillText('Ночной режим', X(6.8), Y(4.3)); }
    if (id === 'wR15') {
      g.fillStyle = '#2a2b30'; g.font = `300 ${.34 * s}px ${SANS}`; g.fillText('Белый куб', X(.3), Y(3.1));
      g.fillStyle = '#5d5f66'; g.font = `400 ${.1 * s}px ${SANS}`;
      ['Крест делит зал на четыре стороны.', 'Насквозь не пройти, только по кругу.'].forEach((l, i) => g.fillText(l, X(.32), Y(2.86 - i * .15)));
    }
    if (id === 'fN') { g.fillStyle = '#1d2026'; g.font = `800 ${.36 * s}px ${SANS}`; g.fillText('Рендер', X(.6), Y(2.42)); g.fillStyle = '#4c515c'; g.font = `400 ${.11 * s}px ${SANS}`; g.fillText('Зал цифрового искусства. Сцена не дорендерилась.', X(.62), Y(2.16)); g.fillText('Так и задумано: здесь видно, из чего всё сделано.', X(.62), Y(2.01)); }
  }

  // Отсвет светодиодных колец: несколько мягких мазков разной ширины вместо размытия.
  function glowArcs(g, r, cx, cy, s, k) {
    g.lineCap = 'round';
    for (const q of r.arcs) for (const [wd, al] of [[1.6, .06], [.8, .1], [.36, .2], [.14, .4]]) {
      g.strokeStyle = `rgba(255,255,255,${al * k})`; g.lineWidth = wd * s;
      g.beginPath(); g.arc(cx, cy, q.rad * s, q.a0, q.a1); g.stroke();
    }
  }

  function bakeFloor(r) {
    const L = r.x1 - r.x0, D = r.z1 - r.z0, s = Math.min(48 * Q, 1024 / Math.max(L, D)), w = Math.round(L * s), h = Math.round(D * s);
    const c = cv(w, h), g = c.getContext('2d'), u = rng(L * 13 + D);
    if (Halls2.floor[r.style]) { Halls2.floor[r.style](r, g, w, h, s); return c; }
    if (r.style === 'atrium') {
      g.fillStyle = '#f1eee8'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(120,108,92,.12)';
      for (let x = 0; x < w; x += 1.8 * s) g.fillRect(x, 0, 1, h);
      for (let y = 0; y < h; y += 1.8 * s) g.fillRect(0, y, w, 1);
      const q = r.light, sx = (q.x0 + 1.4 - r.x0) * s, sz = (q.z0 + 1.2 - r.z0) * s, sw = (q.x1 - q.x0) * s, sh = (q.z1 - q.z0) * s;
      g.save(); g.filter = `blur(${Math.round(.1 * s)}px)`; g.fillStyle = 'rgba(255,252,240,.9)';
      g.beginPath(); g.moveTo(sx, sz); g.lineTo(sx + sw, sz); g.lineTo(sx + sw + .9 * s, sz + sh); g.lineTo(sx + .9 * s, sz + sh); g.fill(); g.restore();
      edges(g, w, h, s * .8, 'rgba(84,72,56,.18)');
    } else if (r.style === 'travertine') {
      for (let j = 0, y = 0; y < h; j++, y += .9 * s) for (let x = -(j % 2) * .9 * s; x < w; x += 1.8 * s) {
        g.fillStyle = `hsl(28 5% ${25 + u() * 7}%)`; g.fillRect(x, y, 1.8 * s, .9 * s);
        for (let i = 0; i < 12; i++) { g.fillStyle = u() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; g.fillRect(x + u() * 1.4 * s, y + u() * .9 * s, (.2 + u() * .6) * s, 1.5); }
        g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y, 1, .9 * s); g.fillRect(x, y, 1.8 * s, 1);
      }
      for (let x = 2; x < L; x += 3.9) for (const z of [.9, D / 2, D - .9]) pool(g, x * s, z * s, 2.2 * s, 2.2 * s, '255,214,160', .13);
      edges(g, w, h, s * .55, 'rgba(120,190,255,.42)');
      for (const [x, z] of r.piers) {
        const px = (x - PIER - r.x0) * s, pz = (z - PIER - r.z0) * s, ps = PIER * 2 * s;
        g.save(); g.shadowColor = 'rgba(120,190,255,.95)'; g.shadowBlur = .7 * s; g.fillStyle = '#7fc0ff'; g.fillRect(px, pz, ps, ps); g.fillRect(px, pz, ps, ps); g.restore();
      }
    } else if (r.style === 'render') {
      const X = x => (x - r.x0) * s, Z = z => (z - r.z0) * s, F = RENDER, t = 1.25;
      // Крупная серая плитка со светлыми швами.
      for (let x = 0; x < L; x += t) for (let z = 0; z < D; z += t) { g.fillStyle = `hsl(232 7% ${52 + u() * 3}%)`; g.fillRect(x * s, z * s, t * s, t * s); }
      g.fillStyle = 'rgba(205,207,218,.55)';
      for (let x = 0; x <= L; x += t) g.fillRect(x * s, 0, 1, h);
      for (let z = 0; z <= D; z += t) g.fillRect(0, z * s, w, 1);
      g.save(); g.filter = `blur(${Math.round(.16 * s)}px)`; g.fillStyle = 'rgba(30,32,44,.35)';
      for (const [x, z, sz] of F.plinths) g.fillRect(X(x - sz / 2 - .1), Z(z - sz / 2 - .1), (sz + .2) * s, (sz + .2) * s);
      for (const [x, z, bw, bd] of F.benches) g.fillRect(X(x - bw / 2), Z(z - bd / 2), bw * s, bd * s);
      for (const z of [-12.4, -14.4, -16.4, -18.4, -20.4]) g.fillRect(X(25.6), Z(z - .55), 1.4 * s, 1.1 * s);
      g.restore();
      pool(g, X(DANCER.x), Z(DANCER.z), 2.3 * s, 2.3 * s, '255,236,200', .3);
      pool(g, X(DANCER.x), Z(DANCER.z), 3.2 * s, 3.2 * s, '255,79,216', .08);
      pool(g, X(F.mascot.x), Z(F.mascot.z), 1.3 * s, 1.3 * s, '125,255,106', .16);
      F.tubes.forEach(([x, z, , c]) => pool(g, X(x), Z(z), .8 * s, .8 * s, c, .16));
      for (let z = -9.5; z > -35; z -= 1.5) for (const x of [19.2, 24.8]) pool(g, X(x), Z(z), .9 * s, .9 * s, '255,246,226', .05);
    } else if (r.style === 'scifi') {
      for (let y = 0, j = 0; y < h; j++, y += .24 * s) {
        g.fillStyle = `hsl(${9 + u() * 5} 46% ${13 + u() * 6}%)`; g.fillRect(0, y, w, .24 * s);
        for (let x = (j % 3) * 1.1 * s; x < w; x += 2.6 * s) { g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x, y, 2, .24 * s); }
        g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, y, w, 1);
      }
      edges(g, w, h, s * .5, 'rgba(120,200,255,.3)');
    } else if (r.style === 'back') {
      g.fillStyle = '#7f6d3d'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * .14; i++) { g.fillStyle = u() > .5 ? 'rgba(170,150,90,.22)' : 'rgba(46,36,14,.22)'; g.fillRect(u() * w, u() * h, 2, 2); }
      for (let i = 0; i < 16; i++) { const x = u() * w, y = u() * h, rd = (.5 + u() * 1.6) * s, l = g.createRadialGradient(x, y, 0, x, y, rd); l.addColorStop(0, 'rgba(38,28,10,.4)'); l.addColorStop(1, 'rgba(38,28,10,0)'); g.fillStyle = l; g.fillRect(x - rd, y - rd, rd * 2, rd * 2); }
      edges(g, w, h, s * .7, 'rgba(36,26,8,.4)');
    } else if (r.style === 'white') {
      const X = x => (x - r.x0) * s, Z = z => (z - r.z0) * s, { x: cx, z: cz, a } = r.round;
      const l = g.createRadialGradient(X(cx), Z(cz), 0, X(cx), Z(cz), a * s);
      l.addColorStop(0, '#e6e6e9'); l.addColorStop(.75, '#dcdcdf'); l.addColorStop(1, '#c9c9cd'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      // Мягкие тени у основания креста и колонны.
      g.save(); g.filter = `blur(${Math.round(.22 * s)}px)`; g.fillStyle = 'rgba(60,62,70,.3)';
      for (const q of r.parts) if (q.ax === 'x') g.fillRect(X(q.x - q.l / 2 - .08), Z(q.z - .32), (q.l + .16) * s, .64 * s); else g.fillRect(X(q.x - .32), Z(q.z - q.l / 2 - .08), .64 * s, (q.l + .16) * s);
      for (const [x, z] of r.piers) g.fillRect(X(x - r.pier - .2), Z(z - r.pier - .2), (r.pier * 2 + .4) * s, (r.pier * 2 + .4) * s);
      g.restore();
      glowArcs(g, r, X(cx), Z(cz), s, .8);
    } else if (r.style === 'night') {
    } else if (r.style === 'night') {
      g.fillStyle = '#0a0b0f'; g.fillRect(0, 0, w, h); grain(g, w, h, .03, 4);
    } else if (r.style === 'flat') {
      g.fillStyle = '#6e5a3e'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += .2 * s) { g.fillStyle = `rgba(30,16,6,${.05 + u() * .14})`; g.fillRect(0, y, w, .2 * s - 1); g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(0, y, w, 1); }
      edges(g, w, h, s * .8, 'rgba(20,10,4,.5)');
    } else if (r.style === 'bedroom') {
      g.fillStyle = '#23211f'; g.fillRect(0, 0, w, h);
      const l = g.createRadialGradient(w * .6, 0, 0, w * .6, 0, h * 1.1);
      l.addColorStop(0, 'rgba(70,150,255,.36)'); l.addColorStop(1, 'rgba(70,150,255,0)'); g.fillStyle = l; g.fillRect(0, 0, w, h);
      g.fillStyle = '#40384a'; g.fillRect(w * .34, h * .28, w * .4, h * .5);
      grain(g, w, h, .04, 7); edges(g, w, h, s * .6, 'rgba(0,0,0,.5)');
    } else if (r.style === 'outdoor') {
      g.fillStyle = '#0e1d18'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h * .05; i++) { g.fillStyle = ['#183329', '#1f4233', '#0a1713'][Math.floor(u() * 3)]; g.fillRect(u() * w, u() * h, 2, 3); }
      g.strokeStyle = '#46423c'; g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(w, h / 2); g.bezierCurveTo(w * .6, h * .54, w * .5, h * .3, w * .2, h * .3); g.moveTo(w * .62, h * .5); g.bezierCurveTo(w * .5, h * .64, w * .4, h * .74, w * .15, h * .76); g.stroke();
    } else {
      g.fillStyle = '#0b0910'; g.fillRect(0, 0, w, h);
    }
    return c;
  }

  function bakeCeiling(r) {
    const L = r.x1 - r.x0, D = r.z1 - r.z0, s = 30 * Q, w = Math.round(L * s), h = Math.round(D * s);
    const c = cv(w, h), g = c.getContext('2d');
    if (Halls2.ceil[r.style]) { Halls2.ceil[r.style](r, g, w, h, s); return c; }
    if (r.style === 'atrium') {
      g.fillStyle = '#d9d5cc'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 2.4 * s) for (let y = 0; y < h; y += 2.4 * s) { const l = g.createRadialGradient(x + 1.2 * s, y + 1.2 * s, 0, x + 1.2 * s, y + 1.2 * s, 1.7 * s); l.addColorStop(0, '#f6f4ef'); l.addColorStop(1, '#d2cdc3'); g.fillStyle = l; g.fillRect(x, y, 2.4 * s, 2.4 * s); }
    } else if (r.style === 'travertine') {
      blocks(g, w, h, s, { hue: 34, sat: 13, lum: 27, vary: 5, bw: 2.4, bh: 1.2, vein: 18, seed: 41 });
      g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(0, 0, w, h);
      for (let x = 2; x < L; x += 3.9) for (const z of [.9, D / 2, D - .9]) { g.fillStyle = '#ffe9c8'; g.shadowColor = '#ffcf94'; g.shadowBlur = .5 * s; g.beginPath(); g.arc(x * s, z * s, .09 * s, 0, 7); g.fill(); g.shadowBlur = 0; }
    } else if (r.style === 'render') {
      g.fillStyle = '#b9bac3'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(60,64,74,.12)';
      for (let x = 1.25; x < L; x += 1.25) g.fillRect(x * s, 0, 1, h);
      for (let z = 1.25; z < D; z += 1.25) g.fillRect(0, z * s, w, 1);
      // Строки потолка идут с юга на север. Тень вокруг светового колодца и отсветы трубок.
      const q = r.light, x0 = (q.x0 - r.x0) * s, y0 = (r.z1 - q.z1) * s, qw = (q.x1 - q.x0) * s, qh = (q.z1 - q.z0) * s;
      g.save(); g.filter = `blur(${Math.round(.12 * s)}px)`; g.strokeStyle = 'rgba(40,44,54,.35)'; g.lineWidth = .18 * s; g.strokeRect(x0, y0, qw, qh); g.restore();
      RENDER.tubes.forEach(([x, z, , c]) => pool(g, (x - r.x0) * s, (r.z1 - z) * s, .7 * s, .7 * s, c, .3));
    } else if (r.style === 'scifi') {
      g.fillStyle = '#1b1c20'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < w; x += 1.4 * s) g.fillRect(x, 0, 1, h);
      g.shadowColor = '#dfe8ff'; g.shadowBlur = .4 * s; g.fillStyle = '#f2f5fb';
      for (const y of [1.2, D - 1.2]) g.fillRect(.8 * s, y * s, w - 1.6 * s, .14 * s);
      g.shadowBlur = 0;
    } else if (r.style === 'back') {
      g.fillStyle = '#b8ac84'; g.fillRect(0, 0, w, h);
      const t = .6 * s;
      g.strokeStyle = 'rgba(80,68,36,.34)'; g.lineWidth = 1.2;
      for (let x = 0; x < w; x += t) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += t) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let x = 1.2 * s; x < w; x += 2.4 * s) for (let y = 1.2 * s; y < h; y += 2.4 * s) { g.shadowColor = '#fff6b8'; g.shadowBlur = 20; g.fillStyle = '#fffbdc'; g.fillRect(x - .6 * s, y - .3 * s, 1.2 * s, .6 * s); g.shadowBlur = 0; }
    } else if (r.style === 'white') {
      // Потолок повёрнут: строки холста идут с юга на север.
      const cx = (r.round.x - r.x0) * s, cy = (r.z1 - r.round.z) * s, a = r.round.a * s;
      g.fillStyle = '#e1e1e4'; g.fillRect(0, 0, w, h);
      const rim = g.createRadialGradient(cx, cy, a * .55, cx, cy, a);
      rim.addColorStop(0, 'rgba(90,92,100,0)'); rim.addColorStop(1, 'rgba(90,92,100,.28)'); g.fillStyle = rim; g.fillRect(0, 0, w, h);
      // Тёмный ореол над колонной, как в мягко освещённой галерее.
      const ao = g.createRadialGradient(cx, cy, 0, cx, cy, 2.6 * s);
      ao.addColorStop(0, 'rgba(50,52,60,.5)'); ao.addColorStop(.35, 'rgba(50,52,60,.18)'); ao.addColorStop(1, 'rgba(50,52,60,0)'); g.fillStyle = ao; g.fillRect(0, 0, w, h);
      glowArcs(g, r, cx, cy, s, 1);
    } else if (r.style === 'flat') {
      g.fillStyle = '#a59d88'; g.fillRect(0, 0, w, h);
      const l = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * .6);
      l.addColorStop(0, 'rgba(255,240,200,.6)'); l.addColorStop(1, 'rgba(40,30,16,.34)'); g.fillStyle = l; g.fillRect(0, 0, w, h);
    } else if (r.style === 'bedroom') {
      g.fillStyle = '#17182a'; g.fillRect(0, 0, w, h);
      const u = rng(3); g.fillStyle = '#b6ffcf';
      for (let i = 0; i < 36; i++) g.fillRect(u() * w, u() * h, 2, 2);
    } else if (r.style === 'outdoor') {
      g.fillStyle = '#060a1a'; g.fillRect(0, 0, w, h);
      const u = rng(9); g.fillStyle = '#c7cff0';
      for (let i = 0; i < 260; i++) g.fillRect(u() * w, u() * h, 1.5, 1.5);
    } else {
      g.fillStyle = '#050608'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#16181f'; for (let z = 1.5 * s; z < h; z += 3 * s) g.fillRect(0, z, w, 2);
    }
    return c;
  }

  // --- сборка комнат по требованию ---------------------------------------------------------------

  const paintStore = {};
  const hooks = {};

  function thing(room, o) {
    o.room = room;
    room.things.push(o);
    (o.mesh ? [o.mesh] : []).forEach(m => m.traverse(q => { if (q.isMesh) q.userData.thing = o; }));
    if (o.mesh) room.pick.things.push(o.mesh);
    return o;
  }
  // Невидимая зона нажатия: мелким предметам нужна цель больше их самих.
  function hit(room, w, h, d, x, y, z) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({ visible: false }));
    m.position.set(x, y, z); room.group.add(m);
    return m;
  }

  function workMesh(w, room) {
    const g = new T.Group(), { wid, hgt } = w, st = room.style;
    if (st !== 'night') {
      const f = st === 'white' ? .04 : .018, col = st === 'back' ? '#3a3424' : '#0d0e11';
      const box = new T.Mesh(new T.BoxGeometry(wid + f * 2, hgt + f * 2, .05), flat(col)); box.position.z = .025; g.add(box);
    }
    if (w.img) {
      // Работа участника выставки: картинка из R2. На телефоне берём превью, оно в разы легче.
      const t = w.tex = new T.Texture();
      t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.minFilter = T.LinearMipmapLinearFilter;
      const im = new Image();
      im.crossOrigin = 'anonymous'; im.decoding = 'async';
      im.onload = () => { if (w.tex !== t) return; t.image = im; t.needsUpdate = true; };
      im.src = LOW ? w.thumb : w.img;
    } else {
      Art.make(w);
      w.tex = tex(w.canvas, { aniso: 8, release: !w.anim });
    }
    const pic = new T.Mesh(new T.PlaneGeometry(wid, hgt), new T.MeshBasicMaterial({ map: w.tex }));
    pic.position.z = .056; pic.userData.work = w; g.add(pic);
    const wall = w.wall;
    wall.place(g);
    g.position.copy(wall.at(w.u, w.v, w.depth || 0));
    if (st === 'back') g.rotateZ((rng(w.key.length * 97 + w.u * 13)() - .5) * .05);
    wall.group.add(g);
    room.pick.art.push(pic);
    if (w.anim) room.animated.push(w);
    w.spot = wall.at(w.u, 0, Math.max(1.9, Math.min(3.2, w.wid * .95)));
    w.spot.x = clamp(w.spot.x, room.x0 + .5, room.x1 - .5); w.spot.z = clamp(w.spot.z, room.z0 + .5, room.z1 - .5);
    w.look = wall.at(w.u, w.v, w.depth || 0);
    if (w.depth) return;

    const lc = cv(320, 180), x = lc.getContext('2d'), dark = /night|scifi|neon/.test(st);
    x.fillStyle = dark ? '#14161c' : '#f6f4ee'; x.fillRect(0, 0, 320, 180);
    x.fillStyle = dark ? '#e8e6df' : '#1b1a17'; x.font = `600 24px ${SANS}`;
    let y = 42, line = '';
    for (const word of w.t.split(' ')) { if (x.measureText(line + word).width > 280) { x.fillText(line, 20, y); y += 30; line = ''; } line += word + ' '; }
    x.fillText(line, 20, y);
    x.font = `400 18px ${MONO}`; x.fillStyle = dark ? '#9093a1' : '#6a675f';
    x.fillText(w.a + (w.y ? ', ' + w.y : ''), 20, 156);
    const lb = new T.Mesh(new T.PlaneGeometry(.3, .17), basic(lc, { release: true }));
    // На узкой грани или рядом с дверью этикетка идёт под работу, иначе она повисает в воздухе.
    const side = w.u + w.wid / 2 + .34, tight = side + .17 > wall.L || wall.doors.some(d => side + .17 > d.u - d.p.w / 2 && side - .17 < d.u + d.p.w / 2);
    wall.place(lb); lb.position.copy(tight ? wall.at(w.u, w.v - w.hgt / 2 - .15, .012) : wall.at(side, Math.min(w.v, 1.4) - .22, .012));
    wall.group.add(lb);
  }

  // Потолок с вырезом под зенитный фонарь. UV совпадают с обычной плоскостью.
  function ceilingGeo(r, L, D, cx, cz) {
    if (!r.light) return new T.PlaneGeometry(L, D);
    const q = r.light, s = new T.Shape(), hole = new T.Path();
    s.moveTo(-L / 2, -D / 2); s.lineTo(L / 2, -D / 2); s.lineTo(L / 2, D / 2); s.lineTo(-L / 2, D / 2); s.closePath();
    hole.moveTo(q.x0 - cx, q.z0 - cz); hole.lineTo(q.x0 - cx, q.z1 - cz); hole.lineTo(q.x1 - cx, q.z1 - cz); hole.lineTo(q.x1 - cx, q.z0 - cz); hole.closePath();
    s.holes.push(hole);
    const g = new T.ShapeGeometry(s, 1), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / L + .5, p.getY(i) / D + .5);
    return g;
  }

  function* buildRoom(r) {
    r.state = 'building';
    r.group = new T.Group(); r.group.visible = false;
    r.mats = []; r.things = []; r.animated = []; r.pick = { art: [], walls: [], floors: [], things: [] };
    const W = r.walls = makeWalls(r);
    const hang = Art.HANG[r.id] || [];
    hang.forEach((w, i) => {
      const [key, u0, mw, mh, depth, v0] = LAYOUT[r.id][i], wall = W[key];
      const fit = Math.min(mw / w.ar, mh);
      w.hgt = fit; w.wid = fit * w.ar; w.wall = wall; w.u = /^[PR]/.test(key) ? wall.L * u0 : u0; w.depth = depth || 0;
      w.v = v0 ? v0 : depth ? r.niche.v + r.niche.h / 2 : r.id === 'a' ? 2.45 : r.id === 'b' ? 1.45 : r.id === 'f' ? 1.56 : r.id === 'w' ? 1.62 : Math.max(1.95, w.hgt / 2 + .42);
      wall.items.push(w);
    });
    if (r.id === 'c') for (const w of hang) if (!w.avg) { Art.make(w); w.canvas.width = 0; yield; }
    for (const wall of Object.values(W)) {
      wall.group = new T.Group(); r.group.add(wall.group);
      const mat = basic(bakeWall(wall), { aniso: 6, release: true });
      r.mats.push(mat);
      const geo = wall.geometry(), m = new T.Mesh(geo, mat);
      wall.place(m); m.userData.wall = wall; wall.group.add(m); wall.mesh = m;
      const pw = Math.round(wall.L / CELL), ph = Math.round(wall.h / CELL);
      wall.paint = paintStore[wall.id] || (paintStore[wall.id] = cv(pw, ph));
      wall.pg = wall.paint.getContext('2d', { willReadFrequently: true });
      wall.ptex = tex(wall.paint, { nearest: true });
      const pm = new T.Mesh(geo, new T.MeshBasicMaterial({ map: wall.ptex, transparent: true, depthWrite: false }));
      // Слой рисунка включается только при первом штрихе: пустые слои не тратят отрисовку.
      wall.place(pm, .006); pm.renderOrder = 2; pm.visible = !!paintStore[wall.id + ':used']; wall.group.add(pm); wall.pm = pm;
      wall.touch = () => { pm.visible = true; paintStore[wall.id + ':used'] = true; wall.ptex.needsUpdate = true; };
      r.pick.walls.push(m);
      yield;
    }
    for (const w of hang) { workMesh(w, r); yield; }

    const L = r.x1 - r.x0, D = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const floor = new T.Mesh(new T.PlaneGeometry(L, D), FloorMat(tex(bakeFloor(r), { aniso: LOW ? 2 : 8, release: true }), LOW ? 0 : r.refl));
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); floor.userData.floor = r;
    r.group.add(floor); r.floor = floor; r.pick.floors.push(floor);
    const ceil = new T.Mesh(ceilingGeo(r, L, D, cx, cz), basic(bakeCeiling(r), { release: true }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, r.h, cz); r.group.add(ceil); r.mats.push(ceil.material);
    if (r.parts.length) {
      const side = r.style === 'white' ? basic(textPanel(32, 256, (g, w, h) => { g.fillStyle = '#e4e4e7'; g.fillRect(0, 0, w, h); g.fillStyle = '#3c3d42'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); g.fillRect(0, 0, w, 2); }))
        : flat({ atrium: '#a89b88', back: '#a08b47', night: '#0c0d12', scifi: '#3b3c42', render: '#c9ccd2' }[r.style] || '#333');
      for (const q of r.parts) for (const s of [-1, 1]) {
        const ph = q.h || r.h, end = new T.Mesh(new T.PlaneGeometry(.32, ph), side);
        if (q.ax === 'x') { end.position.set(q.x + s * q.l / 2, ph / 2, q.z); end.rotation.y = s * Math.PI / 2; }
        else { end.position.set(q.x, ph / 2, q.z + s * q.l / 2); if (s < 0) end.rotation.y = Math.PI; }
        r.group.add(end);
      }
    }
    yield;
    const props = PROPS[r.id] || Halls2.props[r.id];
    props && props(r);
    stampRoom(r);
    scene.add(r.group);
    r.state = 'ready';
    r.group.visible = shown(r);
    hooks.loaded && hooks.loaded(r);
  }

  function freeRoom(r) {
    hooks.freed && hooks.freed(r);
    scene.remove(r.group);
    r.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      for (const m of [].concat(o.material || [])) { if (m.map) m.map.dispose(); if (m.uniforms && m.uniforms.tBase) m.uniforms.tBase.value.dispose(); m.dispose(); }
    });
    for (const w of Art.HANG[r.id] || []) { if (w.canvas) w.canvas.width = 0; w.canvas = null; w.tex = null; }
    for (const wall of Object.values(r.walls)) wall.items.length = 0;
    r.state = null; r.group = null;
  }

  const queue = [];
  let lastD = {};
  function want(r) { if (!r.state && !queue.some(q => q.r === r)) queue.push({ r, it: buildRoom(r) }); }
  function pump(ms) {
    const end = performance.now() + ms;
    while (queue.length && performance.now() < end) { if (queue[0].it.next().done) queue.shift(); }
  }
  function dist(a) {
    const d = { [a.id]: 0 }, list = [a];
    // Сквозь закрытый зал путь не идёт: залы за ним не считаются соседями.
    while (list.length) { const q = list.shift(); if (q.closed && q !== a) continue; for (const l of q.links) if (d[l.to] == null) { d[l.to] = d[q.id] + 1; list.push(R[l.to]); } }
    return d;
  }
  // Дверь между залом посетителя и соседним залом. Зал за закрытой дверью не рисуется,
  // а строится, только когда посетитель подошёл к двери или нажал на неё (door.warm).
  let lastRoom = null;
  const via = r => { const l = lastRoom && lastRoom.links.find(q => q.to === r.id); return l && l.p.door; };
  function shown(r) { const d = lastD[r.id], dr = via(r); return d === 0 || d === 1 && !(dr && dr.open < .01); }
  function focus(room) {
    lastRoom = room;
    const d = lastD = dist(room);
    for (const r of ROOMS) {
      const dr = d[r.id] === 1 ? via(r) : null, keep = d[r.id] === 0 || d[r.id] === 1 && (!dr || dr.warm || dr.open >= .01);
      if (keep && !r.closed) want(r);
      // На телефоне зал за закрытой дверью выгружается сразу: в памяти остаются зал посетителя и тот, куда он идёт.
      // Из лабиринта в другие залы пути нет: всё, до чего не дойти, выгружается.
      if (r.state === 'ready' && ((d[r.id] == null ? 9 : d[r.id]) >= 3 || LOW && r.v2 && !keep)) freeRoom(r);
      if (r.group) r.group.visible = shown(r);
    }
  }

  // --- дверные проёмы ----------------------------------------------------------------------------

  const gates = {};
  function buildPasses() {
    PASS.forEach(p => {
      if (p.v2) return Halls2.pass(p);
      const len = p.s1 - p.s0, mid = (p.s0 + p.s1) / 2;
      const j = flat(p.jamb || (p.jag ? '#9f8a45' : '#2d2b24'), { side: T.DoubleSide });
      const place = (m, along, across, y) => { if (p.axis === 'x') m.position.set(along, y, across); else m.position.set(across, y, along); scene.add(m); };
      for (const s of [-1, 1]) {
        const m = new T.Mesh(new T.PlaneGeometry(len, p.h), j);
        if (p.axis === 'z') m.rotation.y = Math.PI / 2;
        place(m, mid, p.c + s * p.w / 2, p.h / 2);
      }
      const top = new T.Mesh(new T.PlaneGeometry(p.axis === 'x' ? len : p.w, p.axis === 'x' ? p.w : len), flat(p.cap || '#3c382a', { side: T.DoubleSide }));
      top.rotation.x = Math.PI / 2; place(top, mid, p.c, p.h);
      const fl = new T.Mesh(new T.PlaneGeometry(p.axis === 'x' ? len : p.w, p.axis === 'x' ? p.w : len), flat(p.sole || '#1a1712'));
      fl.rotation.x = -Math.PI / 2; place(fl, mid, p.c, .001); fl.userData.pass = p;
      p.floor = fl;
    });
    const p = PASS.find(q => q.gate);
    if (!p) return;
    const c = cv(220, 420), g = c.getContext('2d');
    g.fillStyle = '#cfc6ae'; g.fillRect(0, 0, 220, 420);
    g.strokeStyle = '#a79c81'; g.lineWidth = 4; g.strokeRect(26, 26, 168, 150); g.strokeRect(26, 200, 168, 192);
    g.fillStyle = '#d9332b'; g.fillRect(50, 62, 120, 76);
    g.fillStyle = '#fff'; g.font = `800 19px ${SANS}`; g.textAlign = 'center'; g.fillText('НЕ ВХОДИТЬ', 110, 96); g.font = `400 13px ${SANS}`; g.fillText('идёт катка', 110, 120);
    g.fillStyle = '#7d6a3a'; g.fillRect(186, 208, 16, 8);
    const leaf = new T.Mesh(new T.PlaneGeometry(p.w, p.h), new T.MeshBasicMaterial({ map: tex(c), side: T.DoubleSide }));
    leaf.position.set(p.w / 2, p.h / 2, 0);
    const pivot = new T.Group(); pivot.position.set(p.c - p.w / 2, 0, p.s1 - .02); pivot.add(leaf); scene.add(pivot);
    gates.son = { p, pivot, leaf, open: 0, want: 0 };
  }

  // Админ закрыл зал: проходы в него заперты, в каждом проёме табличка с обеих сторон.
  // Сам зал не грузится, поэтому за табличкой ничего не рисуется и память не тратится.
  function closeHall(r, note) {
    r.closed = true;
    const c = cv(512, 640), g = c.getContext('2d');
    g.fillStyle = '#0b0c0d'; g.fillRect(0, 0, 512, 640);
    g.fillStyle = 'rgba(240,242,244,.16)'; g.font = `400 22px ${MONO}`; g.textAlign = 'center';
    for (let y = 40; y < 640; y += 64) for (let x = 32; x < 512; x += 64) g.fillText('+', x, y);
    g.fillStyle = '#2f3236'; g.fillRect(56, 196, 400, 248);
    g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 2; g.strokeRect(56, 196, 400, 248);
    g.fillStyle = '#47c55e'; g.font = `500 26px ${MONO}`; g.fillText('ЗАКРЫТО', 256, 252);
    g.fillStyle = '#f0f2f4'; g.font = `700 ${r.name.length > 12 ? 30 : 38}px ${MONO}`; g.fillText(r.name, 256, 318);
    g.fillStyle = 'rgba(240,242,244,.64)'; g.font = `400 22px ${MONO}`;
    const words = String(note || 'Скоро откроем').split(' '), lines = [''];
    for (const w of words) { const t = (lines[lines.length - 1] + ' ' + w).trim(); if (g.measureText(t).width > 340 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = t; }
    lines.slice(0, 3).forEach((l, i) => g.fillText(l, 256, 372 + i * 30));
    const mat = new T.MeshBasicMaterial({ map: tex(c) });
    for (const p of PASS) {
      if (p.a !== r.id && p.b !== r.id) continue;
      p.closed = p.locked = true;
      // Табличка стоит в проёме со стороны открытого зала, лицом к нему.
      const out = p.a === r.id ? 1 : -1, at = out > 0 ? p.s1 - .03 : p.s0 + .03;
      const m = new T.Mesh(new T.PlaneGeometry(p.w, p.h), mat);
      if (p.axis === 'x') { m.position.set(at, p.h / 2, p.c); m.rotation.y = out > 0 ? Math.PI / 2 : -Math.PI / 2; } else { m.position.set(p.c, p.h / 2, at); m.rotation.y = out > 0 ? 0 : Math.PI; }
      scene.add(m);
    }
    if (r.state === 'ready') freeRoom(r);
  }

  // --- предметы по комнатам ----------------------------------------------------------------------

  function textPanel(w, h, draw) { const c = cv(w, h); draw(c.getContext('2d'), w, h); return c; }

  // Танцор в Галерее мемов. Видео в mp4 без прозрачности: сверху кадр, снизу его маска, шейдер склеивает их.
  // Видео грузится вместе с залом и идёт, только пока посетитель рядом. Музыку и громкость ведёт app.js.
  const DANCER = { x: 22, z: -23, w: 1.29, h: 2.03, y: .343, src: 'dancer.mp4' };
  function memeDancer(r) {
    const D = DANCER, v = document.createElement('video');
    v.src = Media.url(D.src); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    const vt = new T.VideoTexture(v); vt.minFilter = vt.magFilter = T.LinearFilter; vt.generateMipmaps = false;
    const mat = new T.ShaderMaterial({
      uniforms: { tVid: { value: vt } }, transparent: true, depthWrite: false, side: T.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `uniform sampler2D tVid; varying vec2 vUv;
        void main(){
          vec4 c = texture2D(tVid, vec2(vUv.x, .5 + vUv.y * .5));
          float a = texture2D(tVid, vec2(vUv.x, vUv.y * .5)).g;
          if (a < .04) discard;
          gl_FragColor = vec4(c.rgb, a); // кадр уже в sRGB, выводим как есть
        }`
    });
    mat.map = vt; // freeRoom освобождает map у материала
    const body = new T.Mesh(new T.PlaneGeometry(D.w, D.h), mat);
    body.position.set(D.x, D.y + D.h / 2, D.z); body.renderOrder = 2; r.group.add(body);
    // Подиум как на концепте: светлый цилиндр с тёплой светящейся кромкой.
    const base = new T.Mesh(new T.CylinderGeometry(1.25, 1.3, .42, 48), lam('#c9ccd3')); base.position.set(D.x, .21, D.z); r.group.add(base);
    const rim = new T.Mesh(new T.TorusGeometry(1.22, .028, 6, 72), flat('#fff1d6')); rim.rotation.x = Math.PI / 2; rim.position.set(D.x, .425, D.z); r.group.add(rim);
    const shadow = new T.Mesh(new T.CircleGeometry(.5, 24), new T.MeshBasicMaterial({ map: World.glowTex, color: '#000', transparent: true, opacity: .5, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(D.x, .424, D.z); r.group.add(shadow);
    return { video: v, body, D };
  }
  // Инсталляция «Are you winning, son?»: дверь в северной стене, отец, сын на матрасе. Ход сцены ведёт app.js.
  // Отец и сын нарисованы в Higgsfield (meme-art.js), дверь и пузырь рисуются здесь.
  function picture(src) {
    const im = new Image(), t = new T.Texture(im);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    im.crossOrigin = 'anonymous';
    im.onload = () => { t.needsUpdate = true; }; im.src = Media.url(src);
    return t;
  }

  // --- Рендер: предметы сцены ---------------------------------------------------------------------
  // Всё по концепту: постаменты (x, z, размер), скамейки (x, z, ширина, глубина), пилястры в тестовую клетку,
  // неоновые трубки в дальнем углу (x, z, длина, цвет) и место маскота: он висит над проходом между входом и танцором. Пол и потолок берут отсюда отсветы.
  const RENDER = {
    plinths: [[18.5, -12.5, 1.1], [19.4, -20.2, .8], [18.3, -31, .6], [25.2, -24.6, .8]],
    benches: [[18.4, -9.4, 1.5, 1], [25.9, -9.35, 1, 1]],
    piers: [[17.2, -9], [17.2, -17.4], [17.2, -24.3], [17.2, -31.65], [26.8, -9], [26.8, -22.6], [26.8, -29.6]],
    mascot: { x: 22, z: -15.4, y: 2.1 },
    tubes: [[17.7, -35.3, 1.2, '255,79,216'], [18.25, -35.55, 1.7, '53,224,255'], [18.8, -35.3, 1, '255,210,63']]
  };
  // Несколько простых фигур в один меш с цветом в вершинах: одна отрисовка на всю группу.
  function colored(parts) {
    const pos = [], col = [], c = new T.Color();
    for (const [geo, color, m] of parts) {
      const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m), p = g.attributes.position;
      c.set(color);
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); col.push(c.r, c.g, c.b); }
      g.dispose(); geo.dispose();
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); out.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    return out;
  }
  const at = (x, y, z, rx = 0, ry = 0, rz = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(1, 1, 1));
  // Стрелки перемещения выделенного объекта: X красная, Y синяя вверх, Z зелёная к зрителю, как на концепте.
  function gizmo(x, y, z, k = 1) {
    const L = .42 * k, out = [];
    for (const [c, rx, rz, dx, dy, dz] of [['#e83a46', 0, -Math.PI / 2, 1, 0, 0], ['#2f6bff', 0, 0, 0, 1, 0], ['#3fc24a', Math.PI / 2, 0, 0, 0, 1]]) {
      out.push([new T.CylinderGeometry(.012 * k, .012 * k, L, 6), c, at(x + dx * L / 2, y + dy * L / 2, z + dz * L / 2, rx, 0, rz)]);
      out.push([new T.ConeGeometry(.04 * k, .11 * k, 10), c, at(x + dx * (L + .05 * k), y + dy * (L + .05 * k), z + dz * (L + .05 * k), rx, 0, rz)]);
    }
    out.push([new T.SphereGeometry(.03 * k, 8, 6), '#f2f2f2', at(x, y, z)]);
    return out;
  }
  // Рамки выделения: рёбра коробок одной линией.
  function boxLines(boxes, color, opacity = .75) {
    const pos = [];
    for (const [x0, y0, z0, x1, y1, z1] of boxes) {
      const v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) pos.push(...v[a], ...v[b]);
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    return new T.LineSegments(geo, new T.LineBasicMaterial({ color, transparent: true, opacity }));
  }
  // Тестовая клетка для пилястр, скамеек и светового колодца: одна маленькая текстура с повтором.
  function checkerMat(rx, ry) {
    const c = textPanel(64, 64, g => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = (i + j) % 2 ? '#9fa3ab' : '#d9dbe0'; g.fillRect(i * 16, j * 16, 16, 16); } });
    const t = tex(c, { nearest: true }); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
    return new T.MeshBasicMaterial({ map: t });
  }

  // Маскот NETIZEN из пикселей: голова из ролика маскота, разложенная на сетку 40 × 40.
  // Каждый пиксель стал столбиком, к середине головы столбики толще, так плоский рисунок получает объём.
  // Все столбики в одном InstancedMesh, перелив и вспышки пикселей считает шейдер.
  const HEAD = [
    '.............kkkkkkkkkkkkk..............',
    '..........kkkkkkkkgggkkkkkkkk...........',
    '........kkkkkgggggggggggggkkkkk.........',
    '.......kkkgggggggggggggggggggkkk........',
    '......kkkgggggggggggggggggggggkkk.......',
    '.....kkggggggggggggggggggggggggkkk......',
    '....kkggggggggggggggggggggggggggkkk.....',
    '...kkggggggggggggggggggggggggggggkk.....',
    '..kkkggggggggggggkkkkkkkkkkkkgggggkk....',
    '..kkggggggggggggggkwwwwwwwkkkkkkkgkk....',
    '..kkggggggggggggggkwwwwwwwwwwwwkkkkk....',
    '.kkgggggggggggggggkkwwwwwwwwwwwwwwkk....',
    '.kkgggggggggggggkkkkwwwwwwwwwwwwwwwkk...',
    '.kkgggggggggggkkkwwwwwwwwwwwwwwwwwwkk...',
    '.kkgggggggggggkkwwwwwwkkkwwwwwwwwwwwk...',
    '.kkgggggggggggkkwwwwkkkkkkkkkwwwwwwwkk..',
    '.kkgkkkkkkggggkkwwwwwwwkkkkkkkwwwwwwkk..',
    '..kkkkwwkkkgggkkwwwwwwwwwwwkkkwwwwwwkk..',
    '.kkkwwwwwwkkkgkkwwwkkkkwwwwwkkwwkkwwkk..',
    '.kkwwwwwwwwkkkkkwwwkkwkkkkkwwwwwwwwwkk..',
    'kkwwkkkwwwwwkkkkwwwkkwkkkkkkkwwwwwwwkk..',
    'kkwwkkkkwwwwwkkwwwwwkkkkkkwwwwwwwkkwk...',
    'kkwwwkkkwwwwwwwwwwwwkkkkkwwwwwwwwkwkk...',
    '.kwwwwkkkwwwwwwwwwwwwwkkwwwwwwwwwkwkkk..',
    '.kkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk..',
    '.kkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwkkk.',
    '..kkwwwwwkwwwwwwwwwwwwwwwwwwwwwwwwkkkk..',
    '...kkkkkkkkwwwwwwwwwwwwwwwwwwwwwwwwkk...',
    '....kkkkkkkwwwwwwwwwwwwwwwwwwwwwkwwwkk..',
    '..........kkwwwwwwwwwwwwwwwkkkkkkwwwkk..',
    '..........kkwwwwwwwwwwwwwwwwwwwwwwwwwk..',
    '...........kkwwwwwwwwwwwwwwwwwwwwwwwwkk.',
    '...........kkwwwwwwwwwwwwwwwwwwwwwwwwkk.',
    '............kkwwwwwwwwwwwwwwwwwwwwwwwkk.',
    '.............kkwwwwwwwwwwwwwwwwwwwwwwkk.',
    '..............kkkkwwwwwwwwwwwwwwwwwkkk..',
    '................kkkkkkwwwwwwwwwkkkkkk...',
    '...................kkkkkkkkkkkkkkkk.....',
    '.........................kk.............'
  ];
  function pixelMascot(r) {
    const V = .034, rows = HEAD.length, cols = HEAD[0].length, PAL = { k: '#141418', w: '#f4f4f0', g: '#84bd2c' };
    const on = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && HEAD[y][x] !== '.';
    // Расстояние до края силуэта: по нему считается толщина столбика.
    const dist = HEAD.map(row => [...row].map(ch => (ch === '.' ? 0 : 99)));
    for (let it = 0; it < rows + cols; it++) {
      let changed = false;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (on(x, y)) {
        const n = Math.min(on(x - 1, y) ? dist[y][x - 1] : 0, on(x + 1, y) ? dist[y][x + 1] : 0, on(x, y - 1) ? dist[y - 1][x] : 0, on(x, y + 1) ? dist[y + 1][x] : 0) + 1;
        if (n < dist[y][x]) { dist[y][x] = n; changed = true; }
      }
      if (!changed) break;
    }
    const cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (on(x, y)) cells.push([x, y, HEAD[y][x], dist[y][x]]);
    const loose = 40, n = cells.length + loose, u = rng(5);
    const mat = new T.ShaderMaterial({
      uniforms: { uT: { value: 0 } },
      vertexShader: `uniform float uT; attribute float aLoose; varying vec3 vCol, vBox; varying float vShade;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        void main() {
          vec3 c = instanceMatrix[3].xyz, o = c; float h = hash(c);
          vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          // Пиксель иногда выскакивает вперёд и возвращается.
          float pop = smoothstep(.965, 1., sin(uT * 1.1 + h * 50.));
          o.z += pop * .12;
          if (aLoose > .5) { float a = uT * (.3 + h * .45) + h * 6.2832, rad = .78 + h * .3; o = vec3(cos(a) * rad, c.y + sin(uT * .8 + h * 9.) * .1, sin(a) * rad * .55); }
          vBox = position * 2.;
          vec4 wp = modelMatrix * vec4(o + position * sc, 1.);
          vec3 n = normalize(mat3(modelMatrix) * normal);
          vShade = .74 + .26 * max(dot(n, normalize(vec3(.3, .8, .55))), 0.);
          float k = c.y * 1.6 + c.x * .9 - uT * .45;
          vec3 iri = .5 + .5 * cos(6.2832 * (vec3(0., .33, .67) + k));
          float band = smoothstep(.6, 1., sin(c.y * 6. + c.x * 3. - uT * 2.2));
          vCol = mix(instanceColor, iri * iri, .07) + iri * band * .3 + step(.99, fract(h * 31. + uT * .3)) * .5;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `varying vec3 vCol, vBox; varying float vShade;
        void main() {
          // Тёмный шов по краю лицевой грани каждого пикселя.
          vec2 f = abs(vBox.xy); float e = max(f.x, f.y);
          float seam = abs(vBox.z) > .99 ? smoothstep(.86, .97, e) : 0.;
          gl_FragColor = vec4(vCol * vShade * (1. - seam * .45), 1.);
          #include <colorspace_fragment>
        }`
    });
    const geo = new T.BoxGeometry(1, 1, 1), flag = new Float32Array(n);
    const mesh = new T.InstancedMesh(geo, mat, n), m = new T.Matrix4(), col = new T.Color(), q = new T.Quaternion();
    cells.forEach(([x, y, ch, d], i) => {
      const depth = V * (1.4 + Math.sqrt(d) * 2.1);
      m.compose(new T.Vector3((x - cols / 2) * V, (rows - y) * V, 0), q, new T.Vector3(V, V, depth));
      mesh.setMatrixAt(i, m); mesh.setColorAt(i, col.set(PAL[ch]));
    });
    for (let i = 0; i < loose; i++) {
      const j = cells.length + i; flag[j] = 1;
      m.compose(new T.Vector3(0, (2 + u() * (rows - 4)) * V, 0), q, new T.Vector3(V, V, V)); mesh.setMatrixAt(j, m);
      mesh.setColorAt(j, col.set(['#84bd2c', '#f4f4f0', '#ff4fd8', '#35e0ff'][i % 4]));
    }
    geo.setAttribute('aLoose', new T.InstancedBufferAttribute(flag, 1));
    mesh.frustumCulled = false;
    const g = new T.Group(), M = RENDER.mascot; g.position.set(M.x, M.y, M.z); g.add(mesh);
    const hw = cols / 2 * V, top = rows * V;
    g.add(boxLines([[-hw - .05, -.05, -.3, hw + .05, top + .08, .3]], '#8ff08f', .6));
    r.group.add(g);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: World.glowTex, color: '#7dff6a', transparent: true, opacity: .3, depthWrite: false, blending: T.AdditiveBlending }));
    glow.scale.set(2.2, 2.2, 1); glow.position.set(M.x, M.y + top / 2, M.z - .5); r.group.add(glow);
    return { g, mat, y0: M.y };
  }

  // Световой колодец в потолке: стенки и дно в тестовую клетку, вокруг зелёная рамка и стрелки.
  function renderWell(r) {
    const q = r.light, W = q.x1 - q.x0, Dp = q.z1 - q.z0, cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, top = r.h + q.d;
    const lid = new T.Mesh(new T.PlaneGeometry(W, Dp), checkerMat(W / .9, Dp / .9)); lid.rotation.x = Math.PI / 2; lid.position.set(cx, top, cz); r.group.add(lid);
    for (const [w, x, z, ry] of [[W, cx, q.z0, 0], [W, cx, q.z1, Math.PI], [Dp, q.x0, cz, Math.PI / 2], [Dp, q.x1, cz, -Math.PI / 2]]) {
      const side = new T.Mesh(new T.PlaneGeometry(w, q.d), checkerMat(w / .9, q.d / .45)); side.position.set(x, r.h + q.d / 2, z); side.rotation.y = ry; r.group.add(side);
    }
    r.group.add(boxLines([[q.x0 - .35, r.h - .45, q.z0 - .35, q.x1 + .35, r.h - .02, q.z1 + .35]], '#8ff08f', .7));
    return gizmo(cx, r.h - .25, cz, 1.3);
  }

  function renderProps(r) {
    const white = lam('#e8eaee'), grey = lam('#9a9ea6'), F = RENDER, D = DANCER;
    // Пилястры в тестовую клетку вдоль длинных стен.
    const pier = checkerMat(4, 26);
    for (const [x, z] of F.piers) { const p = new T.Mesh(new T.BoxGeometry(.42, r.h, .7), pier); p.position.set(x, r.h / 2, z); r.group.add(p); }
    for (const [x, z, sz] of F.plinths) { const b = new T.Mesh(new T.BoxGeometry(sz, sz * .82, sz), white); b.position.set(x, sz * .41, z); r.group.add(b); }
    const [pa, pb, pc, pd] = F.plinths;
    // Скульптуры: серый узел в сетке полигонов, гранёный кристалл, неоновый узел, проволочная сфера в стеклянном кубе.
    const knotG = new T.TorusKnotGeometry(.32, .11, 96, 12, 2, 3);
    const knot = new T.Mesh(knotG, grey); knot.position.set(pa[0], pa[2] * .82 + .48, pa[1]); r.group.add(knot);
    const wire = new T.Mesh(knotG, new T.MeshBasicMaterial({ color: '#5d616b', wireframe: true, transparent: true, opacity: .45 })); wire.position.copy(knot.position); wire.scale.setScalar(1.004); r.group.add(wire);
    const crystal = new T.Mesh(new T.OctahedronGeometry(.32, 0), new T.MeshLambertMaterial({ color: '#b9bcc4', flatShading: true })); crystal.scale.y = 1.35; crystal.position.set(pb[0], pb[2] * .82 + .45, pb[1]); r.group.add(crystal);
    const neonKnot = new T.Mesh(new T.TorusKnotGeometry(.16, .025, 80, 8), flat('#ff4fd8')); neonKnot.position.set(pc[0], pc[2] * .82 + .32, pc[1]); r.group.add(neonKnot);
    const sphere = new T.Mesh(new T.SphereGeometry(.38, 16, 12), new T.MeshBasicMaterial({ color: '#e4e6ea', wireframe: true })); sphere.position.set(pd[0], pd[2] * .82 + .42, pd[1]); r.group.add(sphere);
    // Скамейки в тестовую клетку у входа.
    for (const [x, z, bw, bd] of F.benches) { const b = new T.Mesh(new T.BoxGeometry(bw, .55, bd), checkerMat(bw / .3, 2)); b.position.set(x, .275, z); r.group.add(b); }
    // Трековые светильники: две линии вдоль зала и поперечная в конце, на каждой споты с тёплым светом.
    const parts = [];
    for (const x of [19.2, 24.8]) {
      const k = x < 22 ? -.35 : .35;
      parts.push([new T.BoxGeometry(.05, .05, 25.4), '#1b1c20', at(x, r.h - .32, -21.9)]);
      for (const z of [-10, -34]) parts.push([new T.CylinderGeometry(.006, .006, .3, 4), '#1b1c20', at(x, r.h - .16, z)]);
      for (let z = -10.4; z > -34; z -= 1.6) {
        parts.push([new T.CylinderGeometry(.045, .055, .16, 10), '#202126', at(x, r.h - .42, z, 0, 0, k)]);
        parts.push([new T.CircleGeometry(.04, 10), '#fff6dc', at(x - Math.sin(k) * .08, r.h - .5, z, Math.PI / 2, 0, k)]);
      }
    }
    parts.push([new T.BoxGeometry(5.6, .05, .05), '#1b1c20', at(22, r.h - .32, -33.6)]);
    for (let x = 19.8; x < 24.6; x += 1.2) parts.push([new T.CylinderGeometry(.045, .055, .16, 10), '#202126', at(x, r.h - .42, -33.6, .35, 0, 0)], [new T.CircleGeometry(.04, 10), '#fff6dc', at(x, r.h - .5, -33.57, Math.PI / 2 + .35, 0, 0)]);
    // Неон: двойное кольцо над танцором и трубки в дальнем левом углу.
    parts.push([new T.TorusGeometry(1.15, .022, 6, 72), '#ff4fd8', at(D.x, 3.55, D.z, Math.PI / 2 + .3, 0, .12)]);
    parts.push([new T.TorusGeometry(1.15, .022, 6, 72), '#35e0ff', at(D.x, 3.55, D.z, Math.PI / 2 - .3, 0, -.12)]);
    for (const [x, z, len, c] of F.tubes) {
      const hex = '#' + c.split(',').map(v => (+v).toString(16).padStart(2, '0')).join('');
      parts.push([new T.CylinderGeometry(.024, .024, len, 8), hex, at(x, r.h - len / 2 - .4, z)], [new T.CylinderGeometry(.004, .004, .4, 4), '#555', at(x, r.h - .2, z)]);
    }
    // Стрелки на скульптурах, скамейках и колодце.
    parts.push(...gizmo(pa[0] + .05, pa[2] * .82 + .3, pa[1] + .05, 1.1), ...gizmo(pb[0], pb[2] * .82 + .2, pb[1], .8), ...gizmo(pd[0], pd[2] * .82 + .1, pd[1], .7));
    for (const [x, z] of F.benches) parts.push(...gizmo(x, .56, z, .9));
    parts.push(...renderWell(r));
    r.group.add(new T.Mesh(colored(parts), new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })));
    for (const [x, z, len, c] of F.tubes) glowAt(r, `rgb(${c})`, .45, 1, x, r.h - len / 2 - .4, z);
    glowAt(r, '#ff4fd8', .5, .9, pc[0], pc[2] * .82 + .32, pc[1]);
    glowAt(r, '#ffd9f1', .22, 3.6, D.x, 3.55, D.z);
    // Зелёные рамки выделения, как в редакторе: скульптуры, сфера в «стекле», ряд автоматов.
    r.group.add(boxLines([
      [pa[0] - .55, 0, pa[1] - .55, pa[0] + .55, 1.55, pa[1] + .55],
      [pd[0] - .5, pd[2] * .82, pd[1] - .5, pd[0] + .5, pd[2] * .82 + .95, pd[1] + .5],
      [pd[0] - .45, 0, pd[1] - .45, pd[0] + .45, pd[2] * .82, pd[1] + .45],
      [25.3, 0, -21.1, 27, 2.55, -10.7]
    ], '#8ff08f', .6));
    r.mascot = pixelMascot(r);
  }

  // Сборка готовой сцены со сдвигом: всё, что она добавит в зал, и её точки взгляда переезжают на dx, dz.
  function shifted(r, dx, dz, build) {
    const sub = new T.Group(); sub.position.set(dx, 0, dz); r.group.add(sub);
    const fake = Object.create(r); fake.group = sub; fake.z0 = r.z0 - dz; fake.x0 = r.x0 - dx;
    const n0 = r.things.length, out = build(fake);
    for (const o of r.things.slice(n0)) {
      o.room = r;
      if (o.spot) o.spot = { x: o.spot.x + dx, z: o.spot.z + dz };
      if (o.at) o.at = o.at.clone().add(new T.Vector3(dx, 0, dz));
    }
    if (out && out.sonAt) out.sonAt = { x: out.sonAt.x + dx, z: out.sonAt.z + dz };
    return out;
  }

  function memeScene(r) {
    const X = 16.4, Z = r.z0, W = 1.05, H = 2.08;
    const frame = new T.Mesh(new T.PlaneGeometry(W + .16, H + .08), flat('#e9e6df')); frame.position.set(X, H / 2 + .04, Z + .004); r.group.add(frame);
    const hole = new T.Mesh(new T.PlaneGeometry(W, H), flat('#efeee9')); hole.position.set(X, H / 2, Z + .008); r.group.add(hole);
    const leafC = textPanel(256, 512, (g, w, h) => { g.fillStyle = '#fafafa'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#111'; g.beginPath(); g.arc(46, 270, 13, 0, 7); g.fill(); });
    const leaf = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: tex(leafC), side: T.DoubleSide }));
    leaf.position.set(-W / 2, H / 2, 0); leaf.rotation.y = Math.PI;
    const pivot = new T.Group(); pivot.position.set(X + W / 2, 0, Z + .03); pivot.add(leaf); r.group.add(pivot);
    const faces = { kick: picture(MEME_ART.kick), talk: picture(MEME_ART.talk), quiet: picture(MEME_ART.quiet), sad: picture(MEME_ART.sad) };
    const dad = new T.Mesh(new T.PlaneGeometry(1.4, 1.8), new T.MeshBasicMaterial({ map: faces.kick, transparent: true, alphaTest: .4, side: T.DoubleSide }));
    dad.position.set(X, .9, Z + .55); dad.visible = false; r.group.add(dad);
    const say = textPanel(560, 120, (g, w, h) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 30, 22); g.fill(); g.beginPath(); g.moveTo(90, h - 28); g.lineTo(70, h - 2); g.lineTo(130, h - 28); g.fill(); g.fillStyle = '#111'; g.font = `800 40px ${SANS}`; g.textAlign = 'center'; g.fillText('ARE YA WINNING, SON?', w / 2, 62); });
    // Пузырь висит над проёмом левее створки и рисуется поверх всего: открытая дверь его не режет.
    const speech = new T.Sprite(new T.SpriteMaterial({ map: tex(say), transparent: true, depthWrite: false, depthTest: false })); speech.scale.set(1.6, .34, 1); speech.position.set(X - .3, 2.42, Z + .3); speech.renderOrder = 10; speech.visible = false; r.group.add(speech);
    const bed = new T.Mesh(new T.BoxGeometry(2.1, .16, 1), flat('#3b3f55')); bed.position.set(17.2, .08, -19.4); r.group.add(bed);
    const sheet = new T.Mesh(new T.BoxGeometry(2.04, .03, .94), flat('#5867a8')); sheet.position.set(17.2, .175, -19.4); r.group.add(sheet);
    // Сын рисуется на холсте: картинка из Higgsfield плюс два ручья слёз, которые всё время текут.
    const sonC = cv(640, 360), sonG = sonC.getContext('2d'), sonT = tex(sonC), sonIm = new Image();
    sonIm.crossOrigin = 'anonymous'; sonIm.onload = () => drawSon(0); sonIm.src = Media.url(MEME_ART.son);
    // Голова на рисунке лежит макушкой влево, поэтому «вниз по лицу» значит вправо, к подбородку.
    // Ручей идёт от глаза по щеке к краю лица, оттуда капли падают на матрас.
    // Верхний ручей огибает щёку и сходится с нижним у подбородка: капли падают в одну лужицу на матрасе.
    const STREAMS = [[156, 120, 186, 106, 222, 150, 206, 214], [138, 190, 158, 200, 182, 206, 204, 216]];
    function drawSon(t) {
      const g = sonG; g.clearRect(0, 0, 640, 360);
      if (sonIm.complete) g.drawImage(sonIm, 0, 0, 640, 360);
      g.lineCap = 'round'; g.lineJoin = 'round';
      STREAMS.forEach(([x0, y0, x1, y1, x2, y2, x3, y3], e) => {
        const path = () => { g.beginPath(); g.moveTo(x0, y0); g.bezierCurveTo(x1, y1, x2, y2, x3, y3); };
        path(); g.strokeStyle = 'rgba(70,160,255,.9)'; g.lineWidth = 9; g.setLineDash([]); g.stroke();
        path(); g.strokeStyle = '#dff3ff'; g.lineWidth = 3.5; g.setLineDash([10, 14]); g.lineDashOffset = -t * 80 - e * 9; g.stroke();
        g.setLineDash([]);
        for (let i = 0; i < 3; i++) {
          const k = (t * 1.5 + i / 3 + e * .17) % 1;
          g.globalAlpha = 1 - k * .7; g.fillStyle = '#4aa8ff';
          g.beginPath(); g.ellipse(x3 + 2, y3 + 6 + k * 46, 5, 7.5, 0, 0, 7); g.fill();
        }
        g.globalAlpha = .55; g.fillStyle = '#4aa8ff';
        if (e) { g.beginPath(); g.ellipse(x3 + 2, y3 + 62, 26 + Math.sin(t * 3) * 3, 7, 0, 0, 7); g.fill(); }
        g.globalAlpha = 1;
      });
      sonT.needsUpdate = true;
    }
    const son = new T.Mesh(new T.PlaneGeometry(2, 1.125), new T.MeshBasicMaterial({ map: sonT, transparent: true, alphaTest: .3, side: T.DoubleSide }));
    son.position.set(17.2, .5, -19.3); son.rotation.x = -1.05; r.group.add(son);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: World.glowTex, color: '#6b8cff', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(5.4, 3.4, 1); glow.position.set(16.9, 1, -20.6); r.group.add(glow);
    thing(r, { id: 'son', label: 'Сын', mesh: hit(r, 2.1, .8, 1.1, 17.2, .45, -19.4), spot: { x: 16.4, z: -17.4 }, at: new T.Vector3(17.2, 1.2, -19.4) });
    return { pivot, dad, faces, Z, speech, son, drawSon, glow, sonAt: { x: 17.2, z: -19.4 } };
  }

  // Холст с артом автомата: картинки декодируются асинхронно, текстура обновится сама.
  // paint рисует холст сам, когда картинке нужна рамка, надпись или другой кадр.
  function skin(name, w, h, nearest, paint) {
    const c = cv(w, h), t = tex(c, { nearest });
    Arcade.ready(() => { const g = c.getContext('2d'); g.imageSmoothingEnabled = !nearest; if (paint) paint(g, Arcade.art, w, h); else g.drawImage(Arcade.art[name], 0, 0, w, h); t.needsUpdate = true; });
    return new T.MeshBasicMaterial({ map: t, side: T.DoubleSide });
  }
  const glowAt = (r, col, a, s, x, y, z) => { const q = new T.Sprite(new T.SpriteMaterial({ map: World.glowTex, color: col, transparent: true, opacity: a, depthWrite: false, blending: T.AdditiveBlending })); q.scale.set(s, s, 1); q.position.set(x, y, z); r.group.add(q); };

  // Светодиодные кольца потолка и пола: все дуги в одной геометрии, это одна отрисовка.
  function ledStrips(r) {
    const pos = [], hw = .03, { x, z } = r.round;
    for (const q of r.arcs) {
      const n = Math.ceil((q.a1 - q.a0) * q.rad / .3);
      for (let i = 0; i < n; i++) {
        const t0 = q.a0 + (q.a1 - q.a0) * i / n, t1 = q.a0 + (q.a1 - q.a0) * (i + 1) / n;
        const p = (t, rad) => [x + Math.cos(t) * rad, z + Math.sin(t) * rad], [ax, az] = p(t0, q.rad - hw), [bx, bz] = p(t0, q.rad + hw), [cx, cz] = p(t1, q.rad + hw), [dx, dz] = p(t1, q.rad - hw);
        for (const y of [.004, r.h - .004]) pos.push(ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx, y, dz);
      }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    r.group.add(new T.Mesh(geo, flat('#ffffff', { side: T.DoubleSide })));
  }

  // Змейка: классический силуэт автомата, бока и вывеска из LCD-арта. Смотрит на запад.
  function snakeCabinet(r, z) {
    const X = 25.98, W = .96, HT = 2.34, shell = flat('#1f2a18'), trim = flat('#8bac0f'), face = -Math.PI / 2;
    const prof = [[.02, 0], [.02, .84], [-.14, 1.03], [.12, 1.13], [.2, 1.83], [-.02, 1.98], [0, HT], [.9, HT], [.9, 0]];
    const s = new T.Shape(); prof.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
    const geo = new T.ShapeGeometry(s, 1), p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + .14) / 1.04, p.getY(i) / HT);
    const side = skin('snake_side', 540, 720, true);
    for (const q of [-1, 1]) { const m = new T.Mesh(geo, side); m.position.set(X, 0, z + q * W / 2); r.group.add(m); }
    const box = (w, h, d, x, y, mat = shell) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); r.group.add(m); return m; };
    box(.72, HT, W - .02, X + .55, HT / 2); box(.04, .84, W, X + .04, .42); box(.92, .03, W, X + .45, HT);
    const plate = new T.Mesh(new T.PlaneGeometry(.5, .5), flat('#0f380f')); plate.rotation.y = face; plate.position.set(X + .015, .46, z); r.group.add(plate);
    [-.09, .09].forEach(q => { const c = new T.Mesh(new T.PlaneGeometry(.06, .1), flat('#ff4518')); c.rotation.y = face; c.position.set(X + .01, .52, z + q); r.group.add(c); });
    const panel = box(.29, .04, W, X, 1.08, flat('#306230')); panel.rotation.z = -.36;
    const stick = new T.Mesh(new T.CylinderGeometry(.016, .016, .13, 8), flat('#cadc9f')), knob = new T.Mesh(new T.SphereGeometry(.05, 10, 8), flat('#0f380f'));
    stick.position.set(X - .02, 1.14, z - .2); knob.position.set(X - .02, 1.21, z - .2); r.group.add(stick, knob);
    [.08, .24].forEach(q => { const b = new T.Mesh(new T.CylinderGeometry(.045, .045, .03, 12), trim); b.position.set(X - .02, 1.11, z + q); r.group.add(b); });
    const c = cv(320, 240), t = tex(c);
    const scr = new T.Mesh(new T.PlaneGeometry(.74, .555), new T.MeshBasicMaterial({ map: t })); scr.rotation.set(-.113, face, 0, 'YXZ'); scr.position.set(X + .158, 1.46, z); r.group.add(scr);
    const bezel = new T.Mesh(new T.PlaneGeometry(W, .74), flat('#0f1a0c')); bezel.rotation.set(-.113, face, 0, 'YXZ'); bezel.position.set(X + .17, 1.48, z); r.group.add(bezel);
    const under = new T.Mesh(new T.PlaneGeometry(W, .3), flat('#0a1208')); under.rotation.set(.82, face, 0, 'YXZ'); under.position.set(X + .1, 1.905, z); r.group.add(under);
    const mq = new T.Mesh(new T.PlaneGeometry(W, .35), skin('snake_marquee', 800, 284, true)); mq.rotation.y = face; mq.position.set(X - .005, 2.16, z); r.group.add(mq);
    glowAt(r, '#8bac0f', .4, 3.4, 26.9, 1.5, z);
    thing(r, { id: 'snake', label: 'Змейка', mesh: hit(r, 1.15, 2.4, 1.1, X + .4, 1.2, z), spot: { x: 24.5, z }, at: new T.Vector3(X, 2.5, z) });
    return { id: 'snake', z, g: c.getContext('2d'), c, tex: t };
  }

  // Пинбол: настоящий стол на ножках и подсвеченное стекло. Нижний край поля смотрит на посетителя.
  function pinballTable(r, z) {
    const chrome = flat('#c8cedb'), dark = flat('#14101f'), pink = flat('#ff2e9a'), L = 1.46, Wd = .74;
    const tilt = new T.Group(); tilt.position.set(26, .98, z); tilt.rotation.z = .085; r.group.add(tilt);
    const body = new T.Mesh(new T.BoxGeometry(L + .06, .26, Wd + .08), dark); body.position.y = -.14; tilt.add(body);
    const field = new T.Mesh(new T.PlaneGeometry(Wd, L), skin('pin_field', 720, 1200)); field.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); field.position.y = .002; tilt.add(field);
    const ball = new T.Mesh(new T.SphereGeometry(.018, 12, 10), chrome); ball.position.set(-.35, .02, .1); tilt.add(ball);
    for (const q of [-1, 1]) { const rail = new T.Mesh(new T.BoxGeometry(L + .08, .06, .03), chrome); rail.position.set(0, .02, q * (Wd / 2 + .025)); tilt.add(rail); const st = new T.Mesh(new T.BoxGeometry(L + .04, .05, .012), pink); st.position.set(0, -.14, q * (Wd / 2 + .045)); tilt.add(st); }
    for (const q of [-1, 1]) { const rail = new T.Mesh(new T.BoxGeometry(.03, .06, Wd + .08), chrome); rail.position.set(q * (L / 2 + .025), .02, 0); tilt.add(rail); }
    [[25.38, -1], [25.38, 1], [26.62, -1], [26.62, 1]].forEach(([x, q]) => {
      const h = x < 26 ? .83 : .92, leg = new T.Mesh(new T.CylinderGeometry(.03, .022, h, 10), chrome); leg.position.set(x, h / 2, z + q * .34); r.group.add(leg);
      const foot = new T.Mesh(new T.CylinderGeometry(.05, .06, .03, 12), chrome); foot.position.set(x, .015, z + q * .34); r.group.add(foot);
    });
    const box = new T.Mesh(new T.BoxGeometry(.2, .6, .84), dark); box.position.set(26.84, 1.54, z); r.group.add(box);
    const neck = new T.Mesh(new T.BoxGeometry(.16, .3, .5), dark); neck.position.set(26.84, 1.14, z); r.group.add(neck);
    const glass = new T.Mesh(new T.PlaneGeometry(.8, .45), skin('pin_glass', 960, 536)); glass.rotation.y = -Math.PI / 2; glass.position.set(26.735, 1.54, z); r.group.add(glass);
    for (const y of [1.235, 1.845]) { const q = new T.Mesh(new T.BoxGeometry(.22, .025, .86), chrome); q.position.set(26.84, y, z); r.group.add(q); }
    glowAt(r, '#ff2e9a', .34, 3, 26.95, 1.5, z); glowAt(r, '#35e6ff', .14, 2, 26.2, .4, z);
    thing(r, { id: 'pinball', label: 'Пинбол', mesh: hit(r, 1.7, 1.7, .95, 26.05, .9, z), spot: { x: 24.5, z }, at: new T.Vector3(25.7, 1.5, z) });
  }

  // --- новые автоматы: общий силуэт, экран, вывеска ----------------------------------------------

  // Передний край как у змейки: дверца, пульт, экран под наклоном и козырёк.
  const FRONT = [[.02, 0], [.02, .84], [-.14, 1.03], [.12, 1.13], [.2, 1.83], [-.02, 1.98]];
  const FONTS = document.fonts ? Promise.all([document.fonts.load('40px "Pixelify Sans"'), document.fonts.load(`italic 900 40px ${SANS}`)]).catch(() => {}) : Promise.resolve();
  // Боковины по профилю. Холст повторяет пропорции силуэта, поэтому арт ложится без растяжения.
  function cabSides(r, X, z, W, prof, paint) {
    const s = new T.Shape(); prof.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
    const xs = prof.map(p => p[0]), x0 = Math.min(...xs), dx = Math.max(...xs) - x0, top = Math.max(...prof.map(p => p[1]));
    const geo = new T.ShapeGeometry(s, 1), p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / dx, p.getY(i) / top);
    const w = Math.round(320 * Q), mat = skin('', w, Math.round(w * top / dx), false, paint);
    for (const q of [-1, 1]) { const m = new T.Mesh(geo, mat); m.position.set(X, 0, z + q * W / 2); r.group.add(m); }
  }
  // Арт игры во всю ширину сверху, нижний край тает в цвет корпуса.
  function topArt(g, img, w, under) {
    const ah = w * img.height / img.width;
    g.drawImage(img, 0, 0, w, ah);
    const f = g.createLinearGradient(0, ah * .8, 0, ah); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, under);
    g.fillStyle = f; g.fillRect(0, ah * .8, w, ah * .2 + 1);
  }
  function cabScreen(r, X, z, W, col, id) {
    const face = -Math.PI / 2, c = cv(320, 240), t = tex(c);
    const scr = new T.Mesh(new T.PlaneGeometry(.74, .555), new T.MeshBasicMaterial({ map: t })); scr.rotation.set(-.113, face, 0, 'YXZ'); scr.position.set(X + .158, 1.46, z); r.group.add(scr);
    const bezel = new T.Mesh(new T.PlaneGeometry(W, .74), flat(col)); bezel.rotation.set(-.113, face, 0, 'YXZ'); bezel.position.set(X + .17, 1.48, z); r.group.add(bezel);
    const under = new T.Mesh(new T.PlaneGeometry(W, .3), flat(col)); under.rotation.set(.82, face, 0, 'YXZ'); under.position.set(X + .1, 1.905, z); r.group.add(under);
    return { id, z, g: c.getContext('2d'), c, tex: t };
  }
  // Вывеска ждёт шрифты: надпись рисуется на холсте один раз.
  function marquee(paint, w, h) {
    const c = cv(w, h), t = tex(c);
    FONTS.then(() => Arcade.ready(() => { paint(c.getContext('2d'), Arcade.art, w, h); t.needsUpdate = true; }));
    return new T.MeshBasicMaterial({ map: t, side: T.DoubleSide });
  }
  const cabBox = (r, z) => (w, h, d, x, y, mat, zz = z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, zz); r.group.add(m); return m; };
  const cabPlane = (r, z) => (w, h, mat, x, y, zz = z, ry = -Math.PI / 2) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.rotation.y = ry; m.position.set(x, y, zz); r.group.add(m); return m; };

  // Файрвол: корпус в огне. Боковины горят языками, на крыше недобитая стена и шарик, который её пробил.
  function fireCabinet(r, z) {
    const X = 25.98, W = .96, HT = 2.34, shell = flat('#1c0b08'), ember = flat('#ff5a1f'), box = cabBox(r, z), plane = cabPlane(r, z);
    const prof = [...FRONT, [-.02, HT], [.06, 2.6], [.16, 2.44], [.27, 2.78], [.39, 2.48], [.51, 2.7], [.63, 2.46], [.76, 2.66], [.86, 2.44], [.9, HT], [.9, 0]];
    cabSides(r, X, z, W, prof, (g, a, w, h) => {
      g.fillStyle = '#1a0806'; g.fillRect(0, 0, w, h);
      const bh = w / 8;
      for (let j = 0, y = h * .45; y < h; j++, y += bh) for (let x = (j % 2) * -bh; x < w; x += bh * 2) {
        g.fillStyle = j % 3 ? '#2c0d07' : '#3a1209'; g.fillRect(x + 2, y + 2, bh * 2 - 4, bh - 4);
        g.fillStyle = 'rgba(255,90,31,.5)'; g.fillRect(x + 2, y + bh - 5, bh * 2 - 4, 2);
      }
      topArt(g, a.fw_side, w, '#1a0806');
      const l = g.createLinearGradient(0, h, 0, h * .6); l.addColorStop(0, 'rgba(255,90,31,.45)'); l.addColorStop(1, 'rgba(255,90,31,0)');
      g.fillStyle = l; g.fillRect(0, h * .6, w, h * .4);
    });
    box(.72, HT, W - .02, X + .55, HT / 2, shell); box(.04, .84, W, X + .04, .42, flat('#2a0f08')); box(.92, .03, W, X + .45, HT, ember);
    plane(.5, .5, flat('#0f0504'), X + .015, .46);
    [-.09, .09].forEach(q => plane(.06, .1, ember, X + .01, .52, z + q));
    for (const q of [-1, 1]) box(.025, .84, .025, X + .02, .42, ember, z + q * (W / 2 + .013));
    box(.29, .04, W, X, 1.08, flat('#3a140a')).rotation.z = -.36;
    const spin = new T.Mesh(new T.CylinderGeometry(.075, .08, .05, 20), flat('#d9dde6')); spin.position.set(X - .02, 1.14, z - .18); r.group.add(spin);
    const cap = new T.Mesh(new T.CylinderGeometry(.045, .045, .02, 16), ember); cap.position.set(X - .02, 1.175, z - .18); r.group.add(cap);
    [[.1, '#ffd23f'], [.26, '#ff2d55']].forEach(([q, col]) => { const b = new T.Mesh(new T.CylinderGeometry(.045, .045, .03, 12), flat(col)); b.position.set(X - .02, 1.11, z + q); r.group.add(b); });
    const scr = cabScreen(r, X, z, W, '#140604', 'firewall');
    plane(W, .35, marquee((g, a, w, h) => {
      g.drawImage(a.fw_mq, 0, 22, 700, 256, 0, 0, w, h);
      g.textAlign = 'center'; Arcade.shout(g, 'ФАЙРВОЛ', w * .66, h * .66, 80, ['#ffffff', '#ffe98a', '#ff7a12', '#ff2d55']);
    }, 700, 256), X - .025, 2.16);
    // Крыша: три ряда кирпичей с пробоиной, в ней застрял раскалённый шарик.
    const hot = ['#ff2d55', '#ff7a12', '#ffd23f'], wall = new T.InstancedMesh(new T.BoxGeometry(.1, .075, .14), new T.MeshBasicMaterial(), 18), o = new T.Object3D(), col = new T.Color();
    let n = 0;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) {
      if ((i === 3 && j > 0) || (i === 2 && j === 2)) continue;
      o.position.set(X + .45, HT + .045 + j * .082, z - .375 + i * .15 + (j % 2) * .035); o.updateMatrix();
      wall.setMatrixAt(n, o.matrix); wall.setColorAt(n++, col.set(hot[(i + j) % 3]));
    }
    wall.count = n; r.group.add(wall);
    const ball = new T.Mesh(new T.SphereGeometry(.06, 14, 10), flat('#fff3c4')); ball.position.set(X + .4, HT + .17, z + .075); r.group.add(ball);
    glowAt(r, '#ffb020', .6, .7, X + .35, HT + .17, z + .075);
    glowAt(r, '#ff5a1f', .4, 3.4, 26.9, 1.5, z);
    thing(r, { id: 'firewall', label: 'Файрвол', mesh: hit(r, 1.15, 2.7, 1.1, X + .4, 1.35, z), spot: { x: 24.5, z }, at: new T.Vector3(X, 2.95, z) });
    return scr;
  }

  // Антивирус: компьютер девяностых в рост человека. Системный блок, ЭЛТ-монитор, клавиатура и окно-вывеска сверху.
  function virusCabinet(r, z) {
    const X = 26.02, D = .86, beige = flat('#e2d9c2'), shade = flat('#c9bfa5'), box = cabBox(r, z), plane = cabPlane(r, z);
    box(D, 1, .96, X + D / 2, .5, shade);
    plane(.96, 1, skin('', 256, 266, false, (g, a, w, h) => {
      g.fillStyle = '#e2d9c2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#efe8d6'; g.fillRect(0, 0, w, 4); g.fillStyle = '#b8ad92'; g.fillRect(0, h - 5, w, 5);
      for (const y of [20, 62]) { g.fillStyle = '#cfc6ae'; g.fillRect(24, y, w - 48, 34); g.fillStyle = '#2b2a26'; g.fillRect(40, y + 14, w - 110, 6); g.fillStyle = '#9d9480'; g.fillRect(w - 58, y + 10, 18, 14); }
      g.fillStyle = '#cfc6ae'; g.fillRect(24, 104, 120, 30); g.fillStyle = '#2b2a26'; g.fillRect(34, 116, 84, 5); g.fillStyle = '#9d9480'; g.fillRect(124, 122, 12, 6);
      g.fillStyle = '#3be04a'; g.beginPath(); g.arc(186, 119, 5, 0, 7); g.fill(); g.fillStyle = '#ff7a12'; g.beginPath(); g.arc(210, 119, 5, 0, 7); g.fill();
      g.fillStyle = '#6b6455'; g.font = `700 15px ${MONO}`; g.fillText('NETIZEN 486', 24, 166); g.font = `400 10px ${MONO}`; g.fillText('TURBO', 196, 140);
      for (let y = 186; y < 252; y += 9) { g.fillStyle = '#b8ad92'; g.fillRect(24, y, 130, 3); }
      g.fillStyle = '#efe8d6'; g.fillRect(178, 188, 54, 54); g.fillStyle = '#b8ad92'; g.fillRect(182, 192, 50, 50); g.fillStyle = '#d6cdb4'; g.fillRect(182, 192, 46, 46);
      g.strokeStyle = '#6b6455'; g.lineWidth = 3; g.beginPath(); g.arc(205, 216, 11, -1.1, 4.25); g.moveTo(205, 201); g.lineTo(205, 213); g.stroke();
    }), X - .002, .5);
    const side = skin('', 344, 400, false, (g, a, w, h) => g.drawImage(a.av_side, 0, 38, 450, 523, 0, 0, w, h));
    plane(D, 1, side, X + D / 2, .5, z + .482, 0); plane(D, 1, side, X + D / 2, .5, z - .482, Math.PI);
    // Монитор с толстым кинескопом.
    box(.58, .8, .94, X + .25, 1.44, beige); box(.36, .6, .7, X + .7, 1.42, shade); box(.36, .05, .5, X + .4, 1.025, shade);
    plane(.82, .64, flat('#3b3a35'), X - .043, 1.48);
    const c = cv(320, 240), t = tex(c);
    plane(.72, .54, new T.MeshBasicMaterial({ map: t }), X - .046, 1.48);
    plane(.24, .045, skin('', 128, 24, false, g => { g.fillStyle = '#e2d9c2'; g.fillRect(0, 0, 128, 24); g.fillStyle = '#6b6455'; g.font = `700 16px ${MONO}`; g.textAlign = 'center'; g.fillText('NETIZEN', 64, 18); }), X - .042, 1.11, z - .25);
    plane(.025, .025, flat('#3be04a'), X - .042, 1.11, z + .38);
    const sticker = skin('', 128, 128, false, (g, a) => g.drawImage(a.av_head, 0, 0, 128, 128)); sticker.alphaTest = .4;
    plane(.24, .24, sticker, X - .045, 1.72, z + .36).rotation.x = .18;
    // Клавиатура на выдвижной полке, рядом мышь.
    box(.32, .04, .9, X - .14, .98, shade);
    box(.24, .035, .7, X - .16, 1.02, flat('#6b665a'), z - .07).rotation.z = .06;
    const keys = new T.InstancedMesh(new T.BoxGeometry(.036, .02, .044), flat('#efe8d6'), 52), o = new T.Object3D();
    let n = 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 13; i++) { o.position.set(X - .245 + j * .05, 1.045 + j * .003, z - .382 + i * .052); o.updateMatrix(); keys.setMatrixAt(n++, o.matrix); }
    r.group.add(keys);
    box(.1, .035, .065, X - .16, 1.018, beige, z + .37);
    // Вывеска-окно на двух стойках над монитором.
    for (const q of [-.3, .3]) box(.03, .12, .03, X + .25, 1.89, shade, z + q);
    box(.03, .3, 1, X + .215, 2.08, flat('#c3c3c3'));
    plane(.98, .286, marquee((g, a, w, h) => {
      g.drawImage(a.av_mq, 0, 40, 700, 204, 0, 0, w, h);
      g.textAlign = 'center'; g.fillStyle = '#0a246a'; g.font = `400 58px "Pixelify Sans", ${SANS}`; g.fillText('АНТИВИРУС', 349, 118);
      g.fillStyle = '#3a6ea5'; g.font = `400 24px "Pixelify Sans", ${SANS}`; g.fillText('проверка системы…', 349, 152);
    }, 700, 204), X + .195, 2.08);
    glowAt(r, '#2ec4b6', .3, 3, 26.9, 1.4, z);
    thing(r, { id: 'antivirus', label: 'Антивирус', mesh: hit(r, 1.2, 2.3, 1.1, X + .35, 1.15, z), spot: { x: 24.5, z }, at: new T.Vector3(X, 2.45, z) });
    return { id: 'antivirus', z, g: c.getContext('2d'), c, tex: t };
  }

  // Загрузка: глянцевая капсула нулевых. Купол, стеклянный пузырь с маскотом и полоса прогресса на дверце.
  function loadCabinet(r, z) {
    const X = 25.98, W = .96, cx = .44, cy = 1.98, rad = .46, box = cabBox(r, z), plane = cabPlane(r, z);
    const prof = [...FRONT];
    for (let i = 1; i <= 18; i++) { const a = Math.PI - i / 18 * Math.PI; prof.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
    prof.push([.9, 0]);
    cabSides(r, X, z, W, prof, (g, a, w, h) => {
      const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, '#8fdcff'); l.addColorStop(.55, '#3aa3e6'); l.addColorStop(1, '#0f6fb8');
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2;
      for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 71) % w, h * .55 + (i * 53) % (h * .42), 5 + (i * 7) % 14, 0, 7); g.stroke(); }
      for (const [d, c, lw] of [[0, 'rgba(255,255,255,.75)', 10], [18, 'rgba(132,255,90,.8)', 6]]) {
        g.lineWidth = lw; g.strokeStyle = c; g.beginPath(); g.moveTo(-10, h * .9 + d); g.bezierCurveTo(w * .3, h * .7 + d, w * .7, h * .98 + d, w + 10, h * .76 + d); g.stroke();
      }
      topArt(g, a.ld_side, w, '#3aa3e6');
    });
    box(.72, cy, W - .02, X + .55, cy / 2, flat('#eaf7ff')); box(.04, .84, W, X + .04, .42, flat('#cdeeff'));
    const glossy = textPanel(64, 8, (g, w, h) => { const l = g.createLinearGradient(0, 0, w, 0); ['#2f9be0', '#bfe9ff', '#ffffff', '#bfe9ff', '#2f9be0'].forEach((c, i) => l.addColorStop(i / 4, c)); g.fillStyle = l; g.fillRect(0, 0, w, h); });
    const dome = new T.Mesh(new T.CylinderGeometry(rad, rad, W - .02, 28, 1, false, -Math.PI / 2, Math.PI), basic(glossy, { release: true }));
    dome.rotation.x = -Math.PI / 2; dome.position.set(X + cx, cy, z); r.group.add(dome);
    // Дверца: вместо щелей для монет полоса прогресса, которая всё никак не дойдёт до конца.
    plane(.6, .52, flat('#0f4f8a'), X + .015, .46);
    plane(.58, .11, flat('#bfe9ff'), X + .012, .6);
    const lit = flat('#84ff5a'), off = flat('#0a2f57'), segs = [];
    for (let i = 0; i < 10; i++) segs.push(plane(.042, .07, off, X + .009, .6, z - .243 + i * .054));
    [-.09, .09].forEach(q => plane(.06, .1, flat('#38c8ff'), X + .01, .4, z + q));
    box(.29, .04, W, X, 1.08, flat('#bfe9ff')).rotation.z = -.36;
    ['#35e6ff', '#84ff5a', '#ff4f9a', '#ffd23f'].forEach((col, i) => { const b = new T.Mesh(new T.SphereGeometry(.042, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(col)); b.position.set(X - .02, 1.1, z - .27 + i * .16); r.group.add(b); });
    const scr = cabScreen(r, X, z, W, '#0b2a4a', 'loading');
    plane(W, .3, marquee((g, a, w, h) => {
      g.drawImage(a.ld_mq, 0, 40, 700, 219, 0, 0, w, h);
      g.textAlign = 'center'; Arcade.shout(g, 'ЗАГРУЗКА…', w * .52, h * .66, 70, ['#ffffff', '#7fd8ff', '#1e6fd0'], '#0b3a66');
    }, 700, 219), X - .03, 2.13);
    // Макушка: кольцо и стеклянный пузырь, внутри маскот в шлеме.
    const ring = new T.Mesh(new T.TorusGeometry(.16, .028, 8, 28), flat('#38c8ff')); ring.rotation.x = Math.PI / 2; ring.position.set(X + cx, cy + rad + .01, z); r.group.add(ring);
    const bubble = new T.Mesh(new T.SphereGeometry(.27, 24, 16), new T.MeshBasicMaterial({ color: '#c9f4ff', transparent: true, opacity: .22, depthWrite: false }));
    bubble.position.set(X + cx, cy + rad + .27, z); r.group.add(bubble);
    const hc = cv(128, 128), ht = tex(hc);
    Arcade.ready(() => { hc.getContext('2d').drawImage(Arcade.art.ld_head, 0, 0, 128, 128); ht.needsUpdate = true; });
    const head = new T.Sprite(new T.SpriteMaterial({ map: ht, alphaTest: .4, transparent: false })); head.scale.set(.36, .36, 1); head.position.copy(bubble.position); r.group.add(head);
    glowAt(r, '#ffffff', .5, .16, X + cx - .12, cy + rad + .4, z - .1);
    glowAt(r, '#35e6ff', .32, 3.4, 26.9, 1.5, z);
    const float = [0, 1, 2, 3].map(() => { const q = new T.Sprite(new T.SpriteMaterial({ map: World.glowTex, color: '#9ff0ff', transparent: true, depthWrite: false, blending: T.AdditiveBlending })); q.scale.set(.09, .09, 1); r.group.add(q); return q; });
    scr.tick = t => {
      const on = Math.floor(t * 3) % 14;
      segs.forEach((s, i) => { s.material = i < on ? lit : off; });
      float.forEach((q, i) => { const k = (t * .18 + i * .25) % 1; q.position.set(X - .25 + Math.sin(t + i) * .05, .9 + k * 2, z + (i % 2 ? .35 : -.35)); q.material.opacity = .7 * Math.sin(k * Math.PI); });
    };
    thing(r, { id: 'loading', label: 'Загрузка', mesh: hit(r, 1.15, 3, 1.1, X + .4, 1.5, z), spot: { x: 24.5, z }, at: new T.Vector3(X, 3.12, z) });
    return scr;
  }

  function skyPanel(w, h, seed) {
    return textPanel(w, h, (g) => {
      const l = g.createLinearGradient(0, 0, 0, h);
      l.addColorStop(0, '#d7dce6'); l.addColorStop(.62, '#f7e7cf'); l.addColorStop(1, '#fbf1e2');
      g.fillStyle = l; g.fillRect(0, 0, w, h);
      const u = rng(seed);
      for (let i = 0; i < 30; i++) { const x = u() * w, y = h * (.55 + u() * .45), rd = h * (.1 + u() * .16), q = g.createRadialGradient(x, y, 0, x, y, rd); q.addColorStop(0, 'rgba(255,255,255,.86)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x - rd, y - rd, rd * 2, rd * 2); }
    });
  }
  // Кессоны: балки одной сетки, у каждой стороны свой запечённый тон.
  function coffers(r, st, bw, dp) {
    const L = r.x1 - r.x0, D = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, nx = Math.floor(L / st), nz = Math.floor(D / st);
    const side = flat('#c7c2b8'), face = flat('#f3f1ec'), edge = flat('#dad6cd');
    const m = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), [side, side, face, face, edge, edge], nx + nz), o = new T.Object3D();
    for (let i = 0; i < nx; i++) { o.position.set(r.x0 + (i + 1) * st, r.h - dp / 2, cz); o.scale.set(bw, dp, D); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
    for (let i = 0; i < nz; i++) { o.position.set(cx, r.h - dp / 2, r.z0 + (i + 1) * st); o.scale.set(L, dp, bw); o.updateMatrix(); m.setMatrixAt(nx + i, o.matrix); }
    r.group.add(m);
  }
  function skylight(r) {
    const q = r.light, W = q.x1 - q.x0, Dp = q.z1 - q.z0, cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, top = r.h + q.d;
    const blue = textPanel(256, 128, (g, w, h) => { const l = g.createLinearGradient(0, 0, w, h); l.addColorStop(0, '#1f5fa8'); l.addColorStop(1, '#6db2e8'); g.fillStyle = l; g.fillRect(0, 0, w, h); });
    const sky = new T.Mesh(new T.PlaneGeometry(W, Dp), basic(blue, { release: true })); sky.rotation.x = Math.PI / 2; sky.position.set(cx, top, cz); r.group.add(sky);
    const shaft = basic(gradient('#dfe6f0', '#fbfaf6', '#ffffff'), { side: T.DoubleSide });
    const wall = (w, x, z, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, q.d), shaft); m.position.set(x, r.h + q.d / 2, z); m.rotation.y = ry; r.group.add(m); };
    wall(W, cx, q.z0, 0); wall(W, cx, q.z1, 0); wall(Dp, q.x0, cz, Math.PI / 2); wall(Dp, q.x1, cz, Math.PI / 2);
  }
  function niche(r) {
    const n = r.niche, wall = r.walls[n.key], g = new T.Group(), a = n.u - n.w / 2, b = n.u + n.w / 2;
    wall.place(g);
    const back = new T.Mesh(new T.PlaneGeometry(n.w, n.h), basic(skyPanel(512, 340, 7), { release: true })); back.position.set(n.u, n.v + n.h / 2, -n.d); g.add(back);
    const lit = flat('#f4f1eb'), dim = flat('#c5bfb3'), mid = flat('#dbd6cc');
    const add = (m, x, y, z, ry, rx) => { m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx; g.add(m); };
    add(new T.Mesh(new T.PlaneGeometry(n.d, n.h), mid), a, n.v + n.h / 2, -n.d / 2, Math.PI / 2, 0);
    add(new T.Mesh(new T.PlaneGeometry(n.d, n.h), mid), b, n.v + n.h / 2, -n.d / 2, -Math.PI / 2, 0);
    add(new T.Mesh(new T.PlaneGeometry(n.w, n.d), lit), n.u, n.v, -n.d / 2, 0, -Math.PI / 2);
    add(new T.Mesh(new T.PlaneGeometry(n.w, n.d), dim), n.u, n.v + n.h, -n.d / 2, 0, Math.PI / 2);
    wall.group.add(g);
  }
  // Подиум, ступени и перила: пол работает через floorY, здесь только то, что видно.
  function stage(r) {
    const planks = textPanel(512, 560, (g, w, h) => {
      const u = rng(5); g.fillStyle = '#b98f63'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 44) { g.fillStyle = `hsl(30 ${38 + u() * 8}% ${54 + u() * 8}%)`; g.fillRect(0, y, w, 44); for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(92,60,28,.1)'; g.fillRect(u() * w, y + u() * 44, 20 + u() * 150, 1.5); } g.fillStyle = 'rgba(60,36,16,.3)'; g.fillRect(0, y, w, 1.5); g.fillRect(u() * w, y, 1.5, 44); }
    });
    const wood = basic(planks, { release: true }), sideW = flat('#8d6a48'), S = STAGE, Dp = S.z1 - S.z0, cz = (S.z0 + S.z1) / 2;
    const body = new T.Mesh(new T.BoxGeometry(S.x1, S.y, Dp), [sideW, sideW, wood, sideW, sideW, sideW]); body.position.set(S.x1 / 2, S.y / 2, cz); r.group.add(body);
    r.pick.floors.push(body);
    for (let i = 0; i < 3; i++) {
      const hh = S.y * (3 - i) / 4, st = new T.Mesh(new T.BoxGeometry(.34, hh, Dp), [sideW, sideW, flat(i % 2 ? '#c8a177' : '#bf966b'), sideW, sideW, sideW]);
      st.position.set(S.x1 + .17 + i * .33, hh / 2, cz); r.group.add(st); r.pick.floors.push(st);
    }
    const iron = flat('#6e5c4b'), railZ = S.z1, y = S.y + 1;
    const bar = new T.Mesh(new T.BoxGeometry(S.x1, .045, .045), iron); bar.position.set(S.x1 / 2, y, railZ); r.group.add(bar);
    const slope = new T.Mesh(new T.BoxGeometry(Math.hypot(1, S.y), .045, .045), iron); slope.position.set(S.x1 + .5, y - S.y / 2, railZ); slope.rotation.z = -Math.atan2(S.y, 1); r.group.add(slope);
    [[.15, S.y], [2.3, S.y], [S.x1, S.y], [S.x2, 0]].forEach(([x, b]) => { const p = new T.Mesh(new T.BoxGeometry(.045, 1, .045), iron); p.position.set(x, b + .5, railZ); r.group.add(p); });
  }

  const PROPS = {
    a(r) {
      coffers(r, 2.4, .52, .34); skylight(r); niche(r); stage(r);
      if (!EXTRAS) return;
      const gold = lam('#8d7a64');
      const bench = new T.Mesh(new T.BoxGeometry(.5, .42, 2.4), lam('#38312b')); bench.position.set(13.8, .21, -3.95); r.group.add(bench);
      // Банан скотчем к камню.
      const arc = new T.QuadraticBezierCurve3(new T.Vector3(-.13, -.05, 0), new T.Vector3(0, -.11, 0), new T.Vector3(.14, -.02, 0));
      const banana = new T.Mesh(new T.TubeGeometry(arc, 18, .024, 8), lam('#e8c33a'));
      const tape = new T.Mesh(new T.PlaneGeometry(.26, .05), flat('#b9b7ae')); tape.position.set(0, -.08, .03); tape.rotation.z = .5;
      const bg = new T.Group(); bg.add(banana, tape);
      const wW = r.walls.W; wW.place(bg); bg.position.copy(wW.at(10.5, 1.55, .03)); wW.group.add(bg);
      r.banana = bg;
      const bHit = hit(r, .7, .6, .3, bg.position.x + .15, 1.55, bg.position.z);
      thing(r, { id: 'banana', label: 'Банан на скотче', mesh: bHit, spot: { x: 1.4, z: -3.5 }, at: bg.position.clone().setY(1.75) });

      // Касса с роботом.
      const desk = new T.Mesh(new T.BoxGeometry(3.2, 1.05, 1.4), lam('#d8d3c9')); desk.position.set(15, .525, 4); r.group.add(desk);
      const top = new T.Mesh(new T.BoxGeometry(3.3, .05, 1.5), gold); top.position.set(15, 1.07, 4); r.group.add(top);
      const body = new T.Mesh(new T.BoxGeometry(.56, .72, .4), lam('#54565e')); body.position.set(15.5, 1.46, 4.1); r.group.add(body);
      const faceC = cv(128, 96);
      r.robotFace = { c: faceC, tex: tex(faceC, { nearest: true }) };
      const head = new T.Mesh(new T.BoxGeometry(.64, .48, .46), lam('#3d3f47')); head.position.set(15.5, 2.05, 4.1); r.group.add(head);
      const face = new T.Mesh(new T.PlaneGeometry(.52, .38), new T.MeshBasicMaterial({ map: r.robotFace.tex })); face.position.set(15.5, 2.05, 3.865); face.rotation.y = Math.PI; r.group.add(face);
      const sign = new T.Mesh(new T.PlaneGeometry(1.1, .22), basic(textPanel(440, 88, (g, w, h) => { g.fillStyle = '#17110c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e9c97b'; g.font = `700 44px ${SANS}`; g.textAlign = 'center'; g.fillText('КАССА-9000', w / 2, 62); }), { release: true }));
      sign.position.set(15, .74, 3.29); sign.rotation.y = Math.PI; r.group.add(sign);
      thing(r, { id: 'robot', label: 'Касса-9000', mesh: hit(r, 1.1, 1.4, .9, 15.5, 1.8, 4.1), spot: { x: 15.4, z: 2.3 }, at: new T.Vector3(15.5, 2.5, 4) });

      // Кот на кассе.
      const cat = new T.Group(), fur = lam('#1a1a1d');
      const cb = new T.Mesh(new T.SphereGeometry(.17, 10, 8), fur); cb.scale.set(1.3, .8, .9); cat.add(cb);
      const ch = new T.Mesh(new T.SphereGeometry(.105, 10, 8), fur); ch.position.set(-.19, .1, 0); cat.add(ch);
      [-.05, .05].forEach(z => { const e = new T.Mesh(new T.ConeGeometry(.038, .08, 4), fur); e.position.set(-.2, .2, z); cat.add(e); });
      const tail = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(.2, 0, 0), new T.Vector3(.4, .02, .1), new T.Vector3(.32, -.04, .2)), 10, .018, 5), fur); cat.add(tail);
      cat.position.set(14, 1.21, 3.8); r.group.add(cat); r.cat = cat;
      thing(r, { id: 'cat', label: 'Кот', mesh: hit(r, .8, .55, .7, 14, 1.3, 3.8), spot: { x: 14, z: 2.3 }, at: new T.Vector3(14, 1.6, 3.8) });

      // Вентиляция и афиша.
      const vent = new T.Mesh(new T.PlaneGeometry(.62, .38), basic(textPanel(160, 100, (g, w, h) => { g.fillStyle = '#e4dfd5'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a352e'; for (let y = 10; y < h - 8; y += 14) g.fillRect(10, y, w - 20, 8); g.fillStyle = '#8d7a64'; g.fillRect(4, 4, 8, 8); })));
      r.walls.S.place(vent); vent.position.copy(r.walls.S.at(1.1, .42, .012)); r.walls.S.group.add(vent);
      thing(r, { id: 'vent', label: 'Вентиляция', mesh: vent, spot: { x: 16.8, z: 5.8 }, at: vent.position.clone().setY(.8) });
      const poster = new T.Mesh(new T.PlaneGeometry(1.15, 1.7), basic(textPanel(460, 680, (g, w, h) => {
        g.fillStyle = '#16120e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2efe8'; g.font = `800 58px ${SANS}`; g.fillText('ОТКРЫТЫЙ', 26, 90); g.fillText('ОПЕН-КОЛЛ', 26, 156);
        g.font = `400 26px ${SANS}`; g.fillStyle = '#ece3d0'; ['Три зала.', 'По десять работ.', 'Авторов ищем здесь', 'и в Telegram.'].forEach((l, i) => g.fillText(l, 26, 250 + i * 40));
        g.fillStyle = '#e8352e'; g.fillRect(26, 470, 408, 8); g.fillStyle = '#9b9486'; g.font = `400 20px ${MONO}`; g.fillText('прототип, авторы вымышлены', 26, 520);
      }), { release: true }));
      const wW2 = r.walls.W; wW2.place(poster); poster.position.copy(wW2.at(3.4, 2.1, .02)); wW2.group.add(poster);
      thing(r, { id: 'poster', label: 'Афиша', mesh: poster, spot: { x: 1.6, z: 3.6 }, at: poster.position.clone().setY(3.1) });

      // Смотритель на стуле.
      const chair = new T.Mesh(new T.BoxGeometry(.5, .5, .5), lam('#38312b')); chair.position.set(17.2, .25, -5.9); r.group.add(chair);
      const back = new T.Mesh(new T.BoxGeometry(.06, .7, .5), lam('#38312b')); back.position.set(17.46, .8, -5.9); r.group.add(back);
    },
    j(r) {
      if (!EXTRAS) return;
      const bench = lam('#2a2622');
      [[25.55, .25], [29.45, .25]].forEach(([x, z]) => { const b = new T.Mesh(new T.BoxGeometry(1.5, .42, .5), bench); b.position.set(x, .21, z); r.group.add(b); });
    },
    b(r) {
      const colMat = basic(gradient('#d6c781', '#a8934c', '#6d5a2a'));
      r.mats.push(colMat);
      for (const q of r.block.slice(0, 4)) { const c = new T.Mesh(new T.BoxGeometry(.5, r.h, .5), colMat); c.position.set((q.x0 + q.x1) / 2, r.h / 2, (q.z0 + q.z1) / 2); r.group.add(c); }
      const door = new T.Group();
      const f = new T.Mesh(new T.PlaneGeometry(.95, 2.1), basic(textPanel(190, 420, (g, w, h) => { g.fillStyle = '#10201f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#35e6dc'; g.lineWidth = 5; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#35e6dc'; g.font = `700 40px ${MONO}`; g.textAlign = 'center'; g.fillText('ROOT', w / 2, 90); g.fillRect(150, 214, 14, 22); })));
      r.walls.E.place(f); f.position.copy(r.walls.E.at(11, 1.05, .015)); r.walls.E.group.add(f);
      f.visible = false; r.adminDoor = f;
      thing(r, { id: 'admin', label: 'Дверь ROOT', mesh: f, spot: { x: 50.8, z: 3.5 }, at: f.position.clone().setY(2.2), when: () => (World.level || 0) >= 5 });
      const fake = new T.Mesh(new T.PlaneGeometry(.95, 2.05), basic(textPanel(190, 410, (g, w, h) => { g.fillStyle = '#a39b72'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c8560'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#7a7350'; g.fillRect(160, 200, 12, 20); g.fillStyle = '#8c7f3f'; g.font = `700 32px ${SANS}`; g.textAlign = 'center'; g.fillText('B', w / 2, 70); }), { release: true }));
      r.walls.E.place(fake); fake.position.copy(r.walls.E.at(4, 1.03, .012)); r.walls.E.group.add(fake);
      thing(r, { id: 'doorB', label: 'Дверь B', mesh: fake, spot: { x: 50.8, z: -3.5 }, at: fake.position.clone().setY(2.2) });
    },
    c(r) {
      if (EXTRAS) { const bench = new T.Mesh(new T.BoxGeometry(.55, .44, 2.6), lam('#1c1d22')); bench.position.set(16, .22, 13.5); r.group.add(bench); }
    },
    d(r) {
      const lamp = new T.Mesh(new T.SphereGeometry(.13, 12, 8), flat('#ffe3a4')); lamp.position.set(8, r.h - .13, -10.2); r.group.add(lamp);
      const dad = hit(r, .7, 1.8, .7, 7.2, .9, -12.5);
      thing(r, { id: 'dad', label: 'Отец', mesh: dad, spot: { x: 8.5, z: -11.2 }, at: new T.Vector3(7.2, 2, -12.5) });
    },
    e(r) {
      const bed = new T.Mesh(new T.BoxGeometry(2.1, .42, 3.9), lam('#3a3f55')); bed.position.set(3.6, .21, -16.9); r.group.add(bed);
      const blanket = new T.Mesh(new T.BoxGeometry(2, .1, 1), lam('#5a2c3f')); blanket.position.set(3.6, .47, -15.45); r.group.add(blanket);
      const pillow = new T.Mesh(new T.BoxGeometry(1.2, .14, .6), lam('#a8abbb')); pillow.position.set(3.6, .49, -18.45); r.group.add(pillow);
      const desk = new T.Mesh(new T.BoxGeometry(3, .06, .9), lam('#3b2c22')); desk.position.set(7.6, .76, -18.55); r.group.add(desk);
      [[6.2, -18.2], [9, -18.2], [6.2, -18.9], [9, -18.9]].forEach(([x, z]) => { const l = new T.Mesh(new T.BoxGeometry(.05, .76, .05), lam('#222')); l.position.set(x, .38, z); r.group.add(l); });
      const c = cv(420, 250), g = c.getContext('2d');
      g.fillStyle = '#04060c'; g.fillRect(0, 0, 420, 250); g.fillStyle = '#ff3a33'; g.font = `800 58px ${SANS}`; g.textAlign = 'center'; g.fillText('ПОРАЖЕНИЕ', 210, 120);
      g.fillStyle = '#9ca6c2'; g.font = `400 20px ${MONO}`; g.fillText('рейтинг: −25', 210, 164); g.fillText('новая игра через 00:12', 210, 194);
      const screen = new T.Mesh(new T.PlaneGeometry(1.2, .72), basic(c, { release: true })); screen.position.set(7.6, 1.26, -18.86); r.group.add(screen);
      const bezel = new T.Mesh(new T.BoxGeometry(1.28, .8, .05), flat('#0b0c10')); bezel.position.set(7.6, 1.26, -18.89); r.group.add(bezel);
      const tower = new T.Mesh(new T.BoxGeometry(.24, .5, .5), lam('#14151c')); tower.position.set(8.8, 1.04, -18.65); r.group.add(tower);
      const rgb = new T.Mesh(new T.PlaneGeometry(.02, .42), flat('#ff2e8c')); rgb.position.set(8.675, 1.04, -18.4); rgb.rotation.y = -Math.PI / 2; r.group.add(rgb); r.rgb = rgb;
      const chair = new T.Mesh(new T.BoxGeometry(.56, .1, .56), lam('#1e1f2a')); chair.position.set(7.6, .5, -17.6); r.group.add(chair);
      const chairB = new T.Mesh(new T.BoxGeometry(.56, .86, .08), lam('#1e1f2a')); chairB.position.set(7.6, 1, -17.32); r.group.add(chairB);
      const stem = new T.Mesh(new T.CylinderGeometry(.03, .03, .46, 8), lam('#222')); stem.position.set(7.6, .24, -17.6); r.group.add(stem);
      thing(r, { id: 'pc', label: 'Компьютер', mesh: screen, spot: { x: 7.6, z: -16.6 }, at: new T.Vector3(7.6, 1.9, -18.8) });
      thing(r, { id: 'son', label: 'Сын', mesh: hit(r, 2, .9, 3.4, 3.6, .55, -16.9), spot: { x: 5.5, z: -16.8 }, at: new T.Vector3(3.8, 1.25, -16.9) });
      thing(r, { id: 'closet', label: 'Шкаф', mesh: hit(r, .2, 2.1, 1.7, 10.4, 1.05, -16.2), spot: { x: 9.6, z: -16.2 }, at: new T.Vector3(10.2, 2.3, -16.2), pass: true });
    },
    f(r) {
      // Ряд автоматов вдоль восточной стены через каждые два метра.
      r.dancer = memeDancer(r);
      renderProps(r);
      // Инсталляция с сыном собрана под старый зал: сдвигаем её целиком в северо-восточный угол.
      r.meme = shifted(r, 8.5, -14.5, memeScene);
      r.arcade = [snakeCabinet(r, -12.4), virusCabinet(r, -14.4), fireCabinet(r, -18.4), loadCabinet(r, -20.4)];
      pinballTable(r, -16.4);
      if (!EXTRAS) return;
      const auto = new T.Group(), body = new T.Mesh(new T.BoxGeometry(1.1, 2, .9), lam('#b5341f')); body.position.y = 1; auto.add(body);
      const c = cv(300, 240); Art.memeInto(c, Art.MEMES[0]);
      r.autoTex = tex(c);
      const scr = new T.Mesh(new T.PlaneGeometry(.78, .62), new T.MeshBasicMaterial({ map: r.autoTex })); scr.rotation.y = -Math.PI / 2; scr.position.set(-.56, 1.34, 0); auto.add(scr);
      const lab = new T.Mesh(new T.PlaneGeometry(.8, .24), basic(textPanel(320, 96, (g, w, h) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, h); g.fillStyle = '#131313'; g.font = `800 34px ${SANS}`; g.textAlign = 'center'; g.fillText('МЕМ-АВТОМАТ', w / 2, 60); }), { release: true })); lab.rotation.y = -Math.PI / 2; lab.position.set(-.56, 1.86, 0); auto.add(lab);
      auto.position.set(26.45, 0, -10.7); r.group.add(auto); r.auto = c;
      thing(r, { id: 'memes', label: 'Мем-автомат', mesh: hit(r, 1.1, 2, 1.1, 26.45, 1, -10.7), spot: { x: 24.9, z: -10.7 }, at: new T.Vector3(26, 2.2, -10.7) });
    },
    w(r) { ledStrips(r); },
    g(r) {
      const stone = lam('#55585f'), stoneD = lam('#3e4148');
      World.GRAVES.forEach(gr => {
        const k = gr.secret ? .55 : 1, g = new T.Group();
        const top = new T.Mesh(new T.CylinderGeometry(.42 * k, .42 * k, .15, 24), stone); top.rotation.x = Math.PI / 2; top.position.y = .9 * k; g.add(top);
        const body = new T.Mesh(new T.BoxGeometry(.84 * k, .9 * k, .15), stone); body.position.y = .45 * k; g.add(body);
        const base = new T.Mesh(new T.BoxGeometry(1.1 * k, .1, .4), stoneD); base.position.y = .05; g.add(base);
        const label = new T.Mesh(new T.PlaneGeometry(.72 * k, .54 * k), basic(textPanel(288, 216, (q, w, h) => {
          q.fillStyle = '#55585f'; q.fillRect(0, 0, w, h); q.fillStyle = '#e4e5ec'; q.textAlign = 'center'; q.font = `700 ${gr.name.length > 12 ? 30 : 40}px ${SANS}`; q.fillText(gr.name, w / 2, 96); q.font = `400 26px ${MONO}`; q.fillStyle = '#bfc1cc'; q.fillText(gr.years, w / 2, 146);
        }), { release: true })); label.position.set(0, .58 * k, .08); g.add(label);
        g.position.set(gr.x, 0, gr.z); g.rotation.y = gr.ry || 0; r.group.add(g);
        gr.mesh = g;
        thing(r, { id: 'g_' + gr.id, label: gr.secret ? 'Маленькая могила' : gr.name, mesh: hit(r, 1.2, 1.4, .9, gr.x, .7, gr.z), spot: { x: gr.x + Math.sin(gr.ry || 0) * 1.5, z: gr.z + Math.cos(gr.ry || 0) * 1.5 }, at: new T.Vector3(gr.x, 1.45, gr.z), tomb: gr });
      });
      const kiosk = new T.Group();
      const kb = new T.Mesh(new T.BoxGeometry(1.1, 2.2, 1), lam('#10251c')); kb.position.y = 1.1; kiosk.add(kb);
      const kc = cv(240, 180), kg = kc.getContext('2d'); kg.fillStyle = '#04150a'; kg.fillRect(0, 0, 240, 180); kg.fillStyle = '#55ff8c'; kg.font = `500 26px ${MONO}`; kg.fillText('СЛОВО _', 24, 76); kg.font = `400 18px ${MONO}`; kg.fillText('нажми, чтобы', 24, 116); kg.fillText('посадить', 24, 142);
      const ks = new T.Mesh(new T.PlaneGeometry(.8, .6), basic(kc, { release: true })); ks.rotation.y = -Math.PI / 2; ks.position.set(-.56, 1.45, 0); kiosk.add(ks);
      kiosk.position.set(-3.6, 0, 3.7); r.group.add(kiosk);
      thing(r, { id: 'kiosk', label: 'Посадить слово', mesh: hit(r, 1.2, 2.2, 1.1, -3.6, 1.1, 3.7), spot: { x: -5.1, z: 3.7 }, at: new T.Vector3(-3.8, 2.4, 3.7) });
      const mc = cv(64, 64); r.moon = { c: mc, tex: tex(mc, { nearest: true }) };
      const moon = new T.Sprite(new T.SpriteMaterial({ map: r.moon.tex, transparent: true, depthWrite: false })); moon.scale.set(2.2, 2.2, 1); moon.position.set(-12, 6.6, -6); r.group.add(moon);
    },
    i(r) {
      const n = 24, c = cv(n, n); r.led = { c, g: c.getContext('2d'), tex: tex(c, { nearest: true }), n };
      r.floor.material.uniforms.tBase.value.dispose(); r.floor.material.uniforms.tBase.value = r.led.tex;
      const booth = new T.Mesh(new T.BoxGeometry(2, 1.15, 5.2), lam('#14101c')); booth.position.set(41.4, .575, 13.5); r.group.add(booth);
      const sc = cv(360, 200); r.scr = { c: sc, g: sc.getContext('2d'), tex: tex(sc) };
      const screen = new T.Mesh(new T.PlaneGeometry(7.4, 3.2), new T.MeshBasicMaterial({ map: r.scr.tex })); screen.position.set(42.45, 2.75, 13.5); screen.rotation.y = -Math.PI / 2; r.group.add(screen);
      const ham = new T.Group(), fur = lam('#c8995c');
      const hb = new T.Mesh(new T.SphereGeometry(.34, 14, 10), fur); hb.scale.y = .9; ham.add(hb);
      const hh = new T.Mesh(new T.SphereGeometry(.24, 14, 10), fur); hh.position.set(-.1, .36, 0); ham.add(hh);
      [-.14, .14].forEach(z => { const e = new T.Mesh(new T.SphereGeometry(.07, 8, 6), lam('#a87a42')); e.position.set(-.05, .56, z); ham.add(e); const ey = new T.Mesh(new T.SphereGeometry(.03, 6, 4), flat('#0d0d0f')); ey.position.set(-.3, .42, z * .6); ham.add(ey); });
      const hp = new T.Mesh(new T.TorusGeometry(.25, .025, 6, 16, Math.PI), lam('#27d7dc')); hp.position.set(-.1, .4, 0); hp.rotation.y = Math.PI / 2; ham.add(hp);
      ham.position.set(41.1, 1.5, 13.5); r.group.add(ham); r.hamster = ham;
      thing(r, { id: 'dj', label: 'DJ Хомяк', mesh: hit(r, 1.1, 1.3, 1.2, 41.1, 1.7, 13.5), spot: { x: 39.2, z: 13.5 }, at: new T.Vector3(41, 2.4, 13.5) });
      const ball = new T.Mesh(new T.IcosahedronGeometry(.42, 1), new T.MeshLambertMaterial({ color: '#d8dcf2', flatShading: true })); ball.position.set(36.5, 3.5, 13.5); r.group.add(ball); r.ball = ball;
      const rod = new T.Mesh(new T.CylinderGeometry(.01, .01, 1, 4), flat('#555')); rod.position.set(36.5, 4.2, 13.5); r.group.add(rod);
      r.beams = ['#ff2e8c', '#2fd6ff', '#ffd23f', '#7a4dff'].map(col => {
        const b = new T.Mesh(new T.ConeGeometry(.9, 3.6, 12, 1, true), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: .1, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
        const p = new T.Group(); b.position.y = -1.8; p.add(b); p.position.copy(ball.position); r.group.add(p); return p;
      });
    }
  };

  // Следы прежних посетителей, чтобы стены не были пустыми с первой минуты.
  const STAMPS = {
    a: [['S', 'тут был санёк', 5.8, .68, '#e8352e']],
    j: EXTRAS ? [['E', 'noclip →', 3.9, 1.2, '#e9c97b']] : [],
    b: [['N', 'выхода нет', 11.2, .6, '#5b2a14'], ['S', 'ты уже тут был', 4, .55, '#5b2a14'], ['S', 'не туда', 11.3, 2.2, '#2f5bff']],
    c: [['S', 'спать пора', 9.6, .7, '#7f8fff']],
    d: [['E', 'мам я дома', 1.4, .8, '#2b241a']],
    f: [['W', 'смешно', 2, .8, '#2c2a1c']]
  };
  const HEARTS = { a: [['N', 3.9, 1.3, '#e8352e']], c: [['N', 9.6, .9, '#ff5ea8']], f: [['S', 3.6, .6, '#d9352c']] };
  function stampRoom(r) {
    const done = r.walls;
    for (const [key, str, u, v, color] of STAMPS[r.id] || []) {
      const wall = done[key]; if (wall.stamped === str) continue;
      const c = cv(str.length * 8 + 4, 12), x = c.getContext('2d', { willReadFrequently: true });
      x.font = '10px "Pixelify Sans"'; x.fillStyle = '#000'; x.fillText(str, 0, 9);
      const d = x.getImageData(0, 0, c.width, c.height).data, px = Math.round(u / CELL), py = wall.paint.height - Math.round(v / CELL);
      wall.pg.fillStyle = color;
      for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 96) wall.pg.fillRect(px + i, py + j, 1, 1);
      wall.touch();
    }
    for (const [key, u, v, color] of HEARTS[r.id] || []) {
      const wall = done[key], px = Math.round(u / CELL), py = wall.paint.height - Math.round(v / CELL);
      wall.pg.fillStyle = color;
      ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'].forEach((s, j) => [...s].forEach((q, i) => { if (q === '#') wall.pg.fillRect(px + i, py + j, 1, 1); }));
      wall.touch();
    }
    restorePaint(r);
  }

  const STORE = 'netizen.museum.walls.v2';
  function restorePaint(r) {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return; }
    for (const w of Object.values(r.walls)) if (saved[w.id]) {
      const im = new Image();
      im.onload = () => { if (!w.pg) return; w.pg.clearRect(0, 0, w.paint.width, w.paint.height); w.pg.drawImage(im, 0, 0); w.touch(); };
      im.src = saved[w.id];
    }
  }
  function savePaint(wall) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
      saved[wall.id] = wall.paint.toDataURL('image/png');
      localStorage.setItem(STORE, JSON.stringify(saved));
    } catch (e) { /* режим без хранилища */ }
  }

  ROOMS.forEach(r => { r.style = { a: 'atrium', j: 'travertine', b: 'back', c: 'night', d: 'flat', e: 'bedroom', f: 'render', g: 'outdoor', i: 'club', w: 'white', n: 'hub', s: 'stone', p: 'enfil', m: 'neon', v: 'back' }[r.id]; });
  const glowC = cv(64, 64), glowG = glowC.getContext('2d'), gl = glowG.createRadialGradient(32, 32, 0, 32, 32, 32);
  gl.addColorStop(0, 'rgba(255,255,255,1)'); gl.addColorStop(.4, 'rgba(255,255,255,.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  glowG.fillStyle = gl; glowG.fillRect(0, 0, 64, 64);

  Halls2.init({
    T, scene, R, ROOMS, PASS, LOW, Q, UP, cv, rng, SANS, MONO, tex, basic, flat, lam, gradient, pool, edges, grain, textPanel, thing, hit, glowAt,
    doorPts, skylight, shifted, FloorMat, cabinets: { snake: snakeCabinet, virus: virusCabinet, fire: fireCabinet, load: loadCabinet, pinball: pinballTable }
  });

  window.World = {
    START: R[HALLS[0]] || ROOMS[0], want, shown,
    EXTRAS, T, scene, ROOMS, R, PASS, gates, hooks, focus, pump, flush() { pump(9999); }, buildPasses, closeHall, reflTarget, reflMatrix, savePaint, CELL, queue, freeRoom, floorY,
    tex, textPanel, flat, lam, glowTex: new T.CanvasTexture(glowC),
    GRAVES: [
      { id: 'flash', x: -6, z: -7.2, name: 'Adobe Flash', years: '1996–2020', e: 'Для продолжения нажмите «Разрешить».' },
      { id: 'icq', x: -8.6, z: -5, name: 'ICQ', years: '1996–2024', e: 'О-оу.' },
      { id: 'geo', x: -11, z: -7.3, name: 'GeoCities', years: '1994–2009', e: 'Страница находится в разработке.' },
      { id: 'vine', x: -13.2, z: -5.2, name: 'Vine', years: '2013–2017', e: 'Жил ярко. По шесть секунд за раз.' },
      { id: 'msn', x: -6.2, z: -3.2, name: 'MSN Messenger', years: '1999–2014', e: 'Статус: не в сети.' },
      { id: 'reader', x: -11, z: -3, name: 'Google Reader', years: '2005–2013', e: 'Непрочитанных: 1000+.' },
      { id: 'ie', x: -15.5, z: -7.4, name: 'Internet Explorer', years: '1995–2022', e: 'Лучший браузер для скачивания другого браузера.' },
      { id: 'plus', x: -15.4, z: -3.6, name: 'Google+', years: '2011–2019', e: 'Кто-то же там был.' },
      { id: 'pass', x: -16.6, z: 7.9, ry: .7, name: 'Твой первый пароль', years: 'дата неизвестна', e: 'qwerty123. Покойся с миром.', secret: true }
    ]
  };
})();

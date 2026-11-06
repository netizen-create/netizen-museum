// Сохранения, новости дня, находки, звук и голос. Вся музыка синтезируется в браузере.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hashStr(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const LOW = /Android|iPhone|iPad|Mobile/.test(navigator.userAgent) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
window.LOW = !!LOW;

const NOW_D = new Date();
const DAY_N = Math.floor((NOW_D.getTime() - NOW_D.getTimezoneOffset() * 6e4) / 864e5);
const DAYS = [
  { k: 'rain', news: 'Снаружи кислотный дождь. Зонты выдаём только подписчикам.' },
  { k: 'snow', news: 'Сегодня идёт снег из битых пикселей. Не ешь.' },
  { k: 'cat', news: 'Кот объявил себя куратором и сел на кассу. Спорить бесполезно.' },
  { k: 'fast', news: 'На Танцполе день быстрого хауса. Хомяк выпил третий эспрессо.' },
  { k: 'storm', news: 'Гроза над дата-центром. Люстра мигает, но это концепция.' },
  { k: 'rain', news: 'Нижний уровень сегодня особенно жёлтый. Туда ведёт вентиляция, я ничего не говорил.' },
  { k: 'snow', news: 'В Саду слов заморозки. Слова растут медленнее, зато искреннее.' }
];
const TODAY = DAYS[((DAY_N % 7) + 7) % 7];

const Save = (() => {
  const base = { visits: 0, lastVisit: 0, finds: {}, seen: {}, rooms: { a: 1 }, words: [], candles: {}, likes: {}, muted: false, banana: -1 };
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('netizen.museum.v2')); } catch (e) { stored = null; }
  return Object.assign(base, stored || {});
})();
function persist() { try { localStorage.setItem('netizen.museum.v2', JSON.stringify(Save)); } catch (e) { /* режим без хранилища */ } }

const FINDS = {
  son: { t: 'Не выигрывает', h: 'За дверью в конце коридора', i: ':(' },
  cat: { t: 'Кото-одобрение', h: 'Кто-то пушистый у кассы', i: '=^.^=' },
  vent: { t: 'Лаз', h: 'Один винт в Большом зале', i: '▤' },
  admin: { t: 'Рут-доступ', h: 'Пятый уровень ниже плинтуса', i: '#' },
  square: { t: 'Дождался', h: 'Загрузка не вечна', i: '■' },
  banana: { t: 'Лот съеден', h: 'Искусство бывает вкусным', i: '◖' },
  grave: { t: 'qwerty123', h: 'Самый дальний тёмный угол', i: '†' },
  dance: { t: 'Восемь тактов', h: 'Стой на полу и не сопротивляйся', i: '♫' },
  wall: { t: 'Вандал года', h: 'Несколько штрихов на стене', i: '▚' },
  word: { t: 'Садовник', h: 'Одно слово в земле', i: '❀' }
};

const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const seeded = s => () => {
  s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const TRACKS = {
  gallery: { bpm: 72, root: 53, scale: [0, 2, 4, 7, 9, 11], prog: [0, 5, -3, 2], seed: 23, bass: 'x.......x.....x.', arp: .24, wave: 'triangle', bell: .2, pad: .035, vol: .62 },
  night: { bpm: 84, root: 45, scale: [0, 3, 5, 7, 10], prog: [0, -4, -2, -7], seed: 11, kick: 'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.', bass: 'x..x....x..x..x.', arp: .42, wave: 'sawtooth', pad: .05, bed: 'rain', vol: .62 },
  back: { bpm: 60, root: 36, scale: [0, 1, 6, 7], prog: [0], seed: 97, arp: .03, wave: 'sine', bed: 'hum', vol: .7 },
  sad: { bpm: 68, root: 45, scale: [0, 3, 5, 7, 8, 10], prog: [0, 5, 3, -2], seed: 58, kick: 'x.......x.......', snare: '....x.......x...', bass: 'x.......x.......', arp: .3, wave: 'triangle', pad: .05, vol: .95 },
  meme: { bpm: 88, root: 40, scale: [0, 3, 5, 6, 7, 10], prog: [0, 0, -2, 3], seed: 71, kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.xxx.', bass: 'x.....x.x.....x.', arp: .14, wave: 'square', vol: .7 },
  garden: { bpm: 64, root: 50, scale: [0, 2, 4, 7, 9], prog: [0, 4, -3, 2], seed: 83, bass: 'x...............', arp: .3, wave: 'sine', bell: .22, pad: .04, bed: 'wind', vol: .8 },
  dance: { bpm: 124, root: 41, scale: [0, 3, 5, 7, 10], prog: [0, 0, 3, -2], seed: 47, kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', bass: '..x.x.x...x.x.x.', arp: .5, wave: 'square', vol: 1 },
  dance2: { bpm: 132, root: 43, scale: [0, 2, 3, 7, 8], prog: [0, -4, 3, -2], seed: 53, kick: 'x...x...x...x..x', snare: '....x.......x.x.', hat: 'xxx.xxx.xxx.xxx.', bass: 'x.xx.x.xx.xx.x.x', arp: .6, wave: 'sawtooth', vol: 1 },
  dance3: { bpm: 100, root: 46, scale: [0, 2, 4, 7, 9], prog: [0, 5, 2, 7], seed: 61, kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', bass: 'x..x..x.x..x..x.', arp: .36, wave: 'square', vol: 1 }
};

function makeArp(tr) {
  const r = seeded(tr.seed), out = [], sc = tr.scale;
  let d = 2;
  for (let i = 0; i < 32; i++) {
    if (r() < tr.arp) {
      d = clamp(d + Math.floor(r() * 5) - 2, 0, sc.length * 2 - 1);
      out.push(sc[d % sc.length] + 12 * Math.floor(d / sc.length));
    } else out.push(null);
  }
  return out;
}

const Snd = {
  ctx: null, id: 'gallery', tr: TRACKS.gallery, arps: makeArp(TRACKS.gallery), step: 0, next: 0, t0: 0, perf0: performance.now(), bedNode: null, level: 1,
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC(), comp = c.createDynamicsCompressor();
    comp.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = Save.muted ? 0 : .85; this.master.connect(comp);
    this.muffle = c.createBiquadFilter(); this.muffle.type = 'lowpass'; this.muffle.frequency.value = 18000; this.muffle.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = .55; this.music.connect(this.muffle);
    this.fx = c.createGain(); this.fx.gain.value = .75; this.fx.connect(this.master);
    const d = c.createDelay(1); d.delayTime.value = .33;
    const fb = c.createGain(); fb.gain.value = .35;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.music);
    this.echo = d;
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    this.noise = buf;
    setInterval(() => this.tick(), 50);
    const id = this.id; this.id = null; this.play(id);
    document.addEventListener('visibilitychange', () => { if (document.hidden) c.suspend(); else c.resume(); });
  },
  setMuted(m) { Save.muted = m; persist(); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : .85, this.ctx.currentTime, .05); },
  // Глухая музыка в наушниках сына: фильтр и громкость зависят от расстояния.
  setLevel(level, cutoff) {
    this.level = level;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(.55 * (this.tr.vol || 1) * level, t, .25);
    this.muffle.frequency.setTargetAtTime(cutoff, t, .25);
  },
  play(id) {
    if (this.id === id) return;
    this.id = id;
    const tr = TRACKS[id] || TRACKS.gallery, fast = TODAY.k === 'fast' && id.startsWith('dance') ? 8 : 0;
    this.tr = Object.assign({}, tr, { bpm: tr.bpm + fast });
    this.arps = makeArp(this.tr);
    this.perf0 = performance.now();
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    this.step = 0; this.next = now + .2; this.t0 = this.next;
    this.setLevel(this.level, this.muffle.frequency.value);
    this.setBed(tr.bed);
  },
  setBed(kind) {
    const c = this.ctx;
    if (this.bedNode) { const old = this.bedNode; old.gain.gain.setTargetAtTime(0, c.currentTime, .15); setTimeout(() => old.stop(), 700); this.bedNode = null; }
    if (!kind) return;
    const g = c.createGain(); g.gain.value = 0; g.connect(this.music);
    const nodes = [];
    if (kind === 'hum') {
      [60, 120.6, 241].forEach((f, i) => {
        const o = c.createOscillator(); o.type = i ? 'sawtooth' : 'sine'; o.frequency.value = f;
        const v = c.createGain(); v.gain.value = [.5, .08, .03][i];
        o.connect(v); v.connect(g); o.start(); nodes.push(o);
      });
    } else {
      const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = kind === 'rain' ? 'highpass' : 'bandpass';
      f.frequency.value = kind === 'rain' ? 1800 : 420; f.Q.value = .7;
      src.connect(f); f.connect(g); src.start(); nodes.push(src);
    }
    g.gain.setTargetAtTime(kind === 'hum' ? .16 : .05, c.currentTime + .2, .4);
    this.bedNode = { gain: g, stop: () => { nodes.forEach(n => { try { n.stop(); } catch (e) { /* уже стоит */ } }); g.disconnect(); } };
  },
  beat() {
    if (this.ctx && this.ctx.state === 'running' && this.next) return Math.max(0, this.ctx.currentTime - this.t0) * this.tr.bpm / 60;
    return (performance.now() - this.perf0) / 1000 * this.tr.bpm / 60;
  },
  tick() {
    const c = this.ctx;
    if (!c || c.state !== 'running' || !this.next) return;
    const dt = 60 / this.tr.bpm / 4;
    if (this.next < c.currentTime) this.next = c.currentTime + .05;
    while (this.next < c.currentTime + .2) { this.fire(this.step, this.next, dt); this.next += dt; this.step++; }
  },
  fire(s, t, dt) {
    const tr = this.tr, i = s % 16, bar = Math.floor(s / 16) % tr.prog.length, r = tr.root + tr.prog[bar];
    if (tr.kick && tr.kick[i] === 'x') this.kick(t);
    if (tr.snare && tr.snare[i] === 'x') this.burst(t, 'bandpass', 1900, .16, .2);
    if (tr.hat && tr.hat[i] === 'x') this.burst(t, 'highpass', 7000, .035, .1);
    if (tr.bass && tr.bass[i] === 'x') this.tone(midi(r), t, dt * 2.2, tr.bpm > 100 ? 'square' : 'triangle', .2, 700, this.music);
    const a = this.arps[s % this.arps.length];
    if (a != null) {
      const v = tr.wave === 'sine' ? .13 : tr.wave === 'triangle' ? .1 : .045;
      this.tone(midi(r + 24 + a), t, dt * 2.4, tr.wave, v, 2600, this.echo);
      this.tone(midi(r + 24 + a), t, dt * 1.6, tr.wave, v * .8, 2600, this.music);
    }
    if (tr.bell && i % 8 === 0 && hashStr('b' + s + tr.seed) % 100 < tr.bell * 200) {
      const d = tr.scale[hashStr('n' + s) % tr.scale.length];
      this.tone(midi(r + 36 + d), t, 2.2, 'sine', .07, 0, this.echo);
    }
    if (tr.pad && s % 16 === 0) [0, tr.scale[1], tr.scale[3] || 7].forEach((d, k) => this.tone(midi(r + 12 + d), t, dt * 18, 'sawtooth', tr.pad * (k ? .7 : 1), 620, this.music));
  },
  tone(f, t, dur, type, vol, cut, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(.012, dur * .2));
    g.gain.exponentialRampToValueAtTime(.0004, t + dur);
    if (cut) { const l = c.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = cut; o.connect(l); l.connect(g); } else o.connect(g);
    g.connect(dest); o.start(t); o.stop(t + dur + .03);
  },
  kick(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .11);
    g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
    o.connect(g); g.connect(this.music); o.start(t); o.stop(t + .24);
  },
  burst(t, type, freq, dur, vol, dest) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.music);
    s.start(t, Math.random() * 1.5, dur + .02);
  },
  sfx(name) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const t = c.currentTime, fx = this.fx;
    const seq = (notes, type, gap, vol) => notes.forEach((n, i) => this.tone(midi(n), t + i * gap, gap * 2.4, type, vol, 0, fx));
    if (name === 'tap') seq([76], 'square', .03, .05);
    else if (name === 'find') seq([72, 76, 79, 84, 88], 'square', .075, .07);
    else if (name === 'candle') seq([84, 91], 'sine', .1, .1);
    else if (name === 'spray') this.burst(t, 'highpass', 3200, .1, .1, fx);
    else if (name === 'plant') seq([60, 67, 72], 'triangle', .09, .12);
    else if (name === 'deny') seq([40, 39], 'square', .09, .08);
    else if (name === 'creak') {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(92, t);
      for (let i = 1; i < 12; i++) o.frequency.linearRampToValueAtTime(90 + (i % 3) * 34 + i * 7, t + i * .1);
      f.type = 'bandpass'; f.frequency.value = 780; f.Q.value = 6;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.2, t + .1); g.gain.linearRampToValueAtTime(.12, t + .8); g.gain.exponentialRampToValueAtTime(.001, t + 1.25);
      o.connect(f); f.connect(g); g.connect(fx); o.start(t); o.stop(t + 1.3);
    }
  },
  blip(pitch) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    this.tone(pitch + Math.random() * 40, c.currentTime, .035, 'square', .016, 0, this.fx);
  }
};

// Реплика отца. Если появится настоящий файл со звуком, достаточно вписать его путь в WIN_CLIP.
const WIN_CLIP = null;
const Voice = {
  ok: 'speechSynthesis' in window,
  unlock() {
    if (!this.ok || this.unlocked) return;
    this.unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) { this.ok = false; }
  },
  win() {
    if (Save.muted) return;
    if (WIN_CLIP) { new Audio(WIN_CLIP).play().catch(() => this.speak()); return; }
    this.speak();
  },
  speak() {
    if (this.ok) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance('Are you winning, son?');
        const list = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
        const male = list.find(v => /daniel|alex|fred|rishi|male|guy|david/i.test(v.name));
        if (male || list[0]) u.voice = male || list[0];
        u.lang = 'en-US'; u.pitch = .62; u.rate = .82; u.volume = 1;
        speechSynthesis.speak(u);
        return;
      } catch (e) { this.ok = false; }
    }
    this.mumble();
  },
  // Запасной вариант без голоса в системе: речевая интонация шестью слогами.
  mumble() {
    const c = Snd.ctx;
    if (!c) return;
    const now = c.currentTime;
    [[150, .2], [132, .16], [168, .24], [150, .16], [122, .3], [196, .42]].reduce((t, [f, d]) => {
      const o = c.createOscillator(), a = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f, now + t); o.frequency.linearRampToValueAtTime(f * .92, now + t + d);
      a.type = 'bandpass'; a.frequency.value = 640; a.Q.value = 2.4;
      g.gain.setValueAtTime(.0001, now + t); g.gain.linearRampToValueAtTime(.22, now + t + .03); g.gain.exponentialRampToValueAtTime(.002, now + t + d);
      o.connect(a); a.connect(g); g.connect(Snd.fx); o.start(now + t); o.stop(now + t + d + .02);
      return t + d + .03;
    }, 0);
  }
};

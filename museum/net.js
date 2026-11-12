// Связь с сервером: вход через Telegram, проверка подписки на канал и общие рекорды.
// Без сервера (пустой api в config.js) музей открыт всем, а рекорды живут только в браузере.
(function () {
  const C = window.NETIZEN_CONFIG || {}, ON = !!C.api, KEY = 'netizen.session', SWAP = 'netizen.swap';
  // Вход живёт на одном адресе: с www переходим на основной домен, иначе сессия и кнопка Telegram раздвоятся.
  if (ON && location.hostname.startsWith('www.')) location.replace(location.href.replace('//www.', '//'));
  let token = null, me = null, done = null;
  const boards = new Map();
  try { token = localStorage.getItem(KEY); } catch (e) { token = null; }
  const remember = t => { token = t; try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch (e) { /* без хранилища */ } };

  // Mini App передаёт подписанные данные в адресе. Скрипт Telegram подхватывает их и прячет в sessionStorage.
  const inTelegram = () => {
    if (/tgWebAppData=/.test(location.hash)) return true;
    try { return !!sessionStorage.getItem('__telegram__initParams'); } catch (e) { return false; }
  };
  const tg = () => window.Telegram && Telegram.WebApp;
  const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

  async function api(path, body, method) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = 'Bearer ' + token;
    const r = await fetch(C.api + path, { method: method || (body ? 'POST' : 'GET'), headers, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'http_' + r.status); e.status = r.status; throw e; }
    return data;
  }

  // Рекорды с сервера дополняют локальные: на новом устройстве лучший счёт не теряется.
  function mergeBest(best) {
    if (!best) return;
    Save.arcade = Save.arcade || {};
    for (const [game, v] of Object.entries(best)) {
      if (game === 'antivirus') { const k = 'antivirus_time'; if (!Save.arcade[k] || v < Save.arcade[k]) Save.arcade[k] = v; }
      else if (game.startsWith('backrooms')) { if (!Save.arcade[game] || v < Save.arcade[game]) Save.arcade[game] = v; }
      else if (v > (Save.arcade[game] || 0)) Save.arcade[game] = v;
    }
    persist();
  }

  // --- экран входа -------------------------------------------------------------------------------

  const $ = id => document.getElementById(id);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function view(title, text, actions, note) {
    $('gT').textContent = title; $('gD').textContent = text || '';
    $('gN').textContent = note || ''; $('gN').hidden = !note;
    const box = $('gAct'); box.textContent = ''; (actions || []).forEach(a => box.appendChild(a));
    $('gate').hidden = false;
  }
  const button = (label, fn, cls) => { const b = el('button', 'pill' + (cls ? ' ' + cls : ''), label); b.type = 'button'; b.onclick = fn; return b; };

  function openChannel() {
    if (tg() && tg().openTelegramLink) tg().openTelegramLink(C.channel);
    else window.open(C.channel, '_blank', 'noopener');
  }

  // После входа сразу пускаем в зал. Неподписанному через пару секунд после того, как зал показался,
  // поверх сцены выезжает просьба подписаться: зал виден сквозь неё, но гулять дальше нельзя.
  let nag = 0;
  function accept(p) {
    if (p.token) remember(p.token);
    me = p; mergeBest(p.best);
    // Скины с сервера (банан, золотой банан) дополняют те, что открыты в браузере.
    if (p.skins && p.skins.length) { Save.skins = [...new Set([...(Save.skins || []), ...p.skins])]; persist(); }
    clearTimeout(nag);
    hideGate();
    paintWho();
    const f = done; done = null; if (f) f();
    if (!p.subscribed) whenHallShown(() => { nag = setTimeout(() => subscribe(), 2500); });
  }
  const hideGate = () => { $('gate').hidden = true; $('gate').classList.remove('over'); };

  // Кнопка с именем в правом верхнем углу: видно, кем ты вошёл, оттуда выход и смена профиля.
  // В Mini App аккаунт задаёт сам Telegram, поэтому там кнопки нет.
  const nameOf = u => u.name || (u.username ? '@' + u.username : 'Профиль');
  function paintWho() {
    const b = $('who'), u = me && me.user;
    if (!b) return;
    b.hidden = !u || inTelegram();
    if (!u) return;
    b.textContent = nameOf(u);
    b.onclick = profile;
  }
  function profile() {
    const u = me && me.user;
    if (!u) return;
    $('gate').classList.add('over');
    view(nameOf(u), (u.username ? '@' + u.username + ' · ' : '') + 'вход через Telegram',
      [button('Предложить картину', () => { location.href = '/submit'; }), button('Сменить профиль', () => logout(true), 'alt'), button('Выйти', () => logout(false), 'alt'), button('Вернуться в зал', hideGate, 'alt')]);
  }
  // Сессия живёт только в этом браузере: забываем её и открываем музей заново на экране входа.
  function logout(swap) {
    remember(null);
    try { if (swap) sessionStorage.setItem(SWAP, '1'); } catch (e) { /* без хранилища */ }
    location.reload();
  }
  function whenHallShown(fn) {
    if (document.body.classList.contains('ready')) return fn();
    const t = setInterval(() => { if (document.body.classList.contains('ready')) { clearInterval(t); fn(); } }, 200);
  }

  function subscribe(note) {
    $('gate').classList.add('over');
    view('Подпишись на NETIZEN', 'Музей открыт для подписчиков канала. Подпишись, вернись сюда и нажми «Я подписался».',
      [button('Открыть канал', openChannel), button('Я подписался', recheck, 'alt')], note);
  }

  async function recheck() {
    try {
      const p = await api('/check', {});
      if (!p.subscribed) return subscribe('Пока не видим подписку. Если ты только что подписался, подожди пару секунд и нажми ещё раз.');
      accept(p);
    } catch (e) {
      if (e.status === 401) return login();
      subscribe(e.status === 429 ? 'Чуть медленнее: проверяем не чаще раза в три секунды.' : 'Сервер не ответил, попробуй ещё раз.');
    }
  }

  // В браузере вход через окно Telegram (OpenID Connect): там можно выбрать аккаунт.
  // Сайт должен быть в Allowed URLs бота: @BotFather → бот → Login Widget.
  let loginLib = null;
  function login() {
    remember(null);
    const actions = [];
    if (clientId) {
      loginLib = loginLib || load('https://oauth.telegram.org/js/telegram-login.js?6');
      const b = button('Войти через Telegram', () => {
        if (!window.Telegram || !Telegram.Login) return;
        Telegram.Login.auth({ client_id: Number(clientId), scope: ['profile'], lang: 'ru' }, data => {
          if (!data || data.error || !data.id_token) return login();
          view('Проверяем вход', '');
          api('/auth', { idToken: data.id_token, visit: true }).then(accept).catch(() => failed());
        });
      }, 'tg');
      b.disabled = true;
      loginLib.then(() => { b.disabled = false; }).catch(() => { b.textContent = 'Telegram не загрузился'; });
      actions.push(b);
    }
    if (C.dev) {
      const id = Number(new URLSearchParams(location.search).get('devid')) || 1001;
      actions.push(button('Войти как тест ' + id, () => api('/auth', { dev: { id, name: 'Тест ' + id, username: 'test' + id }, visit: true }).then(accept).catch(() => failed()), 'alt'));
    }
    // Окно Telegram само предлагает аккаунт из приложения. Другой профиль выбирается там же, через вход по номеру.
    let swap = false;
    try { swap = !!sessionStorage.getItem(SWAP); sessionStorage.removeItem(SWAP); } catch (e) { swap = false; }
    if (clientId) actions.push(el('p', 'gHint', swap
      ? 'Чтобы войти другим аккаунтом, в окне Telegram нажми «Или войдите по номеру телефона» и введи его номер. Или переключи аккаунт в приложении Telegram, а потом нажми «Продолжить с Telegram».'
      : 'Другой аккаунт: в окне Telegram выбери «Или войдите по номеру телефона».'));
    $('gate').classList.remove('over');
    view(swap ? 'Сменить профиль' : 'Вход через Telegram', swap ? 'Ты вышел. Войди нужным аккаунтом Telegram.' : 'Войди через Telegram, чтобы попасть в музей.', actions,
      clientId || C.dev ? '' : 'Бот ещё не подключён.');
  }

  function failed() {
    view('Сервер не отвечает', 'Проверь интернет и попробуй ещё раз.', [button('Повторить', start)]);
  }

  async function start() {
    view('Проверяем вход', '');
    try {
      const init = tg() && tg().initData;
      if (init) return accept(await api('/auth', { initData: init, visit: true }));
      if (token) return accept(await api('/me?visit=1'));
      login();
    } catch (e) {
      if (e.status === 401) return login();
      failed();
    }
  }

  let clientId = '';
  async function enter() {
    if (!ON) return;
    // Пути к песням хранятся в базе: админ может заменить песню без новой выкладки. Там же Client ID для входа.
    const settings = api('/config').then(c => {
      if (c.audio) Object.assign(NETIZEN_CONFIG.audio, c.audio);
      // Залы из админки: открыт ли, название, плашка «новое», музыка. Применяет app.js при запуске.
      if (c.halls) NETIZEN_CONFIG.halls = c.halls;
      if (c.music) NETIZEN_CONFIG.music = c.music;
      // Работы выставки, которая идёт сейчас. Пустые места остаются с работами из кода.
      NETIZEN_CONFIG.show = c.show || null;
      if (c.login) clientId = c.login.clientId;
    }).catch(() => null);
    await settings;
    // Предпросмотр выставки из админки: /?preview=<id>. Сервер отдаёт развеску только админу.
    const preview = Number(new URLSearchParams(location.search).get('preview'));
    if (preview && token) {
      const p = await api('/admin/exhibitions/' + preview + '/preview').catch(() => null);
      if (p) {
        NETIZEN_CONFIG.show = p;
        const tag = el('a', '', `Предпросмотр «${p.title}» · выйти`);
        tag.href = '/'; tag.style.cssText = 'position:fixed;z-index:60;left:50%;top:62px;max-width:calc(100vw - 32px);overflow:hidden;text-overflow:ellipsis;transform:translateX(-50%);padding:8px 14px;border-radius:100px;background:#47c55e;color:#0b0c0d;font:500 12px "JetBrains Mono",monospace;text-decoration:none;white-space:nowrap';
        document.body.appendChild(tag);
      }
    }
    if (inTelegram()) {
      await load('https://telegram.org/js/telegram-web-app.js').catch(() => null);
      if (tg()) { tg().ready(); tg().expand(); }
    }
    await new Promise(ok => { done = ok; start(); });
  }

  // --- рекорды -----------------------------------------------------------------------------------

  function score(game, value) {
    if (!ON || !token || !me || !me.subscribed || !(value > 0)) return;
    api('/scores', { game, value }).then(() => { const f = boards.get(game); if (f) f(); }).catch(() => null);
  }

  const fmt = (game, v) => (game === 'antivirus' ? `${v} с` : game.startsWith('backrooms') ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : String(v));

  // Таблица лидеров под автоматом. Обновляется после каждой твоей партии.
  function board(game) {
    if (!ON) return null;
    const box = el('section', 'lb'), list = el('ol'), mine = el('p', 'lbMe');
    box.append(el('h3', '', 'Лучшие игроки'), list, mine);
    const paint = async () => {
      try {
        const d = await api('/scores?game=' + encodeURIComponent(game));
        list.textContent = '';
        if (!d.top.length) list.appendChild(el('li', 'lbEmpty', 'Пока никто не играл. Будь первым.'));
        d.top.forEach(r => { const li = el('li', r.me ? 'me' : ''); li.append(el('span', 'lbN', r.place), el('span', 'lbW', r.name), el('b', '', fmt(game, r.value))); list.appendChild(li); });
        mine.textContent = d.me && d.me.place > 10 ? `Ты на ${d.me.place} месте: ${fmt(game, d.me.value)}` : '';
      } catch (e) { list.textContent = ''; list.appendChild(el('li', 'lbEmpty', 'Таблица не загрузилась.')); }
    };
    paint();
    boards.set(game, paint);
    return box;
  }

  window.Net = {
    on: ON, enter, score, board, api,
    user: () => (me && me.user) || null,
    token: () => (me ? token : null),
    forget: game => boards.delete(game)
  };
})();

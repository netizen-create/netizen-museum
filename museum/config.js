// Настройки сервера. Пустой api значит, что сервера нет: музей открыт всем, рекорды живут в браузере.
// Так работают артефакт и GitHub Pages. Сборка для Cloudflare (server/build.sh) дописывает сюда api, имя бота и адрес медиа.
window.NETIZEN_CONFIG = {
  api: '',
  bot: '',
  channel: 'https://t.me/itsnetizen',
  dev: false,
  // Откуда брать медиа: картинки автоматов, рисунки мема, песни и видео.
  // Без сервера это папка museum/media/ рядом со страницей, на Cloudflare это хранилище R2.
  media: 'museum/media/',
  // Песни сцен, пути внутри media. На Cloudflare сервер подменяет их значениями из базы,
  // поэтому песню можно заменить из админки без новой выкладки.
  audio: {
    meme: 'meme.mp3',     // «Are you winning, son?», звучит у сына
    dancer: 'dancer.mp3'  // танцор на подиуме в Рендере
  },
  // Залы и громкость из админки. Без сервера пусто: всё как задумано в world.js.
  halls: [],
  music: { volume: 100 },
  // Выставка недели: { title, works: [{ slot: 'a-03', title, author, link, description, image, thumb, width, height }] }.
  show: null
};

window.Media = {
  // Метка версии из сборки (stamp.mjs): файл поменялся, адрес тоже, и браузер не берёт старый из кэша.
  url: p => (/^(https?:)?\/\//.test(p) ? p : NETIZEN_CONFIG.media + p + ((NETIZEN_CONFIG.ver || {})[p] ? '?v=' + NETIZEN_CONFIG.ver[p] : '')),
  audio: name => Media.url(NETIZEN_CONFIG.audio[name])
};
NETIZEN_CONFIG.ver = {"backrooms/chaser.webp":"5fa40c99","banana/banana.webp":"dccc0426","banana/peel.webp":"1d7d72b0","banana/tape.webp":"8a70794e","dancer.mp3":"9a0bcac2","dancer.mp4":"98b8a77f","halls/m1.webp":"ea197edd","halls/m10.webp":"6ca62b90","halls/m10_s.webp":"cdb158fe","halls/m11.webp":"92058d21","halls/m11_s.webp":"797c91f5","halls/m1_s.webp":"66e50887","halls/m2.webp":"9d5c7cd3","halls/m2_s.webp":"2acd47df","halls/m3.webp":"76b3986b","halls/m3_s.webp":"bdfeb53a","halls/m4.webp":"d8e9516d","halls/m4_s.webp":"4f0d0cf2","halls/m5.webp":"a69ef768","halls/m5_s.webp":"e4f23594","halls/m6.webp":"b911e461","halls/m6_s.webp":"1400ef46","halls/m7.webp":"b4247891","halls/m7_s.webp":"1720e657","halls/m8.webp":"603b50d1","halls/m8_s.webp":"dcfd6177","halls/m9.webp":"3918bfdc","halls/m9_s.webp":"5eeb2d0f","halls/marble.webp":"ec996916","halls/n1.webp":"1c32ff59","halls/n1_s.webp":"92b9cbe5","halls/n2.webp":"706119f8","halls/n2_s.webp":"f87cee85","halls/n3.webp":"e04095c1","halls/n3_s.webp":"bd8da3e9","halls/n4.webp":"412d2507","halls/n4_s.webp":"dacc016a","halls/n5.webp":"12bed30f","halls/n5_s.webp":"15735abd","halls/n6.webp":"2717af43","halls/n6_s.webp":"350770c3","halls/n7.webp":"d91978cc","halls/n7_s.webp":"04f89e3b","halls/p1.webp":"4db21cc4","halls/p10.webp":"dbb948cc","halls/p10_s.webp":"9fc797cb","halls/p11.webp":"d9bf606b","halls/p11_s.webp":"693df3d8","halls/p1_s.webp":"d8ef3662","halls/p2.webp":"2768f863","halls/p2_s.webp":"4edb573f","halls/p3.webp":"ec4b21c7","halls/p3_s.webp":"22ce3540","halls/p4.webp":"6cbe912b","halls/p4_s.webp":"db23651b","halls/p5.webp":"bb64d65a","halls/p5_s.webp":"46f561bd","halls/p6.webp":"9430da3d","halls/p6_s.webp":"f0bd932d","halls/p7.webp":"2f720538","halls/p7_s.webp":"ffd5961c","halls/p8.webp":"a2ef5872","halls/p8_s.webp":"739288ef","halls/p9.webp":"8c254709","halls/p9_s.webp":"0aeae7da","halls/s1.webp":"97121339","halls/s1_s.webp":"044de75e","halls/s2.webp":"8dff379e","halls/s2_s.webp":"28f68fb0","halls/s3.webp":"7479a442","halls/s3_s.webp":"a98923a1","halls/s4.webp":"525fb494","halls/s4_s.webp":"270fb1b5","halls/s5.webp":"72ebb6b7","halls/s5_s.webp":"84ad96c5","hangar/rack.webp":"60142ecc","hangar/rack_s.webp":"a4d3ccd7","meme/kick.webp":"e6b23abf","meme/quiet.webp":"da728f55","meme/sad.webp":"4199d31f","meme/son.webp":"e7f33226","meme/talk.webp":"0674ad72","meme.mp3":"5a50e7e3","skins/av_head.webp":"9a063994","skins/av_mq.webp":"4090ef53","skins/av_side.webp":"b3b77a51","skins/fw_head.webp":"84933ace","skins/fw_mq.webp":"ffdecb71","skins/fw_side.webp":"f49b655f","skins/ld_head.webp":"920117c8","skins/ld_mq.webp":"235c0773","skins/ld_side.webp":"35107eab","skins/pin_field.webp":"ab37da1c","skins/pin_glass.webp":"c70fdc74","skins/pin_head.webp":"698ea282","skins/snake_head.webp":"10b0ab43","skins/snake_marquee.webp":"7da8f251","skins/snake_side.webp":"2fa0fbb9"};

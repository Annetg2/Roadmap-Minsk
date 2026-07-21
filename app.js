/* ======================================================================
   Карты: MapLibre GL JS + векторный стиль CARTO Dark Matter
   (бесплатно, без API-ключей). Библиотека подключена в index.html с CDN;
   без интернета вместо карт показывается заглушка, точки при этом доступны
   списком-чипами.
   Важно: состояние хранит координаты как {lat, lng}, а MapLibre везде ждёт
   [lng, lat] и возвращает {lng, lat} — конвертация только на границе вызовов.
   ====================================================================== */
/* спутниковые снимки Esri World Imagery + слой подписей (бесплатно, без ключа) */
const MAP_STYLE = {
  version: 8,
  sources: {
    sat: {
      type:'raster', tileSize:256, maxzoom:19,
      tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution:'Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics'
    },
    labels: {
      type:'raster', tileSize:256, maxzoom:19,
      tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}']
    }
  },
  layers: [
    {id:'sat', type:'raster', source:'sat'},
    {id:'labels', type:'raster', source:'labels'}
  ]
};

const LS_KEY = 'travel-roadmap-v2';

/* ---------- демо-состояние (Минск) ---------- */
function demoState(){
  return {
    hero:{
      eyebrow1:'МАРШРУТ',
      eyebrow2:'МИНСК',
      title:'Road Map поездки',
      dates:'31 июля — 3 августа 2026',
      subtitle:'Четыре дня в Минске: старый город, советский модернизм и кофейни Октябрьской. Нажмите «Править» — и соберите свой маршрут.'
    },
    days:[
      {title:'День 1 · Прибытие', stops:[
        {time:'10:40', name:'Вокзал Минск-Пассажирский', note:'Прибытие поезда, обмен валюты в здании вокзала', photo:'', geo:'53.8905, 27.5510'},
        {time:'12:30', name:'Заселение', note:'Апартаменты у Немиги, ранний заезд по договорённости', photo:'', geo:''},
        {time:'14:30', name:'Верхний город', note:'Ратуша, костёл святого Иосифа, смотровая на Свислочь', photo:'', geo:'53.9045, 27.5561'},
        {time:'19:00', name:'Ужин на Зыбицкой', note:'Улица баров и ресторанов у реки', photo:'', geo:'53.9053, 27.5619'}
      ]},
      {title:'День 2 · Классический Минск', stops:[
        {time:'10:00', name:'Троицкое предместье', note:'Старинный квартал на берегу Свислочи', photo:'', geo:'53.9086, 27.5573'},
        {time:'12:30', name:'Проспект Независимости', note:'Сталинский ампир от площади Независимости до ГУМа', photo:'', geo:''},
        {time:'15:00', name:'Площадь Победы', note:'Монумент и вечный огонь', photo:'', geo:'53.9084, 27.5750'},
        {time:'18:30', name:'Кино', note:'Сеанс в «Москве» или Silver Screen', photo:'', geo:''}
      ]},
      {title:'День 3 · Современный город', stops:[
        {time:'11:00', name:'Национальная библиотека', note:'Смотровая площадка на 23 этаже', photo:'', geo:'53.9316, 27.6462'},
        {time:'14:00', name:'Ботанический сад', note:'Один из крупнейших в Европе', photo:'', geo:'53.9160, 27.6110'},
        {time:'17:00', name:'Улица Октябрьская', note:'Стрит-арт, кофейни, галерея «Ў»', photo:'', geo:'53.8880, 27.5710'}
      ]},
      {title:'День 4 · Отъезд', stops:[
        {time:'10:00', name:'Комаровский рынок', note:'Сувениры и местные продукты', photo:'', geo:'53.9210, 27.5780'},
        {time:'13:00', name:'Обед в центре', note:'Драники на дорожку', photo:'', geo:''},
        {time:'16:20', name:'Поезд домой', note:'Вокзал, посадка за 30 минут', photo:'', geo:''}
      ]}
    ],
    activeDay:0,
    eat:[
      {name:'Лидо', tag:'самообслуживание · недорого', url:'', photo:'', geo:'', note:'Драники и национальная кухня'},
      {name:'Зыбицкая', tag:'бары и рестораны · вечером', url:'', photo:'', geo:'', note:''}
    ],
    map:{lat:53.9060, lng:27.5615, zoom:12},
    categories:[
      {name:'жильё',   color:'#8fb8d8'},
      {name:'дорога',  color:'#e9a53f'},
      {name:'досуг',   color:'#c792ea'},
      {name:'еда',     color:'#a3be8c'},
      {name:'покупки', color:'#e08fb0'}
    ],
    budget:[
      {name:'Жильё, 3 ночи', cats:['жильё'], amount:360, currency:'BYN'},
      {name:'Поезд туда-обратно', cats:['дорога'], amount:5500, currency:'RUB'},
      {name:'Билеты в кино', cats:['досуг'], amount:40, currency:'BYN'},
      {name:'Еда и кафе', cats:['еда'], amount:250, currency:'BYN'},
      {name:'Сувениры', cats:['покупки'], amount:2000, currency:'RUB'}
    ],
    rate:29.5,
    bg:''
  };
}

/* миграции старых сохранений/экспортов к текущему формату */
function migrateState(s){
  if(s.map && Array.isArray(s.map.center)){ // старый формат карты (Яндекс)
    s.map = {lng:s.map.center[0], lat:s.map.center[1], zoom:s.map.zoom || 12};
  }
  if(!Array.isArray(s.categories)) s.categories = demoState().categories;
  (s.budget || []).forEach(r => {
    if(!Array.isArray(r.cats)) r.cats = r.cat ? [String(r.cat)] : [];
  });
  if(typeof s.activeDay !== 'number' || s.activeDay < 0) s.activeDay = 0;
  if(!Array.isArray(s.eat)) s.eat = []; // старые сохранения — без списка «Покушац»
  return s;
}

/* ---------- состояние ---------- */
function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if(s && Array.isArray(s.days) && Array.isArray(s.budget)){
      return Object.assign(demoState(), migrateState(s));
    }
  }catch(e){ /* повреждённый localStorage — падаем на демо */ }
  return null;
}
let state = loadState() || demoState();
let editing = false;
let map = null;
let markers = [];
let miniMaps = [];
let eatMaps = [];
let pendingPhotoStop = null;
const expandedStops = new WeakSet(); // раскрытые карточки событий (в рамках сессии)
const expandedEats = new WeakSet();  // раскрытые места «Покушац»

let saveTimer = null;
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => localStorage.setItem(LS_KEY, JSON.stringify(state)), 300);
}

/* ---------- утилиты ---------- */
const $ = sel => document.querySelector(sel);

function el(tag, cls, text){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text != null) n.textContent = text; // только textContent — защита от XSS
  return n;
}

function bindEditable(node, set){
  node.classList.add('editable');
  if(editing) node.setAttribute('contenteditable', 'plaintext-only');
  node.addEventListener('input', () => { set(node.textContent); save(); });
  return node;
}
function editableEl(tag, cls, get, set){
  return bindEditable(el(tag, cls, get()), set);
}

/* ---------- форматирование заметок (жирный/курсив/ссылка) ----------
   Хранится безопасный HTML: разрешены только <b>, <i>, <a href>, <br>,
   всё остальное вычищается — защита от XSS сохраняется и при импорте JSON. */
function sanitizeHtml(html){
  const t = document.createElement('template');
  t.innerHTML = String(html == null ? '' : html);
  const keep = {B:'b', STRONG:'b', I:'i', EM:'i', A:'a', BR:'br'};
  (function walk(node){
    [...node.childNodes].forEach(ch => {
      if(ch.nodeType === Node.TEXT_NODE) return;
      if(ch.nodeType !== Node.ELEMENT_NODE){ ch.remove(); return; }
      walk(ch);
      const tag = keep[ch.tagName];
      if(!tag){ // div/p и прочие блоки → содержимое + перенос строки
        const frag = document.createDocumentFragment();
        if(/^(DIV|P)$/.test(ch.tagName) && ch.previousSibling) frag.append(document.createElement('br'));
        while(ch.firstChild) frag.append(ch.firstChild);
        ch.replaceWith(frag);
        return;
      }
      const rep = document.createElement(tag);
      if(tag === 'a'){
        const href = ch.getAttribute('href') || '';
        if(!/^https?:\/\//i.test(href)){ ch.replaceWith(...ch.childNodes); return; }
        rep.href = href;
        rep.target = '_blank';
        rep.rel = 'noopener';
      }
      while(ch.firstChild) rep.append(ch.firstChild);
      ch.replaceWith(rep);
    });
  })(t.content);
  return t.innerHTML;
}

function bindRich(node, set){
  node.classList.add('editable', 'rich');
  if(editing) node.setAttribute('contenteditable', 'true');
  node.addEventListener('input', () => { set(sanitizeHtml(node.innerHTML)); save(); });
  return node;
}
function richEl(tag, cls, get, set){
  const n = el(tag, cls);
  n.innerHTML = sanitizeHtml(get());
  return bindRich(n, set);
}

function parseNum(t){
  const n = parseFloat(String(t).replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}
const fmt  = n => n.toLocaleString('ru-RU', {maximumFractionDigits:2});
const fmt0 = n => n.toLocaleString('ru-RU', {maximumFractionDigits:0});

/* «53.9316, 27.6462» → [lat, lng] или null */
function parseGeo(str){
  const m = String(str || '').match(/^\s*(-?\d{1,3}(?:\.\d+)?)[,;\s]+(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if(!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if(Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

/* сжатие изображения через canvas → dataURL (JPEG) */
function resizeImage(file, maxW, quality, cb){
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const w = Math.min(maxW, img.naturalWidth);
    const h = Math.round(img.naturalHeight * w / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    cb(c.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => { URL.revokeObjectURL(url); alert('Не удалось прочитать изображение.'); };
  img.src = url;
}

/* кнопки ↑ ↓ ✕ для перемещения/удаления элемента массива */
function rowControls(arr, i, rerender, confirmMsg){
  const box = el('span', 'row-controls edit-only');
  const mk = (label, title, fn, danger) => {
    const b = el('button', 'ctl' + (danger ? ' danger' : ''), label);
    b.type = 'button';
    b.title = title;
    b.onclick = e => { e.stopPropagation(); fn(); };
    box.append(b);
  };
  mk('↑', 'Переместить выше', () => {
    if(i > 0){ [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; save(); rerender(); }
  });
  mk('↓', 'Переместить ниже', () => {
    if(i < arr.length - 1){ [arr[i+1], arr[i]] = [arr[i], arr[i+1]]; save(); rerender(); }
  });
  mk('✕', 'Удалить', () => {
    if(confirmMsg && !confirm(confirmMsg)) return;
    arr.splice(i, 1); save(); rerender();
  }, true);
  return box;
}

/* ---------- фон ---------- */
function applyBg(){
  const b = $('#bg');
  if(state.bg){
    b.style.backgroundImage = 'url("' + state.bg.replace(/"/g, '%22') + '")';
    b.classList.add('has-img');
  }else{
    b.style.backgroundImage = 'none';
    b.classList.remove('has-img');
  }
}

/* ---------- шапка и курс (статичные editable, привязка один раз) ---------- */
function renderStatics(){
  $('#eyebrow1').textContent = state.hero.eyebrow1;
  $('#eyebrow2').textContent = state.hero.eyebrow2;
  $('#page-title').textContent = state.hero.title;
  $('#dates').textContent = state.hero.dates;
  $('#subtitle').innerHTML = sanitizeHtml(state.hero.subtitle);
  $('#rate').textContent = fmt(state.rate);
  document.title = state.hero.title || 'Road Map';
}

/* ---------- блокировка карт до двойного тапа ----------
   Чтобы при скролле страницы палец не таскал карту случайно:
   все взаимодействия выключены, двойной тап включает, тап вне карты — снова выключает. */
const lockedMaps = [];
/* набор жестов, которые включаются/выключаются при блокировке карты */
function lockableHandlers(m){
  return [m.dragPan, m.scrollZoom, m.doubleClickZoom, m.touchZoomRotate, m.boxZoom, m.keyboard];
}
function lockMapUntilDblclick(m, elm){
  m.dragRotate.disable();              // всегда 2D: без вращения и наклона
  m.touchZoomRotate.disableRotation();
  m.touchPitch.disable();
  const lock = () => {
    m._active = false;
    lockableHandlers(m).forEach(h => h && h.disable());
    elm.classList.add('map-locked');
  };
  m.on('dblclick', () => {
    if(m._active) return;
    m._active = true;
    lockableHandlers(m).forEach(h => h && h.enable());
    elm.classList.remove('map-locked');
  });
  lock();
  lockedMaps.push({m, elm, lock});
}
document.addEventListener('pointerdown', e => {
  lockedMaps.forEach(rec => {
    if(rec.m._active && !rec.elm.contains(e.target)) rec.lock();
  });
}, true);

/* ---------- маркеры MapLibre ---------- */
/* DOM-элемент маркера (label + pin); позицию задаёт MapLibre через anchor:'bottom' */
function makeMarkerEl(name){
  const root = el('div', 'marker');
  const label = el('div', 'marker-label', name);
  root.append(label);
  root.append(el('div', 'marker-pin'));
  return {el:root, label};
}

/* мини-карта события (создавать после вставки элемента в DOM).
   В режиме редактирования: клик по мини-карте или перетаскивание метки
   задаёт координаты события. */
function initMiniMap(elm, stop, coords, ref, bucket){
  const center = [coords[1], coords[0]]; // [lat,lng] из состояния → [lng,lat] для MapLibre
  const mm = new maplibregl.Map({
    container:elm, style:MAP_STYLE, center, zoom:15,
    attributionControl:false, dragRotate:false
  });
  const {el:mel, label} = makeMarkerEl(stop.name);
  const mk = new maplibregl.Marker({element:mel, anchor:'bottom', draggable:editing})
    .setLngLat(center).addTo(mm);
  ref.mm = mm;
  ref.marker = mk;
  ref.label = label;
  if(editing){
    const setGeo = (ll, pan) => { // ll — LngLat {lat, lng}
      stop.geo = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5);
      mk.setLngLat(ll);
      if(pan) mm.panTo(ll);
      if(ref.geoInp) ref.geoInp.textContent = stop.geo;
      save();
    };
    mm.on('click', e => { if(mm._active) setGeo(e.lngLat, true); });
    mk.on('dragend', () => setGeo(mk.getLngLat(), false));
  }
  lockMapUntilDblclick(mm, elm);
  (bucket || miniMaps).push(mm);
}

/* ---------- общие блоки события/места (расписание и «Покушац») ---------- */
/* фото: превью + инструменты или пунктирный слот (режим редактирования) */
function buildPhotoBlock(item, rerender){
  const frag = document.createDocumentFragment();
  if(item.photo){
    const img = document.createElement('img');
    img.className = 'stop-photo';
    img.alt = item.name;
    img.src = item.photo;
    frag.append(img);
    if(editing){
      const tools = el('div', 'photo-tools');
      const crp = el('button', 'pill small', '✂ Кадрировать');
      crp.type = 'button';
      crp.title = 'Кадрировать и масштабировать фото';
      crp.onclick = () => openCrop(item);
      const rep = el('button', 'pill small', '📷 Заменить фото');
      rep.type = 'button';
      rep.onclick = () => { pendingPhotoStop = item; $('#stop-photo-file').click(); };
      const rm = el('button', 'pill small', '✕ Убрать фото');
      rm.type = 'button';
      rm.onclick = () => { item.photo = ''; save(); rerender(); };
      tools.append(crp, rep, rm);
      frag.append(tools);
    }
  }else if(editing){
    const slot = el('button', 'slot', 'фото · ' + item.name);
    slot.type = 'button';
    slot.title = 'Добавить фото';
    slot.onclick = () => { pendingPhotoStop = item; $('#stop-photo-file').click(); };
    frag.append(slot);
  }
  return frag;
}

/* гео-инструменты: редактируемые координаты + кнопка «Найти» */
function buildGeoTools(item, ref, rerender){
  const geoWrap = el('div', 'stop-geo-wrap');
  geoWrap.append(el('span', null, '📍'));
  const geoInp = editableEl('span', 'stop-geo mono', () => item.geo || '', v => item.geo = v.trim());
  geoInp.title = 'Введите координаты в формате «53.9316, 27.6462»';
  ref.geoInp = geoInp;
  geoInp.addEventListener('blur', () => {
    const c = parseGeo(item.geo); // [lat, lng]
    if(c && ref.mm){
      ref.marker.setLngLat([c[1], c[0]]);
      ref.mm.setCenter([c[1], c[0]]);
    }else if(c && !ref.mm){
      rerender(); // появились координаты — показать мини-карту
    }else if(!c && ref.mm && !(item.geo || '').trim()){
      rerender(); // координаты стёрли — убрать мини-карту
    }
  });
  geoWrap.append(geoInp);
  const show = el('button', 'pill small', '🔍 Найти');
  show.type = 'button';
  show.title = 'Показать введённые координаты на карте';
  show.onclick = () => {
    const c = parseGeo(item.geo); // [lat, lng]
    if(!c){ alert('Введите координаты в формате «53.9316, 27.6462».'); return; }
    save();
    if(ref.mm){
      ref.marker.setLngLat([c[1], c[0]]);
      ref.mm.jumpTo({center:[c[1], c[0]], zoom:Math.max(ref.mm.getZoom(), 15)});
    }else{
      rerender(); // мини-карты ещё нет — создать по координатам
    }
  };
  geoWrap.append(show);
  return geoWrap;
}

/* перезапуск анимации появления (смена дня) */
function restartAnim(elm){
  elm.style.animation = 'none';
  void elm.offsetWidth; // reflow — иначе анимация не перезапустится
  elm.style.animation = 'fadeIn .35s ease';
}

/* ---------- расписание: табы дней и карточки событий ---------- */
function clampActiveDay(){
  if(state.activeDay >= state.days.length) state.activeDay = Math.max(0, state.days.length - 1);
  if(state.activeDay < 0) state.activeDay = 0;
}

function renderTabs(){
  const wrap = $('#day-tabs');
  wrap.textContent = '';
  state.days.forEach((d, i) => {
    const t = el('button', 'day-tab' + (i === state.activeDay ? ' on' : ''), 'День ' + (i + 1));
    t.type = 'button';
    t.onclick = () => {
      if(i === state.activeDay) return;
      state.activeDay = i; save(); renderDays();
      restartAnim($('#day-head'));
      restartAnim($('#stops'));
    };
    wrap.append(t);
  });
  if(editing){
    const add = el('button', 'day-tab add', '＋');
    add.type = 'button';
    add.title = 'Добавить день';
    add.onclick = () => {
      state.days.push({title:'День ' + (state.days.length + 1), stops:[{time:'12:00', name:'Новое место', note:'Заметка', photo:'', geo:''}]});
      state.activeDay = state.days.length - 1;
      save(); renderDays();
    };
    wrap.append(add);
  }
}

function renderDays(){
  miniMaps.forEach(m => m.remove());
  miniMaps = [];
  for(let i = lockedMaps.length - 1; i >= 0; i--){ // подчистить записи удалённых мини-карт
    if(!lockedMaps[i].elm.isConnected) lockedMaps.splice(i, 1);
  }
  const pendingMini = [];
  clampActiveDay();
  renderTabs();

  const headWrap = $('#day-head');
  headWrap.textContent = '';
  const stopsWrap = $('#stops');
  stopsWrap.textContent = '';

  const day = state.days[state.activeDay];
  if(!day){
    headWrap.append(el('p', 'stop-note', 'Дней пока нет — нажмите «Править» и добавьте первый.'));
    return;
  }

  // заголовок дня + управление днём
  headWrap.append(editableEl('h2', 'day-heading', () => day.title, v => day.title = v));
  if(editing){
    const ctl = el('span', 'row-controls edit-only');
    const mk = (label, title, fn, danger) => {
      const b = el('button', 'ctl' + (danger ? ' danger' : ''), label);
      b.type = 'button'; b.title = title; b.onclick = fn;
      ctl.append(b);
    };
    mk('↑', 'Сдвинуть день раньше', () => {
      const i = state.activeDay;
      if(i > 0){ [state.days[i-1], state.days[i]] = [state.days[i], state.days[i-1]]; state.activeDay = i - 1; save(); renderDays(); }
    });
    mk('↓', 'Сдвинуть день позже', () => {
      const i = state.activeDay;
      if(i < state.days.length - 1){ [state.days[i+1], state.days[i]] = [state.days[i], state.days[i+1]]; state.activeDay = i + 1; save(); renderDays(); }
    });
    mk('✕', 'Удалить день', () => {
      if(!confirm('Удалить день целиком вместе со всеми событиями?')) return;
      state.days.splice(state.activeDay, 1);
      save(); renderDays();
    }, true);
    headWrap.append(ctl);
  }

  // события активного дня
  day.stops.forEach((stop, si) => {
    const isOpen = expandedStops.has(stop);
    const miniRef = {mm:null, marker:null, label:null, geoInp:null};

    const row = el('div', 'event-row');
    row.append(el('div', 'tl-dot' + (isOpen ? ' on' : '')));

    const card = el('article', 'event-card' + (isOpen ? ' open' : ''));
    const head = el('div', 'event-head');
    const meta = el('div', 'event-meta');
    meta.append(editableEl('div', 'stop-time mono', () => stop.time, v => stop.time = v));
    meta.append(editableEl('div', 'stop-name', () => stop.name, v => {
      stop.name = v;
      if(miniRef.label) miniRef.label.textContent = v; // подпись на мини-карте — сразу
      const mr = dayMarkerRefs.get(stop);              // чип и маркер на общей карте — тоже
      if(mr){ mr.chip.textContent = v; if(mr.label) mr.label.textContent = v; }
    }));
    meta.append(richEl('div', 'stop-note', () => stop.note, v => stop.note = v));
    head.append(meta);

    const right = el('div', 'event-headright');
    right.append(rowControls(day.stops, si, renderDays));
    const toggle = () => {
      if(isOpen){
        expandedStops.delete(stop);
        chev.classList.remove('open'); // шеврон крутится во время сворачивания
        const bodyEl = card.querySelector('.event-body');
        if(bodyEl && !matchMedia('(prefers-reduced-motion: reduce)').matches){
          bodyEl.style.animation = 'bodyOut .25s ease forwards';
          bodyEl.addEventListener('animationend', () => renderDays(), {once:true});
        }else renderDays();
      }else{
        expandedStops.add(stop);
        renderDays();
      }
    };
    const chev = el('button', 'chevron' + (isOpen ? ' open' : ''), '▾');
    chev.type = 'button';
    chev.title = isOpen ? 'Свернуть' : 'Развернуть';
    chev.onclick = e => { e.stopPropagation(); toggle(); };
    right.append(chev);
    head.append(right);
    head.onclick = () => { if(!editing) toggle(); }; // в редактировании клик по тексту — правка
    card.append(head);

    if(isOpen){
      const body = el('div', 'event-body');

      body.append(buildPhotoBlock(stop, renderDays));

      // мини-карта
      const coords = parseGeo(stop.geo);
      if(coords && window.maplibregl){
        const mapDiv = el('div', 'stop-map');
        body.append(mapDiv);
        pendingMini.push({elm:mapDiv, stop, coords, ref:miniRef});
      }else if(editing){
        const slot = el('button', 'slot', 'карта · ' + stop.name);
        slot.type = 'button';
        slot.title = 'Поставить метку в центре города — дальше уточните кликом или перетаскиванием';
        slot.onclick = () => {
          stop.geo = state.map.lat.toFixed(5) + ', ' + state.map.lng.toFixed(5);
          save(); renderDays();
        };
        body.append(slot);
      }

      if(editing) body.append(buildGeoTools(stop, miniRef, renderDays));

      if(body.children.length) card.append(body);
    }

    row.append(card);
    stopsWrap.append(row);
  });

  pendingMini.forEach(p => initMiniMap(p.elm, p.stop, p.coords, p.ref));
  updateDayPoints(); // чипы и маркеры общей карты — по событиям активного дня
}

/* ---------- бюджет ---------- */
/* бейдж категории: цвет всегда берётся из настроек state.categories,
   не зависит от текста строки */
function badgeEl(name, cls){
  const b = el('span', 'badge' + (cls ? ' ' + cls : ''), name);
  const cat = state.categories.find(c => c.name === name);
  if(cat && /^#[0-9a-f]{6}$/i.test(cat.color)){
    b.style.color = cat.color;
    b.style.borderColor = cat.color + '73';
    b.style.background = cat.color + '1f';
  }
  return b;
}

/* сумма строки в рублях — мера «важности» для свёрнутого вида */
function rowRub(row){
  return row.currency === 'BYN' ? row.amount * (state.rate || 1) : row.amount;
}

let budgetExpanded = false;
const BUDGET_COLLAPSED_ROWS = 4;

function renderBudget(){
  const tbody = $('#budget-body');
  tbody.textContent = '';
  // показ по убыванию суммы; свёрнуто — только самые крупные строки
  const order = state.budget.map((row, i) => ({row, i}))
    .sort((a, b) => rowRub(b.row) - rowRub(a.row));
  const shown = (editing || budgetExpanded) ? order : order.slice(0, BUDGET_COLLAPSED_ROWS);
  shown.forEach(({row, i}) => {
    const tr = el('tr');

    const tdName = el('td');
    tdName.append(editableEl('span', null, () => row.name, v => row.name = v));

    const tdCat = el('td', 'cats');
    // просмотр: только назначенные категории
    const assigned = el('span', 'cat-assigned');
    row.cats.forEach(n => assigned.append(badgeEl(n)));
    tdCat.append(assigned);
    // редактирование: все категории как переключатели (можно несколько сразу)
    const picker = el('span', 'cat-picker edit-only');
    state.categories.forEach(cat => {
      const t = badgeEl(cat.name, 'cat-toggle' + (row.cats.includes(cat.name) ? ' on' : ''));
      t.title = 'Назначить/снять категорию';
      t.onclick = () => {
        const j = row.cats.indexOf(cat.name);
        if(j >= 0) row.cats.splice(j, 1); else row.cats.push(cat.name);
        save(); renderBudget();
      };
      picker.append(t);
    });
    tdCat.append(picker);

    const tdAmt = el('td', 'num');
    const amt = editableEl('span', 'amount', () => fmt(row.amount), v => {
      row.amount = parseNum(v);
      renderTotals();
    });
    amt.addEventListener('blur', () => { amt.textContent = fmt(row.amount); });
    tdAmt.append(amt);

    const tdCur = el('td');
    const cur = el('button', 'cur', row.currency);
    cur.type = 'button';
    cur.title = 'Переключить валюту';
    cur.onclick = () => {
      row.currency = row.currency === 'RUB' ? 'BYN' : 'RUB';
      cur.textContent = row.currency;
      save(); renderTotals();
    };
    tdCur.append(cur);

    const tdDel = el('td', 'del-col');
    const del = el('button', 'ctl danger edit-only', '✕');
    del.type = 'button';
    del.title = 'Удалить строку';
    del.onclick = () => { state.budget.splice(i, 1); save(); renderBudget(); };
    tdDel.append(del);

    tr.append(tdName, tdCat, tdAmt, tdCur, tdDel);
    tbody.append(tr);
  });
  // кнопка ⋯ рядом с «Итого»: раскрыть/скрыть второстепенные строки
  const tgl = $('#budget-toggle');
  const hasHidden = !editing && state.budget.length > BUDGET_COLLAPSED_ROWS;
  tgl.style.display = hasHidden ? '' : 'none';
  tgl.textContent = budgetExpanded ? '−' : '⋯';
  tgl.title = budgetExpanded ? 'Скрыть второстепенные строки' : 'Показать все строки';
  renderTotals();
}

function renderTotals(){
  const rate = state.rate || 1;
  let rub = 0, byn = 0;
  for(const r of state.budget){
    if(r.currency === 'BYN'){ rub += r.amount * rate; byn += r.amount; }
    else { rub += r.amount; byn += r.amount / rate; }
  }
  $('#total-rub').textContent = 'Итого: ' + fmt0(rub) + ' RUB';
  $('#total-byn').textContent = '≈ ' + fmt0(byn) + ' BYN';
}

/* редактор категорий: имя, цвет (нативный color-picker), удаление, добавление */
function renderCatEditor(){
  const wrap = $('#cat-editor');
  wrap.textContent = '';
  wrap.append(el('span', 'cat-editor-title', 'Категории и цвета:'));
  state.categories.forEach((cat, i) => {
    const row = el('span', 'cat-edit-row');
    const col = document.createElement('input');
    col.type = 'color';
    col.value = cat.color;
    col.className = 'cat-color';
    col.title = 'Цвет категории';
    col.oninput = () => { cat.color = col.value; save(); renderBudget(); };
    row.append(col);
    const nameEl = editableEl('span', 'cat-edit-name', () => cat.name, v => {
      const old = cat.name;
      cat.name = v;
      state.budget.forEach(r => {
        const j = r.cats.indexOf(old);
        if(j >= 0) r.cats[j] = v;
      });
    });
    nameEl.addEventListener('blur', () => renderBudget());
    row.append(nameEl);
    const del = el('button', 'ctl danger', '✕');
    del.type = 'button';
    del.title = 'Удалить категорию';
    del.onclick = () => {
      state.budget.forEach(r => {
        const j = r.cats.indexOf(cat.name);
        if(j >= 0) r.cats.splice(j, 1);
      });
      state.categories.splice(i, 1);
      save(); renderCatEditor(); renderBudget();
    };
    row.append(del);
    wrap.append(row);
  });
  const add = el('button', 'pill small', '＋ Категория');
  add.type = 'button';
  add.onclick = () => {
    state.categories.push({name:'новая', color:'#8fb8d8'});
    save(); renderCatEditor(); renderBudget();
  };
  wrap.append(add);
}

/* ---------- страница «Покушац»: компактный список мест с раскрытием ---------- */
function renderEat(){
  eatMaps.forEach(m => m.remove());
  eatMaps = [];
  for(let i = lockedMaps.length - 1; i >= 0; i--){ // подчистить записи удалённых мини-карт
    if(!lockedMaps[i].elm.isConnected) lockedMaps.splice(i, 1);
  }
  const wrap = $('#eat-list');
  wrap.textContent = '';
  const pendingMini = [];
  if(!state.eat.length && !editing){
    wrap.append(el('p', 'eat-empty', 'Пока пусто — нажмите «Править» и добавьте первое место.'));
  }
  state.eat.forEach((pl, i) => {
    const isOpen = expandedEats.has(pl);
    const ref = {mm:null, marker:null, label:null, geoInp:null};

    const row = el('div', 'eat-row' + (isOpen ? ' open' : ''));
    const head = el('div', 'eat-head');
    const meta = el('div', 'eat-meta');
    meta.append(editableEl('div', 'eat-name', () => pl.name, v => {
      pl.name = v;
      if(ref.label) ref.label.textContent = v; // подпись на мини-карте — сразу
    }));
    meta.append(editableEl('div', 'eat-tag', () => pl.tag || '', v => pl.tag = v));
    head.append(meta);

    const right = el('div', 'event-headright');
    right.append(rowControls(state.eat, i, renderEat, 'Удалить место?'));
    const toggle = () => {
      if(isOpen){
        expandedEats.delete(pl);
        chev.classList.remove('open');
        const bodyEl = row.querySelector('.eat-body');
        if(bodyEl && !matchMedia('(prefers-reduced-motion: reduce)').matches){
          bodyEl.style.animation = 'bodyOut .25s ease forwards';
          bodyEl.addEventListener('animationend', () => renderEat(), {once:true});
        }else renderEat();
      }else{
        expandedEats.add(pl);
        renderEat();
      }
    };
    const chev = el('button', 'chevron' + (isOpen ? ' open' : ''), '▾');
    chev.type = 'button';
    chev.title = isOpen ? 'Свернуть' : 'Развернуть';
    chev.onclick = e => { e.stopPropagation(); toggle(); };
    right.append(chev);
    head.append(right);
    head.onclick = () => { if(!editing) toggle(); };
    row.append(head);

    if(isOpen){
      const body = el('div', 'eat-body');

      body.append(buildPhotoBlock(pl, renderEat));

      // ссылка на сайт/соцсеть
      if(editing){
        const urlWrap = el('div', 'stop-geo-wrap');
        urlWrap.append(el('span', null, '🔗'));
        const urlInp = editableEl('span', 'stop-geo mono', () => pl.url || '', v => pl.url = v.trim());
        urlInp.title = 'Вставьте ссылку на сайт или соцсеть (https://…)';
        urlWrap.append(urlInp);
        body.append(urlWrap);
      }else if(pl.url && /^https?:\/\//i.test(pl.url)){
        const a = el('a', 'eat-link');
        let label = pl.url;
        try{ label = new URL(pl.url).hostname.replace(/^www\./, ''); }catch(e){}
        a.textContent = '🔗 ' + label;
        a.href = pl.url;
        a.target = '_blank';
        a.rel = 'noopener';
        body.append(a);
      }

      // мини-карта
      const coords = parseGeo(pl.geo);
      if(coords && window.maplibregl){
        const mapDiv = el('div', 'stop-map');
        body.append(mapDiv);
        pendingMini.push({elm:mapDiv, stop:pl, coords, ref});
      }else if(editing){
        const slot = el('button', 'slot', 'карта · ' + pl.name);
        slot.type = 'button';
        slot.title = 'Поставить метку в центре города — дальше уточните кликом или перетаскиванием';
        slot.onclick = () => {
          pl.geo = state.map.lat.toFixed(5) + ', ' + state.map.lng.toFixed(5);
          save(); renderEat();
        };
        body.append(slot);
      }

      if(editing) body.append(buildGeoTools(pl, ref, renderEat));

      // заметка с форматированием
      body.append(richEl('div', 'stop-note', () => pl.note || '', v => pl.note = v));

      row.append(body);
    }
    wrap.append(row);
  });
  pendingMini.forEach(p => initMiniMap(p.elm, p.stop, p.coords, p.ref, eatMaps));
}

/* ---------- точки на карте: собираются из событий активного дня ---------- */
let dayMarkerRefs = new Map(); // stop → {chip, label} для живого обновления имён
let lastFitDay = null;         // чтобы вписывать точки только при смене дня

function dayPoints(){
  const day = state.days[state.activeDay];
  if(!day) return [];
  return day.stops.map(s => {
    const c = parseGeo(s.geo);
    return c ? {stop:s, name:s.name, lat:c[0], lng:c[1]} : null;
  }).filter(Boolean);
}

function updateDayPoints(){
  const pts = dayPoints();
  const wrap = $('#chips');
  wrap.textContent = '';
  dayMarkerRefs = new Map();
  markers.forEach(m => m.remove());
  markers = [];
  pts.forEach(p => {
    const chip = el('button', 'chip');
    chip.type = 'button';
    chip.append(el('span', 'chip-pin', '📍'));
    const nm = el('span', null, p.name);
    chip.append(nm);
    chip.onclick = () => {
      if(!map) return;
      const z = Math.max(map.getZoom(), 14);
      const c = [p.lng, p.lat]; // MapLibre: [lng, lat]
      if(matchMedia('(prefers-reduced-motion: reduce)').matches) map.jumpTo({center:c, zoom:z});
      else map.flyTo({center:c, zoom:z, duration:600});
    };
    wrap.append(chip);
    const ref = {chip:nm, label:null};
    if(map && window.maplibregl){
      const {el:mel, label} = makeMarkerEl(p.name);
      ref.label = label;
      markers.push(new maplibregl.Marker({element:mel, anchor:'bottom'})
        .setLngLat([p.lng, p.lat]).addTo(map));
    }
    dayMarkerRefs.set(p.stop, ref);
  });
  fitDayPoints(pts);
}

/* вписать точки дня в обзор карты (только при смене дня / после импорта) */
function fitDayPoints(pts){
  if(!map || !pts.length || state.activeDay === lastFitDay) return;
  lastFitDay = state.activeDay;
  const anim = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(pts.length === 1){
    const c = [pts[0].lng, pts[0].lat];
    if(anim) map.flyTo({center:c, zoom:Math.max(map.getZoom(), 14), duration:600});
    else map.jumpTo({center:c, zoom:Math.max(map.getZoom(), 14)});
  }else{
    const b = new maplibregl.LngLatBounds();
    pts.forEach(p => b.extend([p.lng, p.lat]));
    map.fitBounds(b, {padding:60, maxZoom:15, duration:anim ? 600 : 0});
  }
}

/* ---------- главная карта ---------- */
function mapFallback(){
  const m = $('#map');
  m.classList.add('fallback');
  m.textContent = '';
  const box = el('div');
  box.append(el('p', 'fallback-title', 'Карта недоступна: не загрузилась библиотека карт.'));
  box.append(el('p', 'fallback-note', 'Нужен интернет. Точки маршрута сохраняются и доступны в списке под картой.'));
  m.append(box);
}

function initMap(){
  if(!window.maplibregl){ mapFallback(); return; }
  try{
    map = new maplibregl.Map({
      container:'map', style:MAP_STYLE,
      center:[state.map.lng, state.map.lat], zoom:state.map.zoom, // состояние {lat,lng} → [lng,lat]
      attributionControl:false, dragRotate:false
    });
    map.addControl(new maplibregl.NavigationControl({showCompass:false}), 'top-left');
    lockMapUntilDblclick(map, $('#map'));
    map.on('moveend', () => {
      const c = map.getCenter(); // {lat, lng}
      state.map = {lat:c.lat, lng:c.lng, zoom:map.getZoom()};
      save();
    });
    updateDayPoints();
  }catch(e){ mapFallback(); }
}

/* ---------- режим редактирования ---------- */
function setEditing(on){
  editing = on;
  document.body.classList.toggle('editing', on);
  document.querySelectorAll('.editable').forEach(n => {
    // rich-поля редактируются с HTML (жирный/курсив/ссылка), остальные — только текст
    if(on) n.setAttribute('contenteditable', n.classList.contains('rich') ? 'true' : 'plaintext-only');
    else n.removeAttribute('contenteditable');
  });
  const b = $('#edit-fab');
  b.textContent = on ? '✓ Готово' : '✎ Править';
  b.classList.toggle('active', on);
  $('#fmt-bar').hidden = true;
  renderDays();    // слоты фото/карты и интерактивность мини-карт
  renderBudget();  // в режиме правки видны все строки бюджета
  renderEat();     // слоты и правка мест «Покушац»
}

/* ---------- меню ---------- */
function toggleMenu(open){
  const ov = $('#menu-overlay');
  $('#menu-btn').classList.toggle('open', open);
  if(open){
    ov.classList.remove('closing');
    ov.hidden = false;
  }else if(!ov.hidden && !ov.classList.contains('closing')){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){ ov.hidden = true; return; }
    ov.classList.add('closing'); // плавное закрытие, скрыть по концу анимации
    ov.addEventListener('animationend', () => {
      ov.hidden = true;
      ov.classList.remove('closing');
    }, {once:true});
  }
}

/* ---------- страницы: расписание ⇄ бюджет ⇄ покушац ---------- */
let page = 'home';
function showPage(p){
  page = p;
  document.body.classList.toggle('page-budget', p === 'budget');
  document.body.classList.toggle('page-eat', p === 'eat');
  $('#budget-section').hidden = p !== 'budget';
  $('#eat-section').hidden = p !== 'eat';
  $('#mi-budget').textContent = p === 'budget' ? 'Расписание' : 'Бюджет';
  $('#mi-eat').textContent = p === 'eat' ? 'Расписание' : 'Покушац';
  window.scrollTo({top:0, behavior:'instant'});
  // карты, созданные в скрытой секции, имеют нулевой размер — пересчитать
  if(p === 'home' && map){ map.resize(); miniMaps.forEach(m => m.resize()); }
  if(p === 'eat') eatMaps.forEach(m => m.resize());
}

/* ---------- экспорт / импорт / сброс ---------- */
function exportJson(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const city = (state.hero.eyebrow2 || 'поездка').toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-') || 'поездка';
  a.download = 'roadmap-' + city + '.json';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function importJson(e){
  const f = e.target.files[0];
  e.target.value = '';
  if(!f) return;
  f.text().then(t => {
    let obj;
    try{ obj = JSON.parse(t); }
    catch{ alert('Файл повреждён: это не корректный JSON.'); return; }
    if(!obj || !Array.isArray(obj.days) || !Array.isArray(obj.budget)){
      alert('Неверный формат: в файле должны быть поля days и budget.');
      return;
    }
    state = Object.assign(demoState(), migrateState(obj));
    save();
    renderAll();
  });
}

function resetAll(){
  if(!confirm('Сбросить все правки и вернуть демо-наполнение (Минск)?')) return;
  localStorage.removeItem(LS_KEY);
  state = demoState();
  save();
  renderAll();
}

/* ---------- перерисовка всего (только при структурных изменениях) ---------- */
function renderAll(){
  applyBg();
  renderStatics();
  lastFitDay = null; // после импорта/сброса заново вписать точки дня в карту
  if(map) map.jumpTo({center:[state.map.lng, state.map.lat], zoom:state.map.zoom});
  renderDays(); // включает updateDayPoints (чипы + маркеры + обзор)
  renderBudget();
  renderCatEditor();
  renderEat();
}

/* ---------- привязка событий ---------- */
bindEditable($('#eyebrow1'), v => state.hero.eyebrow1 = v);
bindEditable($('#eyebrow2'), v => state.hero.eyebrow2 = v);
bindEditable($('#page-title'), v => state.hero.title = v);
bindEditable($('#dates'), v => state.hero.dates = v);
bindRich($('#subtitle'), v => state.hero.subtitle = v);

const rateEl = $('#rate');
bindEditable(rateEl, v => {
  const n = parseNum(v);
  if(n > 0) state.rate = n;
  renderTotals();
});
rateEl.addEventListener('blur', () => { rateEl.textContent = fmt(state.rate); });

$('#edit-fab').onclick = () => setEditing(!editing);

/* бургер-меню */
$('#menu-btn').onclick = () => toggleMenu($('#menu-overlay').hidden);
$('#menu-overlay').addEventListener('click', e => {
  if(e.target === $('#menu-overlay')) toggleMenu(false);
});
document.querySelectorAll('.menu-item').forEach(b => {
  b.onclick = () => {
    toggleMenu(false);
    const act = b.dataset.act;
    if(act === 'settings'){
      if(page !== 'home') showPage('home'); // настройки живут на главной
      const s = $('#settings-section');
      s.hidden = false;
      s.scrollIntoView({behavior:'smooth', block:'start'});
    }else if(act === 'budget'){
      showPage(page === 'budget' ? 'home' : 'budget');
    }else if(act === 'eat'){
      showPage(page === 'eat' ? 'home' : 'eat');
    }else if(act === 'reset'){
      resetAll();
    }else if(act === 'import'){
      $('#import-file').click();
    }else if(act === 'export'){
      exportJson();
    }
  };
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && !$('#menu-overlay').hidden) toggleMenu(false);
});

$('#import-file').addEventListener('change', importJson);

$('#add-stop').onclick = () => {
  const day = state.days[state.activeDay];
  if(!day) return;
  day.stops.push({time:'12:00', name:'Новое место', note:'Заметка', photo:'', geo:''});
  save(); renderDays();
};
$('#add-row').onclick = () => {
  state.budget.push({name:'Новая строка', cats:[], amount:0, currency:'RUB'});
  save(); renderBudget();
};
$('#budget-toggle').onclick = () => {
  budgetExpanded = !budgetExpanded;
  renderBudget();
};

/* ---------- кадрирование фото ----------
   Перетаскивание — панорама, ползунок — масштаб; сохранение перерисовывает
   видимую область кадра в JPEG. */
const crop = {stop:null, iw:0, ih:0, scale:1, z:1, ox:0, oy:0};

function cropFrameSize(){
  const f = $('#crop-frame');
  return {W:f.clientWidth, H:f.clientHeight};
}
function layoutCrop(center){
  const {W, H} = cropFrameSize();
  const s0 = Math.max(W / crop.iw, H / crop.ih); // базовый масштаб «cover»
  crop.scale = s0 * crop.z;
  const dw = crop.iw * crop.scale, dh = crop.ih * crop.scale;
  if(center){ crop.ox = (W - dw) / 2; crop.oy = (H - dh) / 2; }
  crop.ox = Math.min(0, Math.max(W - dw, crop.ox)); // кадр всегда покрыт изображением
  crop.oy = Math.min(0, Math.max(H - dh, crop.oy));
  const im = $('#crop-img');
  im.style.width = dw + 'px';
  im.style.transform = 'translate(' + crop.ox + 'px,' + crop.oy + 'px)';
}
function openCrop(stop){
  const probe = new Image();
  probe.onload = () => {
    crop.stop = stop;
    crop.iw = probe.naturalWidth;
    crop.ih = probe.naturalHeight;
    crop.z = 1;
    $('#crop-img').src = stop.photo;
    $('#crop-zoom').value = 100;
    $('#crop-overlay').hidden = false;
    layoutCrop(true);
  };
  probe.src = stop.photo;
}
let cropDrag = null;
$('#crop-frame').addEventListener('pointerdown', e => {
  cropDrag = {x:e.clientX, y:e.clientY, ox:crop.ox, oy:crop.oy};
  $('#crop-frame').setPointerCapture(e.pointerId);
});
$('#crop-frame').addEventListener('pointermove', e => {
  if(!cropDrag) return;
  crop.ox = cropDrag.ox + (e.clientX - cropDrag.x);
  crop.oy = cropDrag.oy + (e.clientY - cropDrag.y);
  layoutCrop(false);
});
$('#crop-frame').addEventListener('pointerup', () => { cropDrag = null; });
$('#crop-frame').addEventListener('pointercancel', () => { cropDrag = null; });
$('#crop-zoom').addEventListener('input', e => {
  // держим центр кадра на месте при изменении масштаба
  const {W, H} = cropFrameSize();
  const cx = (W / 2 - crop.ox) / crop.scale;
  const cy = (H / 2 - crop.oy) / crop.scale;
  crop.z = e.target.value / 100;
  const s0 = Math.max(W / crop.iw, H / crop.ih);
  crop.scale = s0 * crop.z;
  crop.ox = W / 2 - cx * crop.scale;
  crop.oy = H / 2 - cy * crop.scale;
  layoutCrop(false);
});
$('#crop-cancel').onclick = () => { $('#crop-overlay').hidden = true; };
$('#crop-save').onclick = () => {
  if(!crop.stop) return;
  const {W, H} = cropFrameSize();
  const sx = -crop.ox / crop.scale, sy = -crop.oy / crop.scale;
  const sw = W / crop.scale, sh = H / crop.scale;
  const img = new Image();
  img.onload = () => {
    const outW = Math.min(800, Math.round(sw));
    const outH = Math.round(outW * sh / sw);
    const c = document.createElement('canvas');
    c.width = outW; c.height = outH;
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    crop.stop.photo = c.toDataURL('image/jpeg', 0.8);
    $('#crop-overlay').hidden = true;
    save(); renderDays(); renderEat(); // фото может быть и у события, и у места
  };
  img.src = crop.stop.photo;
};

/* фото события */
$('#stop-photo-file').addEventListener('change', e => {
  const f = e.target.files[0];
  e.target.value = '';
  if(!f || !pendingPhotoStop) return;
  const stop = pendingPhotoStop;
  pendingPhotoStop = null;
  resizeImage(f, 800, 0.75, dataUrl => {
    stop.photo = dataUrl;
    save(); renderDays(); renderEat(); // фото может быть и у события, и у места
  });
});

/* добавить место на странице «Покушац» */
$('#add-eat').onclick = () => {
  const pl = {name:'Новое место', tag:'', url:'', photo:'', geo:'', note:''};
  state.eat.push(pl);
  expandedEats.add(pl);
  save(); renderEat();
};

/* ---------- панель форматирования выделенного текста ---------- */
const fmtBar = $('#fmt-bar');
function fmtSelection(){
  const sel = document.getSelection();
  if(!editing || !sel || sel.isCollapsed || !sel.rangeCount) return null;
  const n = sel.anchorNode;
  const host = n.nodeType === Node.TEXT_NODE ? n.parentElement : n;
  return host && host.closest && host.closest('.rich') ? sel : null;
}
document.addEventListener('selectionchange', () => {
  const sel = fmtSelection();
  if(!sel){ fmtBar.hidden = true; return; }
  const r = sel.getRangeAt(0).getBoundingClientRect();
  fmtBar.hidden = false; // показать до замера — иначе размеры нулевые
  const w = fmtBar.offsetWidth, h = fmtBar.offsetHeight;
  fmtBar.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  fmtBar.style.top = Math.max(8, r.top - h - 10) + 'px';
});
addEventListener('scroll', () => { fmtBar.hidden = true; }, {passive:true});
fmtBar.querySelectorAll('button').forEach(b => {
  b.addEventListener('pointerdown', e => e.preventDefault()); // не сбрасывать выделение
  b.onclick = () => {
    if(!fmtSelection()) return;
    if(b.dataset.cmd === 'link'){
      let u = prompt('Ссылка (URL):', 'https://');
      if(!u || u === 'https://') return;
      if(!/^https?:\/\//i.test(u)) u = 'https://' + u;
      document.execCommand('createLink', false, u);
    }else{
      document.execCommand(b.dataset.cmd, false, null); // bold / italic
    }
    fmtBar.hidden = true;
  };
});

/* фон города (Настройки) */
$('#bg-apply-url').onclick = () => {
  const u = $('#bg-url').value.trim();
  if(!u) return;
  if(!/^https?:\/\//i.test(u)){ alert('Нужна прямая ссылка на изображение (http/https).'); return; }
  state.bg = u;
  save(); applyBg();
};
$('#bg-upload').onclick = () => $('#bg-file').click();
$('#bg-file').addEventListener('change', e => {
  const f = e.target.files[0];
  e.target.value = '';
  if(!f) return;
  resizeImage(f, 1920, 0.8, dataUrl => {
    state.bg = dataUrl;
    save(); applyBg();
  });
});
$('#bg-default').onclick = () => { state.bg = ''; save(); applyBg(); };

/* ---------- старт ---------- */
renderAll();
initMap();

/* PWA: офлайн-кеш и «Добавить на главный экран» (работает на https и localhost) */
if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

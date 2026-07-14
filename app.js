/* ======================================================================
   Карты: Leaflet + OpenStreetMap (бесплатно, без API-ключей).
   Библиотека подключена в index.html с CDN; без интернета вместо карт
   показывается заглушка, точки при этом доступны списком-чипами.
   ====================================================================== */
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; OpenStreetMap';

const LS_KEY = 'travel-roadmap-v2';

/* ---------- фон по умолчанию: стилизованный «вечерний город» (SVG) ---------- */
const DEFAULT_BG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">' +
  '<defs>' +
  '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#0a0e1a"/><stop offset=".5" stop-color="#141e33"/>' +
  '<stop offset=".8" stop-color="#3d2f45"/><stop offset="1" stop-color="#7c4a2c"/>' +
  '</linearGradient>' +
  '<pattern id="w1" width="18" height="26" patternUnits="userSpaceOnUse">' +
  '<rect x="4" y="8" width="7" height="10" fill="#e9a53f" opacity=".65"/></pattern>' +
  '<pattern id="w2" width="24" height="32" patternUnits="userSpaceOnUse">' +
  '<rect x="7" y="10" width="8" height="12" fill="#f0b45a" opacity=".4"/></pattern>' +
  '</defs>' +
  '<rect width="1600" height="900" fill="url(#sky)"/>' +
  '<circle cx="1230" cy="170" r="70" fill="#f4f1e9" opacity=".07"/>' +
  '<circle cx="1230" cy="170" r="42" fill="#f4f1e9" opacity=".85"/>' +
  '<g fill="#131a2b">' +
  '<rect x="0" y="500" width="130" height="400"/><rect x="150" y="430" width="90" height="470"/>' +
  '<rect x="260" y="470" width="140" height="430"/><rect x="420" y="380" width="80" height="520"/>' +
  '<rect x="520" y="450" width="120" height="450"/><rect x="660" y="400" width="100" height="500"/>' +
  '<rect x="780" y="360" width="70" height="540"/><rect x="870" y="440" width="130" height="460"/>' +
  '<rect x="1020" y="390" width="90" height="510"/><rect x="1130" y="460" width="120" height="440"/>' +
  '<rect x="1270" y="410" width="80" height="490"/><rect x="1370" y="470" width="110" height="430"/>' +
  '<rect x="1500" y="420" width="100" height="480"/>' +
  '</g>' +
  '<g fill="#0a0e16">' +
  '<rect x="60" y="600" width="170" height="300"/><rect x="270" y="560" width="120" height="340"/>' +
  '<rect x="430" y="620" width="150" height="280"/><rect x="620" y="540" width="110" height="360"/>' +
  '<rect x="770" y="590" width="160" height="310"/><rect x="970" y="550" width="120" height="350"/>' +
  '<rect x="1120" y="610" width="150" height="290"/><rect x="1310" y="560" width="120" height="340"/>' +
  '<rect x="1460" y="620" width="140" height="280"/>' +
  '</g>' +
  '<g opacity=".85">' +
  '<rect x="72" y="616" width="146" height="268" fill="url(#w1)"/>' +
  '<rect x="282" y="576" width="96" height="308" fill="url(#w2)"/>' +
  '<rect x="442" y="636" width="126" height="248" fill="url(#w1)"/>' +
  '<rect x="632" y="556" width="86" height="328" fill="url(#w2)"/>' +
  '<rect x="782" y="606" width="136" height="278" fill="url(#w1)"/>' +
  '<rect x="982" y="566" width="96" height="318" fill="url(#w2)"/>' +
  '<rect x="1132" y="626" width="126" height="258" fill="url(#w1)"/>' +
  '<rect x="1322" y="576" width="96" height="308" fill="url(#w2)"/>' +
  '<rect x="1472" y="636" width="116" height="248" fill="url(#w1)"/>' +
  '</g>' +
  '</svg>'
);

/* ---------- демо-состояние (Минск) ---------- */
function demoState(){
  return {
    hero:{
      eyebrow1:'МАРШРУТ',
      eyebrow2:'МИНСК',
      title:'Road Map поездки',
      dates:'31 июля — 3 августа 2026',
      subtitle:'Четыре дня в Минске: старый город, советский модернизм и кофейни Октябрьской. Включите режим редактирования — и соберите свой маршрут.'
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
    points:[
      {name:'Национальная библиотека', lat:53.9316, lng:27.6462},
      {name:'Верхний город', lat:53.9045, lng:27.5561},
      {name:'Троицкое предместье', lat:53.9086, lng:27.5573},
      {name:'Площадь Победы', lat:53.9084, lng:27.5750}
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
  return s;
}

/* ---------- состояние ---------- */
function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if(s && Array.isArray(s.days) && Array.isArray(s.budget) && Array.isArray(s.points)){
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
let pendingPhotoStop = null;

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
    b.onclick = fn;
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
  const u = state.bg || DEFAULT_BG;
  $('#bg').style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")';
}

/* ---------- hero и курс (статичные editable, привязка один раз) ---------- */
function renderStatics(){
  $('#eyebrow1').textContent = state.hero.eyebrow1;
  $('#eyebrow2').textContent = state.hero.eyebrow2;
  $('#page-title').textContent = state.hero.title;
  $('#dates').textContent = state.hero.dates;
  $('#subtitle').textContent = state.hero.subtitle;
  $('#rate').textContent = fmt(state.rate);
  document.title = state.hero.title || 'Road Map';
}

/* ---------- маркеры Leaflet ---------- */
function pinIcon(name){
  const root = el('div', 'marker');
  const label = el('div', 'marker-label', name);
  root.append(label);
  root.append(el('div', 'marker-pin'));
  const icon = L.divIcon({className:'poi', html:root, iconSize:[0, 0]});
  icon._labelEl = label; // для живого обновления подписи при переименовании
  return icon;
}

/* мини-карта события (создавать после вставки элемента в DOM).
   В режиме редактирования: клик по мини-карте или перетаскивание метки
   задаёт координаты события. */
function initMiniMap(elm, stop, coords, ref){
  const mm = L.map(elm, {zoomControl:false, scrollWheelZoom:false}).setView(coords, 15);
  L.tileLayer(OSM_TILES, {maxZoom:19, attribution:OSM_ATTR}).addTo(mm);
  const icon = pinIcon(stop.name);
  const mk = L.marker(coords, {icon, draggable:editing}).addTo(mm);
  ref.mm = mm;
  ref.marker = mk;
  ref.label = icon._labelEl;
  if(editing){
    const setGeo = (ll, pan) => {
      stop.geo = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5);
      mk.setLatLng(ll);
      if(pan) mm.panTo(ll);
      if(ref.geoInp) ref.geoInp.textContent = stop.geo;
      save();
    };
    mm.on('click', e => setGeo(e.latlng, true));
    mk.on('dragend', () => setGeo(mk.getLatLng(), false));
  }
  miniMaps.push(mm);
}

/* геокодирование названия через Nominatim (OSM, бесплатно) */
function geocodeStop(stop){
  const raw = (stop.geo || '').trim();
  const q = (!raw || parseGeo(raw)) ? (stop.name + ' ' + state.hero.eyebrow2) : raw;
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q))
    .then(r => r.json())
    .then(res => {
      if(!res.length){ alert('Не нашёл место: «' + q + '». Уточните название или введите координаты.'); return; }
      stop.geo = (+res[0].lat).toFixed(5) + ', ' + (+res[0].lon).toFixed(5);
      save(); renderDays();
    })
    .catch(() => alert('Геокодер недоступен — проверьте интернет.'));
}

/* ---------- маршрут по дням ---------- */
function renderDays(){
  miniMaps.forEach(m => m.remove());
  miniMaps = [];
  const pendingMini = [];

  const wrap = $('#days');
  wrap.textContent = '';
  state.days.forEach((day, di) => {
    const card = el('article', 'card day');

    const head = el('div', 'day-head');
    head.append(editableEl('h3', 'day-title', () => day.title, v => day.title = v));
    head.append(rowControls(state.days, di, renderDays, 'Удалить день целиком вместе со всеми пунктами?'));
    card.append(head);

    const stops = el('div', 'stops');
    day.stops.forEach((stop, si) => {
      const s = el('div', 'stop');
      const miniRef = {mm:null, marker:null, label:null, geoInp:null};
      s.append(editableEl('span', 'stop-time', () => stop.time, v => stop.time = v));
      s.append(editableEl('span', 'stop-name', () => stop.name, v => {
        stop.name = v;
        if(miniRef.label) miniRef.label.textContent = v; // подпись на мини-карте обновляется сразу
      }));
      s.append(rowControls(day.stops, si, renderDays));
      s.append(editableEl('div', 'stop-note', () => stop.note, v => stop.note = v));

      // фото и мини-карта
      const media = el('div', 'stop-media');
      if(stop.photo){
        const img = document.createElement('img');
        img.className = 'stop-photo';
        img.alt = stop.name;
        img.src = stop.photo;
        media.append(img);
      }
      const coords = parseGeo(stop.geo);
      if(coords && window.L){
        const mapDiv = el('div', 'stop-map');
        media.append(mapDiv);
        pendingMini.push({elm:mapDiv, stop, coords, ref:miniRef});
      }
      if(media.children.length) s.append(media);

      // инструменты события (только в режиме редактирования)
      const tools = el('div', 'stop-tools edit-only');
      const photoBtn = el('button', 'pill small', stop.photo ? '📷 Заменить фото' : '📷 Добавить фото');
      photoBtn.type = 'button';
      photoBtn.onclick = () => { pendingPhotoStop = stop; $('#stop-photo-file').click(); };
      tools.append(photoBtn);
      if(stop.photo){
        const rm = el('button', 'pill small', '✕ Убрать фото');
        rm.type = 'button';
        rm.onclick = () => { stop.photo = ''; save(); renderDays(); };
        tools.append(rm);
      }
      const geoWrap = el('span', 'stop-geo-wrap');
      geoWrap.append(el('span', null, '📍'));
      const geoInp = editableEl('span', 'stop-geo mono', () => stop.geo || '', v => stop.geo = v.trim());
      geoInp.title = 'Координаты «53.9316, 27.6462» — или нажмите «Найти»';
      miniRef.geoInp = geoInp;
      geoInp.addEventListener('blur', () => {
        const c = parseGeo(stop.geo);
        if(c && miniRef.mm){
          miniRef.marker.setLatLng(c);
          miniRef.mm.setView(c);
        }else if(c && !miniRef.mm){
          renderDays(); // появились координаты — показать мини-карту
        }else if(!c && miniRef.mm && !(stop.geo || '').trim()){
          renderDays(); // координаты стёрли — убрать мини-карту
        }
      });
      geoWrap.append(geoInp);
      const find = el('button', 'pill small', '🔍 Найти');
      find.type = 'button';
      find.title = 'Найти координаты по названию места';
      find.onclick = () => geocodeStop(stop);
      geoWrap.append(find);
      if(!coords){
        const pick = el('button', 'pill small', '📌 Метка на карте');
        pick.type = 'button';
        pick.title = 'Поставить метку в центре города и уточнить кликом или перетаскиванием';
        pick.onclick = () => {
          stop.geo = state.map.lat.toFixed(5) + ', ' + state.map.lng.toFixed(5);
          save(); renderDays();
        };
        geoWrap.append(pick);
      }
      tools.append(geoWrap);
      s.append(tools);

      stops.append(s);
    });
    card.append(stops);

    const add = el('button', 'pill add-stop edit-only', '＋ Добавить пункт');
    add.type = 'button';
    add.onclick = () => {
      day.stops.push({time:'12:00', name:'Новое место', note:'Заметка', photo:'', geo:''});
      save(); renderDays();
    };
    card.append(add);

    wrap.append(card);
  });

  pendingMini.forEach(p => initMiniMap(p.elm, p.stop, p.coords, p.ref));
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

function renderBudget(){
  const tbody = $('#budget-body');
  tbody.textContent = '';
  state.budget.forEach((row, i) => {
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

/* ---------- точки: чипы и редактор ---------- */
let chipNameEls = [];
function renderChips(){
  chipNameEls = [];
  const wrap = $('#chips');
  wrap.textContent = '';
  state.points.forEach((p, i) => {
    const chip = el('button', 'chip');
    chip.type = 'button';
    chip.append(el('span', 'chip-pin', '📍'));
    const nm = el('span', null, p.name);
    chipNameEls.push(nm);
    chip.append(nm);
    chip.onclick = () => {
      if(!map) return;
      const z = Math.max(map.getZoom(), 14);
      if(matchMedia('(prefers-reduced-motion: reduce)').matches) map.setView([p.lat, p.lng], z);
      else map.flyTo([p.lat, p.lng], z, {duration:.6});
    };
    const x = el('span', 'chip-x edit-only', '✕');
    x.title = 'Удалить точку';
    x.onclick = e => {
      e.stopPropagation();
      state.points.splice(i, 1);
      save(); renderChips(); renderMarkers();
    };
    chip.append(x);
    wrap.append(chip);
  });
  renderPointsEditor();
}

/* видимый редактор точек (режим редактирования): переименовать, показать, удалить, добавить */
function renderPointsEditor(){
  const wrap = $('#points-editor');
  wrap.textContent = '';
  state.points.forEach((p, i) => {
    const row = el('div', 'point-row');
    row.append(el('span', null, '📍'));
    row.append(editableEl('span', 'point-name', () => p.name, v => {
      p.name = v;
      if(chipNameEls[i]) chipNameEls[i].textContent = v;     // чип обновляется сразу
      if(markerLabels[i]) markerLabels[i].textContent = v;   // подпись маркера — тоже
    }));
    // координаты можно вставить/поправить прямо здесь — маркер переедет на место
    const coordsEl = editableEl('span', 'point-coords mono', () => p.lat.toFixed(4) + ', ' + p.lng.toFixed(4), () => {});
    coordsEl.title = 'Вставьте координаты «53.9316, 27.6462» — точка переедет туда';
    coordsEl.addEventListener('blur', () => {
      const c = parseGeo(coordsEl.textContent);
      if(c){
        p.lat = c[0]; p.lng = c[1];
        save();
        if(markers[i]) markers[i].setLatLng(c);
        if(map) map.setView(c, Math.max(map.getZoom(), 13));
      }
      coordsEl.textContent = p.lat.toFixed(4) + ', ' + p.lng.toFixed(4);
    });
    row.append(coordsEl);
    const controls = el('span', 'point-controls');
    const ctr = el('button', 'ctl', '⌖');
    ctr.type = 'button'; ctr.title = 'Показать на карте';
    ctr.onclick = () => { if(map) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15)); };
    const del = el('button', 'ctl danger', '✕');
    del.type = 'button'; del.title = 'Удалить точку';
    del.onclick = () => { state.points.splice(i, 1); save(); renderChips(); renderMarkers(); };
    controls.append(ctr, del);
    row.append(controls);
    wrap.append(row);
  });
  const foot = el('div', 'points-foot');
  const add = el('button', 'pill small', '＋ Добавить точку');
  add.type = 'button';
  add.onclick = () => {
    const c = map ? map.getCenter() : {lat:state.map.lat, lng:state.map.lng};
    state.points.push({name:'Новая точка', lat:c.lat, lng:c.lng});
    save(); renderChips(); renderMarkers();
  };
  foot.append(add);
  foot.append(el('span', 'points-hint', 'или кликните по карте · маркеры можно перетаскивать · клик по маркеру — переименовать/удалить'));
  wrap.append(foot);
}

/* ---------- главная карта ---------- */
function mapFallback(){
  const m = $('#map');
  m.classList.add('fallback');
  m.textContent = '';
  const box = el('div');
  box.append(el('p', 'fallback-title', 'Карта недоступна: не загрузилась библиотека Leaflet.'));
  box.append(el('p', 'fallback-note', 'Нужен интернет. Точки маршрута сохраняются и доступны в списке под картой.'));
  m.append(box);
}

function pointForm(p, i){
  const form = el('div', 'marker-form-inline');
  const inp = document.createElement('input');
  inp.value = p.name;
  const ok = el('button', 'ctl', '✓');
  ok.type = 'button'; ok.title = 'Сохранить название';
  ok.onclick = () => { p.name = inp.value.trim() || p.name; save(); renderChips(); renderMarkers(); };
  const del = el('button', 'ctl danger', '✕');
  del.type = 'button'; del.title = 'Удалить точку';
  del.onclick = () => { state.points.splice(i, 1); save(); renderChips(); renderMarkers(); };
  form.append(inp, ok, del);
  return form;
}

let markerLabels = [];
function renderMarkers(){
  if(!map) return;
  markers.forEach(m => m.remove());
  markerLabels = [];
  markers = state.points.map((p, i) => {
    const icon = pinIcon(p.name);
    markerLabels.push(icon._labelEl);
    const m = L.marker([p.lat, p.lng], {icon, draggable:editing});
    m.on('dragend', () => {
      const ll = m.getLatLng();
      p.lat = ll.lat; p.lng = ll.lng;
      save();
      renderPointsEditor(); // обновить координаты в списке
    });
    if(editing) m.bindPopup(pointForm(p, i));
    m.addTo(map);
    return m;
  });
}

function initMap(){
  if(!window.L){ mapFallback(); return; }
  try{
    map = L.map('map').setView([state.map.lat, state.map.lng], state.map.zoom);
    L.tileLayer(OSM_TILES, {maxZoom:19, attribution:OSM_ATTR}).addTo(map);
    map.on('click', e => {
      if(!editing) return;
      state.points.push({name:'Новая точка', lat:e.latlng.lat, lng:e.latlng.lng});
      save(); renderChips(); renderMarkers();
    });
    map.on('moveend zoomend', () => {
      const c = map.getCenter();
      state.map = {lat:c.lat, lng:c.lng, zoom:map.getZoom()};
      save();
    });
    renderMarkers();
  }catch(e){ mapFallback(); }
}

/* ---------- режим редактирования ---------- */
function setEditing(on){
  editing = on;
  document.body.classList.toggle('editing', on);
  document.querySelectorAll('.editable').forEach(n => {
    if(on) n.setAttribute('contenteditable', 'plaintext-only');
    else n.removeAttribute('contenteditable');
  });
  const b = $('#btn-edit');
  b.textContent = on ? '✓ Готово' : '✎ Редактировать';
  b.classList.toggle('active', on);
  renderMarkers(); // перетаскивание и попап-форма — только в режиме редактирования
  renderDays();    // мини-карты становятся кликабельными/перетаскиваемыми
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
    if(!obj || !Array.isArray(obj.days) || !Array.isArray(obj.budget) || !Array.isArray(obj.points)){
      alert('Неверный формат: в файле должны быть поля days, budget и points.');
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
  renderDays();
  renderBudget();
  renderCatEditor();
  renderChips();
  if(map){
    map.setView([state.map.lat, state.map.lng], state.map.zoom);
    renderMarkers();
  }
}

/* ---------- привязка событий ---------- */
bindEditable($('#eyebrow1'), v => state.hero.eyebrow1 = v);
bindEditable($('#eyebrow2'), v => state.hero.eyebrow2 = v);
bindEditable($('#page-title'), v => state.hero.title = v);
bindEditable($('#dates'), v => state.hero.dates = v);
bindEditable($('#subtitle'), v => state.hero.subtitle = v);

const rateEl = $('#rate');
bindEditable(rateEl, v => {
  const n = parseNum(v);
  if(n > 0) state.rate = n;
  renderTotals();
});
rateEl.addEventListener('blur', () => { rateEl.textContent = fmt(state.rate); });

$('#btn-edit').onclick = () => setEditing(!editing);
$('#btn-export').onclick = exportJson;
$('#btn-import').onclick = () => $('#import-file').click();
$('#import-file').addEventListener('change', importJson);
$('#btn-reset').onclick = resetAll;

$('#add-day').onclick = () => {
  state.days.push({
    title:'День ' + (state.days.length + 1) + ' · Новый день',
    stops:[{time:'12:00', name:'Новое место', note:'Заметка', photo:'', geo:''}]
  });
  save(); renderDays();
};
$('#add-row').onclick = () => {
  state.budget.push({name:'Новая строка', cats:[], amount:0, currency:'RUB'});
  save(); renderBudget();
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
    save(); renderDays();
  });
});

/* фон города */
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


const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const now = () => new Date();
const pad = n => String(n).padStart(2, '0');
const dateStr = d =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeStr = d =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const stamp = () =>
  `${pad(now().getHours())}:${pad(now().getMinutes())}:${pad(now().getSeconds())}`;

const defaultUnits = [
  {
    station: 'JRG 1 Lublin',
    name: 'LF 301-25 | GCBA 5/32 MAN TGM 18.320/MotoTruck',
    status: 'Gotowy',
    group: 'PSP'
  },
  {
    station: 'JRG 1 Lublin',
    name: 'LF 301-21 | GBARt 2,5/16 Renault D16/MotoTruck',
    status: 'Gotowy',
    group: 'PSP'
  },
  {
    station: 'OSP',
    name: 'LF 339-66 | GBARt 3/16 Renault D16',
    status: 'Gotowy',
    group: 'OSP'
  },
  {
    station: 'OSP',
    name: 'LF 339-24 | GBARt 2,5/16 Mercedes-Benz Atego',
    status: 'Gotowy',
    group: 'OSP'
  }
];

// Wczytanie zapisanych jednostek z kontrolą zgodności z nową listą.
function loadUnits() {
  try {
    const saved = JSON.parse(localStorage.getItem('swdUnits') || 'null');
    if (
      Array.isArray(saved) &&
      saved.length === 4 &&
      saved.some(u => u.name && u.name.includes('LF 339-66')) &&
      saved.some(u => u.name && u.name.includes('LF 301-25'))
    ) {
      return saved.map((u, i) => ({
        ...defaultUnits[i],
        ...u,
        group: defaultUnits[i].group
      }));
    }
  } catch (e) {
    console.warn('Nie udało się wczytać jednostek:', e);
  }
  return defaultUnits.map(u => ({ ...u }));
}

let units = loadUnits();

function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem('swdEvents') || 'null');
    if (Array.isArray(saved)) {
      return saved.map(e => ({
        ...e,
        units: Array.isArray(e.units) ? e.units.filter(i => i >= 0 && i < 4) : [],
        status: e.status || 'W toku'
      }));
    }
  } catch (e) {
    console.warn('Nie udało się wczytać zdarzeń:', e);
  }

  return [
    {
      id: '2026/001',
      date: '2026-10-26',
      time: '20:22',
      town: 'Lublin',
      address: 'al. Warszawska 12',
      type: 'MZ',
      description: 'Powalone drzewo blokuje jeden pas jezdni.',
      status: 'W toku',
      lead: 'JRG 1 Lublin',
      units: [],
      channel: 'Telefon'
    },
    {
      id: '2026/002',
      date: '2026-10-26',
      time: '19:40',
      town: 'Jastków',
      address: 'ul. Lubelska 8',
      type: 'P',
      description: 'Zadymienie w budynku mieszkalnym. Zgłaszający oczekuje przed obiektem.',
      status: 'W toku',
      lead: 'JRG 1 Lublin',
      units: [],
      channel: 'Telefon'
    },
    {
      id: '2026/003',
      date: '2026-10-26',
      time: '18:12',
      town: 'Moszenki',
      address: 'ul. Szkolna 4',
      type: 'AF',
      description: 'Uruchomienie czujki — brak potwierdzenia pożaru.',
      status: 'Zakończone',
      lead: 'JRG 1 Lublin',
      units: [],
      channel: 'Telefon'
    }
  ];
}

let events = loadEvents();
let selected = events[0]?.id || null;

let radio = {};
try {
  radio = JSON.parse(localStorage.getItem('swdRadio') || '{}') || {};
} catch (e) {
  radio = {};
}

function save() {
  localStorage.setItem('swdUnits', JSON.stringify(units));
  localStorage.setItem('swdEvents', JSON.stringify(events));
  localStorage.setItem('swdRadio', JSON.stringify(radio));
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function unitStatus(u) {
  return u.status === 'Gotowy'
    ? ''
    : u.status === 'Wyłączony'
      ? 'off'
      : 'busy';
}

function getStatusClass(status) {
  const s = String(status || '').toLowerCase();

  if (
    s.includes('nowe') ||
    s.includes('przyjęte') ||
    s.includes('przyjete')
  ) {
    return 'status-new';
  }

  if (s.includes('opanowane')) {
    return 'status-controlled';
  }

  if (
    s.includes('zakończone') ||
    s.includes('zakonczone')
  ) {
    return 'status-finished';
  }

  return 'status-progress';
}

function getActiveTab() {
  return document.querySelector('[data-tab].active')?.dataset.tab || 'PSP';
}

function renderUnits() {
  const activeTab = getActiveTab();
  const visibleUnits = units
    .map((u, i) => ({ ...u, i }))
    .filter(u => u.group === activeTab);

  const groups = {};
  visibleUnits.forEach(u => {
    (groups[u.station] ??= []).push(u);
  });

  $('#unitColumns').innerHTML = Object.entries(groups)
    .map(([station, arr]) => `
      <div class="unit-column">
        <h3>${esc(station)}</h3>
        ${arr.map(u => `
          <div class="vehicle" title="${esc(u.status)}">
            <i class="dot ${unitStatus(u)}"></i>
            ${esc(u.name)}
            <span style="margin-left:auto;color:#555">${esc(u.status)}</span>
          </div>
        `).join('')}
      </div>
    `).join('');

  $('#radioUnit').innerHTML = units.map((u, i) => `
    <option value="${i}">
      ${esc(u.group)} — ${esc(u.name)}
    </option>
  `).join('');
}

function renderEvents() {
  const q = ($('#search')?.value || '').toLowerCase();

  const filtered = events.filter(e =>
    `${e.id} ${e.town} ${e.address} ${e.description}`
      .toLowerCase()
      .includes(q)
  );

  $('#eventsBody').innerHTML = filtered.map(e => `
    <tr
      data-id="${esc(e.id)}"
      class="${getStatusClass(e.status)} ${e.id === selected ? 'selected' : ''}"
    >
      <td>${esc(e.id)}</td>
      <td>${esc(e.date)} ${esc(e.time)}</td>
      <td>${esc(e.lead || 'JRG 1 Lublin')}</td>
      <td>${esc(e.town)}, ${esc(e.address)}</td>
      <td>${e.units.length}</td>
      <td>${esc(e.type)}</td>
      <td>${esc(e.description)}</td>
      <td>${esc(e.status)}</td>
    </tr>
  `).join('');

  $$('#eventsBody tr').forEach(tr => {
    tr.onclick = () => {
      selected = tr.dataset.id;
      renderAll();
    };
  });

  renderDetails();
}

function renderDetails() {
  const e = events.find(x => x.id === selected);

  $('#detailNo').textContent = e?.id || '—';
  $('#radioEvent').textContent = e?.id || 'brak zdarzenia';

  $('#selectedInfo').textContent = e
    ? `${e.id} — ${e.town}, ${e.address} | ${e.status}`
    : 'Wybierz zdarzenie';

  $('#details').innerHTML = e
    ? `
      <div class="details-grid">
        <b>Rodzaj:</b>
        <span>${esc(e.type)} — ${esc(({
          P: 'Pożar',
          MZ: 'Miejscowe zagrożenie',
          AF: 'Alarm fałszywy',
          CW: 'Ćwiczenia',
          WG: 'Wypadek',
          BL: 'Zdarzenie budowlane',
          ZPR: 'Zdarzenie',
          PZR: 'Zdarzenie'
        })[e.type] || 'Zdarzenie')}</span>

        <b>Adres:</b>
        <span>${esc(e.town)}, ${esc(e.address)}</span>

        <b>Opis:</b>
        <span>${esc(e.description)}</span>

        <b>Status:</b>
        <span>${esc(e.status)}</span>

        <b>Zastępy:</b>
        <span>
          ${e.units.map(i => esc(units[i]?.name || '')).filter(Boolean).join('<br>') || 'Brak zadysponowanych zastępów'}
        </span>
      </div>
    `
    : '<p>Wybierz zdarzenie, aby zobaczyć szczegóły.</p>';

  const msgs = radio[e?.id] || [];

  $('#radioLog').innerHTML = msgs.map(m => `
    <div class="radio-message ${m.sender.includes('OSP') ? 'unit' : 'dispatch'}">
      <div class="meta">
        ${esc(m.time)}　${esc(m.sender)} → ${esc(m.to || 'kanał zdarzenia')}
      </div>
      ${esc(m.text)}
    </div>
  `).join('') || '<span style="color:#777">Brak korespondencji dla tego zdarzenia.</span>';

  $('#radioLog').scrollTop = $('#radioLog').scrollHeight;
}

function renderAll() {
  renderUnits();
  renderEvents();
  save();
}

function playFormatkaSound() {
  const audio = new Audio('sounds/selektywne.mp3');
  audio.volume = 1;
  audio.play().catch(() => {
    console.warn('Przeglądarka zablokowała dźwięk. Kliknij stronę i spróbuj ponownie.');
  });
}

function openModal() {
  const f = $('#eventForm');
  f.reset();
  f.date.value = dateStr(now());
  f.time.value = timeStr(now());
  $('#eventModal').classList.remove('hidden');
}

function closeModal() {
  $('#eventModal').classList.add('hidden');
}

$('#newEvent').onclick = openModal;
$('#closeModal').onclick = closeModal;
$('#cancelModal').onclick = closeModal;
$('#search').oninput = renderEvents;

$('#eventForm').onsubmit = e => {
  e.preventDefault();

  const f = e.target;
  const d = new FormData(f);
  const n = events.reduce(
    (m, x) => Math.max(m, Number(x.id.split('/').pop()) || 0),
    0
  ) + 1;

  const ev = {
    id: `2026/${String(n).padStart(3, '0')}`,
    date: d.get('date'),
    time: d.get('time'),
    town: d.get('town'),
    address: d.get('address'),
    type: d.get('type'),
    description: d.get('description'),
    status: 'Nowe zgłoszenie',
    lead: d.get('lead') || d.get('station') || 'JRG 1 Lublin',
    units: [],
    notes: d.get('notes'),
    channel: d.get('channel')
  };

  events.unshift(ev);
  selected = ev.id;
  closeModal();
  renderAll();
  playFormatkaSound();

  addMessage(
    'SKKM Lublin',
    `Przyjęto zgłoszenie ${ev.id}: ${ev.type}, ${ev.town}, ${ev.address}.`,
    ''
  );
};

function addMessage(sender, text, to) {
  const e = events.find(x => x.id === selected);

  if (!e) {
    alert('Najpierw wybierz zdarzenie.');
    return;
  }

  radio[e.id] ??= [];
  radio[e.id].push({ sender, text, to, time: stamp() });

  renderDetails();
  save();
}

$$('[data-radio]').forEach(b => {
  b.onclick = () => {
    const u = units[Number($('#radioUnit').value)];
    const sender = [
      'Przyjąłem',
      'Prawidłowo',
      'Zrozumiałem'
    ].includes(b.dataset.radio)
      ? 'SKKM Lublin'
      : u?.station || 'OSP';

    addMessage(sender, b.dataset.radio, u?.station || '');
  };
});

$('#sendRadio').onclick = () => {
  const text = $('#radioText').value.trim();
  if (!text) return;

  let sender = $('#radioSender').value;
  const u = units[Number($('#radioUnit').value)];

  if (sender === 'Jednostka OSP') {
    sender = u?.station || sender;
  }

  addMessage(
    sender,
    text,
    sender === 'SKKM Lublin' ? (u?.station || '') : 'SKKM Lublin'
  );

  $('#radioText').value = '';
};

$('#radioText').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('#sendRadio').click();
});

function openDispatch() {
  const e = events.find(x => x.id === selected);

  if (!e) {
    alert('Wybierz zdarzenie w tabeli.');
    return;
  }

  $('#dispatchTarget').textContent =
    `Zdarzenie ${e.id} — ${e.town}, ${e.address}`;

  $('#dispatchList').innerHTML = units.map((u, i) => `
    <label class="dispatch-item">
      <span class="dot ${unitStatus(u)}"></span>
      <span>
        <b>${esc(u.name)}</b><br>
        <small>${esc(u.group)} · ${esc(u.station)} · ${esc(u.status)}</small>
      </span>
      <input
        type="checkbox"
        value="${i}"
        ${e.units.includes(i) ? 'checked' : ''}
        ${u.status === 'Wyłączony' ? 'disabled' : ''}
      >
    </label>
  `).join('');

  $('#dispatchModal').classList.remove('hidden');
}

$('#dispatchBtn').onclick = openDispatch;

$('#closeDispatch').onclick = () => {
  $('#dispatchModal').classList.add('hidden');
};

$('#cancelDispatch').onclick = () => {
  $('#dispatchModal').classList.add('hidden');
};

$('#saveDispatch').onclick = () => {
  const e = events.find(x => x.id === selected);
  if (!e) return;

  const chosen = $$('#dispatchList input:checked')
    .map(x => Number(x.value));

  units.forEach((u, i) => {
    if (e.units.includes(i) && !chosen.includes(i)) {
      u.status = 'Gotowy';
    }

    if (chosen.includes(i)) {
      u.status = 'Zadysponowany';
    }
  });

  e.units = chosen;

  // Po zadysponowaniu zdarzenie przechodzi do obsługi.
  if (chosen.length > 0 && getStatusClass(e.status) === 'status-new') {
    e.status = 'W toku';
  }

  $('#dispatchModal').classList.add('hidden');
  renderAll();

  addMessage(
    'SKKM Lublin',
    `Dysponuję siły i środki do zdarzenia ${e.id} w miejscowości ${e.town}.`,
    'wybrane jednostki'
  );
};

$('#finishBtn').onclick = () => {
  const e = events.find(x => x.id === selected);

  if (!e) {
    alert('Wybierz zdarzenie w tabeli.');
    return;
  }

  e.status = 'Zakończone';

  e.units.forEach(i => {
    if (units[i]) units[i].status = 'Gotowy';
  });

  e.units = [];

  renderAll();

  addMessage(
    'SKKM Lublin',
    `Zdarzenie ${e.id} zakończone.`,
    ''
  );
};

$$('[data-tab]').forEach(b => {
  b.onclick = () => {
    $$('[data-tab]').forEach(x => {
      x.classList.toggle('active', x === b);
    });

    document.body.dataset.tab = b.dataset.tab;
    renderUnits();
  };
});

function tick() {
  $('#clock').textContent = `${dateStr(now())}　${stamp()}`;
}

setInterval(tick, 1000);
tick();
renderAll();

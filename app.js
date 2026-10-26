
'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

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

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch (error) {
    console.warn(`Nie udało się odczytać ${key}:`, error);
    return fallback;
  }
}

function loadUnits() {
  const saved = readStorage('swdUnits', null);

  // Używamy wyłącznie aktualnie ustalonej listy czterech zastępów.
  // Zachowujemy ich zapisane statusy, jeśli pasują do nazw.
  if (!Array.isArray(saved)) {
    return defaultUnits.map(unit => ({ ...unit }));
  }

  return defaultUnits.map(unit => {
    const previous = saved.find(item =>
      item && item.name && item.name.startsWith(unit.name.split(' | ')[0])
    );

    return {
      ...unit,
      status: previous?.status || 'Gotowy'
    };
  });
}

function loadEvents() {
  const saved = readStorage('swdEvents', null);

  if (Array.isArray(saved)) {
    return saved.map(event => ({
      ...event,
      units: Array.isArray(event.units)
        ? event.units.filter(i => Number.isInteger(i) && i >= 0 && i < 4)
        : [],
      status: event.status || 'W toku',
      lead: event.lead || 'SKKM Lublin'
    }));
  }

  return [
    {
      id: `${now().getFullYear()}/001`,
      date: dateStr(now()),
      time: timeStr(now()),
      town: 'Lublin',
      address: 'al. Warszawska 12',
      type: 'MZ',
      description: 'Powalone drzewo blokuje jeden pas jezdni.',
      status: 'W toku',
      lead: 'SKKM Lublin',
      units: [1],
      channel: 'Telefon',
      notes: ''
    },
    {
      id: `${now().getFullYear()}/002`,
      date: dateStr(now()),
      time: timeStr(now()),
      town: 'Jastków',
      address: 'ul. Lubelska 8',
      type: 'P',
      description: 'Zadymienie w budynku mieszkalnym.',
      status: 'W toku',
      lead: 'SKKM Lublin',
      units: [2, 3],
      channel: 'Telefon',
      notes: ''
    },
    {
      id: `${now().getFullYear()}/003`,
      date: dateStr(now()),
      time: timeStr(now()),
      town: 'Moszenki',
      address: 'ul. Szkolna 4',
      type: 'AF',
      description: 'Uruchomienie czujki — brak potwierdzenia pożaru.',
      status: 'Zakończone',
      lead: 'SKKM Lublin',
      units: [],
      channel: 'System alarmowy',
      notes: ''
    }
  ];
}

let units = loadUnits();
let events = loadEvents();
let selected = events[0]?.id || null;
let radio = readStorage('swdRadio', {});

function save() {
  try {
    localStorage.setItem('swdUnits', JSON.stringify(units));
    localStorage.setItem('swdEvents', JSON.stringify(events));
    localStorage.setItem('swdRadio', JSON.stringify(radio));
  } catch (error) {
    console.warn('Nie udało się zapisać danych:', error);
  }
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function unitStatus(unit) {
  if (unit.status === 'Gotowy') return '';
  if (unit.status === 'Wyłączony') return 'off';
  return 'busy';
}

function statusClass(status) {
  const value = String(status || '').toLowerCase();

  if (value.includes('nowe') || value.includes('przyjęte')) {
    return 'status-new';
  }

  if (value.includes('opanowane')) {
    return 'status-controlled';
  }

  if (value.includes('zakończone')) {
    return 'status-finished';
  }

  return 'status-progress';
}

function eventTypeName(type) {
  return ({
    P: 'Pożar',
    MZ: 'Miejscowe zagrożenie',
    AF: 'Alarm fałszywy',
    CW: 'Ćwiczenia'
  })[type] || 'Inne zdarzenie';
}

function currentTab() {
  return document.querySelector('[data-tab].active')?.dataset.tab || 'PSP';
}

function renderUnits() {
  const tab = currentTab();

  const visible = units
    .map((unit, index) => ({ ...unit, index }))
    .filter(unit => unit.group === tab);

  const groups = {};

  visible.forEach(unit => {
    (groups[unit.station] ??= []).push(unit);
  });

  $('#unitColumns').innerHTML = Object.entries(groups)
    .map(([station, list]) => `
      <div class="unit-column">
        <h3>${esc(station)}</h3>
        ${list.map(unit => `
          <div class="vehicle" title="${esc(unit.status)}">
            <i class="dot ${unitStatus(unit)}"></i>
            <span>${esc(unit.name)}</span>
            <span style="margin-left:auto;white-space:nowrap">
              ${esc(unit.status)}
            </span>
          </div>
        `).join('')}
      </div>
    `).join('');

  $('#unitCount').textContent = `${units.length} zastępy`;

  $('#radioUnit').innerHTML = units.map((unit, index) => `
    <option value="${index}">
      ${esc(unit.group)} — ${esc(unit.name)}
    </option>
  `).join('');
}

function renderEvents() {
  const query = ($('#search').value || '').trim().toLowerCase();

  const filtered = events.filter(event =>
    [
      event.id,
      event.town,
      event.address,
      event.description,
      event.type,
      event.status
    ].join(' ').toLowerCase().includes(query)
  );

  $('#eventsBody').innerHTML = filtered.map(event => `
    <tr
      data-id="${esc(event.id)}"
      class="${statusClass(event.status)} ${event.id === selected ? 'selected' : ''}"
    >
      <td>${esc(event.id)}</td>
      <td>${esc(event.date)} ${esc(event.time)}</td>
      <td>${esc(event.town)}, ${esc(event.address)}</td>
      <td>${esc(event.type)}</td>
      <td>${esc(event.description)}</td>
      <td>${event.units.length}</td>
      <td>${esc(event.status)}</td>
    </tr>
  `).join('');

  $$('#eventsBody tr').forEach(row => {
    row.addEventListener('click', () => {
      selected = row.dataset.id;
      renderAll();
    });
  });

  renderDetails();
}

function renderDetails() {
  const event = events.find(item => item.id === selected);

  $('#detailNo').textContent = event?.id || '—';
  $('#radioEvent').textContent = event?.id || 'Brak zdarzenia';

  $('#selectedInfo').textContent = event
    ? `${event.id} — ${event.town}, ${event.address} | ${event.status}`
    : 'Nie wybrano zdarzenia';

  $('#details').innerHTML = event
    ? `
      <div class="details-grid">
        <b>Rodzaj:</b>
        <span>${esc(event.type)} — ${esc(eventTypeName(event.type))}</span>

        <b>Data:</b>
        <span>${esc(event.date)} ${esc(event.time)}</span>

        <b>Miejsce:</b>
        <span>${esc(event.town)}, ${esc(event.address)}</span>

        <b>Obiekt:</b>
        <span>${esc(event.object || 'Nie podano')}</span>

        <b>Opis:</b>
        <span>${esc(event.description)}</span>

        <b>Status:</b>
        <span>${esc(event.status)}</span>

        <b>Przyjęto przez:</b>
        <span>${esc(event.lead)}</span>

        <b>Kanał:</b>
        <span>${esc(event.channel || 'Nie podano')}</span>

        <b>Zgłaszający:</b>
        <span>${esc(event.caller || 'Nie podano')}</span>

        <b>Telefon:</b>
        <span>${esc(event.phone || 'Nie podano')}</span>

        <b>Uwagi:</b>
        <span>${esc(event.notes || 'Brak')}</span>

        <b>Zastępy:</b>
        <span>
          ${event.units
            .map(index => units[index]?.name)
            .filter(Boolean)
            .map(esc)
            .join('<br>') || 'Brak zadysponowanych zastępów'}
        </span>
      </div>
    `
    : '<p>Wybierz zdarzenie z rejestru.</p>';

  const messages = radio[event?.id] || [];

  $('#radioLog').innerHTML = messages.map(message => `
    <div class="radio-message ${message.sender.includes('OSP') ? 'unit' : 'dispatch'}">
      <div class="meta">
        ${esc(message.time)}　${esc(message.sender)} → ${esc(message.to || 'kanał zdarzenia')}
      </div>
      ${esc(message.text)}
    </div>
  `).join('') || '<span>Brak korespondencji.</span>';

  $('#radioLog').scrollTop = $('#radioLog').scrollHeight;
}

function renderAll() {
  renderUnits();
  renderEvents();
  save();
}

function playAlarm() {
  const audio = new Audio('sounds/selektywne.mp3');
  audio.volume = 1;

  audio.play().catch(error => {
    console.warn('Nie udało się odtworzyć alarmu:', error);
  });
}

function openEventModal() {
  const form = $('#eventForm');
  form.reset();

  form.elements.date.value = dateStr(now());
  form.elements.time.value = timeStr(now());

  $('#eventModal').classList.remove('hidden');
}

function closeEventModal() {
  $('#eventModal').classList.add('hidden');
}

$('#newEvent').addEventListener('click', openEventModal);
$('#closeModal').addEventListener('click', closeEventModal);
$('#cancelModal').addEventListener('click', closeEventModal);
$('#search').addEventListener('input', renderEvents);

$('#eventForm').addEventListener('submit', event => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);

  const nextNumber = events.reduce((max, item) => {
    const number = Number(item.id.split('/').pop()) || 0;
    return Math.max(max, number);
  }, 0) + 1;

  const incident = {
    id: `${now().getFullYear()}/${String(nextNumber).padStart(3, '0')}`,
    date: data.get('date'),
    time: data.get('time'),
    town: String(data.get('town') || '').trim(),
    address: String(data.get('address') || '').trim(),
    object: String(data.get('object') || '').trim(),
    type: data.get('type'),
    description: String(data.get('description') || '').trim(),
    status: 'Nowe zgłoszenie',
    lead: String(data.get('lead') || 'SKKM Lublin').trim(),
    caller: String(data.get('caller') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    units: [],
    notes: String(data.get('notes') || '').trim(),
    channel: data.get('channel'),
    services: {
      prm: form.elements.prm.checked,
      police: form.elements.police.checked,
      gas: form.elements.gas.checked,
      energy: form.elements.energy.checked
    }
  };

  events.unshift(incident);
  selected = incident.id;

  closeEventModal();
  renderAll();
  playAlarm();

  addMessage(
    'SKKM Lublin',
    `Przyjęto zgłoszenie ${incident.id}: ${incident.type}, ${incident.town}, ${incident.address}.`,
    ''
  );
});

function addMessage(sender, text, to = '') {
  const event = events.find(item => item.id === selected);

  if (!event) {
    alert('Najpierw wybierz zdarzenie.');
    return;
  }

  radio[event.id] ??= [];
  radio[event.id].push({
    sender,
    text,
    to,
    time: stamp()
  });

  renderDetails();
  save();
}

$$('[data-radio]').forEach(button => {
  button.addEventListener('click', () => {
    const unit = units[Number($('#radioUnit').value)];
    const selectedSender = $('#radioSender').value;

    const sender = selectedSender === 'Jednostka OSP'
      ? (unit?.station || 'OSP')
      : selectedSender;

    addMessage(sender, button.dataset.radio, 'kanał zdarzenia');
  });
});

$('#sendRadio').addEventListener('click', () => {
  const text = $('#radioText').value.trim();

  if (!text) return;

  const selectedSender = $('#radioSender').value;
  const unit = units[Number($('#radioUnit').value)];

  const sender = selectedSender === 'Jednostka OSP'
    ? (unit?.station || 'OSP')
    : selectedSender;

  addMessage(sender, text, 'kanał zdarzenia');
  $('#radioText').value = '';
  $('#radioText').focus();
});

$('#radioText').addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    $('#sendRadio').click();
  }
});

function openDispatch() {
  const event = events.find(item => item.id === selected);

  if (!event) {
    alert('Najpierw wybierz zdarzenie w rejestrze.');
    return;
  }

  $('#dispatchTarget').textContent =
    `${event.id} — ${event.town}, ${event.address}`;

  $('#dispatchList').innerHTML = units.map((unit, index) => {
    const assignedElsewhere = events.some(other =>
      other.id !== event.id &&
      other.status !== 'Zakończone' &&
      other.units.includes(index)
    );

    const unavailable =
      unit.status === 'Wyłączony' ||
      (assignedElsewhere && !event.units.includes(index));

    return `
      <label class="dispatch-item">
        <span class="dot ${unitStatus(unit)}"></span>
        <span>
          <b>${esc(unit.name)}</b><br>
          <small>${esc(unit.group)} · ${esc(unit.station)} · ${esc(
            assignedElsewhere && !event.units.includes(index)
              ? 'Zadysponowany do innego zdarzenia'
              : unit.status
          )}</small>
        </span>
        <input
          type="checkbox"
          value="${index}"
          ${event.units.includes(index) ? 'checked' : ''}
          ${unavailable ? 'disabled' : ''}
        >
      </label>
    `;
  }).join('');

  $('#dispatchModal').classList.remove('hidden');
}

$('#dispatchBtn').addEventListener('click', openDispatch);

function closeDispatchModal() {
  $('#dispatchModal').classList.add('hidden');
}

$('#closeDispatch').addEventListener('click', closeDispatchModal);
$('#cancelDispatch').addEventListener('click', closeDispatchModal);

$('#saveDispatch').addEventListener('click', () => {
  const event = events.find(item => item.id === selected);

  if (!event) return;

  const previous = [...event.units];

  const chosen = $$('#dispatchList input:checked')
    .map(input => Number(input.value));

  previous.forEach(index => {
    if (!chosen.includes(index) && units[index]) {
      const assignedElsewhere = events.some(other =>
        other.id !== event.id &&
        other.status !== 'Zakończone' &&
        other.units.includes(index)
      );

      if (!assignedElsewhere) {
        units[index].status = 'Gotowy';
      }
    }
  });

  chosen.forEach(index => {
    if (units[index]) {
      units[index].status = 'Zadysponowany';
    }
  });

  event.units = chosen;

  if (chosen.length > 0 && statusClass(event.status) === 'status-new') {
    event.status = 'W toku';
  }

  closeDispatchModal();
  renderAll();

  addMessage(
    'SKKM Lublin',
    chosen.length
      ? `Zadysponowano ${chosen.length} zastępów do zdarzenia ${event.id}.`
      : `Usunięto dyspozycję zastępów dla zdarzenia ${event.id}.`,
    'kanał zdarzenia'
  );
});

function updateEventStatus(newStatus) {
  const event = events.find(item => item.id === selected);

  if (!event) {
    alert('Najpierw wybierz zdarzenie.');
    return;
  }

  if (event.status === 'Zakończone') {
    alert('Zdarzenie zostało już zakończone.');
    return;
  }

  event.status = newStatus;

  if (newStatus === 'Zakończone') {
    event.units.forEach(index => {
      if (!units[index]) return;

      const assignedElsewhere = events.some(other =>
        other.id !== event.id &&
        other.status !== 'Zakończone' &&
        other.units.includes(index)
      );

      if (!assignedElsewhere) {
        units[index].status = 'Gotowy';
      }
    });

    event.units = [];
  }

  renderAll();

  addMessage(
    'SKKM Lublin',
    `Zmieniono status zdarzenia ${event.id} na: ${newStatus}.`,
    'kanał zdarzenia'
  );
}

$('#controlBtn').addEventListener('click', () => {
  updateEventStatus('Opanowane');
});

$('#finishBtn').addEventListener('click', () => {
  updateEventStatus('Zakończone');
});

$$('[data-tab]').forEach(button => {
  button.addEventListener('click', () => {
    $$('[data-tab]').forEach(tab => {
      tab.classList.toggle('active', tab === button);
    });

    document.body.dataset.tab = button.dataset.tab;
    renderUnits();
  });
});

function tick() {
  $('#clock').textContent = `${dateStr(now())}　${stamp()}`;
}

setInterval(tick, 1000);
tick();
renderAll();

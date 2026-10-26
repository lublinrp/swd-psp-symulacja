(() => {
  "use strict";
  const STORAGE_KEY = "swd-symulacja-v1";
  const statuses = ["Gotowy", "Zadysponowany", "Wyjazd", "Na miejscu", "Powrót", "Wyłączony"];
  const typeClass = type => type === "Miejscowe zagrożenie" ? "mz" : type === "Alarm fałszywy" ? "af" : "";
  const shortType = type => type === "Miejscowe zagrożenie" ? "MZ" : type === "Alarm fałszywy" ? "AF" : type === "Ćwiczenia" ? "ĆW" : "P";
  const now = new Date();
  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const isoTime = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  const stamp = () => new Date().toLocaleString("pl-PL", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const uid = prefix => `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(Math.random()*90+10)}`;
  const seed = {
    events: [
      {id:"2026/001",type:"Miejscowe zagrożenie",address:"Lublin, ul. Nadbystrzycka 12",date:isoDate(now),time:isoTime(now),description:"Powalone drzewo blokuje jeden pas jezdni.",notes:"Przykładowe zdarzenie szkoleniowe.",priority:"normal",status:"active",unitIds:["u1"],created:Date.now()-1000*60*18},
      {id:"2026/002",type:"Pożar",address:"Jastków, ul. Lubelska 8",date:isoDate(now),time:isoTime(new Date(now.getTime()-1000*60*42)),description:"Zadymienie w budynku mieszkalnym. Zgłaszający oczekuje przed obiektem.",notes:"Zweryfikować informację po dojeździe.",priority:"high",status:"active",unitIds:["u2","u3"],created:Date.now()-1000*60*42},
      {id:"2026/003",type:"Alarm fałszywy",address:"Moszenki, ul. Szkolna 4",date:isoDate(now),time:isoTime(new Date(now.getTime()-1000*60*130)),description:"Uruchomienie czujki — brak potwierdzenia pożaru.",notes:"Wpis demonstracyjny.",priority:"normal",status:"done",unitIds:["u4"],created:Date.now()-1000*60*130}
    ],
    units: [
      {id:"u1",station:"JRG 1 Lublin",code:"301[L]21",vehicle:"GBA 2,5/25",status:"Na miejscu",eventId:"2026/001"},
      {id:"u2",station:"JRG 1 Lublin",code:"301[L]25",vehicle:"GCBA 5/32",status:"Wyjazd",eventId:"2026/002"},
      {id:"u3",station:"OSP KSRG Moszenki",code:"309[L]37",vehicle:"GBA 3/16",status:"Zadysponowany",eventId:"2026/002"},
      {id:"u4",station:"OSP KSRG Moszenki",code:"309[L]38",vehicle:"GLM",status:"Gotowy",eventId:null},
      {id:"u5",station:"JRG 2 Lublin",code:"302[L]21",vehicle:"GBA 2,5/25",status:"Gotowy",eventId:null},
      {id:"u6",station:"OSP KSRG Jastków",code:"309[L]39",vehicle:"GCBA 5/32",status:"Wyłączony",eventId:null}
    ],
    log: [
      {time:stamp(),message:"Uruchomiono lokalną symulację SWD."},
      {time:stamp(),message:"Załadowano przykładową bazę zdarzeń i zastępów."}
    ],
    nextNumber:4
  };
  let state = loadState();
  let currentDetailId = null;
  let toastTimer = null;

  const $ = id => document.getElementById(id);
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.events) && Array.isArray(parsed.units) && Array.isArray(parsed.log)) return parsed;
      }
    } catch (e) { console.warn("Nie udało się odczytać zapisu", e); }
    return structuredClone(seed);
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn("Nie udało się zapisać danych", e); }
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function log(message) {
    state.log.unshift({time:stamp(),message});
    state.log = state.log.slice(0,500);
    save();
  }
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.remove("hidden");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add("hidden"), 2800);
  }
  function eventById(id) { return state.events.find(e => e.id === id); }
  function unitById(id) { return state.units.find(u => u.id === id); }
  function assignedUnits(event) { return state.units.filter(u => (event.unitIds || []).includes(u.id)); }
  function eventStatus(event) { return event.status === "done" ? "Zakończone" : "W toku"; }
  function formatDate(date) { if (!date) return "—"; const [y,m,d] = date.split("-"); return `${d}.${m}.${y}`; }

  function renderAll() {
    renderEvents(); renderUnits(); renderFeed(); renderUnitSummary(); renderLog(); renderStats();
    $("eventCount").textContent = state.events.filter(e=>e.status==="active").length;
  }
  function renderStats() {
    $("statAll").textContent = state.events.length;
    $("statActive").textContent = state.events.filter(e=>e.status==="active").length;
    $("statDone").textContent = state.events.filter(e=>e.status==="done").length;
    $("statUnits").textContent = state.units.filter(u=>u.eventId && u.status!=="Gotowy" && u.status!=="Wyłączony").length;
  }
  function renderEvents() {
    const q = $("searchEvents").value.trim().toLowerCase();
    const filter = $("filterStatus").value;
    const list = [...state.events].sort((a,b)=>(b.created||0)-(a.created||0)).filter(e => {
      const hay = [e.id,e.type,e.address,e.description,e.notes].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (filter==="all" || e.status===filter);
    });
    $("eventsBody").innerHTML = list.map(e => {
      const units = assignedUnits(e);
      return `<tr data-event="${escapeHtml(e.id)}">
        <td><span class="event-id">${escapeHtml(e.id)}</span>${e.priority==="high" ? '<div style="margin-top:5px"><span class="priority-badge">▲ PILNE</span></div>' : ""}</td>
        <td><span class="type-badge ${typeClass(e.type)}">${shortType(e.type)} · ${escapeHtml(e.type)}</span></td>
        <td>${escapeHtml(e.address)}<div class="assigned-text" style="margin-top:4px">${escapeHtml(e.description)}</div></td>
        <td>${formatDate(e.date)}<div class="assigned-text" style="margin-top:4px">${escapeHtml(e.time)}</div></td>
        <td><span class="status-badge ${e.status}">${eventStatus(e)}</span></td>
        <td><span class="mini-count">${units.length} zast.</span></td>
        <td><button class="row-action" data-open="${escapeHtml(e.id)}">Otwórz ↗</button></td>
      </tr>`;
    }).join("");
    $("eventsEmpty").classList.toggle("hidden", list.length>0);
    $("tableSummary").textContent = `${list.length} z ${state.events.length} zdarzeń`;
  }
  function renderUnits() {
    const q = $("searchUnits").value.trim().toLowerCase();
    const list = state.units.filter(u => [u.station,u.code,u.vehicle,u.status].join(" ").toLowerCase().includes(q));
    $("unitsBody").innerHTML = list.map(u => {
      const event = u.eventId ? eventById(u.eventId) : null;
      return `<tr>
        <td>${escapeHtml(u.station)}</td><td><span class="unit-code">${escapeHtml(u.code)}</span></td>
        <td>${escapeHtml(u.vehicle)}</td>
        <td><select class="unit-status-select" data-status-unit="${escapeHtml(u.id)}" aria-label="Status ${escapeHtml(u.code)}">${statuses.map(s=>`<option ${s===u.status?"selected":""}>${s}</option>`).join("")}</select></td>
        <td>${event ? `<span class="assigned-text">${escapeHtml(event.id)} · ${escapeHtml(event.address)}</span>` : '<span class="assigned-text">Brak przypisania</span>'}</td>
        <td><button class="row-action" data-unit-edit="${escapeHtml(u.id)}">Edytuj</button></td>
      </tr>`;
    }).join("");
    $("unitsEmpty").classList.toggle("hidden", list.length>0);
    $("unitsSummary").textContent = `${state.units.length} zastępów w bazie`;
  }
  function renderFeed() {
    const list = state.events.filter(e=>e.status==="active").sort((a,b)=>(b.created||0)-(a.created||0)).slice(0,5);
    $("activeFeed").innerHTML = list.length ? list.map(e=>`<div class="feed-item" data-event="${escapeHtml(e.id)}"><div class="feed-top"><span class="feed-number">${escapeHtml(e.id)}</span><span class="status-badge active">W TOKU</span></div><div class="feed-address">${escapeHtml(e.address)}</div><div class="feed-meta"><span>${shortType(e.type)} · ${escapeHtml(e.type)}</span><span>${assignedUnits(e).length} zast.</span></div></div>`).join("") : '<div class="feed-empty">Brak aktywnych zdarzeń.</div>';
  }
  function renderUnitSummary() {
    const counts = [
      ["Gotowe",state.units.filter(u=>u.status==="Gotowy").length,""],
      ["Zadysponowane / wyjazd",state.units.filter(u=>["Zadysponowany","Wyjazd"].includes(u.status)).length,"busy"],
      ["Na miejscu",state.units.filter(u=>u.status==="Na miejscu").length,"busy"],
      ["Powrót",state.units.filter(u=>u.status==="Powrót").length,""],
      ["Wyłączone",state.units.filter(u=>u.status==="Wyłączony").length,"off"]
    ];
    $("unitSummary").innerHTML = counts.map(([label,count,cls])=>`<div class="unit-stat"><span class="unit-dot ${cls}"></span><span>${label}</span><strong>${count}</strong></div>`).join("");
  }
  function renderLog() {
    $("logList").innerHTML = state.log.length ? state.log.map(item=>`<div class="log-item"><div class="log-time">${escapeHtml(item.time)}</div><div class="log-message">${item.message}</div></div>`).join("") : '<div class="empty-state">Dziennik jest pusty.</div>';
  }
  function showView(name) {
    document.querySelectorAll(".view").forEach(el=>el.classList.add("hidden"));
    $("view-"+name).classList.remove("hidden");
    document.querySelectorAll("[data-view]").forEach(el=>el.classList.toggle("active",el.classList.contains("tool") && el.dataset.view===name));
    document.querySelectorAll(".side-link").forEach(el=>el.classList.toggle("selected",el.dataset.view===name));
  }
  function openEventForm() {
    $("eventForm").reset();
    $("eventForm").elements.date.value = isoDate(new Date());
    $("eventForm").elements.time.value = isoTime(new Date());
    $("modalBackdrop").classList.remove("hidden");
    $("eventForm").elements.address.focus();
  }
  function closeEventForm() { $("modalBackdrop").classList.add("hidden"); }
  function openDetail(id) {
    const e = eventById(id); if (!e) return;
    currentDetailId = id;
    const units = assignedUnits(e);
    $("detailTitle").textContent = `Zdarzenie ${e.id}`;
    $("detailContent").innerHTML = `
      <div class="detail-grid">
        <div class="detail-field"><span>RODZAJ ZDARZENIA</span><strong>${escapeHtml(e.type)} ${e.priority==="high"?" · PILNE":""}</strong></div>
        <div class="detail-field"><span>STATUS</span><strong>${eventStatus(e)}</strong></div>
        <div class="detail-field"><span>ADRES</span><strong>${escapeHtml(e.address)}</strong></div>
        <div class="detail-field"><span>DATA I GODZINA ZGŁOSZENIA</span><strong>${formatDate(e.date)} · ${escapeHtml(e.time)}</strong></div>
        <div class="detail-field" style="grid-column:1/-1"><span>OPIS ZGŁOSZENIA</span><strong>${escapeHtml(e.description)}</strong></div>
        <div class="detail-field" style="grid-column:1/-1"><span>DODATKOWE INFORMACJE</span><strong>${escapeHtml(e.notes||"Brak dodatkowych informacji")}</strong></div>
      </div>
      <div class="detail-section-title">PRZYPISANE ZASTĘPY</div>
      <div class="dispatch-list">${state.units.map(u=>`<div class="dispatch-row"><label><input type="checkbox" data-dispatch="${escapeHtml(u.id)}" ${units.some(x=>x.id===u.id)?"checked":""} ${u.status==="Wyłączony"&&!units.some(x=>x.id===u.id)?"disabled":""}><span><strong>${escapeHtml(u.code)} · ${escapeHtml(u.station)}</strong><small>${escapeHtml(u.vehicle)} · ${escapeHtml(u.status)}</small></span></label>${u.eventId && u.eventId!==e.id?'<small>Przypisany gdzie indziej</small>':""}</div>`).join("")}</div>
      <div class="detail-actions">
        <button class="secondary-btn" id="saveDispatchBtn">Zapisz obsadę</button>
        ${e.status==="active"?'<button class="primary-btn" id="finishEventBtn">✓ Zakończ zdarzenie</button>':'<button class="secondary-btn" id="reopenEventBtn">↻ Przywróć do aktywnych</button>'}
        <button class="secondary-btn" id="editEventBtn">Edytuj dane</button>
        <button class="secondary-btn" id="deleteEventBtn">Usuń zdarzenie</button>
      </div>`;
    $("detailBackdrop").classList.remove("hidden");
    $("saveDispatchBtn").addEventListener("click",saveDispatch);
    const finish = $("finishEventBtn"); if(finish) finish.addEventListener("click",()=>finishEvent(id));
    const reopen = $("reopenEventBtn"); if(reopen) reopen.addEventListener("click",()=>reopenEvent(id));
    $("editEventBtn").addEventListener("click",()=>editEvent(id));
    $("deleteEventBtn").addEventListener("click",()=>deleteEvent(id));
  }
  function closeDetail() { $("detailBackdrop").classList.add("hidden"); currentDetailId=null; }
  function saveDispatch() {
    const e = eventById(currentDetailId); if(!e) return;
    const selected = [...$("detailContent").querySelectorAll("[data-dispatch]:checked")].map(el=>el.dataset.dispatch);
    // Release units previously assigned to this event but no longer selected.
    (e.unitIds||[]).filter(id=>!selected.includes(id)).forEach(id=>{
      const u=unitById(id); if(u){u.eventId=null;if(u.status!=="Wyłączony")u.status="Gotowy";}
    });
    const accepted=[];
    selected.forEach(id=>{
      const u=unitById(id); if(!u)return;
      if(u.eventId && u.eventId!==e.id){toast(`${u.code} jest już przypisany do innego zdarzenia.`);return;}
      u.eventId=e.id;
      if(u.status==="Gotowy")u.status="Zadysponowany";
      accepted.push(id);
    });
    e.unitIds=accepted;
    log(`Zmieniono obsadę zdarzenia <strong>${escapeHtml(e.id)}</strong> — przypisano ${accepted.length} zastępów.`);
    save(); renderAll(); openDetail(e.id); toast("Zapisano przypisanie zastępów.");
  }
  function finishEvent(id) {
    const e=eventById(id);if(!e)return;
    e.status="done";
    (e.unitIds||[]).forEach(uid=>{const u=unitById(uid);if(u){u.eventId=null;if(u.status!=="Wyłączony")u.status="Gotowy";}});
    e.unitIds=[];
    log(`Zakończono zdarzenie <strong>${escapeHtml(e.id)}</strong>. Zastępy zwolniono.`);
    save();renderAll();openDetail(id);toast("Zdarzenie zakończone.");
  }
  function reopenEvent(id) {
    const e=eventById(id);if(!e)return;e.status="active";
    log(`Przywrócono zdarzenie <strong>${escapeHtml(e.id)}</strong> do aktywnych.`);
    save();renderAll();openDetail(id);toast("Zdarzenie ponownie aktywne.");
  }
  function editEvent(id) {
    const e=eventById(id);if(!e)return;
    closeDetail(); openEventForm();
    const f=$("eventForm"); f.elements.type.value=e.type;f.elements.priority.value=e.priority||"normal";f.elements.address.value=e.address;f.elements.date.value=e.date;f.elements.time.value=e.time;f.elements.description.value=e.description;f.elements.notes.value=e.notes||"";
    f.dataset.editId=id; $("modalTitle").textContent=`Edycja zdarzenia ${id}`;
  }
  function deleteEvent(id) {
    const e=eventById(id);if(!e)return;
    if(!confirm(`Usunąć zdarzenie ${id}? Tej operacji nie można cofnąć.`))return;
    state.units.forEach(u=>{if(u.eventId===id){u.eventId=null;if(u.status!=="Wyłączony")u.status="Gotowy";}});
    state.events=state.events.filter(x=>x.id!==id);
    log(`Usunięto zdarzenie <strong>${escapeHtml(id)}</strong>.`);
    closeDetail();save();renderAll();toast("Usunięto zdarzenie.");
  }
  function nextEventId() {
    const year=new Date().getFullYear();
    const nums=state.events.map(e=>Number((e.id.split("/")[1]||"0"))).filter(Number.isFinite);
    const n=Math.max(state.nextNumber||1,...nums.map(x=>x+1),1);
    state.nextNumber=n+1;
    return `${year}/${String(n).padStart(3,"0")}`;
  }
  function submitEvent(form) {
    const data=new FormData(form);
    const editId=form.dataset.editId;
    if(editId) {
      const e=eventById(editId); if(e){e.type=data.get("type");e.priority=data.get("priority");e.address=data.get("address").trim();e.date=data.get("date");e.time=data.get("time");e.description=data.get("description").trim();e.notes=data.get("notes").trim();}
      delete form.dataset.editId; $("modalTitle").textContent="Nowe zdarzenie";
      log(`Zaktualizowano dane zdarzenia <strong>${escapeHtml(editId)}</strong>.`);
      closeEventForm();save();renderAll();toast("Zapisano zmiany.");return;
    }
    const id=nextEventId();
    state.events.unshift({id,type:data.get("type"),priority:data.get("priority"),address:data.get("address").trim(),date:data.get("date"),time:data.get("time"),description:data.get("description").trim(),notes:data.get("notes").trim(),status:"active",unitIds:[],created:Date.now()});
    log(`Zarejestrowano nowe zdarzenie <strong>${escapeHtml(id)}</strong> — ${escapeHtml(data.get("type"))}, ${escapeHtml(data.get("address").trim())}.`);
    closeEventForm();save();renderAll();toast(`Zarejestrowano zdarzenie ${id}.`);openDetail(id);
  }
  function addUnit() {
    const station=prompt("Nazwa jednostki (np. OSP KSRG Moszenki):");if(!station||!station.trim())return;
    const code=prompt("Oznaczenie zastępu (np. 309[L]37):");if(!code||!code.trim())return;
    const vehicle=prompt("Pojazd / typ (np. GBA 3/16):");if(!vehicle||!vehicle.trim())return;
    state.units.push({id:uid("u"),station:station.trim(),code:code.trim(),vehicle:vehicle.trim(),status:"Gotowy",eventId:null});
    log(`Dodano zastęp <strong>${escapeHtml(code.trim())}</strong> — ${escapeHtml(station.trim())}.`);
    save();renderAll();toast("Dodano zastęp do bazy.");
  }
  function editUnit(id) {
    const u=unitById(id);if(!u)return;
    const station=prompt("Nazwa jednostki:",u.station);if(station===null)return;
    const code=prompt("Oznaczenie zastępu:",u.code);if(code===null)return;
    const vehicle=prompt("Pojazd / typ:",u.vehicle);if(vehicle===null)return;
    u.station=station.trim()||u.station;u.code=code.trim()||u.code;u.vehicle=vehicle.trim()||u.vehicle;
    log(`Zmieniono dane zastępu <strong>${escapeHtml(u.code)}</strong>.`);
    save();renderAll();toast("Zaktualizowano zastęp.");
  }
  function exportCsv() {
    const rows=[["Numer","Rodzaj","Adres","Data","Godzina","Status","Priorytet","Opis","Zastępy"]];
    state.events.forEach(e=>rows.push([e.id,e.type,e.address,e.date,e.time,eventStatus(e),e.priority,e.description,assignedUnits(e).map(u=>u.code).join("; ")]));
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="swd-zdarzenia.csv";a.click();URL.revokeObjectURL(url);toast("Wyeksportowano rejestr do CSV.");
  }

  document.querySelectorAll("[data-view]").forEach(el=>el.addEventListener("click",()=>showView(el.dataset.view)));
  $("newEventBtn").addEventListener("click",()=>{delete $("eventForm").dataset.editId;$("modalTitle").textContent="Nowe zdarzenie";openEventForm();});
  $("closeModal").addEventListener("click",closeEventForm);$("cancelModal").addEventListener("click",closeEventForm);
  $("closeDetail").addEventListener("click",closeDetail);
  $("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeEventForm();});
  $("detailBackdrop").addEventListener("click",e=>{if(e.target===$("detailBackdrop"))closeDetail();});
  $("eventForm").addEventListener("submit",e=>{e.preventDefault();submitEvent(e.currentTarget);});
  $("searchEvents").addEventListener("input",renderEvents);$("filterStatus").addEventListener("change",renderEvents);
  $("searchUnits").addEventListener("input",renderUnits);
  $("eventsBody").addEventListener("click",e=>{const button=e.target.closest("[data-open]");const row=e.target.closest("[data-event]");const id=button?.dataset.open||row?.dataset.event;if(id)openDetail(id);});
  $("activeFeed").addEventListener("click",e=>{const row=e.target.closest("[data-event]");if(row)openDetail(row.dataset.event);});
  $("unitsBody").addEventListener("change",e=>{
    const id=e.target.dataset.statusUnit;if(!id)return;const u=unitById(id);if(!u)return;
    const old=u.status;u.status=e.target.value;
    if(u.status==="Gotowy"||u.status==="Wyłączony"){if(u.eventId){const ev=eventById(u.eventId);if(ev)ev.unitIds=(ev.unitIds||[]).filter(x=>x!==u.id);}u.eventId=null;}
    log(`Zmieniono status zastępu <strong>${escapeHtml(u.code)}</strong>: ${escapeHtml(old)} → ${escapeHtml(u.status)}.`);
    save();renderAll();toast(`Status ${u.code}: ${u.status}.`);
  });
  $("unitsBody").addEventListener("click",e=>{const btn=e.target.closest("[data-unit-edit]");if(btn)editUnit(btn.dataset.unitEdit);});
  $("addUnitBtn").addEventListener("click",addUnit);
  $("exportBtn").addEventListener("click",exportCsv);
  $("clearLogBtn").addEventListener("click",()=>{if(confirm("Wyczyścić cały dziennik operacyjny?")){state.log=[];save();renderLog();toast("Dziennik wyczyszczony.");}});
  $("helpBtn").addEventListener("click",()=>alert("SWD — symulacja do Fire RP\n\nTo niezależny projekt demonstracyjny. Dane zapisują się lokalnie w tej przeglądarce i nie są wysyłane do żadnego serwera.\n\nWskazówka: wybierz „Nowe zdarzenie”, a następnie otwórz szczegóły, aby przypisać zastępy."));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeEventForm();closeDetail();}});
  setInterval(()=>{$("clock").textContent=new Date().toLocaleTimeString("pl-PL",{hour12:false});},250);
  renderAll();
})();
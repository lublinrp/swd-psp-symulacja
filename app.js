const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const now=()=>new Date(), pad=n=>String(n).padStart(2,'0'), dateStr=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, timeStr=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`, stamp=()=>`${pad(now().getHours())}:${pad(now().getMinutes())}:${pad(now().getSeconds())}`;
const defaultUnits=[
 {station:'JRG 1 Lublin',name:'LF 301-21 GBA-Rt 2,5/16 RENAULT D16',status:'Gotowy'},
 {station:'JRG 1 Lublin',name:'LF 301-22 GBA-Rt 3,5/16 RENAULT D16',status:'Gotowy'},
 {station:'JRG 1 Lublin',name:'LF 301-25 GCBA-Rt 5/40 MAN',status:'Gotowy'},
 {station:'JRG 2 Lublin',name:'LF 302-21 GCBA-Rt 5/32 MAN',status:'Gotowy'},
 {station:'JRG 2 Lublin',name:'LF 302-43 SRt Mercedes',status:'Gotowy'},
 {station:'JRG 3 Lublin',name:'LF 303-21 GBA-Rt 2,9/24/5 MAN',status:'Gotowy'},
 {station:'JRG 4 Lublin',name:'LF 304-21 GBA-Rt 2,5/16 RENAULT',status:'Gotowy'},
 {station:'JRG Bełżyce',name:'LF 305-21 GBA-Rt 3,5/16 RENAULT',status:'Gotowy'},
 {station:'OSP Moszenki',name:'309[L]21 GBA 3/16',status:'Gotowy'},
 {station:'OSP Moszenki',name:'309[L]22 GCBA 5/32',status:'Gotowy'},
 {station:'OSP Jastków',name:'309[L]39 GBA 2,5/16',status:'Gotowy'},
 {station:'OSP Mętów',name:'309[L]38 GBA 2,5/16',status:'Gotowy'}
];
let units=JSON.parse(localStorage.getItem('swdUnits')||'null')||defaultUnits;
let events=JSON.parse(localStorage.getItem('swdEvents')||'null')||[
{id:'2026/001',date:'2026-10-26',time:'20:22',town:'Lublin',address:'al. Warszawska 12',type:'MZ',description:'Powalone drzewo blokuje jeden pas jezdni.',status:'W toku',priority:'Normalny',units:[0]},
{id:'2026/002',date:'2026-10-26',time:'19:40',town:'Jastków',address:'ul. Lubelska 8',type:'P',description:'Zadymienie w budynku mieszkalnym. Zgłaszający oczekuje przed obiektem.',status:'W toku',priority:'Pilny',units:[8,9]},
{id:'2026/003',date:'2026-10-26',time:'18:12',town:'Moszenki',address:'ul. Szkolna 4',type:'AF',description:'Uruchomienie czujki — brak potwierdzenia pożaru.',status:'Zakończone',priority:'Normalny',units:[10]}
];
let selected=events[0]?.id||null, radio=JSON.parse(localStorage.getItem('swdRadio')||'{}');
function save(){localStorage.setItem('swdUnits',JSON.stringify(units));localStorage.setItem('swdEvents',JSON.stringify(events));localStorage.setItem('swdRadio',JSON.stringify(radio))}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function unitStatus(u){return u.status==='Gotowy'?'':u.status==='Wyłączony'?'off':'busy'}
function renderUnits(){let groups={};units.forEach((u,i)=>(groups[u.station]??=[]).push({...u,i}));$('#unitColumns').innerHTML=Object.entries(groups).map(([g,arr])=>`<div class="unit-column"><h3>${esc(g)}</h3>${arr.map(u=>`<div class="vehicle" title="${esc(u.status)}"><i class="dot ${unitStatus(u)}"></i>${esc(u.name)}</div>`).join('')}</div>`).join('');$('#radioUnit').innerHTML=units.map((u,i)=>`<option value="${i}">${esc(u.station)} — ${esc(u.name)}</option>`).join('')}
function renderEvents(){let q=$('#search').value.toLowerCase();$('#eventsBody').innerHTML=events.filter(e=>(e.id+' '+e.town+' '+e.address+' '+e.description).toLowerCase().includes(q)).map(e=>`<tr data-id="${e.id}" class="${e.id===selected?'selected':''}"><td>${esc(e.id)}</td><td>${esc(e.date)} ${esc(e.time)}</td><td>${esc(e.lead||'JRG 1 Lublin')}</td><td>${esc(e.town)}, ${esc(e.address)}</td><td>${e.units.length}</td><td>${esc(e.type)}</td><td>${esc(e.description)}</td><td>${esc(e.status)}</td></tr>`).join('');$$('#eventsBody tr').forEach(tr=>tr.onclick=()=>{selected=tr.dataset.id;renderAll()});renderDetails()}
function renderDetails(){let e=events.find(x=>x.id===selected);$('#detailNo').textContent=e?.id||'—';$('#radioEvent').textContent=e?.id||'brak zdarzenia';$('#selectedInfo').textContent=e?`${e.id} — ${e.town}, ${e.address}`:'Wybierz zdarzenie';$('#details').innerHTML=e?`<div class="details-grid"><b>Rodzaj:</b><span>${esc(e.type)} — ${esc(({P:'Pożar',MZ:'Miejscowe zagrożenie',AF:'Alarm fałszywy',CW:'Ćwiczenia'}[e.type]||''))}</span><b>Adres:</b><span>${esc(e.town)}, ${esc(e.address)}</span><b>Opis:</b><span>${esc(e.description)}</span><b>Priorytet:</b><span>${esc(e.priority)}</span><b>Status:</b><span>${esc(e.status)}</span><b>Zastępy:</b><span>${e.units.map(i=>esc(units[i]?.name||'')).join('<br>')||'Brak zadysponowanych zastępów'}</span></div>`:'<p>Wybierz zdarzenie, aby zobaczyć szczegóły.</p>';let msgs=radio[e?.id]||[];$('#radioLog').innerHTML=msgs.map(m=>`<div class="radio-message ${m.sender.includes('OSP')?'unit':'dispatch'}"><div class="meta">${esc(m.time)}　${esc(m.sender)} → ${esc(m.to||'kanał zdarzenia')}</div>${esc(m.text)}</div>`).join('')||'<span style="color:#777">Brak korespondencji dla tego zdarzenia.</span>';$('#radioLog').scrollTop=$('#radioLog').scrollHeight}
function renderAll(){renderUnits();renderEvents();save()}
function openModal(){let f=$('#eventForm');f.reset();f.date.value=dateStr(now());f.time.value=timeStr(now());$('#eventModal').classList.remove('hidden')}
function closeModal(){$('#eventModal').classList.add('hidden')}
$('#newEvent').onclick=openModal;$('#closeModal').onclick=closeModal;$('#cancelModal').onclick=closeModal;$('#search').oninput=renderEvents;
$('#eventForm').onsubmit=e=>{e.preventDefault();let f=e.target,d=new FormData(f),n=Number(events.reduce((m,x)=>Math.max(m,Number(x.id.split('/').pop())||0),0))+1;let ev={id:`2026/${String(n).padStart(3,'0')}`,date:d.get('date'),time:d.get('time'),town:d.get('town'),address:d.get('address'),type:d.get('type'),description:d.get('description'),status:'W toku',priority:d.get('priority'),lead:d.get('lead'),units:[],notes:d.get('notes'),channel:d.get('channel')};events.unshift(ev);selected=ev.id;closeModal();renderAll();addMessage('SKKM Lublin',`Przyjęto zgłoszenie ${ev.id}: ${ev.type}, ${ev.town}, ${ev.address}.`,'');};
function addMessage(sender,text,to){let e=events.find(x=>x.id===selected);if(!e){alert('Najpierw wybierz zdarzenie.');return}radio[e.id]??=[];radio[e.id].push({sender,text,to,time:stamp()});renderDetails();save()}
$$('[data-radio]').forEach(b=>b.onclick=()=>{let val=Number($('#radioUnit').value),u=units[val],sender=b.dataset.radio==='Przyjąłem'||b.dataset.radio==='Prawidłowo'||b.dataset.radio==='Zrozumiałem'?'SKKM Lublin':u?.station||'OSP';addMessage(sender,b.dataset.radio,sender==='SKKM Lublin'?u?.station:u?.station)});
$('#sendRadio').onclick=()=>{let text=$('#radioText').value.trim();if(!text)return;let sender=$('#radioSender').value;if(sender==='Jednostka OSP')sender=units[Number($('#radioUnit').value)]?.station||sender;addMessage(sender,text,sender==='SKKM Lublin'?units[Number($('#radioUnit').value)]?.station:'SKKM Lublin');$('#radioText').value=''};
$('#radioText').addEventListener('keydown',e=>{if(e.key==='Enter')$('#sendRadio').click()});
function openDispatch(){let e=events.find(x=>x.id===selected);if(!e){alert('Wybierz zdarzenie w tabeli.');return}$('#dispatchTarget').textContent=`Zdarzenie ${e.id} — ${e.town}, ${e.address}`;$('#dispatchList').innerHTML=units.map((u,i)=>`<label class="dispatch-item"><span class="dot ${unitStatus(u)}"></span><span><b>${esc(u.name)}</b><br><small>${esc(u.station)} · ${esc(u.status)}</small></span><input type="checkbox" value="${i}" ${e.units.includes(i)?'checked':''} ${u.status==='Wyłączony'?'disabled':''}></label>`).join('');$('#dispatchModal').classList.remove('hidden')}
$('#dispatchBtn').onclick=openDispatch;$('#closeDispatch').onclick=$('#cancelDispatch').onclick=()=>$('#dispatchModal').classList.add('hidden');
$('#saveDispatch').onclick=()=>{let e=events.find(x=>x.id===selected);if(!e)return;let chosen=$$('#dispatchList input:checked').map(x=>Number(x.value));units.forEach((u,i)=>{if(e.units.includes(i)&&!chosen.includes(i))u.status='Gotowy';if(chosen.includes(i))u.status='Zadysponowany'});e.units=chosen;$('#dispatchModal').classList.add('hidden');renderAll();addMessage('SKKM Lublin',`Dysponuję siły i środki do zdarzenia ${e.id} w miejscowości ${e.town}.`,'wybrane jednostki')};
$('#finishBtn').onclick=()=>{let e=events.find(x=>x.id===selected);if(!e)return;e.status='Zakończone';e.units.forEach(i=>{if(units[i])units[i].status='Gotowy'});renderAll();addMessage('SKKM Lublin',`Zdarzenie ${e.id} zakończone.`,'')};
$$('[data-tab]').forEach(b=>b.onclick=()=>{$$('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));document.body.dataset.tab=b.dataset.tab});
function tick(){$('#clock').textContent=`${dateStr(now())}　${stamp()}`}setInterval(tick,1000);tick();renderAll();
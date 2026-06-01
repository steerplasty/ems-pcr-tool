// EMS PCR TOOL v2 — app.js

const S = {}; // global state
let reportFormat = 'chart';

// ── TIMES ──────────────────────────────────────────────────
const TIME_KEYS = [
  {key:'tDispatched',  label:'Dispatched'},
  {key:'tEnRoute',     label:'En Route'},
  {key:'tOnScene',     label:'On Scene'},
  {key:'tPtContact',   label:'Pt Contact'},
  {key:'tDeparture',   label:'Departure'},
  {key:'tArrivalFac',  label:'Arrival at Facility'},
  {key:'tBackInSvc',   label:'Back in Service'},
];

function buildTimesGrid() {
  const grid = document.getElementById('times-grid');
  if (!grid) return;
  grid.innerHTML = '';
  TIME_KEYS.forEach(t => {
    const cell = document.createElement('div');
    cell.className = 'time-cell';
    cell.innerHTML = `<div class="time-cell-label">${t.label}</div><input type="time" data-tkey="${t.key}" id="time-${t.key}">`;
    grid.appendChild(cell);
  });
  grid.querySelectorAll('input[data-tkey]').forEach(inp => {
    inp.addEventListener('change', () => {
      S[inp.dataset.tkey] = inp.value;
      refreshAllTimeRefChips();
      render();
    });
  });
}

function refreshAllTimeRefChips() {
  document.querySelectorAll('.time-ref-group').forEach(group => {
    const key = group.dataset.refkey;
    group.innerHTML = '';
    TIME_KEYS.forEach(t => {
      if (!S[t.key]) return;
      const chip = document.createElement('button');
      chip.className = 'time-ref-chip' + (S[key] === t.key ? ' selected' : '');
      chip.textContent = t.label + ' (' + S[t.key] + ')';
      chip.addEventListener('click', () => {
        S[key] = (S[key] === t.key) ? null : t.key;
        refreshAllTimeRefChips();
        render();
      });
      group.appendChild(chip);
    });
    if (!group.children.length) {
      group.innerHTML = '<span style="font-size:11px;color:var(--text3);font-style:italic;">Fill in times above first</span>';
    }
  });
}

function getTime(key) {
  const tkey = S[key];
  if (!tkey) return null;
  const t = TIME_KEYS.find(x => x.key === tkey);
  return t ? t.label + ' (' + S[tkey] + ')' : null;
}

// ── CHIPS ───────────────────────────────────────────────────
function initChips() {
  document.querySelectorAll('.chip[data-key]').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.key;
      const val = chip.dataset.val;
      const mode = chip.dataset.mode || 'single';

      if (mode === 'symptom') {
        if (!chip.classList.contains('affirmed') && !chip.classList.contains('denied')) {
          chip.classList.add('affirmed');
          _symptomSet(key, val, 'affirmed');
        } else if (chip.classList.contains('affirmed')) {
          chip.classList.remove('affirmed'); chip.classList.add('denied');
          _symptomSet(key, val, 'denied');
        } else {
          chip.classList.remove('denied');
          _symptomRemove(key, val);
        }
        render(); return;
      }

      if (mode === 'multi') {
        if (!S[key]) S[key] = [];
        if (chip.classList.contains('selected')) {
          chip.classList.remove('selected');
          S[key] = S[key].filter(v => v !== val);
        } else {
          chip.classList.add('selected');
          S[key].push(val);
        }
      } else {
        // single — togglable
        if (chip.classList.contains('selected')) {
          chip.classList.remove('selected');
          delete S[key];
        } else {
          document.querySelectorAll(`.chip[data-key="${key}"]`).forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          S[key] = val;
        }
        handleConditionals(key, S[key]);
      }
      render();
    });
  });
}

function _symptomSet(key, val, type) {
  if (!S[key]) S[key] = {affirmed:[],denied:[]};
  S[key].affirmed = S[key].affirmed.filter(v=>v!==val);
  S[key].denied   = S[key].denied.filter(v=>v!==val);
  S[key][type].push(val);
}
function _symptomRemove(key, val) {
  if (!S[key]) return;
  S[key].affirmed = S[key].affirmed.filter(v=>v!==val);
  S[key].denied   = S[key].denied.filter(v=>v!==val);
}

// ── CONDITIONALS ─────────────────────────────────────────────
function handleConditionals(key, val) {
  if (key === 'callType') {
    ['medical','trauma','alarm','assist'].forEach(t => {
      const el = document.getElementById('cond-'+t);
      if (el) el.classList.toggle('visible', val && val.toLowerCase()===t);
    });
  }
  if (key === 'sceneSafety') {
    const el = document.getElementById('cond-unsafe');
    if (el) el.classList.toggle('visible', val==='Unsafe');
  }
}

// ── INPUTS ───────────────────────────────────────────────────
function initInputs() {
  document.querySelectorAll('[data-state]').forEach(el => {
    el.addEventListener('input',  () => { S[el.dataset.state] = el.value; render(); });
    el.addEventListener('change', () => { S[el.dataset.state] = el.value; render(); });
  });
  const btn = document.getElementById('btn-today');
  if (btn) btn.addEventListener('click', () => {
    const d = document.getElementById('input-date');
    if (d) { d.value = new Date().toISOString().split('T')[0]; S.callDate = d.value; render(); }
  });
}

// ── PAIN ─────────────────────────────────────────────────────
function initPain() {
  document.querySelectorAll('.pain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        delete S.painScale;
      } else {
        document.querySelectorAll('.pain-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        S.painScale = btn.dataset.val;
      }
      render();
    });
  });
}

// ── GCS ──────────────────────────────────────────────────────
function initGCS() {
  ['gcs-eye','gcs-verbal','gcs-motor'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      S[id] = parseInt(el.value)||0;
      const total = (S['gcs-eye']||0)+(S['gcs-verbal']||0)+(S['gcs-motor']||0);
      S.gcsTotal = total;
      const t = document.getElementById('gcs-total');
      if (t) t.textContent = total||'--';
      render();
    });
  });
}

// ── VITALS ───────────────────────────────────────────────────
let vitalRows = [];

function buildVitalsCard(idx) {
  const card = document.createElement('div');
  card.className = 'vitals-card';
  card.dataset.idx = idx;
  card.innerHTML = `
    <div class="vitals-card-header">
      <span class="vitals-card-title">Vitals Set ${idx+1}</span>
      <button class="vitals-remove" title="Remove">×</button>
    </div>
    <div class="vitals-fields">
      ${['HR','BP','RR','SpO2','BGL','Temp','EtCO2','SpCO'].map(f=>`
        <div class="vf">
          <span class="vf-label">${f}</span>
          <input type="text" placeholder="--" data-vfield="${f}" data-vidx="${idx}">
        </div>`).join('')}
      <div class="vf" style="grid-column:span 2;">
        <span class="vf-label">Location</span>
        <select data-vfield="location" data-vidx="${idx}">
          <option>On Scene</option><option>In Ambulance</option><option>En Route</option>
        </select>
      </div>
      <div class="vf" style="grid-column:span 2;">
        <span class="vf-label">Time obtained</span>
        <div class="time-ref-group" data-refkey="vtime_${idx}" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px;"></div>
      </div>
    </div>`;
  card.querySelector('.vitals-remove').addEventListener('click', () => {
    vitalRows.splice(idx,1);
    rebuildVitals();
  });
  card.querySelectorAll('input[data-vfield],select[data-vfield]').forEach(inp => {
    inp.addEventListener('input',  () => { collectVitals(); render(); });
    inp.addEventListener('change', () => { collectVitals(); render(); });
  });
  return card;
}

function rebuildVitals() {
  const wrap = document.getElementById('vitals-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  vitalRows.forEach((_,i) => wrap.appendChild(buildVitalsCard(i)));
  refreshAllTimeRefChips();
  collectVitals();
  render();
}

function collectVitals() {
  S.vitals = [];
  document.querySelectorAll('.vitals-card').forEach((card,i) => {
    const row = {idx:i};
    card.querySelectorAll('[data-vfield]').forEach(inp => {
      row[inp.dataset.vfield] = inp.value;
    });
    const tref = S['vtime_'+i];
    row.time = tref ? (TIME_KEYS.find(t=>t.key===tref)?.label||'') + (S[tref]?' ('+S[tref]+')':'') : '';
    S.vitals.push(row);
  });
}

function initVitals() {
  vitalRows = [{}];
  rebuildVitals();
  const btn = document.getElementById('btn-add-vitals');
  if (btn) btn.addEventListener('click', () => { vitalRows.push({}); rebuildVitals(); });
}

// ── MEDICATIONS ──────────────────────────────────────────────
S.medsGiven = [];

function addMed(name) {
  if (S.medsGiven.find(m=>m.name===name)) return;
  S.medsGiven.push({name, dose:'', route:'', effect:'', time:null});
  renderMedCards();
  render();
}

function removeMed(name) {
  S.medsGiven = S.medsGiven.filter(m=>m.name!==name);
  // deselect chip
  document.querySelectorAll(`.chip[data-key="medGive"][data-val="${name}"]`).forEach(c=>c.classList.remove('selected'));
  renderMedCards();
  render();
}

function renderMedCards() {
  const list = document.getElementById('med-selected-list');
  if (!list) return;
  list.innerHTML = '';
  S.medsGiven.forEach((med,i) => {
    const card = document.createElement('div');
    card.className = 'med-card';
    card.innerHTML = `
      <div class="med-card-header">
        <span class="med-name">${med.name}</span>
        <button class="med-remove" data-med="${med.name}">×</button>
      </div>
      <div class="med-fields">
        <div class="vf"><span class="vf-label">Dose</span><input type="text" placeholder="e.g. 325 mg" data-mfield="dose" data-mi="${i}"></div>
        <div class="vf"><span class="vf-label">Route</span>
          <select data-mfield="route" data-mi="${i}">
            <option value="">Route...</option>
            <option>IV</option><option>IM</option><option>IN</option><option>PO</option>
            <option>SQ</option><option>INH</option><option>IO</option><option>SL</option>
          </select>
        </div>
        <div class="vf"><span class="vf-label">Effect</span>
          <select data-mfield="effect" data-mi="${i}">
            <option value="">Effect...</option>
            <option>Effective</option><option>No Effect</option><option>Adverse</option>
          </select>
        </div>
        <div class="vf"><span class="vf-label">Time given</span>
          <div class="time-ref-group" data-refkey="medtime_${i}" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
        </div>
      </div>`;
    card.querySelector('.med-remove').addEventListener('click', e => removeMed(e.target.dataset.med));
    card.querySelectorAll('[data-mfield]').forEach(inp => {
      inp.value = med[inp.dataset.mfield] || '';
      inp.addEventListener('change', () => {
        S.medsGiven[inp.dataset.mi][inp.dataset.mfield] = inp.value;
        render();
      });
      inp.addEventListener('input', () => {
        S.medsGiven[inp.dataset.mi][inp.dataset.mfield] = inp.value;
        render();
      });
    });
    list.appendChild(card);
  });
  refreshAllTimeRefChips();
}

function initMedChips() {
  document.querySelectorAll('.chip[data-key="medGive"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val;
      if (chip.classList.contains('selected')) {
        chip.classList.remove('selected');
        removeMed(val);
      } else {
        chip.classList.add('selected');
        addMed(val);
      }
    });
  });
}

// ── SCROLL SPY ───────────────────────────────────────────────
function initScrollSpy() {
  const sections = document.querySelectorAll('.section-block');
  const navItems = document.querySelectorAll('.nav-item');
  const main = document.getElementById('main-content');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(n => n.classList.toggle('active', n.dataset.section === id));
        // update progress
        const idx = Array.from(sections).indexOf(entry.target);
        const pct = ((idx+1)/sections.length)*100;
        const pf = document.getElementById('progress-fill');
        if (pf) pf.style.width = pct+'%';
      }
    });
  },{root: main, threshold:0.2});

  sections.forEach(s => obs.observe(s));

  navItems.forEach(n => {
    n.addEventListener('click', () => {
      const el = document.getElementById(n.dataset.section);
      if (el) el.scrollIntoView({behavior:'smooth'});
    });
  });
}

// ── FORMAT TOGGLE ─────────────────────────────────────────────
function initFormatToggle() {
  document.querySelectorAll('.fmt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fmt-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      reportFormat = btn.dataset.fmt;
      render();
    });
  });
}

// ── REPORT GENERATION ─────────────────────────────────────────

function nl(n=1){return '\n'.repeat(n);}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):'';}
function list(arr){
  if(!arr||!arr.length) return null;
  if(arr.length===1) return arr[0];
  if(arr.length===2) return arr[0]+' and '+arr[1];
  return arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1];
}

function buildUnit() {
  const parts = [];
  if (S.unitId||S.unitType) parts.push([S.unitId, S.unitType].filter(Boolean).join(' — '));
  if (S.provider1Name||S.provider1Level) parts.push('Crew: '+[S.provider1Name,S.provider1Level].filter(Boolean).join(' ('+(S.provider1Level?')':')')).replace('()',S.provider1Level||''));
  if (S.provider2Name||S.provider2Level) parts.push([S.provider2Name,S.provider2Level].filter(Boolean).join(', '));
  return parts.length ? parts.join('. ')+'.' : null;
}

function buildDispatch() {
  const parts = [];
  if (S.callDate) parts.push('on '+S.callDate);
  if (S.tDispatched&&S.timeDispatched!==undefined) {}
  const tDisp = S.tDispatched ? ' at '+S.tDispatched : '';
  const subMap={Medical:'medicalRef',Trauma:'traumaRef',Alarm:'alarmRef',Assist:'assistRef'};
  if (S.callType) {
    const sub = S[subMap[S.callType]];
    parts.push('dispatched'+tDisp+' for a '+S.callType.toLowerCase()+' call'+(sub?' in reference to '+sub.toLowerCase():''));
  }
  if (S.callNotes) parts.push('dispatch notes indicated: "'+S.callNotes+'"');
  return parts.length ? cap(parts.join(', '))+'.' : null;
}

function buildResponse() {
  const parts = [];
  const times = [];
  if (S.tDispatched) times.push('dispatched at '+S.tDispatched);
  if (S.tEnRoute) times.push('en route at '+S.tEnRoute);
  if (S.tOnScene) times.push('on scene at '+S.tOnScene);
  if (S.tPtContact) times.push('patient contact at '+S.tPtContact);
  if (times.length) parts.push('Unit was '+times.join(', '));
  if (S.responseType) parts.push('responded '+S.responseType.toLowerCase());
  if (S.responseFrom) parts.push('from '+S.responseFrom.toLowerCase());
  const delays = S.responseDelays;
  if (delays&&delays.length&&!delays.includes('None')) parts.push('response delays noted: '+list(delays).toLowerCase());
  if (S.disposition) parts.push(S.disposition.toLowerCase());
  if (S.lawEnforcement) parts.push(S.lawEnforcement.toLowerCase());
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildScene() {
  const parts = [];
  if (S.locationType) parts.push('Unit arrived at a '+S.locationType.toLowerCase());
  const ppl = S.peoplePresent;
  if (ppl&&ppl.length) parts.push(list(ppl)+' were present on scene');
  if (S.sceneSafety) {
    let ss = 'Scene was '+S.sceneSafety.toLowerCase();
    if (S.sceneSafety==='Unsafe'&&S.unsafeReason&&S.unsafeReason.length) ss += ' due to '+list(S.unsafeReason).toLowerCase();
    parts.push(ss);
  }
  const wx = S.weatherFactors;
  if (wx&&wx.length) parts.push('weather conditions were '+list(wx).toLowerCase());
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildPatient() {
  const parts = [];
  const age = S.ptAge; const sex = S.ptSex;
  if (age||sex) parts.push('Patient is a '+[age,sex&&sex.toLowerCase()].filter(Boolean).join(' '));
  if (S.ptPosition) parts.push('found in a '+S.ptPosition.toLowerCase()+' position');
  if (S.avpu) parts.push('AVPU status '+S.avpu);
  const aao = S.aao;
  if (aao&&aao.length) parts.push('alert and oriented to '+list(aao).toLowerCase()+' (AAOx'+aao.length+')');
  if (S.gcsTotal&&S.gcsTotal>0) parts.push('GCS '+S.gcsTotal+'/15');
  if (S.generalImpression) parts.push(S.generalImpression);
  const dis = S.ptDisability;
  if (dis&&dis.length) parts.push('noted disabilities/needs: '+list(dis).toLowerCase());
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildABCs() {
  const parts = [];
  if (S.airway) parts.push('Airway was '+S.airway.toLowerCase());
  const br = [S.breathingPresent, S.breathingRegularity, S.breathingRate, S.breathingDepth, S.breathingEffort].filter(Boolean);
  if (br.length) parts.push('Breathing was '+br.map(b=>b.toLowerCase()).join(', '));
  const sk = [S.skinColor,S.skinTemp,S.skinMoisture].filter(Boolean);
  if (sk.length) parts.push('Skin was '+list(sk).toLowerCase());
  if (S.capRefill) parts.push('Cap refill was '+S.capRefill.toLowerCase());
  const pu = [S.pulseLocation,S.pulseRate,S.pulseRhythm,S.pulseStrength].filter(Boolean);
  if (pu.length) parts.push('Pulse was '+pu.map(p=>p.toLowerCase()).join(', '));
  if (S.bleeding&&S.bleeding!=='None') parts.push('Bleeding was '+S.bleeding.toLowerCase());
  return parts.length ? parts.join('. ')+'.' : null;
}

function buildComplaint() {
  const parts = [];
  if (S.chiefComplaint) parts.push('Patient presented with a chief complaint of '+S.chiefComplaint.toLowerCase());
  if (S.complaintArea&&S.complaintArea!=='General') parts.push('localized to the '+S.complaintArea.toLowerCase());
  if (S.onset) parts.push('onset was '+S.onset.toLowerCase());
  if (S.duration) parts.push('duration '+S.duration);
  if (S.painScale!==undefined&&S.painScale!==null&&S.painScale!=='') parts.push('patient rated pain '+S.painScale+'/10');
  const sym = S.symptoms;
  if (sym) {
    if (sym.affirmed&&sym.affirmed.length) parts.push('patient affirmed '+list(sym.affirmed.map(s=>s.toLowerCase())));
    if (sym.denied&&sym.denied.length) parts.push('patient denied '+list(sym.denied.map(s=>s.toLowerCase())));
  }
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildHistory() {
  const parts = [];
  if (S.pmh&&S.pmh.length) parts.push('Past medical history significant for '+list(S.pmh));
  const allMeds = ['generalMeds','cardiacMeds','diabeticMeds','respMeds','neuroMeds','painMeds'].flatMap(k=>S[k]||[]);
  if (allMeds.length) parts.push('Current medications include '+list(allMeds));
  if (S.allergies&&S.allergies.length) parts.push('Allergies: '+list(S.allergies));
  if (S.lastOralIntake) parts.push('Last oral intake '+S.lastOralIntake);
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildExam() {
  const findings = [];
  const examMap = [
    ['examGeneral','General'],['examSkin','Skin'],['examHead','Head'],['examEyes','Eyes'],
    ['examNeck','Neck'],['examChest','Chest'],['examLungs','Lung sounds'],['examAbdomen','Abdomen'],
    ['examPelvis','Pelvis'],['examBack','Back'],['examUpperExt','Upper extremities'],['examLowerExt','Lower extremities']
  ];
  examMap.forEach(([key,label]) => {
    const vals = S[key];
    if (vals&&vals.length) findings.push(label+': '+list(vals).toLowerCase());
  });
  return findings.length ? 'Physical exam revealed — '+findings.join('; ')+'.' : null;
}

function buildVitals() {
  if (!S.vitals||!S.vitals.length) return null;
  const sets = S.vitals.map((v,i) => {
    const fields = [];
    if (v.HR) fields.push('HR '+v.HR);
    if (v.BP) fields.push('BP '+v.BP);
    if (v.RR) fields.push('RR '+v.RR);
    if (v.SpO2) fields.push('SpO2 '+v.SpO2+'%');
    if (v.BGL) fields.push('BGL '+v.BGL);
    if (v.Temp) fields.push('Temp '+v.Temp);
    if (v.EtCO2) fields.push('EtCO2 '+v.EtCO2);
    if (!fields.length) return null;
    const loc = v.location||'';
    const tm = v.time||'';
    const ctx = [loc,tm].filter(Boolean).join(', ');
    return 'Set '+(i+1)+(ctx?' ('+ctx+')':'')+': '+fields.join(', ');
  }).filter(Boolean);
  return sets.length ? sets.join('\n') : null;
}

function buildProcedures() {
  const parts = [];
  if (S.scenario) parts.push('Call managed as a '+S.scenario.toLowerCase());
  if (S.procedures&&S.procedures.length) parts.push('Procedures performed: '+list(S.procedures).toLowerCase());
  if (S.advancedAssessments&&S.advancedAssessments.length) parts.push('Advanced assessments completed: '+list(S.advancedAssessments).toLowerCase());
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildMeds() {
  if (!S.medsGiven||!S.medsGiven.length) return null;
  const lines = S.medsGiven.map(m => {
    let s = m.name;
    if (m.dose) s += ' '+m.dose;
    if (m.route) s += ' '+m.route;
    if (m.time) s += ' ('+m.time+')';
    if (m.effect) s += ' — '+m.effect.toLowerCase();
    return s;
  });
  return 'Medications administered: '+lines.join('; ')+'.';
}

function buildRefusal() {
  const parts = [];
  if (S.capacityAssessed) parts.push('Capacity assessed: '+S.capacityAssessed.toLowerCase());
  if (S.refusedItems&&S.refusedItems.length) parts.push('Patient refused '+list(S.refusedItems).toLowerCase());
  if (S.refusalType) parts.push(S.refusalType);
  if (S.risksExplained) parts.push('Risks explained to patient: '+S.risksExplained.toLowerCase());
  if (S.advisedCallBack) parts.push('Patient advised to call back if symptoms worsen: '+S.advisedCallBack.toLowerCase());
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildTransport() {
  const parts = [];
  if (S.tDeparture) parts.push('Unit departed scene at '+S.tDeparture);
  if (S.ptMove) parts.push('Patient was moved via '+S.ptMove.toLowerCase());
  if (S.transportUnit) parts.push('transported by '+S.transportUnit.toLowerCase());
  if (S.destinationType) {
    let dest = 'to '+S.destinationType;
    if (S.destinationName) dest += ' ('+S.destinationName+')';
    if (S.destinationReason) dest += ', '+S.destinationReason.toLowerCase();
    parts.push(dest);
  }
  if (S.ptBelongings&&S.ptBelongings.length) parts.push('Patient belongings accompanied: '+list(S.ptBelongings).toLowerCase());
  const riders = S.additionalRiders;
  if (riders&&riders.length) parts.push('Additional riders: '+list(riders).toLowerCase());
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

function buildTransfer() {
  const parts = [];
  if (S.tArrivalFac) parts.push('Arrived at facility at '+S.tArrivalFac);
  if (S.transferType) parts.push('Care transferred via '+S.transferType.toLowerCase());
  if (S.receivingPerson) parts.push('to '+S.receivingPerson.toLowerCase());
  if (S.receivingFacility) parts.push('facility '+S.receivingFacility.toLowerCase());
  if (S.tBackInSvc) parts.push('Unit back in service at '+S.tBackInSvc);
  return parts.length ? parts.map(cap).join('. ')+'.' : null;
}

// ── FORMAT: CHART ─────────────────────────────────────────────
function formatChart() {
  const sections = [
    {label:'Unit & Crew',  body: buildUnit()},
    {label:'Dispatch',     body: buildDispatch()},
    {label:'Response',     body: buildResponse()},
    {label:'Scene',        body: buildScene()},
    {label:'Patient',      body: buildPatient()},
    {label:'ABCs',         body: buildABCs()},
    {label:'Complaint',    body: buildComplaint()},
    {label:'History',      body: buildHistory()},
    {label:'Physical Exam',body: buildExam()},
    {label:'Procedures',   body: buildProcedures()},
    {label:'Vitals',       body: buildVitals()},
    {label:'Medications',  body: buildMeds()},
    {label:'Refusal',      body: buildRefusal()},
    {label:'Transportation',body:buildTransport()},
    {label:'Transfer of Care',body:buildTransfer()},
  ].filter(s=>s.body);

  if (!sections.length) return '';
  return sections.map(s => '[ '+s.label.toUpperCase()+' ]\n'+s.body).join('\n\n');
}

// ── FORMAT: SOAP ──────────────────────────────────────────────
function formatSOAP() {
  const S_text = [buildComplaint(), buildHistory()].filter(Boolean).join('\n');
  const O_text = [buildPatient(), buildABCs(), buildExam(), buildVitals()].filter(Boolean).join('\n');
  const A_text = S.chiefComplaint ? cap(S.chiefComplaint)+(S.ptAge?' in a '+S.ptAge:'')+(S.ptSex?', '+S.ptSex.toLowerCase():'')+'.' : null;
  const P_text = [buildProcedures(), buildMeds(), buildRefusal(), buildTransport(), buildTransfer()].filter(Boolean).join('\n');

  const blocks = [];
  if (S_text) blocks.push('SUBJECTIVE\n'+S_text);
  if (O_text) blocks.push('OBJECTIVE\n'+O_text);
  if (A_text) blocks.push('ASSESSMENT\n'+A_text);
  if (P_text) blocks.push('PLAN\n'+P_text);
  return blocks.join('\n\n');
}

// ── FORMAT: CHRONOLOGICAL ─────────────────────────────────────
function formatChronological() {
  const events = [];

  const disp = buildDispatch();
  if (disp) events.push(disp);

  const resp = buildResponse();
  if (resp) events.push(resp);

  const scene = buildScene();
  if (scene) events.push(scene);

  const pt = buildPatient();
  const abc = buildABCs();
  const cc = buildComplaint();
  const hx = buildHistory();
  const exam = buildExam();
  const ptBlock = [pt,abc,cc,hx,exam].filter(Boolean).join(' ');
  if (ptBlock) events.push('Upon making patient contact: '+ptBlock);

  if (S.vitals&&S.vitals.length) {
    const vit = buildVitals();
    if (vit) events.push('Vital signs obtained — '+vit);
  }

  const proc = buildProcedures();
  const meds = buildMeds();
  if (proc||meds) events.push([proc,meds].filter(Boolean).join(' '));

  const ref = buildRefusal();
  if (ref) events.push(ref);

  const trans = buildTransport();
  if (trans) events.push(trans);

  const xfer = buildTransfer();
  if (xfer) events.push(xfer);

  return events.join('\n\n');
}

// ── RENDER ────────────────────────────────────────────────────
function render() {
  let text = '';
  if (reportFormat==='chart') text = formatChart();
  else if (reportFormat==='soap') text = formatSOAP();
  else text = formatChronological();

  const el = document.getElementById('preview-text');
  const meta = document.getElementById('preview-meta');
  if (!el) return;

  if (text.trim()) {
    el.textContent = text;
    el.style.color = '';
    if (meta) meta.textContent = text.replace(/\n/g,' ').replace(/\s+/g,' ').split(' ').filter(Boolean).length+' words · '+text.length+' chars';
  } else {
    el.textContent = 'Start filling out sections — your narrative will appear here.';
    el.style.color = 'var(--text3)';
    if (meta) meta.textContent = '';
  }
}

// ── COPY / CLEAR ──────────────────────────────────────────────
function initCopyAndClear() {
  const cp = document.getElementById('btn-copy');
  if (cp) cp.addEventListener('click', () => {
    const t = document.getElementById('preview-text').textContent;
    navigator.clipboard.writeText(t).then(()=>{
      cp.textContent='Copied!';
      setTimeout(()=>cp.textContent='Copy Narrative',1800);
    });
  });
  const cl = document.getElementById('btn-clear');
  if (cl) cl.addEventListener('click', ()=>{ if(confirm('Clear all data and start over?')) location.reload(); });
}

// ── BOOT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildTimesGrid();
  initChips();
  initInputs();
  initPain();
  initGCS();
  initVitals();
  initMedChips();
  initScrollSpy();
  initFormatToggle();
  initCopyAndClear();
  render();
});

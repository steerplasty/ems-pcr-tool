// EMS PCR TOOL — Main App Logic

const state = {};
let currentSection = 0;

const SECTIONS = [
  'unit-crew','dispatch','response','scene',
  'patient-impression','abcs','complaint','history',
  'head-to-toe','scenario-procedures','vitals',
  'medications','refusal','transportation','transfer'
];

function goToSection(index) {
  if (index < 0 || index >= SECTIONS.length) return;
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('section-' + SECTIONS[index]);
  if (panel) panel.classList.add('active');
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[index]) navItems[index].classList.add('active');
  currentSection = index;
  updateProgress();
  updatePreview();
  document.getElementById('main-content').scrollTop = 0;
}

function updateProgress() {
  const pct = ((currentSection + 1) / SECTIONS.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
}

function initChips() {
  document.querySelectorAll('.chip[data-key]').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.key;
      const val = chip.dataset.val;
      const mode = chip.dataset.mode || 'single';
      if (mode === 'symptom') {
        if (!chip.classList.contains('affirmed') && !chip.classList.contains('denied')) {
          chip.classList.add('affirmed');
          setSymptom(key, val, 'affirmed');
        } else if (chip.classList.contains('affirmed')) {
          chip.classList.remove('affirmed'); chip.classList.add('denied');
          setSymptom(key, val, 'denied');
        } else {
          chip.classList.remove('denied');
          removeSymptom(key, val);
        }
        updatePreview(); return;
      }
      if (mode === 'multi') {
        chip.classList.toggle('selected');
        if (chip.classList.contains('selected')) addVal(key, val); else removeVal(key, val);
      } else {
        document.querySelectorAll('.chip[data-key="' + key + '"]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        state[key] = val;
        handleConditionals(key, val);
      }
      updatePreview();
    });
  });
}

function addVal(key, val) {
  if (!state[key]) state[key] = [];
  if (!state[key].includes(val)) state[key].push(val);
}
function removeVal(key, val) {
  if (!state[key]) return;
  state[key] = state[key].filter(v => v !== val);
}
function setSymptom(key, val, type) {
  if (!state[key]) state[key] = { affirmed: [], denied: [] };
  state[key].affirmed = state[key].affirmed.filter(v => v !== val);
  state[key].denied = state[key].denied.filter(v => v !== val);
  state[key][type].push(val);
}
function removeSymptom(key, val) {
  if (!state[key]) return;
  state[key].affirmed = state[key].affirmed.filter(v => v !== val);
  state[key].denied = state[key].denied.filter(v => v !== val);
}

function handleConditionals(key, val) {
  if (key === 'callType') {
    ['medical','trauma','alarm','assist'].forEach(t => {
      const el = document.getElementById('cond-' + t);
      if (el) el.classList.toggle('visible', val.toLowerCase() === t);
    });
  }
  if (key === 'sceneSafety') {
    const el = document.getElementById('cond-unsafe');
    if (el) el.classList.toggle('visible', val === 'Unsafe');
  }
}

function initInputs() {
  document.querySelectorAll('[data-state]').forEach(el => {
    el.addEventListener('input', () => { state[el.dataset.state] = el.value; updatePreview(); });
    el.addEventListener('change', () => { state[el.dataset.state] = el.value; updatePreview(); });
  });
  const todayBtn = document.getElementById('btn-today');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const d = document.getElementById('input-date');
      if (d) { d.value = new Date().toISOString().split('T')[0]; state['callDate'] = d.value; updatePreview(); }
    });
  }
}

function initPainScale() {
  document.querySelectorAll('.pain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pain-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state['painScale'] = btn.dataset.val;
      updatePreview();
    });
  });
}

function initGCS() {
  ['gcs-eye','gcs-verbal','gcs-motor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        state[id] = parseInt(el.value) || 0;
        const total = (state['gcs-eye']||0) + (state['gcs-verbal']||0) + (state['gcs-motor']||0);
        const t = document.getElementById('gcs-total');
        if (t) t.textContent = total || '--';
        state['gcsTotal'] = total;
        updatePreview();
      });
    }
  });
}

function addVitalsRow() {
  const tbody = document.getElementById('vitals-tbody');
  const row = document.createElement('tr');
  row.innerHTML = `<td><select><option>On Scene</option><option>In Ambulance</option><option>En Route</option></select></td><td><input type="text" placeholder="--" maxlength="6"></td><td><input type="text" placeholder="---/--" maxlength="7"></td><td><input type="text" placeholder="--" maxlength="4"></td><td><input type="text" placeholder="--" maxlength="4"></td><td><input type="text" placeholder="---" maxlength="5"></td><td><input type="text" placeholder="--" maxlength="5"></td><td><input type="text" placeholder="--" maxlength="5"></td><td><input type="text" placeholder="--" maxlength="5"></td><td><input type="time"></td>`;
  tbody.appendChild(row);
  row.querySelectorAll('input, select').forEach(el => { el.addEventListener('input', collectVitals); el.addEventListener('change', collectVitals); });
}

function collectVitals() {
  const rows = document.querySelectorAll('#vitals-tbody tr');
  state['vitals'] = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('input, select');
    if (cells.length >= 9) {
      state['vitals'].push({ location: cells[0].value, hr: cells[1].value, bp: cells[2].value, rr: cells[3].value, spo2: cells[4].value, bgl: cells[5].value, temp: cells[6].value, etco2: cells[7].value, spco: cells[8].value, time: cells[9] ? cells[9].value : '' });
    }
  });
  updatePreview();
}

function initVitals() {
  const addBtn = document.getElementById('btn-add-vitals');
  if (addBtn) addBtn.addEventListener('click', addVitalsRow);
  const tbody = document.getElementById('vitals-tbody');
  if (tbody) tbody.querySelectorAll('input, select').forEach(el => { el.addEventListener('input', collectVitals); el.addEventListener('change', collectVitals); });
}

function updatePreview() {
  const report = generateReport();
  const el = document.getElementById('preview-text');
  if (!el) return;
  if (report.trim()) { el.textContent = report; el.style.color = ''; }
  else { el.textContent = 'Start filling out sections to see your narrative here...'; el.style.color = 'var(--text3)'; }
}

function generateReport() {
  const lines = [];

  if (state['unitId'] || state['unitType']) {
    let u = 'UNIT: ' + [state['unitId'], state['unitType']].filter(Boolean).join(' — ');
    if (state['provider1Name'] || state['provider1Level']) u += '. Provider 1: ' + [state['provider1Name'], state['provider1Level']].filter(Boolean).join(', ');
    if (state['provider2Name'] || state['provider2Level']) u += '. Provider 2: ' + [state['provider2Name'], state['provider2Level']].filter(Boolean).join(', ');
    lines.push(u + '.');
  }

  const dp = [];
  if (state['callDate']) dp.push('Date: ' + state['callDate']);
  if (state['callTime']) dp.push('time of call ' + state['callTime']);
  if (state['callType']) {
    const subMap = { Medical: 'medicalRef', Trauma: 'traumaRef', Alarm: 'alarmRef', Assist: 'assistRef' };
    let ct = 'dispatched for a ' + state['callType'] + ' call';
    const sub = state[subMap[state['callType']]];
    if (sub) ct += ' in reference to ' + sub;
    dp.push(ct);
  }
  if (state['callNotes']) dp.push('dispatch notes: ' + state['callNotes']);
  if (dp.length) lines.push('DISPATCH: ' + dp.join('. ') + '.');

  const rp = [];
  if (state['timeDispatched']) rp.push('dispatched at ' + state['timeDispatched']);
  if (state['timeEnRoute']) rp.push('en route at ' + state['timeEnRoute']);
  if (state['timeOnScene']) rp.push('on scene at ' + state['timeOnScene']);
  if (state['timePtContact']) rp.push('patient contact at ' + state['timePtContact']);
  if (state['responseType']) rp.push('responded ' + state['responseType'].toLowerCase());
  if (state['responseFrom']) rp.push('from ' + state['responseFrom']);
  if (state['responseDelays'] && state['responseDelays'].length) rp.push('delays: ' + state['responseDelays'].join(', '));
  if (rp.length) lines.push('RESPONSE: ' + rp.join('. ') + '.');

  const sp = [];
  if (state['locationType']) sp.push('arrived at a ' + state['locationType']);
  if (state['weatherFactors'] && state['weatherFactors'].length) sp.push('weather conditions: ' + state['weatherFactors'].join(', '));
  if (state['sceneSafety']) {
    let ss = 'scene was ' + state['sceneSafety'].toLowerCase();
    if (state['sceneSafety'] === 'Unsafe' && state['unsafeReason'] && state['unsafeReason'].length) ss += ' due to ' + state['unsafeReason'].join(', ');
    sp.push(ss);
  }
  if (state['peoplePresent'] && state['peoplePresent'].length) sp.push('persons present: ' + state['peoplePresent'].join(', '));
  if (sp.length) lines.push('SCENE: ' + sp.join('. ') + '.');

  const pp = [];
  const ageSex = [state['ptAge'], state['ptSex']].filter(Boolean);
  if (ageSex.length) pp.push('patient is a ' + ageSex.join(' '));
  if (state['ptPosition']) pp.push('found ' + state['ptPosition'].toLowerCase());
  if (state['avpu']) pp.push('AVPU: ' + state['avpu']);
  if (state['aao'] && state['aao'].length) pp.push('AAOx' + state['aao'].length + ' (' + state['aao'].join(', ') + ')');
  if (state['gcsTotal']) pp.push('GCS ' + state['gcsTotal'] + '/15');
  if (state['generalImpression']) pp.push('general impression: ' + state['generalImpression']);
  if (pp.length) lines.push('PATIENT: ' + pp.join('. ') + '.');

  const ap = [];
  if (state['airway']) ap.push('airway ' + state['airway'].toLowerCase());
  const br = [state['breathingPresent'], state['breathingRegularity'], state['breathingRate'], state['breathingDepth'], state['breathingEffort']].filter(Boolean);
  if (br.length) ap.push('breathing: ' + br.join(', ').toLowerCase());
  const sk = [state['skinColor'], state['skinTemp'], state['skinMoisture']].filter(Boolean);
  if (sk.length) ap.push('skin: ' + sk.join(', ').toLowerCase());
  if (state['capRefill']) ap.push('cap refill ' + state['capRefill'].toLowerCase());
  const pu = [state['pulseLocation'], state['pulseRate'], state['pulseRhythm'], state['pulseStrength']].filter(Boolean);
  if (pu.length) ap.push('pulse: ' + pu.join(', ').toLowerCase());
  if (state['bleeding']) ap.push('bleeding: ' + state['bleeding'].toLowerCase());
  if (ap.length) lines.push('ABCs: ' + ap.join('. ') + '.');

  const cp = [];
  if (state['chiefComplaint']) cp.push('chief complaint of ' + state['chiefComplaint'].toLowerCase());
  if (state['complaintArea']) cp.push('area: ' + state['complaintArea'].toLowerCase());
  if (state['onset']) cp.push('onset: ' + state['onset'].toLowerCase());
  if (state['duration']) cp.push('duration: ' + state['duration']);
  if (state['painScale'] !== undefined) cp.push('pain ' + state['painScale'] + '/10');
  if (state['symptoms']) {
    if (state['symptoms'].affirmed && state['symptoms'].affirmed.length) cp.push('affirms: ' + state['symptoms'].affirmed.join(', ').toLowerCase());
    if (state['symptoms'].denied && state['symptoms'].denied.length) cp.push('denies: ' + state['symptoms'].denied.join(', ').toLowerCase());
  }
  if (cp.length) lines.push('COMPLAINT: ' + cp.join('. ') + '.');

  const hp = [];
  if (state['pmh'] && state['pmh'].length) hp.push('PMH: ' + state['pmh'].join(', '));
  const allMeds = ['generalMeds','cardiacMeds','diabeticMeds','respMeds','neuroMeds','painMeds'].flatMap(k => state[k] || []);
  if (allMeds.length) hp.push('medications: ' + allMeds.join(', '));
  if (state['allergies'] && state['allergies'].length) hp.push('allergies: ' + state['allergies'].join(', '));
  if (state['lastOralIntake']) hp.push('last oral intake: ' + state['lastOralIntake']);
  if (hp.length) lines.push('HISTORY: ' + hp.join('. ') + '.');

  if (state['vitals'] && state['vitals'].length) {
    const vl = state['vitals'].map((v, i) => {
      const vp = [];
      if (v.hr) vp.push('HR ' + v.hr);
      if (v.bp) vp.push('BP ' + v.bp);
      if (v.rr) vp.push('RR ' + v.rr);
      if (v.spo2) vp.push('SpO2 ' + v.spo2 + '%');
      if (v.bgl) vp.push('BGL ' + v.bgl);
      if (v.temp) vp.push('Temp ' + v.temp);
      if (v.etco2) vp.push('EtCO2 ' + v.etco2);
      if (vp.length) return 'Set ' + (i+1) + ' (' + (v.location||'') + (v.time ? ' @ ' + v.time : '') + '): ' + vp.join(', ');
      return null;
    }).filter(Boolean);
    if (vl.length) lines.push('VITALS:\n' + vl.join('\n'));
  }

  const tp = [];
  if (state['timeDeparture']) tp.push('departed scene at ' + state['timeDeparture']);
  if (state['ptMove']) tp.push('patient moved via ' + state['ptMove'].toLowerCase());
  if (state['transportUnit']) tp.push('transported by ' + state['transportUnit'].toLowerCase());
  if (state['destinationType']) tp.push('destination: ' + state['destinationType']);
  if (state['destinationName']) tp.push('(' + state['destinationName'] + ')');
  if (tp.length) lines.push('TRANSPORT: ' + tp.join('. ') + '.');

  const xp = [];
  if (state['timeArrivalFacility']) xp.push('arrived at facility ' + state['timeArrivalFacility']);
  if (state['transferType']) xp.push('care transferred via ' + state['transferType'].toLowerCase());
  if (state['receivingPerson']) xp.push('to ' + state['receivingPerson'].toLowerCase());
  if (state['timeBackInService']) xp.push('unit back in service ' + state['timeBackInService']);
  if (xp.length) lines.push('TRANSFER OF CARE: ' + xp.join('. ') + '.');

  return lines.join('\n\n');
}

function initCopyAndClear() {
  const copyBtn = document.getElementById('btn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('preview-text').textContent;
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Narrative'; }, 1800);
      });
    });
  }
  const clearBtn = document.getElementById('btn-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => { if (confirm('Clear all data and start over?')) location.reload(); });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initChips();
  initInputs();
  initPainScale();
  initGCS();
  initVitals();
  initCopyAndClear();
  document.querySelectorAll('.nav-item').forEach((item, i) => { item.addEventListener('click', () => goToSection(i)); });
  document.querySelectorAll('.btn-next').forEach(btn => { btn.addEventListener('click', () => goToSection(currentSection + 1)); });
  document.querySelectorAll('.btn-prev').forEach(btn => { btn.addEventListener('click', () => goToSection(currentSection - 1)); });
  goToSection(0);
  updatePreview();
});
